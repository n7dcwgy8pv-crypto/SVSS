/* ============================================================
   Dashboard Routes  –  /api/dashboard
   Both admin and user can access (different data depth)
   ============================================================ */

const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Simulated live data
const liveData = {
  activeGates:       12,
  aiStatus:          'online',
  unauthorizedAlerts: 3,
  totalCameras:      24,
  onlineCameras:     22,
  todayEntries:      1847,
  flaggedPersons:    5,
};

/* GET /api/dashboard/summary  –  both roles */
router.get('/summary', authenticate, authorize('dashboard:view'), (req, res) => {
  const { role } = req.user;

  // Admin gets full data; user gets a limited subset
  if (role === 'admin') {
    return res.json({
      success: true,
      data: {
        ...liveData,
        systemHealth:   '98.6%',
        storageUsed:    '2.4 TB',
        storageTotal:   '10 TB',
        lastBackup:     '2026-05-27T02:00:00Z',
        activeAdmins:   3,
        pendingUsers:   2,
      },
    });
  }

  // User – limited view
  return res.json({
    success: true,
    data: {
      activeGates:        liveData.activeGates,
      aiStatus:           liveData.aiStatus,
      unauthorizedAlerts: liveData.unauthorizedAlerts,
      totalCameras:       liveData.totalCameras,
      onlineCameras:      liveData.onlineCameras,
    },
  });
});

module.exports = router;
