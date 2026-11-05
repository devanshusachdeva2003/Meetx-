const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const {
  createMeeting,
  getMeeting,
  getMeetings,
  getLiveKitToken,
  startMeeting,
  endMeeting,
  startRecording,
  stopRecording,
  uploadRecording,
  getMeetingRecordings,
  downloadRecording,
  removeParticipant,
  muteParticipant,
  admitParticipant,
  denyParticipant,
  shareFile,
  getPersonalMeeting,
} = require('./meeting.controller');
const { protect } = require('../../middleware/authMiddleware');

// Storage for normal file shares
const fileShareUpload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

// Storage for meeting recordings (supports larger blobs)
const recordingDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`);
  }
});

const recordingUpload = multer({
  storage: recordingDiskStorage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 GB limit
});

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.get('/livekit/token', getLiveKitToken);
router.get('/personal', protect, getPersonalMeeting);
router.get('/:id', getMeeting);

// Meeting Lifecycle & Admin Controls
router.post('/:id/start', protect, startMeeting);
router.post('/:id/end', protect, endMeeting);
router.post('/:id/remove', protect, removeParticipant);
router.post('/:id/mute', protect, muteParticipant);
router.post('/:id/admit', protect, admitParticipant);
router.post('/:id/deny', protect, denyParticipant);
router.post('/:id/share', protect, fileShareUpload.single('file'), shareFile);

// Meeting Recording Controls & Upload
router.post('/:id/recording/start', protect, startRecording);
router.post('/:id/recording/stop', protect, stopRecording);
router.post('/:id/recordings', protect, recordingUpload.single('recording'), uploadRecording);
router.get('/:id/recordings', protect, getMeetingRecordings);
router.get('/:id/recordings/:recordingId/download', downloadRecording);

module.exports = router;
