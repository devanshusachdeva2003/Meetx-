const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: Object }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);
