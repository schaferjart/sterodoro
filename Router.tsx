import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import SetupScreen from './screens/SetupScreen';
import TimerScreen from './screens/TimerScreen';
import TrackerScreen from './screens/TrackerScreen';
import NotePromptScreen from './screens/NotePromptScreen';
import AuthForm from './components/AuthForm';
import ProtectedRoute from './components/ProtectedRoute';
import DevComponentShowcase from './screens/DevComponentShowcase';
import ManageDefinitionsScreen from './screens/ManageDefinitionsScreen';

const routes = [
  {
    path: '/login',
    element: <AuthForm />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SetupScreen />,
      },
      {
        path: 'timer',
        element: <TimerScreen />,
      },
      {
        path: 'tracker',
        element: <TrackerScreen />,
      },
      {
        path: 'note',
        element: <NotePromptScreen />,
      },
      {
        path: 'definitions',
        element: <ManageDefinitionsScreen />,
      }
    ],
  },
];

// The '/dev/components' route has been removed to avoid confusion during testing.

const router = createBrowserRouter(routes);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
