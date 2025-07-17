// src/components/WeekStrip.js
import React from "react";
import "./WeekStrip.css";

export default function WeekStrip({ date }) {
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

  const isToday = (d) =>
    d.toDateString() === new Date().toDateString();

  return (
    <div className="week-strip">
      {days.map((d, index) => (
        <div className="day-cell" key={index}>
          <span className="day-name">{weekDays[index]}</span>
          <span className={`day-number ${isToday(d) ? "today" : ""}`}>
            {d.getDate()}
          </span>
        </div>
      ))}
    </div>
  );
}