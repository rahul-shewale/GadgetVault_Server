const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Product, Category } = require('../models');

// ─── Get products (paginated, sortable, searchable) ───────────────────────────
const getProducts = async (req, res) => {
  try {
    // Query params with defaults
    const page      = Math.max(1, parseInt(req.query.page)  || 1);
    const limit     = Math.min(100, parseInt(req.query.limit) || 10);
    const offset    = (page - 1) * limit;
    const sortBy    = ['price', 'name', 'created_at'].includes(req.query.sortBy)
                        ? req.query.sortBy : 'created_at';
    const order     = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const search    = req.query.search ? req.query.search.trim() : null;
    const category  = req.query.category ? req.query.category.trim() : null;

    // Build WHERE clause for products
    const productWhere = {};
    if (search) {
      productWhere.name = { [Op.like]: `%${search}%` };
    }

    // Build WHERE clause for category (join filter)
    const categoryWhere = {};
    if (category) {
      categoryWhere.name = { [Op.like]: `%${category}%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where: productWhere,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['unique_id', 'name'],
        where: Object.keys(categoryWhere).length ? categoryWhere : undefined,
        required: Object.keys(categoryWhere).length > 0, // INNER JOIN only if filtering by category
      }],
      order: [[sortBy, order]],
      limit,
      offset,
      distinct: true, // needed for accurate count with includes
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      filters: { search, category, sortBy, order },
    });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Get product by unique_id ─────────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { unique_id: req.params.id },
      include: [{ model: Category, as: 'category', attributes: ['unique_id', 'name'] }],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Create product ───────────────────────────────────────────────────────────
const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, price, category_unique_id } = req.body;

    // Look up category by its unique_id
    const category = await Category.findOne({ where: { unique_id: category_unique_id } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const imagePath = req.file
      ? `/uploads/products/${req.file.filename}`
      : null;

    const product = await Product.create({
      name,
      price: parseFloat(price),
      image: imagePath,
      category_id: category.id,
    });

    const result = await Product.findOne({
      where: { id: product.id },
      include: [{ model: Category, as: 'category', attributes: ['unique_id', 'name'] }],
    });

    return res.status(201).json({ success: true, message: 'Product created', data: result });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Update product ───────────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const product = await Product.findOne({ where: { unique_id: req.params.id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, price, category_unique_id } = req.body;

    if (name) product.name = name;
    if (price) product.price = parseFloat(price);

    if (category_unique_id) {
      const category = await Category.findOne({ where: { unique_id: category_unique_id } });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      product.category_id = category.id;
    }

    if (req.file) {
      // Delete old image if it exists
      if (product.image) {
        const oldPath = path.join(__dirname, '..', product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      product.image = `/uploads/products/${req.file.filename}`;
    }

    await product.save();

    const result = await Product.findOne({
      where: { id: product.id },
      include: [{ model: Category, as: 'category', attributes: ['unique_id', 'name'] }],
    });

    return res.status(200).json({ success: true, message: 'Product updated', data: result });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Delete product ───────────────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ where: { unique_id: req.params.id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete product image from disk
    if (product.image) {
      const imgPath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await product.destroy();
    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
