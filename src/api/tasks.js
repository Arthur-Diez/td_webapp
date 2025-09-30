// src/api/tasks.js
import { API_BASE } from '../utils/api';

const withBase = (path) => `${API_BASE}${path}`;

async function request(path, options = {}) {
  const res = await fetch(withBase(path), options);
  if (!res.ok) {
    const message = await safeReadError(res);
    throw new Error(message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function safeReadError(res) {
  try {
    const data = await res.json();
    return data?.error || data?.message;
  } catch (err) {
    return null;
  }
}

export function getSharedTasks(uid, signal) {
  if (!uid) throw new Error('uid is required');
  const search = new URLSearchParams({ uid: String(uid) });
  return request(`/tasks/shared?${search.toString()}`, { signal });
}