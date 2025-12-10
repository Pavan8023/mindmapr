const express = require('express');
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

// Update comment
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 PUT Update Comment:', req.params.id);

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId !== req.body.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { 
        text: req.body.text,
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    res.json(updatedComment);
  } catch (error) {
    console.error('❌ Error updating comment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE Comment:', req.params.id);

    const { userId } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;