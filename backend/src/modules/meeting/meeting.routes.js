const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createMeeting, getMeeting, getMeetings, getLiveKitToken, removeParticipant, muteParticipant, shareFile } = require('./meeting.controller');
const { protect } = require('../../middleware/authMiddleware');

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.get('/livekit/token', getLiveKitToken);
router.get('/:id', getMeeting);

// Admin controls
router.post('/:id/remove', protect, removeParticipant);
router.post('/:id/mute', protect, muteParticipant);
router.post('/:id/share', protect, upload.single('file'), shareFile);

module.exports = router;
