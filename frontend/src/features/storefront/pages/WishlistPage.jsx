import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { PUBLIC_TEXTS } from '../i18n/publicTexts';
import { getProductDisplayPricing, resolveCurrencySymbol } from '../utils/storefrontUtils';
import { PageSkeleton, SkeletonBar } from './StorefrontPageShared';

export const WishlistPage = ({ lang, settings, wishlistIds = [], onToggleWishlist, addToCart }) => {
  const t = PUBLIC_TEXTS[lang];
  const currency = resolveCurrencySymbol(settings, t.currency);
  const cardTopInlineEndClass = lang === 'ar' ? 'left-3' : 'right-3';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const orderedIds = Array.from(new Set((wishlistIds || []).map((id) => Number(id)).filter(Boolean)));
      if (!orderedIds.length) {
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        let batchProducts = [];
        try {
          const batchRes = await axios.get(`${API_URL}/products/batch`, {
            params: { ids: orderedIds.join(','), published: 1 }
          });
          batchProducts = Array.isArray(batchRes.data) ? batchRes.data.filter(Boolean) : [];
        } catch {
          batchProducts = [];
        }

        const productById = new Map(
          batchProducts
            .map((product) => [Number(product?.id), product])
            .filter(([id]) => Number.isInteger(id) && id > 0)
        );

        const missingIds = orderedIds.filter((id) => !productById.has(id));
        if (missingIds.length > 0) {
          const fallbackRequests = missingIds.map((id) => (
            axios
              .get(`${API_URL}/products/${id}?published=1`)
              .then((res) => res.data)
              .catch(() => null)
          ));
          const fallbackProducts = (await Promise.all(fallbackRequests)).filter(Boolean);
          fallbackProducts.forEach((product) => {
            const productId = Number(product?.id);
            if (Number.isInteger(productId) && productId > 0) {
              productById.set(productId, product);
            }
          });
        }

        const orderedProducts = orderedIds.map((id) => productById.get(id)).filter(Boolean);
        if (mounted) setItems(orderedProducts);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [wishlistIds]);

  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 sm:py-12 animate-fade-in" aria-labelledby="wishlist-page-title">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 id="wishlist-page-title" className="text-3xl font-black text-primary">{t.wishlist}</h1>
          <p className="text-muted mt-1">{wishlistIds.length} {t.itemsCount}</p>
        </div>
        <Link to="/shop" className="ui-btn ui-btn-secondary px-4 py-2 w-full sm:w-auto">{t.shop}</Link>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="premium-panel p-4 space-y-4">
              <SkeletonBar className="h-56 w-full rounded-2xl" />
              <SkeletonBar className="h-4 w-1/2" />
              <SkeletonBar className="h-6 w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="premium-panel p-10 text-center text-muted">
          <Heart size={28} className="mx-auto mb-3 text-muted" />
          <div>{lang === 'ar' ? 'لا توجد منتجات مفضلة حالياً' : 'No wishlist items yet'}</div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {items.map((product) => {
            const wishlistPricing = getProductDisplayPricing({ settings, product });
            return (
            <motion.div key={product.id} className="product-card group relative" variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
              <Link to={`/product/${product.id}`} className="block relative aspect-[1/1.1] bg-card-soft rounded-3xl overflow-hidden mb-5">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted"><Box size={32} /></div>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); onToggleWishlist?.(product.id); }}
                  className={`absolute top-3 ${cardTopInlineEndClass} w-9 h-9 rounded-full bg-red-500 border border-red-500 text-white shadow flex items-center justify-center`}
                >
                  <Heart size={16} className="fill-white" />
                </button>
              </Link>
              <div>
                <div className="text-xs font-bold text-muted mb-1 uppercase tracking-wide">{product.category}</div>
                <h3 className="font-bold text-primary text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                  <Link to={`/product/${product.id}`}>{product.name}</Link>
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-primary">{currency}{wishlistPricing.finalPrice.toFixed(2)}</span>
                    {wishlistPricing.hasDiscount && (
                      <span className="text-sm text-muted line-through">{currency}{wishlistPricing.regularPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <button onClick={() => addToCart(product)} className="ui-btn ui-btn-primary ui-btn-sm px-3 py-2">
                    <ShoppingBag size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )})}
        </motion.div>
      )}
    </section>
  );
};

// --- CART PAGE (Multi-step Checkout) ---


