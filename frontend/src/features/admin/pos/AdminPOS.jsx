import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  X,
  Printer,
  Search,
  Calendar,
  Users,
  RefreshCw,
  Box
} from 'lucide-react';
import { API_URL } from '../../../app/config';
import { escapeHtml, escapeHtmlWithBreaks, sanitizeCssColor, sanitizePrintImageUrl } from '../utils/printSanitizer';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';

const POS_TEXT = {
  ar: {
    search: 'ابحث عن منتج أو SKU...',
    invoice: 'الفاتورة الحالية',
    walkIn: 'عميل نقدي',
    subtotal: 'المجموع',
    tax: 'الضريبة',
    total: 'الإجمالي',
    payPrint: 'إتمام ودفع',
    all: 'الكل',
    empty: 'الفاتورة فارغة',
    clear: 'تفريغ',
    clearConfirm: 'هل تريد تفريغ الفاتورة الحالية؟',
    outOfStock: 'نفذت الكمية المتاحة',
    stockLow: 'الكمية المتاحة لا تكفي',
    loadError: 'تعذر تحميل بيانات نقطة البيع',
    loadRetry: 'إعادة المحاولة',
    saleSuccess: 'تم تنفيذ عملية البيع بنجاح',
    chooseVariant: 'اختر الخيار المناسب',
    noVariants: 'لا توجد خيارات متاحة لهذا المنتج',
    customerPlaceholder: 'اسم العميل (اختياري)',
    unit: 'قطعة',
    inStock: 'متوفر',
    left: 'متاح'
  },
  en: {
    search: 'Search by product name or SKU...',
    invoice: 'Current Invoice',
    walkIn: 'Walk-in Customer',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    payPrint: 'Pay & Print',
    all: 'All',
    empty: 'Invoice is empty',
    clear: 'Clear',
    clearConfirm: 'Clear current invoice?',
    outOfStock: 'Out of stock',
    stockLow: 'Insufficient stock',
    loadError: 'Unable to load POS data',
    loadRetry: 'Retry',
    saleSuccess: 'Sale completed successfully',
    chooseVariant: 'Choose Variant',
    noVariants: 'No variants available for this product',
    customerPlaceholder: 'Customer name (optional)',
    unit: 'unit',
    inStock: 'In stock',
    left: 'left'
  }
};

const ModalFrame = ({ children, onClose, className = '' }) => {
  const modalNode = (
    <div className="modal-shell" onClick={onClose}>
      <div className={`modal-card ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
  if (typeof document === 'undefined') return modalNode;
  return createPortal(modalNode, document.body);
};

const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`ui-toast ${type === 'error' ? 'ui-toast-error' : 'ui-toast-success'}`}>
    <div className="flex-1 font-medium">{message}</div>
    <button onClick={onClose} className="ui-btn ui-btn-ghost ui-btn-icon-sm text-white/90 hover:text-white hover:bg-black/10">
      <X size={14} />
    </button>
  </div>
);

const useToast = () => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    if (!msg) {
      clearToast();
      return;
    }
    setToast({ msg, type });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 2800);
  }, [clearToast]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
};

const handlePrintInvoice = (order, settings, lang, text) => {
  const win = window.open('', '', 'width=900,height=900');
  if (!win) return;

  const parseItems = (value) => {
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const items = parseItems(order.items_json || order.items);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const locale = getLatinDigitsLocale(lang);
  const currency = settings?.currency_symbol || '$';
  const formatMoney = (value) => `${currency}${Number(value || 0).toFixed(2)}`;
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const taxAmount = Number(order.tax_amount || 0);
  const totalAmount = Number(order.total_amount || 0);
  const orderId = escapeHtml(order.id);
  const textAlign = lang === 'ar' ? 'right' : 'left';
  const finalTotalColor = sanitizeCssColor(settings?.primary_color, '#2563eb');
  const siteName = escapeHtml(settings?.site_name || 'Store');
  const safeLogoUrl = sanitizePrintImageUrl(settings?.invoice_logo);
  const invoiceLogoHtml = safeLogoUrl ? `<img src="${escapeHtml(safeLogoUrl)}" class="logo" alt="${siteName}"/>` : '';
  const customerName = escapeHtml(order.customer_name || '');
  const customerPhone = escapeHtml(order.customer_phone || '');
  const createdAt = new Date(order.created_at);
  const createdDate = Number.isNaN(createdAt.getTime())
    ? ''
    : escapeHtml(createdAt.toLocaleDateString(locale));
  const createdTime = Number.isNaN(createdAt.getTime())
    ? ''
    : escapeHtml(createdAt.toLocaleTimeString(locale));
  const subtotalText = escapeHtml(formatMoney(subtotal || totalAmount));
  const discountText = escapeHtml(formatMoney(discount));
  const taxText = escapeHtml(formatMoney(taxAmount));
  const totalText = escapeHtml(formatMoney(totalAmount || subtotal));
  const notesHtml = escapeHtmlWithBreaks(settings?.invoice_notes || '');
  const contactPhone = escapeHtml(settings?.contact_phone || '');
  const contactEmail = escapeHtml(settings?.contact_email || '');
  const rowsHtml = items.map((item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    return `
      <tr>
        <td><strong>${escapeHtml(item.name || '')}</strong></td>
        <td>${escapeHtml(qty)}</td>
        <td>${escapeHtml(formatMoney(price))}</td>
        <td><strong>${escapeHtml(formatMoney(price * qty))}</strong></td>
      </tr>
    `;
  }).join('');

  win.document.write(`
    <!DOCTYPE html>
    <html dir="${dir}">
    <head>
      <title>Invoice #${orderId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
        body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; line-height: 1.5; }
        .header { text-align: center; border-bottom: 2px dashed #e5e7eb; padding-bottom: 30px; margin-bottom: 30px; }
        .logo { height: 80px; margin-bottom: 15px; object-fit: contain; }
        .title { font-size: 24px; font-weight: 900; margin: 0; color: #111; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .meta-box { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
        .meta-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 5px; }
        .meta-value { font-size: 16px; font-weight: bold; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
        th { background: #111; color: #fff; padding: 12px; text-align: ${textAlign}; font-weight: bold; }
        td { border-bottom: 1px solid #e5e7eb; padding: 12px; color: #374151; }
        .totals { margin-left: auto; width: 320px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .final-total { font-size: 20px; font-weight: 900; color: ${finalTotalColor}; border-top: 2px solid #111; padding-top: 10px; border-bottom: none; }
        .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${invoiceLogoHtml}
        <h1 class="title">${siteName}</h1>
        <p>#${orderId}</p>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <span class="meta-label">${escapeHtml('Customer')}</span>
          <div class="meta-value">${customerName}</div>
          <div style="font-size:14px;color:#666">${customerPhone}</div>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml('Date')}</span>
          <div class="meta-value">${createdDate}</div>
          <div style="font-size:14px;color:#666">${createdTime}</div>
        </div>
      </div>

      <table>
        <thead><tr><th>${escapeHtml('Item')}</th><th>${escapeHtml('Qty')}</th><th>${escapeHtml('Price')}</th><th>${escapeHtml('Total')}</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>${escapeHtml(text.subtotal)}</span><span>${subtotalText}</span></div>
        ${discount > 0 ? `<div class="total-row" style="color:red"><span>${escapeHtml('Discount')}</span><span>- ${discountText}</span></div>` : ''}
        ${taxAmount > 0 ? `<div class="total-row"><span>${escapeHtml(text.tax)}</span><span>${taxText}</span></div>` : ''}
        <div class="total-row final-total"><span>${escapeHtml(text.total)}</span><span>${totalText}</span></div>
      </div>

      <div class="footer">
        <p>${notesHtml}</p>
        <p>${contactPhone} • ${contactEmail}</p>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  win.document.close();
};

export const AdminPOS = ({ lang = 'ar' }) => {
  const text = POS_TEXT[lang] || POS_TEXT.en;
  const { toast, showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({});
  const [activeCat, setActiveCat] = useState('all');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [customer, setCustomer] = useState(text.walkIn);
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);

  const isArabic = lang === 'ar';
  const locale = getLatinDigitsLocale(lang);
  const currencySymbol = settings?.currency_symbol || '$';
  const parseBoolean = (value) => Number(value) === 1 || value === true;

  const formatMoney = useCallback((value) => {
    const n = Number(value || 0);
    return `${currencySymbol}${n.toFixed(2)}`;
  }, [currencySymbol]);

  const loadPosData = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError('');
    try {
      const [p, c, s] = await Promise.all([
        axios.get(`${API_URL}/products?limit=1000`),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/settings`)
      ]);
      setProducts(Array.isArray(p?.data?.data) ? p.data.data : []);
      setCategories(Array.isArray(c?.data) ? c.data : []);
      setSettings(s?.data || {});
    } catch {
      setCatalogError(text.loadError);
      showToast(text.loadError, 'error');
    } finally {
      setLoadingCatalog(false);
    }
  }, [showToast, text.loadError]);

  useEffect(() => {
    loadPosData();
  }, [loadPosData]);

  useEffect(() => {
    setCustomer(text.walkIn);
  }, [text.walkIn]);

  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    return products.filter((p) => {
      const name = String(p?.name || '').toLowerCase();
      const sku = String(p?.sku || '').toLowerCase();
      const categoryOk = activeCat === 'all' || String(p?.category || '') === String(activeCat);
      const searchOk = !q || name.includes(q) || sku.includes(q);
      return categoryOk && searchOk;
    });
  }, [products, search, activeCat]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0),
    [cart]
  );
  const taxRate = Number(settings?.tax_rate || 0) / 100;
  const tax = subtotal * (Number.isFinite(taxRate) ? taxRate : 0);
  const total = subtotal + tax;

  const addToCart = useCallback((product, variant = null) => {
    if (!product) return;
    const hasVariants = parseBoolean(product.has_variants);
    if (hasVariants && !variant) {
      setVariantPickerProduct(product);
      return;
    }

    const stock = Number(variant ? variant.stock_quantity : product.stock_quantity || 0);
    if (stock <= 0) {
      showToast(text.outOfStock, 'error');
      return;
    }

    const itemKey = variant ? `${product.id}-${variant.id}` : `${product.id}`;
    const unitPrice = Number(variant ? variant.price : product.base_price || 0);
    const itemName = variant ? `${product.name} (${variant.name})` : product.name;
    let blockedByStock = false;

    setCart((prev) => {
      const existing = prev.find((item) => item.itemKey === itemKey);
      if (existing) {
        if (Number(existing.quantity || 0) + 1 > stock) {
          blockedByStock = true;
          return prev;
        }
        return prev.map((item) => (
          item.itemKey === itemKey
            ? { ...item, quantity: Number(item.quantity || 0) + 1, max_stock: stock }
            : item
        ));
      }

      return [
        ...prev,
        {
          itemKey,
          id: product.id,
          variant_id: variant?.id || null,
          base_name: product.name,
          name: itemName,
          price: unitPrice,
          quantity: 1,
          image_url: product.image_url,
          max_stock: stock
        }
      ];
    });

    if (blockedByStock) {
      showToast(text.stockLow, 'error');
      return;
    }

    if (variant) setVariantPickerProduct(null);
  }, [showToast, text.outOfStock, text.stockLow]);

  const updateQty = useCallback((itemKey, delta) => {
    let blockedByStock = false;
    setCart((prev) => prev.map((item) => {
      if (item.itemKey !== itemKey) return item;
      const nextQty = Number(item.quantity || 0) + delta;
      if (nextQty < 1) return item;
      const maxStock = Number(item.max_stock || 0);
      if (maxStock > 0 && nextQty > maxStock) {
        blockedByStock = true;
        return item;
      }
      return { ...item, quantity: nextQty };
    }));
    if (blockedByStock) showToast(text.stockLow, 'error');
  }, [showToast, text.stockLow]);

  const clearCart = useCallback((confirm = true) => {
    if (confirm && cart.length > 0 && !window.confirm(text.clearConfirm)) return;
    setCart([]);
  }, [cart.length, text.clearConfirm]);

  const handleCheckout = async () => {
    if (cart.length === 0 || loadingCheckout) return;
    setLoadingCheckout(true);
    try {
      const orderData = {
        customer_name: String(customer || text.walkIn).trim() || text.walkIn,
        items: cart.map((item) => ({
          id: item.id,
          variant_id: item.variant_id || null,
          quantity: Number(item.quantity || 1),
          name: item.base_name || item.name
        })),
        source: 'pos'
      };
      const res = await axios.post(`${API_URL}/orders`, orderData, { withCredentials: true });
      const payload = res?.data || {};
      const printableOrder = {
        id: payload.id,
        customer_name: orderData.customer_name,
        customer_phone: '',
        created_at: payload.created_at || new Date().toISOString(),
        subtotal: Number(payload.subtotal || subtotal),
        discount: Number(payload.discount || 0),
        tax_amount: Number(payload.tax_amount || tax),
        total_amount: Number(payload.total || payload.total_amount || total),
        items_json: JSON.stringify(Array.isArray(payload.items) ? payload.items : cart)
      };
      handlePrintInvoice(printableOrder, settings, lang, text);
      setCart([]);
      setCustomer(text.walkIn);
      showToast(text.saleSuccess);
      await loadPosData();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Checkout failed', 'error');
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col xl:flex-row gap-6 animate-fade-in font-sans">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => showToast(null)} />}

      {variantPickerProduct && (
        <ModalFrame onClose={() => setVariantPickerProduct(null)} className="max-w-2xl">
          <div className="p-6 border-b border-subtle flex items-center justify-between bg-card-soft">
            <div>
              <h3 className="text-xl font-black text-primary">{text.chooseVariant}</h3>
              <p className="text-sm text-muted mt-1">{variantPickerProduct.name}</p>
            </div>
            <button
              onClick={() => setVariantPickerProduct(null)}
              className="ui-btn ui-btn-icon-sm ui-btn-icon-neutral"
              aria-label="Close variant modal"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            {(Array.isArray(variantPickerProduct.variants) ? variantPickerProduct.variants : []).map((variant) => {
              const vStock = Number(variant.stock_quantity || 0);
              const disabled = vStock <= 0;
              return (
                <button
                  key={`variant-${variant.id}`}
                  disabled={disabled}
                  onClick={() => addToCart(variantPickerProduct, variant)}
                  className="w-full text-start rounded-2xl border border-subtle bg-card p-4 flex items-center justify-between hover:border-primary hover:shadow-soft transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="font-bold text-primary">{variant.name}</div>
                    <div className="text-xs text-muted mt-1">SKU: {variant.sku || '-'}</div>
                  </div>
                  <div className="text-end">
                    <div className="font-black text-primary">{formatMoney(variant.price)}</div>
                    <div className={`text-xs mt-1 ${disabled ? 'text-red-600' : 'text-emerald-600'}`}>
                      {disabled ? text.outOfStock : `${text.inStock}: ${vStock}`}
                    </div>
                  </div>
                </button>
              );
            })}
            {(!Array.isArray(variantPickerProduct.variants) || variantPickerProduct.variants.length === 0) && (
              <div className="rounded-2xl border border-subtle p-6 text-center text-muted bg-card-soft">
                {text.noVariants}
              </div>
            )}
          </div>
        </ModalFrame>
      )}

      <div className="flex-1 flex flex-col bg-card rounded-3xl shadow-soft border border-subtle overflow-hidden min-h-[420px]">
        <div className="p-5 border-b border-subtle space-y-4 bg-card z-10">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1">
              <Search className={`absolute top-3.5 text-muted ${isArabic ? 'right-4' : 'left-4'}`} size={20} />
              <input
                className={`ui-input text-lg ${isArabic ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                placeholder={text.search}
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-muted bg-card-soft px-4 py-3 rounded-2xl border border-subtle">
              <Calendar size={18} />
              <span className="text-sm font-bold">{new Date().toLocaleDateString(locale)}</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setActiveCat('all')} className={`ui-btn-chip whitespace-nowrap ${activeCat === 'all' ? 'ui-btn-chip-active' : ''}`}>
              {text.all}
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setActiveCat(c.name)} className={`ui-btn-chip whitespace-nowrap ${activeCat === c.name ? 'ui-btn-chip-active' : ''}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-card-soft/50">
          {loadingCatalog && (
            <div className="h-full flex items-center justify-center text-muted">{isArabic ? 'جاري تحميل المنتجات...' : 'Loading products...'}</div>
          )}

          {!loadingCatalog && catalogError && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <p className="text-red-500 font-semibold">{catalogError}</p>
              <button onClick={loadPosData} className="ui-btn ui-btn-secondary">{text.loadRetry}</button>
            </div>
          )}

          {!loadingCatalog && !catalogError && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((p) => {
                const hasVariants = parseBoolean(p.has_variants);
                const variants = Array.isArray(p.variants) ? p.variants : [];
                const inStockVariants = variants.filter((v) => Number(v.stock_quantity || 0) > 0);
                const stockCount = hasVariants ? inStockVariants.length : Number(p.stock_quantity || 0);
                const soldOut = hasVariants ? inStockVariants.length === 0 : stockCount <= 0;
                const variantPrices = variants
                  .map((v) => Number(v.price || 0))
                  .filter((n) => Number.isFinite(n) && n >= 0);
                const displayPrice = hasVariants && variantPrices.length > 0
                  ? Math.min(...variantPrices)
                  : Number(p.base_price || 0);

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`product-card p-3 text-start cursor-pointer group relative overflow-hidden flex flex-col hover:-translate-y-1 transition ${soldOut ? 'opacity-60 grayscale' : ''}`}
                    disabled={soldOut}
                  >
                    <div className="aspect-[4/3] bg-card-soft rounded-xl mb-3 overflow-hidden relative flex items-center justify-center">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                          loading="lazy"
                          alt={p.name}
                        />
                      ) : (
                        <Box className="text-muted" size={32} />
                      )}
                      <div className={`absolute top-2 ${isArabic ? 'right-2' : 'left-2'} text-[10px] font-bold px-2 py-1 rounded-md shadow-sm backdrop-blur-md ${soldOut ? 'bg-red-500 text-white' : 'bg-card text-primary'}`}>
                        {hasVariants
                          ? `${isArabic ? 'خيارات' : 'Variants'} ${inStockVariants.length}/${variants.length}`
                          : `${stockCount} ${text.left}`}
                      </div>
                    </div>
                    <div className="mt-auto">
                      <h4 className="font-bold text-primary text-sm truncate mb-1" title={p.name}>{p.name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-black text-lg">
                          {hasVariants
                            ? `${isArabic ? 'من' : 'From'} ${formatMoney(displayPrice)}`
                            : formatMoney(displayPrice)}
                        </span>
                        <div className="w-6 h-6 bg-card-soft rounded-full flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-white transition-colors">
                          <Plus size={14} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full xl:w-[420px] bg-card rounded-3xl shadow-lift border border-subtle flex flex-col overflow-hidden relative min-h-[420px]">
        <div className="p-5 bg-primary text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={20} /> {text.invoice}</h2>
            <button onClick={() => clearCart(true)} className="ui-btn ui-btn-danger ui-btn-xs">{text.clear}</button>
          </div>
          <div className="bg-black/10 p-3 rounded-xl flex items-center gap-3">
            <div className="bg-black/20 p-2 rounded-full"><Users size={16} /></div>
            <input
              className="bg-transparent border-none text-white placeholder-white/70 outline-none w-full text-sm font-medium"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder={text.customerPlaceholder}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card-soft/30">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted space-y-4 opacity-60">
              <ShoppingBag size={64} strokeWidth={1} />
              <p>{text.empty}</p>
            </div>
          )}

          {cart.map((item) => (
            <div key={item.itemKey} className="flex gap-3 bg-card p-3 rounded-2xl border border-subtle shadow-sm group hover:border-primary/30 transition-colors relative">
              <div className="w-16 h-16 bg-card-soft rounded-xl flex items-center justify-center overflow-hidden border border-subtle shrink-0">
                {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} /> : <Box size={20} className="text-muted" />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="font-bold text-sm text-primary truncate" title={item.name}>{item.name}</div>
                <div className="text-xs text-muted font-mono">{formatMoney(item.price)} / {text.unit}</div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="font-bold text-primary">{formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</div>
                <div className="flex items-center bg-card-soft rounded-lg h-7">
                  <button onClick={() => updateQty(item.itemKey, -1)} className="ui-btn ui-btn-secondary ui-btn-icon-sm h-full rounded-s-lg text-secondary">-</button>
                  <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.itemKey, 1)} className="ui-btn ui-btn-secondary ui-btn-icon-sm h-full rounded-e-lg text-secondary">+</button>
                </div>
              </div>
              <button onClick={() => setCart((prev) => prev.filter((cartItem) => cartItem.itemKey !== item.itemKey))} className={`ui-btn ui-btn-icon-sm ui-btn-icon-danger absolute top-2 ${isArabic ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity`} title="Remove">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 bg-card border-t border-subtle shadow-[0_-5px_20px_rgba(0,0,0,0.02)] z-10">
          <div className="space-y-2 mb-6 text-sm">
            <div className="flex justify-between text-muted"><span>{text.subtotal}</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between text-muted"><span>{text.tax} ({settings.tax_rate || 0}%)</span><span>{formatMoney(tax)}</span></div>
            <div className="flex justify-between text-xl font-black text-primary border-t border-subtle pt-2 mt-2">
              <span>{text.total}</span>
              <span className="text-primary">{formatMoney(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => clearCart(true)} className="ui-btn ui-btn-danger ui-btn-lg col-span-1 flex-col gap-1">
              <Trash2 size={20} />
              <span className="text-[10px]">{text.clear}</span>
            </button>
            <button
              onClick={handleCheckout}
              disabled={loadingCheckout || cart.length === 0}
              className="ui-btn ui-btn-primary ui-btn-lg col-span-3 disabled:bg-card-soft disabled:text-muted disabled:shadow-none"
            >
              {loadingCheckout ? <RefreshCw className="animate-spin" /> : <Printer size={20} />}
              <span>{text.payPrint}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
