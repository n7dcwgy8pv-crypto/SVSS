/* ============================================================
   Alert Mongoose Model
   ============================================================ */
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['unauthorized_entry','tailgating','forced_entry','duplicate_scan','crowd_threshold','camera_offline','other'],
    required: true,
  },
  gate:        { type: String, default: '' },
  severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:      { type: String, enum: ['open','resolved'], default: 'open' },
  description: { type: String, default: '' },
  resolvedBy:  { type: String, default: null },
  resolvedAt:  { type: Date,   default: null },
}, { timestamps: true });

module.exports = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
