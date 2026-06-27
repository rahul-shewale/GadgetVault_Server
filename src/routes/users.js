const express = require('express');
const { body } = require('express-validator');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// All user routes are protected
router.use(authMiddleware);

const userRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const updateRules = [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.get('/',      getAllUsers);
router.get('/:id',   getUserById);
router.post('/',     userRules,   createUser);
router.put('/:id',   updateRules, updateUser);
router.delete('/:id',             deleteUser);

module.exports = router;
