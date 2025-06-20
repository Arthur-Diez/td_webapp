import React, { useState } from 'react';
import './Drawer.css';

function DrawerToggleWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const closeDrawer = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button className="drawer-toggle" onClick={toggleDrawer}>☰</button>
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <button className="drawer-close" onClick={closeDrawer}>×</button>
        <ul className="drawer-menu">
          <li>Настройки</li>
          <li>О приложении</li>
          <li>Поддержка</li>
        </ul>
      </div>
    </>
  );
}

export default DrawerToggleWrapper;