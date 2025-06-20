import React from "react";
import "./App.css";
import { ready, initDataUnsafe } from '@telegram-apps/sdk';

ready();  // Telegram WebApp готов
console.log(initDataUnsafe); // Telegram user info

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














