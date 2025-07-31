import React, { useState, useEffect } from 'react';
import { getCurrentTimestamp } from '../lib/time-utils';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { syncToCloud, syncFromCloud, manualSync, checkSyncNeeded, addToRetryQueue } from '../lib/sync';
import { offlineStorage } from '../lib/offline-storage';
import { registerServiceWorker, getServiceWorkerRegistration } from '../lib/service-worker-registration';
import { ActivityObject, IntakeObject, ReadingObject, ActivityCategory, IntakeType, IntakeUnit } from '../types';

export const BackgroundSyncTest: React.FC = () => {
  const syncStatus = useSyncStatus();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Register service worker on component mount
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        await registerServiceWorker();
      } catch (error) {
        console.error('Failed to initialize service worker:', error);
      }
    };
    
    initServiceWorker();
  }, []);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test background sync functionality
  const testBackgroundSync = async () => {
    setIsLoading(true);
    addResult('🧪 Testing Background Sync Features...');
    
    try {
      // Test 1: Check sync status
      addResult('📊 Checking sync status...');
      const needsSync = await syncStatus.checkSyncNeeded();
      addResult(`Sync needed: ${needsSync ? 'Yes' : 'No'}`);

      // Test 2: Add test data to offline storage
      addResult('📝 Adding test data to offline storage...');
      const testActivity: ActivityObject = {
        id: `test-activity-${getCurrentTimestamp()}`,
        name: 'Test Activity',
        category: ActivityCategory.Personal,
        subActivity: 'Testing',
        info: 'Background sync test'
      };

      const testIntake: IntakeObject = {
        id: `test-intake-${getCurrentTimestamp()}`,
        name: 'Test Intake',
        type: IntakeType.Drink,
        defaultQuantity: 1,
        defaultUnit: IntakeUnit.ml
      };

      const testReading: ReadingObject = {
        id: `test-reading-${getCurrentTimestamp()}`,
        bookName: 'Test Book',
        author: 'Test Author',
        year: 2024,
        info: 'Background sync test'
      };

      await offlineStorage.addActivity(testActivity);
      await offlineStorage.addIntake(testIntake);
      await offlineStorage.addReadingObject(testReading);
      addResult('✅ Test data added to offline storage');

      // Test 3: Sync to cloud with progress tracking
      addResult('☁️ Syncing to cloud with progress tracking...');
      const syncResult = await syncToCloud({ retryFailed: true, showProgress: true });
      addResult(`Sync result: ${syncResult.success ? 'Success' : 'Failed'}`);
      if (syncResult.errors.length > 0) {
        addResult(`Errors: ${syncResult.errors.join(', ')}`);
      }

      // Test 4: Test retry queue
      addResult('🔄 Testing retry queue...');
      addToRetryQueue({
        type: 'create',
        entity: 'activity',
        data: {
          id: `retry-test-${getCurrentTimestamp()}`,
          name: 'Retry Test Activity',
          category: ActivityCategory.Work
        },
        maxRetries: 3
      });
      addResult(`Added operation to retry queue. Queue length: ${syncStatus.retryQueue.length}`);

      // Test 5: Manual sync with retry
      addResult('🔄 Testing manual sync with retry...');
      const manualResult = await manualSync({ retryFailed: true });
      addResult(`Manual sync result: ${manualResult.success ? 'Success' : 'Failed'}`);

      // Test 6: Check final sync status
      addResult('📊 Final sync status check...');
      const finalNeedsSync = await syncStatus.checkSyncNeeded();
      addResult(`Final sync needed: ${finalNeedsSync ? 'Yes' : 'No'}`);

      addResult('🎉 Background sync test completed!');

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test service worker functionality
  const testServiceWorker = async () => {
    setIsLoading(true);
    addResult('🔧 Testing Service Worker...');
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Service Worker test timed out')), 10000);
      });

      const testPromise = (async () => {
        if (!('serviceWorker' in navigator)) {
          throw new Error('Service Worker not supported in this browser');
        }

        addResult('📡 Checking Service Worker registration...');
        
        // Try to get existing registration first
        let registration = await getServiceWorkerRegistration();
        
        if (!registration) {
          addResult('⚠️ No Service Worker registered yet, registering now...');
          registration = await registerServiceWorker();
          
          if (!registration) {
            throw new Error('Failed to register Service Worker');
          }
          
          addResult('✅ Service Worker registered successfully');
        } else {
          addResult('✅ Found existing Service Worker registration');
        }

        addResult('✅ Service Worker is ready');

        // Test basic service worker functionality
        if (registration.active) {
          addResult('✅ Service Worker is active');
        } else if (registration.installing) {
          addResult('⏳ Service Worker is installing...');
        } else if (registration.waiting) {
          addResult('⏳ Service Worker is waiting...');
        }

        // Test background sync (if supported)
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          try {
            await (registration as any).sync.register('productivity-timer-sync');
            addResult('✅ Background sync registered');
          } catch (syncError) {
            addResult(`⚠️ Background sync registration failed: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`);
          }
        } else {
          addResult('⚠️ Background sync not supported in this browser');
        }

        // Test message passing
        try {
          if (registration.active) {
            registration.active.postMessage({
              type: 'REGISTER_BACKGROUND_SYNC'
            });
            addResult('✅ Message sent to Service Worker');
          } else {
            addResult('⚠️ Service Worker not active, cannot send message');
          }
        } catch (messageError) {
          addResult(`⚠️ Message sending failed: ${messageError instanceof Error ? messageError.message : 'Unknown error'}`);
        }

        addResult('🎉 Service Worker test completed successfully');
      })();

      await Promise.race([testPromise, timeoutPromise]);
      
    } catch (error) {
      addResult(`❌ Service Worker test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test offline functionality
  const testOfflineFunctionality = async () => {
    setIsLoading(true);
    addResult('📱 Testing Offline Functionality...');
    
    try {
      // Test offline storage operations
      const activities = await offlineStorage.getActivities();
      const intakes = await offlineStorage.getIntakes();
      const readingObjects = await offlineStorage.getReadingObjects();
      
      addResult(`📊 Offline data: ${activities.length} activities, ${intakes.length} intakes, ${readingObjects.length} reading objects`);
      
      // Test database size
      const dbSize = await offlineStorage.getDatabaseSize();
      addResult(`💾 Database size: ${(dbSize / 1024).toFixed(2)} KB`);
      
      addResult('✅ Offline functionality working');
      
    } catch (error) {
      addResult(`❌ Offline test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear test data
  const clearTestData = async () => {
    setIsLoading(true);
    addResult('🧹 Clearing test data...');
    
    try {
      await offlineStorage.clearAllData();
      addResult('✅ Test data cleared');
    } catch (error) {
      addResult(`❌ Failed to clear test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">🔄 Background Sync Test</h2>
      
      {/* Sync Status Display */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">📊 Sync Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Online:</span>
            <span className={`ml-2 ${syncStatus.isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {syncStatus.isOnline ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Syncing:</span>
            <span className={`ml-2 ${syncStatus.isSyncing ? 'text-blue-400' : 'text-gray-400'}`}>
              {syncStatus.isSyncing ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Progress:</span>
            <span className="ml-2 text-blue-400">{syncStatus.progress}%</span>
          </div>
          <div>
            <span className="text-gray-400">Pending:</span>
            <span className="ml-2 text-yellow-400">{syncStatus.pendingChanges}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        {syncStatus.isSyncing && (
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncStatus.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-1">{syncStatus.syncStatusText}</p>
          </div>
        )}
        
        {/* Error Display */}
        {syncStatus.hasErrors && (
          <div className="mt-3 p-3 bg-red-900/50 border border-red-500 rounded">
            <p className="text-red-400 text-sm">❌ {syncStatus.error}</p>
          </div>
        )}
        
        {/* Retry Queue Display */}
        {syncStatus.hasPendingRetries && (
          <div className="mt-3 p-3 bg-yellow-900/50 border border-yellow-500 rounded">
            <p className="text-yellow-400 text-sm">
              ⚠️ {syncStatus.retryQueue.length} operations in retry queue
            </p>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testBackgroundSync}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          🧪 Test Background Sync
        </button>
        
        <button
          onClick={testServiceWorker}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          🔧 Test Service Worker
        </button>
        
        <button
          onClick={testOfflineFunctionality}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          📱 Test Offline
        </button>
        
        <button
          onClick={clearTestData}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          🧹 Clear Test Data
        </button>
        
        <button
          onClick={() => {
            setIsLoading(false);
            addResult('🛑 Force stopped all operations');
          }}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          🛑 Force Stop
        </button>
      </div>

      {/* Manual Sync Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={syncStatus.syncToCloud}
          disabled={isLoading || !syncStatus.isOnline}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          ☁️ Sync to Cloud
        </button>
        
        <button
          onClick={syncStatus.syncFromCloud}
          disabled={isLoading || !syncStatus.isOnline}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          ⬇️ Sync from Cloud
        </button>
        
        <button
          onClick={syncStatus.manualSync}
          disabled={isLoading || !syncStatus.isOnline}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          🔄 Manual Sync
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">📋 Test Results</h3>
          <button
            onClick={clearResults}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear
          </button>
        </div>
        
        <div className="bg-gray-900 p-3 rounded max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-sm">No test results yet. Run a test to see results here.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>Running test...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 