import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

import Tasks    from './components/Tasks';
import Calendar from './components/Calendar';
import Profile  from './components/Profile';
import Drawer   from './components/Drawer';
import Tabs     from './components/Tabs';

import './App.css';

export default function App() {
  /* --- Telegram mini-app init --- */
  useEffect(() => {
    WebApp.ready();
  }, []);

  /* --- локальные состояния --- */
  const [activeTab,   setActiveTab]   = useState('tasks'); // 'tasks' | 'calendar' | 'profile'
  const [drawerOpen,  setDrawerOpen]  = useState(false);   // шторка слева

  /* --- отрисовываем центральный контент --- */
  const renderContent = () => {
    switch (activeTab) {
      case 'calendar': return <Calendar />;
      case 'profile':  return <Profile />;
      default:         return <Tasks />;
    }
  };

  return (
    <div className="App">
      {/* левая выдвижная шторка */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* основная область */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* нижняя панель навигации (с бургером) */}
      <Tabs
        current={activeTab}
        onSelect={setActiveTab}
        onMenuClick={() => setDrawerOpen(true)}
      />
    </div>
  );
}














