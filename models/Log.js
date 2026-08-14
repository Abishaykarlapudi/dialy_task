const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  dateKey: {
    type: String, // YYYY-MM-DD
    required: true
  },
  completedTaskIds: {
    type: [String],
    default: []
  }
});

// Composite unique index so one log record per userId per dateKey
LogSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('Log', LogSchema);
