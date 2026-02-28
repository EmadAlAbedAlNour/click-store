
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Save,
  Globe,
  Heart,
  Palette,
  Layout,
  DollarSign,
  Search,
  Settings,
  Truck,
  Percent,
  Mail,
  Lock,
  Image as ImageIcon,
  Plus,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { API_URL } from '../../../app/config';
import { staffAuthConfig } from '../../../shared/api/authConfig';

const DEFAULT_SETTINGS = {
  shipping_cost: 0,
  tax_rate: 0,
  currency: 'USD',
  currency_symbol: '$',
  free_shipping_threshold: 0,
  home_featured_count: 4,
  site_name: '',
  site_tagline: '',
  site_description: '',
  contact_email: '',
  contact_phone: '',
  primary_color: '#2563eb',
  footer_text: '',
  invoice_logo: '',
  invoice_notes: '',
  hero_title: '',
  hero_subtitle: '',
  hero_image: '',
  hero_primary_cta_text: '',
  hero_primary_cta_link: '/shop',
  hero_secondary_cta_text: '',
  hero_secondary_cta_link: '/about',
  hero_badge_text: '',
  show_hero_section: 1,
  show_trust_section: 1,
  show_categories_section: 1,
  show_testimonials_section: 1,
  trust_section_title: '',
  trust_section_subtitle: '',
  categories_section_title: '',
  categories_section_subtitle: '',
  testimonials_section_title: '',
  testimonials_section_subtitle: '',
  about_page_title: '',
  about_page_subtitle: '',
  contact_page_title: '',
  contact_page_subtitle: '',
  show_search_button: 1,
  show_wishlist_button: 1,
  show_account_button: 1,
  show_cart_button: 1,
  show_language_toggle: 1,
  enable_dark_mode: 1,
  show_admin_link: 1,
  nav_pin_search_button: 1,
  nav_pin_wishlist_button: 1,
  nav_pin_account_button: 1,
  nav_pin_cart_button: 1,
  nav_pin_language_toggle: 0,
  nav_pin_theme_toggle: 0,
  nav_pin_admin_link: 0,
  product_highlight_shipping_label: '',
  product_highlight_shipping_value: '',
  product_highlight_warranty_label: '',
  product_highlight_warranty_value: '',
  product_specs_warranty_label: '',
  product_specs_warranty_value: '',
  product_specs_shipping_label: '',
  product_specs_shipping_value: '',
  product_quick_info_title: '',
  product_quick_info_shipping_label: '',
  product_quick_info_shipping_value: '',
  product_quick_info_returns_label: '',
  product_quick_info_returns_value: '',
  product_quick_info_support_label: '',
  product_quick_info_support_value: '',
  product_offer_title: '',
  product_offer_message: '',
  special_offer_enabled: 0,
  special_offer_product_id: 0,
  special_offer_start_at: '',
  special_offer_end_at: '',
  special_offer_badge: '',
  special_offer_title: '',
  special_offer_subtitle: '',
  special_offer_cta_text: '',
  special_offer_cta_link: '',
  special_offer_image: '',
  special_offer_discount_percent: 0,
  special_offer_override_price: 0,
  special_offers_json: [],
  special_offer_show_countdown: 1,
  special_offer_show_price: 1,
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_youtube: '',
  social_linkedin: '',
  social_whatsapp: '',
  home_banners: [],
  announcement_enabled: 0,
  announcement_text: '',
  default_language: 'ar',
  dark_mode_default: 0,
  maintenance_mode: 0,
  maintenance_message: '',
  show_footer: 1,
  show_social_links: 1,
  show_contact_info: 1,
  custom_css: ''
};

const toBool = (value) => Number(value) === 1 || value === true;

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const parseLocalDateTime = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const createEmptySpecialOffer = () => ({
  product_id: 0,
  start_at: '',
  end_at: '',
  badge: '',
  title: '',
  subtitle: '',
  cta_text: '',
  cta_link: '',
  image: '',
  discount_percent: 0,
  override_price: 0
});

const normalizeSpecialOffer = (offer = {}) => ({
  product_id: Math.max(0, Math.trunc(Number(offer?.product_id || 0))),
  start_at: String(offer?.start_at || '').trim(),
  end_at: String(offer?.end_at || '').trim(),
  badge: String(offer?.badge || '').trim(),
  title: String(offer?.title || '').trim(),
  subtitle: String(offer?.subtitle || '').trim(),
  cta_text: String(offer?.cta_text || '').trim(),
  cta_link: String(offer?.cta_link || '').trim(),
  image: String(offer?.image || '').trim(),
  discount_percent: Math.min(100, Math.max(0, Number(offer?.discount_percent || 0))),
  override_price: Math.max(0, Number(offer?.override_price || 0))
});

const hasSpecialOfferContent = (offer = {}) => {
  const normalized = normalizeSpecialOffer(offer);
  return normalized.product_id > 0 || !!normalized.title || !!normalized.subtitle || !!normalized.image;
};

const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`ui-toast ${type === 'error' ? 'ui-toast-error' : 'ui-toast-success'}`}>
    <div className="flex-1 font-medium">{message}</div>
    <button onClick={onClose} className="ui-btn ui-btn-ghost ui-btn-icon-sm text-white/85 hover:text-white hover:bg-black/10">x</button>
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="ui-field-label">{label}</label>
    {children}
  </div>
);

const Toggle = ({ checked, onChange, label, hint = '' }) => (
  <label className="flex items-start gap-3 rounded-xl border border-subtle bg-card-soft px-4 py-3">
    <input type="checkbox" className="ui-check mt-0.5" checked={checked} onChange={onChange} />
    <span>
      <span className="block font-semibold text-primary">{label}</span>
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </span>
  </label>
);

export default function AdminSettingsPanel({ lang = 'ar', t, MediaPicker }) {
  const L = useCallback((ar, en) => (lang === 'ar' ? ar : en), [lang]);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaField, setMediaField] = useState('invoice_logo');
  const [bannerDraft, setBannerDraft] = useState({ title: '', category: '', count: 4 });
  const [bannerEditIndex, setBannerEditIndex] = useState(-1);
  const [specialOfferDraft, setSpecialOfferDraft] = useState(createEmptySpecialOffer);
  const [specialOfferEditIndex, setSpecialOfferEditIndex] = useState(-1);

  const pushToast = useCallback((message, type = 'success') => {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const fetchSettings = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_URL}/settings`).catch(() => ({ data: {} })),
      axios.get(`${API_URL}/products?limit=1000&published=1`).catch(() => ({ data: { data: [] } }))
    ])
      .then(([settingsRes, productsRes]) => {
        setForm((prev) => ({ ...prev, ...(settingsRes?.data || {}) }));
        setProducts(Array.isArray(productsRes?.data?.data) ? productsRes.data.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleField = (key) => setForm((prev) => ({ ...prev, [key]: toBool(prev[key]) ? 0 : 1 }));

  const homeBanners = useMemo(() => {
    const raw = form?.home_banners;
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [form?.home_banners]);

  const specialOffers = useMemo(() => {
    const raw = form?.special_offers_json;
    let parsed = [];
    if (Array.isArray(raw)) {
      parsed = raw;
    } else if (raw) {
      try {
        const maybeParsed = JSON.parse(raw);
        parsed = Array.isArray(maybeParsed) ? maybeParsed : [];
      } catch {
        parsed = [];
      }
    }

    const normalized = parsed
      .map((offer) => normalizeSpecialOffer(offer))
      .filter((offer) => hasSpecialOfferContent(offer));
    if (normalized.length > 0) return normalized;

    const legacyOffer = normalizeSpecialOffer({
      product_id: form?.special_offer_product_id,
      start_at: form?.special_offer_start_at,
      end_at: form?.special_offer_end_at,
      badge: form?.special_offer_badge,
      title: form?.special_offer_title,
      subtitle: form?.special_offer_subtitle,
      cta_text: form?.special_offer_cta_text,
      cta_link: form?.special_offer_cta_link,
      image: form?.special_offer_image,
      discount_percent: form?.special_offer_discount_percent,
      override_price: form?.special_offer_override_price
    });
    return hasSpecialOfferContent(legacyOffer) ? [legacyOffer] : [];
  }, [
    form?.special_offers_json,
    form?.special_offer_product_id,
    form?.special_offer_start_at,
    form?.special_offer_end_at,
    form?.special_offer_badge,
    form?.special_offer_title,
    form?.special_offer_subtitle,
    form?.special_offer_cta_text,
    form?.special_offer_cta_link,
    form?.special_offer_image,
    form?.special_offer_discount_percent,
    form?.special_offer_override_price
  ]);

  const productCategories = useMemo(() => {
    const set = new Set();
    products.forEach((product) => {
      const category = String(product?.category || '').trim();
      if (category) set.add(category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [products]);

  const resetBannerDraft = () => {
    setBannerDraft({ title: '', category: '', count: 4 });
    setBannerEditIndex(-1);
  };

  const saveBannerDraft = () => {
    const title = String(bannerDraft.title || '').trim();
    if (!title) {
      pushToast(L('عنوان البانر مطلوب', 'Banner title is required'), 'error');
      return;
    }
    const category = String(bannerDraft.category || '').trim();
    const count = Math.max(1, Math.trunc(Number(bannerDraft.count || 4)));
    const nextBanner = {
      id: bannerEditIndex >= 0 ? homeBanners[bannerEditIndex]?.id || Date.now() : Date.now(),
      title,
      category,
      count
    };
    const next = [...homeBanners];
    if (bannerEditIndex >= 0) next[bannerEditIndex] = nextBanner;
    else next.push(nextBanner);
    setField('home_banners', next);
    resetBannerDraft();
  };

  const editBanner = (index) => {
    const banner = homeBanners[index];
    if (!banner) return;
    setBannerDraft({
      title: banner.title || '',
      category: banner.category || '',
      count: Math.max(1, Math.trunc(Number(banner.count || 4)))
    });
    setBannerEditIndex(index);
  };

  const removeBanner = (index) => {
    const next = [...homeBanners];
    next.splice(index, 1);
    setField('home_banners', next);
    if (bannerEditIndex === index) resetBannerDraft();
  };

  const moveBanner = (index, direction) => {
    const next = [...homeBanners];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setField('home_banners', next);
    if (bannerEditIndex === index) setBannerEditIndex(target);
  };

  const resetSpecialOfferDraft = () => {
    setSpecialOfferDraft(createEmptySpecialOffer());
    setSpecialOfferEditIndex(-1);
  };

  const saveSpecialOfferDraft = () => {
    const normalized = normalizeSpecialOffer(specialOfferDraft);
    if (!hasSpecialOfferContent(normalized)) {
      pushToast(L('اختر منتجاً أو أضف عنواناً/صورة', 'Select a product or add title/image'), 'error');
      return;
    }

    const startAt = parseLocalDateTime(normalized.start_at);
    const endAt = parseLocalDateTime(normalized.end_at);
    const nowTs = Date.now();

    if (normalized.start_at && !startAt) {
      pushToast(L('صيغة تاريخ بداية العرض غير صحيحة', 'Invalid offer start date format'), 'error');
      return;
    }
    if (normalized.end_at && !endAt) {
      pushToast(L('صيغة تاريخ نهاية العرض غير صحيحة', 'Invalid offer end date format'), 'error');
      return;
    }
    if (startAt && endAt && endAt.getTime() <= startAt.getTime()) {
      pushToast(
        L('يجب أن يكون وقت نهاية العرض بعد وقت البداية', 'Offer end time must be after start time'),
        'error'
      );
      return;
    }
    if (endAt && endAt.getTime() <= nowTs) {
      pushToast(
        L('تاريخ نهاية العرض منتهي بالفعل. اختر موعداً مستقبلياً.', 'Offer end time is already in the past. Choose a future date.'),
        'error'
      );
      return;
    }

    const next = [...specialOffers];
    if (specialOfferEditIndex >= 0) next[specialOfferEditIndex] = normalized;
    else next.push(normalized);
    setField('special_offers_json', next);
    resetSpecialOfferDraft();
  };

  const editSpecialOffer = (index) => {
    const offer = specialOffers[index];
    if (!offer) return;
    setSpecialOfferDraft({
      ...createEmptySpecialOffer(),
      ...normalizeSpecialOffer(offer)
    });
    setSpecialOfferEditIndex(index);
  };

  const removeSpecialOffer = (index) => {
    const next = [...specialOffers];
    next.splice(index, 1);
    setField('special_offers_json', next);
    if (specialOfferEditIndex === index) resetSpecialOfferDraft();
    if (specialOfferEditIndex > index) setSpecialOfferEditIndex((prev) => prev - 1);
  };

  const moveSpecialOffer = (index, direction) => {
    const next = [...specialOffers];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setField('special_offers_json', next);
    if (specialOfferEditIndex === index) setSpecialOfferEditIndex(target);
  };

  const getProductNameById = (productId) => {
    const found = products.find((item) => Number(item?.id) === Number(productId));
    return found?.name || `#${Number(productId) || 0}`;
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const normalizedOffers = specialOffers
        .map((offer) => normalizeSpecialOffer(offer))
        .filter((offer) => hasSpecialOfferContent(offer));
      const primaryOffer = normalizedOffers[0] || createEmptySpecialOffer();
      const payload = {
        ...form,
        special_offers_json: normalizedOffers,
        special_offer_product_id: primaryOffer.product_id || 0,
        special_offer_start_at: primaryOffer.start_at || '',
        special_offer_end_at: primaryOffer.end_at || '',
        special_offer_badge: primaryOffer.badge || '',
        special_offer_title: primaryOffer.title || '',
        special_offer_subtitle: primaryOffer.subtitle || '',
        special_offer_cta_text: primaryOffer.cta_text || '',
        special_offer_cta_link: primaryOffer.cta_link || '',
        special_offer_image: primaryOffer.image || '',
        special_offer_discount_percent: Number(primaryOffer.discount_percent || 0),
        special_offer_override_price: Number(primaryOffer.override_price || 0)
      };

      await axios.put(`${API_URL}/settings`, payload, {
        ...staffAuthConfig
      });
      pushToast(t.success, 'success');
      window.dispatchEvent(new Event('settings-updated'));
    } catch {
      pushToast(t.error, 'error');
    } finally {
      setSaving(false);
    }
  };
  const navMatrix = useMemo(
    () => [
      { key: 'search', label: L('بحث سريع', 'Quick Search'), show: 'show_search_button', pin: 'nav_pin_search_button', icon: Search },
      { key: 'wishlist', label: L('المفضلة', 'Wishlist'), show: 'show_wishlist_button', pin: 'nav_pin_wishlist_button', icon: Heart },
      { key: 'account', label: L('الحساب', 'Account'), show: 'show_account_button', pin: 'nav_pin_account_button', icon: Settings },
      { key: 'cart', label: L('السلة', 'Cart'), show: 'show_cart_button', pin: 'nav_pin_cart_button', icon: DollarSign },
      { key: 'language', label: L('تبديل اللغة', 'Language Toggle'), show: 'show_language_toggle', pin: 'nav_pin_language_toggle', icon: Globe },
      { key: 'theme', label: L('تبديل الثيم', 'Theme Toggle'), show: 'enable_dark_mode', pin: 'nav_pin_theme_toggle', icon: Palette },
      { key: 'admin', label: L('رابط الإدارة', 'Admin Link'), show: 'show_admin_link', pin: 'nav_pin_admin_link', icon: Lock }
    ],
    [L]
  );

  const tabs = [
    { id: 'general', label: L('عام', 'General'), icon: Globe },
    { id: 'branding', label: L('الهوية', 'Branding'), icon: Palette },
    { id: 'home', label: L('الرئيسية', 'Homepage'), icon: Layout },
    { id: 'storefront_texts', label: L('نصوص الواجهة', 'Storefront Texts'), icon: Layout },
    { id: 'commerce', label: L('المالية', 'Commerce'), icon: DollarSign },
    { id: 'navbar', label: L('شريط التنقل', 'Navbar'), icon: Search },
    { id: 'product_texts', label: L('نصوص المنتج', 'Product Texts'), icon: Truck },
    { id: 'special_offer', label: L('العرض الخاص', 'Special Offer'), icon: Percent },
    { id: 'contact', label: L('التواصل', 'Contact'), icon: Mail },
    { id: 'system', label: L('النظام', 'System'), icon: Lock },
    { id: 'advanced', label: L('متقدم', 'Advanced'), icon: Settings }
  ];

  const openMedia = (field) => {
    setMediaField(field);
    setShowMedia(true);
  };

  return (
    <section className="max-w-7xl mx-auto animate-fade-in pb-20" aria-labelledby="admin-settings-title">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showMedia && MediaPicker ? (
        <MediaPicker
          onClose={() => setShowMedia(false)}
          onSelect={(media) => {
            const selectedUrl = String(media?.url || '');
            if (mediaField === 'special_offer_draft_image') {
              setSpecialOfferDraft((prev) => ({ ...prev, image: selectedUrl }));
            } else {
              setField(mediaField, selectedUrl);
            }
            setShowMedia(false);
          }}
          lang={lang}
        />
      ) : null}

      <header className="premium-panel p-5 sm:p-6 mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h1 id="admin-settings-title" className="text-3xl font-black text-primary">{t.settings}</h1>
          <p className="text-muted mt-1">{L('كل إعدادات المتجر من مكان واحد بدون تكرار.', 'All store settings in one ordered panel without duplicates.')}</p>
        </div>
        <button onClick={saveSettings} disabled={saving || loading} className="ui-btn ui-btn-primary w-full sm:w-auto">
          <Save size={16} />
          {saving ? t.saving : t.save}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <nav className="lg:col-span-3" aria-label={L('تبويبات الإعدادات', 'Settings tabs')}>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 min-w-[170px] lg:min-w-0 lg:w-full rounded-2xl border px-4 py-3 text-start transition ${activeTab === tab.id ? 'border-primary/40 bg-primary/10 text-primary shadow-soft' : 'border-subtle bg-card text-secondary hover:bg-card-soft'}`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <span className="inline-flex items-center gap-2 font-bold"><Icon size={16} /> {tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="lg:col-span-9 premium-panel p-5 sm:p-6 min-h-[580px] lg:min-h-[640px]">
          {loading ? (
            <div className="text-center text-muted py-12">{L('جاري تحميل الإعدادات...', 'Loading settings...')}</div>
          ) : null}

          {!loading && activeTab === 'general' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t.siteName}><input className="ui-input" value={form.site_name || ''} onChange={(e) => setField('site_name', e.target.value)} /></Field>
                <Field label={L('الشعار النصي', 'Tagline')}><input className="ui-input" value={form.site_tagline || ''} onChange={(e) => setField('site_tagline', e.target.value)} /></Field>
              </div>
              <Field label={t.siteDesc}><textarea className="ui-textarea h-24" value={form.site_description || ''} onChange={(e) => setField('site_description', e.target.value)} /></Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={L('اللغة الافتراضية', 'Default Language')}>
                  <select className="ui-select" value={form.default_language || 'ar'} onChange={(e) => setField('default_language', e.target.value)}>
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <Field label={L('عدد منتجات الرئيسية', 'Home Featured Count')}>
                  <input type="number" min="1" className="ui-input" value={form.home_featured_count || 4} onChange={(e) => setField('home_featured_count', e.target.value)} />
                </Field>
              </div>
              <Toggle checked={toBool(form.announcement_enabled)} onChange={() => toggleField('announcement_enabled')} label={L('تفعيل إعلان علوي', 'Enable top announcement')} />
              {toBool(form.announcement_enabled) ? <Field label={L('نص الإعلان', 'Announcement Text')}><input className="ui-input" value={form.announcement_text || ''} onChange={(e) => setField('announcement_text', e.target.value)} /></Field> : null}
            </div>
          ) : null}

          {!loading && activeTab === 'branding' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t.primaryColor}>
                  <div className="flex items-center gap-3 rounded-xl border border-subtle bg-card-soft px-3 py-2">
                    <input type="color" value={form.primary_color || '#2563eb'} onChange={(e) => setField('primary_color', e.target.value)} className="w-11 h-11 rounded-lg border border-subtle p-0.5 bg-card" />
                    <span className="font-mono text-sm font-bold text-primary">{form.primary_color || '#2563eb'}</span>
                  </div>
                </Field>
                <Field label={t.footerText}><input className="ui-input" value={form.footer_text || ''} onChange={(e) => setField('footer_text', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t.logo}>
                  <div className="rounded-xl border border-dashed border-subtle bg-card-soft p-3 flex items-center justify-between gap-3">
                    <div className="h-14 w-full rounded-lg border border-subtle bg-card flex items-center justify-center overflow-hidden">
                      {form.invoice_logo ? <img src={form.invoice_logo} alt="logo" className="h-full object-contain" /> : <ImageIcon size={20} className="text-muted" />}
                    </div>
                    <button className="ui-btn ui-btn-secondary ui-btn-sm whitespace-nowrap" onClick={() => openMedia('invoice_logo')}>{L('اختيار', 'Pick')}</button>
                  </div>
                </Field>
                <Field label={t.invoiceNotes}><textarea className="ui-textarea h-24" value={form.invoice_notes || ''} onChange={(e) => setField('invoice_notes', e.target.value)} /></Field>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'home' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={L('عنوان البانر الرئيسي', 'Hero Title')}><input className="ui-input" value={form.hero_title || ''} onChange={(e) => setField('hero_title', e.target.value)} /></Field>
                <Field label={L('العنوان الفرعي', 'Hero Subtitle')}><input className="ui-input" value={form.hero_subtitle || ''} onChange={(e) => setField('hero_subtitle', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={L('زر أساسي', 'Primary CTA Text')}><input className="ui-input" value={form.hero_primary_cta_text || ''} onChange={(e) => setField('hero_primary_cta_text', e.target.value)} /></Field>
                <Field label={L('رابط الزر الأساسي', 'Primary CTA Link')}><input className="ui-input" value={form.hero_primary_cta_link || ''} onChange={(e) => setField('hero_primary_cta_link', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={L('زر ثانوي', 'Secondary CTA Text')}><input className="ui-input" value={form.hero_secondary_cta_text || ''} onChange={(e) => setField('hero_secondary_cta_text', e.target.value)} /></Field>
                <Field label={L('رابط الزر الثانوي', 'Secondary CTA Link')}><input className="ui-input" value={form.hero_secondary_cta_link || ''} onChange={(e) => setField('hero_secondary_cta_link', e.target.value)} /></Field>
              </div>
              <Field label={L('نص شارة البانر', 'Hero Badge Text')}>
                <input className="ui-input" value={form.hero_badge_text || ''} onChange={(e) => setField('hero_badge_text', e.target.value)} />
              </Field>
              <Field label={L('صورة البانر', 'Hero Image')}>
                <div className="rounded-xl border border-dashed border-subtle bg-card-soft p-3 flex items-center justify-between gap-3">
                  <div className="h-16 w-full rounded-lg border border-subtle bg-card flex items-center justify-center overflow-hidden">
                    {form.hero_image ? <img src={form.hero_image} alt="hero" className="h-full object-cover w-full" /> : <ImageIcon size={20} className="text-muted" />}
                  </div>
                  <button className="ui-btn ui-btn-secondary ui-btn-sm whitespace-nowrap" onClick={() => openMedia('hero_image')}>{L('اختيار', 'Pick')}</button>
                </div>
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle checked={toBool(form.show_hero_section)} onChange={() => toggleField('show_hero_section')} label={L('إظهار البانر الرئيسي', 'Show Hero')} />
                <Toggle checked={toBool(form.show_trust_section)} onChange={() => toggleField('show_trust_section')} label={L('إظهار قسم الثقة', 'Show Trust Section')} />
                <Toggle checked={toBool(form.show_categories_section)} onChange={() => toggleField('show_categories_section')} label={L('إظهار الأقسام', 'Show Categories')} />
                <Toggle checked={toBool(form.show_testimonials_section)} onChange={() => toggleField('show_testimonials_section')} label={L('إظهار التقييمات', 'Show Testimonials')} />
              </div>

              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-primary">{L('بانرات أقسام الصفحة الرئيسية', 'Homepage Banner Sections')}</h3>
                  <span className="text-xs text-muted">{L('العدد', 'Count')}: <b className="text-primary">{homeBanners.length}</b></span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    className="ui-input md:col-span-2"
                    placeholder={L('عنوان البانر', 'Banner title')}
                    value={bannerDraft.title}
                    onChange={(e) => setBannerDraft((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <select
                    className="ui-select"
                    value={bannerDraft.category}
                    onChange={(e) => setBannerDraft((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">{L('كل الأقسام', 'All categories')}</option>
                    {productCategories.map((category) => <option key={`banner-cat-${category}`} value={category}>{category}</option>)}
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="ui-input"
                    placeholder={L('عدد المنتجات', 'Products count')}
                    value={bannerDraft.count}
                    onChange={(e) => setBannerDraft((prev) => ({ ...prev, count: e.target.value }))}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="ui-btn ui-btn-primary ui-btn-sm" onClick={saveBannerDraft}>
                    {bannerEditIndex >= 0 ? <Edit3 size={14} /> : <Plus size={14} />}
                    {bannerEditIndex >= 0 ? L('تحديث البانر', 'Update banner') : L('إضافة بانر', 'Add banner')}
                  </button>
                  {bannerEditIndex >= 0 ? <button className="ui-btn ui-btn-secondary ui-btn-sm" onClick={resetBannerDraft}>{t.cancel}</button> : null}
                </div>

                <div className="space-y-2">
                  {homeBanners.map((banner, idx) => (
                    <div key={`${banner.id || idx}-${idx}`} className="rounded-xl border border-subtle bg-card-soft px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-primary truncate">{banner.title || '-'}</div>
                        <div className="text-xs text-muted truncate">
                          {(banner.category || L('كل الأقسام', 'All categories'))} • {L('عدد', 'Count')}: {Math.max(1, Math.trunc(Number(banner.count || 4)))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="ui-btn ui-btn-icon ui-btn-secondary" onClick={() => moveBanner(idx, 'up')} disabled={idx === 0}><ChevronUp size={13} /></button>
                        <button className="ui-btn ui-btn-icon ui-btn-secondary" onClick={() => moveBanner(idx, 'down')} disabled={idx === homeBanners.length - 1}><ChevronDown size={13} /></button>
                        <button className="ui-btn ui-btn-icon ui-btn-icon-primary" onClick={() => editBanner(idx)}><Edit3 size={13} /></button>
                        <button className="ui-btn ui-btn-icon ui-btn-icon-danger" onClick={() => removeBanner(idx)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {homeBanners.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-subtle bg-card-soft px-4 py-6 text-center text-sm text-muted">
                      {L('لا توجد بانرات إضافية بعد.', 'No extra homepage banners yet.')}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'storefront_texts' ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">{L('قسم الثقة', 'Trust Section')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="ui-input" placeholder={L('عنوان قسم الثقة', 'Trust title')} value={form.trust_section_title || ''} onChange={(e) => setField('trust_section_title', e.target.value)} />
                  <input className="ui-input" placeholder={L('العنوان الفرعي لقسم الثقة', 'Trust subtitle')} value={form.trust_section_subtitle || ''} onChange={(e) => setField('trust_section_subtitle', e.target.value)} />
                </div>
              </div>

              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">{L('قسم الأقسام', 'Categories Section')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="ui-input" placeholder={L('عنوان قسم الأقسام', 'Categories title')} value={form.categories_section_title || ''} onChange={(e) => setField('categories_section_title', e.target.value)} />
                  <input className="ui-input" placeholder={L('العنوان الفرعي لقسم الأقسام', 'Categories subtitle')} value={form.categories_section_subtitle || ''} onChange={(e) => setField('categories_section_subtitle', e.target.value)} />
                </div>
              </div>

              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">{L('قسم التقييمات', 'Testimonials Section')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="ui-input" placeholder={L('عنوان قسم التقييمات', 'Testimonials title')} value={form.testimonials_section_title || ''} onChange={(e) => setField('testimonials_section_title', e.target.value)} />
                  <input className="ui-input" placeholder={L('العنوان الفرعي لقسم التقييمات', 'Testimonials subtitle')} value={form.testimonials_section_subtitle || ''} onChange={(e) => setField('testimonials_section_subtitle', e.target.value)} />
                </div>
              </div>

              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">{L('نصوص صفحات من نحن وتواصل', 'About & Contact Titles')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="ui-input" placeholder={L('عنوان صفحة من نحن', 'About page title')} value={form.about_page_title || ''} onChange={(e) => setField('about_page_title', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان فرعي لصفحة من نحن', 'About page subtitle')} value={form.about_page_subtitle || ''} onChange={(e) => setField('about_page_subtitle', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان صفحة تواصل معنا', 'Contact page title')} value={form.contact_page_title || ''} onChange={(e) => setField('contact_page_title', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان فرعي لصفحة تواصل معنا', 'Contact page subtitle')} value={form.contact_page_subtitle || ''} onChange={(e) => setField('contact_page_subtitle', e.target.value)} />
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'commerce' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={L('العملة', 'Currency Code')}><input className="ui-input" value={form.currency || ''} onChange={(e) => setField('currency', e.target.value)} /></Field>
                <Field label={L('رمز العملة', 'Currency Symbol')}><input className="ui-input" value={form.currency_symbol || ''} onChange={(e) => setField('currency_symbol', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label={L('الضريبة %', 'Tax %')}><input type="number" className="ui-input" value={form.tax_rate || 0} onChange={(e) => setField('tax_rate', e.target.value)} /></Field>
                <Field label={L('الشحن الثابت', 'Shipping Cost')}><input type="number" className="ui-input" value={form.shipping_cost || 0} onChange={(e) => setField('shipping_cost', e.target.value)} /></Field>
                <Field label={L('حد الشحن المجاني', 'Free Shipping Threshold')}><input type="number" className="ui-input" value={form.free_shipping_threshold || 0} onChange={(e) => setField('free_shipping_threshold', e.target.value)} /></Field>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'navbar' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-subtle bg-card-soft px-4 py-3 text-sm text-secondary">
                {L('التحكم بمكان الأزرار: عند إلغاء "تثبيت" ينتقل الزر تلقائياً إلى قائمة المزيد.', 'Control action placement: when Pin is disabled, the action moves to the More dropdown.')}
              </div>
              <div className="rounded-2xl border border-subtle overflow-x-auto">
                <div className="min-w-[540px]">
                  <div className="grid grid-cols-[1fr_120px_120px] bg-card-soft text-xs font-black text-muted uppercase">
                    <div className="p-3">{L('العنصر', 'Item')}</div>
                    <div className="p-3 text-center">{L('إظهار', 'Show')}</div>
                    <div className="p-3 text-center">{L('تثبيت', 'Pin')}</div>
                  </div>
                  {navMatrix.map((row) => {
                    const Icon = row.icon;
                    const visible = toBool(form[row.show]);
                    return (
                      <div key={row.key} className="grid grid-cols-[1fr_120px_120px] border-t border-subtle">
                        <div className="p-3 inline-flex items-center gap-2 text-primary font-semibold"><Icon size={15} /> {row.label}</div>
                        <div className="p-3 text-center">
                          <input type="checkbox" className="ui-check" checked={visible} onChange={() => toggleField(row.show)} />
                        </div>
                        <div className="p-3 text-center">
                          <input type="checkbox" className="ui-check" checked={toBool(form[row.pin])} onChange={() => toggleField(row.pin)} disabled={!visible} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'product_texts' ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">{L('شريط المزايا أعلى زر السلة', 'Highlights above add-to-cart')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="ui-input" placeholder={L('عنوان الشحن', 'Shipping label')} value={form.product_highlight_shipping_label || ''} onChange={(e) => setField('product_highlight_shipping_label', e.target.value)} />
                  <input className="ui-input" placeholder={L('قيمة الشحن', 'Shipping value')} value={form.product_highlight_shipping_value || ''} onChange={(e) => setField('product_highlight_shipping_value', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان الضمان', 'Warranty label')} value={form.product_highlight_warranty_label || ''} onChange={(e) => setField('product_highlight_warranty_label', e.target.value)} />
                  <input className="ui-input" placeholder={L('قيمة الضمان', 'Warranty value')} value={form.product_highlight_warranty_value || ''} onChange={(e) => setField('product_highlight_warranty_value', e.target.value)} />
                </div>
              </div>
              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">{L('قسم المواصفات', 'Specs section')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="ui-input" placeholder={L('عنوان مواصفة الضمان', 'Specs warranty label')} value={form.product_specs_warranty_label || ''} onChange={(e) => setField('product_specs_warranty_label', e.target.value)} />
                  <input className="ui-input" placeholder={L('قيمة مواصفة الضمان', 'Specs warranty value')} value={form.product_specs_warranty_value || ''} onChange={(e) => setField('product_specs_warranty_value', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان مواصفة الشحن', 'Specs shipping label')} value={form.product_specs_shipping_label || ''} onChange={(e) => setField('product_specs_shipping_label', e.target.value)} />
                  <input className="ui-input" placeholder={L('قيمة مواصفة الشحن', 'Specs shipping value')} value={form.product_specs_shipping_value || ''} onChange={(e) => setField('product_specs_shipping_value', e.target.value)} />
                </div>
              </div>
              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">{L('قسم المعلومات السريعة والعرض المصغر', 'Quick info & mini offer')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="ui-input md:col-span-2" placeholder={L('عنوان المعلومات السريعة', 'Quick info title')} value={form.product_quick_info_title || ''} onChange={(e) => setField('product_quick_info_title', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان صف الشحن', 'Quick shipping label')} value={form.product_quick_info_shipping_label || ''} onChange={(e) => setField('product_quick_info_shipping_label', e.target.value)} />
                  <input className="ui-input" placeholder={L('قيمة صف الشحن', 'Quick shipping value')} value={form.product_quick_info_shipping_value || ''} onChange={(e) => setField('product_quick_info_shipping_value', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان صف الإرجاع', 'Quick returns label')} value={form.product_quick_info_returns_label || ''} onChange={(e) => setField('product_quick_info_returns_label', e.target.value)} />
                  <input className="ui-input" placeholder={L('قيمة صف الإرجاع', 'Quick returns value')} value={form.product_quick_info_returns_value || ''} onChange={(e) => setField('product_quick_info_returns_value', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان صف الدعم', 'Quick support label')} value={form.product_quick_info_support_label || ''} onChange={(e) => setField('product_quick_info_support_label', e.target.value)} />
                  <input className="ui-input" placeholder={L('قيمة صف الدعم', 'Quick support value')} value={form.product_quick_info_support_value || ''} onChange={(e) => setField('product_quick_info_support_value', e.target.value)} />
                  <input className="ui-input" placeholder={L('عنوان العرض الخاص', 'Mini offer title')} value={form.product_offer_title || ''} onChange={(e) => setField('product_offer_title', e.target.value)} />
                  <input className="ui-input" placeholder={L('نص العرض الخاص', 'Mini offer message')} value={form.product_offer_message || ''} onChange={(e) => setField('product_offer_message', e.target.value)} />
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'special_offer' ? (
            <div className="space-y-4">
              <Toggle checked={toBool(form.special_offer_enabled)} onChange={() => toggleField('special_offer_enabled')} label={L('تفعيل العرض الخاص', 'Enable special offer')} />
              <div className="rounded-xl border border-subtle bg-card-soft px-4 py-3 text-sm text-secondary">
                {L('يمكنك إضافة عدة عروض. الواجهة ستعرضها بالتناوب تلقائياً كل بضع ثوانٍ.', 'Add multiple offers. Storefront rotates them automatically every few seconds.')}
              </div>
              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-4">
                <h3 className="font-black text-primary">{specialOfferEditIndex >= 0 ? L('تعديل عرض', 'Edit Offer') : L('إضافة عرض جديد', 'Add New Offer')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={L('المنتج المستهدف', 'Target Product')}>
                    <select className="ui-select" value={specialOfferDraft.product_id || 0} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, product_id: e.target.value }))}>
                      <option value="0">{L('اختر منتجاً', 'Select product')}</option>
                      {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                    </select>
                  </Field>
                  <Field label={L('شارة العرض', 'Offer Badge')}><input className="ui-input" value={specialOfferDraft.badge || ''} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, badge: e.target.value }))} /></Field>
                  <Field label={L('العنوان', 'Title')}><input className="ui-input" value={specialOfferDraft.title || ''} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, title: e.target.value }))} /></Field>
                  <Field label={L('العنوان الفرعي', 'Subtitle')}><input className="ui-input" value={specialOfferDraft.subtitle || ''} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, subtitle: e.target.value }))} /></Field>
                  <Field label={L('بداية العرض', 'Start')}><input type="datetime-local" className="ui-input" value={toDateTimeLocal(specialOfferDraft.start_at)} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, start_at: e.target.value }))} /></Field>
                  <Field label={L('نهاية العرض', 'End')}><input type="datetime-local" className="ui-input" value={toDateTimeLocal(specialOfferDraft.end_at)} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, end_at: e.target.value }))} /></Field>
                  <Field label={L('نسبة الخصم %', 'Discount %')}><input type="number" min="0" max="100" className="ui-input" value={specialOfferDraft.discount_percent || 0} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, discount_percent: e.target.value }))} /></Field>
                  <Field label={L('سعر بديل (اختياري)', 'Override Price (optional)')}><input type="number" min="0" className="ui-input" value={specialOfferDraft.override_price || 0} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, override_price: e.target.value }))} /></Field>
                  <Field label={L('نص زر العرض', 'CTA Text')}><input className="ui-input" value={specialOfferDraft.cta_text || ''} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, cta_text: e.target.value }))} /></Field>
                  <Field label={L('رابط الزر', 'CTA Link')}><input className="ui-input" value={specialOfferDraft.cta_link || ''} onChange={(e) => setSpecialOfferDraft((prev) => ({ ...prev, cta_link: e.target.value }))} /></Field>
                </div>
                <Field label={L('صورة العرض', 'Offer Image')}>
                  <div className="rounded-xl border border-dashed border-subtle bg-card-soft p-3 flex items-center justify-between gap-3">
                    <div className="h-16 w-full rounded-lg border border-subtle bg-card flex items-center justify-center overflow-hidden">
                      {specialOfferDraft.image ? <img src={specialOfferDraft.image} alt="offer" className="h-full object-contain w-full p-1" /> : <ImageIcon size={20} className="text-muted" />}
                    </div>
                    <button className="ui-btn ui-btn-secondary ui-btn-sm whitespace-nowrap" onClick={() => openMedia('special_offer_draft_image')}>{L('اختيار', 'Pick')}</button>
                  </div>
                </Field>
                <div className="flex flex-wrap gap-2">
                  <button className="ui-btn ui-btn-primary ui-btn-sm" onClick={saveSpecialOfferDraft}>
                    <Plus size={14} />
                    {specialOfferEditIndex >= 0 ? L('تحديث العرض', 'Update Offer') : L('إضافة العرض', 'Add Offer')}
                  </button>
                  {specialOfferEditIndex >= 0 ? (
                    <button className="ui-btn ui-btn-secondary ui-btn-sm" onClick={resetSpecialOfferDraft}>
                      {L('إلغاء التعديل', 'Cancel Edit')}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                {specialOffers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-subtle bg-card-soft px-4 py-6 text-center text-sm text-muted">
                    {L('لا توجد عروض بعد. أضف أول عرض من النموذج أعلاه.', 'No offers yet. Add your first offer above.')}
                  </div>
                ) : (
                  specialOffers.map((offer, index) => (
                    <div key={`${offer.product_id}-${index}`} className="rounded-xl border border-subtle bg-card p-3 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg border border-subtle bg-card-soft overflow-hidden flex items-center justify-center shrink-0">
                        {offer.image ? <img src={offer.image} alt={offer.title || `offer-${index + 1}`} className="w-full h-full object-contain p-1" /> : <ImageIcon size={18} className="text-muted" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-primary truncate">{offer.title || getProductNameById(offer.product_id) || L('عرض بدون عنوان', 'Untitled offer')}</div>
                        <div className="text-xs text-muted truncate">
                          {L('منتج', 'Product')}: {getProductNameById(offer.product_id)} • {L('خصم', 'Discount')}: {Number(offer.discount_percent || 0)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveSpecialOffer(index, 'up')} disabled={index === 0} className="ui-btn ui-btn-icon ui-btn-secondary disabled:opacity-40"><ChevronUp size={14} /></button>
                        <button onClick={() => moveSpecialOffer(index, 'down')} disabled={index === specialOffers.length - 1} className="ui-btn ui-btn-icon ui-btn-secondary disabled:opacity-40"><ChevronDown size={14} /></button>
                        <button onClick={() => editSpecialOffer(index)} className="ui-btn ui-btn-icon ui-btn-secondary"><Edit3 size={14} /></button>
                        <button onClick={() => removeSpecialOffer(index)} className="ui-btn ui-btn-icon ui-btn-icon-danger"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle checked={toBool(form.special_offer_show_countdown)} onChange={() => toggleField('special_offer_show_countdown')} label={L('إظهار العد التنازلي', 'Show Countdown')} />
                <Toggle checked={toBool(form.special_offer_show_price)} onChange={() => toggleField('special_offer_show_price')} label={L('إظهار السعر', 'Show Price')} />
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'contact' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t.email}><input className="ui-input" value={form.contact_email || ''} onChange={(e) => setField('contact_email', e.target.value)} /></Field>
                <Field label={t.phone}><input className="ui-input" value={form.contact_phone || ''} onChange={(e) => setField('contact_phone', e.target.value)} /></Field>
                <Field label="Facebook"><input className="ui-input" value={form.social_facebook || ''} onChange={(e) => setField('social_facebook', e.target.value)} /></Field>
                <Field label="Instagram"><input className="ui-input" value={form.social_instagram || ''} onChange={(e) => setField('social_instagram', e.target.value)} /></Field>
                <Field label="Twitter / X"><input className="ui-input" value={form.social_twitter || ''} onChange={(e) => setField('social_twitter', e.target.value)} /></Field>
                <Field label="YouTube"><input className="ui-input" value={form.social_youtube || ''} onChange={(e) => setField('social_youtube', e.target.value)} /></Field>
                <Field label="LinkedIn"><input className="ui-input" value={form.social_linkedin || ''} onChange={(e) => setField('social_linkedin', e.target.value)} /></Field>
                <Field label="WhatsApp"><input className="ui-input" value={form.social_whatsapp || ''} onChange={(e) => setField('social_whatsapp', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Toggle checked={toBool(form.show_footer)} onChange={() => toggleField('show_footer')} label={L('إظهار الفوتر', 'Show Footer')} />
                <Toggle checked={toBool(form.show_social_links)} onChange={() => toggleField('show_social_links')} label={L('إظهار السوشيال', 'Show Social Links')} />
                <Toggle checked={toBool(form.show_contact_info)} onChange={() => toggleField('show_contact_info')} label={L('إظهار بيانات التواصل', 'Show Contact Info')} />
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'system' ? (
            <div className="space-y-4">
              <Toggle checked={toBool(form.maintenance_mode)} onChange={() => toggleField('maintenance_mode')} label={L('وضع الصيانة', 'Maintenance Mode')} />
              {toBool(form.maintenance_mode) ? (
                <Field label={L('رسالة الصيانة', 'Maintenance Message')}>
                  <textarea className="ui-textarea h-24" value={form.maintenance_message || ''} onChange={(e) => setField('maintenance_message', e.target.value)} />
                </Field>
              ) : null}
              <Toggle checked={toBool(form.dark_mode_default)} onChange={() => toggleField('dark_mode_default')} label={L('الوضع الداكن افتراضي', 'Dark mode by default')} />
            </div>
          ) : null}

          {!loading && activeTab === 'advanced' ? (
            <div className="space-y-3">
              <Field label={L('CSS مخصص', 'Custom CSS')}>
                <textarea className="ui-textarea h-60 font-mono text-xs" value={form.custom_css || ''} onChange={(e) => setField('custom_css', e.target.value)} />
              </Field>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
