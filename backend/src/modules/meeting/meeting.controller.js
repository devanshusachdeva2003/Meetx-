const Meeting = require('./meeting.model');
const User = require('../auth/user.model');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const asyncHandler = require('../../utils/asyncHandler');
const cloudinary = require('../../utils/cloudinary');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const { broadcastMeetingEvent } = require('./meeting.socket');

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

// Helper: Convert WebM recording to high-quality MP4 using FFmpeg
const convertWebmToMp4 = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp4')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast',
        '-crf', '23',
      ])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err));
  });
};

// Generate a readable room ID in the format xxx-xxxx-xxx
const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const getChunk = (len) => {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `${getChunk(3)}-${getChunk(4)}-${getChunk(3)}`;
};

const createMeeting = asyncHandler(async (req, res) => {
  const { title, description, scheduledAt } = req.body;
  const roomId = generateRoomId();
  
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized. Must be logged in to create a meeting.');
  }

  const isFuture = scheduledAt && new Date(scheduledAt) > new Date();
  const meeting = await Meeting.create({ 
    roomId, 
    title, 
    description, 
    host: req.user.id,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    status: isFuture ? 'scheduled' : 'waiting',
  });
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

  const meeting = await Meeting.findOne({ roomId: room });
  if (meeting && meeting.status === 'ended') {
    res.status(403);
    throw new Error('This meeting has already ended.');
  }

  let isHost = false;
  if (meeting) {
    if (userId && meeting.host && meeting.host.toString() === userId) {
      isHost = true;
    }

    const validUserId = (userId && userId !== "undefined" && userId.trim() !== "") ? userId : null;
    const attendee = {
      name: username.trim(),
      userId: validUserId,
      joinedAt: new Date()
    };

    const alreadyJoined = meeting.participants.some(p => {
      const pUserId = p.userId ? p.userId.toString() : null;
      return (validUserId && pUserId === validUserId) || (!validUserId && p.name === attendee.name);
    });

    if (!alreadyJoined) {
      meeting.participants.push(attendee);
      await meeting.save();
    }
  }

  const identity = `${username.trim().replace(/\s+/g, '_')}-${Math.random().toString(36).substring(2, 9)}`;
  const isLobby = !isHost && (!meeting || meeting.status !== 'live');
  const metadata = JSON.stringify({ isHost, isLobby });

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: identity, name: username, metadata },
  );

  if (isHost) {
    at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true, canPublishData: true });
  } else {
    // Non-hosts: full permissions only if meeting is live, otherwise restricted lobby
    const canJoinLive = meeting && meeting.status === 'live';
    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: canJoinLive,
      canSubscribe: canJoinLive,
      canPublishData: canJoinLive
    });
  }
  
  res.json({ token: await at.toJwt() });
});

// Admin: Start Meeting
const startMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meeting = await Meeting.findOne({ roomId: id });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  if (meeting.host.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Forbidden. Only the meeting host can start the meeting.');
  }

  if (meeting.status === 'ended') {
    res.status(400);
    throw new Error('Cannot start a meeting that has ended.');
  }

  meeting.status = 'live';
  meeting.startedAt = meeting.startedAt || new Date();
  await meeting.save();

  broadcastMeetingEvent(id, 'meeting:started', {
    roomId: id,
    startedAt: meeting.startedAt,
    host: { id: req.user.id, name: req.user.name }
  });

  // Automatically admit participants from lobby in LiveKit
  try {
    const roomService = getRoomService();
    const participants = await roomService.listParticipants(id);
    for (const p of participants) {
      let meta = {};
      try { meta = JSON.parse(p.metadata || '{}'); } catch(e) {}
      if (meta.isLobby) {
        meta.isLobby = false;
        await roomService.updateParticipant(id, p.identity, JSON.stringify(meta), {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true
        });
      }
    }
  } catch (err) {
    console.warn('LiveKit participant update notice:', err.message);
  }

  res.json({ success: true, message: 'Meeting is now live', meeting });
});

// Admin: End Meeting for Everyone
const endMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;

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
    throw new Error('Forbidden. Only host can end meeting for everyone.');
  }

  meeting.status = 'ended';
  meeting.endedAt = new Date();
  meeting.isRecording = false;
  await meeting.save();

  broadcastMeetingEvent(id, 'meeting:ended', {
    roomId: id,
    endedAt: meeting.endedAt
  });

  try {
    const roomService = getRoomService();
    await roomService.deleteRoom(id);
  } catch (err) {
    console.warn('LiveKit deleteRoom notice:', err.message);
  }

  res.json({ success: true, message: 'Meeting ended successfully' });
});

// Admin: Start Recording
const startRecording = asyncHandler(async (req, res) => {
  const { id } = req.params;

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
    throw new Error('Forbidden. Only host can start meeting recording.');
  }

  if (meeting.status !== 'live') {
    res.status(400);
    throw new Error('Cannot start recording. Meeting is not live.');
  }

  if (meeting.isRecording) {
    res.status(400);
    throw new Error('A recording is already active for this meeting.');
  }

  meeting.isRecording = true;
  meeting.recordingStartedAt = new Date();
  meeting.recordingOwner = req.user.id;
  await meeting.save();

  broadcastMeetingEvent(id, 'recording:started', {
    roomId: id,
    recordingStartedAt: meeting.recordingStartedAt,
    recorderName: req.user.name || 'Host'
  });

  res.json({
    success: true,
    message: 'Recording started',
    recordingStartedAt: meeting.recordingStartedAt
  });
});

// Admin: Stop Recording
const stopRecording = asyncHandler(async (req, res) => {
  const { id } = req.params;

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
    throw new Error('Forbidden. Only host can stop meeting recording.');
  }

  meeting.isRecording = false;
  await meeting.save();

  broadcastMeetingEvent(id, 'recording:stop', { roomId: id });

  res.json({ success: true, message: 'Recording stopped' });
});

// Admin: Upload Recording & Transcode to MP4
const uploadRecording = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const duration = Math.round(Number(req.body.duration) || 0);

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
    throw new Error('Forbidden. Only host can upload recording.');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No recording file provided');
  }

  const recordingsDir = path.join(process.cwd(), 'uploads', 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const inputPath = req.file.path;
  const mp4FileName = `MeetX-Recording-${id}-${Date.now()}.mp4`;
  const outputPath = path.join(recordingsDir, mp4FileName);

  broadcastMeetingEvent(id, 'recording:processing', { roomId: id, status: 'processing' });

  const recordingEntry = {
    recordingOwner: req.user.id,
    ownerName: req.user.name || 'Host',
    startTime: meeting.recordingStartedAt || new Date(Date.now() - duration * 1000),
    endTime: new Date(),
    duration,
    fileUrl: `/uploads/recordings/${mp4FileName}`,
    localPath: outputPath,
    format: 'mp4',
    status: 'processing',
    size: 0
  };

  meeting.recordings.push(recordingEntry);
  meeting.isRecording = false;
  await meeting.save();

  const savedRecording = meeting.recordings[meeting.recordings.length - 1];
  const savedRecordingId = savedRecording._id;

  // Process FFmpeg transcode asynchronously
  (async () => {
    try {
      console.log(`[FFmpeg] Transcoding ${inputPath} -> ${outputPath}`);
      await convertWebmToMp4(inputPath, outputPath);

      const stats = fs.statSync(outputPath);
      const fileSize = stats.size;
      let finalFileUrl = `/uploads/recordings/${mp4FileName}`;

      if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
          const cloudRes = await cloudinary.uploader.upload(outputPath, {
            resource_type: 'video',
            folder: 'meetx_recordings',
            public_id: `meetx_rec_${id}_${Date.now()}`
          });
          if (cloudRes.secure_url) {
            finalFileUrl = cloudRes.secure_url;
          }
        } catch (cErr) {
          console.warn('[FFmpeg] Cloudinary upload skipped, using local MP4:', cErr.message);
        }
      }

      if (fs.existsSync(inputPath)) {
        try { fs.unlinkSync(inputPath); } catch (e) {}
      }

      const updatedMeeting = await Meeting.findOne({ roomId: id });
      if (updatedMeeting) {
        const rec = updatedMeeting.recordings.id(savedRecordingId);
        if (rec) {
          rec.status = 'ready';
          rec.fileUrl = finalFileUrl;
          rec.size = fileSize;
          rec.duration = duration;
          await updatedMeeting.save();

          broadcastMeetingEvent(id, 'recording:completed', {
            roomId: id,
            recording: rec
          });
          console.log(`[FFmpeg] Successfully generated MP4 for ${savedRecordingId}`);
        }
      }
    } catch (err) {
      console.error('[FFmpeg] Transcoding failed:', err);
      const updatedMeeting = await Meeting.findOne({ roomId: id });
      if (updatedMeeting) {
        const rec = updatedMeeting.recordings.id(savedRecordingId);
        if (rec) {
          rec.status = 'failed';
          await updatedMeeting.save();
          broadcastMeetingEvent(id, 'recording:failed', {
            roomId: id,
            error: 'Failed to transcode recording into MP4.'
          });
        }
      }
    }
  })();

  res.json({
    success: true,
    message: 'Recording uploaded and queued for MP4 transcoding',
    recording: savedRecording
  });
});

// Authorized Users: Get Recordings
const getMeetingRecordings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meeting = await Meeting.findOne({ roomId: id });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  const userId = req.user.id;
  const isHost = meeting.host.toString() === userId.toString();
  const isParticipant = meeting.participants.some(
    (p) => p.userId && p.userId.toString() === userId.toString()
  );

  if (!isHost && !isParticipant) {
    res.status(403);
    throw new Error('Forbidden. You do not have access to recordings for this meeting.');
  }

  res.json({ recordings: meeting.recordings || [] });
});

// Authorized Users: Download Recording File
const downloadRecording = asyncHandler(async (req, res) => {
  const { id, recordingId } = req.params;
  const meeting = await Meeting.findOne({ roomId: id });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    res.status(401);
    throw new Error('Unauthorized');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  const isHost = meeting.host.toString() === userId.toString();
  const isParticipant = meeting.participants.some(
    (p) => p.userId && p.userId.toString() === userId.toString()
  );

  if (!isHost && !isParticipant) {
    res.status(403);
    throw new Error('Forbidden. You are not authorized to download this recording.');
  }

  const recording = meeting.recordings.id(recordingId);
  if (!recording) {
    res.status(404);
    throw new Error('Recording not found');
  }

  if (recording.status !== 'ready') {
    res.status(400);
    throw new Error(`Recording is not ready. Current status: ${recording.status}`);
  }

  if (recording.localPath && fs.existsSync(recording.localPath)) {
    return res.download(recording.localPath, `MeetX-${id}-${recordingId}.mp4`);
  }

  if (recording.fileUrl.startsWith('http')) {
    return res.redirect(recording.fileUrl);
  }

  const fallback = path.join(process.cwd(), recording.fileUrl);
  if (fs.existsSync(fallback)) {
    return res.download(fallback, `MeetX-${id}-${recordingId}.mp4`);
  }

  res.status(404);
  throw new Error('Recording file not found on server');
});

const getMeetings = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized. Must be logged in to view meetings.');
  }

  const type = req.query.type;
  let filter = { host: req.user.id, isPersonal: { $ne: true } };
  
  if (type === 'upcoming') {
    filter.scheduledAt = { $gte: new Date() };
  } else if (type === 'recent') {
    filter.$or = [
      { scheduledAt: { $lt: new Date() } },
      { scheduledAt: null }
    ];
  }

  const limit = req.query.limit ? parseInt(req.query.limit) : 0;
  let query = Meeting.find(filter).sort({ createdAt: -1 });
  
  if (limit > 0) {
    query = query.limit(limit);
  }

  const meetings = await query;
  res.json({ meetings });
});

const getPersonalMeeting = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  let meeting = await Meeting.findOne({ host: req.user.id, isPersonal: true });

  if (!meeting) {
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : 'my';
    const cleanName = userName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const shortId = generateRoomId().split('-')[0];
    const roomId = `${cleanName}-${shortId}`;
    
    meeting = await Meeting.create({
      roomId,
      title: `${userName}'s Personal Room`,
      description: 'Your personal meeting space',
      host: req.user.id,
      isPersonal: true,
      status: 'waiting',
    });
  }

  res.json({ meeting });
});

const removeParticipant = asyncHandler(async (req, res) => {
  const { id } = req.params;
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
  const { id } = req.params;
  const { identity, trackType, muted = true } = req.body;

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized');
  }

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
  for (const track of participant.tracks) {
    const isAudioTrack =
      track.type === 0 ||
      track.source === 2 ||
      String(track.type).toUpperCase() === 'AUDIO' ||
      String(track.source).toUpperCase() === 'MICROPHONE';

    const isVideoTrack =
      (track.type === 1 && track.source !== 3 && track.source !== 4) ||
      track.source === 1 ||
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
    res.json({ success: true, message: `No active ${trackType} track found for participant` });
    return;
  }

  res.json({ success: true, message: `Participant ${trackType} muted` });
});

const shareFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

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
    
    fs.unlinkSync(req.file.path);

    let finalUrl = result.secure_url;
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
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500);
    throw new Error('Cloudinary upload failed: ' + error.message);
  }
});

const admitParticipant = asyncHandler(async (req, res) => {
  const { id } = req.params;
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

module.exports = {
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
  shareFile,
  admitParticipant,
  denyParticipant: removeParticipant,
  getPersonalMeeting
};
