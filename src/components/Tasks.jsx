// src/components/Tasks.jsx
import React, { useEffect, useState } from 'react';
import TaskCard from './TaskCard';
import { api } from '../utils/api';

export default function Tasks({ date, telegramId, setConsoleData = () => {} }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!telegramId || !date) {
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

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setConsoleData(prev => prev + `\n📦 Response: ${JSON.stringify(data, null, 2)}`);

        if (Array.isArray(data)) setTasks(data);
        else if (data?.error) { setTasks([]); setError(data.error); }
        else setTasks([]);
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

  return (
    <div className="task-list">
      {tasks.map(task => {
        const hasEnd  = !!task.end_dt;
        const start   = new Date(task.start_dt);
        const end     = hasEnd ? new Date(task.end_dt) : null;
        const expired = hasEnd && end < new Date();

        const timeStr = task.all_day
          ? null
          : hasEnd
            ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        return (
          <div key={task.id} className={`task-card ${expired ? 'expired' : ''}`}>
            {!task.all_day && <p className="task-time">🕒 {timeStr}</p>}
            {task.all_day && <p className="task-time">📅 Весь день</p>}
            <h4>{task.title}</h4>
            {task.description && <p>{task.description}</p>}
          </div>
        );
      })}
    </div>
  );
}