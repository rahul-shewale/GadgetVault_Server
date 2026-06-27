const express = require('express');
const { body } = require('express-validator');
const {
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

const nameRule = [body('name').trim().notEmpty().withMessage('Category name is required')];

// Public: list and get single
router.get('/',    getAllCategories);
router.get('/:id', getCategoryById);

// Protected: create, update, delete
router.post('/',    authMiddleware, nameRule, createCategory);
router.put('/:id',  authMiddleware, nameRule, updateCategory);
router.delete('/:id', authMiddleware,         deleteCategory);

module.exports = router;
