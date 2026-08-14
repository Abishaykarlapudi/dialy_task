/**
 * calendar.js - Interactive Calendar Grid, Date Cell Expansion & Task Views
 */

// Currently selected calendar month date state
let currentViewDate = new Date();
// Currently expanded date in date detail modal (formatted YYYY-MM-DD)
let selectedExpandedDateKey = formatDateKey(new Date());

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Initialize and render Calendar view
 */
function renderCalendar() {
  const gridEl = document.getElementById('calendar-days-grid');
  const monthYearEl = document.getElementById('calendar-month-year');
  if (!gridEl) return;

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  if (monthYearEl) {
    monthYearEl.textContent = `${MONTH_NAMES[month]} ${year}`;
  }

  gridEl.innerHTML = '';

  // Get first day of month and total days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const todayKey = formatDateKey(new Date());
  const tasks = getUserTasks();
  const completionLogs = getUserCompletionLogs();

  // Render Previous Month's overflow days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDayNum = totalDaysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, prevDayNum);
    const dateKey = formatDateKey(prevMonthDate);

    const cell = createCalendarDayCell(prevDayNum, dateKey, true, false, tasks, completionLogs);
    gridEl.appendChild(cell);
  }

  // Render Current Month's days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateKey = formatDateKey(dateObj);
    const isToday = dateKey === todayKey;

    const cell = createCalendarDayCell(day, dateKey, false, isToday, tasks, completionLogs);
    gridEl.appendChild(cell);
  }

  // Render Next Month's overflow days to complete 6-row grid (42 cells total)
  const filledCells = firstDayIndex + totalDaysInMonth;
  const remainingCells = 42 - filledCells;
  for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
    const nextMonthDate = new Date(year, month + 1, nextDay);
    const dateKey = formatDateKey(nextMonthDate);

    const cell = createCalendarDayCell(nextDay, dateKey, true, false, tasks, completionLogs);
    gridEl.appendChild(cell);
  }
}

/**
 * Helper to build single calendar day DOM element
 */
function createCalendarDayCell(dayNum, dateKey, isOtherMonth, isToday, tasks, completionLogs) {
  const cell = document.createElement('div');
  cell.className = `calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`;
  cell.onclick = () => handleDateCellClick(dateKey);

  // Find tasks applicable for this dateKey
  const dailyTasks = tasks.filter(t => t.type === 'daily');
  const specificTasks = tasks.filter(t => t.type === 'specific' && t.date === dateKey);

  const totalTasksOnDate = dailyTasks.length + specificTasks.length;
  const logsOnDate = completionLogs[dateKey] || [];

  // Calculate completed count
  const completedDailyCount = dailyTasks.filter(h => logsOnDate.includes(h.id)).length;
  const completedSpecificCount = specificTasks.filter(st => logsOnDate.includes(st.id)).length;
  const totalCompleted = completedDailyCount + completedSpecificCount;

  const isFullyCompleted = totalTasksOnDate > 0 && totalCompleted === totalTasksOnDate;
  const hasDailyHabits = dailyTasks.length > 0;

  let dotsHTML = '';
  if (totalTasksOnDate > 0) {
    if (dailyTasks.length > 0) {
      dotsHTML += `<span class="task-dot daily-dot ${completedDailyCount === dailyTasks.length ? 'completed-dot' : ''}" title="Daily Habits"></span>`;
    }
    if (specificTasks.length > 0) {
      dotsHTML += `<span class="task-dot ${completedSpecificCount === specificTasks.length ? 'completed-dot' : ''}" title="Specific Date Tasks"></span>`;
    }
  }

  let flameBadge = '';
  if (hasDailyHabits && completedDailyCount === dailyTasks.length) {
    flameBadge = `<span class="cell-badge-flame" title="All habits done!">🔥</span>`;
  }

  let summaryText = '';
  if (totalTasksOnDate > 0) {
    summaryText = `${totalCompleted}/${totalTasksOnDate} done`;
  } else {
    summaryText = `No tasks`;
  }

  cell.innerHTML = `
    <div class="cell-top">
      <span class="day-num">${dayNum}</span>
      ${flameBadge}
    </div>
    <div class="cell-tasks-indicator">
      ${dotsHTML}
    </div>
    <div class="cell-summary-text">${summaryText}</div>
  `;

  return cell;
}

/**
 * Handle Next / Previous Month Navigation
 */
function changeMonth(delta) {
  currentViewDate.setMonth(currentViewDate.getMonth() + delta);
  renderCalendar();
}

/**
 * Jump to current Today month
 */
function goToToday() {
  currentViewDate = new Date();
  renderCalendar();
}

/**
 * Handle Date Click: Opens Date Expansion Modal (REQ 6 & 7)
 */
function handleDateCellClick(dateKey) {
  selectedExpandedDateKey = dateKey;
  openDateModal(dateKey);
}

/**
 * Open Date Details Modal
 */
function openDateModal(dateKey) {
  const modal = document.getElementById('date-detail-modal');
  const titleEl = document.getElementById('expanded-date-title');
  const subtitleEl = document.getElementById('expanded-date-subtitle');
  if (!modal) return;

  // Format date display (e.g., "Friday, August 14, 2026")
  const dateParts = dateKey.split('-');
  const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  const formattedString = dateObj.toLocaleDateString('en-US', options);

  if (titleEl) titleEl.textContent = formattedString;
  if (subtitleEl) {
    const isToday = dateKey === formatDateKey(new Date());
    subtitleEl.textContent = isToday ? "Today's Schedule & Habits" : `Tasks & Habits scheduled for ${dateKey}`;
  }

  renderExpandedDateTasks(dateKey);
  modal.classList.remove('hidden');
}

/**
 * Close Date Modal
 */
function closeDateModal() {
  const modal = document.getElementById('date-detail-modal');
  if (modal) modal.classList.add('hidden');
}

function closeDateModalOnBackdrop(event) {
  if (event.target.id === 'date-detail-modal') {
    closeDateModal();
  }
}

/**
 * Render lists inside Expanded Date Modal
 */
function renderExpandedDateTasks(dateKey) {
  const dailyListEl = document.getElementById('expanded-daily-list');
  const specificListEl = document.getElementById('expanded-specific-list');
  const dailyCountEl = document.getElementById('expanded-daily-count');
  const specificCountEl = document.getElementById('expanded-date-count');

  const tasks = getUserTasks();
  const completionLogs = getUserCompletionLogs();
  const logsOnDate = completionLogs[dateKey] || [];

  const dailyHabits = tasks.filter(t => t.type === 'daily');
  const specificTasks = tasks.filter(t => t.type === 'specific' && t.date === dateKey);

  if (dailyCountEl) dailyCountEl.textContent = dailyHabits.length;
  if (specificCountEl) specificCountEl.textContent = specificTasks.length;

  // Render Daily Habits Section
  if (dailyListEl) {
    dailyListEl.innerHTML = '';
    if (dailyHabits.length === 0) {
      dailyListEl.innerHTML = `<div class="empty-task-placeholder">No daily habits configured yet.</div>`;
    } else {
      dailyHabits.forEach(task => {
        const isDone = logsOnDate.includes(task.id);
        const item = createExpandedTaskItemDOM(task, isDone, dateKey);
        dailyListEl.appendChild(item);
      });
    }
  }

  // Render Specific Date Tasks Section
  if (specificListEl) {
    specificListEl.innerHTML = '';
    if (specificTasks.length === 0) {
      specificListEl.innerHTML = `<div class="empty-task-placeholder">No date-specific tasks for ${dateKey}.</div>`;
    } else {
      specificTasks.forEach(task => {
        const isDone = logsOnDate.includes(task.id);
        const item = createExpandedTaskItemDOM(task, isDone, dateKey);
        specificListEl.appendChild(item);
      });
    }
  }
}

/**
 * Helper to construct Task Item DOM inside Date Detail Modal
 */
function createExpandedTaskItemDOM(task, isDone, dateKey) {
  const div = document.createElement('div');
  div.className = `expanded-task-item ${isDone ? 'completed' : ''}`;

  div.innerHTML = `
    <div class="task-left">
      <div class="custom-checkbox" onclick="toggleTaskCompletion('${task.id}', '${dateKey}')">
        ${isDone ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
      </div>
      <div>
        <div class="habit-title">${escapeHTML(task.title)}</div>
        <div class="task-meta">
          <span class="tag-cat">${escapeHTML(task.category || 'General')}</span>
          ${task.time ? `<span class="task-time-lbl">⏰ ${task.time}</span>` : ''}
          ${task.notes ? `<span class="task-time-lbl">📝 ${escapeHTML(task.notes)}</span>` : ''}
        </div>
      </div>
    </div>
    <button class="delete-task-btn" onclick="deleteTask('${task.id}', '${dateKey}')" title="Delete Task">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </button>
  `;

  return div;
}

/**
 * Helper to escape HTML characters
 */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
