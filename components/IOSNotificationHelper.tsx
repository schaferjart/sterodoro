import React, { useState, useEffect } from 'react';

const IOSNotificationHelper: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Detect if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isStandalone);
    
    // Show instructions for iOS users
    if (iOS && !isStandalone) {
      setShowInstructions(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  if (!isIOS) {
    return null; // Only show for iOS
  }

  return (
    <div className="p-4 bg-blue-900 rounded-lg border border-blue-600">
      <h3 className="text-lg font-bold text-blue-200 mb-2">📱 iPhone User</h3>
      
      {!isPWA && showInstructions && (
        <div className="mb-4 p-3 bg-yellow-900 rounded border border-yellow-600">
          <div className="text-yellow-200 font-bold mb-2">📲 Install as App</div>
          <div className="text-yellow-300 text-sm space-y-1">
            <div>1. Tap the Share button (📤)</div>
            <div>2. Scroll down and tap "Add to Home Screen"</div>
            <div>3. Tap "Add" to install</div>
            <div>4. Open from home screen for best experience</div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="text-blue-200 text-sm">
          <div className="font-bold mb-1">ℹ️ iOS Limitations:</div>
          <div>• No push notifications when app is closed</div>
          <div>• No background sound</div>
          <div>• Timer continues running ✅</div>
          <div>• Sound works when app is active ✅</div>
        </div>
        
        <div className="text-blue-200 text-sm">
          <div className="font-bold mb-1">💡 Best Practices:</div>
          <div>• Keep app open during timer</div>
          <div>• Use vibration alerts</div>
          <div>• Check timer periodically</div>
        </div>
        
        <button
          onClick={requestNotificationPermission}
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Request Notification Permission
        </button>
      </div>
    </div>
  );
};

export default IOSNotificationHelper; 