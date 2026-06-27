const express = require('express');
const { body } = require('express-validator');
const {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const authMiddleware = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');

const router = express.Router();

const createRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_unique_id').notEmpty().withMessage('Category is required'),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_unique_id').optional().notEmpty(),
];

// Public: list and get single
router.get('/',    getProducts);
router.get('/:id', getProductById);

// Protected: create, update, delete (with image upload)
router.post('/',
  authMiddleware,
  uploadImage.single('image'),  // field name must be "image" in form-data
  createRules,
  createProduct
);

router.put('/:id',
  authMiddleware,
  uploadImage.single('image'),
  updateRules,
  updateProduct
);

router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;
