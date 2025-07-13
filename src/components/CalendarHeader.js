// src/components/CalendarHeader.js
import React from "react";
import "./CalendarHeader.css";

export default function CalendarHeader({ date }) {
  const monthName = date.toLocaleString("ru-RU", { month: "long" });
  const year = date.getFullYear();

  return (
    <header className="calendar-header">
      <h1>
        <b>{monthName}</b> {year}
      </h1>
      <div className="icons">
        📅 🖼️ ⚙️
      </div>
    </header>
  );
}