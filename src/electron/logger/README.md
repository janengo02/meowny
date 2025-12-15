# Backend Logging System

This document explains the logging system implemented for the Electron main process.

## Overview

The logging system uses `electron-log` to provide structured, file-based logging for all backend operations including authentication, database queries, and IPC communication.

## Log Location

Logs are stored in the application's user data directory:

- **macOS**: `~/Library/Application Support/meowny/logs/main.log`
- **Windows**: `C:\Users\<username>\AppData\Roaming\meowny\logs\main.log`
- **Linux**: `~/.config/meowny/logs/main.log`

## Log Levels

### Development Mode
- **Console**: `debug` and above
- **File**: `debug` and above

### Production Mode
- **Console**: `warn` and above
- **File**: `info` and above

## Log Categories

- `auth` - Authentication operations (signIn, signUp, signOut, session validation)
- `database` - Database CRUD operations
- `ipc` - Inter-process communication between renderer and main
- `app` - Application lifecycle events (startup, shutdown)

## Usage Examples

### Basic Logging

```typescript
import { logger } from '../logger.js';

// Info level
logger.info('database', 'createBucket', 'Bucket created successfully', { bucketId: 123 });

// Warning level
logger.warn('database', 'updateBucket', 'Bucket not found', { bucketId: 456 });

// Error level
logger.error('auth', 'signIn', new Error('Invalid credentials'), { email: 'user@example.com' });

// Debug level (dev only)
logger.debug('ipc', 'db:getTransactions', 'Fetching transactions', { limit: 100 });
```

### Performance Tracking

```typescript
import { logger } from '../logger.js';

const endTimer = logger.startTimer('database', 'complexQuery');
// ... perform operation
endTimer(); // Logs: "Completed in Xms" or "Completed in Xms (SLOW)" if > 1000ms
```

### Database Operations Wrapper

```typescript
import { withDatabaseLogging, logValidationError } from '../dbLogger.js';

export async function createBucket(params: CreateBucketParams): Promise<Bucket> {
  return withDatabaseLogging('createBucket', async () => {
    // Validation
    if (!params.name?.trim()) {
      logValidationError('createBucket', 'name', 'Bucket name is required');
      throw new Error('Bucket name is required');
    }

    // ... actual database operation
    return bucket;
  }, { name: params.name, type: params.type });
}
```

## Security Features

### PII Protection

The logger automatically redacts sensitive fields:
- `password`
- `token`
- `secret`
- `apiKey`
- `accessToken`
- `refreshToken`

Example:
```typescript
logger.info('auth', 'signIn', 'User logged in', {
  email: 'user@example.com',
  password: '12345'  // Will be logged as [REDACTED]
});
```

### User Context

After successful login, the user ID is automatically added to all log entries:

```typescript
// In auth.ts after successful signIn
setUserId(data.user.id);

// All subsequent logs will include [user:abc-123-def]
```

## Log Format

```
[YYYY-MM-DD HH:mm:ss.ms] [LEVEL] [CATEGORY] [OPERATION] [user:USER_ID] MESSAGE DATA
```

Example:
```
[2024-12-15 00:20:37.123] [info] [AUTH] [signIn] [user:abc-123] User logged in successfully {"userId":"abc-123","email":"user@example.com"}
```

## What Gets Logged

### Automatically Logged (via IPC wrapper)
- All IPC handler calls with request/response timing
- IPC validation failures and malicious event attempts
- Request parameters and completion status

### Authentication
- Login attempts (success/failure)
- Registration attempts
- Session validation
- Logout events

### Database Operations
- Transaction creation with amount and bucket details
- Validation failures with field information
- Query execution with performance metrics
- All CRUD operations (when wrapped with `withDatabaseLogging`)

## Log Management

Logs are **not automatically rotated or archived**. You should manually delete old log files when needed.

To clear logs:
```bash
# macOS/Linux
rm ~/Library/Application\ Support/meowny/logs/main.log

# Windows
del %APPDATA%\meowny\logs\main.log
```

## Adding Logging to New Operations

### For Database Queries

```typescript
import { withDatabaseLogging, logValidationError } from '../dbLogger.js';

export async function myNewFunction(params: MyParams): Promise<MyResult> {
  return withDatabaseLogging('myNewFunction', async () => {
    // Your code here
    return result;
  }, { /* params to log */ });
}
```

### For Authentication

```typescript
import { logger } from '../logger.js';

logger.info('auth', 'operationName', 'Description', { data });
```

### For Custom Operations

```typescript
import { logger } from '../logger.js';

const endTimer = logger.startTimer('category', 'operationName');
try {
  logger.debug('category', 'operationName', 'Starting', { params });
  const result = await doSomething();
  logger.info('category', 'operationName', 'Success');
  endTimer();
  return result;
} catch (error) {
  logger.error('category', 'operationName', error as Error, { params });
  endTimer();
  throw error;
}
```

## Performance Considerations

- File writes are asynchronous and non-blocking
- Debug logs are only written in development mode
- Sensitive data is sanitized before logging
- Timers track operations > 1000ms as SLOW warnings

## Troubleshooting

### Logs not appearing
1. Check the logs directory exists
2. Verify file permissions
3. Check log level configuration

### Too many logs
- Adjust log levels in `src/electron/logger.ts`
- Remove debug statements from production code

### Missing user context
- Ensure `setUserId()` is called after authentication
- Check that `getCurrentUserId()` is working properly
