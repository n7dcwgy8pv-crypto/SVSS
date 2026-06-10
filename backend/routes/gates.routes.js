/* ============================================================
   Gates Routes  –  /api/gates  (MongoDB)
   ============================================================ */
const express = require('express');
const router  = express.Router();
const Gate    = require('../config/Gate.model');
const { authenticate, authorize } = require('../middleware/auth');

/* GET /api/gates */
router.get('/', authenticate, authorize('gates:view'), async (req, res) => {
  try {
    const gates = await Gate.find().sort({ gateId: 1 });
    return res.json({ success: true, data: gates });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch gates.' });
  }
});

/* GET /api/gates/:id */
router.get('/:id', authenticate, authorize('gates:view'), async (req, res) => {
  try {
    const gate = await Gate.findOne({ gateId: req.params.id });
    if (!gate) return res.status(404).json({ success: false, message: 'Gate not found.' });
    return res.json({ success: true, data: gate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch gate.' });
  }
});

/* POST /api/gates */
router.post('/', authenticate, authorize('gates:create'), async (req, res) => {
  try {
    const { id, name, zone, cameras } = req.body;
    if (!id || !name) return res.status(400).json({ success: false, message: 'id and name are required.' });
    const exists = await Gate.findOne({ gateId: id });
    if (exists) return res.status(409).json({ success: false, message: 'Gate ID already exists.' });
    const gate = await Gate.create({ gateId: id, name, zone: zone || 'general', cameras: cameras || 0 });
    return res.status(201).json({ success: true, message: 'Gate created.', data: gate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create gate.' });
  }
});

/* PATCH /api/gates/:id/control */
router.patch('/:id/control', authenticate, authorize('gates:control'), async (req, res) => {
  try {
    const { action } = req.body;
    const statusMap = { open: 'open', close: 'closed', locked: 'locked' };
    if (!statusMap[action]) {
      return res.status(400).json({ success: false, message: 'Action must be: open, close, or locked.' });
    }
    const gate = await Gate.findOneAndUpdate(
      { gateId: req.params.id },
      { status: statusMap[action] },
      { new: true }
    );
    if (!gate) return res.status(404).json({ success: false, message: 'Gate not found.' });
    return res.json({ success: true, message: `Gate is now ${gate.status}.`, data: gate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update gate.' });
  }
});

/* DELETE /api/gates/:id */
router.delete('/:id', authenticate, authorize('gates:delete'), async (req, res) => {
  try {
    const gate = await Gate.findOneAndDelete({ gateId: req.params.id });
    if (!gate) return res.status(404).json({ success: false, message: 'Gate not found.' });
    return res.json({ success: true, message: 'Gate deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete gate.' });
  }
});

module.exports = router;
