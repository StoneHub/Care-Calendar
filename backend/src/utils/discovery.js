/**
 * Care Calendar Network Discovery Service
 * 
 * This module implements local network discovery using mDNS (Bonjour/Avahi).
 * It allows devices on the local network to discover the Care Calendar application
 * without needing to know its IP address.
 */
const bonjour = require('bonjour')();
const logger = require('./logger');

/**
 * Initialize mDNS service advertisement
 * @param {number} frontendPort - The port where the frontend server is running
 * @param {number} backendPort - The port where the backend server is running
 */
function initDiscovery(frontendPort = 5173, backendPort = 3001) {
  try {
    logger.info('Starting mDNS service advertisement');
    
    // Publish frontend service
    const frontendService = bonjour.publish({
      name: 'Care Calendar',
      type: 'http',
      port: frontendPort,
      txt: { 
        description: 'Care Calendar application frontend',
        version: '1.0'
      }
    });
    
    // Publish backend API service
    const backendService = bonjour.publish({
      name: 'Care Calendar API',
      type: 'http',
      port: backendPort,
      txt: { 
        description: 'Care Calendar application API',
        version: '1.0'
      }
    });
    
    logger.info(`mDNS services published: 
      - Frontend: http://care-calendar.local:${frontendPort}
      - Backend: http://care-calendar-api.local:${backendPort}`);
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    return { frontendService, backendService };
  } catch (error) {
    logger.error('Failed to initialize mDNS discovery service', { 
      error: error.message,
      stack: error.stack 
    });
    
    // Don't throw, as this should not break the application
    // but provide clear console error message
    console.error('WARNING: Local network discovery service failed to start.');
    console.error('The application will still work, but you\'ll need to use its IP address');
    console.error(`Error details: ${error.message}`);
    
    return null;
  }
}

/**
 * Set up graceful shutdown of mDNS services
 */
function setupGracefulShutdown() {
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down mDNS services...');
    
    bonjour.unpublishAll(() => {
      logger.info('All mDNS services unpublished');
      process.exit(0);
    });
    
    // Ensure we don't hang forever
    setTimeout(() => {
      logger.warn('mDNS unpublish timeout - forcing exit');
      process.exit(0);
    }, 1000);
  });
}

module.exports = {
  initDiscovery
};