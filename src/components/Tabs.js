import React from 'react';
import './Tabs.css';

// Если нужны «живые» иконки – закомментированный пример:
// import { MdMenu, MdCheckBox, MdCalendarToday, MdPerson } from 'react-icons/md';

function Tabs({ current = 'tasks', onSelect, onMenuClick }) {
  return (
    <nav className="tabs">
      {/* бургер слева */}
      <button
        className="tab-btn burger"
        onClick={onMenuClick}
        aria-label="Меню"
      >
        {/* <MdMenu /> */} ☰
      </button>

      <button
        className={`tab-btn${current === 'tasks' ? ' active' : ''}`}
        onClick={() => onSelect('tasks')}
      >
        {/* <MdCheckBox size={20}/> */}
        Задачи
      </button>

      <button
        className={`tab-btn${current === 'calendar' ? ' active' : ''}`}
        onClick={() => onSelect('calendar')}
      >
        {/* <MdCalendarToday size={20}/> */}
        Календарь
      </button>

      <button
        className={`tab-btn${current === 'profile' ? ' active' : ''}`}
        onClick={() => onSelect('profile')}
      >
        {/* <MdPerson size={20}/> */}
        Моё
      </button>
    </nav>
  );
}

export default Tabs;