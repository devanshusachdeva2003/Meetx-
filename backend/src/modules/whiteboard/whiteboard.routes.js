const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const controller = require('./whiteboard.controller');

// Public view by ID (for sharing invitation links)
router.get('/:id', controller.getBoardById);

// Protected routes (saving, creating, listing, deleting)
router.use(protect);

router.get('/', controller.getBoards);
router.post('/', controller.createBoard);
router.put('/:id', controller.updateBoard);
router.delete('/:id', controller.deleteBoard);

module.exports = router;
