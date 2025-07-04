import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { applyTelegramTheme } from './utils/Theme';

import Tasks     from './components/Tasks';
import Calendar  from './components/Calendar';
import Profile   from './components/Profile';
import Drawer    from './components/Drawer';
import Tabs      from './components/Tabs';

import './App.css';

export default function App() {
  /* подготовка Telegram-WebApp */
  useEffect(() => {
    WebApp.ready();
    // 1) первый запуск
    applyTelegramTheme();

    // 2) ловим смену темы в клиенте
    WebApp.onEvent('themeChanged', applyTelegramTheme);
    return () => WebApp.offEvent('themeChanged', applyTelegramTheme);
  }, []);

  /* состояние UI */
  const [activeTab,  setActiveTab] = useState('tasks');   // текущая вкладка
  const [drawerOpen, setDrawerOpen] = useState(false);    // боковая шторка

  /* контент по вкладке */
  const renderContent = () => {
    switch (activeTab) {
      case 'calendar': return <Calendar />;
      case 'profile':  return <Profile  />;
      default:         return <Tasks    />;
    }
  };

  return (
    <div className="App">
      {/* левая шторка */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* центр */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* нижняя навигация */}
      <Tabs
        current={activeTab}
        onSelect={setActiveTab}
        onMenuClick={() => setDrawerOpen(true)}
      />
    </div>
  );
}













