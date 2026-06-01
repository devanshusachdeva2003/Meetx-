const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('./calendar.controller');
const { protect } = require('../../middleware/authMiddleware');

// Public: GET /api/calendar?start=2024-05-01&end=2024-05-31
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes require auth middleware
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
