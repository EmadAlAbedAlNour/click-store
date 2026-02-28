import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../index.css';
import { AuthProvider } from '../shared/contexts/AuthContext';
import { SettingsProvider } from '../shared/contexts/SettingsContext';
import { CartProvider } from '../shared/contexts/CartContext';
import { WishlistProvider } from '../shared/contexts/WishlistContext';
import { ToastProvider } from '../shared/contexts/ToastContext';
import { getLegacyAuthHeaders } from '../shared/api/legacyToken';

axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const legacyHeaders = getLegacyAuthHeaders();
  if (legacyHeaders.Authorization && !config?.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = legacyHeaders.Authorization;
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
              <App />
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
