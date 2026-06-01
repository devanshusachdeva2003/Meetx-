const Meeting = require('./meeting.model');
const { AccessToken } = require('livekit-server-sdk');
const asyncHandler = require('../../utils/asyncHandler');

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

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: username },
  );

  at.addGrant({ roomJoin: true, room: room });
  res.json({ token: await at.toJwt() });
});

module.exports = { createMeeting, getMeeting, getLiveKitToken };
