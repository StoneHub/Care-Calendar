const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const socketUtil = require('./utils/socket');
const routes = require('./routes');
const logger = require('./utils/logger');
const path = require('path');
const discovery = require('./utils/discovery');
const lowdbUtil = require('./utils/lowdbUtil');

// Check if database reset is needed
const args = process.argv.slice(2);
if (args.includes('--reset-db')) {
  logger.info('Database reset requested via command line');
  // Use LowDB reset functionality
  lowdbUtil.resetAllCollections();
  logger.info('Database reset completed, continuing with server startup');
}

const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize socket utility
socketUtil.init(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(logger.requestMiddleware());

// Routes
app.use('/api', routes);

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Listen for schedule updates
  socket.on('scheduleUpdate', (data) => {
    logger.debug('Received schedule update', { socketId: socket.id });
    // Broadcast to all other clients
    socket.broadcast.emit('scheduleUpdated', data);
  });

  // Listen for notification updates
  socket.on('notificationUpdate', (data) => {
    logger.debug('Received notification update', { socketId: socket.id });
    // Broadcast to all other clients
    socket.broadcast.emit('notificationUpdated', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
  });
});

// Import utilities
const generateCalendarWeeks = require('./utils/generateCalendarWeeks');

// Helper to ensure required collections exist
async function setupLowDbCollections() {
  logger.info('Setting up LowDB collections...');
  
  // Ensure all necessary collections exist
  ['team_members', 'weeks', 'shifts', 'notifications', 'history', 'unavailability', 'payroll_records'].forEach(collection => {
    const items = lowdbUtil.getAll(collection);
    if (!items || !Array.isArray(items)) {
      logger.info(`Creating ${collection} collection`);
      lowdbUtil.resetCollection(collection);
    } else {
      logger.info(`Collection ${collection} exists with ${items.length} items`);
    }
  });
  
  logger.info('LowDB collections setup complete');
}

// Start server
const HOST = '0.0.0.0';
server.listen(port, HOST, async () => {
  logger.info(`Server running on http://${HOST}:${port}`);
  
  try {
    // Set up LowDB collections
    await setupLowDbCollections();
    
    // Seed database if needed
    const seedDb = require('./utils/seedDb');
    await seedDb.seedDatabase();
    logger.info('Database initialization complete');
    
    // Auto-generate calendar weeks on server start
    await generateCalendarWeeks(4, 12); // 4 weeks back, 12 weeks forward
    logger.info('Calendar weeks generated successfully');
    
    // Initialize mDNS discovery service for local network access
    discovery.initDiscovery(5173, port);
  } catch (error) {
    logger.error('Server initialization error', { 
      error: error.message,
      stack: error.stack 
    });
  }
});
