/* ============================================================
   Camera Mongoose Model
   ============================================================ */
const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  cameraId:   { type: String, required: true, unique: true, trim: true },
  name:       { type: String, required: true, trim: true },
  gate:       { type: String, default: '' },
  status:     { type: String, enum: ['online','offline'], default: 'offline' },
  resolution: { type: String, default: '1080p' },
  ai:         { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Camera || mongoose.model('Camera', cameraSchema);
