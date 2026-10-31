const mongoose = require('mongoose');

const WhiteboardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Whiteboard',
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    elements: {
      type: Array,
      default: [],
    },
    thumbnail: {
      type: String,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

WhiteboardSchema.index({ creator: 1, updatedAt: -1 });

module.exports = mongoose.model('Whiteboard', WhiteboardSchema);
