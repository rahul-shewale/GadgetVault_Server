/**
 * jobWorker.js
 * Run this separately: npm run worker
 * This process listens to BullMQ queues and processes heavy jobs
 * without blocking the HTTP server.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Op } = require('sequelize');

const redisConnection = require('../config/redis');
const { sequelize, Job, Product, Category } = require('../models');

// ─── Bulk Upload Worker ───────────────────────────────────────────────────────
const bulkUploadWorker = new Worker('bulk-upload', async (bullJob) => {
  const { jobId, filePath } = bullJob.data;

  console.log(`[BulkWorker] Starting job ${jobId}`);

  // Update job status to processing
  await Job.update({ status: 'processing' }, { where: { id: jobId } });

  const rows = [];

  // Step 1: Read entire CSV into memory
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  await Job.update({ total_rows: rows.length }, { where: { id: jobId } });
  console.log(`[BulkWorker] ${rows.length} rows found in CSV`);

  // Step 2: Process rows in batches of 100
  // Expected CSV columns: name, price, category_name
  const BATCH_SIZE = 100;
  let processed = 0;
  const errors = [];

  // Cache categories to avoid repeated DB lookups
  const categoryCache = {};
  const allCategories = await Category.findAll();
  allCategories.forEach((c) => { categoryCache[c.name.toLowerCase()] = c; });

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const toInsert = [];

    for (const row of batch) {
      const name = row.name?.trim();
      const price = parseFloat(row.price);
      const categoryName = row.category_name?.trim();

      if (!name || isNaN(price) || !categoryName) {
        errors.push(`Row ${i + 1}: missing name, price, or category_name`);
        continue;
      }

      const category = categoryCache[categoryName.toLowerCase()];
      if (!category) {
        errors.push(`Row ${i + 1}: category "${categoryName}" not found`);
        continue;
      }

      toInsert.push({
        name,
        price,
        category_id: category.id,
        unique_id: require('uuid').v4(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (toInsert.length > 0) {
      // bulkCreate is much faster than individual inserts
      await Product.bulkCreate(toInsert, { ignoreDuplicates: true });
    }

    processed += batch.length;
    await Job.update({ processed_rows: processed }, { where: { id: jobId } });
    console.log(`[BulkWorker] Processed ${processed}/${rows.length}`);
  }

  // Step 3: Clean up uploaded CSV file
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  const finalStatus = errors.length === rows.length ? 'failed' : 'done';
  await Job.update({
    status: finalStatus,
    processed_rows: processed,
    error: errors.length > 0 ? errors.slice(0, 10).join('\n') : null,
  }, { where: { id: jobId } });

  console.log(`[BulkWorker] Job ${jobId} completed with status: ${finalStatus}`);
}, { connection: redisConnection });

// ─── Report Generation Worker ─────────────────────────────────────────────────
const reportWorker = new Worker('report-generation', async (bullJob) => {
  const { jobId, format, filters } = bullJob.data;

  console.log(`[ReportWorker] Starting job ${jobId}, format: ${format}`);
  await Job.update({ status: 'processing' }, { where: { id: jobId } });

  // Build query with optional filters
  const productWhere = {};
  const categoryWhere = {};

  if (filters?.search) {
    productWhere.name = { [Op.like]: `%${filters.search}%` };
  }
  if (filters?.category) {
    categoryWhere.name = { [Op.like]: `%${filters.category}%` };
  }

  const products = await Product.findAll({
    where: productWhere,
    include: [{
      model: Category,
      as: 'category',
      attributes: ['name'],
      where: Object.keys(categoryWhere).length ? categoryWhere : undefined,
      required: Object.keys(categoryWhere).length > 0,
    }],
    order: [['created_at', 'DESC']],
  });

  // Build flat data array for export
  const data = products.map((p) => ({
    UniqueID: p.unique_id,
    Name: p.name,
    Price: parseFloat(p.price),
    Category: p.category?.name || '',
    Image: p.image || '',
    CreatedAt: p.created_at,
  }));

  const reportsDir = path.join(__dirname, '../uploads/reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const filename = `gadgetvault-report-${Date.now()}.${format}`;
  const filePath = path.join(reportsDir, filename);

  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, filePath);
  } else {
    // CSV: manual write
    const headers = Object.keys(data[0] || {}).join(',');
    const csvRows = data.map((row) =>
      Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    fs.writeFileSync(filePath, [headers, ...csvRows].join('\n'));
  }

  await Job.update({
    status: 'done',
    result_path: filePath,
  }, { where: { id: jobId } });

  console.log(`[ReportWorker] Job ${jobId} done. File: ${filePath}`);
}, { connection: redisConnection });

// ─── Error handlers ───────────────────────────────────────────────────────────
bulkUploadWorker.on('failed', async (bullJob, err) => {
  console.error(`[BulkWorker] BullMQ job failed:`, err.message);
  if (bullJob?.data?.jobId) {
    await Job.update({ status: 'failed', error: err.message }, { where: { id: bullJob.data.jobId } });
  }
});

reportWorker.on('failed', async (bullJob, err) => {
  console.error(`[ReportWorker] BullMQ job failed:`, err.message);
  if (bullJob?.data?.jobId) {
    await Job.update({ status: 'failed', error: err.message }, { where: { id: bullJob.data.jobId } });
  }
});

console.log('GadgetVault workers running. Listening for jobs...');
