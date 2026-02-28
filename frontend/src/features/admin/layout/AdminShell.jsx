import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  DollarSign,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  TicketPercent,
  Users,
  X
} from 'lucide-react';
import ThemeToggle from '../../../shared/components/ThemeToggle';
import { API_URL } from '../../../app/config';
import { useToastNotifications } from '../../../shared/contexts/ToastContext';
import { PUBLIC_TEXTS } from '../../storefront/i18n/publicTexts';

const ADMIN_MENU = [
  { path: '/admin', icon: <LayoutDashboard />, label: 'الرئيسية', roles: ['admin', 'editor', 'cashier'] },
  { path: '/admin/activity', icon: <FileText />, label: 'سجل النشاط', roles: ['admin'] },
  { path: '/admin/pos', icon: <DollarSign />, label: 'نقطة بيع', roles: ['admin', 'cashier'] },
  { path: '/admin/products', icon: <Box />, label: 'المنتجات', roles: ['admin', 'editor'] },
  { path: '/admin/categories', icon: <Layers />, label: 'الأقسام', roles: ['admin', 'editor'] },
  { path: '/admin/coupons', icon: <TicketPercent />, label: 'الكوبونات', roles: ['admin', 'editor'] },
  { path: '/admin/orders', icon: <FileText />, label: 'الطلبات', roles: ['admin', 'editor'] },
  { path: '/admin/pages', icon: <FileText />, label: 'الصفحات', roles: ['admin'] },
  { path: '/admin/users', icon: <Users />, label: 'الموظفين', roles: ['admin'] },
  { path: '/admin/customers', icon: <Users />, label: 'العملاء', roles: ['admin'] },
  { path: '/admin/settings', icon: <Settings />, label: 'الإعدادات', roles: ['admin'] }
];

const AdminLayout = ({ children, onLogout, user, lang, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDesktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  const filteredMenu = ADMIN_MENU.filter((item) => item.roles.includes(user?.role));

  const sidebarWidthClass = isDesktopSidebarExpanded ? 'lg:w-64' : 'lg:w-20';
  const sidebarOffsetClass = isDesktopSidebarExpanded
    ? (lang === 'ar' ? 'lg:mr-64' : 'lg:ml-64')
    : (lang === 'ar' ? 'lg:mr-20' : 'lg:ml-20');
  const sidebarBasePlacementClass = lang === 'ar'
    ? 'right-0 border-l translate-x-full lg:translate-x-0'
    : 'left-0 border-r -translate-x-full lg:translate-x-0';
  const isAnySidebarOpen = isMobileSidebarOpen;
  const isCollapsedDesktop = !isDesktopSidebarExpanded;
  const sidebarLabelsVisible = !isCollapsedDesktop || isMobileSidebarOpen;
  const activeMenuItem = filteredMenu.find((item) => (
    location.pathname === item.path
    || location.pathname.startsWith(`${item.path}/`)
  ));
  const mobileHeaderTitle = activeMenuItem?.label || (lang === 'ar' ? 'لوحة التحكم' : 'Dashboard');
  const userInitial = (user?.full_name || user?.username || 'U').charAt(0).toUpperCase();

  if (!user) return <div className="h-screen flex items-center justify-center">جاري التحميل...</div>;

  return (
    <div className={`admin-shell relative flex min-h-screen ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {isAnySidebarOpen ? (
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          aria-label={lang === 'ar' ? 'إغلاق قائمة الإدارة' : 'Close admin menu'}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={`admin-sidebar fixed inset-y-0 ${sidebarBasePlacementClass} ${isAnySidebarOpen ? '!translate-x-0' : ''} w-[88vw] max-w-[320px] ${sidebarWidthClass} z-40 transition-all duration-300 flex flex-col`}
        aria-label={lang === 'ar' ? 'التنقل داخل الإدارة' : 'Admin navigation'}
      >
        <div className="px-4 pt-4 pb-5 border-b border-subtle">
          <div className={`flex items-center ${sidebarLabelsVisible ? 'justify-between' : 'justify-center'}`}>
            {sidebarLabelsVisible && (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-1 truncate">
                  {lang === 'ar' ? 'إدارة المتجر' : 'Store Ops'}
                </p>
                <h2 className="font-black text-lg text-primary truncate">{lang === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}</h2>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-10 h-10 rounded-xl border border-subtle bg-card text-secondary hover:text-primary hover:bg-card-soft transition lg:hidden"
              aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
            >
              <X size={18} className="mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => setDesktopSidebarExpanded((prev) => !prev)}
              className="hidden lg:block w-10 h-10 rounded-xl border border-subtle bg-card text-secondary hover:text-primary hover:bg-card-soft transition"
              aria-label={isDesktopSidebarExpanded
                ? (lang === 'ar' ? 'تصغير الشريط الجانبي' : 'Collapse sidebar')
                : (lang === 'ar' ? 'توسيع الشريط الجانبي' : 'Expand sidebar')}
            >
              {isDesktopSidebarExpanded ? <X size={18} className="mx-auto" /> : <Menu size={18} className="mx-auto" />}
            </button>
          </div>
        </div>

        <div className="px-4 my-4">
          <div className={`premium-panel p-3 flex items-center gap-3 ${isCollapsedDesktop ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-primary/30">
              {userInitial}
            </div>
            {sidebarLabelsVisible && (
              <div className="overflow-hidden">
                <div className="font-bold text-sm truncate">{user.full_name}</div>
                <div className="text-xs text-secondary capitalize">{user.role}</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto" aria-label={lang === 'ar' ? 'روابط الإدارة' : 'Admin links'}>
          {filteredMenu.map((item) => (
            <button
              type="button"
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileSidebarOpen(false);
              }}
              className={`admin-sidebar-link ${location.pathname === item.path ? 'admin-sidebar-link-active' : ''} ${isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''}`}
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarLabelsVisible && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-subtle space-y-1.5 mt-auto">
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
            lang={lang}
            showLabel={sidebarLabelsVisible}
            iconSize={20}
            className={`admin-sidebar-link ${isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''}`}
          />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`admin-sidebar-link ${isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''}`}
            title={lang === 'ar' ? 'عرض الموقع' : 'View Site'}
          >
            <Globe size={20} />
            {sidebarLabelsVisible && <span>{lang === 'ar' ? 'عرض الموقع' : 'View Site'}</span>}
          </a>
          <button
            type="button"
            onClick={onLogout}
            className={`admin-sidebar-link text-red-500 hover:text-red-600 hover:bg-red-50/85 ${isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''}`}
            title={lang === 'ar' ? 'تسجيل خروج' : 'Logout'}
          >
            <LogOut size={20} />
            {sidebarLabelsVisible && <span>{lang === 'ar' ? 'تسجيل خروج' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      <main id="admin-main-content" className={`admin-main flex-1 transition-all duration-300 p-3 sm:p-5 lg:p-8 overflow-x-hidden ${sidebarOffsetClass}`}>
        <header className="lg:hidden sticky top-2 z-30 mb-4 rounded-2xl border border-subtle bg-card/95 backdrop-blur px-3 py-2.5 flex items-center justify-between shadow-soft">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="ui-btn ui-btn-secondary ui-btn-icon"
            aria-label={lang === 'ar' ? 'فتح قائمة الإدارة' : 'Open admin menu'}
            aria-controls="admin-sidebar"
            aria-expanded={isMobileSidebarOpen}
          >
            <Menu size={18} />
          </button>
          <h1 className="font-black text-primary text-base truncate px-3">{mobileHeaderTitle}</h1>
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
            lang={lang}
            showLabel={false}
            iconSize={18}
            className="ui-btn ui-btn-secondary ui-btn-icon"
          />
        </header>
        <div className="mx-auto w-full max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  );
};

const AdminLogin = ({ onLogin, lang }) => {
  const t = PUBLIC_TEXTS[lang];
  const { pushToast } = useToastNotifications();
  const [creds, setCreds] = useState({ username: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    const normalizedCreds = {
      username: String(creds.username || '').trim(),
      password: String(creds.password || '')
    };
    try {
      const res = await axios.post(`${API_URL}/login`, normalizedCreds);
      onLogin(res.data.role, res.data.full_name);
    } catch (error) {
      if (!error?.response) {
        pushToast(
          lang === 'ar' ? 'تعذر الاتصال بالخادم. تحقق من إعدادات الرابط/المنفذ.' : 'Unable to reach server. Check host/port setup.',
          'error'
        );
        return;
      }
      const status = Number(error?.response?.status || 0);
      const apiMessage = error?.response?.data?.message || error?.response?.data?.error;
      if (status === 429) {
        pushToast(
          lang === 'ar' ? 'محاولات كثيرة. جرّب مرة أخرى بعد قليل.' : 'Too many attempts. Try again shortly.',
          'error'
        );
        return;
      }
      pushToast(apiMessage || (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid admin credentials'), 'error');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-page relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

      <form onSubmit={handleLogin} className="bg-card p-10 rounded-[2.5rem] shadow-lift w-full max-w-sm border border-subtle relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-primary text-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-soft"><LayoutDashboard size={32} /></div>
          <h2 className="text-2xl font-black text-primary">{t.admin}</h2>
        </div>
        <div className="space-y-4">
          <input
            className="ui-input p-4"
            placeholder="اسم المستخدم"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={creds.username}
            onChange={(e) => setCreds({ ...creds, username: e.target.value })}
          />
          <input
            className="ui-input p-4"
            type="password"
            placeholder="كلمة المرور"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={creds.password}
            onChange={(e) => setCreds({ ...creds, password: e.target.value })}
          />
          <button className="ui-btn ui-btn-primary w-full py-4 text-lg shadow-lg">دخول</button>
        </div>
      </form>
    </div>
  );
};

export const AdminRouteWrapper = ({ token, user, onLogin, onLogout, lang, theme, onToggleTheme }) => {
  if (!token) return <AdminLogin onLogin={onLogin} lang={lang} />;
  if (token && !user) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  return (
    <AdminLayout onLogout={onLogout} user={user} lang={lang} theme={theme} onToggleTheme={onToggleTheme}>
      <Outlet />
    </AdminLayout>
  );
};
