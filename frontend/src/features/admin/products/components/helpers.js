export const createEmptyProduct = () => ({
  id: null,
  name: '',
  description: '',
  category: '',
  sku: '',
  image_url: '',
  hover_image_url: '',
  gallery_images: [],
  base_price: 0,
  cost_price: 0,
  stock_quantity: 0,
  has_variants: false,
  variants: [],
  specs: [],
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  is_published: 1
});

export const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const toBool = (value) => Number(value) === 1 || value === true;

export const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
