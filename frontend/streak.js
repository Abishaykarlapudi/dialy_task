/**
 * streak.js - Real-Time Streak Engine & Missed Day Reset Logic for TaskPulse
 */

/**
 * Format a Date object to YYYY-MM-DD string key
 */
function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get date string for N days before/after target date
 */
function getOffsetDateKey(baseDateObj, offsetDays) {
  const d = new Date(baseDateObj);
  d.setDate(d.getDate() + offsetDays);
  return formatDateKey(d);
}

/**
 * Calculate user's streak stats based on daily habits completion logs
 * 
 * @param {Array} tasks - Array of user task objects
 * @param {Object} completionLogs - Map of dateKey -> Array of completed task IDs
 * @returns {Object} { currentStreak, bestStreak, todayCompletionRate, isStreakBroken, lastMissedDate }
 */
function calculateStreakStats(tasks, completionLogs) {
  const dailyHabits = tasks.filter(t => t.type === 'daily');
  const todayKey = formatDateKey(new Date());
  
  if (dailyHabits.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      todayCompletionRate: 0,
      isStreakBroken: false,
      lastMissedDate: null,
      todayStatus: 'no_habits'
    };
  }

  // Calculate Today's completion rate
  const todayCompletedCount = dailyHabits.filter(h => {
    const logsForToday = completionLogs[todayKey] || [];
    return logsForToday.includes(h.id);
  }).length;
  
  const todayCompletionRate = Math.round((todayCompletedCount / dailyHabits.length) * 100);

  // Check past days to find continuous streak
  let currentStreak = 0;
  let isStreakBroken = false;
  let lastMissedDate = null;

  // If today is 100% complete, start checking from Today (counts as 1 day streak)
  // If today is not yet 100% complete, start checking backwards from Yesterday
  const isTodayComplete = todayCompletedCount === dailyHabits.length;
  let checkOffset = isTodayComplete ? 0 : -1;

  // Loop backwards day by day to count consecutive completed daily habit days
  // We limit loop to max 365 days back for performance
  for (let i = 0; i < 365; i++) {
    const targetOffset = checkOffset - i;
    const dateKey = getOffsetDateKey(new Date(), targetOffset);

    // Filter habits that were created on or before this dateKey
    const activeHabitsOnDate = dailyHabits.filter(h => {
      const createdKey = h.createdAt ? h.createdAt.split('T')[0] : '2000-01-01';
      return createdKey <= dateKey;
    });

    if (activeHabitsOnDate.length === 0) {
      // User didn't have any daily habits created yet on this past date
      break;
    }

    const completedOnDate = activeHabitsOnDate.filter(h => {
      const logs = completionLogs[dateKey] || [];
      return logs.includes(h.id);
    }).length;

    const isDayFullyComplete = completedOnDate === activeHabitsOnDate.length;

    if (isDayFullyComplete) {
      currentStreak++;
    } else {
      // If we are checking a past day (not today) and it was not fully complete,
      // the streak breaks right here!
      if (targetOffset < 0) {
        isStreakBroken = true;
        lastMissedDate = dateKey;
      }
      break; // Stop counting consecutive streak
    }
  }

  // Calculate Best Streak Record across history
  // Scan all logged dates in completionLogs
  let maxStreakRecord = currentStreak;
  const allLogDates = Object.keys(completionLogs).sort();
  let tempStreak = 0;

  allLogDates.forEach(dKey => {
    if (dKey > todayKey) return;

    const activeHabits = dailyHabits.filter(h => {
      const createdKey = h.createdAt ? h.createdAt.split('T')[0] : '2000-01-01';
      return createdKey <= dKey;
    });

    if (activeHabits.length > 0) {
      const done = activeHabits.filter(h => (completionLogs[dKey] || []).includes(h.id)).length;
      if (done === activeHabits.length) {
        tempStreak++;
        if (tempStreak > maxStreakRecord) maxStreakRecord = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
  });

  return {
    currentStreak: currentStreak,
    bestStreak: Math.max(currentStreak, maxStreakRecord),
    todayCompletionRate: todayCompletionRate,
    isStreakBroken: isStreakBroken,
    lastMissedDate: lastMissedDate,
    isTodayComplete: isTodayComplete
  };
}

/**
 * Update Top Banner UI elements with latest Streak Stats
 */
function updateStreakBannerUI(stats) {
  const streakNumEl = document.getElementById('current-streak-val');
  const bestStreakEl = document.getElementById('best-streak-val');
  const completionValEl = document.getElementById('today-completion-val');
  const statusDescEl = document.getElementById('streak-status-desc');
  const alertPillEl = document.getElementById('streak-alert-pill');
  const warningTextEl = document.getElementById('streak-warning-text');

  if (streakNumEl) streakNumEl.textContent = stats.currentStreak;
  if (bestStreakEl) bestStreakEl.textContent = `${stats.bestStreak} Days`;
  if (completionValEl) completionValEl.textContent = `${stats.todayCompletionRate}%`;

  if (statusDescEl) {
    if (stats.isTodayComplete) {
      statusDescEl.textContent = "🎉 Awesome job! Today's daily habits are 100% completed!";
    } else if (stats.isStreakBroken) {
      statusDescEl.textContent = `⚠️ Streak broke on ${stats.lastMissedDate} due to missed habits. Start fresh today!`;
    } else {
      statusDescEl.textContent = "Keep going! Complete today's habits to extend your streak 🔥";
    }
  }

  if (alertPillEl && warningTextEl) {
    const pulseDot = alertPillEl.querySelector('.pulse-dot');
    if (stats.isStreakBroken && !stats.isTodayComplete) {
      warningTextEl.textContent = "Streak Missed";
      warningTextEl.style.color = "var(--danger)";
      if (pulseDot) {
        pulseDot.classList.add('broken');
      }
    } else {
      warningTextEl.textContent = stats.isTodayComplete ? "Active & Done" : "Streak Active";
      warningTextEl.style.color = "var(--success)";
      if (pulseDot) {
        pulseDot.classList.remove('broken');
      }
    }
  }
}
