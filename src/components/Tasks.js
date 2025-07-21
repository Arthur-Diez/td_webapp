// src/components/Tasks.js
import React from "react";
import TaskCard from "./TaskCard";

export default function Tasks({ date, tasks = [] }) {
  const formatted = new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section style={{ padding: 16 }}>
      <h2 style={{ textAlign: "center" }}>📋 Задачи на {formatted}</h2>

      {tasks.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: 24 }}>
          Задач пока нет. Нажмите «плюс», чтобы создать первую.
        </p>
      ) : (
        tasks.map((task) => <TaskCard key={task.id} task={task} />)
      )}
    </section>
  );
}