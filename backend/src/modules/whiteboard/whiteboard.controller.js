const Whiteboard = require('./whiteboard.model');

// List user's boards
exports.getBoards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const boards = await Whiteboard.find({ creator: userId })
      .select('_id title thumbnail updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({ boards });
  } catch (error) {
    next(error);
  }
};

// Get board by ID (publicly viewable if isPublic: true or if creator)
exports.getBoardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const board = await Whiteboard.findById(id)
      .populate('creator', 'name avatar email')
      .lean();

    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    res.status(200).json({ board });
  } catch (error) {
    next(error);
  }
};

// Create a new board
exports.createBoard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, elements, thumbnail } = req.body;

    const board = await Whiteboard.create({
      title: title?.trim() || 'Untitled Whiteboard',
      creator: userId,
      elements: elements || [],
      thumbnail: thumbnail || null,
      lastEditedBy: userId,
    });

    res.status(201).json({ board, message: 'Whiteboard created successfully' });
  } catch (error) {
    next(error);
  }
};

// Save / Update board
exports.updateBoard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, elements, thumbnail } = req.body;

    const board = await Whiteboard.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    if (title !== undefined) board.title = title.trim();
    if (elements !== undefined) board.elements = elements;
    if (thumbnail !== undefined) board.thumbnail = thumbnail;
    board.lastEditedBy = userId;

    await board.save();

    res.status(200).json({ board, message: 'Whiteboard saved successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete board
exports.deleteBoard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const board = await Whiteboard.findOneAndDelete({ _id: id, creator: userId });
    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Whiteboard deleted' });
  } catch (error) {
    next(error);
  }
};
