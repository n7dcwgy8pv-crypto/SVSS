/* ============================================================
   Auth Routes  –  /api/auth
   ============================================================ */

const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();

const User = require('../config/User.model');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  buildPayload,
} = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { PERMISSIONS }  = require('../config/permissions');

// In-memory refresh token store (use Redis / DB in production)
const refreshTokenStore = new Set();

/* ──────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
   ────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact an administrator.',
      });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const payload      = buildPayload(user);
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ sub: user.id });

    refreshTokenStore.add(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        refreshToken,
        user: {
          id:          user.id,
          name:        `${user.firstName} ${user.lastName}`,
          email:       user.email,
          role:        user.role,
          permissions: PERMISSIONS[user.role] || [],
        },
      },
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ──────────────────────────────────────────
   POST /api/auth/register
   Body: { firstName, lastName, email, password, role? }
   ────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Only allow 'user' role on self-registration (admin assigns admin role)
    const assignedRole = 'user';

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash: password,
      role: assignedRole,
      status: 'pending',
    });
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval.',
      data: {
        id:    newUser.id,
        email: newUser.email,
        role:  newUser.role,
      },
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ──────────────────────────────────────────
   POST /api/auth/refresh
   Body: { refreshToken }
   ────────────────────────────────────────── */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required.' });
  }

  if (!refreshTokenStore.has(refreshToken)) {
    return res.status(401).json({ success: false, message: 'Invalid or revoked refresh token.' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const payload     = buildPayload(user);
    const accessToken = generateAccessToken(payload);

    return res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Refresh token expired or invalid.' });
  }
});

/* ──────────────────────────────────────────
   POST /api/auth/logout
   Header: Authorization: Bearer <token>
   Body: { refreshToken }
   ────────────────────────────────────────── */
router.post('/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) refreshTokenStore.delete(refreshToken);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/* ──────────────────────────────────────────
   GET /api/auth/me
   Header: Authorization: Bearer <token>
   ────────────────────────────────────────── */
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.status(200).json({
    success: true,
    data: {
      id:          user.id,
      name:        `${user.firstName} ${user.lastName}`,
      email:       user.email,
      role:        user.role,
      status:      user.status,
      createdAt:   user.createdAt,
      permissions: PERMISSIONS[user.role] || [],
    },
  });
});

module.exports = router;
