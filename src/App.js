// src/App.js
import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

import CalendarHeader from './components/CalendarHeader';
import WeekStrip from './components/WeekStrip';
import { applyTelegramTheme } from './utils/Theme';
import { fetchUserTimezoneOffset } from './utils/timezone';
import Tasks from './components/Tasks';
import BottomTabBar from './components/BottomTabBar';
import FloatingButtons from './components/FloatingButtons'; // оставляем, но теперь это новый FAB

import './App.css';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [debugText, setDebugText] = useState('⏳ Инициализация...');
  const [consoleData, setConsoleData] = useState('🧾 Консоль запущена...');
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    WebApp.ready();
    applyTelegramTheme();
    WebApp.onEvent('themeChanged', applyTelegramTheme);

    async function initDate() {
      try {
        setConsoleData(prev => prev + '\n🚀 initDate запущен');

        const offsetMin = await fetchUserTimezoneOffset();
        setConsoleData(prev => prev + `\n🕒 Смещение: ${offsetMin} мин`);

        const now = new Date();
        const utcTimestamp = now.getTime() + now.getTimezoneOffset() * 60000;
        const nowUTC = new Date(utcTimestamp);
        const localTime = new Date(utcTimestamp + offsetMin * 60000);

        const tgId = WebApp.initDataUnsafe?.user?.id;
        setConsoleData(prev => prev + `\n🧩 Telegram ID: ${tgId}`);

        if (!tgId) {
          setConsoleData(prev => prev + '\n⛔ Не удалось получить Telegram ID');
          setUserId(null);
          return;
        }

        // (опционально) сообщаем боту текущее локальное время
        WebApp.sendData(JSON.stringify({
          telegram_id: tgId,
          local_time: localTime.toISOString(),
        }));

        setUserId(tgId);
        setCurrentDate(localTime);
        setSelectedDate(localTime);

        setConsoleData(prev => prev + `\n📅 Дата: ${localTime.toLocaleDateString('en-CA')}`);

        setDebugText(
          `✅ Смещение: ${offsetMin} мин\n` +
          `🌐 UTC: ${nowUTC.toISOString()}\n` +
          `📅 Локальное время: ${localTime.toLocaleString()}`
        );
      } catch (err) {
        console.error('⛔ Ошибка в initDate:', err);
        setConsoleData(prev => prev + `\n⛔ Ошибка в initDate: ${err.message}`);
        setDebugText('❌ Ошибка получения смещения');
        setCurrentDate(new Date());
      }
    }

    initDate();
    return () => WebApp.offEvent('themeChanged', applyTelegramTheme);
  }, []);

  // локальная дата для запросов в API (YYYY-MM-DD)
  const dateStr =
    selectedDate instanceof Date
      ? selectedDate.toLocaleDateString('en-CA')
      : '';

  return (
    <div className="App">
      <CalendarHeader date={currentDate} onTabChange={setActiveTab} />
      <WeekStrip date={selectedDate} onDateSelect={setSelectedDate} />

      <main className="main-content">
        {activeTab === 'tasks'   && (
          <Tasks
            date={dateStr}               // <-- ЛОКАЛЬНАЯ дата
            telegramId={userId}
            setConsoleData={setConsoleData} // <-- передаём логгер
          />
        )}
        {activeTab === 'groups'  && (
          <p style={{ textAlign: 'center', marginTop: 40 }}>👥 Группы — скоро ✨</p>
        )}
        {activeTab === 'friends' && (
          <p style={{ textAlign: 'center', marginTop: 40 }}>🧑‍🤝‍🧑 Друзья — скоро ✨</p>
        )}
        {activeTab === 'focus'   && (
          <p style={{ textAlign: 'center', marginTop: 40 }}>🎯 Фокус — скоро ✨</p>
        )}

        <pre
          style={{
            background: '#f0f0f0',
            color: '#333',
            fontSize: '12px',
            padding: '12px',
            margin: '12px auto',
            maxWidth: '90%',
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {consoleData}
        </pre>
      </main>

      <BottomTabBar active={activeTab} onChange={setActiveTab} />
      <FloatingButtons onAdd={() => console.log('TODO: открыть экран создания задачи')} />
    </div>
  );
}











