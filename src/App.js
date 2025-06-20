import React, { useState, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import Tasks from "./components/Tasks";
import Calendar from "./components/Calendar";
import Profile from "./components/Profile";
import Tabs from "./components/Tabs";
import "./App.css";
import Drawer from './components/Drawer';

function App() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="App">
      {/* Шторка */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Основной интерфейс */}
      <div className="main-content">
        {/* ...всё, что было... */}
      </div>

      {/* Нижнее меню */}
      <div className="bottom-nav">
        <button className="nav-button" onClick={() => setDrawerOpen(true)}>☰</button>
        {/* Остальные кнопки */}
        <button className="nav-button">Задачи</button>
        <button className="nav-button">Календарь</button>
        <button className="nav-button">Моё</button>
      </div>
    </div>
  );
}

export default App;














