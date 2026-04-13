require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initCron } = require('./services/cron');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (important on Render)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const teamRoutes = require('./routes/teams');
const settingsRoutes = require('./routes/settings');
const { authMiddleware, adminMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain automatically
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ProjectFlow API running on port ${PORT}`);
  initCron();
});

module.exports = app;
// Force restart to pick up Gmail SMTP config
