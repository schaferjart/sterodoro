import React, { useState, useEffect } from 'react';

const NotificationPermission: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setShowRequest(Notification.permission === 'default');
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        setShowRequest(false);
        
        if (result === 'granted') {
          console.log('Notification permission granted!');
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  if (!('Notification' in window)) {
    return (
      <div className="p-3 bg-yellow-900 rounded border border-yellow-600">
        <div className="text-yellow-200 text-sm">
          ⚠️ Notifications not supported in this browser
        </div>
      </div>
    );
  }

  if (!showRequest) {
    return (
      <div className="p-3 rounded text-sm">
        {permission === 'granted' ? (
          <div className="bg-green-900 border border-green-600 text-green-200">
            ✅ Notifications enabled
          </div>
        ) : (
          <div className="bg-red-900 border border-red-600 text-red-200">
            ❌ Notifications disabled
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-blue-900 rounded border border-blue-600">
      <div className="text-blue-200 text-sm mb-2">
        🔔 Enable notifications to get timer alerts when the app is in the background
      </div>
      <button
        onClick={requestPermission}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Enable Notifications
      </button>
    </div>
  );
};

export default NotificationPermission; 