import axios from 'axios';
import { getLegacyAuthHeaders } from './legacyToken';
import { API_URL } from '../../app/config';

const baseURL = API_URL;

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosClient.interceptors.request.use(
  (config) => {
    const legacyHeaders = getLegacyAuthHeaders();
    if (legacyHeaders.Authorization && !config?.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = legacyHeaders.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
