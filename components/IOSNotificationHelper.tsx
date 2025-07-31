import React, { useState, useEffect } from 'react';

export default function IOSNotificationHelper() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if running in standalone mode (installed as PWA)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Show instructions if on iOS and not in standalone mode
    if (iOS && !standalone) {
      setShowInstructions(true);
    }
  }, []);

  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-2">📱</span>
          <div>
            <h3 className="font-semibold">iOS PWA Installation Required</h3>
            <p className="text-sm">Install as app for best experience and notifications</p>
          </div>
        </div>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>
      
      {showInstructions && (
        <div className="mt-3 text-sm space-y-2">
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold mb-2">📋 How to Install as PWA:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the <strong>Share</strong> button (📤) in Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to install</li>
              <li>Open the app from your Home Screen</li>
            </ol>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold mb-2">🔔 Enable Notifications:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open the app from Home Screen (not Safari)</li>
              <li>Tap <strong>"Enable Push Notifications"</strong></li>
              <li>Allow notifications when prompted</li>
              <li>Notifications work in iOS 18.5+</li>
            </ol>
          </div>
          
          <div className="bg-blue-50 p-3 rounded border">
            <h4 className="font-semibold mb-1">ℹ️ iOS 18.5+ Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>✅ Full Web Push API support</li>
              <li>✅ Background notifications</li>
              <li>✅ Service worker support</li>
              <li>✅ Background sync</li>
              <li>✅ Sound and vibration</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 