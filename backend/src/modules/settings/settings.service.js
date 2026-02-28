import { normalizeUploadAssetUrl } from '../../utils/assetUrl.js';

const SETTING_COLUMNS = [
  'shipping_cost',
  'tax_rate',
  'currency',
  'free_shipping_threshold',
  'site_name',
  'site_tagline',
  'site_description',
  'contact_email',
  'contact_phone',
  'primary_color',
  'footer_text',
  'invoice_logo',
  'invoice_notes',
  'hero_title',
  'hero_subtitle',
  'hero_image',
  'hero_primary_cta_text',
  'hero_primary_cta_link',
  'hero_secondary_cta_text',
  'hero_secondary_cta_link',
  'hero_badge_text',
  'show_hero_section',
  'show_trust_section',
  'show_categories_section',
  'show_testimonials_section',
  'trust_section_title',
  'trust_section_subtitle',
  'categories_section_title',
  'categories_section_subtitle',
  'testimonials_section_title',
  'testimonials_section_subtitle',
  'about_page_title',
  'about_page_subtitle',
  'contact_page_title',
  'contact_page_subtitle',
  'show_search_button',
  'show_wishlist_button',
  'show_account_button',
  'home_featured_count',
  'custom_css',
  'product_highlight_shipping_label',
  'product_highlight_shipping_value',
  'product_highlight_warranty_label',
  'product_highlight_warranty_value',
  'product_specs_warranty_label',
  'product_specs_warranty_value',
  'product_specs_shipping_label',
  'product_specs_shipping_value',
  'product_quick_info_title',
  'product_quick_info_shipping_label',
  'product_quick_info_shipping_value',
  'product_quick_info_returns_label',
  'product_quick_info_returns_value',
  'product_quick_info_support_label',
  'product_quick_info_support_value',
  'product_offer_title',
  'product_offer_message',
  'special_offer_enabled',
  'special_offer_product_id',
  'special_offer_start_at',
  'special_offer_end_at',
  'special_offer_badge',
  'special_offer_title',
  'special_offer_subtitle',
  'special_offer_cta_text',
  'special_offer_cta_link',
  'special_offer_image',
  'special_offer_discount_percent',
  'special_offer_override_price',
  'special_offers_json',
  'special_offer_show_countdown',
  'special_offer_show_price',
  'social_facebook',
  'social_instagram',
  'social_twitter',
  'social_youtube',
  'social_linkedin',
  'social_whatsapp',
  'home_banners',
  'maintenance_mode',
  'announcement_enabled',
  'announcement_text',
  'default_language',
  'currency_symbol',
  'enable_dark_mode',
  'dark_mode_default',
  'show_language_toggle',
  'maintenance_message',
  'show_footer',
  'show_social_links',
  'show_contact_info',
  'show_cart_button',
  'show_admin_link',
  'nav_pin_search_button',
  'nav_pin_wishlist_button',
  'nav_pin_account_button',
  'nav_pin_cart_button',
  'nav_pin_language_toggle',
  'nav_pin_theme_toggle',
  'nav_pin_admin_link'
];

const DEFAULT_SETTINGS_PAYLOAD = {
  shipping_cost: 0,
  tax_rate: 0,
  currency: 'USD',
  free_shipping_threshold: 0,
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
  home_featured_count: 4,
  custom_css: '',
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
  special_offers_json: '[]',
  special_offer_show_countdown: 1,
  special_offer_show_price: 1,
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_youtube: '',
  social_linkedin: '',
  social_whatsapp: '',
  home_banners: '[]',
  maintenance_mode: 0,
  announcement_enabled: 0,
  announcement_text: '',
  default_language: 'ar',
  currency_symbol: '$',
  enable_dark_mode: 1,
  dark_mode_default: 0,
  show_language_toggle: 1,
  maintenance_message: '',
  show_footer: 1,
  show_social_links: 1,
  show_contact_info: 1,
  show_cart_button: 1,
  show_admin_link: 1,
  nav_pin_search_button: 1,
  nav_pin_wishlist_button: 1,
  nav_pin_account_button: 1,
  nav_pin_cart_button: 1,
  nav_pin_language_toggle: 0,
  nav_pin_theme_toggle: 0,
  nav_pin_admin_link: 0
};

const INTEGER_FIELDS = new Set([
  'show_hero_section',
  'show_trust_section',
  'show_categories_section',
  'show_testimonials_section',
  'show_search_button',
  'show_wishlist_button',
  'show_account_button',
  'special_offer_enabled',
  'special_offer_show_countdown',
  'special_offer_show_price',
  'maintenance_mode',
  'announcement_enabled',
  'enable_dark_mode',
  'dark_mode_default',
  'show_language_toggle',
  'show_footer',
  'show_social_links',
  'show_contact_info',
  'show_cart_button',
  'show_admin_link',
  'nav_pin_search_button',
  'nav_pin_wishlist_button',
  'nav_pin_account_button',
  'nav_pin_cart_button',
  'nav_pin_language_toggle',
  'nav_pin_theme_toggle',
  'nav_pin_admin_link'
]);

const NUMBER_FIELDS = new Set([
  'shipping_cost',
  'tax_rate',
  'free_shipping_threshold',
  'home_featured_count',
  'special_offer_product_id',
  'special_offer_discount_percent',
  'special_offer_override_price'
]);

const SETTINGS_IMAGE_FIELDS = ['invoice_logo', 'hero_image', 'special_offer_image'];

const normalizeSpecialOffersAssetUrls = (value) => {
  if (!value) return value;

  const isArrayInput = Array.isArray(value);
  let parsed = [];

  if (isArrayInput) {
    parsed = value;
  } else if (typeof value === 'string') {
    try {
      const candidate = JSON.parse(value);
      parsed = Array.isArray(candidate) ? candidate : [];
    } catch {
      return value;
    }
  } else {
    return value;
  }

  const normalized = parsed.map((offer) => {
    if (!offer || typeof offer !== 'object') return offer;
    return {
      ...offer,
      image: normalizeUploadAssetUrl(offer.image)
    };
  });

  return isArrayInput ? normalized : JSON.stringify(normalized);
};

const normalizeSettingsAssetUrls = (payload = {}) => {
  const normalized = { ...(payload || {}) };
  SETTINGS_IMAGE_FIELDS.forEach((field) => {
    normalized[field] = normalizeUploadAssetUrl(normalized[field]);
  });
  normalized.special_offers_json = normalizeSpecialOffersAssetUrls(normalized.special_offers_json);
  return normalized;
};

export const createSettingsService = ({ settingsRepository, normalizeJsonField }) => ({
  async getSettings() {
    try {
      const row = await settingsRepository.getById(1);
      if (row) return { ok: true, status: 200, data: normalizeSettingsAssetUrls(row) };

      const fallback = await settingsRepository.getFirst();
      if (fallback) return { ok: true, status: 200, data: normalizeSettingsAssetUrls(fallback) };

      return { ok: true, status: 200, data: normalizeSettingsAssetUrls({ ...DEFAULT_SETTINGS_PAYLOAD }) };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async updateSettings(payload = {}) {
    const normalizedPayload = {
      ...DEFAULT_SETTINGS_PAYLOAD,
      ...payload
    };

    normalizedPayload.home_banners = normalizeJsonField(normalizedPayload.home_banners, '[]');
    normalizedPayload.special_offers_json = normalizeJsonField(normalizedPayload.special_offers_json, '[]');
    normalizedPayload.custom_css = typeof normalizedPayload.custom_css === 'string' ? normalizedPayload.custom_css : '';
    normalizedPayload.home_featured_count = Math.max(1, Number(normalizedPayload.home_featured_count || 4));
    normalizedPayload.special_offer_product_id = Math.max(0, Math.trunc(Number(normalizedPayload.special_offer_product_id || 0)));
    normalizedPayload.special_offer_discount_percent = Math.min(100, Math.max(0, Number(normalizedPayload.special_offer_discount_percent || 0)));
    normalizedPayload.special_offer_override_price = Math.max(0, Number(normalizedPayload.special_offer_override_price || 0));

    SETTING_COLUMNS.forEach((field) => {
      if (INTEGER_FIELDS.has(field)) {
        normalizedPayload[field] = Number(normalizedPayload[field]) === 1 || normalizedPayload[field] === true ? 1 : 0;
        return;
      }
      if (NUMBER_FIELDS.has(field)) {
        const num = Number(normalizedPayload[field]);
        normalizedPayload[field] = Number.isFinite(num) ? num : Number(DEFAULT_SETTINGS_PAYLOAD[field] || 0);
        return;
      }
      if (normalizedPayload[field] === null || normalizedPayload[field] === undefined) {
        normalizedPayload[field] = DEFAULT_SETTINGS_PAYLOAD[field];
      }
    });

    SETTINGS_IMAGE_FIELDS.forEach((field) => {
      normalizedPayload[field] = normalizeUploadAssetUrl(normalizedPayload[field]);
    });
    normalizedPayload.special_offers_json = normalizeSpecialOffersAssetUrls(normalizedPayload.special_offers_json);

    const values = SETTING_COLUMNS.map((field) => normalizedPayload[field]);

    try {
      const updated = await settingsRepository.updateById(1, SETTING_COLUMNS, values);
      if (updated.changes === 0) {
        await settingsRepository.insertWithId(1, SETTING_COLUMNS, values);
      }

      return {
        ok: true,
        status: 200,
        data: { message: 'تم تحديث الإعدادات بنجاح' },
        meta: { fields: Object.keys(payload || {}) }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  }
});
