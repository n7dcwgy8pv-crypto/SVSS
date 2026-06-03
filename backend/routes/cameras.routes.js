/* ============================================================
   Cameras Routes  –  /api/cameras
   view/live_feed: both roles | create/update/delete/playback: admin only
   ============================================================ */

const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

let cameras = [
  { id: 'C1', name: 'Main Entrance Cam 1', gate: 'G1', status: 'online',  resolution: '4K',  ai: true  },
  { id: 'C2', name: 'Main Entrance Cam 2', gate: 'G1', status: 'online',  resolution: '1080p', ai: true },
  { id: 'C3', name: 'North Wing Cam',      gate: 'G2', status: 'online',  resolution: '1080p', ai: true },
  { id: 'C4', name: 'VIP Entrance Cam',    gate: 'G3', status: 'offline', resolution: '4K',  ai: false },
  { id: 'C5', name: 'Staff Exit Cam',      gate: 'G4', status: 'online',  resolution: '720p', ai: false },
];

/* GET /api/cameras  –  both roles */
router.get('/', authenticate, authorize('cameras:view'), (req, res) => {
  return res.json({ success: true, data: cameras });
});

/* GET /api/cameras/:id/live  –  both roles */
router.get('/:id/live', authenticate, authorize('cameras:live_feed'), (req, res) => {
  const cam = cameras.find(c => c.id === req.params.id);
  if (!cam) return res.status(404).json({ success: false, message: 'Camera not found.' });
  if (cam.status === 'offline') {
    return res.status(503).json({ success: false, message: 'Camera is offline.' });
  }
  // In production this would return an RTSP/HLS stream URL
  return res.json({
    success: true,
    data: {
      camera:    cam,
      streamUrl: `rtsp://svss.local/live/${cam.id}`,
      hlsUrl:    `https://svss.local/hls/${cam.id}/index.m3u8`,
    },
  });
});

/* GET /api/cameras/:id/playback  –  admin only */
router.get('/:id/playback', authenticate, authorize('cameras:playback'), (req, res) => {
  const { from, to } = req.query;
  const cam = cameras.find(c => c.id === req.params.id);
  if (!cam) return res.status(404).json({ success: false, message: 'Camera not found.' });
  return res.json({
    success: true,
    data: {
      camera:      cam,
      from:        from || '2026-05-27T00:00:00Z',
      to:          to   || new Date().toISOString(),
      playbackUrl: `https://svss.local/playback/${cam.id}?from=${from}&to=${to}`,
    },
  });
});

/* POST /api/cameras  –  admin only */
router.post('/', authenticate, authorize('cameras:create'), (req, res) => {
  const { id, name, gate, resolution, ai } = req.body;
  if (!id || !name) return res.status(400).json({ success: false, message: 'id and name are required.' });
  cameras.push({ id, name, gate, status: 'offline', resolution: resolution || '1080p', ai: !!ai });
  return res.status(201).json({ success: true, message: 'Camera added.', data: cameras.at(-1) });
});

/* DELETE /api/cameras/:id  –  admin only */
router.delete('/:id', authenticate, authorize('cameras:delete'), (req, res) => {
  const idx = cameras.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Camera not found.' });
  cameras.splice(idx, 1);
  return res.json({ success: true, message: 'Camera removed.' });
});

module.exports = router;
