const Meeting = require('./meeting.model');
const { AccessToken } = require('livekit-server-sdk');

async function createMeeting(req, res) {
  try {
    const { title } = req.body;
    const roomId = (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
    
    // Ensure only logged in users can create meetings
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized. Must be logged in to create a meeting.' });
    }

    const meeting = await Meeting.create({ roomId, title, host: req.user.id });
    res.json({ meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Failed to create meeting', error: error.message });
  }
}

async function getMeeting(req, res) {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findOne({ roomId: id });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get meeting', error: error.message });
  }
}

async function getLiveKitToken(req, res) {
  try {
    const { room, username } = req.query;
    if (!room || !username) {
      return res.status(400).json({ error: "room and username are required" });
    }

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return res
        .status(500)
        .json({ error: "LiveKit API key or secret is not configured" });
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: username },
    );

    at.addGrant({ roomJoin: true, room: room });

    res.json({ token: await at.toJwt() });
  } catch (error) {
    console.error('Error getting LiveKit token:', error);
    res.status(500).json({ message: 'Failed to generate token', error: error.message });
  }
}

module.exports = { createMeeting, getMeeting, getLiveKitToken };
