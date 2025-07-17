// src/components/CalendarHeader.js
import React from "react";
import "./CalendarHeader.css";

export default function CalendarHeader({ date }) {
  const monthName = date.toLocaleString("ru-RU", { month: "long" });
  const year = date.getFullYear();

  return (
    <header className="calendar-header">
      <div className="calendar-title">
        <b className="month">{monthName}</b>
        <span className="year">{year}</span>
      </div>
      <div className="calendar-icons">
        <span className="icon">📅</span>
        <span className="icon">🖼️</span>
        <span className="icon">⚙️</span>
      </div>
    </header>
  );
}