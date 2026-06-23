const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  isPinned: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meetingId: { type: String }, // Optional, to link to a meeting
  participants: [{ type: String }], // Array of names or IDs for display
  actionItems: [{
    text: { type: String },
    completed: { type: Boolean, default: false },
    assignee: { type: String },
    dueDate: { type: Date }
  }],
  decisions: [{ type: String }],
  generalNotes: [{ type: String }],
  summary: { type: String }, // AI Summary text
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
