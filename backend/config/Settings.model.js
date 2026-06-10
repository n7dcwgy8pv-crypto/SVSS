/* ============================================================
   Settings Mongoose Model  (single document — singleton pattern)
   ============================================================ */
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  systemName:          { type: String,  default: 'Smart Venue Security System' },
  alertThreshold:      { type: String,  default: 'medium' },
  aiSensitivity:       { type: Number,  default: 0.85 },
  retentionDays:       { type: Number,  default: 30 },
  emailNotifications:  { type: Boolean, default: true },
  smsNotifications:    { type: Boolean, default: false },
  maintenanceMode:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
