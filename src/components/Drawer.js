import React from 'react';
import './Drawer.css';

/**
 * Шторка теперь не умеет сама себя открывать — за это отвечает родитель
 */
function Drawer({ isOpen, onClose }) {
  return (
    <aside className={`drawer ${isOpen ? 'open' : ''}`}>
      <button className="drawer-close" onClick={onClose}>×</button>

      <ul className="drawer-menu">
        <li>Настройки</li>
        <li>О приложении</li>
        <li>Поддержка</li>
      </ul>
    </aside>
  );
}

export default Drawer;