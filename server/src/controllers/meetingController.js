const Meeting = require('../models/Meeting');

async function createMeeting(req, res) {
  const { title } = req.body;
  const roomId = (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
  const meeting = await Meeting.create({ roomId, title, host: req.userId });
  res.json({ meeting });
}

async function getMeeting(req, res) {
  const { id } = req.params;
  const meeting = await Meeting.findOne({ roomId: id });
  if (!meeting) return res.status(404).json({ message: 'Not found' });
  res.json({ meeting });
}

module.exports = { createMeeting, getMeeting };
