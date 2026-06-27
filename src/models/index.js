const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Job = require('./Job');

// Associations
// A category has many products
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
// A product belongs to one category
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

module.exports = { sequelize, User, Category, Product, Job };
