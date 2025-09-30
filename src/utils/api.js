// src/utils/api.js
const PLACEHOLDER_BASE = '{{API_BASE}}';
export const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (PLACEHOLDER_BASE.startsWith('http') ? PLACEHOLDER_BASE : 'https://api.freakdev.site');
export const api = (path) => `${API_BASE}${path}`;

export async function getTasksForDate(telegramId, date, signal) {
  const url = api(`/tasks?uid=${telegramId}&date=${date}`);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(data?.error || 'Bad response');
  return data;
}

// API метод добавления задачи из мини-приложения 
export async function createTask(payload) {
  const res = await fetch(api('/add_task'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}