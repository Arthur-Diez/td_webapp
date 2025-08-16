// src/components/Tasks.jsx
import React, { useEffect, useState } from 'react';
import TaskCard from './TaskCard';

export default function Tasks({ date, telegramId, setConsoleData }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!telegramId || !date) {
      console.warn("⛔ Нет UID или даты, fetch не выполняется");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const url = `https://td-webapp.onrender.com/tasks?uid=${telegramId}&date=${date}`;
        setConsoleData(prev => prev + `\n📡 Fetching: ${url}`);
        const res = await fetch(url);
        const data = await res.json();
        setConsoleData(prev => prev + `\n📦 Response: ${JSON.stringify(data, null, 2)}`);
        setTasks(!data.error ? data : []);
      } catch (e) {
        console.error("❌ Ошибка запроса задач:", e);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [telegramId, date, setConsoleData]);

  if (!telegramId) return <p style={{ textAlign: "center" }}>🔒 Не удалось определить пользователя</p>;
  if (loading) return <p style={{ textAlign: "center" }}>⏳ Загружаю задачи...</p>;
  if (tasks.length === 0) return <p style={{ textAlign: "center" }}>📭 Нет задач на этот день</p>;

  return (
    <div className="task-list">
      {tasks.map((task) => {
        const hasEnd  = !!task.end_dt;
        const start   = new Date(task.start_dt);
        const end     = hasEnd ? new Date(task.end_dt) : null;
        const expired = hasEnd && end < new Date();

        return (
          <div key={task.id} className={`task-card ${expired ? 'expired' : ''}`}>
            {!task.all_day && hasEnd && (
              <p className="task-time">
                🕒 {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {task.all_day && <p className="task-time">📅 Весь день</p>}
            <h4>{task.title}</h4>
            <p>{task.description}</p>
          </div>
        );
      })}
    </div>
  );
}