// src/api/challenges.js
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

export function getChallenges(uid, signal) {
  if (!uid) throw new Error('uid is required');
  const search = new URLSearchParams({ uid: String(uid) });
  return request(`/challenges?${search.toString()}`, { signal });
}

export function createChallenge(payload) {
  return request('/challenges', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addChallengeProgress(id, payload) {
  if (!id) throw new Error('id is required');
  return request(`/challenges/${id}/progress`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getChallengeSummary(id, signal) {
  if (!id) throw new Error('id is required');
  return request(`/challenges/${id}/summary`, { signal });
}