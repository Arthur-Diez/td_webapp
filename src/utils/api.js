// src/utils/api.js
// ⚠️ замени IP и порт на свои (если настроишь nginx — будет https и 443)
export const API_BASE = 'http://147.45.167.44:8000';
export const api = (path) => `${API_BASE}${path}`;