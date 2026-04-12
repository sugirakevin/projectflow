# ProjectFlow 🚀

A lightweight, full-stack project tracking platform for small teams — combining Excel simplicity with Jira-like logic and automated deadline reminders.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS v3 + Recharts
- **Backend**: Node.js + Express + Prisma ORM  
- **Database**: PostgreSQL
- **Email**: Nodemailer (Mailtrap for dev / any SMTP for prod)
- **Auth**: JWT (bcryptjs)

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** 14+ running locally (or a cloud connection string from [Supabase](https://supabase.com) / [Railway](https://railway.app))
- An SMTP provider ([Mailtrap](https://mailtrap.io) is free for testing)

---

## Quick Start

### 1. Configure the Backend

```bash
cd projectflow/backend
```

Edit `.env` (already created) with your real values:
```ini
DATABASE_URL="postgresql://your_user:your_pass@localhost:5432/projectflow"
JWT_SECRET="a-long-random-secret"
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
```

### 2. Set Up the Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to PostgreSQL (creates tables)
npx prisma db push
```

### 3. Start the Backend

```bash
npm run dev
# → API running at http://localhost:5000
```

### 4. Start the Frontend

```bash
cd projectflow/frontend
npm run dev
# → App running at http://localhost:5173
```

---

## Features

| Feature | Details |
|---|---|
| **Task Management** | Create, edit, delete tasks with ID, group, priority, statuses, deadline, notes, assignee |
| **Smart Overdue Logic** | Auto-calculates: On Time / Dev Overdue / Testing Overdue / Closed |
| **Inline Editing** | Click dropdowns in the table to change priority/status instantly |
| **Live Recalculation** | Every status/deadline change instantly updates overdue badge |
| **Dashboard** | Pie + bar charts for priority & status breakdowns |
| **Filters & Search** | Filter by priority, dev/test status, overdue; search by title |
| **Email Notifications** | Daily cron at 8AM — sends overdue + due-soon emails with anti-spam |
| **Auth** | JWT register/login; user sees assigned tasks + admin sees all |

---

## Color Key

| Priority | Color |
|---|---|
| Critical | 🔴 Red |
| High | 🟠 Orange |
| Medium | 🟡 Yellow |
| Low | 🟢 Green |

| Overdue Status | Color |
|---|---|
| On Time | 🟢 Green |
| Overdue (Dev) | 🔴 Red |
| Overdue (Testing) | 🔴 Red |
| Closed | 🟣 Purple |

---

## Manual Email Test

Hit this endpoint to manually trigger the notification check (useful for testing without waiting for 8AM):

```bash
curl -X POST http://localhost:5000/api/tasks/notify-now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Deployment

| Layer | Recommended |
|---|---|
| Frontend | [Vercel](https://vercel.com) — `npm run build`, set `VITE_API_URL` env var |
| Backend | [Railway](https://railway.app) — deploy backend folder, add PostgreSQL plugin |

---

## Project Structure

```
projectflow/
├── backend/
│   ├── prisma/schema.prisma         # DB models
│   ├── src/
│   │   ├── index.js                 # Express entry point
│   │   ├── routes/auth.js           # Register / Login
│   │   ├── routes/tasks.js          # Task CRUD + filters
│   │   ├── middleware/auth.js       # JWT middleware
│   │   └── services/
│   │       ├── overdue.js           # Smart overdue logic
│   │       ├── email.js             # Email templates
│   │       └── cron.js              # Daily notification job
│   └── .env
└── frontend/
    └── src/
        ├── api/axios.js             # API client
        ├── contexts/AuthContext.jsx # Auth state
        ├── pages/
        │   ├── Login.jsx / Register.jsx
        │   ├── Tasks.jsx            # Main task board
        │   └── Dashboard.jsx        # Charts + stats
        └── components/
            ├── Layout.jsx / Badge.jsx / TaskModal.jsx
```
