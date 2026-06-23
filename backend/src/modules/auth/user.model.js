const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: false },
  isOtpVerified: { type: Boolean, default: false },
  googleId: { type: String, sparse: true, unique: true },
  avatar: { type: String },
  requiresTwoFactorAuth: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
