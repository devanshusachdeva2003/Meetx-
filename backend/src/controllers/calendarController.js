const Event = require('../models/Event');

// Create an event
async function createEvent(req, res) {
  try {
    const payload = req.body;
    // optional: attach creator
    if (req.userId) payload.createdBy = req.userId;
    const ev = await Event.create(payload);
    res.status(201).json({ event: ev });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create event' });
  }
}

// Get events by query (range or all)
async function getEvents(req, res) {
  try {
    const { start, end } = req.query;
    let query = {};
    if (start && end) {
      query = { start: { $gte: new Date(start) }, end: { $lte: new Date(end) } };
    }
    const events = await Event.find(query).sort({ start: 1 });
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch events' });
  }
}

async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    res.json({ event: ev });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch event' });
  }
}

async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const changes = req.body;
    const ev = await Event.findByIdAndUpdate(id, changes, { new: true });
    if (!ev) return res.status(404).json({ message: 'Not found' });
    res.json({ event: ev });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update event' });
  }
}

async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const ev = await Event.findByIdAndDelete(id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete event' });
  }
}

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent };
