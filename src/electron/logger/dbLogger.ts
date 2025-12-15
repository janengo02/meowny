import { logger } from './index.js';

/**
 * Wrapper function to add logging to database operations
 */
export async function withDatabaseLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  params?: Record<string, unknown>,
): Promise<T> {
  const endTimer = logger.startTimer('database', operation);

  try {
    logger.debug('database', operation, 'Executing', params);
    const result = await fn();
    logger.info('database', operation, 'Completed successfully');
    endTimer();
    return result;
  } catch (error) {
    logger.error('database', operation, error as Error, params);
    endTimer();
    throw error;
  }
}

/**
 * Log a database validation error
 */
export function logValidationError(
  operation: string,
  field: string,
  message: string,
): void {
  logger.warn('database', operation, `Validation failed: ${field}`, {
    field,
    message,
  });
}

/**
 * Log a database query with params
 */
export function logQuery(
  operation: string,
  table: string,
  action: 'select' | 'insert' | 'update' | 'delete',
  params?: Record<string, unknown>,
): void {
  logger.debug('database', operation, `${action.toUpperCase()} on ${table}`, params);
}
