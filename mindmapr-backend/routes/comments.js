const express = require('express');
const Comment = require('../models/comment');
const router = express.Router();

// Get comments for a question
router.get('/:questionId', async (req, res) => {
  try {
    const comments = await Comment.find({ questionId: req.params.questionId })
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment to question
router.post('/', async (req, res) => {
  try {
    const commentData = {
      ...req.body,
      createdAt: new Date(),
    };

    const comment = new Comment(commentData);
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;