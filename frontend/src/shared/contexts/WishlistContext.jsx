import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../app/config';
import { useAuthContext } from './AuthContext';

const WishlistContext = createContext(null);
const GUEST_WISHLIST_KEY = 'wishlist_guest_ids';

const uniqIds = (ids = []) => Array.from(new Set((ids || []).map((id) => Number(id)).filter(Boolean)));

export const WishlistProvider = ({ children }) => {
  const { customerToken } = useAuthContext();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const persistGuestWishlist = (ids) => {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(uniqIds(ids)));
  };

  const loadGuestWishlist = () => {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];
    try {
      return uniqIds(JSON.parse(raw));
    } catch {
      return [];
    }
  };

  const fetchServerWishlist = useCallback(async () => {
    const response = await axios.get(`${API_URL}/wishlist`, {
      withCredentials: true
    });
    const ids = uniqIds((response.data || []).map((item) => item.id || item.product_id));
    setWishlistIds(ids);
    return ids;
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    if (!customerToken) {
      const ids = loadGuestWishlist();
      if (mounted) setWishlistIds(ids);
      if (mounted) setLoading(false);
      return () => { mounted = false; };
    }

    const sync = async () => {
      try {
        const guestIds = loadGuestWishlist();
        if (guestIds.length) {
          await Promise.all(
            guestIds.map((productId) => axios.post(
              `${API_URL}/wishlist`,
              { product_id: productId },
              { withCredentials: true }
            ))
          );
          localStorage.removeItem(GUEST_WISHLIST_KEY);
        }
        if (mounted) await fetchServerWishlist();
      } catch {
        if (mounted) setWishlistIds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    sync();
    return () => { mounted = false; };
  }, [customerToken, fetchServerWishlist]);

  const isWishlisted = useCallback((productId) => wishlistIds.includes(Number(productId)), [wishlistIds]);

  const addToWishlist = useCallback(async (productId) => {
    const nextId = Number(productId);
    if (!nextId) return false;
    if (wishlistIds.includes(nextId)) return true;
    const previous = wishlistIds;
    const optimistic = uniqIds([...wishlistIds, nextId]);
    setWishlistIds(optimistic);
    if (!customerToken) {
      persistGuestWishlist(optimistic);
      return true;
    }
    try {
      await axios.post(`${API_URL}/wishlist`, { product_id: nextId }, { withCredentials: true });
      return true;
    } catch {
      setWishlistIds(previous);
      return false;
    }
  }, [wishlistIds, customerToken]);

  const removeFromWishlist = useCallback(async (productId) => {
    const nextId = Number(productId);
    if (!nextId) return false;
    const previous = wishlistIds;
    const optimistic = wishlistIds.filter((id) => id !== nextId);
    setWishlistIds(optimistic);
    if (!customerToken) {
      persistGuestWishlist(optimistic);
      return true;
    }
    try {
      await axios.delete(`${API_URL}/wishlist/${nextId}`, { withCredentials: true });
      return true;
    } catch {
      setWishlistIds(previous);
      return false;
    }
  }, [wishlistIds, customerToken]);

  const toggleWishlist = useCallback(async (productId) => {
    if (isWishlisted(productId)) return removeFromWishlist(productId);
    return addToWishlist(productId);
  }, [isWishlisted, removeFromWishlist, addToWishlist]);

  const value = useMemo(() => ({
    wishlistIds,
    loading,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist
  }), [wishlistIds, loading, isWishlisted, addToWishlist, removeFromWishlist, toggleWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlistContext must be used within WishlistProvider');
  return context;
};
