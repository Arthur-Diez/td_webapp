import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { parseInitData } from '@telegram-apps/sdk';

const initData = window.Telegram?.WebApp?.initData || '';
const parsedData = parseInitData(initData);

console.log('Данные, полученные от Telegram:', parsedData);

const initializeTelegramWebApp = async () => {
  if (window.Telegram?.WebApp) {
    try {
      const webApp = window.Telegram.WebApp;

      // Готовим приложение
      console.log("Инициализация WebApp...");
      webApp.ready();

      // Выводим информацию о пользователе
      console.log("Данные пользователя:", webApp.initDataUnsafe);

      // Устанавливаем тему
      const theme = webApp.themeParams;
      console.log("Параметры темы:", theme);
    } catch (error) {
      console.error("Ошибка при инициализации WebApp:", error);
    }
  } else {
    console.error("Telegram WebApp API не доступен. Проверьте окружение.");
  }
};

// Инициализация Telegram WebApp
initializeTelegramWebApp();

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);