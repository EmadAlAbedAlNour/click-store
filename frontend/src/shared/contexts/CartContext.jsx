import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const toSafeNumber = useCallback((value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }, []);

  const addItem = useCallback((product, variant = null, qty = 1, pricing = null) => {
    const itemKey = variant ? `${product.id}-${variant.id}` : `${product.id}`;
    const stock = variant ? Number(variant.stock_quantity || 0) : Number(product.stock_quantity || 0);
    const regularPrice = variant ? toSafeNumber(variant.price) : toSafeNumber(product.base_price);
    const requestedPrice = toSafeNumber(pricing?.priceOverride, Number.NaN);
    const finalPrice = Number.isFinite(requestedPrice) && requestedPrice >= 0 ? requestedPrice : regularPrice;
    const requestedCompareAt = toSafeNumber(pricing?.compareAtPrice, Number.NaN);
    const compareAtPrice = Number.isFinite(requestedCompareAt) && requestedCompareAt > finalPrice
      ? requestedCompareAt
      : null;

    let isAdded = false;
    setCart((prev) => {
      const existing = prev.find((i) => i.itemKey === itemKey);
      if (stock < qty) return prev;
      if (existing) {
        if (existing.quantity + qty > stock) return prev;
        isAdded = true;
        return prev.map((i) => (
          i.itemKey === itemKey
            ? {
                ...i,
                quantity: i.quantity + qty,
                price: finalPrice,
                compare_at_price: compareAtPrice,
                pricing_source: pricing?.source || null
              }
            : i
        ));
      }
      isAdded = true;
      return [
        ...prev,
        {
          id: product.id,
          variant_id: variant?.id,
          itemKey,
          name: variant ? `${product.name} (${variant.name})` : product.name,
          price: finalPrice,
          compare_at_price: compareAtPrice,
          pricing_source: pricing?.source || null,
          quantity: qty,
          image_url: product.image_url
        }
      ];
    });

    return isAdded ? { ok: true } : { ok: false, reason: 'out_of_stock' };
  }, [toSafeNumber]);

  const removeItem = useCallback((itemKey) => {
    setCart((prev) => prev.filter((item) => item.itemKey !== itemKey));
  }, []);

  const updateItemQuantity = useCallback((itemKey, newQty) => {
    setCart((prev) => prev.map((item) => (
      item.itemKey === itemKey ? { ...item, quantity: Math.max(1, Number(newQty || 1)) } : item
    )));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo(() => ({
    cart,
    setCart,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart
  }), [cart, addItem, removeItem, updateItemQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartContext must be used within CartProvider');
  return context;
};
