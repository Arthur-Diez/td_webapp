// src/utils/timezone.js
export async function fetchUserTimezoneOffset() {
  try {
    const response = await fetch("/api/user_tz_offset");
    const { tz_offset_min } = await response.json();
    return tz_offset_min; // например, 180
  } catch (err) {
    console.error("Ошибка получения часового пояса:", err);
    return 0;
  }
}