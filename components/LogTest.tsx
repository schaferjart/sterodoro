import React, { useState } from 'react';
import { getCurrentLocalTime } from '../lib/time-utils';
import { 
  getSessionLogs,
  getIntakeLogs,
  getReadingLogs,
  getNoteLogs,
  logSession,
  logIntake,
  logReading,
  logNote,
  getActivityObjects,
  getIntakeObjects,
  getReadingObjects
} from '../lib/database';
import { ActivityCategory, IntakeType, IntakeUnit } from '../types';

const LogTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [readingLogs, setReadingLogs] = useState<any[]>([]);
  const [noteLogs, setNoteLogs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [readingObjects, setReadingObjects] = useState<any[]>([]);

  const loadObjects = async () => {
    try {
      const [activitiesData, intakesData, readingData] = await Promise.all([
        getActivityObjects(),
        getIntakeObjects(),
        getReadingObjects()
      ]);
      setActivities(activitiesData);
      setIntakes(intakesData);
      setReadingObjects(readingData);
      setStatus(`✅ Loaded ${activitiesData.length} activities, ${intakesData.length} intakes, ${readingData.length} reading objects`);
    } catch (error: any) {
      console.error('Error loading objects:', error);
      setStatus(`❌ Error loading objects: ${error.message}`);
    }
  };

  const handleCreateTestSessionLog = async () => {
    try {
      if (activities.length === 0) {
        setStatus('❌ No activities available. Please load objects first.');
        return;
      }

      setStatus('Creating test session log...');
      const activity = activities[0]; // Use the first available activity
      await logSession({
        activityObjectId: activity.id,
              timeStart: getCurrentLocalTime(), // 1 hour ago
      timeEnd: getCurrentLocalTime(),
        trackerMetrics: { Mood: 8, Energy: 7 },
                  notes: [{ timestamp: getCurrentLocalTime(), note: 'Test session note' }]
      });
      setStatus(`✅ Session log created for activity: ${activity.name}`);
      await handleListSessionLogs();
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleCreateTestIntakeLog = async () => {
    try {
      if (intakes.length === 0) {
        setStatus('❌ No intakes available. Please load objects first.');
        return;
      }

      setStatus('Creating test intake log...');
      const intake = intakes[0]; // Use the first available intake
      await logIntake({
        intakeObjectId: intake.id,
        quantity: 1,
        unit: 'cup',
        timestamp: getCurrentLocalTime()
      });
      setStatus(`✅ Intake log created for: ${intake.name}`);
      await handleListIntakeLogs();
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleCreateTestReadingLog = async () => {
    try {
      if (readingObjects.length === 0) {
        setStatus('❌ No reading objects available. Please load objects first.');
        return;
      }

      setStatus('Creating test reading log...');
      const reading = readingObjects[0]; // Use the first available reading object
      await logReading({
        readingObjectId: reading.id,
        timeStart: getCurrentLocalTime(), // 30 minutes ago
        timeEnd: getCurrentLocalTime(),
        trackerMetrics: { Focus: 9, Comprehension: 8 },
        notes: [{ timestamp: getCurrentLocalTime(), note: 'Test reading note' }]
      });
      setStatus(`✅ Reading log created for: ${reading.bookName}`);
      await handleListReadingLogs();
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleCreateTestNoteLog = async () => {
    try {
      setStatus('Creating test note log...');
      await logNote({
        title: 'Test Note',
        content: 'This is a test note content',
        timestamp: getCurrentLocalTime(),
        trackerMetrics: { Creativity: 7, Clarity: 8 },
        relatedActivities: activities.length > 0 ? [{ 
          id: activities[0].id, 
          name: activities[0].name, 
          category: activities[0].category 
        }] : []
      });
      setStatus('✅ Note log created');
      await handleListNoteLogs();
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListSessionLogs = async () => {
    try {
      setStatus('Loading session logs...');
      const data = await getSessionLogs();
      setSessionLogs(data);
      setStatus(`✅ Found ${data.length} session logs`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListIntakeLogs = async () => {
    try {
      setStatus('Loading intake logs...');
      const data = await getIntakeLogs();
      setIntakeLogs(data);
      setStatus(`✅ Found ${data.length} intake logs`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListReadingLogs = async () => {
    try {
      setStatus('Loading reading logs...');
      const data = await getReadingLogs();
      setReadingLogs(data);
      setStatus(`✅ Found ${data.length} reading logs`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListNoteLogs = async () => {
    try {
      setStatus('Loading note logs...');
      const data = await getNoteLogs();
      setNoteLogs(data);
      setStatus(`✅ Found ${data.length} note logs`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-4 text-white">Logs Test</h3>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={loadObjects}
            className="bg-purple-600 text-white px-4 py-2 rounded mr-2"
          >
            Load Objects First
          </button>
        </div>

        <div>
          <button 
            onClick={handleCreateTestSessionLog}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            disabled={activities.length === 0}
          >
            Create Test Session Log
          </button>
          <button 
            onClick={handleListSessionLogs}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            List Session Logs
          </button>
        </div>

        <div>
          <button 
            onClick={handleCreateTestIntakeLog}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            disabled={intakes.length === 0}
          >
            Create Test Intake Log
          </button>
          <button 
            onClick={handleListIntakeLogs}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            List Intake Logs
          </button>
        </div>

        <div>
          <button 
            onClick={handleCreateTestReadingLog}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            disabled={readingObjects.length === 0}
          >
            Create Test Reading Log
          </button>
          <button 
            onClick={handleListReadingLogs}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            List Reading Logs
          </button>
        </div>

        <div>
          <button 
            onClick={handleCreateTestNoteLog}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Create Test Note Log
          </button>
          <button 
            onClick={handleListNoteLogs}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            List Note Logs
          </button>
        </div>

        <div className="text-sm text-gray-300">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Available:</strong> {activities.length} activities, {intakes.length} intakes, {readingObjects.length} reading objects</p>
        </div>

        {sessionLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Session Logs ({sessionLogs.length}):</h4>
            <ul className="text-sm text-gray-300">
              {sessionLogs.map(log => (
                <li key={log.id}>• {log.time_start} - {log.time_end}</li>
              ))}
            </ul>
          </div>
        )}

        {intakeLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Intake Logs ({intakeLogs.length}):</h4>
            <ul className="text-sm text-gray-300">
              {intakeLogs.map(log => (
                <li key={log.id}>• {log.timestamp} - {log.quantity} {log.unit}</li>
              ))}
            </ul>
          </div>
        )}

        {readingLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Reading Logs ({readingLogs.length}):</h4>
            <ul className="text-sm text-gray-300">
              {readingLogs.map(log => (
                <li key={log.id}>• {log.time_start} - {log.time_end}</li>
              ))}
            </ul>
          </div>
        )}

        {noteLogs.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Note Logs ({noteLogs.length}):</h4>
            <ul className="text-sm text-gray-300">
              {noteLogs.map(log => (
                <li key={log.id}>• {log.timestamp} - {log.title || 'Untitled'}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogTest; 