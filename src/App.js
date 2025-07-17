// src/App.js
import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

import CalendarHeader from './components/CalendarHeader';
import WeekStrip from './components/WeekStrip';
import FloatingButtons from './components/FloatingButtons';
import { applyTelegramTheme } from './utils/Theme';
import { fetchUserTimezoneOffset } from './utils/timezone';

import './App.css';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [debugText, setDebugText] = useState("⏳ Инициализация...");

  useEffect(() => {
    WebApp.ready();
    applyTelegramTheme();
    WebApp.onEvent('themeChanged', applyTelegramTheme);

    async function initDate() {
      try {
        const offsetMin = await fetchUserTimezoneOffset();
        const nowUTC = new Date();
        const utcTimestamp = Date.now(); // ← UTC в миллисекундах
        const localTime = new Date(utcTimestamp + offsetMin * 60000);
        setCurrentDate(localTime);

        setDebugText(
          `✅ Смещение: ${offsetMin} мин\n` +
          `🌐 UTC: ${nowUTC.toISOString()}\n` +
          `📅 Локальное время: ${localTime.toLocaleString()}`
        );
      } catch (err) {
        console.error('⛔ Ошибка получения смещения:', err);
        setDebugText("❌ Ошибка получения смещения");
        setCurrentDate(new Date());
      }
    }

    initDate();
    return () => WebApp.offEvent('themeChanged', applyTelegramTheme);
  }, []);

  return (
    <div className="App">
      <CalendarHeader date={currentDate} />
      <WeekStrip date={currentDate} />
      <main className="main-content">
        {/* 👇 debug-панель */}
        <pre style={{
          fontSize: '12px',
          color: 'gray',
          whiteSpace: 'pre-wrap',
          marginTop: '20px',
          background: '#eee',
          padding: '10px',
          borderRadius: '8px',
        }}>
          {debugText}
        </pre>
      </main>
      <FloatingButtons />
    </div>
  );
}











