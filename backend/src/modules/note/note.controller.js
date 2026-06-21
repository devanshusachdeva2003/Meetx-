const Note = require('./note.model');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Get all notes for logged in user
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const notes = await Note.find({ owner: req.user.id }).sort({ updatedAt: -1 });
  res.json({ notes });
});

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });

  if (!note) {
    res.status(404);
    throw new Error('Note not found');
  }

  res.json({ note });
});

// @desc    Create a note
// @route   POST /api/notes
// @access  Private
const createNote = asyncHandler(async (req, res) => {
  const { title, content, isPinned, meetingId, participants, actionItems, summary } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Please provide a title for the note');
  }

  const note = await Note.create({
    title,
    content,
    isPinned,
    owner: req.user.id,
    meetingId,
    participants,
    actionItems,
    summary
  });

  res.status(201).json({ note });
});

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });

  if (!note) {
    res.status(404);
    throw new Error('Note not found');
  }

  const updatedNote = await Note.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({ note: updatedNote });
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });

  if (!note) {
    res.status(404);
    throw new Error('Note not found');
  }

  await note.deleteOne();

  res.json({ id: req.params.id });
});

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
};
