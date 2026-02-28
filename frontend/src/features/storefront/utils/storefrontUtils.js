const detectFaviconType = (href = '') => {
  const src = String(href || '').toLowerCase();
  if (src.includes('.svg')) return 'image/svg+xml';
  if (src.includes('.png')) return 'image/png';
  if (src.includes('.ico')) return 'image/x-icon';
  if (src.includes('.jpg') || src.includes('.jpeg')) return 'image/jpeg';
  if (src.includes('.webp')) return 'image/webp';
  return 'image/png';
};

const CURRENCY_SYMBOLS_BY_CODE = {
  AED: 'AED',
  EUR: 'EUR',
  EGP: 'EGP',
  GBP: 'GBP',
  SAR: 'SAR',
  USD: '$'
};

const setFavicon = (href) => {
  if (typeof document === 'undefined') return;
  const iconHref = href && String(href).trim() ? String(href).trim() : '/vite.svg';
  const iconType = detectFaviconType(iconHref);
  const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];

  rels.forEach((relValue) => {
    let link = document.head.querySelector(`link[rel="${relValue}"]`);
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', relValue);
      document.head.appendChild(link);
    }
    link.setAttribute('href', iconHref);
    link.setAttribute('type', iconType);
  });
};

const setRuntimeCustomCss = (cssText = '') => {
  if (typeof document === 'undefined') return;
  const styleId = 'runtime-custom-css';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.setAttribute('id', styleId);
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssText || '';
};

const isValidCssColor = (value = '') => {
  if (typeof window === 'undefined' || !window.CSS || !window.CSS.supports) return false;
  return window.CSS.supports('color', String(value).trim());
};

const looksLikeDefaultPrimaryBlue = (value = '') => {
  const normalized = String(value || '').replace(/\s+/g, '').toLowerCase();
  return (
    normalized === '#2563eb' ||
    normalized === 'rgb(37,99,235)' ||
    normalized === 'rgba(37,99,235,1)'
  );
};

const deriveStrongBrandColor = (color) => `color-mix(in srgb, ${color} 82%, #0f172a)`;

export const sanitizeRichHtml = (html) => {
  const raw = String(html || '');
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return raw;

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');
  const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form'];
  blockedTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = String(attr.name || '').toLowerCase();
      const value = String(attr.value || '').trim();
      const lowerValue = value.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if (name === 'href' || name === 'src') {
        const isAllowed = (
          lowerValue.startsWith('http://')
          || lowerValue.startsWith('https://')
          || lowerValue.startsWith('/')
          || lowerValue.startsWith('#')
          || lowerValue.startsWith('mailto:')
          || lowerValue.startsWith('tel:')
        );
        if (!isAllowed) {
          el.removeAttribute(attr.name);
        }
      }
    });
  });

  return doc.body.innerHTML;
};

export const applyTheme = (settings, lang) => {
  const root = document.documentElement;
  const primaryColor = String(settings?.primary_color || '').trim();
  if (primaryColor && isValidCssColor(primaryColor)) {
    const strongColor = deriveStrongBrandColor(primaryColor);
    root.style.setProperty('--brand-primary', primaryColor);
    root.style.setProperty('--brand-primary-strong', strongColor);
    root.style.setProperty('--accent-primary', primaryColor);
    root.style.setProperty('--accent-primary-strong', strongColor);
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-primary-600', `color-mix(in srgb, ${primaryColor} 86%, #111827)`);
    root.style.setProperty('--color-primary-700', `color-mix(in srgb, ${primaryColor} 72%, #111827)`);
    root.style.setProperty('--focus-ring', `color-mix(in srgb, ${primaryColor} 34%, transparent)`);

    if (import.meta.env.DEV && !looksLikeDefaultPrimaryBlue(primaryColor)) {
      const computedAccent = getComputedStyle(root).getPropertyValue('--accent-primary').trim();
      if (looksLikeDefaultPrimaryBlue(computedAccent)) {
        console.warn('[theme] primary_color is set but --accent-primary is still default blue. Check token pipeline.');
      }
    }
  }
  if (settings.site_name) {
    document.title = settings.site_name;
  }
  setFavicon(settings?.invoice_logo);
  setRuntimeCustomCss(settings?.custom_css);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

export const resolveCurrencySymbol = (settings = {}, fallback = '$') => {
  const explicitSymbol = String(settings?.currency_symbol || '').trim();
  if (explicitSymbol) return explicitSymbol;

  const currencyCode = String(settings?.currency || '').trim().toUpperCase();
  if (!currencyCode) return fallback;

  return CURRENCY_SYMBOLS_BY_CODE[currencyCode] || currencyCode;
};

export const parseDateTimeValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const clampPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, num));
};

const parseSpecialOffersJson = (settings = {}) => {
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

  return parsed
    .map((offer = {}) => ({
      product_id: Math.max(0, Math.trunc(Number(offer?.product_id || offer?.special_offer_product_id || 0))),
      start_at: String(offer?.start_at || offer?.special_offer_start_at || '').trim(),
      end_at: String(offer?.end_at || offer?.special_offer_end_at || '').trim(),
      discount_percent: clampPercent(offer?.discount_percent ?? offer?.special_offer_discount_percent),
      override_price: Math.max(0, Number(offer?.override_price ?? offer?.special_offer_override_price ?? 0))
    }))
    .filter((offer) => offer.product_id > 0);
};

export const resolveSpecialOfferPricing = ({ settings, product, variant = null, nowTs = Date.now() }) => {
  const regularPriceRaw = Number(variant ? variant?.price : product?.base_price);
  const regularPrice = Number.isFinite(regularPriceRaw) ? Math.max(0, regularPriceRaw) : 0;
  const productId = Math.max(0, Math.trunc(Number(product?.id || 0)));
  const isEnabled = Number(settings?.special_offer_enabled) === 1;

  const offers = parseSpecialOffersJson(settings);
  const matchedOffer = productId > 0 ? (offers.find((offer) => offer.product_id === productId) || null) : null;

  const legacyProductId = Math.max(0, Math.trunc(Number(settings?.special_offer_product_id || 0)));
  const isLegacyTarget = legacyProductId > 0 && productId === legacyProductId;
  const isTargetProduct = Boolean(matchedOffer) || isLegacyTarget;

  const specialOfferStart = parseDateTimeValue(matchedOffer ? matchedOffer.start_at : settings?.special_offer_start_at);
  const specialOfferEnd = parseDateTimeValue(matchedOffer ? matchedOffer.end_at : settings?.special_offer_end_at);
  const isStarted = !specialOfferStart || nowTs >= specialOfferStart.getTime();
  const isExpired = !!specialOfferEnd && nowTs > specialOfferEnd.getTime();
  const isActive = Boolean(product && isEnabled && isTargetProduct && isStarted && !isExpired);
  const discountPercent = matchedOffer
    ? clampPercent(matchedOffer.discount_percent)
    : clampPercent(settings?.special_offer_discount_percent);
  const overridePriceRaw = matchedOffer
    ? Number(matchedOffer.override_price || 0)
    : Number(settings?.special_offer_override_price || 0);
  const overridePrice = Number.isFinite(overridePriceRaw) ? Math.max(0, overridePriceRaw) : 0;
  const discountedPrice = Math.max(0, regularPrice * (1 - (discountPercent / 100)));
  const preliminaryOfferPrice = overridePrice > 0 ? overridePrice : discountedPrice;
  const offerPrice = Math.min(preliminaryOfferPrice, regularPrice || preliminaryOfferPrice);
  const finalPrice = isActive ? offerPrice : regularPrice;
  const savings = Math.max(0, regularPrice - finalPrice);

  return {
    isActive,
    isStarted,
    isExpired,
    regularPrice,
    finalPrice,
    savings,
    hasDiscount: savings > 0.0001,
    discountPercent,
    specialOfferStart,
    specialOfferEnd
  };
};

export const getProductDisplayPricing = ({ settings, product, nowTs = Date.now() }) => {
  const pricing = resolveSpecialOfferPricing({ settings, product, nowTs });
  return {
    finalPrice: Number(pricing.finalPrice || 0),
    regularPrice: Number(pricing.regularPrice || 0),
    hasDiscount: Boolean(pricing.hasDiscount)
  };
};

const parseGalleryImages = (value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

export const buildProductGallery = (product) => {
  const allImages = [
    product?.image_url,
    product?.hover_image_url,
    ...parseGalleryImages(product?.gallery_images_json)
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return Array.from(new Set(allImages));
};

export const bindSiteName = (value, siteName) => {
  const brand = String(siteName || '').trim() || 'TechStore';
  const source = String(value || '').trim();
  if (!source) return brand;
  return source
    .replace(/\{site_name\}/gi, brand)
    .replace(/TechStore/gi, brand);
};

