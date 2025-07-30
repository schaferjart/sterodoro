import React, { useState } from 'react';
import { 
  getActivityObjects,
  getIntakeObjects,
  getReadingObjects,
  getSessionLogs,
  getIntakeLogs,
  getReadingLogs,
  getNoteLogs,
  deleteActivityObject,
  deleteIntakeObject,
  deleteReadingObject,
  deleteSessionLog,
  deleteIntakeLog,
  deleteReadingLog,
  deleteNoteLog
} from '../lib/database';

const DeleteTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [readingObjects, setReadingObjects] = useState<any[]>([]);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [readingLogs, setReadingLogs] = useState<any[]>([]);
  const [noteLogs, setNoteLogs] = useState<any[]>([]);

  const loadAllData = async () => {
    try {
      setStatus('Loading all data...');
      const [activitiesData, intakesData, readingData, sessionData, intakeLogsData, readingLogsData, noteLogsData] = await Promise.all([
        getActivityObjects(),
        getIntakeObjects(),
        getReadingObjects(),
        getSessionLogs(),
        getIntakeLogs(),
        getReadingLogs(),
        getNoteLogs()
      ]);
      
      setActivities(activitiesData);
      setIntakes(intakesData);
      setReadingObjects(readingData);
      setSessionLogs(sessionData);
      setIntakeLogs(intakeLogsData);
      setReadingLogs(readingLogsData);
      setNoteLogs(noteLogsData);
      
      setStatus(`✅ Loaded: ${activitiesData.length} activities, ${intakesData.length} intakes, ${readingData.length} reading objects, ${sessionData.length} session logs, ${intakeLogsData.length} intake logs, ${readingLogsData.length} reading logs, ${noteLogsData.length} note logs`);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setStatus(`❌ Error loading data: ${error.message}`);
    }
  };

  const handleDeleteActivity = async (id: string, name: string) => {
    try {
      setStatus(`Deleting activity: ${name}...`);
      await deleteActivityObject(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      setStatus(`✅ Deleted activity: ${name}`);
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      setStatus(`❌ Error deleting activity: ${error.message}`);
    }
  };

  const handleDeleteIntake = async (id: string, name: string) => {
    try {
      setStatus(`Deleting intake: ${name}...`);
      await deleteIntakeObject(id);
      setIntakes(prev => prev.filter(i => i.id !== id));
      setStatus(`✅ Deleted intake: ${name}`);
    } catch (error: any) {
      console.error('Error deleting intake:', error);
      setStatus(`❌ Error deleting intake: ${error.message}`);
    }
  };

  const handleDeleteReadingObject = async (id: string, name: string) => {
    try {
      setStatus(`Deleting reading object: ${name}...`);
      await deleteReadingObject(id);
      setReadingObjects(prev => prev.filter(r => r.id !== id));
      setStatus(`✅ Deleted reading object: ${name}`);
    } catch (error: any) {
      console.error('Error deleting reading object:', error);
      setStatus(`❌ Error deleting reading object: ${error.message}`);
    }
  };

  const handleDeleteSessionLog = async (id: string) => {
    try {
      setStatus('Deleting session log...');
      await deleteSessionLog(id);
      setSessionLogs(prev => prev.filter(s => s.id !== id));
      setStatus('✅ Deleted session log');
    } catch (error: any) {
      console.error('Error deleting session log:', error);
      setStatus(`❌ Error deleting session log: ${error.message}`);
    }
  };

  const handleDeleteIntakeLog = async (id: string) => {
    try {
      setStatus('Deleting intake log...');
      await deleteIntakeLog(id);
      setIntakeLogs(prev => prev.filter(i => i.id !== id));
      setStatus('✅ Deleted intake log');
    } catch (error: any) {
      console.error('Error deleting intake log:', error);
      setStatus(`❌ Error deleting intake log: ${error.message}`);
    }
  };

  const handleDeleteReadingLog = async (id: string) => {
    try {
      setStatus('Deleting reading log...');
      await deleteReadingLog(id);
      setReadingLogs(prev => prev.filter(r => r.id !== id));
      setStatus('✅ Deleted reading log');
    } catch (error: any) {
      console.error('Error deleting reading log:', error);
      setStatus(`❌ Error deleting reading log: ${error.message}`);
    }
  };

  const handleDeleteNoteLog = async (id: string) => {
    try {
      setStatus('Deleting note log...');
      await deleteNoteLog(id);
      setNoteLogs(prev => prev.filter(n => n.id !== id));
      setStatus('✅ Deleted note log');
    } catch (error: any) {
      console.error('Error deleting note log:', error);
      setStatus(`❌ Error deleting note log: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-4 text-white">Delete Test</h3>
      
      <div className="space-y-4">
        <button 
          onClick={loadAllData}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Load All Data
        </button>

        <div className="text-sm text-gray-300">
          <p><strong>Status:</strong> {status}</p>
        </div>

        {activities.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Activities ({activities.length}):</h4>
            <div className="space-y-2">
              {activities.map(activity => (
                <div key={activity.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-sm">{activity.name}</span>
                  <button 
                    onClick={() => handleDeleteActivity(activity.id, activity.name)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {intakes.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Intakes ({intakes.length}):</h4>
            <div className="space-y-2">
              {intakes.map(intake => (
                <div key={intake.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-sm">{intake.name}</span>
                  <button 
                    onClick={() => handleDeleteIntake(intake.id, intake.name)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {readingObjects.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Reading Objects ({readingObjects.length}):</h4>
            <div className="space-y-2">
              {readingObjects.map(reading => (
                <div key={reading.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-sm">{reading.bookName}</span>
                  <button 
                    onClick={() => handleDeleteReadingObject(reading.id, reading.bookName)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessionLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Session Logs ({sessionLogs.length}):</h4>
            <div className="space-y-2">
              {sessionLogs.slice(0, 3).map(log => (
                <div key={log.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-sm">{log.time_start} - {log.time_end}</span>
                  <button 
                    onClick={() => handleDeleteSessionLog(log.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {intakeLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Intake Logs ({intakeLogs.length}):</h4>
            <div className="space-y-2">
              {intakeLogs.slice(0, 3).map(log => (
                <div key={log.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-sm">{log.timestamp} - {log.quantity} {log.unit}</span>
                  <button 
                    onClick={() => handleDeleteIntakeLog(log.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {readingLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Reading Logs ({readingLogs.length}):</h4>
            <div className="space-y-2">
              {readingLogs.slice(0, 3).map(log => (
                <div key={log.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-sm">{log.time_start} - {log.time_end}</span>
                  <button 
                    onClick={() => handleDeleteReadingLog(log.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {noteLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Note Logs ({noteLogs.length}):</h4>
            <div className="space-y-2">
              {noteLogs.slice(0, 3).map(log => (
                <div key={log.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-sm">{log.timestamp} - {log.title || 'Untitled'}</span>
                  <button 
                    onClick={() => handleDeleteNoteLog(log.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteTest; 