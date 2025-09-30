// src/api/friends.js
import { API_BASE } from '../utils/api';

const withBase = (path) => `${API_BASE}${path}`;

async function request(path, options = {}) {
  const res = await fetch(withBase(path), {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

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

export function getFriends(uid, signal) {
  if (!uid) throw new Error('uid is required');
  const search = new URLSearchParams({ uid: String(uid) });
  return request(`/friends?${search.toString()}`, { signal });
}

export function getFriendsWithShared(uid, signal) {
  if (!uid) throw new Error('uid is required');
  const search = new URLSearchParams({ uid: String(uid) });
  return request(`/friends/with-shared?${search.toString()}`, { signal });
}

export function getFriendsActivity(uid, { limit = 20 } = {}, signal) {
  if (!uid) throw new Error('uid is required');
  const search = new URLSearchParams({ uid: String(uid), limit: String(limit) });
  return request(`/activity/friends?${search.toString()}`, { signal });
}