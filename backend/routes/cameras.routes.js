/* ============================================================
   Cameras Routes  –  /api/cameras  (MongoDB)
   ============================================================ */
const express = require('express');
const router  = express.Router();
const Camera  = require('../config/Camera.model');
const { authenticate, authorize } = require('../middleware/auth');

/* GET /api/cameras */
router.get('/', authenticate, authorize('cameras:view'), async (req, res) => {
  try {
    const cameras = await Camera.find().sort({ cameraId: 1 });
    return res.json({ success: true, data: cameras });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch cameras.' });
  }
});

/* GET /api/cameras/:id/live */
router.get('/:id/live', authenticate, authorize('cameras:live_feed'), async (req, res) => {
  try {
    const cam = await Camera.findOne({ cameraId: req.params.id });
    if (!cam) return res.status(404).json({ success: false, message: 'Camera not found.' });
    if (cam.status === 'offline') return res.status(503).json({ success: false, message: 'Camera is offline.' });
    return res.json({
      success: true,
      data: {
        camera:    cam,
        streamUrl: `rtsp://svss.local/live/${cam.cameraId}`,
        hlsUrl:    `https://svss.local/hls/${cam.cameraId}/index.m3u8`,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch live feed.' });
  }
});

/* POST /api/cameras */
router.post('/', authenticate, authorize('cameras:create'), async (req, res) => {
  try {
    const { id, name, gate, resolution, ai } = req.body;
    if (!id || !name) return res.status(400).json({ success: false, message: 'id and name are required.' });
    const exists = await Camera.findOne({ cameraId: id });
    if (exists) return res.status(409).json({ success: false, message: 'Camera ID already exists.' });
    const cam = await Camera.create({ cameraId: id, name, gate, resolution: resolution || '1080p', ai: !!ai });
    return res.status(201).json({ success: true, message: 'Camera added.', data: cam });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create camera.' });
  }
});

/* PATCH /api/cameras/:id */
router.patch('/:id', authenticate, authorize('cameras:update'), async (req, res) => {
  try {
    const { name, status, resolution, ai, gate } = req.body;
    const cam = await Camera.findOneAndUpdate(
      { cameraId: req.params.id },
      { ...(name && { name }), ...(status && { status }), ...(resolution && { resolution }), ...(ai !== undefined && { ai }), ...(gate && { gate }) },
      { new: true }
    );
    if (!cam) return res.status(404).json({ success: false, message: 'Camera not found.' });
    return res.json({ success: true, message: 'Camera updated.', data: cam });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update camera.' });
  }
});

/* DELETE /api/cameras/:id */
router.delete('/:id', authenticate, authorize('cameras:delete'), async (req, res) => {
  try {
    const cam = await Camera.findOneAndDelete({ cameraId: req.params.id });
    if (!cam) return res.status(404).json({ success: false, message: 'Camera not found.' });
    return res.json({ success: true, message: 'Camera removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete camera.' });
  }
});

module.exports = router;
