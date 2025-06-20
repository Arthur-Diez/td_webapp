import React, { useEffect } from "react";
import "./App.css";

function App() {
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();  // Говорим Telegram, что мы готовы
    console.log(tg.initDataUnsafe);  // Выведет ID пользователя, имя и т.д.
  }, []);

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














