import React, { useEffect, useState } from 'react';
import TaskCard from './TaskCard';

export default function Tasks({ date, uid }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !date) {
      console.warn("⛔ Нет UID или даты, fetch не выполняется");
      return;
    }

    async function fetchTasks() {
      console.log("📡 Запрашиваем задачи:", { uid, date });
      try {
        setLoading(true);
        const res = await fetch(`https://td-webapp.onrender.com/api/tasks?uid=${uid}&date=${date}`);
        const data = await res.json();

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
  }, [uid, date]);

  if (!uid) return <p style={{ textAlign: "center" }}>🔒 Не удалось определить пользователя</p>;
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