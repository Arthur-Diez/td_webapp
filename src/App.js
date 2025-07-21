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
  
  setConsoleData(
    `🧩 Debug:
  Telegram ID: ${tgId}
  UUID: ${uuid}
  Дата: ${localTime.toISOString().split("T")[0]}
  `
  );

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

        const tgId = WebApp.initDataUnsafe?.user?.id ?? 5773954061; // ← твой Telegram ID
        console.log("🧩 Telegram ID:", tgId);

        const uuid = await fetchUserUUID(tgId);
        console.log("🧩 Полученный UUID:", uuid);

        setUserId(uuid);                                     // сохраняем

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
            uid={userId}
            setConsoleData={setConsoleData}
          />
        )}
        {activeTab === "calendar" && <Calendar />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "settings" && (
          <p style={{ textAlign: 'center', marginTop: 40 }}>
            🛠 Раздел настроек будет позже
          </p>
        )}
         <pre style={{
          background: "#f0f0f0",
          color: "#333",
          fontSize: "12px",
          padding: "12px",
          margin: "12px auto",
          maxWidth: "90%",
          borderRadius: "8px",
          whiteSpace: "pre-wrap"
        }}>
          {consoleData}
        </pre>
      </main>

      <FloatingButtons />
    </div>
  );
}











