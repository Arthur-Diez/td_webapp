// src/components/Tasks.jsx
import React, { useEffect, useState } from 'react';
import DayTimeline from './DayTimeline';
import { getTasksForDate, api } from '../utils/api';

export default function Tasks({ date, telegramId, setConsoleData = () => {} }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!telegramId || !date) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    (async () => {
      try {
        setError(null);
        setLoading(true);

        const url = api(`/tasks?uid=${telegramId}&date=${date}`);
        setConsoleData(prev => prev + `\n📡 Fetching: ${url}`);

        const data = await getTasksForDate(telegramId, date, controller.signal);
        setConsoleData(prev => prev + `\n📦 Response: ${JSON.stringify(data, null, 2)}`);
        setTasks(data);
      } catch (e) {
        const msg = e.name === 'AbortError' ? 'timeout 10s' : e.message;
        setConsoleData(prev => prev + `\n❌ Fetch error: ${msg}`);
        setError(msg);
        setTasks([]);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    })();

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [telegramId, date, setConsoleData]);

  if (!telegramId) return <p style={{ textAlign: 'center' }}>🔒 Не удалось определить пользователя</p>;
  if (loading)     return <p style={{ textAlign: 'center' }}>⏳ Загружаю задачи...</p>;
  if (error)       return <p style={{ textAlign: 'center' }}>⚠️ Ошибка: {String(error)}</p>;
  if (tasks.length === 0) return <p style={{ textAlign: 'center' }}>📭 Нет задач на этот день</p>;

  // НОВОЕ отображение
  return <DayTimeline dateISO={date} tasks={tasks} />;
}