const mongoose = require('mongoose');

const AttendeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const RecordingSchema = new mongoose.Schema({
  recordingOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerName: { type: String, default: 'Host' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds
  fileUrl: { type: String, required: true },
  localPath: { type: String },
  format: { type: String, default: 'mp4' },
  status: {
    type: String,
    enum: ['recording', 'processing', 'ready', 'failed'],
    default: 'ready'
  },
  size: { type: Number, default: 0 }
}, { timestamps: true });

const MeetingSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String },
  description: { type: String, default: '' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'live', 'ended'],
    default: 'waiting'
  },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  isRecording: { type: Boolean, default: false },
  recordingStartedAt: { type: Date, default: null },
  recordingOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  recordings: [RecordingSchema],
  participants: [AttendeeSchema],
  isPersonal: { type: Boolean, default: false },
  scheduledAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);
