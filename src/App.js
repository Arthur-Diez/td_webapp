// src/App.js
import React, { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

import CalendarHeader   from './components/CalendarHeader';
import WeekStrip        from './components/WeekStrip';
import FloatingButtons  from './components/FloatingButtons';
import { applyTelegramTheme } from './utils/Theme';

import './App.css';

export default function App() {
  /* инициализация Telegram Web App + применение цветов темы */
  useEffect(() => {
    WebApp.ready();
    applyTelegramTheme();
    WebApp.onEvent('themeChanged', applyTelegramTheme);
    return () => WebApp.offEvent('themeChanged', applyTelegramTheme);
  }, []);

  return (
    <div className="App">
      <CalendarHeader />   {/* «июля 2025» + иконки справа */}
      <WeekStrip />        {/* 7-дневная полоса */}
      
      {/* место под задачи/календарь на день — пока просто пустой контейнер */}
      <main className="main-content" />

      <FloatingButtons />  {/* «+», аватар иконка группы — уже внутри компонента */}
    </div>
  );
}













