import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import PasswordPage from './pages/PasswordPage';
import './index.css';

import { Buffer } from 'buffer';

if (!window.Buffer) {
  window.Buffer = Buffer;
}

// Main entry point for the application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App><Home /></App>} />
        <Route path="/password" element={<App><PasswordPage /></App>} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
