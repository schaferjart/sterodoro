import React, { useEffect, useState } from 'react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-50">
      <span>Install Productivity Timer for offline use!</span>
      <button onClick={handleInstall} className="ml-2 px-3 py-1 bg-green-500 rounded font-bold hover:bg-green-600">Install</button>
    </div>
  );
};

export default InstallPrompt; 