/* ============================================================
   Users Routes  –  /api/users
   Admin-only management endpoints
   ============================================================ */

const express  = require('express');
const router   = express.Router();

const User = require('../config/User.model');
const { authenticate, authorize } = require('../middleware/auth');

/* GET /api/users  –  list all users */
router.get('/', authenticate, authorize('users:view'), async (req, res) => {
  const users = await User.find().select('-passwordHash -__v');
  return res.json({ success: true, data: users });
});

/* GET /api/users/:id  –  get single user */
router.get('/:id', authenticate, authorize('users:view'), async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash -__v');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, data: user });
});

/* PATCH /api/users/:id  –  update user (admin) */
router.patch('/:id', authenticate, authorize('users:update'), async (req, res) => {
  const { firstName, lastName, status, password } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (firstName) user.firstName = firstName;
  if (lastName)  user.lastName = lastName;
  if (status)    user.status = status;
  if (password)  user.passwordHash = password;

  await user.save();

  const safe = user.toObject();
  delete safe.passwordHash;
  delete safe.__v;

  return res.json({ success: true, message: 'User updated.', data: safe });
});

/* PATCH /api/users/:id/role  –  change role (admin only) */
router.patch('/:id/role', authenticate, authorize('users:change_role'), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user', 'security_manager', 'gate_operator', 'analyst'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.role = role;
  await user.save();

  const safe = user.toObject();
  delete safe.passwordHash;
  delete safe.__v;

  return res.json({ success: true, message: `Role updated to ${role}.`, data: safe });
});

/* DELETE /api/users/:id  –  delete user (admin only) */
router.delete('/:id', authenticate, authorize('users:delete'), async (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user.sub) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }

  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'User not found.' });

  return res.json({ success: true, message: 'User deleted successfully.' });
});

module.exports = router;
