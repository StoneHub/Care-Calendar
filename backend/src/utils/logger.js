const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log file paths
const logFilePath = path.join(logsDir, 'app.log');
const errorLogFilePath = path.join(logsDir, 'error.log');

// Configure log rotation - limit file size to 5MB
const MAX_LOG_SIZE = 5 * 1024 * 1024;

/**
 * Check if log rotation is needed and rotate if necessary
 * @param {string} filePath - Path to the log file
 */
function checkRotation(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_LOG_SIZE) {
        // Rotate the log file
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = path.join(dir, `${base}-${timestamp}${ext}`);
        
        fs.renameSync(filePath, rotatedPath);
      }
    }
  } catch (err) {
    console.error(`Error during log rotation: ${err.message}`);
  }
}

/**
 * Formats a log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 * @returns {string} Formatted log entry
 */
function formatLogEntry(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${level}] ${message}`;
  
  if (Object.keys(meta).length > 0) {
    try {
      logEntry += ` ${JSON.stringify(meta)}`;
    } catch (err) {
      logEntry += ` [Metadata serialization failed: ${err.message}]`;
    }
  }
  
  return logEntry;
}

/**
 * Writes a log entry to the specified file
 * @param {string} filePath - Path to the log file
 * @param {string} entry - Log entry to write
 */
function writeLog(filePath, entry) {
  checkRotation(filePath);
  
  fs.appendFile(filePath, entry + '\n', (err) => {
    if (err) {
      console.error(`Failed to write to log file ${filePath}: ${err.message}`);
    }
  });
}

/**
 * Logger implementation
 */
const logger = {
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  info(message, meta = {}) {
    const entry = formatLogEntry('INFO', message, meta);
    console.info(entry);
    writeLog(logFilePath, entry);
  },
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      const entry = formatLogEntry('DEBUG', message, meta);
      console.debug(entry);
      writeLog(logFilePath, entry);
    }
  },
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    const entry = formatLogEntry('WARN', message, meta);
    console.warn(entry);
    writeLog(logFilePath, entry);
  },
  
  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  error(message, meta = {}) {
    const entry = formatLogEntry('ERROR', message, meta);
    console.error(entry);
    writeLog(logFilePath, entry);
    writeLog(errorLogFilePath, entry); // Also write to error-specific log
  },
  
  /**
   * Log a request
   * @param {object} req - Express request object
   * @param {string} message - Log message
   */
  request(req, message = '') {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    this.info(`Request: ${message}`, meta);
  },
  
  /**
   * Create an Express middleware for logging requests
   * @returns {function} Express middleware
   */
  requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const originalEnd = res.end;
      
      res.end = function(chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);
        
        const responseTime = Date.now() - startTime;
        
        logger.info(`${req.method} ${req.originalUrl || req.url}`, {
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip || req.connection.remoteAddress
        });
      };
      
      next();
    };
  }
};

module.exports = logger;