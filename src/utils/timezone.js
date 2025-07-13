// src/utils/timezone.js
export async function fetchUserTimezoneOffset() {
  const initData = window.Telegram.WebApp.initDataUnsafe;
  const userId = initData.user?.id;

  if (!userId) throw new Error("Пользователь не найден в initData");

  const response = await fetch(`https://<https://td-webapp.onrender.com>/api/timezone?telegram_id=${userId}`);
  if (!response.ok) throw new Error("Ошибка при получении часового пояса");

  const json = await response.json();
  return json.offset_min;
}