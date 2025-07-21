// src/App.js
import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

import CalendarHeader from './components/CalendarHeader';
import WeekStrip from './components/WeekStrip';
import FloatingButtons from './components/FloatingButtons';
import { applyTelegramTheme } from './utils/Theme';
import { fetchUserTimezoneOffset } from './utils/timezone';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Profile from './components/Profile';
import { fetchUserUUID } from "./utils/fetchUserUUID";


import './App.css';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [debugText, setDebugText] = useState("⏳ Инициализация...");
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    WebApp.ready();
    applyTelegramTheme();
    WebApp.onEvent('themeChanged', applyTelegramTheme);

    async function initDate() {
      try {
        const offsetMin = await fetchUserTimezoneOffset();

        const now = new Date();
        const utcTimestamp = now.getTime() + now.getTimezoneOffset() * 60000;
        const nowUTC = new Date(utcTimestamp);
        const localTime = new Date(utcTimestamp + offsetMin * 60000);

        const telegramId = WebApp.initDataUnsafe?.user?.id;
        const uuid = await fetchUserUUID(telegramId);
        setUserId(uuid);

        setCurrentDate(localTime);
        setSelectedDate(localTime);

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
      <CalendarHeader date={currentDate} onTabChange={setActiveTab} />
      <WeekStrip date={selectedDate} onDateSelect={setSelectedDate} />

      <main className="main-content">
        {activeTab === "tasks" && (
          <Tasks
            date={selectedDate.toISOString().split('T')[0]}
            uid={WebApp.initDataUnsafe?.user?.id || WebApp.initDataUnsafe?.user?.telegram_id}
          />
        )}
        {activeTab === "calendar" && <Calendar />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "settings" && (
          <p style={{ textAlign: 'center', marginTop: 40 }}>
            🛠 Раздел настроек будет позже
          </p>
        )}
      </main>

      <FloatingButtons />
    </div>
  );
}











