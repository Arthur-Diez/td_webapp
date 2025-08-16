// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import WebApp from '@twa-dev/sdk';
import './index.css';

// Telegram Web App готов
WebApp.ready();
console.log('initData:', WebApp.initDataUnsafe);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);