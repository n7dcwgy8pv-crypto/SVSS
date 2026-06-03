/* ============================================================
   Settings Routes  –  /api/settings
   Admin only
   ============================================================ */

const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

let settings = {
  systemName:        'Smart Venue Security System',
  alertThreshold:    'medium',
  aiSensitivity:     0.85,
  retentionDays:     30,
  emailNotifications: true,
  smsNotifications:  false,
  maintenanceMode:   false,
};

/* GET /api/settings  –  admin only */
router.get('/', authenticate, authorize('settings:view'), (req, res) => {
  return res.json({ success: true, data: settings });
});

/* PATCH /api/settings  –  admin only */
router.patch('/', authenticate, authorize('settings:update'), (req, res) => {
  const allowed = Object.keys(settings);
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  settings = { ...settings, ...updates };
  return res.json({ success: true, message: 'Settings updated.', data: settings });
});

/* POST /api/settings/backup  –  admin only */
router.post('/backup', authenticate, authorize('settings:backup'), (req, res) => {
  return res.json({
    success: true,
    message: 'Backup initiated.',
    data: { backupId: `BKP-${Date.now()}`, timestamp: new Date().toISOString() },
  });
});

module.exports = router;
