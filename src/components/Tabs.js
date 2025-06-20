import React from 'react';
import './Tabs.css';

function Tabs({ onMenuClick }) {
  return (
    <nav className="tabs">
      {/* Бургер слева */}
      <button className="tab-btn burger" onClick={onMenuClick}>☰</button>

      {/* Остальные вкладки */}
      <button className="tab-btn">Задачи</button>
      <button className="tab-btn">Календарь</button>
      <button className="tab-btn">Моё</button>
    </nav>
  );
}

export default Tabs;