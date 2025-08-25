// src/components/TaskCard.js
import React from "react";
import "./TaskCard.css";

export default function TaskCard({ task }) {
  const start = task.start_dt ? new Date(task.start_dt) : null;
  const end   = task.end_dt   ? new Date(task.end_dt)   : null;

  // просрочена только когда задача ещё «в работе»
  const isOverdue =
    !task.all_day &&
    !!end &&
    end < new Date() &&
    (task.status === "pending"); // раньше было "active"

  const fmtHM = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const timeRange = task.all_day
    ? "🗓 Весь день"
    : end && end.getTime() !== start.getTime()
      ? `🕒 ${fmtHM(start)} – ${fmtHM(end)}`
      : `🕒 ${fmtHM(start)}`;

  return (
    <div className={`task-card ${isOverdue ? "overdue" : ""}`}>
      <div className="task-time">{timeRange}</div>
      <div className="task-title">{task.title}</div>
      {task.description && <div className="task-desc">{task.description}</div>}
      {/* при желании можно показать «от кого» */}
      {/* {task.from_name && <div className="task-from">от {task.from_name}</div>} */}
    </div>
  );
}