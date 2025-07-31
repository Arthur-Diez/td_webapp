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

    async function fetchTasks() {
      console.log("📡 Запрашиваем задачи:", { telegramId, date });
      try {
        setLoading(true);
        const url = `https://td-webapp.onrender.com/tasks?uid=${telegramId}&date=${date}`;
        setConsoleData(prev => prev + `\n📡 Fetching: ${url}`);
        const res = await fetch(url);
        const data = await res.json();

        setConsoleData(prev => prev + `\n📦 Response: ${JSON.stringify(data, null, 2)}`);

        if (!data.error) {
          console.log("✅ Задачи получены:", data);
          setTasks(data);
        } else {
          console.error("❌ Ошибка от API:", data.error);
          setTasks([]);
        }
      } catch (err) {
        console.error("❌ Ошибка запроса задач:", err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [telegramId, date]);

  if (!telegramId) return <p style={{ textAlign: "center" }}>🔒 Не удалось определить пользователя</p>;
  if (loading) return <p style={{ textAlign: "center" }}>⏳ Загружаю задачи...</p>;
  if (tasks.length === 0) return <p style={{ textAlign: "center" }}>📭 Нет задач на этот день</p>;

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`task-card ${new Date(task.end_dt) < new Date() ? 'expired' : ''}`}
        >
          {!task.all_day && (
            <p className="task-time">
              🕒 {new Date(task.start_dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{new Date(task.end_dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {task.all_day && <p className="task-time">📅 Весь день</p>}
          <h4>{task.title}</h4>
          <p>{task.description}</p>
        </div>
      ))}
    </div>
  );
}