/* ============================================================
   Dashboard Routes  –  /api/dashboard  (MongoDB)
   ============================================================ */
const express = require('express');
const router  = express.Router();
const User    = require('../config/User.model');
const Gate    = require('../config/Gate.model');
const Alert   = require('../config/Alert.model');
const Camera  = require('../config/Camera.model');
const { authenticate, authorize } = require('../middleware/auth');

/* GET /api/dashboard/summary */
router.get('/summary', authenticate, authorize('dashboard:view'), async (req, res) => {
  try {
    const { role } = req.user;

    const [gates, openAlerts, cameras, totalUsers, pendingUsers] = await Promise.all([
      Gate.find(),
      Alert.countDocuments({ status: 'open' }),
      Camera.find(),
      role === 'admin' ? User.countDocuments() : Promise.resolve(0),
      role === 'admin' ? User.countDocuments({ status: 'pending' }) : Promise.resolve(0),
    ]);

    const activeGates   = gates.filter(g => g.status === 'open').length;
    const totalGates    = gates.length;
    const onlineCameras = cameras.filter(c => c.status === 'online').length;
    const totalCameras  = cameras.length;
    const unauthorizedAlerts = await Alert.countDocuments({ status: 'open', type: 'unauthorized_entry' });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEntries = await Alert.countDocuments({ createdAt: { $gte: todayStart } });

    const base = {
      activeGates,
      totalGates,
      aiStatus:           'online',
      unauthorizedAlerts,
      totalCameras,
      onlineCameras,
      todayEntries,
      flaggedPersons:     openAlerts,
    };

    if (role === 'admin') {
      const roleCounts = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      const byRole = {};
      roleCounts.forEach(r => { byRole[r._id] = r.count; });

      return res.json({
        success: true,
        data: {
          ...base,
          totalUsers,
          pendingUsers,
          adminCount:       byRole['admin']        || 0,
          gateOperatorCount:byRole['gate_operator'] || 0,
          userCount:        byRole['user']          || 0,
          systemHealth:     '98.6%',
        },
      });
    }

    return res.json({ success: true, data: base });
  } catch (err) {
    console.error('[Dashboard]', err);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard summary.' });
  }
});

/* GET /api/dashboard/analytics — hourly/daily entry data */
router.get('/analytics', authenticate, authorize('dashboard:view'), async (req, res) => {
  try {
    const now  = new Date();
    const dayStart = new Date(now); dayStart.setHours(0,0,0,0);

    // Group alerts by hour for today
    const hourly = await Alert.aggregate([
      { $match: { createdAt: { $gte: dayStart } } },
      { $group: {
          _id: { $hour: '$createdAt' },
          total:        { $sum: 1 },
          unauthorized: { $sum: { $cond: [{ $eq: ['$type','unauthorized_entry'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Build 24-slot arrays
    const hours        = Array(24).fill(0);
    const unauthorized = Array(24).fill(0);
    hourly.forEach(h => {
      hours[h._id]        = h.total;
      unauthorized[h._id] = h.unauthorized;
    });

    // Weekly totals (last 7 days)
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0,0,0,0);
    const weekly = await Alert.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      { $group: {
          _id: { $dayOfWeek: '$createdAt' },
          total: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    const weekDays = Array(7).fill(0);
    weekly.forEach(w => { weekDays[(w._id - 1) % 7] = w.total; });

    return res.json({
      success: true,
      data: { hourly: hours, unauthorizedHourly: unauthorized, weekly: weekDays },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load analytics.' });
  }
});

module.exports = router;
