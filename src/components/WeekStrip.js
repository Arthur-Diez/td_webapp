// src/components/WeekStrip.js
import React from "react";
import "./WeekStrip.css";

export default function WeekStrip({ date, onDateSelect }) {
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay(); // 0 = воскресенье
  const diff = (dayOfWeek + 6) % 7; // смещение к понедельнику
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - diff);

  const weekDays = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="week-strip">
      {days.map((d, index) => {
        const isSelected = d.toDateString() === date.toDateString();
        return (
          <div
            className="day-cell"
            key={index}
            onClick={() => onDateSelect(d)}
          >
            <span className="day-name">{weekDays[index]}</span>
            <span className={`day-number ${isSelected ? "selected" : ""}`}>
              {d.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}