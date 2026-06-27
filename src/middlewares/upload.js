const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ─── Product image storage ───────────────────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/products');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // e.g. product-1704067200000-iphone.jpg
    const uniqueName = `product-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase())
    && allowed.test(file.mimetype);
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ─── CSV bulk upload storage ─────────────────────────────────────────────────
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/bulk');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `bulk-${Date.now()}.csv`);
  },
});

const csvFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed for bulk upload'), false);
  }
};

const uploadCsv = multer({
  storage: csvStorage,
  fileFilter: csvFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for bulk
});

module.exports = { uploadImage, uploadCsv };
