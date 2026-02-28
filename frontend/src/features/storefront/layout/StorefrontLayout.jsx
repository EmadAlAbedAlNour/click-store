import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Box,
  Facebook,
  Globe,
  Heart,
  Home as HomeIcon,
  Instagram,
  Linkedin,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Youtube
} from 'lucide-react';
import ThemeToggle from '../../../shared/components/ThemeToggle';
import { API_URL } from '../../../app/config';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useFetch } from '../../../shared/hooks/useFetch';
import { PUBLIC_TEXTS } from '../i18n/publicTexts';

const XBrandIcon = ({ size = 18, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Navbar = ({ cartCount, wishlistCount, settings, lang, setLang, theme, onToggleTheme, customer, onCustomerLogout, onOpenSearch }) => {
  const t = PUBLIC_TEXTS[lang];
  const isArabic = lang === 'ar';
  const location = useLocation();
  const isAdminPath = location.pathname.includes('/admin');
  const [isUtilityOpen, setUtilityOpen] = useState(false);
  const utilityMenuRef = useRef(null);
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const showLangToggle = Number(settings.show_language_toggle) !== 0;
  const showDarkToggle = Number(settings.enable_dark_mode) !== 0;
  const showAdminLink = Number(settings.show_admin_link) !== 0;
  const showCartButton = Number(settings.show_cart_button) !== 0;
  const showSearchButton = Number(settings.show_search_button) !== 0;
  const showWishlistButton = Number(settings.show_wishlist_button) !== 0;
  const showAccountButton = Number(settings.show_account_button) !== 0;
  const pinSearchButton = Number(settings?.nav_pin_search_button ?? 1) === 1;
  const pinWishlistButton = Number(settings?.nav_pin_wishlist_button ?? 1) === 1;
  const pinAccountButton = Number(settings?.nav_pin_account_button ?? 1) === 1;
  const pinCartButton = Number(settings?.nav_pin_cart_button ?? 1) === 1;
  const pinLanguageToggle = Number(settings?.nav_pin_language_toggle ?? 0) === 1;
  const pinThemeToggle = Number(settings?.nav_pin_theme_toggle ?? 0) === 1;
  const pinAdminLink = Number(settings?.nav_pin_admin_link ?? 0) === 1;
  const showAnnouncement = Number(settings.announcement_enabled) !== 0 && !!settings.announcement_text;
  const canShowStoreActions = !isAdminPath;

  const showSearchInDropdownDesktop = canShowStoreActions && showSearchButton && !pinSearchButton;
  const showWishlistInDropdownDesktop = canShowStoreActions && showWishlistButton && !pinWishlistButton;
  const showAccountInDropdownDesktop = canShowStoreActions && showAccountButton && !pinAccountButton;
  const showCartInDropdownDesktop = showCartButton && !pinCartButton;
  const showLangInDropdownDesktop = showLangToggle && !pinLanguageToggle;
  const showThemeInDropdownDesktop = showDarkToggle && !pinThemeToggle;
  const showAdminInDropdownDesktop = canShowStoreActions && showAdminLink && !pinAdminLink;
  const hasUtilityDesktopItems = (
    showSearchInDropdownDesktop
    || showWishlistInDropdownDesktop
    || showAccountInDropdownDesktop
    || showCartInDropdownDesktop
    || showLangInDropdownDesktop
    || showThemeInDropdownDesktop
    || showAdminInDropdownDesktop
    || Boolean(customer)
  );

  // Fallback entries for compact layouts where pinned top actions are hidden by CSS.
  const showSearchInDropdownCompact = canShowStoreActions && showSearchButton && pinSearchButton;
  const showWishlistInDropdownCompact = canShowStoreActions && showWishlistButton && pinWishlistButton;
  const showAccountInDropdownCompact = canShowStoreActions && showAccountButton && pinAccountButton;
  const showCartInDropdownCompact = showCartButton && pinCartButton;
  const showLangInDropdownCompact = showLangToggle && pinLanguageToggle;
  const showThemeInDropdownCompact = showDarkToggle && pinThemeToggle;
  const showAdminInDropdownCompact = canShowStoreActions && showAdminLink && pinAdminLink;
  const hasUtilityCompactItems = (
    showSearchInDropdownCompact
    || showWishlistInDropdownCompact
    || showAccountInDropdownCompact
    || showCartInDropdownCompact
    || showLangInDropdownCompact
    || showThemeInDropdownCompact
    || showAdminInDropdownCompact
    || Boolean(customer)
  );

  const showUtilityMenu = hasUtilityDesktopItems || hasUtilityCompactItems;
  const utilityVisibilityClass = hasUtilityDesktopItems ? '' : 'lg:hidden';
  const navItems = ['home', 'shop', 'about', 'contact'];
  const mobileTopNavItems = [
    { key: 'home', to: '/', label: isArabic ? 'الرئيسية' : 'Home' },
    { key: 'shop', to: '/shop', label: isArabic ? 'المتجر' : 'Shop' },
    { key: 'about', to: '/about', label: isArabic ? 'من نحن' : 'About' },
    { key: 'contact', to: '/contact', label: isArabic ? 'تواصل' : 'Contact' }
  ];
  const mobileNavItems = [
    { to: '/', label: t.home, icon: HomeIcon },
    { to: '/shop', label: t.shop, icon: Box },
    ...(showWishlistButton ? [{ to: '/wishlist', label: t.wishlist, icon: Heart, badge: wishlistCount > 0 ? wishlistCount : null }] : []),
    ...(showCartButton ? [{ to: '/cart', label: t.cart, icon: ShoppingBag, badge: cartCount > 0 ? cartCount : null }] : []),
    ...(showAccountButton ? [{ to: '/account', label: customer ? t.account : t.customerLogin, icon: Users }] : [])
  ];

  useEffect(() => {
    setUtilityOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isUtilityOpen) return undefined;
    const handleClickOutside = (event) => {
      if (!utilityMenuRef.current) return;
      if (!utilityMenuRef.current.contains(event.target)) {
        setUtilityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUtilityOpen]);

  return (
    <header className="sticky top-0 z-50 px-2 sm:px-4 pt-2 sm:pt-3">
      {showAnnouncement && (
        <div className="container mx-auto max-w-7xl mb-2 sm:mb-3">
          <div
            className="rounded-2xl bg-primary text-white text-center text-xs sm:text-sm py-2.5 font-bold tracking-wide shadow-lg shadow-primary/20"
            role="status"
            aria-live="polite"
          >
            {settings.announcement_text}
          </div>
        </div>
      )}

      <nav className="nav-shell transition-all duration-300" aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
        <div className="container mx-auto px-3 sm:px-6 max-w-7xl">
          <div className="h-[74px] sm:h-[86px] flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="nav-brand-mark">
              {settings.invoice_logo ? (
                <img src={settings.invoice_logo} alt="Site Logo" className="w-8 h-8 object-contain" />
              ) : (
                <Box size={26} strokeWidth={2.5} />
              )}
            </div>
            <div className="hidden sm:block">
              <span className="block text-lg sm:text-xl font-black text-primary tracking-tight group-hover:text-accent transition-colors">
                {settings.site_name || 'TechStore'}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                {settings.site_tagline || (lang === 'ar' ? 'متجر ذكي متكامل' : 'Modern Commerce')}
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-2xl border border-subtle bg-card p-1.5 shadow-soft">
            {navItems.map((link) => {
              const href = link === 'home' ? '/' : `/${link}`;
              const active = location.pathname === href;
              return (
                <Link
                  key={link}
                  to={href}
                  className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all ${active ? 'text-accent bg-card shadow-soft' : 'text-secondary hover:text-accent hover:bg-card-soft'}`}
                >
                  {t[link]}
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all ${active ? 'w-8' : 'w-0'}`}></span>
                </Link>
              );
            })}
          </div>

          <div className="md:hidden flex-1 min-w-0">
            <div className="grid grid-cols-4 gap-1 rounded-2xl border border-subtle bg-card p-1 shadow-soft">
              {mobileTopNavItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={`top-${item.key}`}
                    to={item.to}
                    className={`relative min-w-0 inline-flex items-center justify-center px-1.5 py-2 rounded-xl text-[11px] font-bold transition-all ${active ? 'text-accent bg-card shadow-soft' : 'text-secondary hover:text-accent hover:bg-card-soft'}`}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all ${active ? 'w-5' : 'w-0'}`}></span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {canShowStoreActions && showSearchButton && pinSearchButton && (
              <button
                type="button"
                onClick={() => onOpenSearch?.()}
                className="nav-primary-action"
                title={`${t.openSearch} (Ctrl/Cmd + K)`}
              >
                <Search size={18} />
                <span className="hidden xl:inline">{t.openSearch}</span>
              </button>
            )}

            {canShowStoreActions && showWishlistButton && pinWishlistButton && (
              <Link to="/wishlist" className="relative nav-primary-action" title={t.wishlist}>
                <Heart size={18} />
                <span className="hidden xl:inline">{t.wishlist}</span>
                {wishlistCount > 0 && (
                  <span className={`absolute -top-1 ${isArabic ? '-left-1' : '-right-1'} w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center`}>
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {canShowStoreActions && showAccountButton && pinAccountButton && (
              <Link to="/account" className="nav-primary-action" title={customer ? t.account : t.customerLogin}>
                <Users size={18} />
                <span className="hidden xl:inline">{customer ? t.account : t.customerLogin}</span>
              </Link>
            )}

            {showCartButton && pinCartButton && (
              <Link to="/cart" className="relative group hidden sm:block" title={t.cart}>
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white bg-accent-primary shadow-soft transition-transform group-hover:-translate-y-0.5">
                  <ShoppingBag size={21} />
                  {cartCount > 0 && (
                    <span className={`absolute -top-1 ${isArabic ? '-left-1' : '-right-1'} bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse`}>
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {showLangToggle && pinLanguageToggle && (
              <button type="button" onClick={toggleLang} className="nav-primary-action" title={lang === 'ar' ? 'English' : 'العربية'}>
                <Globe size={18} />
                <span className="hidden xl:inline">{lang === 'ar' ? 'EN' : 'AR'}</span>
              </button>
            )}

            {showDarkToggle && pinThemeToggle && (
              <ThemeToggle
                theme={theme}
                onToggle={onToggleTheme}
                lang={lang}
                className="nav-primary-action"
                iconSize={18}
                showLabel={false}
              />
            )}

            {canShowStoreActions && showAdminLink && pinAdminLink && (
              <Link to="/admin" className="nav-primary-action" title={t.admin}>
                <Settings size={18} />
                <span className="hidden xl:inline">{t.admin}</span>
              </Link>
            )}

            {showUtilityMenu && (
            <div className={`relative ${utilityVisibilityClass}`} ref={utilityMenuRef}>
              <button
                type="button"
                onClick={() => setUtilityOpen((prev) => !prev)}
                className="ui-btn ui-btn-secondary ui-btn-sm px-3 text-xs"
                title={t.more}
                aria-expanded={isUtilityOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal size={16} />
                <span className="hidden xl:inline">{t.more}</span>
              </button>

              <AnimatePresence>
                {isUtilityOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute ${utilityVisibilityClass} ${lang === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 min-w-[220px] rounded-2xl border border-subtle bg-card backdrop-blur-xl shadow-lift p-2 z-[90]`}
                    role="menu"
                    aria-label={lang === 'ar' ? 'قائمة المزيد' : 'More menu'}
                  >
                    {canShowStoreActions && (
                      <>
                        {showSearchInDropdownDesktop && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenSearch?.();
                              setUtilityOpen(false);
                            }}
                            className="nav-utility-item"
                          >
                            <Search size={16} />
                            <span>{t.openSearch}</span>
                          </button>
                        )}
                        {showSearchInDropdownCompact && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenSearch?.();
                              setUtilityOpen(false);
                            }}
                            className="nav-utility-item lg:hidden"
                          >
                            <Search size={16} />
                            <span>{t.openSearch}</span>
                          </button>
                        )}
                        {showWishlistInDropdownDesktop && (
                          <Link to="/wishlist" onClick={() => setUtilityOpen(false)} className="nav-utility-item">
                            <Heart size={16} />
                            <span>{t.wishlist}</span>
                            {wishlistCount > 0 ? (
                              <span className="ms-auto rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{wishlistCount}</span>
                            ) : null}
                          </Link>
                        )}
                        {showWishlistInDropdownCompact && (
                          <Link to="/wishlist" onClick={() => setUtilityOpen(false)} className="nav-utility-item lg:hidden">
                            <Heart size={16} />
                            <span>{t.wishlist}</span>
                            {wishlistCount > 0 ? (
                              <span className="ms-auto rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{wishlistCount}</span>
                            ) : null}
                          </Link>
                        )}
                        {showAccountInDropdownDesktop && (
                          <Link to="/account" onClick={() => setUtilityOpen(false)} className="nav-utility-item">
                            <Users size={16} />
                            <span>{customer ? t.account : t.customerLogin}</span>
                          </Link>
                        )}
                        {showAccountInDropdownCompact && (
                          <Link to="/account" onClick={() => setUtilityOpen(false)} className="nav-utility-item lg:hidden">
                            <Users size={16} />
                            <span>{customer ? t.account : t.customerLogin}</span>
                          </Link>
                        )}
                        {showCartInDropdownDesktop && (
                          <Link to="/cart" onClick={() => setUtilityOpen(false)} className="nav-utility-item">
                            <ShoppingBag size={16} />
                            <span>{t.cart}</span>
                            {cartCount > 0 ? (
                              <span className="ms-auto rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{cartCount}</span>
                            ) : null}
                          </Link>
                        )}
                        {showCartInDropdownCompact && (
                          <Link to="/cart" onClick={() => setUtilityOpen(false)} className="nav-utility-item sm:hidden">
                            <ShoppingBag size={16} />
                            <span>{t.cart}</span>
                            {cartCount > 0 ? (
                              <span className="ms-auto rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{cartCount}</span>
                            ) : null}
                          </Link>
                        )}
                      </>
                    )}

                    {showLangInDropdownDesktop && (
                      <button type="button" onClick={() => { toggleLang(); setUtilityOpen(false); }} className="nav-utility-item">
                        <Globe size={16} />
                        <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
                      </button>
                    )}
                    {showLangInDropdownCompact && (
                      <button type="button" onClick={() => { toggleLang(); setUtilityOpen(false); }} className="nav-utility-item lg:hidden">
                        <Globe size={16} />
                        <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
                      </button>
                    )}

                    {showThemeInDropdownDesktop && (
                      <ThemeToggle
                        theme={theme}
                        onToggle={() => {
                          onToggleTheme?.();
                          setUtilityOpen(false);
                        }}
                        lang={lang}
                        className="nav-utility-item w-full"
                        iconSize={16}
                      />
                    )}
                    {showThemeInDropdownCompact && (
                      <ThemeToggle
                        theme={theme}
                        onToggle={() => {
                          onToggleTheme?.();
                          setUtilityOpen(false);
                        }}
                        lang={lang}
                        className="nav-utility-item w-full lg:hidden"
                        iconSize={16}
                      />
                    )}

                    {showAdminInDropdownDesktop && (
                      <Link to="/admin" onClick={() => setUtilityOpen(false)} className="nav-utility-item">
                        <Settings size={16} />
                        <span>{t.admin}</span>
                      </Link>
                    )}
                    {showAdminInDropdownCompact && (
                      <Link to="/admin" onClick={() => setUtilityOpen(false)} className="nav-utility-item lg:hidden">
                        <Settings size={16} />
                        <span>{t.admin}</span>
                      </Link>
                    )}

                    {customer && (
                      <button
                        type="button"
                        onClick={() => {
                          onCustomerLogout?.();
                          setUtilityOpen(false);
                        }}
                        className="nav-utility-item text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        <span>{t.logout}</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}
          </div>
          </div>
        </div>
      </nav>

      {!isAdminPath && (
        <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(96%,420px)]" aria-label={lang === 'ar' ? 'التنقل السفلي' : 'Bottom navigation'}>
          <div className="nav-shell rounded-2xl px-2 py-2 flex items-center justify-between">
            {mobileNavItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${active ? 'bg-primary text-white shadow-soft' : 'text-secondary hover:bg-card-soft'}`}
                >
                  <div className="relative">
                    <Icon size={18} />
                    {item.badge ? (
                      <span className={`absolute -top-2 ${isArabic ? '-left-2' : '-right-2'} w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-bold truncate max-w-[72px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};

const Footer = ({ settings, lang }) => {
  const t = PUBLIC_TEXTS[lang];
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;
  const footerLinkShiftClass = lang === 'ar' ? 'hover:-translate-x-2' : 'hover:translate-x-2';
  const footerPhone = String(settings?.contact_phone || '').trim();
  const footerPhoneHref = footerPhone ? `tel:${footerPhone.replace(/[^\d+]/g, '')}` : '';
  const footerEmail = String(settings?.contact_email || '').trim();
  const footerEmailHref = footerEmail ? `mailto:${footerEmail}` : '';

  if (Number(settings.show_footer) === 0) return null;

  return (
    <footer className="bg-card border-t border-subtle pt-24 pb-12 mt-auto relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
          
          {/* Brand & Social */}
          <div className="space-y-6 md:col-span-2 lg:col-span-1 lg:order-1">
            <h3 className="text-3xl font-black tracking-tight text-primary">{settings.site_name || 'TechStore'}</h3>
            <p className="text-secondary leading-relaxed text-lg max-w-xs">
              {settings.site_description || (lang === 'ar' ? 'متجر تقني حديث يوفر أفضل المنتجات والخدمات.' : 'A modern tech store with the best products and services.')}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="lg:order-2">
            <h4 className="text-lg font-bold mb-8 text-primary flex items-center gap-2">
              <ArrowIcon className="text-primary" size={20}/> {t.quickLinks}
            </h4>
            <ul className="space-y-4 text-secondary">
              <li><Link to="/shop" className={`hover:text-primary transition-all inline-flex items-center gap-2 ${footerLinkShiftClass}`}><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {t.shop}</Link></li>
              <li><Link to="/about" className={`hover:text-primary transition-all inline-flex items-center gap-2 ${footerLinkShiftClass}`}><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {t.about}</Link></li>
              <li><Link to="/contact" className={`hover:text-primary transition-all inline-flex items-center gap-2 ${footerLinkShiftClass}`}><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {t.contact}</Link></li>
              <li><Link to="/cart" className={`hover:text-primary transition-all inline-flex items-center gap-2 ${footerLinkShiftClass}`}><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {t.cart}</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          {Number(settings.show_contact_info) !== 0 && (
          <div className="lg:order-3">
            <h4 className="text-lg font-bold mb-8 text-primary flex items-center gap-2">
              <ArrowIcon className="text-primary" size={20}/> {t.contactInfo}
            </h4>
            <ul className="space-y-6 text-secondary">
              {footerPhone && (
                <li>
                  <a
                    href={footerPhoneHref}
                    className="flex items-center gap-4 bg-card-soft p-4 rounded-2xl border border-subtle hover:border-primary/50 hover:bg-card transition-colors group"
                    title={lang === 'ar' ? 'اتصل بنا' : 'Call us'}
                  >
                    <Phone size={24} className="text-primary group-hover:scale-110 transition-transform"/>
                    <span dir="ltr" className="font-mono text-lg">{footerPhone}</span>
                  </a>
                </li>
              )}
              {footerEmail && (
                <li>
                  <a
                    href={footerEmailHref}
                    className="flex items-center gap-4 bg-card-soft p-4 rounded-2xl border border-subtle hover:border-primary/50 hover:bg-card transition-colors group"
                    title={lang === 'ar' ? 'راسلنا عبر البريد' : 'Email us'}
                  >
                    <Mail size={24} className="text-primary group-hover:scale-110 transition-transform"/>
                    <span className="text-sm break-all">{footerEmail}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
          )}

          {Number(settings.show_social_links) !== 0 && (
            <div className="lg:order-4">
              <h4 className="text-lg font-bold mb-8 text-primary flex items-center gap-2">
                <ArrowIcon className="text-primary" size={20}/> {lang === 'ar' ? 'روابط التواصل' : 'Social Links'}
              </h4>
              <div className="flex flex-wrap gap-3">
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noreferrer"
                    className="w-11 h-11 flex items-center justify-center bg-card-soft rounded-xl transition-all border border-subtle hover:scale-105 hover:bg-[#1877F2] hover:text-white">
                    <Facebook size={18}/>
                  </a>
                )}
                {settings.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noreferrer"
                    className="w-11 h-11 flex items-center justify-center bg-card-soft rounded-xl transition-all border border-subtle hover:scale-105 hover:bg-[#E4405F] hover:text-white">
                    <Instagram size={18}/>
                  </a>
                )}
                {settings.social_twitter && (
                  <a href={settings.social_twitter} target="_blank" rel="noreferrer"
                    className="w-11 h-11 flex items-center justify-center bg-card-soft rounded-xl transition-all border border-subtle hover:scale-105 hover:bg-[#111827] hover:text-white">
                    <XBrandIcon size={18} />
                  </a>
                )}
                {settings.social_youtube && (
                  <a href={settings.social_youtube} target="_blank" rel="noreferrer"
                    className="w-11 h-11 flex items-center justify-center bg-card-soft rounded-xl transition-all border border-subtle hover:scale-105 hover:bg-[#FF0000] hover:text-white">
                    <Youtube size={18}/>
                  </a>
                )}
                {settings.social_linkedin && (
                  <a href={settings.social_linkedin} target="_blank" rel="noreferrer"
                    className="w-11 h-11 flex items-center justify-center bg-card-soft rounded-xl transition-all border border-subtle hover:scale-105 hover:bg-[#0A66C2] hover:text-white">
                    <Linkedin size={18}/>
                  </a>
                )}
                {settings.social_whatsapp && (
                  <a href={settings.social_whatsapp} target="_blank" rel="noreferrer"
                    className="w-11 h-11 flex items-center justify-center bg-card-soft rounded-xl transition-all border border-subtle hover:scale-105 hover:bg-[#25D366] hover:text-white">
                    <MessageCircle size={18}/>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-subtle pt-8 text-center text-muted text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>{settings.footer_text || t.footerRights} © {new Date().getFullYear()}</p>
          <div
            className="opacity-80 inline-flex h-10 w-12 items-center justify-center rounded-xl border border-primary/35 bg-card-soft text-[10px] font-black tracking-[0.12em] text-primary"
            title={lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
            aria-label={lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
          >
            <Banknote size={18} aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
};

const GlobalCommandSearch = ({ lang, isOpen, setIsOpen, enabled = true }) => {
  const t = PUBLIC_TEXTS[lang];
  const navigate = useNavigate();
  const location = useLocation();
  const categoriesRequest = useMemo(() => ({
    method: 'get',
    url: `${API_URL}/categories`
  }), []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], categories: [] });
  const { data: categoriesData, execute: fetchCategories } = useFetch(categoriesRequest, { immediate: false });
  const debouncedQuery = useDebounce(query, 260);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event) => {
      const isOpenShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isOpenShortcut) {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, setIsOpen]);

  useEffect(() => {
    if (!enabled && isOpen) setIsOpen(false);
  }, [enabled, isOpen, setIsOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCategories().catch(() => {});
    setQuery('');
    setResults({ products: [], categories: [] });
  }, [isOpen, fetchCategories]);

  useEffect(() => {
    if (!isOpen || !debouncedQuery.trim()) {
      setResults({ products: [], categories: [] });
      return;
    }
    let mounted = true;
    axios.get(`${API_URL}/products`, { params: { search: debouncedQuery, limit: 6, published: 1 } }).then((productsRes) => {
      if (!mounted) return;
      const products = productsRes.data?.data || [];
      const categories = (categoriesData || []).filter((cat) => (
        (cat.name || '').toLowerCase().includes(debouncedQuery.toLowerCase())
      )).slice(0, 4);
      setResults({ products, categories });
    }).catch(() => {
      if (!mounted) return;
      setResults({ products: [], categories: [] });
    });
    return () => { mounted = false; };
  }, [isOpen, debouncedQuery, categoriesData]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-shell z-[130] items-start p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="mx-auto mt-[10vh] max-w-2xl rounded-3xl border border-subtle bg-card backdrop-blur-xl shadow-lift overflow-hidden"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-subtle flex items-center gap-3">
                <Search size={18} className="text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchHint}
                  className="w-full bg-transparent outline-none text-primary placeholder:text-muted"
                />
              </div>
              <div className="max-h-[58vh] overflow-y-auto p-3 space-y-2">
                {!query.trim() && (
                  <div className="text-center text-sm text-muted p-8">{t.searchHint}</div>
                )}
                {query.trim() && results.products.length === 0 && results.categories.length === 0 && (
                  <div className="text-center text-sm text-muted p-8">{t.noResults}</div>
                )}

                {results.products.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted px-2 pb-1">{lang === 'ar' ? 'المنتجات' : 'Products'}</div>
                    {results.products.map((product) => (
                      <button
                        key={`search-product-${product.id}`}
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="w-full text-start p-3 rounded-2xl hover:bg-card-soft transition flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-card-soft overflow-hidden shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted"><Box size={16} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-primary truncate">{product.name}</div>
                          <div className="text-xs text-secondary">{product.category || '-'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.categories.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted px-2 pb-1">{lang === 'ar' ? 'الأقسام' : 'Categories'}</div>
                    <div className="flex flex-wrap gap-2 px-2 pb-2">
                      {results.categories.map((category) => (
                        <button
                          key={`search-category-${category.id}`}
                          onClick={() => navigate(`/shop?category=${encodeURIComponent(category.name)}`)}
                          className="px-3 py-1.5 rounded-full border border-subtle bg-card-soft text-sm font-semibold text-secondary hover:bg-primary hover:text-white hover:border-primary transition"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const StoreLayout = ({ children, cartCount, wishlistCount, settings, lang, setLang, theme, onToggleTheme, customer, onCustomerLogout }) => {
  const location = useLocation();
  const [isSearchOpen, setSearchOpen] = useState(false);
  const showSearchButton = Number(settings?.show_search_button) !== 0;
  const skipLinkPositionClass = lang === 'ar' ? 'focus:right-3' : 'focus:left-3';
  return (
    <div className={`store-shell ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`}>
      <a
        href="#store-main-content"
        className={`sr-only focus:not-sr-only focus:absolute focus:top-3 ${skipLinkPositionClass} focus:z-[120] focus:rounded-xl focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-primary focus:border focus:border-subtle`}
      >
        {lang === 'ar' ? 'تخطي إلى المحتوى' : 'Skip to content'}
      </a>
      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        settings={settings}
        lang={lang}
        setLang={setLang}
        theme={theme}
        onToggleTheme={onToggleTheme}
        customer={customer}
        onCustomerLogout={onCustomerLogout}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <GlobalCommandSearch lang={lang} isOpen={isSearchOpen} setIsOpen={setSearchOpen} enabled={showSearchButton} />
      <main id="store-main-content" className="store-main" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer settings={settings} lang={lang} />
    </div>
  );
};


