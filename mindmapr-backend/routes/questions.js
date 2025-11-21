const express = require('express');
const Question = require('../models/Question');
const Comment = require('../models/comment');
const router = express.Router();

// Get all questions with filtering and sorting
router.get('/', async (req, res) => {
  try {
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
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new question
router.post('/', async (req, res) => {
  try {
    const questionData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const question = new Question(questionData);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
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