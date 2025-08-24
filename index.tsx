import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './Router';
import './styles/theme.css'; // Import the new theme file

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
