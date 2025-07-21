// src/utils/fetchUserUUID.js
export async function fetchUserUUID(tgId) {
  try {
    const res  = await fetch(
      `https://td-webapp.onrender.com/user_id?tg_id=${tgId}`
    );
    const data = await res.json();
    if (data.id) {
      return data.id;                 // ← UUID найден
    }
    console.error("Ошибка получения UUID:", data.error);
    return null;
  } catch (err) {
    console.error("Ошибка запроса UUID:", err);
    return null;
  }
}