import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || 'logs';
const isProduction = process.env.NODE_ENV === 'production';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private writeToFile(filename: string, data: string): void {
    const filepath = path.join(LOG_DIR, filename);
    fs.appendFileSync(filepath, data + '\n');
  }

  private formatLog(entry: LogEntry): string {
    if (isProduction) {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry);
    }
    
    // Human-readable format for development
    let output = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.context) {
      output += ` ${JSON.stringify(entry.context)}`;
    }
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }
    return output;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLog(entry);

    // Console output
    switch (level) {
      case 'debug':
        if (!isProduction) console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // File output
    if (level === 'error') {
      this.writeToFile('error.log', formatted);
    }
    
    // All logs to combined.log in production
    if (isProduction) {
      this.writeToFile('combined.log', formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  // HTTP request logger
  request(method: string, url: string, statusCode: number, duration: number, userId?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `${method} ${url} ${statusCode} ${duration}ms`,
      context: {
        method,
        url,
        statusCode,
        duration,
        userId,
      },
    };

    const formatted = this.formatLog(entry);
    
    if (isProduction) {
      this.writeToFile('requests.log', formatted);
    } else {
      console.info(formatted);
    }
  }
}

const logger = new Logger();
export default logger;
export { Logger, LogLevel, LogContext };
