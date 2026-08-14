/**
 * app.js - Main Application Coordinator for TaskPulse
 */

const API_BASE = '/api';

// Memory cache for active user's tasks & completion logs
let memoryTasks = [];
let memoryLogs = {};

function getTaskStorageKey() {
  return currentUser ? `tp_tasks_${currentUser.id}` : 'tp_tasks_guest';
}

function getLogStorageKey() {
  return currentUser ? `tp_logs_${currentUser.id}` : 'tp_logs_guest';
}

/**
 * Fetch tasks (API + localStorage sync)
 */
function getUserTasks() {
  return memoryTasks;
}

/**
 * Fetch logs (API + localStorage sync)
 */
function getUserCompletionLogs() {
  return memoryLogs;
}

/**
 * Load tasks and logs from Server or LocalStorage
 */
async function loadUserData() {
  if (!currentUser) return;

  try {
    const [tasksRes, logsRes] = await Promise.all([
      fetch(`${API_BASE}/tasks?userId=${currentUser.id}`),
      fetch(`${API_BASE}/logs?userId=${currentUser.id}`)
    ]);

    if (tasksRes.ok && logsRes.ok) {
      memoryTasks = await tasksRes.json();
      memoryLogs = await logsRes.json();
    } else {
      loadUserDataFromLocalStorage();
    }
  } catch (err) {
    console.warn('Using local data fallback', err);
    loadUserDataFromLocalStorage();
  }

  if (memoryTasks.length === 0) {
    await seedDefaultTasksIfEmpty();
  }

  refreshDashboard();
}

function loadUserDataFromLocalStorage() {
  const localTasks = localStorage.getItem(getTaskStorageKey());
  const localLogs = localStorage.getItem(getLogStorageKey());
  memoryTasks = localTasks ? JSON.parse(localTasks) : [];
  memoryLogs = localLogs ? JSON.parse(localLogs) : {};
}

function saveUserDataToLocalStorage() {
  localStorage.setItem(getTaskStorageKey(), JSON.stringify(memoryTasks));
  localStorage.setItem(getLogStorageKey(), JSON.stringify(memoryLogs));
}

/**
 * Called by auth.js when user is logged in
 */
function onUserAuthenticated(user) {
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-display-name');

  if (avatarEl) avatarEl.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  if (nameEl) nameEl.textContent = user.name || 'User';

  initNotifications();
  loadUserData();
}

/**
 * Seed initial sample habits and recent completion logs so app is full & interactive
 */
async function seedDefaultTasksIfEmpty() {
  const todayObj = new Date();
  const todayKey = formatDateKey(todayObj);

  const sampleTasks = [
    {
      title: '💧 Drink 2.5L Water',
      type: 'daily',
      category: 'Health',
      time: '08:00',
      notes: 'Stay hydrated throughout the day'
    },
    {
      title: '🏃 30 Min Morning Workout',
      type: 'daily',
      category: 'Health',
      time: '07:30',
      notes: 'Cardio or resistance training'
    },
    {
      title: '📚 Read 15 Pages of Book',
      type: 'daily',
      category: 'Learning',
      time: '21:00',
      notes: 'Atomic Habits / Personal growth'
    },
    {
      title: '🎯 Review Weekly Project Goals',
      type: 'specific',
      date: todayKey,
      category: 'Productivity',
      time: '11:00',
      notes: 'Finalize sprint deliverables'
    }
  ];

  for (const st of sampleTasks) {
    await createNewTask(st);
  }

  // Seed past 3 days as completed for exciting initial 3-day streak!
  for (let i = 1; i <= 3; i++) {
    const pastKey = getOffsetDateKey(todayObj, -i);
    const dailyIds = memoryTasks.filter(t => t.type === 'daily').map(t => t.id);
    await saveCompletionLogsForDate(pastKey, dailyIds);
  }
}

/**
 * Full Dashboard UI Refresh (Streak Banner, Calendar, Sidebar Checklist)
 */
function refreshDashboard() {
  const streakStats = calculateStreakStats(memoryTasks, memoryLogs);
  updateStreakBannerUI(streakStats);

  renderCalendar();
  renderTodaySidebarHabits(memoryTasks, memoryLogs);
}

/**
 * Render Today's Habit checklist in right sidebar
 */
function renderTodaySidebarHabits(tasks, logs) {
  const sidebarListEl = document.getElementById('today-habits-list');
  const todayTagEl = document.getElementById('sidebar-today-date');

  const todayDateObj = new Date();
  const todayKey = formatDateKey(todayDateObj);

  if (todayTagEl) {
    const options = { month: 'short', day: 'numeric' };
    todayTagEl.textContent = todayDateObj.toLocaleDateString('en-US', options);
  }

  if (!sidebarListEl) return;
  sidebarListEl.innerHTML = '';

  const dailyHabits = tasks.filter(t => t.type === 'daily');
  const logsForToday = logs[todayKey] || [];

  if (dailyHabits.length === 0) {
    sidebarListEl.innerHTML = `
      <div class="empty-task-placeholder">
        No daily habits added yet. Click <strong>+ New Daily Habit</strong> to start tracking!
      </div>
    `;
    return;
  }

  dailyHabits.forEach(habit => {
    const isCompleted = logsForToday.includes(habit.id);
    
    const card = document.createElement('div');
    card.className = `habit-card-item ${isCompleted ? 'completed' : ''}`;

    card.innerHTML = `
      <div class="habit-info">
        <div class="custom-checkbox" onclick="toggleTaskCompletion('${habit.id}', '${todayKey}')">
          ${isCompleted ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
        <div>
          <div class="habit-title">${escapeHTML(habit.title)}</div>
          <div class="habit-time">${habit.time ? '⏰ ' + habit.time : 'Daily Habit'} • ${escapeHTML(habit.category || 'General')}</div>
        </div>
      </div>
    `;

    sidebarListEl.appendChild(card);
  });
}

/**
 * Task Completion Toggle Handler
 */
async function toggleTaskCompletion(taskId, dateKey) {
  let logsForDate = memoryLogs[dateKey] || [];

  if (logsForDate.includes(taskId)) {
    logsForDate = logsForDate.filter(id => id !== taskId);
    showToast("Task marked incomplete", "info");
  } else {
    logsForDate.push(taskId);
    showToast("Great job! Task completed 🎉", "success");
  }

  await saveCompletionLogsForDate(dateKey, logsForDate);

  refreshDashboard();

  const modal = document.getElementById('date-detail-modal');
  if (modal && !modal.classList.contains('hidden') && selectedExpandedDateKey === dateKey) {
    renderExpandedDateTasks(dateKey);
  }
}

/**
 * Save completion log to Server API & local cache
 */
async function saveCompletionLogsForDate(dateKey, taskIds) {
  memoryLogs[dateKey] = taskIds;
  saveUserDataToLocalStorage();

  if (currentUser) {
    try {
      await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          dateKey,
          completedTaskIds: taskIds
        })
      });
    } catch (e) {
      console.warn('Failed to sync completion log with MongoDB backend', e);
    }
  }
}

/**
 * Create Task via Server API & local cache
 */
async function createNewTask(taskData) {
  const payload = {
    userId: currentUser ? currentUser.id : 'guest_101',
    ...taskData
  };

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const created = await res.json();
      memoryTasks.push(created);
    } else {
      createTaskLocalFallback(taskData);
    }
  } catch (e) {
    createTaskLocalFallback(taskData);
  }

  saveUserDataToLocalStorage();
}

function createTaskLocalFallback(taskData) {
  const newTask = {
    id: 'task_' + Date.now(),
    createdAt: new Date().toISOString(),
    ...taskData
  };
  memoryTasks.push(newTask);
}

/**
 * Open Create Task Modal
 */
function openAddTaskModal(defaultType = 'specific', targetDate = null) {
  const modal = document.getElementById('add-task-modal');
  const titleEl = document.getElementById('task-modal-title');
  const form = document.getElementById('add-task-form');
  const dateInput = document.getElementById('task-date');

  form.reset();

  const radioSpecific = document.getElementById('radio-type-specific');
  const radioDaily = document.getElementById('radio-type-daily');

  if (defaultType === 'daily') {
    radioDaily.checked = true;
    if (titleEl) titleEl.textContent = "Add Daily Habit";
  } else {
    radioSpecific.checked = true;
    if (titleEl) titleEl.textContent = "Add Task for Date";
  }

  const defaultDateStr = targetDate || selectedExpandedDateKey || formatDateKey(new Date());
  if (dateInput) dateInput.value = defaultDateStr;

  toggleDateInputVisibility();
  modal.classList.remove('hidden');
}

function openTaskFormForSelectedDate(type) {
  closeDateModal();
  openAddTaskModal(type, selectedExpandedDateKey);
}

function closeTaskModal() {
  const modal = document.getElementById('add-task-modal');
  if (modal) modal.classList.add('hidden');
}

function closeTaskModalOnBackdrop(event) {
  if (event.target.id === 'add-task-modal') {
    closeTaskModal();
  }
}

function toggleDateInputVisibility() {
  const isSpecific = document.getElementById('radio-type-specific').checked;
  const dateGroup = document.getElementById('group-task-date');
  const dateInput = document.getElementById('task-date');

  if (isSpecific) {
    dateGroup.style.display = 'flex';
    dateInput.required = true;
  } else {
    dateGroup.style.display = 'none';
    dateInput.required = false;
  }
}

/**
 * Handle Save Task Form Submit
 */
async function handleSaveTask(event) {
  event.preventDefault();

  const isSpecific = document.getElementById('radio-type-specific').checked;
  const taskType = isSpecific ? 'specific' : 'daily';

  const title = document.getElementById('task-title').value.trim();
  const dateVal = document.getElementById('task-date').value;
  const category = document.getElementById('task-category').value;
  const time = document.getElementById('task-time').value;
  const notes = document.getElementById('task-notes').value.trim();

  if (!title) {
    showToast("Please enter a task title.", "warning");
    return;
  }

  if (taskType === 'specific' && !dateVal) {
    showToast("Please select a date for the task.", "warning");
    return;
  }

  await createNewTask({
    title,
    type: taskType,
    date: taskType === 'specific' ? dateVal : null,
    category,
    time,
    notes
  });

  closeTaskModal();
  showToast(taskType === 'daily' ? "Daily habit created! Keep the streak alive 🔥" : "Task added for " + dateVal, "success");

  refreshDashboard();

  if (selectedExpandedDateKey) {
    openDateModal(selectedExpandedDateKey);
  }
}

/**
 * Delete a Task
 */
async function deleteTask(taskId, dateKey) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  memoryTasks = memoryTasks.filter(t => t.id !== taskId);
  saveUserDataToLocalStorage();

  if (currentUser) {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Failed to delete task on server API', e);
    }
  }

  showToast("Task deleted", "info");
  refreshDashboard();

  if (dateKey) {
    renderExpandedDateTasks(dateKey);
  }
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});
