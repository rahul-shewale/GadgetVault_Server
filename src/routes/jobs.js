const express = require('express');
const { triggerBulkUpload, triggerReport, getJobStatus, downloadReport } = require('../controllers/jobController');
const authMiddleware = require('../middlewares/auth');
const { uploadCsv } = require('../middlewares/upload');

const router = express.Router();

// All job routes require auth
router.use(authMiddleware);

// Bulk upload: POST with CSV file in form-data field "file"
router.post('/bulk-upload', uploadCsv.single('file'), triggerBulkUpload);

// Report generation: POST /api/jobs/report?format=csv or ?format=xlsx
// Optional filters: ?search=iphone&category=Smartphones
router.post('/report', triggerReport);

// Poll job status
router.get('/:id', getJobStatus);

// Download completed report
router.get('/:id/download', downloadReport);

module.exports = router;
