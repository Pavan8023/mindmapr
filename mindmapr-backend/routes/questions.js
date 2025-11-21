const express = require('express');
const Question = require('../models/questions');
const Comment = require('../models/comments');
const router = express.Router();

// Get all questions with filtering and sorting
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET Questions request received:', req.query);
    
    // Check if database is connected
    if (req.app.get('dbStatus') !== 'connected') {
      return res.status(503).json({ 
        message: 'Database not connected',
        error: 'Please check MongoDB connection'
      });
    }
    
    const { category, sort } = req.query;
    
    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }

    let sortOptions = {};
    if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'category') {
      sortOptions = { category: 1, createdAt: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    const questions = await Question.find(query).sort(sortOptions);
    console.log(`✅ Found ${questions.length} questions`);
    res.json(questions);
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    res.status(500).json({ 
      message: 'Error fetching questions',
      error: error.message 
    });
  }
});

// Create new question
router.post('/', async (req, res) => {
  try {
    console.log('📥 POST Question request received:', req.body);
    
    const questionData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('💾 Attempting to save question...');
    const question = new Question(questionData);
    const savedQuestion = await question.save();
    
    console.log('✅ Question created successfully:', savedQuestion._id);
    console.log('📊 Saved question:', savedQuestion);
    
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error('❌ Error creating question:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    res.status(400).json({ 
      message: 'Error creating question',
      error: error.message 
    });
  }
});

// Get single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update question
router.put('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user owns the question
    if (question.userId !== req.body.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user owns the question
    if (question.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete all comments associated with the question
    await Comment.deleteMany({ questionId: req.params.id });
    
    // Delete the question
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;