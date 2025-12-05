const express = require('express');
const mongoose = require('mongoose');
const Question = require('../models/questions');
const Comment = require('../models/comments');
const router = express.Router();

// Get all questions with filtering and sorting
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET Questions request received:', req.query);
    
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

    console.log('🔍 MongoDB query:', query);
    console.log('🔍 Sort options:', sortOptions);

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

    console.log('💾 Saving question data:', questionData);
    const question = new Question(questionData);
    const savedQuestion = await question.save();
    
    console.log('✅ Question created successfully:', savedQuestion._id);
    
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error('❌ Error creating question:', error);
    res.status(400).json({ 
      message: 'Error creating question',
      error: error.message 
    });
  }
});

// Get single question
router.get('/:id', async (req, res) => {
  try {
    console.log('📥 GET Single Question:', req.params.id);
    
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('❌ Error fetching question:', error);
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;