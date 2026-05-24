const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/calendarController');
const { verifyTokenMiddleware } = require('../utils/jwt');

// Public: GET /api/calendar?start=2024-05-01&end=2024-05-31
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes require auth middleware (optional)
router.post('/', verifyTokenMiddleware, createEvent);
router.put('/:id', verifyTokenMiddleware, updateEvent);
router.delete('/:id', verifyTokenMiddleware, deleteEvent);

module.exports = router;
