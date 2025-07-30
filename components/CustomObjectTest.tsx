import React, { useState } from 'react';
import { 
  getActivityObjects, 
  createActivityObject,
  getIntakeObjects,
  createIntakeObject,
  getReadingObjects,
  createReadingObject
} from '../lib/database';
import { ActivityCategory, IntakeType, IntakeUnit } from '../types';

const CustomObjectTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [readingObjects, setReadingObjects] = useState<any[]>([]);

  const handleCreateTestActivity = async () => {
    try {
      setStatus('Creating test activity...');
      const newActivity = await createActivityObject({
        name: 'Test BJJ Session',
        category: ActivityCategory.Health,
        subActivity: 'Martial Arts',
        subSubActivity: 'Brazilian Jiu-Jitsu',
        info: 'Test custom activity'
      });
      setStatus(`✅ Activity created: ${newActivity.name}`);
      await handleListActivities();
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleCreateTestIntake = async () => {
    try {
      setStatus('Creating test intake...');
      const newIntake = await createIntakeObject({
        name: 'My Custom Tea',
        type: IntakeType.Drink,
        defaultQuantity: 1,
        defaultUnit: IntakeUnit.ml,
        info: 'Test custom intake'
      });
      setStatus(`✅ Intake created: ${newIntake.name}`);
      await handleListIntakes();
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleCreateTestReading = async () => {
    try {
      setStatus('Creating test reading object...');
      const newReading = await createReadingObject({
        bookName: 'Test Book',
        author: 'Test Author',
        year: 2024,
        info: 'Test custom reading object'
      });
      setStatus(`✅ Reading object created: ${newReading.bookName}`);
      await handleListReadingObjects();
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListActivities = async () => {
    try {
      setStatus('Loading activities...');
      const data = await getActivityObjects();
      setActivities(data);
      setStatus(`✅ Found ${data.length} activities`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListIntakes = async () => {
    try {
      setStatus('Loading intakes...');
      const data = await getIntakeObjects();
      setIntakes(data);
      setStatus(`✅ Found ${data.length} intakes`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  const handleListReadingObjects = async () => {
    try {
      setStatus('Loading reading objects...');
      const data = await getReadingObjects();
      setReadingObjects(data);
      setStatus(`✅ Found ${data.length} reading objects`);
    } catch (error: any) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error.message || error.toString()}`);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-4 text-white">Custom Objects Test</h3>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={handleCreateTestActivity}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Create Test Activity
          </button>
          <button 
            onClick={handleListActivities}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            List Activities
          </button>
        </div>

        <div>
          <button 
            onClick={handleCreateTestIntake}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Create Test Intake
          </button>
          <button 
            onClick={handleListIntakes}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            List Intakes
          </button>
        </div>

        <div>
          <button 
            onClick={handleCreateTestReading}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Create Test Reading
          </button>
          <button 
            onClick={handleListReadingObjects}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            List Reading Objects
          </button>
        </div>

        <div className="text-sm text-gray-300">
          <p><strong>Status:</strong> {status}</p>
        </div>

        {activities.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Activities ({activities.length}):</h4>
            <ul className="text-sm text-gray-300">
              {activities.map(activity => (
                <li key={activity.id}>• {activity.name} ({activity.category})</li>
              ))}
            </ul>
          </div>
        )}

        {intakes.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Intakes ({intakes.length}):</h4>
            <ul className="text-sm text-gray-300">
              {intakes.map(intake => (
                <li key={intake.id}>• {intake.name} ({intake.type})</li>
              ))}
            </ul>
          </div>
        )}

        {readingObjects.length > 0 && (
          <div>
            <h4 className="font-bold text-white">Reading Objects ({readingObjects.length}):</h4>
            <ul className="text-sm text-gray-300">
              {readingObjects.map(reading => (
                <li key={reading.id}>• {reading.book_name} by {reading.author}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomObjectTest; 