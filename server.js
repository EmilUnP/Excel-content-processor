const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'saved-data.json');

// Session management for active operations
const activeSessions = new Map();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(__dirname);
  } catch (error) {
    await fs.mkdir(__dirname, { recursive: true });
  }
};

// Save data endpoint with compression
app.post('/api/save-data', async (req, res) => {
  try {
    await ensureDataDir();
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }
    
    // Write data with compression for better performance
    const jsonData = JSON.stringify(data);
    await fs.writeFile(DATA_FILE, jsonData);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load data endpoint
app.get('/api/load-data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    res.json({ success: true, data: parsedData });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ success: false, message: 'No saved data found' });
    } else {
      console.error('Load error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Clear data endpoint
app.post('/api/clear-data', async (req, res) => {
  try {
    await fs.unlink(DATA_FILE).catch(() => {}); // Ignore if file doesn't exist
    res.json({ success: true, message: 'Data cleared successfully' });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Session management endpoints
app.post('/api/session/start', (req, res) => {
  try {
    const { sessionId, operation } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' });
    }
    
    activeSessions.set(sessionId, {
      operation,
      startTime: Date.now(),
      status: 'active'
    });
    
    console.log(`🔄 Session started: ${sessionId} - ${operation}`);
    res.json({ success: true, message: 'Session started' });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/session/stop', (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' });
    }
    
    if (activeSessions.has(sessionId)) {
      const session = activeSessions.get(sessionId);
      session.status = 'stopped';
      session.endTime = Date.now();
      
      console.log(`🛑 Session stopped: ${sessionId} - Duration: ${session.endTime - session.startTime}ms`);
      activeSessions.delete(sessionId);
      
      res.json({ success: true, message: 'Session stopped' });
    } else {
      res.json({ success: true, message: 'Session not found' });
    }
  } catch (error) {
    console.error('Session stop error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/session/status', (req, res) => {
  try {
    const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      operation: session.operation,
      startTime: session.startTime,
      status: session.status,
      duration: Date.now() - session.startTime
    }));
    
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cleanup inactive sessions (older than 5 minutes)
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.startTime > fiveMinutes) {
      console.log(`🧹 Cleaning up inactive session: ${sessionId}`);
      activeSessions.delete(sessionId);
    }
  }
}, 60000); // Check every minute

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Data storage server running on port ${PORT}`);
  console.log(`Data will be saved to: ${DATA_FILE}`);
});
