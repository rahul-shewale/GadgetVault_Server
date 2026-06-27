const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  unique_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
    defaultValue: () => uuidv4(),
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product name cannot be empty' },
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: { args: [0], msg: 'Price must be a positive number' },
    },
  },
  // Stores relative path: /uploads/products/filename.jpg
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // FK to categories.id (internal PK, not unique_id)
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Product.beforeCreate((product) => {
  product.unique_id = uuidv4();
});

module.exports = Product;