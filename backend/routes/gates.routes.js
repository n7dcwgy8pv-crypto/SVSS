/* ============================================================
   Gates Routes  –  /api/gates
   view: both roles | create/update/delete/control: admin only
   ============================================================ */

const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Simulated gate data
let gates = [
  { id: 'G1', name: 'Gate A – Main Entrance', status: 'open',   zone: 'main',  cameras: 4 },
  { id: 'G2', name: 'Gate B – North Wing',    status: 'open',   zone: 'north', cameras: 2 },
  { id: 'G3', name: 'Gate C – VIP Entrance',  status: 'closed', zone: 'vip',   cameras: 3 },
  { id: 'G4', name: 'Gate D – Staff Exit',    status: 'open',   zone: 'staff', cameras: 2 },
  { id: 'G5', name: 'Gate E – Emergency',     status: 'locked', zone: 'emerg', cameras: 1 },
];

/* GET /api/gates  –  both roles */
router.get('/', authenticate, authorize('gates:view'), (req, res) => {
  return res.json({ success: true, data: gates });
});

/* GET /api/gates/:id  –  both roles */
router.get('/:id', authenticate, authorize('gates:view'), (req, res) => {
  const gate = gates.find(g => g.id === req.params.id);
  if (!gate) return res.status(404).json({ success: false, message: 'Gate not found.' });
  return res.json({ success: true, data: gate });
});

/* POST /api/gates  –  admin only */
router.post('/', authenticate, authorize('gates:create'), (req, res) => {
  const { id, name, zone, cameras } = req.body;
  if (!id || !name) return res.status(400).json({ success: false, message: 'id and name are required.' });
  gates.push({ id, name, status: 'closed', zone: zone || 'general', cameras: cameras || 0 });
  return res.status(201).json({ success: true, message: 'Gate created.', data: gates.at(-1) });
});

/* PATCH /api/gates/:id/control  –  admin only (open/close/lock) */
router.patch('/:id/control', authenticate, authorize('gates:control'), (req, res) => {
  const { action } = req.body;   // 'open' | 'close' | 'lock'
  const allowed = ['open', 'close', 'locked'];
  if (!allowed.includes(action)) {
    return res.status(400).json({ success: false, message: `Action must be one of: ${allowed.join(', ')}` });
  }

  const gate = gates.find(g => g.id === req.params.id);
  if (!gate) return res.status(404).json({ success: false, message: 'Gate not found.' });

  gate.status = action === 'close' ? 'closed' : action;
  return res.json({ success: true, message: `Gate ${gate.name} is now ${gate.status}.`, data: gate });
});

/* DELETE /api/gates/:id  –  admin only */
router.delete('/:id', authenticate, authorize('gates:delete'), (req, res) => {
  const idx = gates.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Gate not found.' });
  gates.splice(idx, 1);
  return res.json({ success: true, message: 'Gate deleted.' });
});

module.exports = router;
