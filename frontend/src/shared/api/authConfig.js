import { getLegacyAuthHeaders } from './legacyToken';

export const staffAuthConfig = {
  withCredentials: true,
  get headers() {
    return getLegacyAuthHeaders();
  }
};
