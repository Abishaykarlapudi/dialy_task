/**
 * auth.js - User Registration, Login, Session Management for TaskPulse
 */

const AUTH_USERS_KEY = 'tp_users_db_v1';
const CURRENT_USER_KEY = 'tp_current_user_v1';
const API_BASE = '/api';

// Currently logged in user object
let currentUser = null;

/**
 * Initialize Authentication Module - Restores user session if logged in, otherwise shows Login/Register page
 */
function initAuth() {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showDashboardView();
      onUserAuthenticated(currentUser);
    } catch (e) {
      console.error('Failed to parse saved user session', e);
      showAuthView();
    }
  } else {
    showAuthView();
  }
}

/**
 * Switch Auth Modal Tabs (Login vs Register)
 */
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');

  const loginErr = document.getElementById('login-error');
  const regErr = document.getElementById('register-error');
  if (loginErr) loginErr.classList.add('hidden');
  if (regErr) regErr.classList.add('hidden');

  if (tab === 'login') {
    loginForm.classList.add('active');
    loginForm.classList.remove('hidden-form');
    regForm.classList.remove('active');
    regForm.classList.add('hidden-form');

    loginTab.classList.add('active');
    regTab.classList.remove('active');
  } else {
    regForm.classList.add('active');
    regForm.classList.remove('hidden-form');
    loginForm.classList.remove('active');
    loginForm.classList.add('hidden-form');

    regTab.classList.add('active');
    loginTab.classList.remove('active');
  }
}

/**
 * Handle Login Form Submit (Server API + Local Fallback)
 */
async function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById('login-email').value.trim().toLowerCase();
  const passwordInput = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  errorEl.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput, password: passwordInput })
    });

    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'Invalid credentials.';
      errorEl.classList.remove('hidden');
      return;
    }

    setCurrentUser(data.user);
    showToast(`Welcome back, ${data.user.name}!`, 'success');
  } catch (err) {
    console.warn('Backend API unavailable, attempting local auth fallback...', err);
    // Local fallback
    const users = getUsersLocal();
    const userKey = Object.keys(users).find(
      key => key.toLowerCase() === emailInput || users[key].email.toLowerCase() === emailInput
    );

    if (!userKey || users[userKey].password !== passwordInput) {
      errorEl.textContent = 'Invalid email/username or password.';
      errorEl.classList.remove('hidden');
      return;
    }

    setCurrentUser(users[userKey]);
    showToast('Logged in (Local Mode)', 'info');
  }
}

/**
 * Handle Register Form Submit (Server API + Local Fallback)
 */
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('register-error');

  errorEl.classList.add('hidden');

  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters long.';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'Registration failed.';
      errorEl.classList.remove('hidden');
      return;
    }

    setCurrentUser(data.user);
    showToast('Account created successfully in MongoDB! Welcome to TaskPulse.', 'success');
  } catch (err) {
    console.warn('Backend API unavailable, using local register fallback', err);
    const users = getUsersLocal();
    if (users[email]) {
      errorEl.textContent = 'An account with this email already exists.';
      errorEl.classList.remove('hidden');
      return;
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name,
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };

    users[email] = newUser;
    saveUsersLocal(users);
    setCurrentUser(newUser);
    showToast('Account created locally!', 'success');
  }
}

/**
 * LocalStorage Users Helper
 */
function getUsersLocal() {
  const data = localStorage.getItem(AUTH_USERS_KEY);
  return data ? JSON.parse(data) : {};
}

function saveUsersLocal(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

/**
 * Quick Login as Demo Guest User
 */
function loginAsGuest() {
  const guestUser = {
    id: 'guest_101',
    name: 'Guest Achiever',
    email: 'guest@taskpulse.io',
    createdAt: new Date().toISOString()
  };

  setCurrentUser(guestUser);
  showToast('Logged in as Demo Guest!', 'success');
}

/**
 * Set active user & show dashboard ONLY after successful login/registration
 */
function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  showDashboardView();
  onUserAuthenticated(user);
}

/**
 * Handle Logout
 */
function handleLogout() {
  currentUser = null;
  localStorage.removeItem(CURRENT_USER_KEY);
  showAuthView();
  showToast('You have been logged out.', 'info');
}

/**
 * Force Auth View Visible, Dashboard Hidden
 */
function showAuthView() {
  const authSection = document.getElementById('auth-section');
  const dashSection = document.getElementById('dashboard-section');
  if (authSection) authSection.classList.remove('hidden');
  if (dashSection) dashSection.classList.add('hidden');
}

/**
 * Force Dashboard View Visible, Auth Hidden
 */
function showDashboardView() {
  const authSection = document.getElementById('auth-section');
  const dashSection = document.getElementById('dashboard-section');
  if (authSection) authSection.classList.add('hidden');
  if (dashSection) dashSection.classList.remove('hidden');
}

function getCurrentUser() {
  return currentUser;
}
