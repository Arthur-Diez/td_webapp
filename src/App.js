import React from "react";
import "./App.css";
import TelegramWebApp from '@telegram-apps/sdk';

TelegramWebApp.ready();  // Подготовка
const initData = TelegramWebApp.initDataUnsafe;
console.log(initData); // Здесь будут tg_id, first_name и т.д.

function App() {
  return (
    <div className="App">
      <h1>📝 Планнер задач</h1>
      <button className="telegram-button" onClick={() => alert("Создание задачи...")}>
        ➕ Создать задачу
      </button>
    </div>
  );
}

export default App;














