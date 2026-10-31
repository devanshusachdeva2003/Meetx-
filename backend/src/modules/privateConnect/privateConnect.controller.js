const mongoose = require('mongoose');
const User = require('../auth/user.model');
const PrivateConversation = require('./privateConversation.model');
const PrivateMessage = require('./privateMessage.model');
const PrivateInvitation = require('./privateInvitation.model');
const UserReport = require('./userReport.model');
const { getIo, isUserOnline } = require('./socket');

// Search registered MeetX users
exports.searchUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return res.status(200).json({ users: [] });
    }

    // Find users by name or email, excluding the current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('_id name email avatar createdAt')
      .limit(20)
      .lean();

    // Check relationship state with each user (existing conversation or pending invite)
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const conversation = await PrivateConversation.findOne({
          participants: { $all: [currentUserId, u._id] },
        }).lean();

        const pendingInvite = await PrivateInvitation.findOne({
          $or: [
            { sender: currentUserId, recipient: u._id, status: 'pending' },
            { sender: u._id, recipient: currentUserId, status: 'pending' },
          ],
        }).lean();

        return {
          ...u,
          isOnline: isUserOnline(u._id),
          hasConversation: !!conversation,
          conversationId: conversation ? conversation._id : null,
          isCouple: conversation?.isCouple || false,
          pendingInvite: pendingInvite
            ? {
                id: pendingInvite._id,
                isSender: pendingInvite.sender.toString() === currentUserId,
                type: pendingInvite.type,
              }
            : null,
        };
      })
    );

    res.status(200).json({ users: enrichedUsers });
  } catch (error) {
    next(error);
  }
};

// Get conversations for current user
exports.getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const conversations = await PrivateConversation.find({
      participants: currentUserId,
    })
      .populate('participants', '_id name email avatar')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Enrich conversation with other user info and unread counts
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== currentUserId
        );

        // Count unread messages for this user in this conversation
        const unreadCount = await PrivateMessage.countDocuments({
          conversationId: conv._id,
          sender: { $ne: currentUserId },
          readBy: { $ne: currentUserId },
          isDeletedForEveryone: false,
          deletedFor: { $ne: currentUserId },
        });

        const isBlockedByMe = conv.blockedBy?.some(
          (b) => b.toString() === currentUserId
        );
        const hasBlockedMe = conv.blockedBy?.some(
          (b) => b.toString() !== currentUserId
        );

        return {
          _id: conv._id,
          isCouple: conv.isCouple,
          coupleData: conv.coupleData,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          otherParticipant: otherParticipant
            ? {
                ...otherParticipant,
                isOnline: isUserOnline(otherParticipant._id),
              }
            : null,
          unreadCount,
          isBlockedByMe,
          hasBlockedMe,
        };
      })
    );

    res.status(200).json({ conversations: enriched });
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;

    // Database-level access policy: participant check
    const conversation = await PrivateConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Fetch messages excluding those deleted for this user
    const messages = await PrivateMessage.find({
      conversationId,
      deletedFor: { $ne: currentUserId },
    })
      .populate('sender', '_id name email avatar')
      .sort({ createdAt: 1 })
      .lean();

    // Mark any unread messages from other user as read
    const unreadMessageIds = messages
      .filter(
        (m) =>
          m.sender._id.toString() !== currentUserId &&
          !m.readBy?.some((r) => r.toString() === currentUserId)
      )
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      await PrivateMessage.updateMany(
        { _id: { $in: unreadMessageIds } },
        { $addToSet: { readBy: currentUserId } }
      );

      // Emit read notification via Socket.io
      const io = getIo();
      if (io) {
        io.to(`conversation_${conversationId}`).emit('messages_marked_read', {
          conversationId,
          readByUserId: currentUserId,
          messageIds: unreadMessageIds,
        });
      }
    }

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

// Send a message
exports.sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;
    const { content, messageType, mediaUrl, voiceDuration } = req.body;

    const conversation = await PrivateConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Security check: Must be a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Block check: Cannot send message if conversation is blocked
    if (conversation.blockedBy && conversation.blockedBy.length > 0) {
      return res.status(403).json({
        error: 'Cannot send message because one participant has blocked communications',
      });
    }

    const newMessage = await PrivateMessage.create({
      conversationId,
      sender: currentUserId,
      content: content || '',
      messageType: messageType || 'text',
      mediaUrl: mediaUrl || null,
      voiceDuration: voiceDuration || 0,
      readBy: [currentUserId],
    });

    // Update conversation lastMessage
    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await PrivateMessage.findById(newMessage._id)
      .populate('sender', '_id name email avatar')
      .lean();

    // Broadcast message via Socket.io
    const io = getIo();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', {
        message: populatedMessage,
        conversationId,
      });

      // Also send notification to the other participant's personal room
      const recipientId = conversation.participants.find(
        (p) => p.toString() !== currentUserId
      );
      if (recipientId) {
        io.to(`user_${recipientId.toString()}`).emit('conversation_updated', {
          conversationId,
          lastMessage: populatedMessage,
        });
      }
    }

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// Add reaction to a message
exports.reactToMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await PrivateMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is in the conversation
    const conversation = await PrivateConversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.some((p) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If reaction exists from this user with the same emoji, remove it (toggle off)
    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === currentUserId
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId: currentUserId, emoji });
    }

    await message.save();

    const io = getIo();
    if (io) {
      io.to(`conversation_${message.conversationId}`).emit('message_reaction', {
        messageId: message._id,
        reactions: message.reactions,
      });
    }

    res.status(200).json({ message: 'Reaction updated', reactions: message.reactions });
  } catch (error) {
    next(error);
  }
};

// Delete a message (for me or everyone)
exports.deleteMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { messageId } = req.params;
    const { forEveryone } = req.body;

    const message = await PrivateMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const conversation = await PrivateConversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.some((p) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (forEveryone) {
      // Only sender can delete for everyone
      if (message.sender.toString() !== currentUserId) {
        return res.status(403).json({ error: 'You can only delete your own messages for everyone' });
      }
      message.isDeletedForEveryone = true;
      message.content = 'This message was deleted';
      message.mediaUrl = null;
      await message.save();

      const io = getIo();
      if (io) {
        io.to(`conversation_${message.conversationId}`).emit('message_deleted', {
          messageId: message._id,
          forEveryone: true,
        });
      }
    } else {
      // Delete for me
      if (!message.deletedFor.includes(currentUserId)) {
        message.deletedFor.push(currentUserId);
        await message.save();
      }
    }

    res.status(200).json({ success: true, messageId });
  } catch (error) {
    next(error);
  }
};

// Mark conversation as read
exports.markAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await PrivateConversation.findById(conversationId);
    if (!conversation || !conversation.participants.some((p) => p.toString() === currentUserId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await PrivateMessage.updateMany(
      {
        conversationId,
        sender: { $ne: currentUserId },
        readBy: { $ne: currentUserId },
      },
      {
        $addToSet: { readBy: currentUserId },
      }
    );

    const io = getIo();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('messages_marked_read', {
        conversationId,
        readByUserId: currentUserId,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Send an invitation (Chat or Couple Mode)
exports.sendInvitation = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId, type, message, anniversaryDate } = req.body;

    if (!recipientId || recipientId === currentUserId) {
      return res.status(400).json({ error: 'Invalid recipient' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if a conversation already exists
    const existingConversation = await PrivateConversation.findOne({
      participants: { $all: [currentUserId, recipientId] },
    });

    if (existingConversation && type === 'chat') {
      return res.status(200).json({
        conversationId: existingConversation._id,
        message: 'Conversation already exists',
      });
    }

    if (existingConversation && type === 'couple' && existingConversation.isCouple) {
      return res.status(400).json({ error: 'You are already in Couple Mode with this user' });
    }

    // Check if current user already has an active couple connection
    if (type === 'couple') {
      const currentCouple = await PrivateConversation.findOne({
        participants: currentUserId,
        isCouple: true,
      });
      if (currentCouple) {
        return res.status(400).json({
          error: 'You already have an active Couple Mode connection. Please disconnect before inviting another partner.',
        });
      }
    }

    // Check for pending invitation
    const pending = await PrivateInvitation.findOne({
      $or: [
        { sender: currentUserId, recipient: recipientId, status: 'pending' },
        { sender: recipientId, recipient: currentUserId, status: 'pending' },
      ],
    });

    if (pending) {
      return res.status(400).json({
        error: 'A pending invitation already exists with this user',
      });
    }

    const invitation = await PrivateInvitation.create({
      sender: currentUserId,
      recipient: recipientId,
      type: type || 'chat',
      message: message || '',
      anniversaryDate: anniversaryDate || null,
      status: 'pending',
    });

    const populatedInvite = await PrivateInvitation.findById(invitation._id)
      .populate('sender', '_id name email avatar')
      .populate('recipient', '_id name email avatar')
      .lean();

    const io = getIo();
    if (io) {
      io.to(`user_${recipientId}`).emit('invitation_received', populatedInvite);
    }

    res.status(201).json({ invitation: populatedInvite });
  } catch (error) {
    next(error);
  }
};

// Get invitations
exports.getInvitations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const incoming = await PrivateInvitation.find({
      recipient: currentUserId,
      status: 'pending',
    })
      .populate('sender', '_id name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    const outgoing = await PrivateInvitation.find({
      sender: currentUserId,
      status: 'pending',
    })
      .populate('recipient', '_id name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ incoming, outgoing });
  } catch (error) {
    next(error);
  }
};

// Respond to invitation (Accept / Decline)
exports.respondInvitation = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { invitationId } = req.params;
    const { action } = req.body; // 'accept' or 'decline' or 'cancel'

    const invitation = await PrivateInvitation.findById(invitationId)
      .populate('sender', '_id name email avatar')
      .populate('recipient', '_id name email avatar');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (action === 'cancel') {
      if (invitation.sender._id.toString() !== currentUserId) {
        return res.status(403).json({ error: 'Only the sender can cancel this invitation' });
      }
      invitation.status = 'canceled';
      await invitation.save();
      return res.status(200).json({ success: true, message: 'Invitation canceled' });
    }

    if (invitation.recipient._id.toString() !== currentUserId) {
      return res.status(403).json({ error: 'Only the recipient can respond to this invitation' });
    }

    if (action === 'decline') {
      invitation.status = 'declined';
      await invitation.save();

      const io = getIo();
      if (io) {
        io.to(`user_${invitation.sender._id}`).emit('invitation_declined', {
          invitationId: invitation._id,
        });
      }

      return res.status(200).json({ success: true, message: 'Invitation declined' });
    }

    if (action === 'accept') {
      invitation.status = 'accepted';
      await invitation.save();

      // Find or create conversation
      let conversation = await PrivateConversation.findOne({
        participants: { $all: [invitation.sender._id, invitation.recipient._id] },
      });

      if (!conversation) {
        conversation = await PrivateConversation.create({
          participants: [invitation.sender._id, invitation.recipient._id],
          isCouple: invitation.type === 'couple',
          coupleData:
            invitation.type === 'couple'
              ? {
                  anniversaryDate: invitation.anniversaryDate || new Date(),
                  theme: 'romantic-pink',
                  nicknames: {},
                  initiatedBy: invitation.sender._id,
                }
              : {},
        });
      } else if (invitation.type === 'couple') {
        conversation.isCouple = true;
        conversation.coupleData = {
          anniversaryDate: invitation.anniversaryDate || new Date(),
          theme: 'romantic-pink',
          nicknames: {},
          initiatedBy: invitation.sender._id,
        };
        await conversation.save();
      }

      // Create a nice system welcome message
      const systemMessage = await PrivateMessage.create({
        conversationId: conversation._id,
        sender: currentUserId,
        messageType: 'system',
        content:
          invitation.type === 'couple'
            ? '❤️ Welcome to Couple Mode! Your private sanctuary has been created.'
            : '✨ Chat invitation accepted. Say hi to begin!',
        readBy: [invitation.sender._id, invitation.recipient._id],
      });

      conversation.lastMessage = systemMessage._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const io = getIo();
      if (io) {
        io.to(`user_${invitation.sender._id}`).emit('invitation_accepted', {
          invitationId: invitation._id,
          conversationId: conversation._id,
          type: invitation.type,
        });
      }

      return res.status(200).json({
        success: true,
        conversationId: conversation._id,
        message: 'Invitation accepted successfully',
      });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    next(error);
  }
};

// Update Couple Settings (theme, nicknames, anniversary date)
exports.updateCoupleSettings = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId, theme, anniversaryDate, nicknames } = req.body;

    const conversation = await PrivateConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.isCouple) {
      return res.status(400).json({ error: 'This conversation is not in Couple Mode' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (theme) conversation.coupleData.theme = theme;
    if (anniversaryDate) conversation.coupleData.anniversaryDate = new Date(anniversaryDate);
    if (nicknames) {
      conversation.coupleData.nicknames = {
        ...conversation.coupleData.nicknames,
        ...nicknames,
      };
    }

    await conversation.save();

    const io = getIo();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('couple_settings_updated', {
        conversationId,
        coupleData: conversation.coupleData,
      });
    }

    res.status(200).json({
      success: true,
      coupleData: conversation.coupleData,
      message: 'Couple settings updated',
    });
  } catch (error) {
    next(error);
  }
};

// Disconnect / Leave Couple Mode
exports.disconnectCouple = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.body;

    const conversation = await PrivateConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    conversation.isCouple = false;
    await conversation.save();

    // Create system message
    await PrivateMessage.create({
      conversationId: conversation._id,
      sender: currentUserId,
      messageType: 'system',
      content: 'Couple Mode was disconnected.',
      readBy: conversation.participants,
    });

    const io = getIo();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('couple_disconnected', {
        conversationId,
      });
    }

    res.status(200).json({ success: true, message: 'Disconnected from Couple Mode' });
  } catch (error) {
    next(error);
  }
};

// Block / Unblock user
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId, action } = req.body; // 'block' or 'unblock'

    const conversation = await PrivateConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (action === 'block') {
      if (!conversation.blockedBy.includes(currentUserId)) {
        conversation.blockedBy.push(currentUserId);
      }
    } else {
      conversation.blockedBy = conversation.blockedBy.filter(
        (b) => b.toString() !== currentUserId
      );
    }

    await conversation.save();

    const io = getIo();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('block_status_updated', {
        conversationId,
        blockedBy: conversation.blockedBy,
      });
    }

    res.status(200).json({
      success: true,
      isBlockedByMe: action === 'block',
      message: action === 'block' ? 'User blocked' : 'User unblocked',
    });
  } catch (error) {
    next(error);
  }
};

// Report account
exports.reportUser = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { reportedUserId, reason, details } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required' });
    }

    const report = await UserReport.create({
      reporter: currentUserId,
      reportedUser: reportedUserId,
      reason,
      details: details || '',
    });

    res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted to the moderation team.',
      reportId: report._id,
    });
  } catch (error) {
    next(error);
  }
};
