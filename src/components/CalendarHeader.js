// CalendarHeader.js
import React from 'react';
import './CalendarHeader.css';

export default function CalendarHeader() {
  return (
    <div className="calendar-header">
      <div className="header-left">
        <span className="month">июля</span>
        <span className="year">2025</span>
      </div>
      <div className="header-right">
        <button>🗓️</button>
        <button>🖼️</button>
        <button>⚙️</button>
      </div>
    </div>
  );
}