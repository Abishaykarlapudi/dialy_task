/**
 * notifications.js - Web Notifications, Daily Reminders & Toast System
 */

// In-app notifications memory list
let inAppNotifications = [];

/**
 * Initialize Notification Engine & Periodic Reminder Checker
 */
function initNotifications() {
  // Check every 30 seconds if any daily habit reminder time matches current time
  setInterval(checkScheduledReminders, 30000);
}

/**
 * Request Browser Desktop Notification Permissions
 */
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("Desktop notifications are not supported in your browser.", "warning");
    return;
  }

  if (Notification.permission === "granted") {
    showToast("Desktop notifications are already enabled!", "success");
    sendDesktopNotification("TaskPulse Reminders Active", "You will receive alerts for your daily habits!");
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        showToast("Desktop notifications enabled successfully!", "success");
        sendDesktopNotification("TaskPulse Reminders Enabled", "Daily habit notifications are active!");
      } else {
        showToast("Notification permission was denied.", "warning");
      }
    });
  } else {
    showToast("Notifications are blocked in browser settings.", "warning");
  }
}

/**
 * Send Browser Native Desktop Notification
 */
function sendDesktopNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/785/785116.png'
      });
    } catch (e) {
      console.warn("Could not display native notification", e);
    }
  }
}

/**
 * Check if any task reminder time matches now
 */
function checkScheduledReminders() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const now = new Date();
  const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const todayKey = formatDateKey(now);

  const tasks = getUserTasks();
  const logs = getUserCompletionLogs()[todayKey] || [];

  tasks.forEach(task => {
    if (task.time && task.time === currentHHMM) {
      // Check if daily task is not completed yet
      if (task.type === 'daily' && !logs.includes(task.id)) {
        triggerTaskReminder(task);
      } else if (task.type === 'specific' && task.date === todayKey && !logs.includes(task.id)) {
        triggerTaskReminder(task);
      }
    }
  });
}

/**
 * Trigger Reminder Alert (Both In-App Toast & Desktop Notification)
 */
function triggerTaskReminder(task) {
  const notifMessage = `⏰ Reminder: Don't forget to complete "${task.title}" today!`;
  
  // Add to in-app notification menu
  addInAppNotification(task.title, task.time);
  
  // Display Toast
  showToast(notifMessage, "warning");

  // Display Desktop Alert
  sendDesktopNotification(`TaskPulse Reminder: ${task.title}`, `Scheduled for ${task.time || 'today'}. Complete it to keep your streak burning!`);
}

/**
 * Add item to Notifications Dropdown Menu
 */
function addInAppNotification(title, time) {
  inAppNotifications.unshift({
    id: Date.now(),
    title: title,
    time: time || 'Today',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  updateNotificationBadge();
  renderNotificationList();
}

/**
 * Toggle Notification Panel Dropdown
 */
function toggleNotificationsPanel() {
  const dropdown = document.getElementById('notifications-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

/**
 * Render items in Notification Dropdown
 */
function renderNotificationList() {
  const listEl = document.getElementById('notif-list');
  if (!listEl) return;

  if (inAppNotifications.length === 0) {
    listEl.innerHTML = `<p class="empty-notif">No pending reminders right now!</p>`;
    return;
  }

  listEl.innerHTML = '';
  inAppNotifications.forEach(n => {
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `
      <div class="notif-icon">⏰</div>
      <div>
        <strong>${escapeHTML(n.title)}</strong>
        <div style="font-size: 0.72rem; color: var(--text-dim);">${n.createdAt} - Reminder</div>
      </div>
    `;
    listEl.appendChild(item);
  });
}

/**
 * Update Notification Red Badge Count
 */
function updateNotificationBadge() {
  const badgeEl = document.getElementById('bell-badge');
  if (!badgeEl) return;

  if (inAppNotifications.length > 0) {
    badgeEl.textContent = inAppNotifications.length;
    badgeEl.classList.remove('hidden');
  } else {
    badgeEl.classList.add('hidden');
  }
}

/**
 * Display Floating Toast Notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '⚡';
  if (type === 'success') icon = '🎉';
  if (type === 'warning') icon = '🔥';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}
