# TaskPulse - Daily Task & Habit Tracker 🚀

A modern, full-stack Daily Task & Habit Tracker web application built with **HTML5, Vanilla CSS3 (Glassmorphism), JavaScript (ES6+), Express.js, and MongoDB Atlas**.

---

## ✨ Features

1. **User Authentication (Login & Register)**:
   - Account creation & authentication with bcrypt password hashing and JWT.
   - Demo Guest mode for quick preview.

2. **Interactive Calendar View & Date Cell Expansion**:
   - Monthly calendar grid with indicator badges for pending habits, completion status, and streak flames.
   - **Click-to-Expand Date**: Clicking any date expands the schedule for that day and allows adding new single-day tasks or daily recurring habits directly to that date.

3. **Top Action Buttons & Dual Task Types**:
   - **"+ Add Task for Date"**: Specific date task with target date selector.
   - **"+ Add Daily Habit"**: Recurring daily habit that repeats every day and powers the streak calculation.

4. **Streak Calculation Engine & Missed Day Reset**:
   - **Current Streak Counter**: Real-time continuous streak counter.
   - **Automatic Streak Reset**: Checks past days; if any active habit was missed on a previous day, the streak automatically breaks and resets to 0.

5. **Daily Reminders & Notifications**:
   - Web Notification API desktop alerts.
   - Scheduled periodic reminder checker and in-app bell notification menu.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism, CSS Grid/Flexbox), ES6 JavaScript modules
- **Backend**: Node.js, Express.js REST API
- **Database**: MongoDB Atlas (Mongoose ORM)
- **Deployment**: Render.com Web Service

---

## 🌐 Deploying to Render.com

Deploying TaskPulse on **Render.com** takes under 2 minutes:

### Option A: Using Render Blueprints (Automatic)

1. Sign in to [Render.com](https://dashboard.render.com/).
2. Click **New +** -> Select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Abishaykarlapudi/dialy_task`.
4. Render will automatically detect `render.yaml` and configure the web service with your MongoDB Atlas credentials.
5. Click **Apply**! Your app will build and deploy live.

---

### Option B: Manual Web Service Setup on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) -> Click **New +** -> **Web Service**.
2. Connect your GitHub repository: `Abishaykarlapudi/dialy_task`.
3. Fill in the following deployment fields:

| Field | Value |
| :--- | :--- |
| **Name** | `dialy-task-tracker` |
| **Language / Environment** | `Node` |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

4. Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://rocksun:Test12345@job-portal.r8efxop.mongodb.net/dialy_task?appName=dialy_task` |
| `JWT_SECRET` | `taskpulse_super_secret_key_2026` |

5. Click **Create Web Service**. Render will build and launch your application!

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/Abishaykarlapudi/dialy_task.git
cd dialy_task

# Install dependencies
npm install

# Start development server
npm start
```
App will run at `http://localhost:5000`.