const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('bulk_upload', 'report'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'done', 'failed'),
    defaultValue: 'pending',
  },
  // Total rows for bulk upload (for progress tracking)
  total_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  processed_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Path to generated report file when done
  result_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // Error message if failed
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Job.beforeCreate((job) => {
  if (!job.id) job.id = uuidv4();
});

module.exports = Job;
