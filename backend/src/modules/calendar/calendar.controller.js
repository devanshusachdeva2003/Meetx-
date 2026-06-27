const Event = require('./calendar.model');
const Meeting = require('../meeting/meeting.model');

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

// Create an event
async function createEvent(req, res) {
  try {
    const payload = req.body;
    if (req.user && req.user.id) payload.createdBy = req.user.id;
    
    // Check if user requested a video room
    const isMeeting = payload.isMeeting; 
    let roomId = null;
    
    if (isMeeting) {
      roomId = generateRoomId();
      payload.meetingId = roomId;
      // Automatically create a corresponding Meeting room
      await Meeting.create({
        roomId,
        title: payload.title,
        description: payload.description,
        host: req.user ? req.user.id : null,
        scheduledAt: payload.start
      });
    } else {
      payload.meetingId = null;
    }

    // Create a single event with the recurrence rule
    payload.recurrence = payload.recurrence || 'None';
    
    // Optionally calculate a recurrenceEndDate if you want to cap it.
    // For now, if Weekly/Daily/Monthly, we can set it to 1 year from now, or leave it infinite.
    if (payload.recurrence !== 'None') {
      if (payload.recurrenceEndDate) {
        payload.recurrenceEndDate = new Date(payload.recurrenceEndDate);
      } else {
        const endDate = new Date(payload.start);
        endDate.setFullYear(endDate.getFullYear() + 1); // Fallback cap at 1 year
        payload.recurrenceEndDate = endDate;
      }
    }

    const createdEvent = await Event.create(payload);
    res.status(201).json({ event: createdEvent });
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
    let rangeStart = null;
    let rangeEnd = null;

    if (start && end) {
      rangeStart = new Date(start);
      rangeEnd = new Date(end);
      query = {
        $or: [
          // Non-recurring events falling within the range
          {
            $or: [{ recurrence: 'None' }, { recurrence: { $exists: false } }],
            start: { $gte: rangeStart, $lte: rangeEnd }
          },
          // Recurring events that started before the range ends
          // and haven't ended before the range starts
          {
            recurrence: { $in: ['Daily', 'Weekly', 'Monthly'] },
            start: { $lte: rangeEnd },
            $or: [
              { recurrenceEndDate: { $gte: rangeStart } },
              { recurrenceEndDate: { $exists: false } },
              { recurrenceEndDate: null }
            ]
          }
        ]
      };
    }
    
    const events = await Event.find(query).sort({ start: 1 });
    const expandedEvents = [];

    events.forEach(ev => {
      if (!ev.recurrence || ev.recurrence === 'None') {
        expandedEvents.push(ev);
        return;
      }

      // Expansion logic for recurring events
      let currentStart = new Date(ev.start);
      let currentEnd = new Date(ev.end);
      const limitDate = ev.recurrenceEndDate && rangeEnd
        ? new Date(Math.min(ev.recurrenceEndDate.getTime(), rangeEnd.getTime()))
        : (rangeEnd || new Date('2100-01-01')); // Fallback if no rangeEnd

      let safety = 0; // Prevent infinite loop in case of errors
      while (currentStart <= limitDate && safety < 1000) {
        safety++;
        // If it falls in the requested window (or if no window was requested)
        if (!rangeStart || currentStart >= rangeStart) {
          expandedEvents.push({
            ...ev.toObject(),
            start: new Date(currentStart),
            end: new Date(currentEnd),
            // Create a pseudo-ID so frontend keys don't clash
            _id: `${ev._id}_${currentStart.getTime()}`,
            originalId: ev._id
          });
        }
        
        if (ev.recurrence === 'Daily') {
          currentStart.setDate(currentStart.getDate() + 1);
          currentEnd.setDate(currentEnd.getDate() + 1);
        } else if (ev.recurrence === 'Weekly') {
          currentStart.setDate(currentStart.getDate() + 7);
          currentEnd.setDate(currentEnd.getDate() + 7);
        } else if (ev.recurrence === 'Monthly') {
          currentStart.setMonth(currentStart.getMonth() + 1);
          currentEnd.setMonth(currentEnd.getMonth() + 1);
        } else {
          break;
        }
      }
    });

    // Re-sort expanded events by start time
    expandedEvents.sort((a, b) => a.start - b.start);

    res.json({ events: expandedEvents });
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
