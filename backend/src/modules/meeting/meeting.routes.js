const express = require('express');
const router = express.Router();
const { createMeeting, getMeeting, getMeetings, getLiveKitToken } = require('./meeting.controller');
const { protect } = require('../../middleware/authMiddleware');

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.get('/livekit/token', getLiveKitToken);
router.get('/:id', getMeeting);

module.exports = router;
