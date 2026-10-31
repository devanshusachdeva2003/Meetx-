const mongoose = require('mongoose');

const PrivateConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isCouple: {
      type: Boolean,
      default: false,
    },
    coupleData: {
      anniversaryDate: { type: Date, default: null },
      theme: { type: String, default: 'romantic-pink' },
      nicknames: {
        type: Map,
        of: String,
        default: {},
      },
      initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateMessage',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    blockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

PrivateConversationSchema.index({ participants: 1 });
PrivateConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('PrivateConversation', PrivateConversationSchema);
