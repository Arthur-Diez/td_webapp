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

    const theme = WebApp.themeParams || {};
    const root = document.documentElement;

    if (theme.bg_color) root.style.setProperty('--tg-bg', theme.bg_color);
    if (theme.text_color) root.style.setProperty('--tg-fg', theme.text_color);
    if (theme.button_color) root.style.setProperty('--tg-btn-bg', theme.button_color);
    if (theme.button_text_color) root.style.setProperty('--tg-btn-fg', theme.button_text_color);
    if (theme.hint_color) root.style.setProperty('--tg-accent', theme.hint_color);
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













