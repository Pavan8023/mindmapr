const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000','https://mindmapr.netlify.app'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection - Use the correct database name
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmapr') // Changed to mindmapr
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Routes
app.use('/api/questions', require('./routes/questions'));
app.use('/api/comments', require('./routes/comments'));

// Test route with database info
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ Backend server is working!',
    database: mongoose.connection.db?.databaseName || 'Unknown',
    connected: mongoose.connection.readyState === 1
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API available at http://localhost:${PORT}/api`);
});