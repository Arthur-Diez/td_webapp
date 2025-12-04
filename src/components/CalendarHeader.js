// src/components/CalendarHeader.js
import React from "react";
import "./CalendarHeader.css";

export default function CalendarHeader({ date, onTabChange }) {
  const monthName = date.toLocaleString("ru-RU", { month: "long" });
  const year = date.getFullYear();
  const formattedTitle = `${monthName} ${year}`;

  return (
    <header className="calendar-header">
      <div className="calendar-slot">
        <button
          type="button"
          className="calendar-chip icon-btn"
          aria-label="Вернуться"
          onClick={() => onTabChange("calendar")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
      </div>

      <div className="calendar-heading">
        <span className="calendar-heading-label">месяц</span>
        <div className="calendar-heading-value" key={formattedTitle}>
          {formattedTitle}
        </div>
      </div>

      <div className="calendar-actions">
        <button
          type="button"
          className="calendar-chip icon-btn"
          aria-label="Сегодня"
          onClick={() => onTabChange("profile")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </button>
        <button
          type="button"
          className="calendar-chip icon-btn"
          aria-label="Настройки"
          onClick={() => onTabChange("settings")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 15 3 3m-3-3-3 3m3-3V4m0 11L9 8h6l-3 7Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
