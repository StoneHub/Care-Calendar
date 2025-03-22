// Logger utility for Care Calendar application
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Default to INFO in production, DEBUG in development
const DEFAULT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
const CURRENT_LEVEL = DEFAULT_LEVEL;

// Store logs in memory for viewing in debug mode
const logHistory: LogEntry[] = [];
const MAX_LOG_HISTORY = 500;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

class Logger {
  private formatData(data?: any): string {
    if (!data) return '';
    try {
      return JSON.stringify(data, null, 2);
    } catch (err) {
      return `[Unstringifiable data: ${typeof data}]`;
    }
  }

  private addToHistory(level: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    logHistory.unshift(entry);
    
    // Keep log history at reasonable size
    if (logHistory.length > MAX_LOG_HISTORY) {
      logHistory.pop();
    }
  }

  debug(message: string, data?: any) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
      this.addToHistory('DEBUG', message, data);
    }
  }

  info(message: string, data?: any) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, data || '');
      this.addToHistory('INFO', message, data);
    }
  }

  warn(message: string, data?: any) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, data || '');
      this.addToHistory('WARN', message, data);
    }
  }

  error(message: string, data?: any) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, data || '');
      this.addToHistory('ERROR', message, data);
    }
  }

  getLogHistory() {
    return [...logHistory];
  }
  
  clearLogHistory() {
    logHistory.length = 0;
  }
}

export const logger = new Logger();