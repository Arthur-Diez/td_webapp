// src/utils/api.js
// Было: http://147.45.167.44:8000
export const API_BASE = 'https://api.freakdev.site';
export const api = (path) => `${API_BASE}${path}`;

export async function getTasksForDate(telegramId, date, signal) {
  const url = api(`/tasks?uid=${telegramId}&date=${date}`);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(data?.error || 'Bad response');
  return data;
}