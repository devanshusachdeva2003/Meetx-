const express = require('express');
const router = express.Router();
const { createMeeting, getMeeting, getMeetings, getLiveKitToken, removeParticipant, muteParticipant } = require('./meeting.controller');
const { protect } = require('../../middleware/authMiddleware');

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.get('/livekit/token', getLiveKitToken);
router.get('/:id', getMeeting);

// Admin controls
router.post('/:id/remove', protect, removeParticipant);
router.post('/:id/mute', protect, muteParticipant);

module.exports = router;
