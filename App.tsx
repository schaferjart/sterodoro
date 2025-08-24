import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import GlobalStyles from './components/GlobalStyles';
import { initializeErrorReporting } from './lib/error-reporting';
import { validateEnvironment } from './lib/env-validation';
import { useAuthStore } from './lib/stores/authStore';
import { useDataStore } from './lib/stores/dataStore';
import OfflineStorageTest from './components/OfflineStorageTest';
import { BackgroundSyncTest } from './components/BackgroundSyncTest';
import SyncQueueViewer from './components/SyncQueueViewer';
import AuthStatusChecker from './components/AuthStatusChecker';
import NotificationPermission from './components/NotificationPermission';
import PushNotificationManager from './components/PushNotificationManager';
import SoundTest from './components/SoundTest';
import IOSNotificationHelper from './components/IOSNotificationHelper';
import PushNotificationDebug from './components/PushNotificationDebug';

const App: React.FC = () => {
  const { user } = useAuthStore();
  const fetchData = useDataStore((state) => state.fetchData);

  // Initialize app-level services
  useEffect(() => {
    try {
      validateEnvironment();
      initializeErrorReporting();
      console.log('Sterodoro initialized successfully');
      
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error('Failed to initialize Sterodoro:', error);
    }
  }, []);

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return (
    <ErrorBoundary>
      <GlobalStyles />
      <div className="bg-theme-background text-theme-text h-screen w-full font-mono flex flex-col">
        {/* Development tools - hidden in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 space-y-2 bg-theme-surface border-b border-theme-border">
            <AuthStatusChecker />
            <IOSNotificationHelper />
            <NotificationPermission />
            <SoundTest />
            <BackgroundSyncTest />
            <OfflineStorageTest />
            <SyncQueueViewer />
            <PushNotificationManager />
            <PushNotificationDebug />
          </div>
        )}
        
        <div className="flex-1 w-full h-full bg-theme-background flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;