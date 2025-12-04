// src/components/Tasks.jsx
import React, { useEffect, useState } from 'react';
import DayTimeline from './DayTimeline';
import { getTasksForDate, api } from '../utils/api';
import './Tasks.css';

const StateCard = ({ icon, title, subtitle, tone = 'default' }) => (
  <section className={`tasks-state tasks-state--${tone}`}>
    <div className="tasks-state-icon">{icon}</div>
    <div className="tasks-state-body">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  </section>
);

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

  if (!telegramId) {
    return (
      <StateCard
        icon="🔒"
        title="Нужна авторизация"
        subtitle="Перезапустите мини‑приложение в Telegram"
        tone="warning"
      />
    );
  }

  if (loading) {
    return (
      <StateCard
        icon="⌛"
        title="Синхронизация задач"
        subtitle="Подтягиваем ваш день..."
        tone="muted"
      />
    );
  }

  if (error) {
    return (
      <StateCard
        icon="⚠️"
        title="Не удалось загрузить"
        subtitle={String(error)}
        tone="warning"
      />
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="tasks-empty">
        <StateCard
          icon="🗓"
          title="На этот день нет задач"
          subtitle="Нажмите «+», чтобы добавить первую"
          tone="empty"
        />
      </section>
    );
  }

  return <DayTimeline dateISO={date} tasks={tasks} />;
}
