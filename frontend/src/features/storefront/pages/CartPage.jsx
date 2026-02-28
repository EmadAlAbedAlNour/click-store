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
import { useForm } from '../../../shared/hooks/useForm';
import { PUBLIC_TEXTS } from '../i18n/publicTexts';
import { resolveCurrencySymbol } from '../utils/storefrontUtils';
import { PageSkeleton, SkeletonBar } from './StorefrontPageShared';

export const CartPage = ({ cart, removeFromCart, updateQuantity, settings, customer, setCart, lang }) => {
  const t = PUBLIC_TEXTS[lang];
  const { pushToast } = useToastNotifications();
  const currency = resolveCurrencySymbol(settings, t.currency);
  const { values: form, setValues: setFormValues } = useForm({ name: '', phone: '', address: '' });
  const [orderNotes, setOrderNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    if (!customer) return;
    setFormValues({
      name: customer.full_name || '',
      phone: customer.phone || '',
      address: customer.address || ''
    });
  }, [customer, setFormValues]);

  // totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingBase = Number(settings?.shipping_cost || 0);
  const freeShipping = Number(settings?.free_shipping_threshold || 0);
  const shipping = freeShipping > 0 && subtotal >= freeShipping ? 0 : shippingBase;
  const taxRate = Number(settings?.tax_rate || 0);
  const tax = (subtotal * taxRate) / 100;
  const total = Math.max(0, subtotal + shipping + tax - discount);

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await axios.post(`${API_URL}/coupons/validate`, { code: couponCode });
      const c = res.data;
      let discountAmount = 0;
      if (c.type === 'percent') discountAmount = (subtotal * c.value) / 100;
      else discountAmount = c.value;
      setDiscount(discountAmount);
    } catch {
      setDiscount(0);
      pushToast(lang === 'ar' ? 'كود غير صالح' : 'Invalid coupon', 'error');
    }
  };

  const validateShipping = () => {
    const nextErrors = {};
    if (!form.name || form.name.trim().length < 3) {
      nextErrors.name = lang === 'ar' ? 'يرجى إدخال الاسم الكامل' : 'Please enter full name';
    }
    const phoneDigits = (form.phone || '').replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 8) {
      nextErrors.phone = lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number';
    }
    if (!form.address || form.address.trim().length < 8) {
      nextErrors.address = lang === 'ar' ? 'يرجى إدخال عنوان واضح' : 'Please enter a valid address';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const placeOrder = async () => {
    if (!validateShipping()) {
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        order_notes: orderNotes,
        items: cart.map(i => ({
          id: i.id,
          variant_id: i.variant_id,
          name: i.name,
          quantity: i.quantity
        })),
        coupon_code: couponCode || null,
        source: 'online'
      };
      const res = await axios.post(`${API_URL}/orders`, payload, { withCredentials: true });
      setCart([]);
      setOrderResult({ id: res.data?.id, total: res.data?.total || total });
      setStep(4);
    } catch {
      pushToast(t.orderError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: t.stepCart },
    { id: 2, label: t.stepShipping },
    { id: 3, label: t.stepReview },
    { id: 4, label: t.stepSuccess }
  ];

  const renderSummaryCard = (children = null) => (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-subtle sticky top-24">
      <h2 className="text-xl font-bold text-primary mb-6 border-b pb-4">{t.summary}</h2>
      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-secondary">
          <span>{t.subtotal}</span>
          <span className="font-medium">{currency}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-secondary">
          <span>{t.shippingInfo}</span>
          <span className="font-medium text-green-600">+ {currency}{shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-secondary">
          <span>{lang === 'ar' ? 'الضريبة' : 'Tax'}</span>
          <span className="font-medium">+ {currency}{tax.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>{t.discount}</span>
            <span className="font-medium">- {currency}{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-primary">{t.total}</span>
            <span className="text-2xl font-bold text-primary">{currency}{total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted mt-1 text-start">{t.taxIncluded}</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="ui-field-label mb-2 block">{t.couponPlaceholder}</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            placeholder="CODE2025" 
            value={couponCode}
            onChange={e => setCouponCode(e.target.value)}
            className="ui-input flex-1 py-2.5"
          />
          <button onClick={applyCoupon} className="ui-btn ui-btn-secondary px-4 py-2.5">
            {t.apply}
          </button>
        </div>
      </div>

      {children}

      <div className="mt-6 flex justify-center gap-4 text-muted">
        <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> {t.securePayment}</span>
      </div>
    </div>
  );

  if (cart.length === 0 && step !== 4) {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500" aria-labelledby="empty-cart-title">
        <div className="bg-card-soft p-8 rounded-full">
          <ShoppingCart size={64} className="text-muted" />
        </div>
        <h2 id="empty-cart-title" className="text-3xl font-bold text-primary">{t.emptyCart}</h2>
        <p className="text-muted max-w-md">{t.shopNow}</p>
        <a href="/" className="ui-btn ui-btn-primary px-8 py-3 shadow-lg">
          {t.shopNow}
        </a>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-500" aria-labelledby="cart-page-title">
      <h1 id="cart-page-title" className="sr-only">{t.cart}</h1>
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-1">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-3 shrink-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${step >= s.id ? 'bg-primary text-white' : 'bg-card-soft text-muted'}`}>{s.id}</div>
            <div className={`font-bold text-sm ${step >= s.id ? 'text-primary' : 'text-muted'}`}>{s.label}</div>
            {idx < steps.length - 1 && <div className="w-10 h-px bg-border-subtle"></div>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="text-3xl font-extrabold text-primary mb-8 flex items-center gap-3">
            <span className="bg-primary/10 text-primary p-2 rounded-lg"><ShoppingCart size={32} /></span>
            {t.cart}
            <span className="text-sm font-normal text-muted bg-card-soft px-3 py-1 rounded-full">{cart.length} {t.itemsCount}</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 space-y-4" aria-label={lang === 'ar' ? 'عناصر السلة' : 'Cart items'}>
              {cart.map((item) => (
                <div key={item.itemKey} className="bg-card p-4 rounded-2xl shadow-sm border border-subtle flex flex-col sm:flex-row items-center gap-6 hover:shadow-md transition-shadow duration-300">
                  <div className="w-32 h-32 bg-card-soft rounded-xl overflow-hidden shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-2"/>
                  </div>
                  <div className="flex-1 text-center sm:text-start w-full">
                    <h3 className="text-xl font-bold text-primary mb-1">{item.name}</h3>
                    <p className="text-muted text-sm mb-4">{item.category || 'إلكترونيات'}</p>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 bg-card-soft rounded-lg p-1 border border-subtle">
                        <button onClick={() => updateQuantity(item.itemKey, item.quantity - 1)} disabled={item.quantity <= 1} className="ui-btn ui-btn-secondary ui-btn-icon text-secondary hover:text-red-500">
                          <Minus size={16} />
                        </button>
                        <span className="font-bold w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.itemKey, item.quantity + 1)} className="ui-btn ui-btn-secondary ui-btn-icon text-secondary hover:text-green-600">
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-start">
                          <p className="text-muted text-xs">{t.itemTotal}</p>
                          <p className="text-xl font-bold text-primary">{currency}{item.price * item.quantity}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.itemKey)} className="ui-btn ui-btn-danger p-3" title={t.deleteItem}>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <div className="lg:col-span-1">
              {renderSummaryCard(
                <button onClick={() => setStep(2)} className="ui-btn ui-btn-primary w-full py-4 text-lg">
                  {t.continue}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card rounded-3xl border border-subtle p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-6">{t.shippingInfo}</h2>
            <div className="space-y-4">
              <div>
                <input className="ui-input" placeholder={t.name} value={form.name} onChange={e=>setFormValues({...form, name:e.target.value})} />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>
              <div>
                <input className="ui-input" placeholder={t.phone} value={form.phone} onChange={e=>setFormValues({...form, phone:e.target.value})} />
                {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
              </div>
              <div>
                <input className="ui-input" placeholder={t.address} value={form.address} onChange={e=>setFormValues({...form, address:e.target.value})} />
                {errors.address && <div className="text-xs text-red-500 mt-1">{errors.address}</div>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button onClick={() => setStep(1)} className="ui-btn ui-btn-secondary px-6 py-3">{t.back}</button>
              <button onClick={() => { if (validateShipping()) setStep(3); }} className="ui-btn ui-btn-primary px-6 py-3">{t.continue}</button>
            </div>
          </div>

          <div className="lg:col-span-1">
            {renderSummaryCard()}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-3xl border border-subtle p-6 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-4">{t.shippingInfo}</h3>
              <div className="text-sm text-secondary space-y-1">
                <div><span className="font-bold">{t.name}:</span> {form.name}</div>
                <div><span className="font-bold">{t.phone}:</span> {form.phone}</div>
                <div><span className="font-bold">{t.address}:</span> {form.address}</div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-secondary mb-2 block">{t.orderNotes}</label>
                <textarea className="ui-textarea h-24" value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} />
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-subtle p-6 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-4">{t.summary}</h3>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.itemKey} className="flex justify-between text-sm text-secondary">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-bold text-primary">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setStep(2)} className="ui-btn ui-btn-secondary px-6 py-3">{t.back}</button>
              <button onClick={placeOrder} disabled={loading} className="ui-btn ui-btn-primary px-6 py-3">
                {loading ? t.processing : t.confirmOrder}
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            {renderSummaryCard()}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <Check size={32}/>
          </div>
          <h2 className="text-3xl font-bold text-primary">{t.successTitle}</h2>
          <p className="text-muted max-w-xl">{t.successSubtitle}</p>
          {orderResult?.id && <div className="text-sm text-muted">#{orderResult.id}</div>}
          <a href="/" className="ui-btn ui-btn-primary px-8 py-3 shadow-lg">
            {t.continueShopping}
          </a>
        </div>
      )}
    </section>
  );
};

// --- CUSTOMER AUTH & ACCOUNT ---


