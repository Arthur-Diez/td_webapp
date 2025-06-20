import React from 'react';
import './Drawer.css';

function Drawer({ isOpen, onClose }) {
  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <button className="drawer-close" onClick={onClose}>×</button>
      <ul className="drawer-menu">
        <li>Настройки</li>
        <li>О приложении</li>
        <li>Поддержка</li>
      </ul>
    </div>
  );
}

export default Drawer;