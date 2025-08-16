/// src/utils/timezone.js
import { api } from './api';

export async function fetchUserTimezoneOffset() {
  try {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!userId) throw new Error("User ID not found in initDataUnsafe");

    const res = await fetch(api(`/timezone?uid=${userId}`));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return data.offset_min ?? 180;
  } catch (err) {
    console.error("[timezone.js] Ошибка запроса смещения:", err);
    return 180;
  }
}