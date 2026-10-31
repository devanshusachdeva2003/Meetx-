const crypto = require('crypto');
const Memory = require('./memory.model');

// Get all memories with filtering & search
exports.getMemories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, search, favorite, month, year, sort = 'newest' } = req.query;

    const query = { user: userId };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (favorite === 'true') {
      query.isFavorite = true;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Filter by year & month if provided
    if (year) {
      const yr = parseInt(year);
      const start = new Date(yr, month !== undefined ? parseInt(month) : 0, 1);
      const end = new Date(yr, month !== undefined ? parseInt(month) + 1 : 12, 1);
      query.date = { $gte: start, $lt: end };
    }

    const sortOptions = {};
    if (sort === 'oldest') {
      sortOptions.date = 1;
    } else if (sort === 'recently_added') {
      sortOptions.createdAt = -1;
    } else {
      // default: newest date first
      sortOptions.date = -1;
    }

    const memories = await Memory.find(query).sort(sortOptions).lean();

    res.status(200).json({ memories });
  } catch (error) {
    next(error);
  }
};

// "On This Day" memories (same month and day from past years or past months)
exports.getOnThisDay = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed for aggregation
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    // Find memories matching the month and day, but from a different year (or earlier)
    const onThisDayMemories = await Memory.aggregate([
      {
        $match: {
          user: new (require('mongoose').Types.ObjectId)(userId),
        },
      },
      {
        $addFields: {
          memMonth: { $month: '$date' },
          memDay: { $dayOfMonth: '$date' },
          memYear: { $year: '$date' },
        },
      },
      {
        $match: {
          memMonth: currentMonth,
          memDay: currentDay,
          memYear: { $lt: currentYear },
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.status(200).json({
      count: onThisDayMemories.length,
      memories: onThisDayMemories,
      date: today,
    });
  } catch (error) {
    next(error);
  }
};

// Get memory stats summary
exports.getMemoryStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const total = await Memory.countDocuments({ user: userId });
    const favorites = await Memory.countDocuments({ user: userId, isFavorite: true });
    const photos = await Memory.countDocuments({ user: userId, mediaType: 'image' });
    const videos = await Memory.countDocuments({ user: userId, mediaType: 'video' });

    const categoryStats = await Memory.aggregate([
      { $match: { user: new (require('mongoose').Types.ObjectId)(userId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      total,
      favorites,
      photos,
      videos,
      categoryStats: categoryStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
};

// Create a new memory
exports.createMemory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      mediaUrl,
      mediaType,
      date,
      location,
      category,
      tags,
      isFavorite,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!mediaUrl) {
      return res.status(400).json({ error: 'Photo or video media is required' });
    }

    // Process tags
    let formattedTags = [];
    if (Array.isArray(tags)) {
      formattedTags = tags.map((t) => t.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      formattedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const memory = await Memory.create({
      user: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      mediaUrl,
      mediaType: mediaType === 'video' ? 'video' : 'image',
      date: date ? new Date(date) : new Date(),
      location: location ? location.trim() : '',
      category: category || 'Friends',
      tags: formattedTags,
      isFavorite: !!isFavorite,
    });

    res.status(201).json({ memory, message: 'Memory created successfully' });
  } catch (error) {
    next(error);
  }
};

// Update memory
exports.updateMemory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title,
      description,
      mediaUrl,
      mediaType,
      date,
      location,
      category,
      tags,
      isFavorite,
    } = req.body;

    const memory = await Memory.findOne({ _id: id, user: userId });
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found or unauthorized' });
    }

    if (title !== undefined) memory.title = title.trim();
    if (description !== undefined) memory.description = description.trim();
    if (mediaUrl !== undefined) memory.mediaUrl = mediaUrl;
    if (mediaType !== undefined) memory.mediaType = mediaType;
    if (date !== undefined) memory.date = new Date(date);
    if (location !== undefined) memory.location = location.trim();
    if (category !== undefined) memory.category = category;
    if (isFavorite !== undefined) memory.isFavorite = !!isFavorite;

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        memory.tags = tags.map((t) => t.trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        memory.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    await memory.save();

    res.status(200).json({ memory, message: 'Memory updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete memory
exports.deleteMemory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const memory = await Memory.findOneAndDelete({ _id: id, user: userId });
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Memory deleted' });
  } catch (error) {
    next(error);
  }
};

// Toggle favorite
exports.toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const memory = await Memory.findOne({ _id: id, user: userId });
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found or unauthorized' });
    }

    memory.isFavorite = !memory.isFavorite;
    await memory.save();

    res.status(200).json({
      success: true,
      isFavorite: memory.isFavorite,
      message: memory.isFavorite ? 'Added to favorites' : 'Removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};

// Toggle share / generate shareable link
exports.toggleShare = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const memory = await Memory.findOne({ _id: id, user: userId });
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found or unauthorized' });
    }

    memory.isShared = !memory.isShared;
    if (memory.isShared && !memory.shareToken) {
      memory.shareToken = crypto.randomBytes(16).toString('hex');
    }

    await memory.save();

    res.status(200).json({
      success: true,
      isShared: memory.isShared,
      shareToken: memory.isShared ? memory.shareToken : null,
      message: memory.isShared ? 'Share link generated' : 'Sharing disabled',
    });
  } catch (error) {
    next(error);
  }
};

// Public shared memory view (no authentication needed)
exports.getSharedMemory = async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    if (!shareToken) {
      return res.status(400).json({ error: 'Invalid share token' });
    }

    const memory = await Memory.findOne({ shareToken, isShared: true })
      .populate('user', 'name avatar')
      .lean();

    if (!memory) {
      return res.status(404).json({ error: 'Shared memory not found or link has expired' });
    }

    res.status(200).json({ memory });
  } catch (error) {
    next(error);
  }
};
