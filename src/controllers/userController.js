const { validationResult } = require('express-validator');
const { User } = require('../models');

// ─── Get all users ────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['created_at', 'DESC']] });
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Get user by ID ───────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Create user ──────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({ email, password });
    return res.status(201).json({ success: true, message: 'User created', data: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Update user ──────────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const user = await User.scope('withPassword').findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { email, password } = req.body;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();
    return res.status(200).json({ success: true, message: 'User updated', data: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Delete user ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.destroy();
    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
