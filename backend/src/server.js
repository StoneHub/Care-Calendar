const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const socketUtil = require('./utils/socket');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

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

// Routes
app.use('/api', routes);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Listen for schedule updates
  socket.on('scheduleUpdate', (data) => {
    // Broadcast to all other clients
    socket.broadcast.emit('scheduleUpdated', data);
  });

  // Listen for notification updates
  socket.on('notificationUpdate', (data) => {
    // Broadcast to all other clients
    socket.broadcast.emit('notificationUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});