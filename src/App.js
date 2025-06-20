import React, { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';   // ✅ корректный импорт
import './App.css';

function App() {
  useEffect(() => {
    WebApp.ready();                 // сообщаем Telegram, что всё отрисовалось
    console.log(WebApp.initData);   // либо WebApp.initDataUnsafe
  }, []);

  return (
    <div className="App">
      <h1>📝 Планнер задач</h1>
      <button
        className="telegram-button"
        onClick={() => WebApp.showAlert('Создание задачи…')}
      >
        ➕ Создать задачу
      </button>
    </div>
  );
}

export default App;














