const mongoose = require('mongoose');
const crypto = require('crypto');

const MemorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Friends',
        'College',
        'Travel',
        'Family',
        'Birthdays',
        'Events',
        'Achievements',
        'Other',
      ],
      default: 'Friends',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

MemorySchema.index({ user: 1, date: -1 });
MemorySchema.index({ user: 1, category: 1 });
MemorySchema.index({ user: 1, isFavorite: 1 });

// Generate secure share token if sharing is enabled
MemorySchema.pre('save', function (next) {
  if (this.isShared && !this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Memory', MemorySchema);
