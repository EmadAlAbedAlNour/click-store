import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PUBLIC_TEXTS } from '../storefront/i18n/publicTexts';

const MaintenancePage = ({ settings, lang }) => {
  const t = PUBLIC_TEXTS[lang];
  const message = settings.maintenance_message || (lang === 'ar' ? 'الموقع تحت الصيانة حالياً. الرجاء المحاولة لاحقاً.' : 'The site is under maintenance. Please check back soon.');
  return (
    <main className="min-h-screen flex items-center justify-center text-center px-4 sm:px-6" aria-labelledby="maintenance-title">
      <section className="max-w-xl">
        <h1 id="maintenance-title" className="text-4xl font-black text-primary mb-4">{settings.site_name || 'Store'}</h1>
        <p className="text-secondary text-lg mb-6">{message}</p>
        <p className="text-muted text-sm">{t.contactInfo}: {settings.contact_email || ''} {settings.contact_phone || ''}</p>
      </section>
    </main>
  );
};

export const MaintenanceGate = ({ settings, lang, children }) => {
  const location = useLocation();
  if (settings?.maintenance_mode && !location.pathname.startsWith('/admin')) {
    return <MaintenancePage settings={settings} lang={lang} />;
  }
  return children;
};

export const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  return null;
};
