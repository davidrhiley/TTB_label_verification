const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const LOG_FILE = path.join(__dirname, 'logs', 'verification-log.json');

// Middleware setup
app.use(cors()); // Simple CORS - allow all origins
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

// Health check endpoint
app.get('/ping', (req, res) => res.json({ ok: true }));

/**
 * Helper function to read or initialize log file
 * @returns {Array} Array of log entries
 */
function readLogs() {
  if (!fs.existsSync(LOG_FILE)) {
    const logsDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return [];
  }
  return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
}

/**
 * Helper function to write logs to file
 * @param {Array} logs - Array of log entries to write
 */
function writeLogs(logs) {
  const logsDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// Log verification results endpoint
app.post('/api/log-verification', (req, res) => {
  try {
    const logData = { timestamp: new Date().toISOString(), ...req.body };
    const logs = readLogs();
    logs.push(logData);
    writeLogs(logs);
    res.json({ success: true, message: 'Verification logged' });
  } catch (error) {
    console.error('Error logging verification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get verification logs endpoint
app.get('/api/verification-logs', (req, res) => {
  try {
    const logs = readLogs();
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear verification logs endpoint
app.delete('/api/verification-logs', (req, res) => {
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE);
    }
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;