const mongoose = require('mongoose');

const AttendeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const MeetingSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String },
  description: { type: String, default: '' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  participants: [AttendeeSchema],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);
