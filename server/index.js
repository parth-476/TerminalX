const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('./database/db');
const marketRouter = require('./routes/market');
const portsRouter = require('./routes/ports');
const vesselsRouter = require('./routes/vessels');
const analyticsRouter = require('./routes/analytics');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

db.init().catch(() => {});

app.use('/api/market', marketRouter);
app.use('/api/ports', portsRouter);
app.use('/api/vessels', vesselsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'TerminalX Freight Intelligence Monolith',
    version: '4.8.0',
    uptimeSeconds: Math.round(process.uptime()),
    database: db.getStats(),
    ai: {
      provider: 'Google Gemini',
      configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/external-data', (req, res) => {
  res.status(503).json({ error: 'External data provider not configured.' });
});

app.get('/api/freight-data', (req, res) => {
  res.json({ lanes: [], status: { provider: 'NONE', updatedAt: new Date().toISOString() } });
});

app.get('/api/vessel-data', (req, res) => {
  res.json({ vessels: [], status: { provider: 'NONE', updatedAt: new Date().toISOString() } });
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('<html><body style="background:#000;color:#F27D26;font-family:monospace;padding:24px;"><h2>TERMINAL.EXE SERVER ACTIVE</h2><p>Backend API is running. Run npm run build for the frontend.</p></body></html>');
    }
  });
});

app.use((err, req, res, next) => {
  console.error('[API Error]', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TerminalX backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
