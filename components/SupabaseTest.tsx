import React, { useState } from 'react';
import { testConnection, getActivityObjects, createActivityObject } from '../lib/database';

const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);

  const handleTestConnection = async () => {
    setStatus('Testing connection...');
    const success = await testConnection();
    setStatus(success ? '✅ Connection successful!' : '❌ Connection failed');
  };

  const handleCreateTestActivity = async () => {
    try {
      setStatus('Creating test activity...');
      await createActivityObject({
        name: 'Test Activity',
        category: 'Work',
        subActivity: 'Testing',
        info: 'Created via Supabase test'
      });
      setStatus('✅ Test activity created!');
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListActivities = async () => {
    try {
      setStatus('Fetching activities...');
      const data = await getActivityObjects();
      setActivities(data);
      setStatus(`✅ Found ${data.length} activities`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg max-w-md mx-auto mt-4">
      <h3 className="text-lg font-bold mb-4">Supabase Connection Test</h3>
      
      <div className="space-y-2 mb-4">
        <button 
          onClick={handleTestConnection}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Connection
        </button>
        
        <button 
          onClick={handleCreateTestActivity}
          className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Test Activity
        </button>
        
        <button 
          onClick={handleListActivities}
          className="w-full p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          List Activities
        </button>
      </div>

      {status && (
        <div className="p-2 bg-gray-700 rounded text-sm">
          {status}
        </div>
      )}

      {activities.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold mb-2">Activities:</h4>
          <div className="space-y-1">
            {activities.map(activity => (
              <div key={activity.id} className="p-2 bg-gray-700 rounded text-sm">
                {activity.name} ({activity.category})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest; 