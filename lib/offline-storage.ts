import Dexie, { Table } from 'dexie';
import { 
  ActivityObject, 
  IntakeObject, 
  ReadingObject, 
  SessionLog, 
  IntakeLog, 
  ReadingLog, 
  NoteLog,
  ActivityCategory,
  IntakeType,
  IntakeUnit
} from '../types';

// Database-specific types for offline storage
interface DBSessionLog {
  id: string;
  userId: string;
  activityObjectId: string;
  timeStart: string;
  timeEnd: string;
  trackerAndMetric: any[];
  notes: any[];
}

interface DBSyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'activity' | 'intake' | 'readingObject' | 'sessionLog' | 'intakeLog' | 'readingLog' | 'noteLog';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

interface DBIntakeLog {
  id: string;
  userId: string;
  intakeObjectId: string;
  timestamp: string;
  quantity: number;
  unit: string;
}

interface DBReadingLog {
  id: string;
  userId: string;
  readingObjectId: string;
  timeStart: string;
  timeEnd: string;
  trackerAndMetric: any[];
  notes: any[];
}

interface DBNoteLog {
  id: string;
  userId: string;
  timestamp: string;
  title?: string;
  content: string;
  trackerAndMetric: any[];
  relatedActivities?: any[];
}

// Extend Dexie with our database schema
export class SterodoroDB extends Dexie {
  activities!: Table<ActivityObject>;
  intakes!: Table<IntakeObject>;
  readingObjects!: Table<ReadingObject>;
  sessionLogs!: Table<DBSessionLog>;
  intakeLogs!: Table<DBIntakeLog>;
  readingLogs!: Table<DBReadingLog>;
  noteLogs!: Table<DBNoteLog>;
  syncOperations!: Table<DBSyncOperation>;

  constructor() {
    super('SterodoroDB');
    
    // Define database schema
    this.version(1).stores({
      activities: 'id, userId, category, name',
      intakes: 'id, userId, type, name',
      readingObjects: 'id, userId, bookName, author',
      sessionLogs: 'id, userId, activityObjectId, timeStart, timeEnd',
      intakeLogs: 'id, userId, intakeObjectId, timestamp',
      readingLogs: 'id, userId, readingObjectId, timeStart, timeEnd',
      noteLogs: 'id, userId, timestamp, title',
      syncOperations: 'id, type, entity, timestamp'
    });
  }
}

// Create database instance
export const db = new SterodoroDB();

// Offline storage interface
export const offlineStorage = {
  // ===== ACTIVITIES =====
  async getActivities(): Promise<ActivityObject[]> {
    try {
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (!user) return [];
      
      return await db.activities
        .where('userId')
        .equals(user.id)
        .toArray();
    } catch (error) {
      console.error('Error getting activities from offline storage:', error);
      return [];
    }
  },

  async addActivity(activity: ActivityObject): Promise<void> {
    try {
      await db.activities.add(activity);
    } catch (error) {
      console.error('Error adding activity to offline storage:', error);
      throw error;
    }
  },

  async updateActivity(activity: ActivityObject): Promise<void> {
    try {
      await db.activities.update(activity.id, activity);
    } catch (error) {
      console.error('Error updating activity in offline storage:', error);
      throw error;
    }
  },

  async deleteActivity(id: string): Promise<void> {
    try {
      await db.activities.delete(id);
      // Also delete related session logs
      await db.sessionLogs
        .where('activityObjectId')
        .equals(id)
        .delete();
    } catch (error) {
      console.error('Error deleting activity from offline storage:', error);
      throw error;
    }
  },

  // ===== INTAKES =====
  async getIntakes(): Promise<IntakeObject[]> {
    try {
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (!user) return [];
      
      return await db.intakes
        .where('userId')
        .equals(user.id)
        .toArray();
    } catch (error) {
      console.error('Error getting intakes from offline storage:', error);
      return [];
    }
  },

  async addIntake(intake: IntakeObject): Promise<void> {
    try {
      await db.intakes.add(intake);
    } catch (error) {
      console.error('Error adding intake to offline storage:', error);
      throw error;
    }
  },

  async updateIntake(intake: IntakeObject): Promise<void> {
    try {
      await db.intakes.update(intake.id, intake);
    } catch (error) {
      console.error('Error updating intake in offline storage:', error);
      throw error;
    }
  },

  async deleteIntake(id: string): Promise<void> {
    try {
      await db.intakes.delete(id);
      // Also delete related intake logs
      await db.intakeLogs
        .where('intakeObjectId')
        .equals(id)
        .delete();
    } catch (error) {
      console.error('Error deleting intake from offline storage:', error);
      throw error;
    }
  },

  // ===== READING OBJECTS =====
  async getReadingObjects(): Promise<ReadingObject[]> {
    try {
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (!user) return [];
      
      return await db.readingObjects
        .where('userId')
        .equals(user.id)
        .toArray();
    } catch (error) {
      console.error('Error getting reading objects from offline storage:', error);
      return [];
    }
  },

  async addReadingObject(reading: ReadingObject): Promise<void> {
    try {
      await db.readingObjects.add(reading);
    } catch (error) {
      console.error('Error adding reading object to offline storage:', error);
      throw error;
    }
  },

  async updateReadingObject(reading: ReadingObject): Promise<void> {
    try {
      await db.readingObjects.update(reading.id, reading);
    } catch (error) {
      console.error('Error updating reading object in offline storage:', error);
      throw error;
    }
  },

  async deleteReadingObject(id: string): Promise<void> {
    try {
      await db.readingObjects.delete(id);
      // Also delete related reading logs
      await db.readingLogs
        .where('readingObjectId')
        .equals(id)
        .delete();
    } catch (error) {
      console.error('Error deleting reading object from offline storage:', error);
      throw error;
    }
  },

  // ===== SESSION LOGS =====
  async getSessionLogs(): Promise<SessionLog[]> {
    try {
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (!user) return [];
      
      const logs = await db.sessionLogs
        .where('userId')
        .equals(user.id)
        .toArray();
      
      // Join with activities to get full objects
      const activities = await this.getActivities();
      return logs.map(log => ({
        id: log.id,
        TimeStart: log.timeStart,
        TimeEnd: log.timeEnd,
        Object: activities.find(act => act.id === log.activityObjectId) ? {
          id: activities.find(act => act.id === log.activityObjectId)!.id,
          name: activities.find(act => act.id === log.activityObjectId)!.name,
          type: activities.find(act => act.id === log.activityObjectId)!.category,
          subActivity: activities.find(act => act.id === log.activityObjectId)!.subActivity,
          subSubActivity: activities.find(act => act.id === log.activityObjectId)!.subSubActivity,
          info: activities.find(act => act.id === log.activityObjectId)!.info
        } : {
          id: log.activityObjectId,
          name: 'Unknown Activity',
          type: ActivityCategory.Personal
        },
        TrackerAndMetric: log.trackerAndMetric || [],
        Notes: log.notes || []
      }));
    } catch (error) {
      console.error('Error getting session logs from offline storage:', error);
      return [];
    }
  },

  async addSessionLog(log: SessionLog): Promise<void> {
    try {
      const dbLog: DBSessionLog = {
        id: log.id,
        userId: '', // Will be set by the function
        activityObjectId: log.Object.id,
        timeStart: log.TimeStart,
        timeEnd: log.TimeEnd,
        trackerAndMetric: log.TrackerAndMetric,
        notes: log.Notes
      };
      
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (user) {
        dbLog.userId = user.id;
      }
      
      await db.sessionLogs.add(dbLog);
    } catch (error) {
      console.error('Error adding session log to offline storage:', error);
      throw error;
    }
  },

  async deleteSessionLog(id: string): Promise<void> {
    try {
      await db.sessionLogs.delete(id);
    } catch (error) {
      console.error('Error deleting session log from offline storage:', error);
      throw error;
    }
  },

  // ===== INTAKE LOGS =====
  async getIntakeLogs(): Promise<IntakeLog[]> {
    try {
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (!user) return [];
      
      const logs = await db.intakeLogs
        .where('userId')
        .equals(user.id)
        .toArray();
      
      // Join with intakes to get full objects
      const intakes = await this.getIntakes();
      return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        intake: intakes.find(intake => intake.id === log.intakeObjectId) || {
          id: log.intakeObjectId,
          name: 'Unknown Intake',
          type: IntakeType.Drink,
          defaultQuantity: 1,
          defaultUnit: IntakeUnit.Piece
        },
        quantity: log.quantity,
        unit: log.unit as IntakeUnit
      }));
    } catch (error) {
      console.error('Error getting intake logs from offline storage:', error);
      return [];
    }
  },

  async addIntakeLog(log: IntakeLog): Promise<void> {
    try {
      const dbLog: DBIntakeLog = {
        id: log.id,
        userId: '', // Will be set by the function
        intakeObjectId: log.intake.id,
        timestamp: log.timestamp,
        quantity: log.quantity,
        unit: log.unit
      };
      
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (user) {
        dbLog.userId = user.id;
      }
      
      await db.intakeLogs.add(dbLog);
    } catch (error) {
      console.error('Error adding intake log to offline storage:', error);
      throw error;
    }
  },

  async deleteIntakeLog(id: string): Promise<void> {
    try {
      await db.intakeLogs.delete(id);
    } catch (error) {
      console.error('Error deleting intake log from offline storage:', error);
      throw error;
    }
  },

  // ===== READING LOGS =====
  async getReadingLogs(): Promise<ReadingLog[]> {
    try {
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (!user) return [];
      
      const logs = await db.readingLogs
        .where('userId')
        .equals(user.id)
        .toArray();
      
      // Join with reading objects to get full objects
      const readingObjects = await this.getReadingObjects();
      return logs.map(log => ({
        id: log.id,
        TimeStart: log.timeStart,
        TimeEnd: log.timeEnd,
        Object: readingObjects.find(reading => reading.id === log.readingObjectId) || {
          id: log.readingObjectId,
          bookName: 'Unknown Book',
          author: 'Unknown Author'
        },
        TrackerAndMetric: log.trackerAndMetric || [],
        Notes: log.notes || []
      }));
    } catch (error) {
      console.error('Error getting reading logs from offline storage:', error);
      return [];
    }
  },

  async addReadingLog(log: ReadingLog): Promise<void> {
    try {
      const dbLog: DBReadingLog = {
        id: log.id,
        userId: '', // Will be set by the function
        readingObjectId: log.Object.id,
        timeStart: log.TimeStart,
        timeEnd: log.TimeEnd,
        trackerAndMetric: log.TrackerAndMetric,
        notes: log.Notes
      };
      
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (user) {
        dbLog.userId = user.id;
      }
      
      await db.readingLogs.add(dbLog);
    } catch (error) {
      console.error('Error adding reading log to offline storage:', error);
      throw error;
    }
  },

  async deleteReadingLog(id: string): Promise<void> {
    try {
      await db.readingLogs.delete(id);
    } catch (error) {
      console.error('Error deleting reading log from offline storage:', error);
      throw error;
    }
  },

  // ===== NOTE LOGS =====
  async getNoteLogs(): Promise<NoteLog[]> {
    try {
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (!user) return [];
      
      const logs = await db.noteLogs
        .where('userId')
        .equals(user.id)
        .toArray();
      
      return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        title: log.title,
        content: log.content,
        TrackerAndMetric: log.trackerAndMetric || [],
        relatedActivities: log.relatedActivities || []
      }));
    } catch (error) {
      console.error('Error getting note logs from offline storage:', error);
      return [];
    }
  },

  async addNoteLog(log: NoteLog): Promise<void> {
    try {
      const dbLog: DBNoteLog = {
        id: log.id,
        userId: '', // Will be set by the function
        timestamp: log.timestamp,
        title: log.title,
        content: log.content,
        trackerAndMetric: log.TrackerAndMetric,
        relatedActivities: log.relatedActivities
      };
      
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      if (user) {
        dbLog.userId = user.id;
      }
      
      await db.noteLogs.add(dbLog);
    } catch (error) {
      console.error('Error adding note log to offline storage:', error);
      throw error;
    }
  },

  async deleteNoteLog(id: string): Promise<void> {
    try {
      await db.noteLogs.delete(id);
    } catch (error) {
      console.error('Error deleting note log from offline storage:', error);
      throw error;
    }
  },

  // ===== UTILITY FUNCTIONS =====
  async clearAllData(): Promise<void> {
    try {
      await db.transaction('rw', [
        db.activities, 
        db.intakes, 
        db.readingObjects, 
        db.sessionLogs, 
        db.intakeLogs, 
        db.readingLogs, 
        db.noteLogs
      ], async () => {
        await db.activities.clear();
        await db.intakes.clear();
        await db.readingObjects.clear();
        await db.sessionLogs.clear();
        await db.intakeLogs.clear();
        await db.readingLogs.clear();
        await db.noteLogs.clear();
      });
    } catch (error) {
      console.error('Error clearing all data from offline storage:', error);
      throw error;
    }
  },

  async getDatabaseSize(): Promise<number> {
    try {
      const activities = await db.activities.count();
      const intakes = await db.intakes.count();
      const readingObjects = await db.readingObjects.count();
      const sessionLogs = await db.sessionLogs.count();
      const intakeLogs = await db.intakeLogs.count();
      const readingLogs = await db.readingLogs.count();
      const noteLogs = await db.noteLogs.count();
      const syncOperations = await db.syncOperations.count();
      
      return activities + intakes + readingObjects + sessionLogs + intakeLogs + readingLogs + noteLogs + syncOperations;
    } catch (error) {
      console.error('Error getting database size:', error);
      return 0;
    }
  },

  // ===== SYNC OPERATIONS =====
  async getSyncOperations(): Promise<DBSyncOperation[]> {
    try {
      return await db.syncOperations.toArray();
    } catch (error) {
      console.error('Error getting sync operations from offline storage:', error);
      return [];
    }
  },

  async addSyncOperation(operation: DBSyncOperation): Promise<void> {
    try {
      await db.syncOperations.add(operation);
    } catch (error) {
      console.error('Error adding sync operation to offline storage:', error);
      throw error;
    }
  },

  async deleteSyncOperation(id: string): Promise<void> {
    try {
      await db.syncOperations.delete(id);
    } catch (error) {
      console.error('Error deleting sync operation from offline storage:', error);
      throw error;
    }
  },

  async clearSyncOperations(): Promise<void> {
    try {
      await db.syncOperations.clear();
    } catch (error) {
      console.error('Error clearing sync operations from offline storage:', error);
      throw error;
    }
  }
}; 