/**
 * TerminalX Backend Monolith
 * 
 * Simple, production-ready Express server for maritime and freight intelligence.
 * Provides clean REST endpoints for market rates, port congestion, vessel tracking,
 * voyage analytics, and Gemini AI insights.
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables (.env.local, .env)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('./database/db');

// Route handlers
const marketRouter = require('./routes/market');
const portsRouter = require('./routes/ports');
const vesselsRouter = require('./routes/vessels');
const analyticsRouter = require('./routes/analytics');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Initialize Database connection (PostgreSQL if DATABASE_URL configured, else in-memory JSON)
db.init().catch((err) => {
  console.warn('[Server] DB initialization notice:', err.message);
});

// API Routes
app.use('/api/market', marketRouter);
app.use('/api/ports', portsRouter);
app.use('/api/vessels', vesselsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

// System Health Check
app.get('/api/health', (req, res) => {
  const dbStats = db.getStats();
  res.json({
    status: 'ONLINE',
    service: 'TerminalX Freight Intelligence Monolith',
    version: '4.8.0',
    uptimeSeconds: Math.round(process.uptime()),
    database: dbStats,
    ai: {
      provider: 'Google Gemini',
      configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    },
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend build in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side SPA routing
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <body style="background:#000;color:#F27D26;font-family:monospace;padding:24px;">
            <h2>TERMINAL.EXE SERVER ACTIVE</h2>
            <p>Backend API is running on port ${PORT}.</p>
            <p>Run 'npm run build' to generate the frontend dist bundle.</p>
          </body>
        </html>
      `);
    }
  });
});

// Centralized API Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error.',
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚢 TERMINALX FREIGHT INTELLIGENCE ENGINE ONLINE`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 DB Mode: ${db.getMode()}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
