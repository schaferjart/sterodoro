// Error Reporting System for Sterodoro
// Provides structured error logging and reporting capabilities

import { getCurrentLocalTime } from './time-utils';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
  userAgent: string;
  url: string;
  environment: string;
  version?: string;
}

// Error reporting configuration
const ERROR_REPORTING_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  logToConsole: true,
  maxErrorsPerSession: 50,
  errorQueue: [] as ErrorReport[]
};

// Report an error with context
export const reportError = (error: Error, context?: ErrorContext) => {
  const errorReport: ErrorReport = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: getCurrentLocalTime(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown'
  };

  // Add to error queue
  ERROR_REPORTING_CONFIG.errorQueue.push(errorReport);
  
  // Limit queue size
  if (ERROR_REPORTING_CONFIG.errorQueue.length > ERROR_REPORTING_CONFIG.maxErrorsPerSession) {
    ERROR_REPORTING_CONFIG.errorQueue.shift();
  }

  // Log to console in development or when explicitly enabled
  if (ERROR_REPORTING_CONFIG.logToConsole || process.env.NODE_ENV === 'development') {
    console.error('Sterodoro Error:', errorReport);
  }

  // Send to external service in production
  if (ERROR_REPORTING_CONFIG.enabled) {
    sendErrorToExternalService(errorReport);
  }
};

// Send error to external service (Sentry, LogRocket, etc.)
const sendErrorToExternalService = async (errorReport: ErrorReport) => {
  try {
    // TODO: Integrate with Sentry or similar service
    // Example Sentry integration:
    // Sentry.captureException(new Error(errorReport.message), {
    //   extra: errorReport
    // });
    
    // For now, just log to console in production
    console.error('Production Error Report:', errorReport);
  } catch (reportingError) {
    // Don't let error reporting errors break the app
    console.error('Error reporting failed:', reportingError);
  }
};

// Get all errors from current session
export const getErrorQueue = (): ErrorReport[] => {
  return [...ERROR_REPORTING_CONFIG.errorQueue];
};

// Clear error queue
export const clearErrorQueue = (): void => {
  ERROR_REPORTING_CONFIG.errorQueue = [];
};

// Get error statistics
export const getErrorStats = () => {
  const errors = ERROR_REPORTING_CONFIG.errorQueue;
  const errorCounts = errors.reduce((acc, error) => {
    const key = error.message;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalErrors: errors.length,
    uniqueErrors: Object.keys(errorCounts).length,
    errorCounts,
    lastError: errors[errors.length - 1]
  };
};

// Report non-error issues (warnings, info)
export const reportWarning = (message: string, context?: ErrorContext) => {
  console.warn('Sterodoro Warning:', {
    message,
    context,
    timestamp: getCurrentLocalTime(),
    url: window.location.href
  });
};

export const reportInfo = (message: string, context?: ErrorContext) => {
  console.info('Sterodoro Info:', {
    message,
    context,
    timestamp: getCurrentLocalTime(),
    url: window.location.href
  });
};

// Performance monitoring
export const reportPerformance = (metric: string, value: number, context?: ErrorContext) => {
  const performanceReport = {
    metric,
    value,
    context,
    timestamp: getCurrentLocalTime(),
    url: window.location.href
  };

  console.log('Sterodoro Performance:', performanceReport);
  
  // TODO: Send to analytics service
  // analytics.track('performance', performanceReport);
};

// Initialize error reporting
export const initializeErrorReporting = () => {
  // Global error handler
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      component: 'Global',
      action: 'Unhandled Error'
    });
  });

  // Promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    reportError(new Error(event.reason), {
      component: 'Global',
      action: 'Unhandled Promise Rejection'
    });
  });

  console.log('Error reporting initialized');
}; 