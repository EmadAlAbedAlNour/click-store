export const LEGACY_AUTH_TOKEN_KEY = 'token';

export const getLegacyAuthToken = () => {
  try {
    const value = String(localStorage.getItem(LEGACY_AUTH_TOKEN_KEY) || '').trim();
    return value || null;
  } catch {
    return null;
  }
};

export const getLegacyAuthHeaders = () => {
  const token = getLegacyAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const clearLegacyAuthToken = () => {
  try {
    localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
};

