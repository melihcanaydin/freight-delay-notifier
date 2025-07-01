// If you see type errors for 'process', ensure you have @types/node installed.
// If you see type errors for 'pino', ensure you have @types/pino installed (optional).
import pino from 'pino';

// Generate a unique request ID for tracking
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create base logger with enhanced configuration
const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  base: {
    service: 'freight-delay-system',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Create a child logger with request context
function createChildLogger(context: Record<string, unknown> = {}) {
  return baseLogger.child({
    requestId: generateRequestId(),
    ...context,
  });
}

// Enhanced logging functions with structured data
export function info(
  msg: string,
  meta?: Record<string, unknown>,
  context?: Record<string, unknown>,
) {
  const logger = context ? createChildLogger(context) : baseLogger;
  logger.info(meta || {}, msg);
}

export function error(
  msg: string,
  meta?: Record<string, unknown>,
  context?: Record<string, unknown>,
) {
  const logger = context ? createChildLogger(context) : baseLogger;
  logger.error(meta || {}, msg);
}

export function warn(
  msg: string,
  meta?: Record<string, unknown>,
  context?: Record<string, unknown>,
) {
  const logger = context ? createChildLogger(context) : baseLogger;
  logger.warn(meta || {}, msg);
}

export function debug(
  msg: string,
  meta?: Record<string, unknown>,
  context?: Record<string, unknown>,
) {
  const logger = context ? createChildLogger(context) : baseLogger;
  logger.debug(meta || {}, msg);
}

// Workflow-specific logger with workflow context
export function createWorkflowLogger(workflowId: string, workflowName: string) {
  return {
    info: (...args: unknown[]) => {
      console.log(`[${workflowName}][${workflowId}]`, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(`[${workflowName}][${workflowId}]`, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(`[${workflowName}][${workflowId}]`, ...args);
    },
  };
}

// Service-specific logger
export function createServiceLogger(serviceName: string) {
  return baseLogger.child({
    component: 'service',
    service: serviceName,
  });
}

// Activity-specific logger
export function createActivityLogger(activityName: string) {
  return baseLogger.child({
    component: 'activity',
    activityName,
  });
}

export function createRequestLogger(requestId: string) {
  return baseLogger.child({
    requestId,
    component: 'request',
  });
}
