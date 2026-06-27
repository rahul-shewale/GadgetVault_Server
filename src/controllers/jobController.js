const { Queue } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { Job } = require('../models');
const redisConnection = require('../config/redis');

const bulkQueue   = new Queue('bulk-upload', { connection: redisConnection });
const reportQueue = new Queue('report-generation', { connection: redisConnection });

// ─── Trigger bulk upload ──────────────────────────────────────────────────────
// The CSV file is already saved to disk by multer.
// We create a job record, push it to BullMQ, and return immediately.
// The worker processes it in the background — no 504 risk.
const triggerBulkUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'CSV file is required' });
  }

  try {
    const jobId = uuidv4();

    // Create DB job record
    await Job.create({
      id: jobId,
      type: 'bulk_upload',
      status: 'pending',
    });

    // Push to BullMQ queue — worker will pick this up
    await bulkQueue.add('process-csv', {
      jobId,
      filePath: req.file.path,
    });

    return res.status(202).json({
      success: true,
      message: 'Bulk upload queued. Poll /api/jobs/:id for status.',
      data: { jobId },
    });
  } catch (err) {
    console.error('Bulk upload trigger error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Trigger report generation ────────────────────────────────────────────────
const triggerReport = async (req, res) => {
  try {
    const jobId = uuidv4();
    const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';

    await Job.create({
      id: jobId,
      type: 'report',
      status: 'pending',
    });

    // Pass any filters from query to the worker
    await reportQueue.add('generate-report', {
      jobId,
      format,
      filters: {
        search: req.query.search || null,
        category: req.query.category || null,
      },
    });

    return res.status(202).json({
      success: true,
      message: 'Report generation queued. Poll /api/jobs/:id for status.',
      data: { jobId },
    });
  } catch (err) {
    console.error('Report trigger error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Get job status ───────────────────────────────────────────────────────────
const getJobStatus = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const response = {
      success: true,
      data: {
        jobId: job.id,
        type: job.type,
        status: job.status,
        total_rows: job.total_rows,
        processed_rows: job.processed_rows,
        created_at: job.created_at,
      },
    };

    // If report is done, include download URL
    if (job.status === 'done' && job.result_path) {
      response.data.download_url = `/api/jobs/${job.id}/download`;
    }

    if (job.status === 'failed') {
      response.data.error = job.error;
    }

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Download report file ─────────────────────────────────────────────────────
const downloadReport = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job || job.type !== 'report') {
      return res.status(404).json({ success: false, message: 'Report job not found' });
    }
    if (job.status !== 'done') {
      return res.status(400).json({ success: false, message: `Report not ready. Status: ${job.status}` });
    }

    const filePath = path.resolve(job.result_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on disk' });
    }

    return res.download(filePath);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { triggerBulkUpload, triggerReport, getJobStatus, downloadReport };
