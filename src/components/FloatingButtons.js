import React from 'react';
import './FloatingButtons.css';

export default function FloatingButtons() {
  return (
    <div className="floating-container">
      <div className="left-buttons">
        <button className="circle-button">👤</button>
        <button className="circle-button">👥</button>
      </div>
      <div className="right-button">
        <button className="circle-button main">＋</button>
      </div>
    </div>
  );
}