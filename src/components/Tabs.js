import React from "react";
import "./Tabs.css";

function Tabs({ current, onChange }) {
  return (
    <div className="tabs">
      <button className={current === "tasks" ? "active" : ""} onClick={() => onChange("tasks")}>
        📋<br />Задачи
      </button>
      <button className={current === "calendar" ? "active" : ""} onClick={() => onChange("calendar")}>
        📅<br />Календарь
      </button>
      <button className={current === "profile" ? "active" : ""} onClick={() => onChange("profile")}>
        👤<br />Моё
      </button>
    </div>
  );
}

export default Tabs;