import React, { useEffect, useState } from 'react';
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
import { useToastNotifications } from '../../../shared/contexts/ToastContext';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';
import { PUBLIC_TEXTS } from '../i18n/publicTexts';
import {
  buildProductGallery,
  getProductDisplayPricing,
  resolveCurrencySymbol,
  resolveSpecialOfferPricing
} from '../utils/storefrontUtils';
import { PageSkeleton, SkeletonBar } from './StorefrontPageShared';

export const ProductDetailsPage = ({ addToCart, lang, settings, wishlistIds = [], onToggleWishlist }) => {
  const t = PUBLIC_TEXTS[lang];
  const locale = getLatinDigitsLocale(lang);
  const currency = resolveCurrencySymbol(settings, t.currency);
  const relatedCardTopInlineEndClass = lang === 'ar' ? 'left-3' : 'right-3';
  const { pushToast } = useToastNotifications();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [related, setRelated] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productNotFound, setProductNotFound] = useState(false);

  const parseSpecs = (val) => {
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (mounted) {
        setLoadingProduct(true);
        setProductNotFound(false);
      }
      try {
        const prodRes = await axios.get(`${API_URL}/products/${id}?published=1`);
        if (!mounted) return;
        const prod = prodRes.data;
        setProduct(prod);
        const productHasVariants = Number(prod?.has_variants) === 1;
        setSelectedVariant(productHasVariants && prod.variants.length > 0 ? prod.variants[0] : null);
        const gallery = buildProductGallery(prod);
        setActiveImage(gallery[0] || '');
        const relatedRes = await axios.get(`${API_URL}/products?limit=6&published=1&category=${encodeURIComponent(prod.category || '')}&exclude=${prod.id}`);
        if (mounted) setRelated(relatedRes.data?.data || []);
      } catch {
        if (!mounted) return;
        setProduct(null);
        setSelectedVariant(null);
        setRelated([]);
        setActiveImage('');
        setProductNotFound(true);
      } finally {
        if (mounted) setLoadingProduct(false);
      }
    };
    const fetchReviews = async () => {
      try {
        const r = await axios.get(`${API_URL}/products/${id}/reviews?published=1`);
        if (mounted) setReviews(r.data || []);
      } catch { /* ignore */ }
    };
    fetchData();
    fetchReviews();
    return () => { mounted = false; };
  }, [id]);

  const handleAddToCart = () => {
    if (Number(product?.has_variants) === 1 && !selectedVariant) {
      pushToast(t.selectOption, 'error');
      return;
    }
    addToCart(product, selectedVariant, quantity);
  };

  const submitReview = async () => {
    if (!reviewForm.title && !reviewForm.body) return;
    setSubmittingReview(true);
    try {
      await axios.post(`${API_URL}/products/${id}/reviews?published=1`, reviewForm);
      const r = await axios.get(`${API_URL}/products/${id}/reviews?published=1`);
      setReviews(r.data || []);
      setReviewForm({ name: '', rating: 5, title: '', body: '' });
    } catch {
      // silent
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loadingProduct) return <PageSkeleton />;
  if (productNotFound || !product) {
    return (
      <section className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4" aria-labelledby="product-not-found-title">
        <h1 id="product-not-found-title" className="text-4xl font-black text-primary mb-2">404</h1>
        <p className="text-muted mb-6">{t.errorPage}</p>
        <Link to="/shop" className="text-primary font-bold hover:underline">{t.shop}</Link>
      </section>
    );
  }

  const hasVariants = Number(product?.has_variants) === 1;
  const offerPricing = resolveSpecialOfferPricing({ settings, product, variant: selectedVariant });
  const currentPrice = offerPricing.finalPrice;
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isOutOfStock = currentStock <= 0;
  const gallery = buildProductGallery(product);
  const specs = parseSpecs(product.specs_json);
  const baseFinalSpecs = specs.length ? specs : [
    { label: lang === 'ar' ? 'الفئة' : 'Category', value: product.category || '-' },
    { label: lang === 'ar' ? 'الضمان' : 'Warranty', value: '12 Months' },
    { label: lang === 'ar' ? 'الشحن' : 'Shipping', value: '2-4 Days' },
    { label: lang === 'ar' ? 'المخزون' : 'Stock', value: currentStock > 0 ? (lang === 'ar' ? 'متوفر' : 'In stock') : (lang === 'ar' ? 'غير متوفر' : 'Out of stock') }
  ];
  const upsertSpec = (list, keywords = [], label, value) => {
    if (!label && !value) return list;
    const normalizedKeywords = keywords.map((k) => String(k || '').toLowerCase());
    const index = list.findIndex((item) => {
      const key = String(item?.label || '').toLowerCase();
      return normalizedKeywords.some((matcher) => matcher && (key === matcher || key.includes(matcher)));
    });
    if (index >= 0) {
      const current = list[index];
      list[index] = {
        ...current,
        label: label || current.label,
        value: value || current.value
      };
      return list;
    }
    list.push({
      label: label || (lang === 'ar' ? 'عنصر' : 'Spec'),
      value: value || ''
    });
    return list;
  };
  const finalSpecs = upsertSpec(
    upsertSpec(
      [...baseFinalSpecs],
      ['warranty', 'الضمان'],
      settings?.product_specs_warranty_label || (lang === 'ar' ? 'الضمان' : 'Warranty'),
      settings?.product_specs_warranty_value || (lang === 'ar' ? '12 شهر ضمان' : '12 Months')
    ),
    ['shipping', 'الشحن'],
    settings?.product_specs_shipping_label || (lang === 'ar' ? 'الشحن' : 'Shipping'),
    settings?.product_specs_shipping_value || (lang === 'ar' ? '2-4 أيام' : '2-4 Days')
  );

  const highlightShippingLabel = settings?.product_highlight_shipping_label || (lang === 'ar' ? 'الشحن' : 'Shipping');
  const highlightShippingValue = settings?.product_highlight_shipping_value || (lang === 'ar' ? 'سريع خلال 48 ساعة' : 'Fast 48h delivery');
  const highlightWarrantyLabel = settings?.product_highlight_warranty_label || (lang === 'ar' ? 'الضمان' : 'Warranty');
  const highlightWarrantyValue = settings?.product_highlight_warranty_value || (lang === 'ar' ? '12 شهر ضمان' : '12 months warranty');

  const quickInfoTitle = settings?.product_quick_info_title || (lang === 'ar' ? 'معلومات سريعة' : 'Quick Info');
  const quickInfoRows = [
    {
      label: settings?.product_quick_info_shipping_label || (lang === 'ar' ? 'الشحن' : 'Shipping'),
      value: settings?.product_quick_info_shipping_value || (lang === 'ar' ? 'سريع' : 'Fast')
    },
    {
      label: settings?.product_quick_info_returns_label || (lang === 'ar' ? 'الإرجاع' : 'Returns'),
      value: settings?.product_quick_info_returns_value || (lang === 'ar' ? '7 أيام' : '7 days')
    },
    {
      label: settings?.product_quick_info_support_label || (lang === 'ar' ? 'الدعم' : 'Support'),
      value: settings?.product_quick_info_support_value || '24/7'
    }
  ];
  const offerTitle = settings?.product_offer_title || (lang === 'ar' ? 'عرض خاص' : 'Special Offer');
  const offerTemplate = settings?.product_offer_message || (lang === 'ar' ? 'شحن مجاني للطلبات فوق {currency}{threshold}' : 'Free shipping for orders over {currency}{threshold}');
  const offerMessage = String(offerTemplate)
    .replace(/\{currency\}/g, currency)
    .replace(/\{threshold\}/g, String(settings?.free_shipping_threshold || 0));
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length) : 0;
  const isWishlisted = wishlistIds.includes(product.id);

  return (
    <article className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-6xl animate-fade-in" aria-labelledby="product-details-title">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <div>
          <div className="bg-card-soft rounded-[2.5rem] p-8 flex items-center justify-center border border-subtle shadow-inner relative">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="w-full max-h-[520px] object-contain mix-blend-multiply dark:mix-blend-normal" />
            ) : (
              <Box size={64} className="text-primary opacity-40"/>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-4 flex-wrap">
              {gallery.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 rounded-2xl border overflow-hidden bg-card ${activeImage === img ? 'border-primary shadow-lg' : 'border-subtle'}`}>
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain p-2"/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">{product.category || t.category}</span>
              <span className="text-sm font-mono text-muted">{t.sku}: {selectedVariant ? selectedVariant.sku : product.sku}</span>
            </div>
            <h1 id="product-details-title" className="text-4xl md:text-5xl font-black text-primary mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-4xl font-black text-primary">{currency}{Number(currentPrice || 0).toFixed(2)}</span>
              {offerPricing.hasDiscount && (
                <span className="text-lg font-bold text-muted line-through">
                  {currency}{Number(offerPricing.regularPrice || 0).toFixed(2)}
                </span>
              )}
              {offerPricing.hasDiscount && (
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary">
                  {lang === 'ar' ? 'عرض خاص' : 'Special Offer'}
                </span>
              )}
              <button
                onClick={() => onToggleWishlist?.(product.id)}
                className={`w-11 h-11 rounded-full border transition flex items-center justify-center ${isWishlisted ? 'bg-red-500 border-red-500 text-white' : 'bg-card border-subtle text-muted hover:text-red-500 hover:border-red-200'}`}
                title={t.wishlist}
              >
                <Heart size={18} className={isWishlisted ? 'fill-white' : ''} />
              </button>
              {isOutOfStock && <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">{t.outOfStock}</span>}
            </div>
          </div>

          <p className="text-muted leading-relaxed mb-8">{product.description}</p>

          {/* Variants */}
          {hasVariants && (
            <div className="mb-8">
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><Layers size={18}/> {t.selectOption}:</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-6 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      selectedVariant?.id === v.id 
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl scale-105' 
                      : 'bg-card text-secondary border border-subtle hover:border-primary/40'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-card-soft border border-subtle rounded-2xl p-4">
              <div className="text-xs text-muted mb-1">{highlightShippingLabel}</div>
              <div className="font-bold text-primary">{highlightShippingValue}</div>
            </div>
            <div className="bg-card-soft border border-subtle rounded-2xl p-4">
              <div className="text-xs text-muted mb-1">{highlightWarrantyLabel}</div>
              <div className="font-bold text-primary">{highlightWarrantyValue}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-subtle">
            <div className="flex items-center border-2 border-subtle rounded-2xl bg-card h-16 w-40 shadow-sm">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center hover:bg-card-soft rounded-s-xl transition-colors"><Minus size={18}/></button>
              <span className="flex-1 text-center font-bold text-xl">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex items-center justify-center hover:bg-card-soft rounded-e-xl transition-colors"><Plus size={18}/></button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 h-16 bg-primary text-white rounded-2xl font-bold text-xl hover:opacity-90 transition-all shadow-xl disabled:bg-card-soft disabled:text-muted disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
            >
              <ShoppingBag size={24}/> {isOutOfStock ? t.outOfStock : t.addToCart}
            </button>
          </div>
        </div>
      </div>

      {/* Specs + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-14">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-subtle rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-primary mb-6">{t.specsTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {finalSpecs.map((spec, idx) => (
                <div key={idx} className="bg-card-soft border border-subtle rounded-2xl p-4">
                  <div className="text-xs text-muted mb-1">{spec.label}</div>
                  <div className="font-bold text-primary">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-subtle rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-primary">{t.reviewsTitle}</h3>
                <div className="flex items-center gap-2 text-sm text-muted mt-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted'} />
                    ))}
                  </div>
                  <span>{avgRating ? avgRating.toFixed(1) : '0.0'} • {reviews.length} {lang === 'ar' ? 'تقييم' : 'reviews'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {reviews.length === 0 && <div className="text-sm text-muted">{t.noReviews}</div>}
              {reviews.map((r) => (
                <div key={r.id} className="bg-card-soft border border-subtle rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-primary">{r.name || 'Guest'}</div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < Number(r.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted'} />
                      ))}
                    </div>
                  </div>
                  {r.title && <div className="text-sm font-semibold text-secondary mt-2">{r.title}</div>}
                  {r.body && <div className="text-sm text-secondary mt-2">{r.body}</div>}
                  <div className="text-xs text-muted mt-2">{new Date(r.created_at).toLocaleDateString(locale)}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t pt-6">
              <h4 className="font-bold text-primary mb-4">{t.writeReview}</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <input className="ui-input" placeholder={t.reviewName} value={reviewForm.name} onChange={e=>setReviewForm({...reviewForm, name:e.target.value})} />
                <select className="ui-select" value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm, rating:Number(e.target.value)})}>
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                </select>
              </div>
              <input className="ui-input mt-4" placeholder={t.reviewTitle} value={reviewForm.title} onChange={e=>setReviewForm({...reviewForm, title:e.target.value})}/>
              <textarea className="ui-textarea mt-4 h-28" placeholder={t.reviewBody} value={reviewForm.body} onChange={e=>setReviewForm({...reviewForm, body:e.target.value})}/>
              <button onClick={submitReview} disabled={submittingReview} className="ui-btn ui-btn-primary mt-4 px-6 py-3">
                {submittingReview ? t.processing : t.reviewSubmit}
              </button>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-card-soft border border-subtle rounded-3xl p-6">
            <h4 className="font-bold text-primary mb-4">{quickInfoTitle}</h4>
            <div className="space-y-4 text-sm text-secondary">
              {quickInfoRows.map((row, idx) => (
                <div key={`qi-${idx}`} className="flex justify-between">
                  <span>{row.label}</span>
                  <span className="font-bold text-primary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6">
            <div className="font-bold text-primary mb-2">{offerTitle}</div>
            <div className="text-secondary text-sm">{offerMessage}</div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-primary">{t.relatedTitle}</h3>
            <Link to="/shop" className="text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors">{t.shop}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {related.map(product => {
              const relatedPricing = getProductDisplayPricing({ settings, product });
              return (
              <div key={product.id} className="product-card group relative">
                <Link to={`/product/${product.id}`} className="block relative aspect-[1/1.1] bg-card-soft rounded-3xl overflow-hidden mb-5">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted"><Box size={32}/></div>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); onToggleWishlist?.(product.id); }}
                    className={`absolute top-3 ${relatedCardTopInlineEndClass} w-9 h-9 rounded-full border shadow flex items-center justify-center transition ${wishlistIds.includes(product.id) ? 'bg-red-500 border-red-500 text-white' : 'bg-card border-subtle text-secondary hover:bg-card-soft'}`}
                    title={t.wishlist}
                  >
                    <Heart size={16} className={wishlistIds.includes(product.id) ? 'fill-white' : ''} />
                  </button>
                </Link>
                <div>
                  <div className="text-xs font-bold text-muted mb-1 uppercase tracking-wide">{product.category}</div>
                  <h3 className="font-bold text-primary text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-primary">{currency}{relatedPricing.finalPrice.toFixed(2)}</span>
                    {relatedPricing.hasDiscount && (
                      <span className="text-sm text-muted line-through">{currency}{relatedPricing.regularPrice.toFixed(2)}</span>
                    )}
                    {Number(product?.has_variants) === 1 && <span className="text-[10px] text-muted bg-card-soft px-1.5 py-0.5 rounded">خيارات</span>}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </section>
      )}
    </article>
  );
};


