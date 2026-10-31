const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const controller = require('./memory.controller');

// Public shared memory view
router.get('/shared/:shareToken', controller.getSharedMemory);

// Protected routes
router.use(protect);

router.get('/', controller.getMemories);
router.get('/on-this-day', controller.getOnThisDay);
router.get('/stats', controller.getMemoryStats);
router.post('/', controller.createMemory);
router.put('/:id', controller.updateMemory);
router.delete('/:id', controller.deleteMemory);
router.post('/:id/favorite', controller.toggleFavorite);
router.post('/:id/share', controller.toggleShare);

module.exports = router;
