import React from 'react';
import { AdminActivity } from './pages/AdminActivity';
import { AdminCategories } from './pages/AdminCategories';
import { AdminCoupons } from './pages/AdminCoupons';
import { AdminCustomers } from './pages/AdminCustomers';
import { AdminOrders } from './pages/AdminOrders';
import { AdminUsers } from './pages/AdminUsers';
import AdminPagesPanel from './pages/AdminPagesPanel';
import AdminProductsPanel from './products/AdminProductsPanel';
import AdminSettingsPanel from './settings/AdminSettingsPanel';
import { MediaPicker, TRANSLATIONS } from './shared/adminShared';

export { default as AdminAnalytics } from './pages/DashboardPage';
export { AdminPOS } from './pos/AdminPOS';
export { MediaPicker };
export { AdminActivity, AdminCategories, AdminCoupons, AdminCustomers, AdminOrders, AdminUsers };

export const AdminProducts = ({ lang = 'ar' }) => (
  <AdminProductsPanel lang={lang} t={TRANSLATIONS[lang] || TRANSLATIONS.en} MediaPicker={MediaPicker} />
);

export const AdminPageBuilder = ({ lang = 'ar' }) => (
  <AdminPagesPanel lang={lang} t={TRANSLATIONS[lang] || TRANSLATIONS.en} MediaPicker={MediaPicker} />
);

export const AdminSettings = ({ lang = 'ar' }) => (
  <AdminSettingsPanel lang={lang} t={TRANSLATIONS[lang] || TRANSLATIONS.en} MediaPicker={MediaPicker} />
);

