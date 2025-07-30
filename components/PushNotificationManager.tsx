import React, { useState, useEffect } from 'react';
import { pushNotificationManager } from '../lib/push-notifications';

const PushNotificationManager: React.FC = () => {
  const [status, setStatus] = useState<{
    supported: boolean;
    subscribed: boolean;
    permission: NotificationPermission;
  }>({
    supported: false,
    subscribed: false,
    permission: 'default'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    const currentStatus = pushNotificationManager.getSubscriptionStatus();
    setStatus(currentStatus);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔔 Initializing push notifications...');
      const initialized = await pushNotificationManager.initialize();
      
      if (!initialized) {
        setError('Failed to initialize push notifications');
        return;
      }

      console.log('🔔 Subscribing to push notifications...');
      const subscribed = await pushNotificationManager.subscribeToPush();
      
      if (!subscribed) {
        setError('Failed to subscribe to push notifications');
        return;
      }

      console.log('✅ Successfully subscribed to push notifications');
      checkStatus();
    } catch (err) {
      console.error('❌ Push notification subscription failed:', err);
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const unsubscribed = await pushNotificationManager.unsubscribeFromPush();
      
      if (!unsubscribed) {
        setError('Failed to unsubscribe from push notifications');
        return;
      }

      console.log('✅ Successfully unsubscribed from push notifications');
      checkStatus();
    } catch (err) {
      console.error('❌ Push notification unsubscription failed:', err);
      setError(err instanceof Error ? err.message : 'Unsubscription failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!status.supported) return 'text-red-400';
    if (status.permission === 'granted' && status.subscribed) return 'text-green-400';
    if (status.permission === 'granted') return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusText = () => {
    if (!status.supported) return '❌ Not supported';
    if (status.permission === 'granted' && status.subscribed) return '✅ Enabled';
    if (status.permission === 'granted') return '⚠️ Permission granted, not subscribed';
    if (status.permission === 'denied') return '❌ Permission denied';
    return '📝 Permission not requested';
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-2">🔔 Push Notifications</h3>
      
      <div className="space-y-3">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Status:</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Platform Support */}
        <div className="text-gray-400 text-xs">
          <div>• iOS 18.5+: ✅ Full support</div>
          <div>• Android: ✅ Full support</div>
          <div>• Desktop: ✅ Full support</div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 p-2 rounded text-red-200 text-sm">
            Error: {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {status.supported && status.permission === 'granted' && !status.subscribed && (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className={`w-full px-3 py-2 rounded text-sm ${
                loading 
                  ? 'bg-gray-600 text-gray-400' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? 'Subscribing...' : 'Enable Push Notifications'}
            </button>
          )}

          {status.supported && status.subscribed && (
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className={`w-full px-3 py-2 rounded text-sm ${
                loading 
                  ? 'bg-gray-600 text-gray-400' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {loading ? 'Unsubscribing...' : 'Disable Push Notifications'}
            </button>
          )}

          {status.supported && status.permission === 'default' && (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className={`w-full px-3 py-2 rounded text-sm ${
                loading 
                  ? 'bg-gray-600 text-gray-400' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Requesting...' : 'Request Permission & Subscribe'}
            </button>
          )}
        </div>

        {/* Information */}
        <div className="text-gray-400 text-xs">
          <div className="font-bold mb-1">ℹ️ How it works:</div>
          <div>• Timer data sent to server when timer starts</div>
          <div>• Server sends push notification when timer ends</div>
          <div>• Works even when app is closed/backgrounded</div>
          <div>• Requires internet connection for scheduling</div>
        </div>

        {/* Debug Info */}
        <details className="text-gray-400 text-xs">
          <summary className="cursor-pointer">Debug Info</summary>
          <div className="mt-2 space-y-1">
            <div>Supported: {status.supported ? 'Yes' : 'No'}</div>
            <div>Permission: {status.permission}</div>
            <div>Subscribed: {status.subscribed ? 'Yes' : 'No'}</div>
            <div>Service Worker: {'serviceWorker' in navigator ? 'Yes' : 'No'}</div>
            <div>Push Manager: {'PushManager' in window ? 'Yes' : 'No'}</div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PushNotificationManager; 