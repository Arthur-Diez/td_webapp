import React, { useEffect, useState } from "react";
import TaskCard from "./TaskCard";

export default function Tasks({ date, uid }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatted = new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!uid || !date) return;

    async function fetchTasks() {
      setLoading(true);
      try {
        const res = await fetch(`https://td-webapp.onrender.com/api/tasks?uid=${uid}&date=${date}`);
        const data = await res.json();
        if (!data.error) {
          setTasks(data);
        } else {
          console.error("Ошибка от API:", data.error);
        }
      } catch (err) {
        console.error("Ошибка запроса задач:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [uid, date]);

  return (
    <section style={{ padding: 16 }}>
      <h2 style={{ textAlign: "center" }}>📋 Задачи на {formatted}</h2>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: 24 }}>⏳ Загрузка...</p>
      ) : tasks.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: 24 }}>
          Задач пока нет. Нажмите «плюс», чтобы создать первую.
        </p>
      ) : (
        tasks.map((task) => <TaskCard key={task.id} task={task} />)
      )}
    </section>
  );
}