const Meeting = require('./meeting.model');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const asyncHandler = require('../../utils/asyncHandler');
const cloudinary = require('../../utils/cloudinary');
const fs = require('fs');

const getRoomService = () => {
  if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    throw new Error('LiveKit configuration is missing. Ensure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are set.');
  }
  return new RoomServiceClient(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );
};

const createMeeting = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const roomId = (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
  
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized. Must be logged in to create a meeting.');
  }

  const meeting = await Meeting.create({ roomId, title, host: req.user.id });
  res.json({ meeting });
});

const getMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meeting = await Meeting.findOne({ roomId: id });
  
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  
  res.json({ meeting });
});

const getLiveKitToken = asyncHandler(async (req, res) => {
  const { room, username } = req.query;
  if (!room || !username) {
    res.status(400);
    throw new Error('Room and username are required');
  }

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    res.status(500);
    throw new Error('LiveKit API key or secret is not configured');
  }

  const identity = `${username.trim().replace(/\s+/g, '_')}-${Math.random().toString(36).substring(2, 9)}`;
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: identity, name: username },
  );

  at.addGrant({ roomJoin: true, room: room });
  res.json({ token: await at.toJwt() });
});

const getMeetings = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized. Must be logged in to view meetings.');
  }

  const meetings = await Meeting.find({ host: req.user.id }).sort({ createdAt: -1 });
  res.json({ meetings });
});

const removeParticipant = asyncHandler(async (req, res) => {
  const { id } = req.params; // room id
  const { identity } = req.body;

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const meeting = await Meeting.findOne({ roomId: id });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  if (meeting.host.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Forbidden. Only host can remove participants.');
  }

  const roomService = getRoomService();
  await roomService.removeParticipant(id, identity);

  res.json({ success: true, message: 'Participant removed' });
});

const muteParticipant = asyncHandler(async (req, res) => {
  const { id } = req.params; // room id
  const { identity, trackType, muted = true } = req.body; // 'audio' or 'video'

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const meeting = await Meeting.findOne({ roomId: id });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  if (meeting.host.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Forbidden. Only host can mute participants.');
  }

  const roomService = getRoomService();
  const participant = await roomService.getParticipant(id, identity);
  if (!participant) {
    res.status(404);
    throw new Error('Participant not found in room');
  }

  for (const track of participant.tracks) {
    const isAudio = track.type === 1 || track.type === 'AUDIO';
    const isVideo = track.type === 2 || track.type === 'VIDEO';
    
    if (trackType === 'audio' && isAudio) {
      await roomService.mutePublishedTrack(id, identity, track.sid, muted);
    }
    if (trackType === 'video' && isVideo) {
      await roomService.mutePublishedTrack(id, identity, track.sid, muted);
    }
  }

  res.json({ success: true, message: `Participant ${trackType} ${muted ? 'muted' : 'unmuted'}` });
});

const shareFile = asyncHandler(async (req, res) => {
  const { id } = req.params; // room id

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const meeting = await Meeting.findOne({ roomId: id });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  if (meeting.host.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Forbidden. Only host can share files.');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  try {
    const originalNameWithoutExt = req.file.originalname.includes('.') 
      ? req.file.originalname.split('.').slice(0, -1).join('.') 
      : req.file.originalname;

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      folder: 'meetx_shared_files',
      public_id: `${originalNameWithoutExt}_${Date.now()}`
    });
    
    // Clean up local temp file
    fs.unlinkSync(req.file.path);

    let finalUrl = result.secure_url;
    // If it's a PDF, force download to bypass inline viewing restrictions
    // (We use resource_type 'auto' so it uploads as 'image' and avoids the 401 Raw restriction)
    if (result.format === 'pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      finalUrl = finalUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    res.json({ 
      success: true, 
      file: {
        url: finalUrl,
        name: req.file.originalname,
        type: result.resource_type,
        format: result.format
      }
    });
  } catch (error) {
    // Attempt to clean up
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500);
    throw new Error('Cloudinary upload failed: ' + error.message);
  }
});

module.exports = { createMeeting, getMeeting, getMeetings, getLiveKitToken, removeParticipant, muteParticipant, shareFile };
