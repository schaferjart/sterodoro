import { offlineStorage } from './offline-storage';
import { ActivityObject, IntakeObject, ReadingObject, SessionLog, IntakeLog, ReadingLog, NoteLog } from '../types';

export interface MigrationResult {
  success: boolean;
  activitiesMigrated: number;
  intakesMigrated: number;
  readingObjectsMigrated: number;
  sessionLogsMigrated: number;
  intakeLogsMigrated: number;
  readingLogsMigrated: number;
  noteLogsMigrated: number;
  errors: string[];
}

export async function migrateFromLocalStorage(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    activitiesMigrated: 0,
    intakesMigrated: 0,
    readingObjectsMigrated: 0,
    sessionLogsMigrated: 0,
    intakeLogsMigrated: 0,
    readingLogsMigrated: 0,
    noteLogsMigrated: 0,
    errors: []
  };

  try {
    console.log('Starting migration from localStorage to IndexedDB...');

    // Migrate Activities
    try {
      const activitiesData = localStorage.getItem('activities');
      if (activitiesData) {
        const activities: ActivityObject[] = JSON.parse(activitiesData);
        for (const activity of activities) {
          await offlineStorage.addActivity(activity);
          result.activitiesMigrated++;
        }
        console.log(`Migrated ${result.activitiesMigrated} activities`);
      }
    } catch (error) {
      result.errors.push(`Activities migration failed: ${error}`);
      console.error('Error migrating activities:', error);
    }

    // Migrate Intakes
    try {
      const intakesData = localStorage.getItem('intakes');
      if (intakesData) {
        const intakes: IntakeObject[] = JSON.parse(intakesData);
        for (const intake of intakes) {
          await offlineStorage.addIntake(intake);
          result.intakesMigrated++;
        }
        console.log(`Migrated ${result.intakesMigrated} intakes`);
      }
    } catch (error) {
      result.errors.push(`Intakes migration failed: ${error}`);
      console.error('Error migrating intakes:', error);
    }

    // Migrate Reading Objects
    try {
      const readingObjectsData = localStorage.getItem('readingObjects');
      if (readingObjectsData) {
        const readingObjects: ReadingObject[] = JSON.parse(readingObjectsData);
        for (const reading of readingObjects) {
          await offlineStorage.addReadingObject(reading);
          result.readingObjectsMigrated++;
        }
        console.log(`Migrated ${result.readingObjectsMigrated} reading objects`);
      }
    } catch (error) {
      result.errors.push(`Reading objects migration failed: ${error}`);
      console.error('Error migrating reading objects:', error);
    }

    // Migrate Session Logs
    try {
      const sessionLogsData = localStorage.getItem('sessionLogs');
      if (sessionLogsData) {
        const sessionLogs: SessionLog[] = JSON.parse(sessionLogsData);
        for (const log of sessionLogs) {
          await offlineStorage.addSessionLog(log);
          result.sessionLogsMigrated++;
        }
        console.log(`Migrated ${result.sessionLogsMigrated} session logs`);
      }
    } catch (error) {
      result.errors.push(`Session logs migration failed: ${error}`);
      console.error('Error migrating session logs:', error);
    }

    // Migrate Intake Logs
    try {
      const intakeLogsData = localStorage.getItem('intakeLogs');
      if (intakeLogsData) {
        const intakeLogs: IntakeLog[] = JSON.parse(intakeLogsData);
        for (const log of intakeLogs) {
          await offlineStorage.addIntakeLog(log);
          result.intakeLogsMigrated++;
        }
        console.log(`Migrated ${result.intakeLogsMigrated} intake logs`);
      }
    } catch (error) {
      result.errors.push(`Intake logs migration failed: ${error}`);
      console.error('Error migrating intake logs:', error);
    }

    // Migrate Reading Logs
    try {
      const readingLogsData = localStorage.getItem('readingLogs');
      if (readingLogsData) {
        const readingLogs: ReadingLog[] = JSON.parse(readingLogsData);
        for (const log of readingLogs) {
          await offlineStorage.addReadingLog(log);
          result.readingLogsMigrated++;
        }
        console.log(`Migrated ${result.readingLogsMigrated} reading logs`);
      }
    } catch (error) {
      result.errors.push(`Reading logs migration failed: ${error}`);
      console.error('Error migrating reading logs:', error);
    }

    // Migrate Note Logs
    try {
      const noteLogsData = localStorage.getItem('noteLogs');
      if (noteLogsData) {
        const noteLogs: NoteLog[] = JSON.parse(noteLogsData);
        for (const log of noteLogs) {
          await offlineStorage.addNoteLog(log);
          result.noteLogsMigrated++;
        }
        console.log(`Migrated ${result.noteLogsMigrated} note logs`);
      }
    } catch (error) {
      result.errors.push(`Note logs migration failed: ${error}`);
      console.error('Error migrating note logs:', error);
    }

    // Clear localStorage after successful migration
    if (result.errors.length === 0) {
      try {
        localStorage.removeItem('activities');
        localStorage.removeItem('intakes');
        localStorage.removeItem('readingObjects');
        localStorage.removeItem('sessionLogs');
        localStorage.removeItem('intakeLogs');
        localStorage.removeItem('readingLogs');
        localStorage.removeItem('noteLogs');
        console.log('Cleared localStorage after successful migration');
      } catch (error) {
        console.warn('Could not clear localStorage:', error);
      }
    }

    const totalMigrated = result.activitiesMigrated + result.intakesMigrated + 
                         result.readingObjectsMigrated + result.sessionLogsMigrated + 
                         result.intakeLogsMigrated + result.readingLogsMigrated + 
                         result.noteLogsMigrated;

    console.log(`Migration completed. Total items migrated: ${totalMigrated}`);
    if (result.errors.length > 0) {
      console.warn(`Migration completed with ${result.errors.length} errors:`, result.errors);
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`General migration error: ${error}`);
    console.error('General migration error:', error);
  }

  return result;
}

export async function checkMigrationStatus(): Promise<{
  needsMigration: boolean;
  localStorageItems: number;
  indexedDBItems: number;
}> {
  try {
    // Check localStorage items
    let localStorageItems = 0;
    const localStorageKeys = ['activities', 'intakes', 'readingObjects', 'sessionLogs', 'intakeLogs', 'readingLogs', 'noteLogs'];
    
    for (const key of localStorageKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          localStorageItems += Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    }

    // Check IndexedDB items
    const indexedDBItems = await offlineStorage.getDatabaseSize();

    return {
      needsMigration: localStorageItems > 0 && indexedDBItems === 0,
      localStorageItems,
      indexedDBItems
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      needsMigration: false,
      localStorageItems: 0,
      indexedDBItems: 0
    };
  }
}

export async function clearLocalStorageData(): Promise<void> {
  try {
    localStorage.removeItem('activities');
    localStorage.removeItem('intakes');
    localStorage.removeItem('readingObjects');
    localStorage.removeItem('sessionLogs');
    localStorage.removeItem('intakeLogs');
    localStorage.removeItem('readingLogs');
    localStorage.removeItem('noteLogs');
    console.log('Cleared all localStorage data');
  } catch (error) {
    console.error('Error clearing localStorage data:', error);
    throw error;
  }
} 