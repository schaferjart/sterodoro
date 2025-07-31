import React, { useState, useEffect } from 'react';
import { pushNotificationManager } from '../lib/push-notifications';

export default function PushNotificationDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSubscription = async () => {
    setLogs([]);
    addLog('🔍 Starting push notification debug...');
    
    try {
      // Test 1: Check if service worker is available
      addLog('📋 Test 1: Service Worker Check');
      if ('serviceWorker' in navigator) {
        addLog('✅ Service Worker API available');
      } else {
        addLog('❌ Service Worker API not available');
        return;
      }

      // Test 2: Check if push manager is available
      addLog('📋 Test 2: Push Manager Check');
      if ('PushManager' in window) {
        addLog('✅ Push Manager available');
      } else {
        addLog('❌ Push Manager not available');
        return;
      }

      // Test 3: Check notification permission
      addLog('📋 Test 3: Notification Permission Check');
      const permission = Notification.permission;
      addLog(`📝 Current permission: ${permission}`);
      
      if (permission !== 'granted') {
        addLog('❌ Permission not granted');
        return;
      }

      // Test 4: Get service worker registration
      addLog('📋 Test 4: Service Worker Registration');
      const registration = await navigator.serviceWorker.ready;
      addLog('✅ Service worker ready');
      addLog(`📝 Registration scope: ${registration.scope}`);

      // Test 5: Check existing subscription
      addLog('📋 Test 5: Existing Subscription Check');
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        addLog('✅ Existing subscription found');
        addLog(`📝 Endpoint: ${existingSubscription.endpoint}`);
      } else {
        addLog('ℹ️ No existing subscription');
      }

      // Test 6: Check VAPID key
      addLog('📋 Test 6: VAPID Key Check');
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      addLog(`📝 VAPID key length: ${vapidKey?.length || 0}`);
      if (vapidKey && vapidKey !== 'YOUR_VAPID_PUBLIC_KEY') {
        addLog('✅ VAPID key looks valid');
      } else {
        addLog('❌ VAPID key is missing or placeholder');
        return;
      }

      // Test 7: Try to subscribe
      addLog('📋 Test 7: Attempting Subscription');
      addLog('🔄 Converting VAPID key...');
      
      // Convert VAPID key to Uint8Array
      const vapidPublicKey = pushNotificationManager['urlBase64ToUint8Array'](vapidKey);
      addLog(`✅ VAPID key converted: ${vapidPublicKey.length} bytes`);

      addLog('🔄 Creating subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      addLog('✅ Subscription created successfully!');
      addLog(`📝 Endpoint: ${subscription.endpoint}`);
      addLog(`📝 Auth key: ${subscription.getKey('auth') ? 'Available' : 'Not available'}`);
      addLog(`📝 P256DH key: ${subscription.getKey('p256dh') ? 'Available' : 'Not available'}`);

      // Test 8: Store in our manager
      addLog('📋 Test 8: Storing in PushNotificationManager');
      pushNotificationManager['subscription'] = subscription;
      addLog('✅ Subscription stored in manager');

    } catch (error) {
      addLog(`❌ Error during subscription: ${error}`);
      addLog(`📝 Error name: ${error instanceof Error ? error.name : 'Unknown'}`);
      addLog(`📝 Error message: ${error instanceof Error ? error.message : 'Unknown'}`);
      if (error instanceof Error && error.stack) {
        addLog(`📝 Error stack: ${error.stack}`);
      }
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">🔧 Push Notification Debug</h3>
      
      <button
        onClick={testSubscription}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
      >
        🧪 Run Debug Test
      </button>

      <div className="bg-white p-3 rounded border max-h-96 overflow-y-auto">
        <h4 className="font-semibold mb-2">Debug Logs:</h4>
        {logs.length === 0 ? (
          <p className="text-gray-500">Click "Run Debug Test" to see detailed logs</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 