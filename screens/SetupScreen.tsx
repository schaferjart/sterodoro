import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../lib/stores/dataStore';
import { useAuthStore } from '../lib/stores/authStore';

const SetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { objectDefinitions } = useDataStore();
  const { user, signOut } = useAuthStore();

  return (
    <div style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard</h1>
        <div>
          <span>{user?.email}</span>
          <button onClick={() => signOut()} style={{ marginLeft: '1rem' }}>Logout</button>
        </div>
      </header>

      <main>
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate('/definitions')}>
            Manage Object Definitions
          </button>
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Objects</h2>
          {objectDefinitions.length === 0 ? (
            <p>You haven't created any object definitions yet.</p>
          ) : (
            <ul>
              {objectDefinitions.map(def => (
                <li key={def.id} style={{ border: '1px solid black', padding: '1rem', marginBottom: '1rem' }}>
                  <h3>{def.name}</h3>
                  <p>{def.description}</p>
                  {/* Add button to view instances or create a new one */}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default SetupScreen;