import { offlineStorage } from './offline-storage';
import { supabase } from './supabase';
import { getCurrentLocalTime } from './time-utils';
import { 
  ActivityObject, 
  IntakeObject, 
  ReadingObject, 
  SessionLog, 
  IntakeLog, 
  ReadingLog, 
  NoteLog 
} from '../types';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'activity' | 'intake' | 'readingObject' | 'sessionLog' | 'intakeLog' | 'readingLog' | 'noteLog';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingChanges: number;
  isSyncing: boolean;
  error: string | null;
  progress: number; // 0-100
  retryQueue: SyncOperation[];
}

export class SyncManager {
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    isSyncing: false,
    error: null,
    progress: 0,
    retryQueue: []
  };

  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Load sync queue from persistent storage
    this.loadSyncQueue();
    
    // Initial sync check
    this.checkOnlineStatus();
    
    // Start automatic background sync every 30 seconds
    this.startBackgroundSync();
  }

  private startBackgroundSync(): void {
    setInterval(async () => {
      // Skip sync if dev tools are likely open (performance check)
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        console.log('⏸️ Background sync skipped - dev tools likely open');
        return;
      }
      
      // Check authentication before attempting sync
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⏸️ Background sync skipped - user not authenticated');
        return;
      }
      
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing && this.syncStatus.retryQueue.length > 0) {
        console.log('🔄 Automatic background sync triggered');
        try {
          await this.syncToCloud();
          await this.retryFailedOperations();
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      }
    }, 30000); // 30 seconds
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const operations = await offlineStorage.getSyncOperations();
      this.syncStatus.retryQueue = operations;
      this.updateStatus({ retryQueue: operations });
      console.log(`Loaded ${operations.length} pending sync operations from storage`);
    } catch (error) {
      console.error('Error loading sync queue from storage:', error);
    }
  }

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.syncStatus);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private updateStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  private async checkOnlineStatus(): Promise<void> {
    try {
      // Test Supabase connection
      const { data, error } = await supabase
        .from('activity_objects')
        .select('id')
        .limit(1);
      
      this.updateStatus({ 
        isOnline: !error && navigator.onLine,
        error: error ? error.message : null
      });
    } catch (error) {
      this.updateStatus({ 
        isOnline: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private handleOnline(): void {
    this.updateStatus({ isOnline: true, error: null });
    // Trigger sync when coming back online
    this.syncToCloud();
  }

  private handleOffline(): void {
    this.updateStatus({ isOnline: false });
  }

  // Sync all data to Supabase
  async syncToCloud(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    console.log('🚀 Starting sync to cloud...');
    console.log('Current auth status:', await supabase.auth.getUser());
    
    this.updateStatus({ isSyncing: true, error: null, progress: 0 });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Starting sync to cloud...');

      // Sync activities (14% progress)
      await this.syncActivitiesToCloud();
      this.updateStatus({ progress: 14 });

      // Sync intakes (28% progress)
      await this.syncIntakesToCloud();
      this.updateStatus({ progress: 28 });

      // Sync reading objects (42% progress)
      await this.syncReadingObjectsToCloud();
      this.updateStatus({ progress: 42 });

      // Sync session logs (56% progress)
      await this.syncSessionLogsToCloud();
      this.updateStatus({ progress: 56 });

      // Sync intake logs (70% progress)
      await this.syncIntakeLogsToCloud();
      this.updateStatus({ progress: 70 });

      // Sync reading logs (84% progress)
      await this.syncReadingLogsToCloud();
      this.updateStatus({ progress: 84 });

      // Sync note logs (100% progress)
      await this.syncNoteLogsToCloud();
      this.updateStatus({ progress: 100 });

      this.updateStatus({ 
        lastSync: getCurrentLocalTime(),
        pendingChanges: 0,
        isSyncing: false,
        progress: 0
      });

      console.log('Sync to cloud completed successfully');

    } catch (error) {
      console.error('Sync to cloud failed:', error);
      this.updateStatus({ 
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        progress: 0
      });
    }
  }

  // Sync data from Supabase to local storage
  async syncFromCloud(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.updateStatus({ isSyncing: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Starting sync from cloud...');

      // Clear existing data
      await offlineStorage.clearAllData();

      // Sync activities
      await this.syncActivitiesFromCloud();

      // Sync intakes
      await this.syncIntakesFromCloud();

      // Sync reading objects
      await this.syncReadingObjectsFromCloud();

      // Sync session logs
      await this.syncSessionLogsFromCloud();

      // Sync intake logs
      await this.syncIntakeLogsFromCloud();

      // Sync reading logs
      await this.syncReadingLogsFromCloud();

      // Sync note logs
      await this.syncNoteLogsFromCloud();

      this.updateStatus({ 
        lastSync: getCurrentLocalTime(),
        isSyncing: false
      });

      console.log('Sync from cloud completed successfully');

    } catch (error) {
      console.error('Sync from cloud failed:', error);
      this.updateStatus({ 
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      });
    }
  }

  private async syncActivitiesToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const activities = await offlineStorage.getActivities();
    for (const activity of activities) {
      try {
        await supabase
          .from('activity_objects')
          .upsert({
            id: activity.id,
            user_id: user.id,
            name: activity.name,
            category: activity.category,
            sub_activity: activity.subActivity,
            sub_sub_activity: activity.subSubActivity,
            info: activity.info
          });
      } catch (error) {
        console.error('Error syncing activity to cloud:', error);
      }
    }
  }

  private async syncActivitiesFromCloud(): Promise<void> {
    const { data, error } = await supabase
      .from('activity_objects')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching activities from cloud:', error);
      return;
    }

    // Get current local activities to check for deletions
    const localActivities = await offlineStorage.getActivities();
    const localActivityIds = new Set(localActivities.map(a => a.id));

    for (const item of data || []) {
      // Skip if this activity was deleted locally and is in the retry queue
      const isDeletedLocally = this.syncStatus.retryQueue.some(
        op => op.type === 'delete' && op.entity === 'activity' && op.data.id === item.id
      );
      
      if (isDeletedLocally) {
        console.log(`Skipping activity ${item.id} (${item.name}) - deleted locally`);
        continue;
      }

      const activity: ActivityObject = {
        id: item.id,
        name: item.name,
        category: item.category,
        subActivity: item.sub_activity,
        subSubActivity: item.sub_sub_activity,
        info: item.info
      };
      await offlineStorage.addActivity(activity);
    }
  }

  private async syncIntakesToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const intakes = await offlineStorage.getIntakes();
    for (const intake of intakes) {
      try {
        await supabase
          .from('intake_objects')
          .upsert({
            id: intake.id,
            user_id: user.id,
            name: intake.name,
            type: intake.type,
            default_quantity: intake.defaultQuantity,
            default_unit: intake.defaultUnit,
            info: intake.info
          });
      } catch (error) {
        console.error('Error syncing intake to cloud:', error);
      }
    }
  }

  private async syncIntakesFromCloud(): Promise<void> {
    const { data, error } = await supabase
      .from('intake_objects')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching intakes from cloud:', error);
      return;
    }

    for (const item of data || []) {
      // Skip if this intake was deleted locally and is in the retry queue
      const isDeletedLocally = this.syncStatus.retryQueue.some(
        op => op.type === 'delete' && op.entity === 'intake' && op.data.id === item.id
      );
      
      if (isDeletedLocally) {
        console.log(`Skipping intake ${item.id} (${item.name}) - deleted locally`);
        continue;
      }

      const intake: IntakeObject = {
        id: item.id,
        name: item.name,
        type: item.type,
        defaultQuantity: item.default_quantity,
        defaultUnit: item.default_unit,
        info: item.info
      };
      await offlineStorage.addIntake(intake);
    }
  }

  private async syncReadingObjectsToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const readingObjects = await offlineStorage.getReadingObjects();
    for (const reading of readingObjects) {
      try {
        await supabase
          .from('reading_objects')
          .upsert({
            id: reading.id,
            user_id: user.id,
            book_name: reading.bookName,
            author: reading.author,
            year: reading.year,
            info: reading.info
          });
      } catch (error) {
        console.error('Error syncing reading object to cloud:', error);
      }
    }
  }

  private async syncReadingObjectsFromCloud(): Promise<void> {
    const { data, error } = await supabase
      .from('reading_objects')
      .select('*')
      .order('book_name');

    if (error) {
      console.error('Error fetching reading objects from cloud:', error);
      return;
    }

    for (const item of data || []) {
      // Skip if this reading object was deleted locally and is in the retry queue
      const isDeletedLocally = this.syncStatus.retryQueue.some(
        op => op.type === 'delete' && op.entity === 'readingObject' && op.data.id === item.id
      );
      
      if (isDeletedLocally) {
        console.log(`Skipping reading object ${item.id} (${item.book_name}) - deleted locally`);
        continue;
      }

      const reading: ReadingObject = {
        id: item.id,
        bookName: item.book_name,
        author: item.author,
        year: item.year,
        info: item.info
      };
      await offlineStorage.addReadingObject(reading);
    }
  }

  private async syncSessionLogsToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sessionLogs = await offlineStorage.getSessionLogs();
    for (const log of sessionLogs) {
      try {
        await supabase
          .from('session_logs')
          .upsert({
            id: log.id,
            user_id: user.id,
            activity_object_id: log.Object.id,
            time_start: log.TimeStart,
            time_end: log.TimeEnd,
            tracker_and_metric: log.TrackerAndMetric,
            notes: log.Notes
          });
      } catch (error) {
        console.error('Error syncing session log to cloud:', error);
      }
    }
  }

  private async syncSessionLogsFromCloud(): Promise<void> {
    const { data, error } = await supabase
      .from('session_logs')
      .select('*')
      .order('time_start', { ascending: false });

    if (error) {
      console.error('Error fetching session logs from cloud:', error);
      return;
    }

    for (const item of data || []) {
      const log: SessionLog = {
        id: item.id,
        TimeStart: item.time_start,
        TimeEnd: item.time_end,
        Object: {
          id: item.activity_object_id,
          name: 'Unknown Activity',
          type: 'Personal' as any,
        },
        TrackerAndMetric: item.tracker_and_metric || [],
        Notes: item.notes || []
      };
      await offlineStorage.addSessionLog(log);
    }
  }

  private async syncIntakeLogsToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const intakeLogs = await offlineStorage.getIntakeLogs();
    for (const log of intakeLogs) {
      try {
        await supabase
          .from('intake_logs')
          .upsert({
            id: log.id,
            user_id: user.id,
            intake_object_id: log.intake.id,
            timestamp: log.timestamp,
            quantity: log.quantity,
            unit: log.unit
          });
      } catch (error) {
        console.error('Error syncing intake log to cloud:', error);
      }
    }
  }

  private async syncIntakeLogsFromCloud(): Promise<void> {
    const { data, error } = await supabase
      .from('intake_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching intake logs from cloud:', error);
      return;
    }

    for (const item of data || []) {
      const log: IntakeLog = {
        id: item.id,
        timestamp: item.timestamp,
        intake: {
          id: item.intake_object_id,
          name: 'Unknown Intake',
          type: 'Drink' as any,
          defaultQuantity: 1,
          defaultUnit: 'Piece' as any
        },
        quantity: item.quantity,
        unit: item.unit as any
      };
      await offlineStorage.addIntakeLog(log);
    }
  }

  private async syncReadingLogsToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const readingLogs = await offlineStorage.getReadingLogs();
    for (const log of readingLogs) {
      try {
        await supabase
          .from('reading_logs')
          .upsert({
            id: log.id,
            user_id: user.id,
            reading_object_id: log.Object.id,
            time_start: log.TimeStart,
            time_end: log.TimeEnd,
            tracker_and_metric: log.TrackerAndMetric,
            notes: log.Notes
          });
      } catch (error) {
        console.error('Error syncing reading log to cloud:', error);
      }
    }
  }

  private async syncReadingLogsFromCloud(): Promise<void> {
    const { data, error } = await supabase
      .from('reading_logs')
      .select('*')
      .order('time_start', { ascending: false });

    if (error) {
      console.error('Error fetching reading logs from cloud:', error);
      return;
    }

    for (const item of data || []) {
      const log: ReadingLog = {
        id: item.id,
        TimeStart: item.time_start,
        TimeEnd: item.time_end,
        Object: {
          id: item.reading_object_id,
          bookName: 'Unknown Book',
          author: 'Unknown Author'
        },
        TrackerAndMetric: item.tracker_and_metric || [],
        Notes: item.notes || []
      };
      await offlineStorage.addReadingLog(log);
    }
  }

  private async syncNoteLogsToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const noteLogs = await offlineStorage.getNoteLogs();
    for (const log of noteLogs) {
      try {
        await supabase
          .from('note_logs')
          .upsert({
            id: log.id,
            user_id: user.id,
            timestamp: log.timestamp,
            title: log.title,
            content: log.content,
            tracker_and_metric: log.TrackerAndMetric,
            related_activities: log.relatedActivities
          });
      } catch (error) {
        console.error('Error syncing note log to cloud:', error);
      }
    }
  }

  private async syncNoteLogsFromCloud(): Promise<void> {
    const { data, error } = await supabase
      .from('note_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching note logs from cloud:', error);
      return;
    }

    for (const item of data || []) {
      const log: NoteLog = {
        id: item.id,
        timestamp: item.timestamp,
        title: item.title,
        content: item.content,
        TrackerAndMetric: item.tracker_and_metric || [],
        relatedActivities: item.related_activities || []
      };
      await offlineStorage.addNoteLog(log);
    }
  }

  // Get current sync status
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Add operation to retry queue
  async addToRetryQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: getCurrentLocalTime(),
      retryCount: 0,
      maxRetries: 3
    };

    // Add to persistent storage
    await offlineStorage.addSyncOperation(syncOperation);

    // Update in-memory queue
    this.syncStatus.retryQueue.push(syncOperation);
    this.updateStatus({ retryQueue: [...this.syncStatus.retryQueue] });
  }

  // Retry failed operations
  async retryFailedOperations(): Promise<void> {
    if (this.syncStatus.retryQueue.length === 0) return;

    console.log(`Retrying ${this.syncStatus.retryQueue.length} failed operations...`);

    const operationsToRetry = [...this.syncStatus.retryQueue];
    const successfulOperations: string[] = [];
    const failedOperations: SyncOperation[] = [];

    for (const operation of operationsToRetry) {
      try {
        await this.executeSyncOperation(operation);
        successfulOperations.push(operation.id);
        // Remove successful operation from persistent storage
        await offlineStorage.deleteSyncOperation(operation.id);
      } catch (error) {
        operation.retryCount++;
        if (operation.retryCount < operation.maxRetries) {
          failedOperations.push(operation);
        } else {
          console.error(`Operation ${operation.id} failed after ${operation.maxRetries} retries:`, error);
          // Remove failed operation from persistent storage after max retries
          await offlineStorage.deleteSyncOperation(operation.id);
        }
      }
    }

    // Update retry queue
    this.updateStatus({ 
      retryQueue: failedOperations,
      pendingChanges: failedOperations.length
    });

    console.log(`Retry completed: ${successfulOperations.length} successful, ${failedOperations.length} still failed`);
  }

  // Execute a single sync operation
  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    console.log('🔍 Checking authentication for sync operation:', operation.type, operation.entity);
    
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('Sync auth check:', { user: !!user, userId: user?.id, error });
    
    if (!user) {
      console.error('❌ User not authenticated for sync operation');
      throw new Error('User not authenticated');
    }

    switch (operation.entity) {
      case 'activity':
        if (operation.type === 'delete') {
          await supabase.from('activity_objects').delete().eq('id', operation.data.id);
        } else {
          await supabase.from('activity_objects').upsert({
            ...operation.data,
            user_id: user.id
          });
        }
        break;
      case 'intake':
        if (operation.type === 'delete') {
          await supabase.from('intake_objects').delete().eq('id', operation.data.id);
        } else {
          await supabase.from('intake_objects').upsert({
            ...operation.data,
            user_id: user.id
          });
        }
        break;
      case 'readingObject':
        if (operation.type === 'delete') {
          await supabase.from('reading_objects').delete().eq('id', operation.data.id);
        } else {
          await supabase.from('reading_objects').upsert({
            ...operation.data,
            user_id: user.id
          });
        }
        break;
      case 'sessionLog':
        if (operation.type === 'delete') {
          await supabase.from('session_logs').delete().eq('id', operation.data.id);
        } else {
          await supabase.from('session_logs').upsert({
            ...operation.data,
            user_id: user.id
          });
        }
        break;
      case 'intakeLog':
        if (operation.type === 'delete') {
          await supabase.from('intake_logs').delete().eq('id', operation.data.id);
        } else {
          await supabase.from('intake_logs').upsert({
            ...operation.data,
            user_id: user.id
          });
        }
        break;
      case 'readingLog':
        if (operation.type === 'delete') {
          await supabase.from('reading_logs').delete().eq('id', operation.data.id);
        } else {
          await supabase.from('reading_logs').upsert({
            ...operation.data,
            user_id: user.id
          });
        }
        break;
      case 'noteLog':
        if (operation.type === 'delete') {
          await supabase.from('note_logs').delete().eq('id', operation.data.id);
        } else {
          await supabase.from('note_logs').upsert({
            ...operation.data,
            user_id: user.id
          });
        }
        break;
      default:
        throw new Error(`Unknown entity type: ${operation.entity}`);
    }
  }

  // Manual sync trigger
  async manualSync(): Promise<void> {
    if (this.syncStatus.isOnline) {
      await this.syncToCloud();
      await this.retryFailedOperations();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }
}

// Create global sync manager instance
export const syncManager = new SyncManager(); 