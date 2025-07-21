// src/components/Tasks.jsx
import React, { useEffect, useState } from 'react';

export default function Tasks({ date, uid }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !date) return;

    async function fetchTasks() {
        try {
            setLoading(true);
            const response = await fetch(`https://td-webapp.onrender.com/api/tasks?uid=${uid}&date=${date}`);
            const data = await response.json();
            if (!data.error) {
            setTasks(data);
            } else {
            console.error("Ошибка от API:", data.error);
            setTasks([]);
            }
        } catch (err) {
            console.error("Ошибка при загрузке задач:", err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
        }

    fetchTasks();
  }, [uid, date]);

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