/// src/utils/timezone.js
export async function fetchUserTimezoneOffset() {
  console.log("[timezone.js] Старт функции");

  try {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const userId = user?.id;

    console.log("[timezone.js] Telegram User ID:", userId);

    if (!userId) throw new Error("User ID not found in initDataUnsafe");

    const res = await fetch(`https://td-webapp.onrender.com/timezone?uid=${userId}`);
    const data = await res.json();

    console.log("[timezone.js] API ответ:", data);
    return data.offset_min;
  } catch (err) {
    console.error("[timezone.js] Ошибка запроса смещения:", err);
    return 180;
  }
}