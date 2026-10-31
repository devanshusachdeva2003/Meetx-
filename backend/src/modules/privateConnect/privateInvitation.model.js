const mongoose = require('mongoose');

const PrivateInvitationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['chat', 'couple'],
      default: 'chat',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'canceled'],
      default: 'pending',
      index: true,
    },
    anniversaryDate: {
      type: Date,
      default: null,
    },
    message: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PrivateInvitation', PrivateInvitationSchema);
