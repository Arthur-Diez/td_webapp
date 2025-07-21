// src/components/TaskCard.js
import React from "react";
import "./TaskCard.css";

export default function TaskCard({ task }) {
  const isOverdue =
    !task.all_day &&
    new Date(task.end_dt) < new Date() &&
    task.status === "active";

  const timeRange = task.all_day
    ? "🗓 Весь день"
    : `🕒 ${new Date(task.start_dt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${new Date(task.end_dt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

  return (
    <div className={`task-card ${isOverdue ? "overdue" : ""}`}>
      <div className="task-time">{timeRange}</div>
      <div className="task-title">{task.title}</div>
      {task.description && (
        <div className="task-desc">{task.description}</div>
      )}
    </div>
  );
}