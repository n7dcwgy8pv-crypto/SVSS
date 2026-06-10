/* ============================================================
   Alerts Routes  –  /api/alerts  (MongoDB)
   ============================================================ */
const express = require('express');
const router  = express.Router();
const Alert   = require('../config/Alert.model');
const { authenticate, authorize } = require('../middleware/auth');

/* GET /api/alerts  (supports ?status=open&severity=high) */
router.get('/', authenticate, authorize('alerts:view'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: alerts, total: alerts.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
});

/* GET /api/alerts/:id */
router.get('/:id', authenticate, authorize('alerts:view'), async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    return res.json({ success: true, data: alert });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch alert.' });
  }
});

/* POST /api/alerts  –  create new alert */
router.post('/', authenticate, authorize('alerts:view'), async (req, res) => {
  try {
    const { type, gate, severity, description } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'type is required.' });
    const alert = await Alert.create({ type, gate, severity, description });
    return res.status(201).json({ success: true, message: 'Alert created.', data: alert });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create alert.' });
  }
});

/* PATCH /api/alerts/:id/resolve */
router.patch('/:id/resolve', authenticate, authorize('alerts:resolve'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedBy: req.user.name, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    return res.json({ success: true, message: 'Alert resolved.', data: alert });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to resolve alert.' });
  }
});

/* DELETE /api/alerts/:id */
router.delete('/:id', authenticate, authorize('alerts:delete'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    return res.json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete alert.' });
  }
});

/* GET /api/alerts/export/csv */
router.get('/export/csv', authenticate, authorize('alerts:export'), async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    const header = 'id,type,gate,severity,status,createdAt,description\n';
    const rows   = alerts.map(a =>
      `${a._id},${a.type},${a.gate},${a.severity},${a.status},${a.createdAt.toISOString()},"${a.description}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="alerts.csv"');
    return res.send(header + rows);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Export failed.' });
  }
});

module.exports = router;
