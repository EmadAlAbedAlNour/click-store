import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { PUBLIC_TEXTS } from '../i18n/publicTexts';
import { getProductDisplayPricing, resolveCurrencySymbol } from '../utils/storefrontUtils';
import { PageSkeleton, SkeletonBar } from './StorefrontPageShared';

const SHOP_PAGE_SIZE = 24;
const SEARCH_PAGE_SIZE = 200;

const parseProductsResponse = (payload = {}) => {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const pagination = payload?.pagination || {};
  const dataMax = data.reduce((max, product) => Math.max(max, Number(product?.base_price) || 0), 0);
  const dataMin = data.reduce((min, product) => {
    const price = Number(product?.base_price);
    if (!Number.isFinite(price)) return min;
    return min === null ? price : Math.min(min, price);
  }, null);
  return {
    items: data,
    pagination: {
      currentPage: Math.max(1, Number(pagination.current_page) || 1),
      totalPages: Math.max(1, Number(pagination.total_pages) || 1),
      totalItems: Math.max(0, Number(pagination.total_items) || data.length || 0),
      perPage: Math.max(1, Number(pagination.per_page) || SHOP_PAGE_SIZE),
      minPrice: Math.max(0, Number(pagination.min_base_price) || (dataMin ?? 0)),
      maxPrice: Math.max(0, Number(pagination.max_base_price) || dataMax || 0)
    }
  };
};

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mergeProductsById = (current = [], incoming = []) => {
  const seen = new Set((current || []).map((product) => Number(product?.id)).filter(Boolean));
  const merged = [...(current || [])];
  for (const product of incoming || []) {
    const productId = Number(product?.id);
    if (!Number.isInteger(productId) || productId <= 0 || seen.has(productId)) continue;
    seen.add(productId);
    merged.push(product);
  }
  return merged;
};

export const ShopPage = ({ addToCart, lang, settings, wishlistIds = [], onToggleWishlist }) => {
  const t = PUBLIC_TEXTS[lang];
  const isArabic = lang === 'ar';
  const { pushToast } = useToastNotifications();
  const currency = resolveCurrencySymbol(settings, t.currency);
  const cardTopInlineEndClass = isArabic ? 'left-3' : 'right-3';
  const cardInlineEndClass = isArabic ? 'left-4' : 'right-4';
  const cardInlineStartClass = isArabic ? 'right-3' : 'left-3';
  const quickViewImageDividerClass = isArabic ? 'md:border-l' : 'md:border-r';
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const productsRef = useRef([]);
  const maxPriceRef = useRef(0);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [priceLimit, setPriceLimit] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: SHOP_PAGE_SIZE,
    minPrice: 0,
    maxPrice: 0
  });
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [offerNowTs, setOfferNowTs] = useState(() => Date.now());
  const normalizedDebouncedSearch = String(debouncedSearch || '').toLowerCase();

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    maxPriceRef.current = maxPrice;
  }, [maxPrice]);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API_URL}/categories`)
      .then((catRes) => {
        if (!mounted) return;
        setCategories(catRes.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setOfferNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setCategory(cat);
  }, [location.search]);

  const syncPriceBounds = useCallback(({ nextProducts = [], nextServerMaxPrice = 0, resetRange = false } = {}) => {
    const nextMax = (nextProducts || []).reduce(
      (m, product) => Math.max(m, Math.max(0, toFiniteNumber(product?.base_price, 0))),
      0
    );
    const safeMax = Math.max(0, toFiniteNumber(nextServerMaxPrice, 0), toFiniteNumber(nextMax, 0));
    const previousMax = Math.max(0, toFiniteNumber(maxPriceRef.current, 0));

    setMaxPrice(safeMax);
    setPriceLimit((prev) => {
      const safePrev = Math.max(0, toFiniteNumber(prev, 0));
      if (resetRange) return safeMax;
      if (safePrev <= 0) return safeMax;
      if (safePrev >= previousMax) return safeMax;
      if (safePrev > safeMax) return safeMax;
      return safePrev;
    });
  }, []);

  const buildProductsParams = useCallback((page = 1, { searchMode = false } = {}) => {
    const params = {
      page,
      limit: searchMode ? SEARCH_PAGE_SIZE : SHOP_PAGE_SIZE,
      published: 1
    };
    const searchValue = String(debouncedSearch || '').trim();
    if (searchValue) params.search = searchValue;
    if (category && category !== 'all') params.category = category;
    return params;
  }, [category, debouncedSearch]);

  const fetchAllSearchProducts = useCallback(async () => {
    const firstPageRes = await axios.get(`${API_URL}/products`, {
      params: buildProductsParams(1, { searchMode: true })
    });
    const firstPage = parseProductsResponse(firstPageRes.data || {});
    const totalPages = Math.max(1, Number(firstPage?.pagination?.totalPages || 1));
    if (totalPages <= 1) return firstPage;

    let mergedItems = [...(firstPage.items || [])];
    for (let page = 2; page <= totalPages; page += 1) {
      const pageRes = await axios.get(`${API_URL}/products`, {
        params: buildProductsParams(page, { searchMode: true })
      });
      const parsedPage = parseProductsResponse(pageRes.data || {});
      mergedItems = mergeProductsById(mergedItems, parsedPage.items || []);
    }

    return {
      items: mergedItems,
      pagination: {
        ...firstPage.pagination,
        currentPage: totalPages,
        totalPages,
        totalItems: Math.max(
          Number(firstPage?.pagination?.totalItems || 0),
          mergedItems.length
        )
      }
    };
  }, [buildProductsParams]);

  useEffect(() => {
    let mounted = true;

    const loadFirstPage = async () => {
      setLoading(true);
      setLoadingMore(false);
      try {
        const hasActiveSearch = String(debouncedSearch || '').trim().length > 0;
        const normalized = hasActiveSearch
          ? await fetchAllSearchProducts()
          : parseProductsResponse((await axios.get(`${API_URL}/products`, { params: buildProductsParams(1) })).data || {});
        if (!mounted) return;
        setProducts(normalized.items);
        productsRef.current = normalized.items;
        setPagination(normalized.pagination);
        syncPriceBounds({
          nextProducts: normalized.items,
          nextServerMaxPrice: normalized.pagination.maxPrice,
          resetRange: true
        });
      } catch {
        if (!mounted) return;
        setProducts([]);
        productsRef.current = [];
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          perPage: SHOP_PAGE_SIZE,
          minPrice: 0,
          maxPrice: 0
        });
        setMaxPrice(0);
        setPriceLimit(0);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFirstPage();
    return () => { mounted = false; };
  }, [category, debouncedSearch, buildProductsParams, fetchAllSearchProducts, syncPriceBounds]);

  const hasMorePages = pagination.currentPage < pagination.totalPages;

  const loadMoreProducts = async () => {
    if (loading || loadingMore || !hasMorePages) return;
    const nextPage = pagination.currentPage + 1;
    setLoadingMore(true);
    try {
      const productsRes = await axios.get(`${API_URL}/products`, { params: buildProductsParams(nextPage) });
      const normalized = parseProductsResponse(productsRes.data || {});
      const currentProducts = productsRef.current || [];
      const previousCount = currentProducts.length;
      const mergedProducts = mergeProductsById(currentProducts, normalized.items);
      setProducts(mergedProducts);
      productsRef.current = mergedProducts;

      const resolvedPerPage = Math.max(1, Number(normalized.pagination.perPage) || pagination.perPage || SHOP_PAGE_SIZE);
      const fallbackTotalPagesFromItems = Math.max(1, Math.ceil(Math.max(mergedProducts.length, previousCount) / resolvedPerPage));

      setPagination((prev) => {
        const resolvedTotalPages = Math.max(
          prev.totalPages,
          Number(normalized.pagination.totalPages) || 0,
          fallbackTotalPagesFromItems
        );
        const resolvedCurrentPage = Math.max(
          prev.currentPage,
          Number(normalized.pagination.currentPage) || 0,
          normalized.items.length > 0 ? prev.currentPage + 1 : prev.currentPage
        );

        return {
          currentPage: Math.min(resolvedCurrentPage, resolvedTotalPages),
          totalPages: resolvedTotalPages,
          totalItems: Math.max(
            prev.totalItems,
            Number(normalized.pagination.totalItems) || 0,
            mergedProducts.length
          ),
          perPage: resolvedPerPage,
          minPrice: Math.max(0, toFiniteNumber(normalized.pagination.minPrice, prev.minPrice)),
          maxPrice: Math.max(0, toFiniteNumber(normalized.pagination.maxPrice, prev.maxPrice))
        };
      });
      syncPriceBounds({
        nextProducts: mergedProducts,
        nextServerMaxPrice: normalized.pagination.maxPrice,
        resetRange: false
      });
    } catch {
      pushToast(
        isArabic ? 'تعذر تحميل المزيد من المنتجات' : 'Failed to load more products',
        'error'
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const safeMaxPrice = Math.max(0, toFiniteNumber(maxPrice, 0));
  const clampedPriceLimit = Math.max(0, Math.min(Math.max(0, toFiniteNumber(priceLimit, 0)), safeMaxPrice));

  useEffect(() => {
    if (Math.abs(clampedPriceLimit - toFiniteNumber(priceLimit, 0)) > 0.001) {
      setPriceLimit(clampedPriceLimit);
    }
  }, [clampedPriceLimit, priceLimit]);

  const getEffectivePrice = useCallback((product) => {
    const pricing = getProductDisplayPricing({ settings, product, nowTs: offerNowTs });
    const finalPrice = toFiniteNumber(pricing?.finalPrice, toFiniteNumber(product?.base_price, 0));
    return Math.max(0, finalPrice);
  }, [offerNowTs, settings]);

  const filtered = useMemo(() => (
    (products || [])
      .filter((p) => {
        const effectivePriceLimit = clampedPriceLimit > 0 ? clampedPriceLimit : safeMaxPrice;
        const productPrice = getEffectivePrice(p);
        const name = String(p?.name || '').toLowerCase();
        const matchesSearch = name.includes(normalizedDebouncedSearch);
        const matchesCategory = category === 'all' ? true : p.category === category;
        const matchesPrice = safeMaxPrice <= 0 ? true : productPrice <= effectivePriceLimit;
        const matchesStock = !inStockOnly ? true : (Number(p?.stock_quantity || 0) > 0 || Boolean(p?.has_variants));
        return matchesSearch && matchesCategory && matchesPrice && matchesStock;
      })
      .sort((a, b) => {
        if (sort === 'priceLow') return getEffectivePrice(a) - getEffectivePrice(b);
        if (sort === 'priceHigh') return getEffectivePrice(b) - getEffectivePrice(a);
        return Number(b?.id || 0) - Number(a?.id || 0);
      })
  ), [products, normalizedDebouncedSearch, category, sort, clampedPriceLimit, safeMaxPrice, inStockOnly, getEffectivePrice]);

  useEffect(() => {
    if (products.length === 0) return;
    const noManualFilters = String(debouncedSearch || '').trim() === '' && category === 'all' && !inStockOnly;
    if (!noManualFilters) return;
    if (filtered.length > 0) return;

    const safeMax = safeMaxPrice;
    if (safeMax > 0) {
      setPriceLimit(safeMax);
    }
  }, [products.length, filtered.length, debouncedSearch, category, inStockOnly, safeMaxPrice]);

  const openQuickView = async (product) => {
    setQuickViewLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products/${product.id}?published=1`);
      setQuickViewProduct(res.data || product);
    } catch {
      setQuickViewProduct(product);
    } finally {
      setQuickViewLoading(false);
    }
  };

  const loadedProductsCount = products.length;
  const totalProductsCount = Math.max(loadedProductsCount, Number(pagination.totalItems || 0));
  const showProgressiveControls = !loading && (hasMorePages || totalProductsCount > SHOP_PAGE_SIZE);
  const loadMoreText = loadingMore
    ? (isArabic ? 'جاري التحميل...' : 'Loading...')
    : (isArabic ? 'عرض المزيد' : 'Load more');
  const loadedSummaryText = isArabic
    ? `تم تحميل ${loadedProductsCount} من ${totalProductsCount}`
    : `Loaded ${loadedProductsCount} of ${totalProductsCount}`;

  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 sm:py-12 animate-fade-in" aria-labelledby="shop-page-title">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 id="shop-page-title" className="text-3xl font-black text-primary">{t.shop}</h1>
          <p className="text-muted mt-1">{filtered.length} {t.itemsCount}</p>
        </div>
        <div className="w-full md:w-96 relative">
          <Search className={`absolute top-3.5 text-muted ${isArabic ? 'right-4' : 'left-4'}`} size={20}/>
          <input
            className={`ui-input ${isArabic ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
            placeholder={t.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Filters */}
        <aside className="lg:col-span-1 space-y-6 bg-card border border-subtle rounded-2xl p-5 sm:p-6 h-fit lg:sticky lg:top-24" aria-label={t.filters}>
          <h3 className="text-lg font-bold text-primary">{t.filters}</h3>

          <div>
            <label className="ui-field-label mb-2 block">{t.category}</label>
            <select className="ui-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="all">{t.allCategories}</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="ui-field-label mb-2 block">{t.priceRange}</label>
            <input
              type="range"
              min="0"
              max={safeMaxPrice}
              value={clampedPriceLimit}
              onChange={e => setPriceLimit(toFiniteNumber(e.target.value, 0))}
              disabled={safeMaxPrice <= 0}
              className="w-full accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ direction: 'ltr' }}
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted" dir="ltr">
              <span>{currency}0</span>
              <span>{currency}{safeMaxPrice.toFixed(0)}</span>
            </div>
            <div className="text-xs text-muted mt-1" dir="ltr">
              {currency}{clampedPriceLimit.toFixed(0)}
            </div>
          </div>

          <div>
            <label className="ui-field-label mb-2 block">{t.sort}</label>
            <select className="ui-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="newest">{t.newest}</option>
              <option value="priceLow">{t.priceLow}</option>
              <option value="priceHigh">{t.priceHigh}</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-secondary">
            <input type="checkbox" className="ui-check" checked={inStockOnly} onChange={e=>setInStockOnly(e.target.checked)} />
            {t.inStock}
          </label>
        </aside>

        {/* Products */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-4">
              <SkeletonBar className="h-12 w-full rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="premium-panel p-4 space-y-4">
                    <SkeletonBar className="h-56 w-full rounded-2xl" />
                    <SkeletonBar className="h-4 w-1/2" />
                    <SkeletonBar className="h-5 w-2/3" />
                    <SkeletonBar className="h-8 w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map(product => {
                const cardPricing = getProductDisplayPricing({ settings, product, nowTs: offerNowTs });
                const hasVariants = Number(product?.has_variants) === 1;
                const hasHoverImage = Boolean(product?.hover_image_url && product.hover_image_url !== product.image_url);
                return (
                <motion.div
                  key={product.id}
                  className="product-card group relative"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
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
                    <div className={`absolute top-3 ${cardTopInlineEndClass} flex items-center gap-2`}>
                      <button
                        onClick={(e) => { e.preventDefault(); openQuickView(product); }}
                        className="w-9 h-9 rounded-full bg-card text-secondary flex items-center justify-center shadow hover:bg-card transition"
                        title={t.quickView}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); onToggleWishlist?.(product.id); }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shadow transition ${wishlistIds.includes(product.id) ? 'bg-red-500 text-white' : 'bg-card text-secondary hover:bg-card'}`}
                        title={t.wishlist}
                      >
                        <Heart size={16} className={wishlistIds.includes(product.id) ? 'fill-white' : ''} />
                      </button>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); addToCart(product); }}
                      className={`absolute bottom-4 ${cardInlineEndClass} w-10 h-10 bg-card text-primary rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white`}
                      title={t.addToCart}
                    >
                      <Plus size={20}/>
                    </button>
                    {product.stock_quantity === 0 && !hasVariants && (
                      <span className={`absolute top-3 ${cardInlineStartClass} bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md`}>
                        {t.outOfStock}
                      </span>
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
                </motion.div>
              )})}
              {filtered.length === 0 && <div className="sm:col-span-2 xl:col-span-3 text-muted text-center py-8">{t.noResults}</div>}
            </div>
          )}

          {showProgressiveControls && (
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted">{loadedSummaryText}</p>
              {hasMorePages && (
                <button
                  type="button"
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  className="ui-btn ui-btn-secondary px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadMoreText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            className="modal-shell z-[120] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickViewProduct(null)}
            role="presentation"
          >
            <motion.div
              className="w-full max-w-3xl rounded-3xl border border-subtle bg-card shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={t.quickView}
            >
              <div className="p-4 border-b border-subtle flex items-center justify-between">
                <h3 className="font-black text-primary">{t.quickView}</h3>
                <button type="button" onClick={() => setQuickViewProduct(null)} className="w-8 h-8 rounded-lg border border-subtle hover:bg-card-soft text-muted">
                  <X size={16} className="mx-auto" />
                </button>
              </div>
              {quickViewLoading ? (
                <div className="p-6 space-y-4">
                  <SkeletonBar className="h-52 w-full rounded-2xl" />
                  <SkeletonBar className="h-5 w-2/3" />
                  <SkeletonBar className="h-4 w-full" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-0">
                  {(() => {
                    const quickViewPricing = getProductDisplayPricing({ settings, product: quickViewProduct, nowTs: offerNowTs });
                    return (
                    <>
                  <div className={`bg-card-soft p-6 border-b md:border-b-0 ${quickViewImageDividerClass} border-subtle`}>
                    {quickViewProduct.image_url ? (
                      <img src={quickViewProduct.image_url} alt={quickViewProduct.name} className="w-full h-[280px] object-cover rounded-2xl" />
                    ) : (
                      <div className="w-full h-[280px] rounded-2xl bg-card-soft flex items-center justify-center text-muted"><Box size={42} /></div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted mb-2">{quickViewProduct.category || '-'}</div>
                    <h4 className="text-2xl font-black text-primary mb-2">{quickViewProduct.name}</h4>
                    <p className="text-sm text-secondary mb-4 line-clamp-4">{quickViewProduct.description || ''}</p>
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                      <span className="text-2xl font-black text-primary">{currency}{quickViewPricing.finalPrice.toFixed(2)}</span>
                      {quickViewPricing.hasDiscount && (
                        <span className="text-base font-semibold text-muted line-through">{currency}{quickViewPricing.regularPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary px-5 py-3"
                        onClick={() => {
                          addToCart(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                      >
                        <ShoppingBag size={18} />
                        {t.addToCart}
                      </button>
                      <Link to={`/product/${quickViewProduct.id}`} className="ui-btn ui-btn-secondary px-5 py-3" onClick={() => setQuickViewProduct(null)}>
                        {lang === 'ar' ? 'تفاصيل المنتج' : 'View Product'}
                      </Link>
                    </div>
                  </div>
                  </>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
// --- PRODUCT DETAILS PAGE (صفحة المنتج) ---




