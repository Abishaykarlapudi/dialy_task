const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['specific', 'daily'],
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format for specific tasks
    default: null
  },
  category: {
    type: String,
    default: 'General'
  },
  time: {
    type: String,
    default: '09:00'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);
