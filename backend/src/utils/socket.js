// This file will be used to access socket.io throughout the application
// It will be initialized in server.js and exported for use in controllers

let io;

// Initialize the socket with the server instance
const init = (socketIo) => {
  io = socketIo;
  return io;
};

// Get the socket instance
const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  init,
  getIo
};