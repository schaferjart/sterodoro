import React, { useEffect, useState } from 'react';

const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`fixed top-2 right-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg z-50 ${online ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {online ? 'Online' : 'Offline'}
    </div>
  );
};

export default OfflineIndicator; 