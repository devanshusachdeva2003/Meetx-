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
  const { title, description } = req.body;
  const roomId = (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
  
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized. Must be logged in to create a meeting.');
  }

  const meeting = await Meeting.create({ roomId, title, description, host: req.user.id });
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
  const { room, username, userId } = req.query;
  if (!room || !username) {
    res.status(400);
    throw new Error('Room and username are required');
  }

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    res.status(500);
    throw new Error('LiveKit API key or secret is not configured');
  }

  let isHost = false;
  const meeting = await Meeting.findOne({ roomId: room });
  
  if (meeting) {
    if (userId && meeting.host.toString() === userId) {
      isHost = true;
    }

    // Track attendee
    // If frontend sends an empty string or the string "undefined", treat it as a guest (null)
    const validUserId = (userId && userId !== "undefined" && userId.trim() !== "") ? userId : null;

    const attendee = {
      name: username.trim(),
      userId: validUserId,
      joinedAt: new Date()
    };

    // Prevent duplicate entries for the same user (by userId or name)
    const alreadyJoined = meeting.participants.some(p => {
      // Safely compare ObjectIds or Strings
      const pUserId = p.userId ? p.userId.toString() : null;
      return (validUserId && pUserId === validUserId) || (!validUserId && p.name === attendee.name);
    });

    if (!alreadyJoined) {
      meeting.participants.push(attendee);
      await meeting.save();
    }
  }

  const identity = `${username.trim().replace(/\s+/g, '_')}-${Math.random().toString(36).substring(2, 9)}`;
  const metadata = JSON.stringify({ isHost, isLobby: !isHost });

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: identity, name: username, metadata },
  );

  if (isHost) {
    at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true, canPublishData: true });
  } else {
    // Non-hosts start in lobby with restricted permissions
    at.addGrant({ roomJoin: true, room: room, canPublish: false, canSubscribe: false, canPublishData: false });
  }
  
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

  // LiveKit does NOT support remote unmute (security restriction).
  // Participants must unmute themselves. Only muting is allowed from the server.
  if (muted === false || muted === 'false') {
    res.status(400);
    throw new Error('Remote unmute is not permitted. Participants must unmute themselves.');
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

  let mutedCount = 0;
  console.log(`[MuteParticipant] identity=${identity} trackType=${trackType} tracks:`, 
    participant.tracks.map(t => ({ sid: t.sid, type: t.type, source: t.source, muted: t.muted }))
  );
  for (const track of participant.tracks) {
    // LiveKit protobuf enums:
    //   TrackType  => AUDIO=0, VIDEO=1, DATA=2
    //   TrackSource => UNKNOWN=0, CAMERA=1, MICROPHONE=2, SCREEN_SHARE=3, SCREEN_SHARE_AUDIO=4
    const isAudioTrack =
      track.type === 0 ||                                  // TrackType.AUDIO
      track.source === 2 ||                               // TrackSource.MICROPHONE
      String(track.type).toUpperCase() === 'AUDIO' ||
      String(track.source).toUpperCase() === 'MICROPHONE';

    const isVideoTrack =
      (track.type === 1 && track.source !== 3 && track.source !== 4) || // TrackType.VIDEO (not screen share)
      track.source === 1 ||                               // TrackSource.CAMERA
      (String(track.type).toUpperCase() === 'VIDEO' && !String(track.source).toUpperCase().includes('SCREEN')) ||
      String(track.source).toUpperCase() === 'CAMERA';

    if (trackType === 'audio' && isAudioTrack) {
      await roomService.mutePublishedTrack(id, identity, track.sid, true);
      mutedCount++;
    }
    if (trackType === 'video' && isVideoTrack) {
      await roomService.mutePublishedTrack(id, identity, track.sid, true);
      mutedCount++;
    }
  }

  if (mutedCount === 0) {
    // No matching track found — participant may not have their mic/camera on
    res.json({ success: true, message: `No active ${trackType} track found for participant` });
    return;
  }

  res.json({ success: true, message: `Participant ${trackType} muted` });
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

const admitParticipant = asyncHandler(async (req, res) => {
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
    throw new Error('Forbidden. Only host can admit participants.');
  }

  const roomService = getRoomService();
  const participant = await roomService.getParticipant(id, identity);
  if (!participant) {
    res.status(404);
    throw new Error('Participant not found in room');
  }

  let metadataObj = {};
  try {
    metadataObj = JSON.parse(participant.metadata || '{}');
  } catch (e) {}
  
  metadataObj.isLobby = false;

  await roomService.updateParticipant(id, identity, JSON.stringify(metadataObj), {
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  res.json({ success: true, message: 'Participant admitted' });
});

const endMeeting = asyncHandler(async (req, res) => {
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
    throw new Error('Forbidden. Only host can end meeting.');
  }

  const roomService = getRoomService();
  await roomService.deleteRoom(id);

  res.json({ success: true, message: 'Meeting ended' });
});

module.exports = { createMeeting, getMeeting, getMeetings, getLiveKitToken, removeParticipant, muteParticipant, shareFile, admitParticipant, endMeeting, denyParticipant: removeParticipant };
