// frontend/src/app/config.js
const envApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
const runtimeApiUrl = '/api';

export const API_URL = envApiUrl || runtimeApiUrl;
