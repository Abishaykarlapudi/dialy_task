const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const Log = require('./models/Log');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rocksun:Test12345@job-portal.r8efxop.mongodb.net/dialy_task?appName=dialy_task';
const JWT_SECRET = process.env.JWT_SECRET || 'taskpulse_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==================== AUTH ROUTES ====================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id.toString(), name: user.name, email: user.email },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email/username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email/username or password.' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      user: { id: user._id.toString(), name: user.name, email: user.email },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ==================== TASK ROUTES ====================

// GET TASKS FOR USER
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const tasks = await Task.find({ userId });
    const formatted = tasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      type: t.type,
      date: t.date,
      category: t.category,
      time: t.time,
      notes: t.notes,
      createdAt: t.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// CREATE TASK
app.post('/api/tasks', async (req, res) => {
  try {
    const { userId, title, type, date, category, time, notes } = req.body;

    if (!userId || !title || !type) {
      return res.status(400).json({ error: 'userId, title and type are required' });
    }

    const newTask = new Task({
      userId,
      title,
      type,
      date: type === 'specific' ? date : null,
      category: category || 'General',
      time: time || '09:00',
      notes: notes || ''
    });

    await newTask.save();

    res.status(201).json({
      id: newTask._id.toString(),
      title: newTask.title,
      type: newTask.type,
      date: newTask.date,
      category: newTask.category,
      time: newTask.time,
      notes: newTask.notes,
      createdAt: newTask.createdAt
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// DELETE TASK
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    await Task.deleteOne({ _id: id, userId });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ==================== LOG ROUTES ====================

// GET COMPLETION LOGS FOR USER
app.get('/api/logs', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const logs = await Log.find({ userId });
    const map = {};
    logs.forEach(l => {
      map[l.dateKey] = l.completedTaskIds;
    });

    res.json(map);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// SAVE COMPLETION LOGS FOR USER DATE
app.post('/api/logs', async (req, res) => {
  try {
    const { userId, dateKey, completedTaskIds } = req.body;

    if (!userId || !dateKey) {
      return res.status(400).json({ error: 'userId and dateKey are required' });
    }

    await Log.findOneAndUpdate(
      { userId, dateKey },
      { completedTaskIds },
      { upsert: true, new: true }
    );

    res.json({ message: 'Logs saved successfully' });
  } catch (err) {
    console.error('Save log error:', err);
    res.status(500).json({ error: 'Failed to save completion log' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 TaskPulse Server running at http://localhost:${PORT}`);
});
