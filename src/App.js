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


import './App.css';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [debugText, setDebugText] = useState("⏳ Инициализация...");
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const mockTasks = [
    {
      id: "1",
      title: "Встреча с другом",
      description: "Обсудить проект",
      start_dt: "2025-07-21T13:00:00+03:00",
      end_dt: "2025-07-21T14:00:00+03:00",
      all_day: false,
      status: "active",
    },
    {
      id: "2",
      title: "День рождения мамы",
      description: "",
      all_day: true,
      status: "active",
    },
    {
      id: "3",
      title: "Старая задача",
      description: "Просрочена",
      start_dt: "2025-07-19T10:00:00+03:00",
      end_dt: "2025-07-19T11:00:00+03:00",
      all_day: false,
      status: "active",
    },
  ];

  useEffect(() => {
    WebApp.ready();
    applyTelegramTheme();
    WebApp.onEvent('themeChanged', applyTelegramTheme);

    async function initDate() {
    try {
      const offsetMin = await fetchUserTimezoneOffset();

      // Получаем UTC-время в миллисекундах независимо от локали
      const now = new Date();
      const utcTimestamp = now.getTime() + now.getTimezoneOffset() * 60000;

      const nowUTC = new Date(utcTimestamp);
      const localTime = new Date(utcTimestamp + offsetMin * 60000);

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
        {activeTab === "tasks" && <Tasks date={selectedDate} tasks={mockTasks} />}
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











