// src/components/CalendarHeader.js
import React from "react";
import "./CalendarHeader.css";

export default function CalendarHeader({ date, onTabChange }) {
  const monthName = date.toLocaleString("ru-RU", { month: "long" });
  const year = date.getFullYear();

  return (
    <header className="calendar-header">
      <div className="calendar-title">
        <b className="month">{monthName}</b>
        <span className="year">{year}</span>
      </div>
      <div className="calendar-icons">
        <button className="icon-btn" onClick={() => onTabChange("calendar")}>📅</button>
        <button className="icon-btn" onClick={() => onTabChange("profile")}>🖼️</button>
        <button className="icon-btn" onClick={() => onTabChange("settings")}>⚙️</button>
      </div>
    </header>
  );
}