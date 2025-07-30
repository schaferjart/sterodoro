import React, { useState, useEffect } from 'react';
import { syncManager } from '../lib/sync-manager';
import { offlineStorage } from '../lib/offline-storage';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'activity' | 'intake' | 'readingObject' | 'sessionLog' | 'intakeLog' | 'readingLog' | 'noteLog';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

const SyncQueueViewer: React.FC = () => {
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOperations = async () => {
    try {
      setLoading(true);
      const storedOperations = await offlineStorage.getSyncOperations();
      setOperations(storedOperations);
    } catch (error) {
      console.error('Error loading sync operations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
    
    // Refresh every 2 seconds
    const interval = setInterval(loadOperations, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'activity': return '🏃';
      case 'intake': return '🥤';
      case 'readingObject': return '📚';
      case 'sessionLog': return '⏱️';
      case 'intakeLog': return '📝';
      case 'readingLog': return '📖';
      case 'noteLog': return '📄';
      default: return '❓';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'delete': return 'text-red-500';
      case 'create': return 'text-green-500';
      case 'update': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">🔄 Sync Queue</h3>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">🔄 Sync Queue</h3>
        <button 
          onClick={loadOperations}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>
      
      {operations.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No pending sync operations</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {operations.map((op) => (
            <div key={op.id} className="bg-gray-700 p-3 rounded border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getEntityIcon(op.entity)}</span>
                  <span className={`font-medium ${getTypeColor(op.type)}`}>
                    {op.type.toUpperCase()}
                  </span>
                  <span className="text-white">{op.entity}</span>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>Retry: {op.retryCount}/{op.maxRetries}</div>
                  <div>{formatTimestamp(op.timestamp)}</div>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-300">
                <strong>ID:</strong> {op.data.id}
                {op.data.name && (
                  <span className="ml-2">
                    <strong>Name:</strong> {op.data.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-400">
        <div>Total operations: {operations.length}</div>
        <div>Delete operations: {operations.filter(op => op.type === 'delete').length}</div>
      </div>
    </div>
  );
};

export default SyncQueueViewer; 