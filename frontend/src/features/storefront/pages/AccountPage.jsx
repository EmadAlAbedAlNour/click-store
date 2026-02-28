import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  Check,
  Eye,
  Facebook,
  Headphones,
  Heart,
  Instagram,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Quote,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trash2,
  Truck,
  Twitter,
  X,
  Youtube
} from 'lucide-react';
import { API_URL } from '../../../app/config';
import { useToastNotifications } from '../../../shared/contexts/ToastContext';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';
import { PUBLIC_TEXTS } from '../i18n/publicTexts';
import { PageSkeleton, SkeletonBar } from './StorefrontPageShared';

const CustomerAuthPage = ({ onLogin, lang }) => {
  const t = PUBLIC_TEXTS[lang];
  const { pushToast } = useToastNotifications();
  const [tab, setTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', full_name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/customers/login`, loginForm);
      onLogin();
    } catch {
      pushToast(lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/customers/register`, registerForm);
      onLogin();
    } catch {
      pushToast(lang === 'ar' ? 'تعذر إنشاء الحساب' : 'Unable to create account', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-12" aria-labelledby="customer-auth-title">
      <div className="w-full max-w-3xl bg-card rounded-3xl shadow-xl border border-subtle p-8">
        <h2 id="customer-auth-title" className="sr-only">{lang === 'ar' ? 'تسجيل العميل' : 'Customer authentication'}</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-8">
          <button type="button" onClick={() => setTab('login')} className={`ui-btn ${tab==='login' ? 'ui-btn-primary' : 'ui-btn-secondary'}`}>{t.customerLogin}</button>
          <button type="button" onClick={() => setTab('register')} className={`ui-btn ${tab==='register' ? 'ui-btn-primary' : 'ui-btn-secondary'}`}>{t.customerRegister}</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input className="ui-input" placeholder="Email" type="email" onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input className="ui-input" placeholder="Password" type="password" onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button disabled={loading} className="ui-btn ui-btn-primary w-full py-4 text-lg">{loading ? t.processing : t.customerLogin}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input className="ui-input" placeholder={t.name} onChange={e => setRegisterForm({...registerForm, full_name: e.target.value})} />
              <input className="ui-input" placeholder={t.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} />
            </div>
            <input className="ui-input" placeholder="Email" type="email" onChange={e => setRegisterForm({...registerForm, email: e.target.value})} />
            <input className="ui-input" placeholder="Password" type="password" onChange={e => setRegisterForm({...registerForm, password: e.target.value})} />
            <input className="ui-input" placeholder={t.address} onChange={e => setRegisterForm({...registerForm, address: e.target.value})} />
            <button disabled={loading} className="ui-btn ui-btn-primary w-full py-4 text-lg">{loading ? t.processing : t.customerRegister}</button>
          </form>
        )}
      </div>
    </section>
  );
};

export const AccountPage = ({ customer, customerToken, onLogin, onLogout, lang }) => {
  const t = PUBLIC_TEXTS[lang];
  const locale = getLatinDigitsLocale(lang);
  const { pushToast } = useToastNotifications();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(customer || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile(customer || {});
  }, [customer]);

  useEffect(() => {
    if (!customerToken) return;
    axios.get(`${API_URL}/customers/orders`, { withCredentials: true })
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]));
  }, [customerToken]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/customers/me`, profile, { withCredentials: true });
      pushToast(lang === 'ar' ? 'تم تحديث البيانات' : 'Profile updated', 'success');
    } catch {
      pushToast(lang === 'ar' ? 'حدث خطأ' : 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!customerToken) {
    return <CustomerAuthPage onLogin={onLogin} lang={lang} />;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10" aria-labelledby="account-page-title">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 id="account-page-title" className="text-3xl font-black text-primary">{t.account}</h1>
        <button onClick={onLogout} className="ui-btn ui-btn-danger px-4 py-2">{t.logout}</button>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-2xl border border-subtle shadow-soft space-y-4">
          <h2 className="text-xl font-bold">{t.profile}</h2>
          <input className="ui-input" value={profile.full_name || ''} onChange={e=>setProfile({...profile, full_name: e.target.value})} placeholder={t.name} />
          <input className="ui-input" value={profile.phone || ''} onChange={e=>setProfile({...profile, phone: e.target.value})} placeholder={t.phone} />
          <input className="ui-input" value={profile.address || ''} onChange={e=>setProfile({...profile, address: e.target.value})} placeholder={t.address} />
          <button onClick={saveProfile} disabled={saving} className="ui-btn ui-btn-primary w-full py-3">{saving ? t.processing : (lang === 'ar' ? 'حفظ' : 'Save')}</button>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-subtle shadow-soft">
          <h2 className="text-xl font-bold mb-4">{t.myOrders}</h2>
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="border border-subtle rounded-xl p-4 bg-card-soft">
                <div className="flex justify-between items-center">
                  <div className="font-bold">#{o.id}</div>
                  <div className="text-sm text-secondary">{new Date(o.created_at).toLocaleString(locale)}</div>
                </div>
                <div className="text-sm text-secondary mt-2">{o.status}</div>
                <div className="text-lg font-bold text-primary mt-2">${o.total_amount}</div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-muted">لا توجد طلبات</div>}
          </div>
        </div>
      </div>
    </section>
  );
};


