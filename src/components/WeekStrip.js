// src/components/WeekStrip.js
import React from "react";
import "./WeekStrip.css";

export default function WeekStrip({ date, onDateSelect }) {
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay();
  const diff = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - diff);

  const weekDays = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="week-strip">
      {days.map((d, index) => {
        const isSelected = d.toDateString() === date.toDateString();
        const isToday = d.toDateString() === today.toDateString();
        const weekDayLabel = weekDays[index]?.toUpperCase();
        return (
          <button
            key={index}
            type="button"
            onClick={() => onDateSelect(d)}
            className={`day-cell ${isSelected ? "day-cell--active" : ""}`}
            aria-pressed={isSelected}
          >
            <span className="day-name">{weekDayLabel}</span>
            <span
              className={[
                "day-chip",
                isSelected && "day-chip--selected",
                isToday && !isSelected && "day-chip--today",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="day-number">{d.getDate()}</span>
            </span>
            <span className="day-dot" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
