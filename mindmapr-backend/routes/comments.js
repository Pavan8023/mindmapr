const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/comments');
const router = express.Router();

// Get comments for a question
router.get('/:questionId', async (req, res) => {
  try {
    console.log('📥 GET Comments for question:', req.params.questionId);

    const comments = await Comment.find({ questionId: req.params.questionId })
      .sort({ createdAt: 1 });
    
    console.log(`✅ Found ${comments.length} comments for question ${req.params.questionId}`);
    res.json(comments);
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add comment to question
router.post('/', async (req, res) => {
  try {
    console.log('📥 POST Comment request received:', req.body);
    
    const commentData = {
      ...req.body,
      createdAt: new Date(),
    };

    const comment = new Comment(commentData);
    await comment.save();
    
    console.log('✅ Comment created successfully:', comment._id);
    res.status(201).json(comment);
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    res.status(400).json({ 
      message: 'Error creating comment',
      error: error.message 
    });
  }
});



module.exports = router;