// Time Utilities for Sterodoro
// Ensures consistent local time handling throughout the application

/**
 * Get current local time as ISO string
 * This ensures we always use local time, not UTC
 */
export function getCurrentLocalTime(): string {
  const now = new Date();
  return now.toISOString();
}

/**
 * Get current local time as Date object
 */
export function getCurrentLocalDate(): Date {
  return new Date();
}

/**
 * Get current timestamp (milliseconds since epoch)
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Format a date for display in local timezone
 */
export function formatLocalDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };

  return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
}

/**
 * Format a date for display (date only)
 */
export function formatLocalDateOnly(date: Date | string | number): string {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a time for display (time only)
 */
export function formatLocalTimeOnly(date: Date | string | number): string {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date for input fields (YYYY-MM-DDTHH:MM)
 */
export function formatDateForInput(date: Date | string | number): string {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  // Get local timezone offset in minutes
  const offset = dateObj.getTimezoneOffset();
  
  // Adjust for timezone to get local time
  const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
  
  return localDate.toISOString().slice(0, 16);
}

/**
 * Parse a date from input field format back to Date object
 */
export function parseDateFromInput(inputValue: string): Date {
  // Input format is YYYY-MM-DDTHH:MM in local time
  const date = new Date(inputValue);
  
  // Adjust for timezone to get correct local time
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() + (offset * 60 * 1000));
}

/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTimeString(date: Date | string | number): string {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 172800) {
    return 'yesterday';
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.toDateString() === yesterday.toDateString();
}

/**
 * Get start of day in local timezone
 */
export function getStartOfDay(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Get end of day in local timezone
 */
export function getEndOfDay(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Calculate duration between two dates in seconds
 */
export function getDurationInSeconds(start: Date | string | number, end: Date | string | number): number {
  const startDate = typeof start === 'string' ? new Date(start) : 
                    typeof start === 'number' ? new Date(start) : start;
  
  const endDate = typeof end === 'string' ? new Date(end) : 
                  typeof end === 'number' ? new Date(end) : end;
  
  return Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Get timezone name
 */
export function getTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Convert UTC time to local time
 */
export function utcToLocal(utcDate: Date | string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
}

/**
 * Convert local time to UTC
 */
export function localToUtc(localDate: Date | string): Date {
  const date = typeof localDate === 'string' ? new Date(localDate) : localDate;
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
} 