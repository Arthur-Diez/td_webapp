// src/App.js
import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

import CalendarHeader   from './components/CalendarHeader';
import WeekStrip        from './components/WeekStrip';
import FloatingButtons  from './components/FloatingButtons';
import { applyTelegramTheme } from './utils/Theme';
import { fetchUserTimezoneOffset } from './utils/timezone';

import './App.css';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    WebApp.ready();
    applyTelegramTheme();
    WebApp.onEvent('themeChanged', applyTelegramTheme);

    fetchUserTimezoneOffset().then(offsetMin => {
      const nowUTC = new Date();
      const localTime = new Date(nowUTC.getTime() + offsetMin * 60 * 1000);
      setCurrentDate(localTime);
    });

    return () => WebApp.offEvent('themeChanged', applyTelegramTheme);
  }, []);

  return (
    <div className="App">
      <CalendarHeader date={currentDate} />
      <WeekStrip date={currentDate} />
      <main className="main-content" />
      <FloatingButtons />
    </div>
  );
}












