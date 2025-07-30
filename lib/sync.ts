import { syncManager, SyncOperation } from './sync-manager';
import { offlineStorage } from './offline-storage';
import { supabase } from './supabase';

export interface SyncResult {
  success: boolean;
  progress: number;
  errors: string[];
  retryQueue: SyncOperation[];
  lastSync: string | null;
}

export interface SyncOptions {
  retryFailed?: boolean;
  showProgress?: boolean;
  maxRetries?: number;
}

// Enhanced sync function with progress tracking and error handling
export async function syncToCloud(options: SyncOptions = {}): Promise<SyncResult> {
  const { retryFailed = true, showProgress = true, maxRetries = 3 } = options;
  
  const result: SyncResult = {
    success: false,
    progress: 0,
    errors: [],
    retryQueue: [],
    lastSync: null
  };

  try {
    // Check online status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Start sync with progress tracking
    const unsubscribe = syncManager.subscribe((status) => {
      result.progress = status.progress;
      result.errors = status.error ? [status.error] : [];
      result.retryQueue = status.retryQueue;
      result.lastSync = status.lastSync;
    });

    await syncManager.syncToCloud();
    
    // Retry failed operations if requested
    if (retryFailed) {
      await syncManager.retryFailedOperations();
    }

    unsubscribe();
    result.success = true;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    result.success = false;
  }

  return result;
}

// Sync from cloud with progress tracking
export async function syncFromCloud(options: SyncOptions = {}): Promise<SyncResult> {
  const { showProgress = true } = options;
  
  const result: SyncResult = {
    success: false,
    progress: 0,
    errors: [],
    retryQueue: [],
    lastSync: null
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Subscribe to progress updates
    const unsubscribe = syncManager.subscribe((status) => {
      result.progress = status.progress;
      result.errors = status.error ? [status.error] : [];
      result.lastSync = status.lastSync;
    });

    await syncManager.syncFromCloud();
    
    unsubscribe();
    result.success = true;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    result.success = false;
  }

  return result;
}

// Add operation to retry queue
export function addToRetryQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): void {
  syncManager.addToRetryQueue(operation);
}

// Get current sync status
export function getSyncStatus() {
  return syncManager.getStatus();
}

// Manual sync with retry
export async function manualSync(options: SyncOptions = {}): Promise<SyncResult> {
  const { retryFailed = true } = options;
  
  try {
    await syncManager.manualSync();
    
    if (retryFailed) {
      await syncManager.retryFailedOperations();
    }

    return {
      success: true,
      progress: 100,
      errors: [],
      retryQueue: syncManager.getStatus().retryQueue,
      lastSync: syncManager.getStatus().lastSync
    };

  } catch (error) {
    return {
      success: false,
      progress: 0,
      errors: [error instanceof Error ? error.message : 'Manual sync failed'],
      retryQueue: syncManager.getStatus().retryQueue,
      lastSync: syncManager.getStatus().lastSync
    };
  }
}

// Check if sync is needed (compare local vs remote data)
export async function checkSyncNeeded(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get local data counts
    const localActivities = await offlineStorage.getActivities();
    const localIntakes = await offlineStorage.getIntakes();
    const localReadingObjects = await offlineStorage.getReadingObjects();
    const localSessionLogs = await offlineStorage.getSessionLogs();
    const localIntakeLogs = await offlineStorage.getIntakeLogs();
    const localReadingLogs = await offlineStorage.getReadingLogs();
    const localNoteLogs = await offlineStorage.getNoteLogs();

    // Get remote data counts
    const [
      { count: remoteActivities },
      { count: remoteIntakes },
      { count: remoteReadingObjects },
      { count: remoteSessionLogs },
      { count: remoteIntakeLogs },
      { count: remoteReadingLogs },
      { count: remoteNoteLogs }
    ] = await Promise.all([
      supabase.from('activity_objects').select('*', { count: 'exact', head: true }),
      supabase.from('intake_objects').select('*', { count: 'exact', head: true }),
      supabase.from('reading_objects').select('*', { count: 'exact', head: true }),
      supabase.from('session_logs').select('*', { count: 'exact', head: true }),
      supabase.from('intake_logs').select('*', { count: 'exact', head: true }),
      supabase.from('reading_logs').select('*', { count: 'exact', head: true }),
      supabase.from('note_logs').select('*', { count: 'exact', head: true })
    ]);

    // Compare counts
    const localTotal = localActivities.length + localIntakes.length + localReadingObjects.length + 
                      localSessionLogs.length + localIntakeLogs.length + localReadingLogs.length + localNoteLogs.length;
    const remoteTotal = (remoteActivities || 0) + (remoteIntakes || 0) + (remoteReadingObjects || 0) + 
                       (remoteSessionLogs || 0) + (remoteIntakeLogs || 0) + (remoteReadingLogs || 0) + (remoteNoteLogs || 0);

    return localTotal !== remoteTotal;

  } catch (error) {
    console.error('Error checking sync status:', error);
    return false;
  }
} 