const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const controller = require('./privateConnect.controller');

// All Private Connect routes are protected by JWT authentication
router.use(protect);

// Users & Contacts
router.get('/users/search', controller.searchUsers);

// Conversations
router.get('/conversations', controller.getConversations);
router.get('/conversations/:conversationId/messages', controller.getMessages);
router.post('/conversations/:conversationId/messages', controller.sendMessage);
router.post('/conversations/:conversationId/read', controller.markAsRead);

// Messages & Reactions
router.post('/messages/:messageId/reactions', controller.reactToMessage);
router.delete('/messages/:messageId', controller.deleteMessage);

// Invitations (Chat & Couple Mode)
router.get('/invitations', controller.getInvitations);
router.post('/invitations', controller.sendInvitation);
router.put('/invitations/:invitationId', controller.respondInvitation);

// Couple Mode Settings & Disconnect
router.put('/couple/settings', controller.updateCoupleSettings);
router.post('/couple/disconnect', controller.disconnectCouple);

// Safety & Moderation
router.post('/block', controller.toggleBlockUser);
router.post('/report', controller.reportUser);

module.exports = router;
