import React, { useState, useEffect } from 'react';
import { getCurrentTimestamp } from '../lib/time-utils';
import { offlineStorage } from '../lib/offline-storage';
import { migrateFromLocalStorage, checkMigrationStatus } from '../lib/migration';
import { syncManager } from '../lib/sync-manager';
import { ActivityObject, IntakeObject, ReadingObject, ActivityCategory, IntakeType, IntakeUnit } from '../types';

const OfflineStorageTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityObject[]>([]);
  const [intakes, setIntakes] = useState<IntakeObject[]>([]);
  const [readingObjects, setReadingObjects] = useState<ReadingObject[]>([]);
  const [dbSize, setDbSize] = useState<number>(0);

  useEffect(() => {
    // Subscribe to sync status
    const unsubscribe = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });

    return unsubscribe;
  }, []);

  const checkMigration = async () => {
    try {
      setStatus('Checking migration status...');
      const status = await checkMigrationStatus();
      setMigrationStatus(status);
      setStatus(`Migration check complete. Needs migration: ${status.needsMigration}`);
    } catch (error: any) {
      console.error('Error checking migration:', error);
      setStatus(`❌ Error checking migration: ${error.message}`);
    }
  };

  const runMigration = async () => {
    try {
      setStatus('Starting migration from localStorage to IndexedDB...');
      const result = await migrateFromLocalStorage();
      setStatus(`✅ Migration completed! Migrated ${result.activitiesMigrated} activities, ${result.intakesMigrated} intakes, ${result.readingObjectsMigrated} reading objects, ${result.sessionLogsMigrated} session logs, ${result.intakeLogsMigrated} intake logs, ${result.readingLogsMigrated} reading logs, ${result.noteLogsMigrated} note logs`);
      
      if (result.errors.length > 0) {
        setStatus(prev => prev + ` Errors: ${result.errors.join(', ')}`);
      }
      
      await loadData();
    } catch (error: any) {
      console.error('Error during migration:', error);
      setStatus(`❌ Migration failed: ${error.message}`);
    }
  };

  const loadData = async () => {
    try {
      setStatus('Loading data from offline storage...');
      const [activitiesData, intakesData, readingData, size] = await Promise.all([
        offlineStorage.getActivities(),
        offlineStorage.getIntakes(),
        offlineStorage.getReadingObjects(),
        offlineStorage.getDatabaseSize()
      ]);
      
      setActivities(activitiesData);
      setIntakes(intakesData);
      setReadingObjects(readingData);
      setDbSize(size);
      
      setStatus(`✅ Loaded ${activitiesData.length} activities, ${intakesData.length} intakes, ${readingData.length} reading objects. Total DB size: ${size} items`);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setStatus(`❌ Error loading data: ${error.message}`);
    }
  };

  const addTestActivity = async () => {
    try {
      setStatus('Adding test activity...');
      const testActivity: ActivityObject = {
        id: `test-activity-${getCurrentTimestamp()}`,
        name: `Test Activity ${getCurrentTimestamp()}`,
        category: ActivityCategory.Health,
        info: 'Test activity for offline storage'
      };
      
      await offlineStorage.addActivity(testActivity);
      await loadData();
      setStatus('✅ Test activity added successfully');
    } catch (error: any) {
      console.error('Error adding test activity:', error);
      setStatus(`❌ Error adding test activity: ${error.message}`);
    }
  };

  const addTestIntake = async () => {
    try {
      setStatus('Adding test intake...');
      const testIntake: IntakeObject = {
        id: `test-intake-${getCurrentTimestamp()}`,
        name: `Test Intake ${getCurrentTimestamp()}`,
        type: IntakeType.Drink,
        defaultQuantity: 1,
        defaultUnit: IntakeUnit.Piece,
        info: 'Test intake for offline storage'
      };
      
      await offlineStorage.addIntake(testIntake);
      await loadData();
      setStatus('✅ Test intake added successfully');
    } catch (error: any) {
      console.error('Error adding test intake:', error);
      setStatus(`❌ Error adding test intake: ${error.message}`);
    }
  };

  const addTestReadingObject = async () => {
    try {
      setStatus('Adding test reading object...');
      const testReading: ReadingObject = {
        id: `test-reading-${getCurrentTimestamp()}`,
        bookName: `Test Book ${getCurrentTimestamp()}`,
        author: 'Test Author',
        year: 2024,
        info: 'Test reading object for offline storage'
      };
      
      await offlineStorage.addReadingObject(testReading);
      await loadData();
      setStatus('✅ Test reading object added successfully');
    } catch (error: any) {
      console.error('Error adding test reading object:', error);
      setStatus(`❌ Error adding test reading object: ${error.message}`);
    }
  };

  const clearAllData = async () => {
    try {
      setStatus('Clearing all data...');
      await offlineStorage.clearAllData();
      await loadData();
      setStatus('✅ All data cleared successfully');
    } catch (error: any) {
      console.error('Error clearing data:', error);
      setStatus(`❌ Error clearing data: ${error.message}`);
    }
  };

  const syncToCloud = async () => {
    try {
      setStatus('Syncing to cloud...');
      await syncManager.manualSync();
      setStatus('✅ Sync to cloud completed');
    } catch (error: any) {
      console.error('Error syncing to cloud:', error);
      setStatus(`❌ Error syncing to cloud: ${error.message}`);
    }
  };

  const syncFromCloud = async () => {
    try {
      setStatus('Syncing from cloud...');
      await syncManager.syncFromCloud();
      await loadData();
      setStatus('✅ Sync from cloud completed');
    } catch (error: any) {
      console.error('Error syncing from cloud:', error);
      setStatus(`❌ Error syncing from cloud: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 max-w-2xl">
      <h3 className="text-lg font-bold mb-4 text-white">Offline Storage Test</h3>
      
      <div className="space-y-4">
        {/* Status Display */}
        <div className="text-sm text-gray-300">
          <p><strong>Status:</strong> {status}</p>
        </div>

        {/* Migration Section */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-bold text-white mb-2">Migration</h4>
          <div className="space-y-2">
            <button 
              onClick={checkMigration}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Check Migration Status
            </button>
            {migrationStatus && (
              <div className="text-xs text-gray-300">
                <p>Needs migration: {migrationStatus.needsMigration ? 'Yes' : 'No'}</p>
                <p>localStorage items: {migrationStatus.localStorageItems}</p>
                <p>IndexedDB items: {migrationStatus.indexedDBItems}</p>
              </div>
            )}
            {migrationStatus?.needsMigration && (
              <button 
                onClick={runMigration}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Run Migration
              </button>
            )}
          </div>
        </div>

        {/* Sync Section */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-bold text-white mb-2">Sync Status</h4>
          <div className="space-y-2">
            {syncStatus && (
              <div className="text-xs text-gray-300">
                <p>Online: {syncStatus.isOnline ? '✅' : '❌'}</p>
                <p>Syncing: {syncStatus.isSyncing ? '🔄' : '⏸️'}</p>
                <p>Last sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}</p>
                <p>Error: {syncStatus.error || 'None'}</p>
              </div>
            )}
            <div className="space-x-2">
              <button 
                onClick={syncToCloud}
                disabled={!syncStatus?.isOnline || syncStatus?.isSyncing}
                className="bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:bg-gray-600"
              >
                Sync to Cloud
              </button>
              <button 
                onClick={syncFromCloud}
                disabled={!syncStatus?.isOnline || syncStatus?.isSyncing}
                className="bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:bg-gray-600"
              >
                Sync from Cloud
              </button>
            </div>
          </div>
        </div>

        {/* Data Operations */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-bold text-white mb-2">Data Operations</h4>
          <div className="space-y-2">
            <button 
              onClick={loadData}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            >
              Load Data
            </button>
            <div className="space-x-2">
              <button 
                onClick={addTestActivity}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Add Test Activity
              </button>
              <button 
                onClick={addTestIntake}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Add Test Intake
              </button>
              <button 
                onClick={addTestReadingObject}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Add Test Reading
              </button>
            </div>
            <button 
              onClick={clearAllData}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Clear All Data
            </button>
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-bold text-white mb-2">Current Data (DB Size: {dbSize})</h4>
          
          {activities.length > 0 && (
            <div className="mb-3">
              <h5 className="font-semibold text-gray-300">Activities ({activities.length}):</h5>
              <div className="text-xs text-gray-400 space-y-1">
                {activities.slice(0, 3).map(activity => (
                  <div key={activity.id}>• {activity.name} ({activity.category})</div>
                ))}
                {activities.length > 3 && <div>... and {activities.length - 3} more</div>}
              </div>
            </div>
          )}

          {intakes.length > 0 && (
            <div className="mb-3">
              <h5 className="font-semibold text-gray-300">Intakes ({intakes.length}):</h5>
              <div className="text-xs text-gray-400 space-y-1">
                {intakes.slice(0, 3).map(intake => (
                  <div key={intake.id}>• {intake.name} ({intake.type})</div>
                ))}
                {intakes.length > 3 && <div>... and {intakes.length - 3} more</div>}
              </div>
            </div>
          )}

          {readingObjects.length > 0 && (
            <div className="mb-3">
              <h5 className="font-semibold text-gray-300">Reading Objects ({readingObjects.length}):</h5>
              <div className="text-xs text-gray-400 space-y-1">
                {readingObjects.slice(0, 3).map(reading => (
                  <div key={reading.id}>• {reading.bookName} by {reading.author}</div>
                ))}
                {readingObjects.length > 3 && <div>... and {readingObjects.length - 3} more</div>}
              </div>
            </div>
          )}

          {activities.length === 0 && intakes.length === 0 && readingObjects.length === 0 && (
            <div className="text-gray-400 text-sm">No data in offline storage</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineStorageTest; 