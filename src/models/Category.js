const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // unique_id is the UUID exposed to clients — never expose internal id
  unique_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
    defaultValue: () => uuidv4(),
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Category name cannot be empty' },
      len: { args: [2, 255], msg: 'Name must be between 2 and 255 characters' },
    },
  },
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Auto-generate UUID before creating
Category.beforeCreate((category) => {
  category.unique_id = uuidv4();
});

module.exports = Category;