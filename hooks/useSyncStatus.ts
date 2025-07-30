import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncStatus } from '../lib/sync-manager';
import { syncToCloud, syncFromCloud, manualSync, checkSyncNeeded } from '../lib/sync';

export interface UseSyncStatusReturn {
  // Status
  isOnline: boolean;
  isSyncing: boolean;
  progress: number;
  lastSync: string | null;
  pendingChanges: number;
  
  // Errors and retry queue
  error: string | null;
  retryQueue: any[];
  
  // Actions
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  manualSync: () => Promise<void>;
  checkSyncNeeded: () => Promise<boolean>;
  
  // Computed values
  syncStatusText: string;
  syncStatusColor: string;
  hasErrors: boolean;
  hasPendingRetries: boolean;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });

    return unsubscribe;
  }, []);

  const handleSyncToCloud = useCallback(async () => {
    try {
      await syncToCloud({ retryFailed: true, showProgress: true });
    } catch (error) {
      console.error('Sync to cloud failed:', error);
    }
  }, []);

  const handleSyncFromCloud = useCallback(async () => {
    try {
      await syncFromCloud({ showProgress: true });
    } catch (error) {
      console.error('Sync from cloud failed:', error);
    }
  }, []);

  const handleManualSync = useCallback(async () => {
    try {
      await manualSync({ retryFailed: true });
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  }, []);

  const handleCheckSyncNeeded = useCallback(async () => {
    try {
      return await checkSyncNeeded();
    } catch (error) {
      console.error('Check sync needed failed:', error);
      return false;
    }
  }, []);

  // Computed values
  const syncStatusText = (() => {
    if (syncStatus.isSyncing) {
      return `Syncing... ${syncStatus.progress}%`;
    }
    if (syncStatus.error) {
      return 'Sync Error';
    }
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges} pending changes`;
    }
    if (syncStatus.lastSync) {
      return `Last sync: ${new Date(syncStatus.lastSync).toLocaleTimeString()}`;
    }
    return 'Not synced';
  })();

  const syncStatusColor = (() => {
    if (syncStatus.isSyncing) return 'blue';
    if (syncStatus.error) return 'red';
    if (syncStatus.pendingChanges > 0) return 'yellow';
    if (syncStatus.lastSync) return 'green';
    return 'gray';
  })();

  const hasErrors = !!syncStatus.error;
  const hasPendingRetries = syncStatus.retryQueue.length > 0;

  return {
    // Status
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    progress: syncStatus.progress,
    lastSync: syncStatus.lastSync,
    pendingChanges: syncStatus.pendingChanges,
    
    // Errors and retry queue
    error: syncStatus.error,
    retryQueue: syncStatus.retryQueue,
    
    // Actions
    syncToCloud: handleSyncToCloud,
    syncFromCloud: handleSyncFromCloud,
    manualSync: handleManualSync,
    checkSyncNeeded: handleCheckSyncNeeded,
    
    // Computed values
    syncStatusText,
    syncStatusColor,
    hasErrors,
    hasPendingRetries
  };
} 