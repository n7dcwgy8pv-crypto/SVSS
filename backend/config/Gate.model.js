/* ============================================================
   Gate Mongoose Model
   ============================================================ */
const mongoose = require('mongoose');

const gateSchema = new mongoose.Schema({
  gateId:   { type: String, required: true, unique: true, trim: true },
  name:     { type: String, required: true, trim: true },
  status:   { type: String, enum: ['open','closed','locked'], default: 'closed' },
  zone:     { type: String, default: 'general' },
  cameras:  { type: Number, default: 0 },
  entryCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.models.Gate || mongoose.model('Gate', gateSchema);
