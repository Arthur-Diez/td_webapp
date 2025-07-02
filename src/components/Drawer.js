import React from 'react';
import './Drawer.css';

/**
 * Левая выдвижная шторка.
 * isOpen        – показывать/скрывать
 * onClose()     – колбэк, когда пользователь хочет спрятать
 */
function Drawer({ isOpen, onClose }) {
  return (
    <>
      {/* overlay */}
      <div
        className={`drawer-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
      />

      {/* сама панель */}
      <aside className={`drawer${isOpen ? ' open' : ''}`}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <ul className="drawer-menu">
          <li>Настройки</li>
          <li>О приложении</li>
          <li>Поддержка</li>
        </ul>
      </aside>
    </>
  );
}

export default Drawer;