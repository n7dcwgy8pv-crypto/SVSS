/* ============================================================
   Settings Routes  –  /api/settings  (MongoDB)
   ============================================================ */
const express  = require('express');
const router   = express.Router();
const Settings = require('../config/Settings.model');
const { authenticate, authorize } = require('../middleware/auth');

/* GET /api/settings */
router.get('/', authenticate, authorize('settings:view'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

/* PATCH /api/settings */
router.patch('/', authenticate, authorize('settings:update'), async (req, res) => {
  try {
    const allowed = ['systemName','alertThreshold','aiSensitivity','retentionDays','emailNotifications','smsNotifications','maintenanceMode'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    let settings = await Settings.findOneAndUpdate({}, updates, { new: true, upsert: true });
    return res.json({ success: true, message: 'Settings updated.', data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

/* POST /api/settings/backup */
router.post('/backup', authenticate, authorize('settings:backup'), (req, res) => {
  return res.json({
    success: true,
    message: 'Backup initiated.',
    data: { backupId: `BKP-${Date.now()}`, timestamp: new Date().toISOString() },
  });
});

module.exports = router;
