/* ============================================================
   User Mongoose Model  –  config/User.model.js
   ============================================================ */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'security_manager', 'gate_operator', 'analyst', 'user'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

/* Hash password before save */
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

/* Compare password helper */
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/* Strip passwordHash from JSON output */
userSchema.methods.toSafeObject = function () {
  const { passwordHash, __v, ...safe } = this.toObject();
  return safe;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
