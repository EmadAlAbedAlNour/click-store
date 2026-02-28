import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { StoreLayout } from '../features/storefront/layout/StorefrontLayout';
import {
  AccountPage,
  CartPage,
  DynamicPage,
  ProductDetailsPage,
  ShopPage,
  WishlistPage
} from '../features/storefront/pages/StorefrontPages';
import { PUBLIC_TEXTS } from '../features/storefront/i18n/publicTexts';
import { MaintenanceGate, ScrollToTop } from '../features/system/SystemRoutes';
import { applyTheme, resolveSpecialOfferPricing } from '../features/storefront/utils/storefrontUtils';
import { useAuthContext } from '../shared/contexts/AuthContext';
import { useCartContext } from '../shared/contexts/CartContext';
import { useSettingsContext } from '../shared/contexts/SettingsContext';
import { useToastNotifications } from '../shared/contexts/ToastContext';
import { useWishlistContext } from '../shared/contexts/WishlistContext';
import { useTheme } from '../shared/hooks/useTheme';

const DashboardPage = lazy(() => import('../features/admin/pages/DashboardPage'));
const AdminRouteWrapper = lazy(() =>
  import('../features/admin/layout/AdminShell').then((module) => ({ default: module.AdminRouteWrapper }))
);
const AdminPOS = lazy(() =>
  import('../features/admin/pos/AdminPOS').then((module) => ({ default: module.AdminPOS }))
);
const AdminActivity = lazy(() =>
  import('../features/admin/pages/AdminActivity').then((module) => ({ default: module.AdminActivity }))
);
const AdminCategories = lazy(() =>
  import('../features/admin/pages/AdminCategories').then((module) => ({ default: module.AdminCategories }))
);
const AdminCoupons = lazy(() =>
  import('../features/admin/pages/AdminCoupons').then((module) => ({ default: module.AdminCoupons }))
);
const AdminCustomers = lazy(() =>
  import('../features/admin/pages/AdminCustomers').then((module) => ({ default: module.AdminCustomers }))
);
const AdminOrders = lazy(() =>
  import('../features/admin/pages/AdminOrders').then((module) => ({ default: module.AdminOrders }))
);
const AdminUsers = lazy(() =>
  import('../features/admin/pages/AdminUsers').then((module) => ({ default: module.AdminUsers }))
);
const AdminProducts = lazy(() =>
  import('../features/admin/AdminComponents').then((module) => ({ default: module.AdminProducts }))
);
const AdminPageBuilder = lazy(() =>
  import('../features/admin/AdminComponents').then((module) => ({ default: module.AdminPageBuilder }))
);
const AdminSettings = lazy(() =>
  import('../features/admin/AdminComponents').then((module) => ({ default: module.AdminSettings }))
);

const AdminLoadingFallback = ({ lang }) => (
  <div className="h-screen flex items-center justify-center">
    {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
  </div>
);

const App = () => {
  const {
    token,
    user,
    customerToken,
    customer,
    loginAdmin,
    logoutAdmin,
    loginCustomer,
    logoutCustomer
  } = useAuthContext();
  const { settings } = useSettingsContext();
  const { cart, setCart, addItem, removeItem, updateItemQuantity } = useCartContext();
  const { wishlistIds, toggleWishlist } = useWishlistContext();
  const { pushToast } = useToastNotifications();

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar');
  const defaultTheme = Number(settings?.dark_mode_default) === 1 ? 'dark' : 'light';
  const { theme, toggleTheme } = useTheme({ initialTheme: defaultTheme });

  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) return;
    const storedLang = localStorage.getItem('lang');
    if (!storedLang && settings?.default_language) {
      setLang(settings.default_language);
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    applyTheme(settings, lang);
  }, [lang, settings]);

  const addToCart = (product, variant = null, qty = 1) => {
    const offerPricing = resolveSpecialOfferPricing({ settings, product, variant });
    const pricingPayload = offerPricing.isActive
      ? {
          priceOverride: offerPricing.finalPrice,
          compareAtPrice: offerPricing.regularPrice,
          source: 'special_offer'
        }
      : null;

    const result = addItem(product, variant, qty, pricingPayload);
    if (!result.ok) {
      pushToast(PUBLIC_TEXTS[lang].outOfStock, 'error');
      return;
    }
    pushToast(PUBLIC_TEXTS[lang].addedToCart, 'success');
  };

  const removeFromCart = (itemKey) => {
    removeItem(itemKey);
  };

  const updateQuantity = (itemKey, newQty) => {
    updateItemQuantity(itemKey, newQty);
  };

  const toggleWishlistForProduct = async (productId) => {
    const isWishlisted = wishlistIds.includes(Number(productId));
    const ok = await toggleWishlist(productId);
    if (!ok) {
      pushToast(lang === 'ar' ? 'تعذر تحديث المفضلة' : 'Unable to update wishlist', 'error');
      return;
    }
    pushToast(
      isWishlisted ? PUBLIC_TEXTS[lang].removedFromWishlist : PUBLIC_TEXTS[lang].addedToWishlist,
      'info'
    );
  };

  const storeLayoutProps = useMemo(
    () => ({
      cartCount: cart.length,
      wishlistCount: wishlistIds.length,
      settings,
      lang,
      setLang,
      theme,
      onToggleTheme: toggleTheme,
      customer,
      onCustomerLogout: logoutCustomer
    }),
    [cart.length, wishlistIds.length, settings, lang, theme, toggleTheme, customer, logoutCustomer]
  );

  const withStoreLayout = (content) => <StoreLayout {...storeLayoutProps}>{content}</StoreLayout>;

  return (
    <div className={`app-root ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`}>
      <ScrollToTop />
      <MaintenanceGate settings={settings} lang={lang}>
        <Routes>
          <Route
            path="/"
            element={withStoreLayout(
              <DynamicPage
                addToCart={addToCart}
                lang={lang}
                settings={settings}
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlistForProduct}
              />
            )}
          />
          <Route path="/shop" element={withStoreLayout(<ShopPage addToCart={addToCart} lang={lang} settings={settings} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlistForProduct} />)} />
          <Route path="/wishlist" element={withStoreLayout(<WishlistPage lang={lang} settings={settings} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlistForProduct} addToCart={addToCart} />)} />
          <Route path="/cart" element={withStoreLayout(<CartPage cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} settings={settings} customer={customer} setCart={setCart} lang={lang} />)} />
          <Route path="/product/:id" element={withStoreLayout(<ProductDetailsPage addToCart={addToCart} lang={lang} settings={settings} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlistForProduct} />)} />
          <Route path="/account" element={withStoreLayout(<AccountPage customer={customer} customerToken={customerToken} onLogin={loginCustomer} onLogout={logoutCustomer} lang={lang} />)} />
          <Route path="/auth/login" element={<Navigate to="/admin" replace />} />

          <Route
            path="/admin"
            element={(
              <Suspense fallback={<AdminLoadingFallback lang={lang} />}>
                <AdminRouteWrapper
                  token={token}
                  user={user}
                  onLogin={loginAdmin}
                  onLogout={logoutAdmin}
                  lang={lang}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                />
              </Suspense>
            )}
          >
            <Route index element={<DashboardPage lang={lang} />} />
            <Route path="analytics" element={<DashboardPage lang={lang} />} />
            <Route path="activity" element={<AdminActivity lang={lang} />} />
            <Route path="logs" element={<AdminActivity lang={lang} />} />
            <Route path="pos" element={<AdminPOS lang={lang} />} />
            <Route path="products" element={<AdminProducts lang={lang} />} />
            <Route path="categories" element={<AdminCategories lang={lang} />} />
            <Route path="coupons" element={<AdminCoupons lang={lang} />} />
            <Route path="pages" element={<AdminPageBuilder lang={lang} />} />
            <Route path="orders" element={<AdminOrders lang={lang} />} />
            <Route path="customers" element={<AdminCustomers lang={lang} />} />
            <Route path="users" element={<AdminUsers lang={lang} />} />
            <Route path="settings" element={<AdminSettings lang={lang} />} />
          </Route>

          <Route
            path="/:slug"
            element={withStoreLayout(
              <DynamicPage
                addToCart={addToCart}
                lang={lang}
                settings={settings}
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlistForProduct}
              />
            )}
          />
        </Routes>
      </MaintenanceGate>
    </div>
  );
};

export default App;
