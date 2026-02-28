import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { PUBLIC_TEXTS } from '../i18n/publicTexts';
import {
  bindSiteName,
  getProductDisplayPricing,
  parseDateTimeValue,
  resolveCurrencySymbol,
  resolveSpecialOfferPricing,
  sanitizeRichHtml
} from '../utils/storefrontUtils';
import { PageSkeleton, SkeletonBar } from './StorefrontPageShared';

const getDefaultAboutContent = (lang, settings = {}) => {
  if (lang === 'ar') {
    const fallbackTitle = `نبذة عن ${settings?.site_name || 'TechStore'}`;
    return {
      eyebrow: 'من نحن',
      title: bindSiteName(settings?.about_page_title || fallbackTitle, settings?.site_name),
      subtitle: settings?.about_page_subtitle || settings?.site_description || 'نحن نبني تجربة تسوق ذكية تجمع بين الجودة، السرعة، وسهولة الاستخدام.',
      story_title: 'رؤيتنا',
      story_body: 'نطوّر منصة تجارة إلكترونية حديثة تركّز على تجربة العميل أولاً: تصميم مريح، أداء سريع، ومصداقية عالية في كل عملية شراء.',
      bullet_1: 'منتجات مختارة بعناية',
      bullet_2: 'شحن موثوق وسريع',
      bullet_3: 'دعم احترافي قبل وبعد الشراء',
      pillars_title: 'ما الذي يميزنا؟',
      pillar_1_title: 'ثقة وأمان',
      pillar_1_desc: 'حماية متقدمة للبيانات وعمليات الشراء.',
      pillar_2_title: 'لوجستيات ذكية',
      pillar_2_desc: 'تتبع شحنات واضح وتسليم سريع.',
      pillar_3_title: 'دعم فعّال',
      pillar_3_desc: 'فريق جاهز للمساعدة في أي وقت.',
      stat_1_value: '24/7',
      stat_1_label: 'دعم مستمر',
      stat_2_value: '48h',
      stat_2_label: 'شحن سريع',
      stat_3_value: '100%',
      stat_3_label: 'بوابة دفع آمنة',
      cta_title: 'جاهز لاستكشاف أحدث المنتجات؟',
      cta_body: 'ابدأ رحلتك الآن وتصفح أفضل العروض والفئات المصممة لتناسب احتياجاتك.',
      cta_primary_text: 'تصفح المنتجات',
      cta_primary_link: '/shop',
      cta_secondary_text: 'تواصل معنا',
      cta_secondary_link: '/contact'
    };
  }
  const fallbackTitle = `About ${settings?.site_name || 'TechStore'}`;
  return {
    eyebrow: 'About Us',
    title: bindSiteName(settings?.about_page_title || fallbackTitle, settings?.site_name),
    subtitle: settings?.about_page_subtitle || settings?.site_description || 'We build a smart shopping experience that blends quality, speed, and usability.',
    story_title: 'Our Vision',
    story_body: 'We are crafting a modern commerce platform focused on customer-first experience: comfortable design, fast performance, and trusted checkout.',
    bullet_1: 'Carefully curated products',
    bullet_2: 'Reliable and fast delivery',
    bullet_3: 'Professional pre and post-sale support',
    pillars_title: 'What Makes Us Different?',
    pillar_1_title: 'Trust & Security',
    pillar_1_desc: 'Advanced protection for customer data and transactions.',
    pillar_2_title: 'Smart Logistics',
    pillar_2_desc: 'Transparent shipment tracking and fast delivery.',
    pillar_3_title: 'Effective Support',
    pillar_3_desc: 'A dedicated team ready to help anytime.',
    stat_1_value: '24/7',
    stat_1_label: 'Live Support',
    stat_2_value: '48h',
    stat_2_label: 'Fast Shipping',
    stat_3_value: '100%',
    stat_3_label: 'Secure Checkout',
    cta_title: 'Ready to explore the latest products?',
    cta_body: 'Start now and browse top offers and categories tailored for your needs.',
    cta_primary_text: 'Browse Products',
    cta_primary_link: '/shop',
    cta_secondary_text: 'Contact Us',
    cta_secondary_link: '/contact'
  };
};

const getDefaultContactContent = (lang, settings = {}) => {
  if (lang === 'ar') {
    const fallbackTitle = 'نحن هنا لمساعدتك';
    return {
      eyebrow: 'تواصل معنا',
      title: bindSiteName(settings?.contact_page_title || fallbackTitle, settings?.site_name),
      subtitle: settings?.contact_page_subtitle || 'للاستفسارات، الدعم، أو التعاون التجاري يمكنك التواصل معنا عبر القنوات التالية.',
      support_title: 'دعم سريع وفعّال',
      support_body: 'فريقنا متاح للرد على جميع الأسئلة المتعلقة بالطلبات، المنتجات، والشحن.',
      hours_label: 'أوقات العمل',
      hours_value: 'يومياً 9:00 صباحاً - 11:00 مساءً',
      social_title: 'تابعنا على منصات التواصل',
      empty_message: 'قم بإضافة بيانات التواصل من لوحة الإعدادات.',
      location_note: 'يعمل متجرنا عالمياً عبر قنوات رقمية حديثة لتقديم تجربة تسوق أسرع.'
    };
  }
  const fallbackTitle = 'We are here to help';
  return {
    eyebrow: 'Contact',
    title: bindSiteName(settings?.contact_page_title || fallbackTitle, settings?.site_name),
    subtitle: settings?.contact_page_subtitle || 'For inquiries, support, or partnerships, reach us through the channels below.',
    support_title: 'Fast and Reliable Support',
    support_body: 'Our team is available to answer all questions about orders, products, and shipping.',
    hours_label: 'Working Hours',
    hours_value: 'Daily 9:00 AM - 11:00 PM',
    social_title: 'Follow us on social channels',
    empty_message: 'Add your contact details from the admin settings.',
    location_note: 'Our store operates digitally with modern channels to provide a faster shopping experience.'
  };
};

const AboutPageFallback = ({ lang, settings, content = null }) => {
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;
  const topBlobClass = lang === 'ar' ? 'left-0' : 'right-0';
  const bottomBlobClass = lang === 'ar' ? 'right-0' : 'left-0';
  const resolved = { ...getDefaultAboutContent(lang, settings), ...(content || {}) };
  const bullets = [resolved.bullet_1, resolved.bullet_2, resolved.bullet_3].filter(Boolean);
  const stats = [
    { value: resolved.stat_1_value, label: resolved.stat_1_label },
    { value: resolved.stat_2_value, label: resolved.stat_2_label },
    { value: resolved.stat_3_value, label: resolved.stat_3_label }
  ].filter((item) => item.value || item.label);
  const pillars = [
    { icon: ShieldCheck, title: resolved.pillar_1_title, desc: resolved.pillar_1_desc },
    { icon: Truck, title: resolved.pillar_2_title, desc: resolved.pillar_2_desc },
    { icon: Headphones, title: resolved.pillar_3_title, desc: resolved.pillar_3_desc }
  ].filter((item) => item.title || item.desc);

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 md:py-16 space-y-10 animate-fade-in">
      <section className="premium-panel relative overflow-hidden p-8 md:p-12">
        <div className={`absolute top-0 ${topBlobClass} w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none`}></div>
        <div className={`absolute bottom-0 ${bottomBlobClass} w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none`}></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {resolved.eyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-primary leading-tight">{resolved.title}</h1>
            <p className="text-secondary leading-relaxed text-lg">{resolved.subtitle}</p>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-primary">{resolved.story_title}</h2>
              <p className="text-secondary leading-relaxed">{resolved.story_body}</p>
              {bullets.length > 0 && (
                <ul className="space-y-2 pt-1">
                  {bullets.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-secondary">
                      <Check size={16} className="text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {stats.map((stat, idx) => (
                <div key={`${stat.label || 'stat'}-${idx}`} className="bg-card-soft border border-subtle rounded-2xl p-5 text-center shadow-soft">
                  <div className="text-3xl font-black text-primary">{stat.value}</div>
                  <div className="text-sm font-semibold text-secondary mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {pillars.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-black text-primary">{resolved.pillars_title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pillars.map((pillar, idx) => (
              <article key={`${pillar.title || 'pillar'}-${idx}`} className="premium-panel p-6 hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4">
                  <pillar.icon size={22} />
                </div>
                <h3 className="text-lg font-black text-primary mb-2">{pillar.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{pillar.desc}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="premium-panel p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h3 className="text-2xl font-black text-primary mb-2">{resolved.cta_title}</h3>
          <p className="text-secondary max-w-2xl">{resolved.cta_body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={resolved.cta_primary_link || '/shop'} className="ui-btn ui-btn-primary">
            {resolved.cta_primary_text}
            <ArrowIcon size={17} />
          </Link>
          <Link to={resolved.cta_secondary_link || '/contact'} className="ui-btn ui-btn-secondary">
            {resolved.cta_secondary_text}
          </Link>
        </div>
      </section>
    </div>
  );
};

const ContactPageFallback = ({ lang, settings, content = null }) => {
  const heroBlobClass = lang === 'ar' ? 'left-0' : 'right-0';
  const resolved = { ...getDefaultContactContent(lang, settings), ...(content || {}) };
  const cleanPhone = String(settings?.contact_phone || '').replace(/[^\d+]/g, '');
  const contactItems = [
    {
      key: 'phone',
      icon: Phone,
      title: lang === 'ar' ? 'الهاتف' : 'Phone',
      value: settings?.contact_phone || '',
      href: cleanPhone ? `tel:${cleanPhone}` : '',
      labelClassName: 'font-mono'
    },
    {
      key: 'email',
      icon: Mail,
      title: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: settings?.contact_email || '',
      href: settings?.contact_email ? `mailto:${settings.contact_email}` : '',
      labelClassName: ''
    },
    {
      key: 'whatsapp',
      icon: MessageCircle,
      title: 'WhatsApp',
      value: settings?.social_whatsapp || '',
      href: settings?.social_whatsapp || '',
      labelClassName: 'truncate'
    }
  ].filter((item) => Boolean(item.value));

  const socials = [
    { key: 'facebook', icon: Facebook, href: settings?.social_facebook, brand: 'hover:bg-[#1877F2] hover:text-white' },
    { key: 'instagram', icon: Instagram, href: settings?.social_instagram, brand: 'hover:bg-[#E4405F] hover:text-white' },
    { key: 'twitter', icon: Twitter, href: settings?.social_twitter, brand: 'hover:bg-[#111827] hover:text-white' },
    { key: 'youtube', icon: Youtube, href: settings?.social_youtube, brand: 'hover:bg-[#FF0000] hover:text-white' },
    { key: 'linkedin', icon: Linkedin, href: settings?.social_linkedin, brand: 'hover:bg-[#0A66C2] hover:text-white' }
  ].filter((item) => Boolean(item.href));

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 md:py-16 space-y-8 animate-fade-in">
      <section className="premium-panel relative overflow-hidden p-8 md:p-10">
        <div className={`absolute top-0 ${heroBlobClass} w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none`}></div>
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {resolved.eyebrow}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-primary leading-tight">{resolved.title}</h1>
          <p className="text-secondary max-w-3xl leading-relaxed text-lg">{resolved.subtitle}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {contactItems.length === 0 ? (
            <div className="premium-panel p-8 text-center text-secondary">{resolved.empty_message}</div>
          ) : (
            contactItems.map((item) => (
              <a
                key={item.key}
                href={item.href || undefined}
                target={item.key === 'whatsapp' ? '_blank' : undefined}
                rel={item.key === 'whatsapp' ? 'noreferrer' : undefined}
                className={`premium-panel p-5 flex items-center gap-4 transition-all ${item.href ? 'hover:-translate-y-0.5 hover:border-primary/40' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <item.icon size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-muted mb-0.5">{item.title}</div>
                  <div className={`text-primary font-bold ${item.labelClassName}`}>{item.value}</div>
                </div>
              </a>
            ))
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <article className="premium-panel p-6 space-y-4">
            <h3 className="text-xl font-black text-primary">{resolved.support_title}</h3>
            <p className="text-secondary leading-relaxed">{resolved.support_body}</p>
            <div className="rounded-2xl bg-card-soft border border-subtle p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">{resolved.hours_label}</div>
              <div className="text-primary font-semibold mt-1">{resolved.hours_value}</div>
            </div>
            <div className="rounded-2xl bg-card-soft border border-subtle p-4 flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-1 shrink-0" />
              <p className="text-sm text-secondary leading-relaxed">
                {settings?.site_name || 'TechStore'} {resolved.location_note}
              </p>
            </div>
          </article>

          {socials.length > 0 && (
            <article className="premium-panel p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">{resolved.social_title}</h4>
              <div className="flex flex-wrap gap-2">
                {socials.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-11 h-11 rounded-xl border border-subtle bg-card-soft text-secondary flex items-center justify-center transition-all ${social.brand}`}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
};

const normalizeSpecialOfferEntry = (offer = {}) => ({
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

const hasSpecialOfferEntryContent = (offer = {}) => {
  const normalized = normalizeSpecialOfferEntry(offer);
  return normalized.product_id > 0 || !!normalized.title || !!normalized.subtitle || !!normalized.image;
};

const parseSpecialOffersConfig = (settings = {}) => {
  const raw = settings?.special_offers_json;
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
    .map((offer) => normalizeSpecialOfferEntry(offer))
    .filter((offer) => hasSpecialOfferEntryContent(offer));
  if (normalized.length > 0) return normalized;

  const legacyOffer = normalizeSpecialOfferEntry({
    product_id: settings?.special_offer_product_id,
    start_at: settings?.special_offer_start_at,
    end_at: settings?.special_offer_end_at,
    badge: settings?.special_offer_badge,
    title: settings?.special_offer_title,
    subtitle: settings?.special_offer_subtitle,
    cta_text: settings?.special_offer_cta_text,
    cta_link: settings?.special_offer_cta_link,
    image: settings?.special_offer_image,
    discount_percent: settings?.special_offer_discount_percent,
    override_price: settings?.special_offer_override_price
  });
  return hasSpecialOfferEntryContent(legacyOffer) ? [legacyOffer] : [];
};

const normalizeOfferLink = (rawLink = '') => {
  const safe = String(rawLink || '').trim();
  if (!safe) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(safe)) return safe;
  return `/${safe.replace(/^\/+/, '')}`;
};

// --- DYNAMIC CMS PAGE RENDERER ---
export const DynamicPage = ({ addToCart, lang, settings, wishlistIds = [], onToggleWishlist = null }) => {
  const t = PUBLIC_TEXTS[lang];
  const isArabic = lang === 'ar';
  const currency = resolveCurrencySymbol(settings, t.currency);
  const cardInlineEndClass = isArabic ? 'left-4' : 'right-4';
  const cardInlineStartClass = isArabic ? 'right-3' : 'left-3';
  const canToggleWishlist = typeof onToggleWishlist === 'function';
  const siteName = String(settings?.site_name || '').trim() || 'TechStore';
  const { slug } = useParams();
  const pageSlug = slug || 'home';
  const [page, setPage] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerNowTs, setOfferNowTs] = useState(() => Date.now());
  const [offerSlideIndex, setOfferSlideIndex] = useState(0);
  const [specialOfferProductsById, setSpecialOfferProductsById] = useState({});

  useEffect(() => {
    const getBannerCount = () => {
      try {
        const parsed = JSON.parse(settings?.home_banners || '[]');
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    };
    const featuredCount = Math.max(4, Number(settings?.home_featured_count || 4));
    const productLimit = pageSlug === 'home' && getBannerCount() > 0 ? 100 : Math.max(8, featuredCount);
    setLoading(true);
    setPage(null);
    
    Promise.all([
      axios.get(`${API_URL}/pages/${pageSlug}`).catch(() => null),
      axios.get(`${API_URL}/products?limit=${productLimit}&published=1`),
      axios.get(`${API_URL}/categories`)
    ]).then(([pageRes, prodRes, catRes]) => {
      if (pageRes) setPage(pageRes.data);
      if (prodRes) setProducts(prodRes.data.data);
      if (catRes) setCategories(catRes.data || []);
      setLoading(false);
    });
  }, [pageSlug, settings?.home_banners, settings?.home_featured_count]);

  const isHome = pageSlug === 'home';
  const getBanners = () => {
    try {
      const parsed = JSON.parse(settings?.home_banners || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const banners = isHome ? getBanners() : [];
  const trustBadges = [
    { icon: Truck, title: lang === 'ar' ? 'شحن سريع' : 'Fast Delivery', desc: lang === 'ar' ? 'توصيل خلال 24-48 ساعة' : 'Delivered within 24-48 hours' },
    { icon: ShieldCheck, title: lang === 'ar' ? 'دفع آمن' : 'Secure Payment', desc: lang === 'ar' ? 'معاملات مشفرة بالكامل' : 'Fully encrypted transactions' },
    { icon: BadgeCheck, title: lang === 'ar' ? 'ضمان معتمد' : 'Certified Warranty', desc: lang === 'ar' ? 'ضمان يصل إلى 12 شهراً' : 'Up to 12 months warranty' },
    { icon: Headphones, title: lang === 'ar' ? 'دعم مميز' : 'Priority Support', desc: lang === 'ar' ? 'فريق جاهز لخدمتك' : 'A team ready to help' }
  ];

  const testimonials = [
    { name: lang === 'ar' ? 'سارة أحمد' : 'Sarah Ahmed', role: lang === 'ar' ? 'عميلة' : 'Customer', rating: 5, text: lang === 'ar' ? 'تجربة شراء ممتازة وخدمة عملاء رائعة. وصلت الشحنة بسرعة وبجودة عالية.' : 'Amazing buying experience and great support. Fast delivery and excellent quality.' },
    { name: lang === 'ar' ? 'عمر خالد' : 'Omar Khaled', role: lang === 'ar' ? 'رائد أعمال' : 'Entrepreneur', rating: 5, text: lang === 'ar' ? 'الموقع مرتب وسهل الاستخدام. المنتجات أصلية والأسعار منافسة.' : 'Clean, easy-to-use site. Authentic products and competitive pricing.' },
    { name: lang === 'ar' ? 'ليان محمود' : 'Lyan Mahmoud', role: lang === 'ar' ? 'مصممة' : 'Designer', rating: 4, text: lang === 'ar' ? 'تفاصيل المنتجات واضحة والخيارات كثيرة. تجربة ممتازة بشكل عام.' : 'Clear product details and plenty of options. Great overall experience.' }
  ];
  const showHeroSection = Number(settings?.show_hero_section) !== 0;
  const showTrustSection = Number(settings?.show_trust_section) !== 0;
  const showCategoriesSection = Number(settings?.show_categories_section) !== 0;
  const showTestimonialsSection = Number(settings?.show_testimonials_section) !== 0;
  const featuredCountOverride = Math.max(1, Number(settings?.home_featured_count || 4));
  const heroPrimaryCtaText = settings?.hero_primary_cta_text || t.shopNow;
  const heroPrimaryCtaLink = settings?.hero_primary_cta_link || '/shop';
  const heroSecondaryCtaText = settings?.hero_secondary_cta_text || t.about;
  const heroSecondaryCtaLink = settings?.hero_secondary_cta_link || '/about';
  const heroBadgeText = settings?.hero_badge_text || (lang === 'ar' ? 'تشكيلة الموسم الجديد' : 'New Season Collection');
  const trustSectionTitle = bindSiteName(settings?.trust_section_title || t.trustTitle, siteName);
  const trustSectionSubtitle = settings?.trust_section_subtitle || t.trustSubtitle;
  const categoriesSectionTitle = bindSiteName(settings?.categories_section_title || t.categoriesTitle, siteName);
  const categoriesSectionSubtitle = settings?.categories_section_subtitle || t.categoriesSubtitle;
  const testimonialsSectionTitle = bindSiteName(settings?.testimonials_section_title || t.testimonialsTitle, siteName);
  const testimonialsSectionSubtitle = settings?.testimonials_section_subtitle || t.testimonialsSubtitle;
  const specialOfferShowCountdown = Number(settings?.special_offer_show_countdown) === 1;
  const specialOfferShowPrice = Number(settings?.special_offer_show_price) === 1;
  const isSpecialOfferEnabled = Number(settings?.special_offer_enabled) === 1;
  const specialOffers = useMemo(() => parseSpecialOffersConfig(settings), [settings]);
  const offerDeck = useMemo(
    () => specialOffers.filter((offer) => {
      const end = parseDateTimeValue(offer?.end_at);
      return !end || offerNowTs <= end.getTime();
    }),
    [specialOffers, offerNowTs]
  );
  const currentOfferIndex = offerDeck.length > 0 ? offerSlideIndex % offerDeck.length : 0;
  const currentOffer = offerDeck[currentOfferIndex] || null;
  const currentOfferProductId = Math.max(0, Number(currentOffer?.product_id || 0));

  useEffect(() => {
    if (!isHome) return undefined;
    const timer = setInterval(() => setOfferNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isHome]);

  useEffect(() => {
    setOfferSlideIndex(0);
  }, [pageSlug, offerDeck.length]);

  useEffect(() => {
    if (!isHome || !isSpecialOfferEnabled || offerDeck.length <= 1) return undefined;
    const rotation = setInterval(() => {
      setOfferSlideIndex((prev) => (prev + 1) % offerDeck.length);
    }, 4500);
    return () => clearInterval(rotation);
  }, [isHome, isSpecialOfferEnabled, offerDeck.length]);

  useEffect(() => {
    if (!isHome) {
      setSpecialOfferProductsById({});
      return undefined;
    }

    const requiredIds = Array.from(
      new Set(specialOffers.map((offer) => Math.max(0, Number(offer?.product_id || 0))).values())
    ).filter((id) => id > 0);

    if (requiredIds.length === 0) {
      setSpecialOfferProductsById({});
      return undefined;
    }

    const fromList = {};
    requiredIds.forEach((id) => {
      const found = products.find((p) => Number(p?.id) === id);
      if (found) fromList[id] = found;
    });

    setSpecialOfferProductsById((prev) => ({ ...prev, ...fromList }));
    const missingIds = requiredIds.filter((id) => !fromList[id]);
    if (missingIds.length === 0) return undefined;

    let mounted = true;
    Promise.all(
      missingIds.map((id) => (
        axios.get(`${API_URL}/products/${id}?published=1`)
          .then((res) => ({ id, product: res.data || null }))
          .catch(() => ({ id, product: null }))
      ))
    ).then((rows) => {
      if (!mounted) return;
      setSpecialOfferProductsById((prev) => {
        const next = { ...prev };
        rows.forEach(({ id, product }) => {
          if (product) next[id] = product;
        });
        return next;
      });
    });

    return () => { mounted = false; };
  }, [isHome, specialOffers, products]);

  const currentOfferProduct = currentOfferProductId > 0
    ? (specialOfferProductsById[currentOfferProductId] || products.find((p) => Number(p?.id) === currentOfferProductId) || null)
    : null;
  const currentOfferSettings = currentOffer ? {
    ...settings,
    special_offer_enabled: isSpecialOfferEnabled ? 1 : 0,
    special_offer_product_id: currentOfferProductId,
    special_offer_start_at: currentOffer?.start_at || '',
    special_offer_end_at: currentOffer?.end_at || '',
    special_offer_discount_percent: Number(currentOffer?.discount_percent || 0),
    special_offer_override_price: Number(currentOffer?.override_price || 0)
  } : settings;
  const specialOfferPricing = resolveSpecialOfferPricing({
    settings: currentOfferSettings,
    product: currentOfferProduct,
    nowTs: offerNowTs
  });
  const specialOfferBasePrice = specialOfferPricing.regularPrice;
  const specialOfferPrice = specialOfferPricing.finalPrice;
  const specialOfferSavings = specialOfferPricing.savings;
  const specialOfferDiscountPercent = specialOfferPricing.discountPercent;
  const hasSpecialOfferContent = Boolean(
    currentOfferProduct
    || currentOffer?.image
    || currentOffer?.title
    || currentOffer?.subtitle
  );
  const shouldRenderSpecialOfferCard = isHome && isSpecialOfferEnabled && !!currentOffer && hasSpecialOfferContent && !specialOfferPricing.isExpired;
  const shouldRenderComingSoonCard = isHome && (!isSpecialOfferEnabled || !shouldRenderSpecialOfferCard);
  const isComingSoonCard = shouldRenderComingSoonCard && !shouldRenderSpecialOfferCard;
  const isSpecialOfferActive = shouldRenderSpecialOfferCard && specialOfferPricing.isActive;
  const isSpecialOfferUpcoming = shouldRenderSpecialOfferCard && !specialOfferPricing.isActive && !specialOfferPricing.isStarted;
  const specialOfferCtaText = currentOffer?.cta_text || (lang === 'ar' ? 'احصل على العرض' : 'Get Offer');
  const specialOfferCtaLink = normalizeOfferLink(currentOffer?.cta_link) || (currentOfferProduct ? `/product/${currentOfferProduct.id}` : '/shop');
  const specialOfferBadgeText = currentOffer?.badge || (lang === 'ar' ? 'عرض محدود' : 'Limited Offer');
  const specialOfferTitleText = currentOffer?.title || (currentOfferProduct?.name || (lang === 'ar' ? 'عرض خاص' : 'Special Offer'));
  const specialOfferSubtitleText = currentOffer?.subtitle || (lang === 'ar' ? 'لفترة محدودة' : 'For a limited time');
  const specialOfferImage = currentOffer?.image || currentOfferProduct?.image_url || '';
  const comingSoonBadgeText = lang === 'ar' ? 'قريباً' : 'Coming Soon';
  const comingSoonTitleText = lang === 'ar' ? 'عروض قوية في الطريق' : 'Exciting Deals Are Coming';
  const comingSoonSubtitleText = lang === 'ar'
    ? 'استعد لعروض حصرية قريباً. خليك متابع وما يفوتك الجديد.'
    : 'Stay tuned for fresh exclusive offers. More surprises are on the way.';
  const comingSoonCtaText = lang === 'ar' ? 'تصفّح المنتجات الآن' : 'Browse Products';
  const comingSoonCtaLink = '/shop';
  const offerCardBadgeText = isComingSoonCard ? comingSoonBadgeText : specialOfferBadgeText;
  const offerCardTitleText = isComingSoonCard ? comingSoonTitleText : specialOfferTitleText;
  const offerCardSubtitleText = isComingSoonCard ? comingSoonSubtitleText : specialOfferSubtitleText;
  const offerCardCtaText = isComingSoonCard ? comingSoonCtaText : specialOfferCtaText;
  const offerCardCtaLink = isComingSoonCard ? comingSoonCtaLink : specialOfferCtaLink;
  const siteLogoImage = String(settings?.invoice_logo || '').trim();
  const offerCardImage = isComingSoonCard ? siteLogoImage : (specialOfferImage || siteLogoImage);
  const canManuallySwitchOffers = !isComingSoonCard && offerDeck.length > 1;
  const prevOfferIcon = lang === 'ar' ? ArrowRight : ArrowLeft;
  const nextOfferIcon = lang === 'ar' ? ArrowLeft : ArrowRight;
  const goToOffer = (targetIndex) => {
    if (!canManuallySwitchOffers) return;
    const total = offerDeck.length;
    const normalized = ((targetIndex % total) + total) % total;
    setOfferSlideIndex(normalized);
  };
  const goToPrevOffer = () => goToOffer(currentOfferIndex - 1);
  const goToNextOffer = () => goToOffer(currentOfferIndex + 1);
  const shouldShowOfferPrice = !isComingSoonCard && specialOfferShowPrice && specialOfferPrice > 0;
  const specialOfferCountdownTarget = isSpecialOfferUpcoming
    ? parseDateTimeValue(currentOffer?.start_at)
    : (isSpecialOfferActive ? parseDateTimeValue(currentOffer?.end_at) : null);
  const hasSpecialOfferCountdown = !!specialOfferCountdownTarget;
  const shouldShowOfferCountdown = !isComingSoonCard && specialOfferShowCountdown && hasSpecialOfferCountdown;
  const specialOfferCountdownLabel = isSpecialOfferUpcoming
    ? (lang === 'ar' ? 'يبدأ بعد' : 'Starts in')
    : (lang === 'ar' ? 'ينتهي بعد' : 'Ends in');
  const specialOfferCountdownMs = hasSpecialOfferCountdown ? Math.max(0, specialOfferCountdownTarget.getTime() - offerNowTs) : 0;
  const specialOfferCountdown = {
    days: Math.floor(specialOfferCountdownMs / 86400000),
    hours: Math.floor((specialOfferCountdownMs % 86400000) / 3600000),
    minutes: Math.floor((specialOfferCountdownMs % 3600000) / 60000),
    seconds: Math.floor((specialOfferCountdownMs % 60000) / 1000)
  };
  const hasCmsBlocks = Array.isArray(page?.blocks) && page.blocks.length > 0;
  const shouldRenderAboutFallback = pageSlug === 'about' && (!page || !hasCmsBlocks);
  const shouldRenderContactFallback = pageSlug === 'contact' && (!page || !hasCmsBlocks);
  const heroPrimaryBlobClass = isArabic
    ? 'absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 opacity-70 pointer-events-none'
    : 'absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none';
  const heroSecondaryBlobClass = isArabic
    ? 'absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/4 opacity-70 pointer-events-none'
    : 'absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-70 pointer-events-none';

  if (loading) return <PageSkeleton />;
  if (shouldRenderAboutFallback) return <AboutPageFallback lang={lang} settings={settings} />;
  if (shouldRenderContactFallback) return <ContactPageFallback lang={lang} settings={settings} />;
  
  if (!page) return (
    <section className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4" aria-labelledby="dynamic-page-notfound-title">
      <h1 id="dynamic-page-notfound-title" className="text-4xl font-black text-primary mb-2">404</h1>
      <p className="text-muted mb-6">{t.errorPage}</p>
      <Link to="/" className="text-primary font-bold hover:underline">{t.backHome}</Link>
    </section>
  );

  return (
    <article className="animate-fade-in" aria-label={page?.title || pageSlug}>
      {page.blocks.map((block, idx) => (
        <div key={idx}>
          
          {/* 1. HERO SECTION (Light & Split Layout) */}
          {block.type === 'hero' && (!isHome || showHeroSection) && (
            <>
              <div className="relative bg-card overflow-hidden py-20 lg:py-28">
                {/* Soft Background Blobs */}
                <div className={heroPrimaryBlobClass}></div>
                <div className={heroSecondaryBlobClass}></div>

                <div className="container mx-auto px-6 max-w-7xl relative z-10">
                  <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    
                    {/* Text Content */}
                    <div className="flex-1 text-center lg:text-start space-y-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mx-auto lg:mx-0">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        {heroBadgeText}
                      </div>
                      
                      <h1 className="text-5xl lg:text-7xl font-black text-primary leading-[1.1] tracking-tight">
                        {bindSiteName(isHome && settings?.hero_title ? settings.hero_title : block.content.title, siteName)}
                      </h1>
                      
                      <p className="text-lg text-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
                        {isHome && settings?.hero_subtitle ? settings.hero_subtitle : block.content.subtitle}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                        <Link to={isHome ? heroPrimaryCtaLink : '/shop'} className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:opacity-90 hover:-translate-y-1 transition-all shadow-xl">
                          {isHome ? heroPrimaryCtaText : t.shopNow}
                        </Link>
                        <Link to={isHome ? heroSecondaryCtaLink : '/about'} className="px-8 py-4 bg-card text-secondary border border-subtle rounded-xl font-bold hover:bg-card-soft hover:border-primary/40 transition-all">
                          {isHome ? heroSecondaryCtaText : t.about}
                        </Link>
                      </div>
                    </div>

                    {/* Image / Timed Special Offer (Visual) */}
                    <div className="flex-1 w-full max-w-xl lg:max-w-none">
                      {(shouldRenderSpecialOfferCard || shouldRenderComingSoonCard) ? (
                        <div className="relative rounded-[2.5rem] overflow-hidden border border-primary/25 bg-card shadow-lift">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/20 pointer-events-none"></div>
                          <div className="relative p-6 sm:p-8">
                            <div className="flex items-start justify-between gap-3 mb-5">
                              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/25 px-3 py-1 text-xs font-bold text-primary">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                {offerCardBadgeText}
                              </span>
                              {!isComingSoonCard && isSpecialOfferActive && specialOfferDiscountPercent > 0 && (
                                <span className="inline-flex items-center rounded-full bg-red-500 text-white px-3 py-1 text-xs font-black">
                                  -{specialOfferDiscountPercent.toFixed(0)}%
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                              <div className="space-y-4">
                                <h3 className="text-2xl md:text-3xl font-black text-primary leading-tight">
                                  {offerCardTitleText}
                                </h3>
                                <p className="text-sm md:text-base text-secondary leading-relaxed">
                                  {offerCardSubtitleText}
                                </p>
                                {!isComingSoonCard && isSpecialOfferUpcoming && (
                                  <span className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 px-2.5 py-1 text-xs font-bold">
                                    {lang === 'ar' ? 'يبدأ قريباً' : 'Starts soon'}
                                  </span>
                                )}

                                {shouldShowOfferPrice && (
                                  <div className="flex items-end gap-3 flex-wrap">
                                    <span className="text-2xl md:text-3xl font-black text-primary">
                                      {currency}{specialOfferPrice.toFixed(2)}
                                    </span>
                                    {isSpecialOfferActive && specialOfferBasePrice > 0 && specialOfferPrice < specialOfferBasePrice && (
                                      <span className="text-sm text-muted line-through">
                                        {currency}{specialOfferBasePrice.toFixed(2)}
                                      </span>
                                    )}
                                    {specialOfferSavings > 0 && (
                                      <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-1">
                                        {lang === 'ar' ? 'وفّر' : 'Save'} {currency}{specialOfferSavings.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <Link
                                  to={offerCardCtaLink}
                                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-primary text-white font-bold shadow-soft hover:opacity-95 hover:-translate-y-0.5 transition-all"
                                >
                                  {offerCardCtaText}
                                </Link>

                                {shouldShowOfferCountdown && (
                                  <div className="pt-2">
                                    <div className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">
                                      {specialOfferCountdownLabel}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      {[
                                        { key: 'days', label: lang === 'ar' ? 'يوم' : 'D' },
                                        { key: 'hours', label: lang === 'ar' ? 'ساعة' : 'H' },
                                        { key: 'minutes', label: lang === 'ar' ? 'دقيقة' : 'M' },
                                        { key: 'seconds', label: lang === 'ar' ? 'ثانية' : 'S' }
                                      ].map((part) => (
                                        <div key={part.key} className="rounded-xl bg-card-soft border border-subtle px-2 py-2 text-center">
                                          <div className="text-base md:text-lg font-black text-primary">
                                            {String(specialOfferCountdown[part.key]).padStart(2, '0')}
                                          </div>
                                          <div className="text-[10px] font-bold text-muted uppercase tracking-wide">
                                            {part.label}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {canManuallySwitchOffers ? (
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={goToPrevOffer}
                                      className="w-7 h-7 rounded-full border border-subtle bg-card-soft text-secondary hover:text-primary hover:border-primary/35 transition flex items-center justify-center"
                                      aria-label={lang === 'ar' ? 'العرض السابق' : 'Previous offer'}
                                      title={lang === 'ar' ? 'العرض السابق' : 'Previous offer'}
                                    >
                                      {React.createElement(prevOfferIcon, { size: 14 })}
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                      {offerDeck.map((offer, offerIdx) => (
                                        <button
                                          key={`offer-dot-${offer.product_id || offerIdx}-${offerIdx}`}
                                          type="button"
                                          onClick={() => goToOffer(offerIdx)}
                                          className={`h-1.5 rounded-full transition-all ${offerIdx === currentOfferIndex ? 'w-6 bg-primary' : 'w-2 bg-primary/30 hover:bg-primary/50'}`}
                                          aria-label={lang === 'ar' ? `الانتقال للعرض ${offerIdx + 1}` : `Go to offer ${offerIdx + 1}`}
                                          title={lang === 'ar' ? `العرض ${offerIdx + 1}` : `Offer ${offerIdx + 1}`}
                                        />
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={goToNextOffer}
                                      className="w-7 h-7 rounded-full border border-subtle bg-card-soft text-secondary hover:text-primary hover:border-primary/35 transition flex items-center justify-center"
                                      aria-label={lang === 'ar' ? 'العرض التالي' : 'Next offer'}
                                      title={lang === 'ar' ? 'العرض التالي' : 'Next offer'}
                                    >
                                      {React.createElement(nextOfferIcon, { size: 14 })}
                                    </button>
                                  </div>
                                ) : null}
                              </div>

                              <Link
                                to={offerCardCtaLink}
                                className="block relative rounded-3xl overflow-hidden aspect-[4/3] bg-card-soft border border-subtle group"
                              >
                                {offerCardImage ? (
                                  <img
                                    src={offerCardImage}
                                    alt={currentOfferProduct?.name || (isComingSoonCard ? 'Offers coming soon' : 'Special Offer')}
                                    className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-[1.02] transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-primary/70">
                                    <Box size={52} />
                                  </div>
                                )}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : ((isHome && settings?.hero_image) || block.content.image) ? (
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-subtle rotate-2 hover:rotate-0 transition-transform duration-700 bg-card-soft aspect-[4/3]">
                          <img src={(isHome && settings?.hero_image) ? settings.hero_image : block.content.image} className="absolute inset-0 w-full h-full object-cover" alt="Hero"/>
                        </div>
                      ) : (
                        // Placeholder Art if no image
                        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-tr from-primary/10 to-primary/5 aspect-[4/3] flex items-center justify-center">
                          <Box size={64} className="text-primary opacity-50"/>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isHome && showTrustSection && (
                <section className="py-16 bg-card border-t border-subtle">
                  <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                      <div className="w-full md:w-auto text-start">
                        <h2 className="text-2xl sm:text-3xl font-black text-primary">{trustSectionTitle}</h2>
                        <p className="text-muted mt-2 max-w-2xl">{trustSectionSubtitle}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {trustBadges.map((badge, idx) => {
                        const Icon = badge.icon;
                        return (
                          <div key={idx} className="bg-card border border-subtle rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                              <Icon size={22}/>
                            </div>
                            <h3 className="font-bold text-primary mb-2">{badge.title}</h3>
                            <p className="text-sm text-muted">{badge.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {isHome && showCategoriesSection && categories.length > 0 && (
                <section className="py-16 bg-card-soft">
                  <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                      <div className="w-full md:w-auto text-start">
                        <h2 className="text-2xl sm:text-3xl font-black text-primary">{categoriesSectionTitle}</h2>
                        <p className="text-muted mt-2 max-w-2xl">{categoriesSectionSubtitle}</p>
                      </div>
                      <Link to="/shop" className="self-start md:self-auto text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors">
                        {t.shop}
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {categories.slice(0, 6).map((cat, idx) => (
                        <Link
                          to={`/shop?category=${encodeURIComponent(cat.name)}`}
                          key={cat.id || idx}
                          className="group product-card !rounded-2xl !p-3 sm:!p-4 overflow-hidden"
                        >
                          <div className="relative aspect-[16/10] bg-card-soft border border-subtle rounded-xl flex items-center justify-center overflow-hidden">
                            {cat.image_url ? (
                              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                            ) : (
                              <div className="w-12 h-12 rounded-xl border border-subtle bg-card flex items-center justify-center text-primary/70">
                                <Box size={24} />
                              </div>
                            )}
                          </div>
                          <div className="pt-3 sm:pt-4">
                            <h3 className="text-lg font-black text-primary leading-tight">{cat.name}</h3>
                            <p className="text-sm text-muted mt-1 leading-relaxed max-h-10 overflow-hidden">
                              {cat.description || (lang === 'ar' ? 'اكتشف أفضل الخيارات داخل هذا القسم.' : 'Discover top picks in this category.')}
                            </p>
                            <span className="mt-3 inline-flex items-center rounded-full border border-subtle bg-card-soft px-3 py-1 text-xs font-bold text-primary">
                              {lang === 'ar' ? 'تسوق الآن' : 'Shop now'}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {block.type === 'about_layout' && (
            <AboutPageFallback lang={lang} settings={settings} content={block.content || {}} />
          )}

          {block.type === 'contact_layout' && (
            <ContactPageFallback lang={lang} settings={settings} content={block.content || {}} />
          )}

          {/* 2. TEXT SECTION (Minimal) */}
          {block.type === 'text' && (
            <div className="py-24 bg-card-soft">
              <div className="container mx-auto px-6 max-w-4xl text-center">
                <div className="prose prose-lg prose-slate mx-auto text-secondary leading-loose" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(block.content.body) }} />
              </div>
            </div>
          )}

          {/* 3. PRODUCT GRID (Clean & Tidy) */}
          {block.type === 'grid' && (
            <div id="shop-section" className="py-24 bg-card">
              <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b border-subtle pb-6">
                  <div className="w-full md:w-auto text-start">
                    <h2 className="text-2xl sm:text-3xl font-black text-primary">{block.content.title || t.featured}</h2>
                    <p className="text-muted mt-2">تسوق أحدث المنتجات المضافة حديثاً</p>
                  </div>
                  <Link to="/cart" className="self-start md:self-auto text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors">
                    مشاهدة الكل
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                  {products.slice(0, isHome ? featuredCountOverride : (block.content.count || 4)).map(product => {
                    const cardPricing = getProductDisplayPricing({ settings, product, nowTs: offerNowTs });
                    const hasVariants = Number(product?.has_variants) === 1;
                    const isWishlisted = wishlistIds.includes(Number(product.id));
                    const hasHoverImage = Boolean(product?.hover_image_url && product.hover_image_url !== product.image_url);
                    return (
                    <div key={product.id} className="product-card group relative">
                      {/* Image Card */}
                      <Link to={`/product/${product.id}`} className="block relative aspect-[1/1.1] bg-card-soft rounded-3xl overflow-hidden mb-5">
                        {product.image_url ? (
                          <>
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${hasHoverImage ? 'opacity-100 group-hover:opacity-0' : 'group-hover:scale-105'}`}
                            />
                            {hasHoverImage && (
                              <img
                                src={product.hover_image_url}
                                alt={`${product.name} hover`}
                                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted"><Box size={32}/></div>
                        )}
                        
                        {/* Quick Add Button (Appears on Hover) */}
                        <button 
                          onClick={(e) => { e.preventDefault(); addToCart(product); }}
                          className={`absolute bottom-4 ${cardInlineEndClass} w-10 h-10 bg-card text-primary rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white`}
                          title={t.addToCart}
                        >
                          <Plus size={20}/>
                        </button>

                        {canToggleWishlist && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              onToggleWishlist(product.id);
                            }}
                            className={`absolute bottom-4 ${cardInlineStartClass} w-10 h-10 rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ${isWishlisted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-card text-primary hover:bg-red-500 hover:text-white'}`}
                            title={t.wishlist}
                            aria-label={t.wishlist}
                          >
                            <Heart size={18} className={isWishlisted ? 'fill-white' : ''} />
                          </button>
                        )}

                        {/* Status Badge */}
                        {product.stock_quantity === 0 && !hasVariants && (
                          <span className={`absolute top-3 ${cardInlineStartClass} bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md`}>
                            {t.outOfStock}
                          </span>
                        )}
                      </Link>
                      
                      {/* Info */}
                      <div>
                        <div className="text-xs font-bold text-muted mb-1 uppercase tracking-wide">{product.category}</div>
                        <h3 className="font-bold text-primary text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-primary">{currency}{cardPricing.finalPrice.toFixed(2)}</span>
                          {cardPricing.hasDiscount && (
                            <span className="text-sm text-muted line-through">{currency}{cardPricing.regularPrice.toFixed(2)}</span>
                          )}
                          {hasVariants && <span className="text-[10px] text-muted bg-card-soft px-1.5 py-0.5 rounded">خيارات</span>}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {isHome && banners.length > 0 && (
        <div className="space-y-16 py-6">
          {banners.map((banner, idx) => {
            const bannerProducts = (banner.category
              ? products.filter(p => p.category === banner.category)
              : products
            ).slice(0, banner.count || 4);

            return (
              <section key={banner.id || idx} className="py-16 bg-card-soft">
                <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-b border-subtle pb-6">
                    <div className="w-full md:w-auto text-start">
                      <h2 className="text-2xl sm:text-3xl font-black text-primary">{banner.title || t.featured}</h2>
                      <p className="text-muted mt-2">{banner.category || ''}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {bannerProducts.map(product => {
                      const cardPricing = getProductDisplayPricing({ settings, product, nowTs: offerNowTs });
                      const hasVariants = Number(product?.has_variants) === 1;
                      const isWishlisted = wishlistIds.includes(Number(product.id));
                      const hasHoverImage = Boolean(product?.hover_image_url && product.hover_image_url !== product.image_url);
                      return (
                      <div key={product.id} className="product-card group relative">
                        <Link to={`/product/${product.id}`} className="block relative aspect-[1/1.1] bg-card-soft rounded-3xl overflow-hidden mb-5">
                          {product.image_url ? (
                            <>
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${hasHoverImage ? 'opacity-100 group-hover:opacity-0' : 'group-hover:scale-105'}`}
                              />
                              {hasHoverImage && (
                                <img
                                  src={product.hover_image_url}
                                  alt={`${product.name} hover`}
                                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                />
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted"><Box size={32}/></div>
                          )}
                          <button 
                            onClick={(e) => { e.preventDefault(); addToCart(product); }}
                            className={`absolute bottom-4 ${cardInlineEndClass} w-10 h-10 bg-card text-primary rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white`}
                            title={t.addToCart}
                          >
                            <Plus size={20}/>
                          </button>
                          {canToggleWishlist && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                onToggleWishlist(product.id);
                              }}
                              className={`absolute bottom-4 ${cardInlineStartClass} w-10 h-10 rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ${isWishlisted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-card text-primary hover:bg-red-500 hover:text-white'}`}
                              title={t.wishlist}
                              aria-label={t.wishlist}
                            >
                              <Heart size={18} className={isWishlisted ? 'fill-white' : ''} />
                            </button>
                          )}
                        </Link>
                        <div>
                          <div className="text-xs font-bold text-muted mb-1 uppercase tracking-wide">{product.category}</div>
                          <h3 className="font-bold text-primary text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                            <Link to={`/product/${product.id}`}>{product.name}</Link>
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-primary">{currency}{cardPricing.finalPrice.toFixed(2)}</span>
                            {cardPricing.hasDiscount && (
                              <span className="text-sm text-muted line-through">{currency}{cardPricing.regularPrice.toFixed(2)}</span>
                            )}
                            {hasVariants && <span className="text-[10px] text-muted bg-card-soft px-1.5 py-0.5 rounded">خيارات</span>}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {isHome && showTestimonialsSection && (
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div className="w-full md:w-auto text-start">
                <h2 className="text-2xl sm:text-3xl font-black text-primary">{testimonialsSectionTitle}</h2>
                <p className="text-muted mt-2 max-w-2xl">{testimonialsSectionSubtitle}</p>
              </div>
              <div className="self-start md:self-auto flex items-center gap-2 text-primary text-sm font-bold">
                <Quote size={18}/> {lang === 'ar' ? 'قصص نجاح حقيقية' : 'Real success stories'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item, idx) => (
                <div key={idx} className="bg-card-soft border border-subtle rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {item.name?.[0] || 'T'}
                      </div>
                      <div>
                        <div className="font-bold text-primary">{item.name}</div>
                        <div className="text-xs text-muted">{item.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className={i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-secondary leading-relaxed">"{item.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
};

// --- SHOP PAGE (Search + Filters) ---


