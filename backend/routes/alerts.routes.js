/* ============================================================
   Alerts Routes  –  /api/alerts
   view/resolve: both roles | delete/export: admin only
   ============================================================ */

const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

let alerts = [
  { id: 'A1', type: 'unauthorized_entry', gate: 'G1', severity: 'high',   status: 'open',     timestamp: '2026-05-27T08:12:00Z', description: 'Unrecognized individual at Gate A' },
  { id: 'A2', type: 'tailgating',         gate: 'G2', severity: 'medium', status: 'open',     timestamp: '2026-05-27T09:45:00Z', description: 'Tailgating detected at Gate B' },
  { id: 'A3', type: 'forced_entry',       gate: 'G3', severity: 'critical',status: 'resolved', timestamp: '2026-05-27T07:30:00Z', description: 'Forced entry attempt at VIP Gate' },
];

/* GET /api/alerts  –  both roles */
router.get('/', authenticate, authorize('alerts:view'), (req, res) => {
  const { status, severity } = req.query;
  let result = [...alerts];
  if (status)   result = result.filter(a => a.status   === status);
  if (severity) result = result.filter(a => a.severity === severity);
  return res.json({ success: true, data: result, total: result.length });
});

/* GET /api/alerts/:id  –  both roles */
router.get('/:id', authenticate, authorize('alerts:view'), (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
  return res.json({ success: true, data: alert });
});

/* PATCH /api/alerts/:id/resolve  –  both roles */
router.patch('/:id/resolve', authenticate, authorize('alerts:resolve'), (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
  alert.status     = 'resolved';
  alert.resolvedBy = req.user.name;
  alert.resolvedAt = new Date().toISOString();
  return res.json({ success: true, message: 'Alert resolved.', data: alert });
});

/* DELETE /api/alerts/:id  –  admin only */
router.delete('/:id', authenticate, authorize('alerts:delete'), (req, res) => {
  const idx = alerts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Alert not found.' });
  alerts.splice(idx, 1);
  return res.json({ success: true, message: 'Alert deleted.' });
});

/* GET /api/alerts/export/csv  –  admin only */
router.get('/export/csv', authenticate, authorize('alerts:export'), (req, res) => {
  const header = 'id,type,gate,severity,status,timestamp,description\n';
  const rows   = alerts.map(a =>
    `${a.id},${a.type},${a.gate},${a.severity},${a.status},${a.timestamp},"${a.description}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="alerts.csv"');
  return res.send(header + rows);
});

module.exports = router;
