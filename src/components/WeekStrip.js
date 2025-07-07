// WeekStrip.js
import React from 'react';
import './WeekStrip.css';

export default function WeekStrip() {
  const days = ['вт', 'ср', 'чт', 'пт', 'сб', 'вс', 'пн'];
  const dates = [1, 2, 3, 4, 5, 6, 7]; // тест

  return (
    <div className="week-strip">
      {days.map((day, index) => (
        <div className="day-cell" key={index}>
          <span className="day-name">{day}</span>
          <span className={`day-number ${index === 6 ? 'today' : ''}`}>{dates[index]}</span>
        </div>
      ))}
    </div>
  );
}