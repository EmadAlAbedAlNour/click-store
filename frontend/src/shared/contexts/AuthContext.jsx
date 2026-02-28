import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../app/config';
import { clearLegacyAuthToken } from '../api/legacyToken';

const AuthContext = createContext(null);
const SESSION_FLAG = 'cookie-session';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [customerToken, setCustomerToken] = useState(null);
  const [customer, setCustomer] = useState(null);

  const refreshAdminSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      const nextUser = res.data || null;
      if (nextUser) {
        setUser(nextUser);
        setToken(SESSION_FLAG);
        return nextUser;
      }
    } catch {
      // ignore
    }
    setUser(null);
    setToken(null);
    return null;
  }, []);

  const refreshCustomerSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/customers/me`);
      const nextCustomer = res.data || null;
      if (nextCustomer) {
        setCustomer(nextCustomer);
        setCustomerToken(SESSION_FLAG);
        return nextCustomer;
      }
    } catch {
      // ignore
    }
    setCustomer(null);
    setCustomerToken(null);
    return null;
  }, []);

  useEffect(() => {
    refreshAdminSession();
    refreshCustomerSession();
  }, [refreshAdminSession, refreshCustomerSession]);

  const loginAdmin = useCallback((role, fullName) => {
    setToken(SESSION_FLAG);
    setUser({ role, full_name: fullName });
  }, []);

  const logoutAdmin = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/logout`);
    } catch {
      // ignore
    }
    clearLegacyAuthToken();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const loginCustomer = useCallback(async () => {
    setCustomerToken(SESSION_FLAG);
    await refreshCustomerSession();
  }, [refreshCustomerSession]);

  const logoutCustomer = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/customers/logout`);
    } catch {
      // ignore
    }
    setCustomerToken(null);
    setCustomer(null);
    window.location.href = '/';
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    customerToken,
    customer,
    setToken,
    setUser,
    loginAdmin,
    logoutAdmin,
    loginCustomer,
    logoutCustomer,
    refreshAdminSession,
    refreshCustomerSession
  }), [token, user, customerToken, customer, loginAdmin, logoutAdmin, loginCustomer, logoutCustomer, refreshAdminSession, refreshCustomerSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
