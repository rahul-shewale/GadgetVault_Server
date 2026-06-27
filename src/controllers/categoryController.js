const { validationResult } = require('express-validator');
const { Category, Product } = require('../models');

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['created_at', 'DESC']],
      attributes: {
        include: [
          [
            Category.sequelize.literal(
              '(SELECT COUNT(*) FROM products WHERE products.category_id = Category.id)'
            ),
            'product_count',
          ],
        ],
      },
    });

    return res.status(200).json({ success: true, data: categories });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get category by unique_id 
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { unique_id: req.params.id },
      include: [{ model: Product, as: 'products' }],
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create category
const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name } = req.body;

    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category name already exists' });
    }

    const category = await Category.create({ name });

    return res.status(201).json({
      success: true,
      message: 'Category created',
      data: category,
    });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update category
const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const category = await Category.findOne({ where: { unique_id: req.params.id } });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name } = req.body;

    // Check name uniqueness (excluding current record)
    if (name && name !== category.name) {
      const existing = await Category.findOne({ where: { name } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Category name already exists' });
      }
    }

    if (name) category.name = name;
    await category.save();

    return res.status(200).json({ success: true, message: 'Category updated', data: category });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ where: { unique_id: req.params.id } });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Prevent deleting a category that has products
    const productCount = await Product.count({ where: { category_id: category.id } });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} product(s). Reassign or delete them first.`,
      });
    }

    await category.destroy();
    return res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
