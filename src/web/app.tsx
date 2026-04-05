import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/Dashboard';
import './styles/globals.css';

function App() {
  return <Dashboard />;
}

createRoot(document.getElementById('root')!).render(<App />);
