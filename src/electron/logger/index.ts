import log from 'electron-log';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { isDev } from '../util.js';

// Configure log file paths - use resolvePathFn to defer path resolution until app is ready
log.transports.file.resolvePathFn = () => {
  const logsPath = path.join(app.getPath('userData'), 'logs');
  // Ensure logs directory exists
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
  }
  return path.join(logsPath, 'main.log');
};

// Configure log levels based on environment
if (isDev()) {
  // Development: Show everything in console, debug and above in file
  log.transports.console.level = 'debug';
  log.transports.file.level = 'debug';

  // Use default format with colors for console in development
  log.transports.console.format = '{h}:{i}:{s}.{ms} › [{level}] {text}';
} else {
  // Production: Show warnings and above in console, info and above in file
  log.transports.console.level = 'warn';
  log.transports.file.level = 'info';

  // Plain format for production console
  log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';
}

// Configure log format for file (always plain text, no colors)
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Disable log rotation (user will manage log files manually)
// Set to a very large number to effectively disable rotation
log.transports.file.maxSize = 100 * 1024 * 1024; // 100MB

// Log categories
export type LogCategory = 'auth' | 'database' | 'ipc' | 'app';

// User context (set after authentication)
let currentUserId: string | null = null;

export function setUserId(userId: string | null) {
  currentUserId = userId;
}

export function getUserId(): string | null {
  return currentUserId;
}

// Sanitize sensitive data from logs
function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  // Handle objects
  const sanitized: Record<string, unknown> = { ...data };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
  ];

  for (const key in sanitized) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

// Format log message with context
function formatMessage(
  category: LogCategory,
  operation: string,
  message?: string,
  data?: Record<string, unknown>,
): string {
  const parts = [`[${category.toUpperCase()}]`, `[${operation}]`];

  if (currentUserId) {
    parts.push(`[user:${currentUserId}]`);
  }

  if (message) {
    parts.push(message);
  }

  if (data) {
    const sanitized = sanitizeData(data);
    parts.push(JSON.stringify(sanitized));
  }

  return parts.join(' ');
}

// Logger interface
export const logger = {
  // Info level - successful operations
  info(
    category: LogCategory,
    operation: string,
    message?: string,
    data?: Record<string, unknown>,
  ) {
    log.info(formatMessage(category, operation, message, data));
  },

  // Warn level - validation failures, non-critical issues
  warn(
    category: LogCategory,
    operation: string,
    message?: string,
    data?: Record<string, unknown>,
  ) {
    log.warn(formatMessage(category, operation, message, data));
  },

  // Error level - critical failures
  error(
    category: LogCategory,
    operation: string,
    error: Error | string,
    data?: Record<string, unknown>,
  ) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    log.error(formatMessage(category, operation, errorMessage, data));
    if (stack) {
      log.error(`Stack trace: ${stack}`);
    }
  },

  // Debug level - detailed debugging (dev only)
  debug(
    category: LogCategory,
    operation: string,
    message?: string,
    data?: Record<string, unknown>,
  ) {
    if (isDev()) {
      log.debug(formatMessage(category, operation, message, data));
    }
  },

  // Performance tracking
  startTimer(category: LogCategory, operation: string): () => void {
    const start = Date.now();
    this.debug(category, operation, 'Started');

    return () => {
      const duration = Date.now() - start;
      const level = duration > 1000 ? 'warn' : 'info';

      if (level === 'warn') {
        this.warn(category, operation, `Completed in ${duration}ms (SLOW)`);
      } else {
        this.info(category, operation, `Completed in ${duration}ms`);
      }
    };
  },
};

// Export default for convenience
export default logger;

// Log application startup and show log file location
const logsPath = path.join(app.getPath('userData'), 'logs');
logger.info('app', 'startup', `Application starting`, {
  version: app.getVersion(),
  platform: process.platform,
  environment: isDev() ? 'development' : 'production',
  logsPath,
});

// Log the exact log file path for easy access
if (isDev()) {
  const logFilePath = path.join(logsPath, 'main.log');
  console.log('\n📝 Log file location:');
  console.log(`   ${logFilePath}\n`);
}
