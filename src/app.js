require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

// Route imports
const authRoutes     = require('./routes/auth');
const userRoutes     = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const productRoutes  = require('./routes/products');
const jobRoutes      = require('./routes/jobs');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:4200', // Angular dev server
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
// e.g. GET http://localhost:3000/uploads/products/product-123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/jobs',       jobRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'GadgetVault API is running 🚀' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Multer errors (file type, size)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large' });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('MySQL connected');
    app.listen(PORT, () => {
      console.log(`GadgetVault API running on http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
