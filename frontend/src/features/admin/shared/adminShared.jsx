import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Upload,
  X,
  XCircle
} from 'lucide-react';
import { API_URL } from '../../../app/config';
import { escapeHtml, escapeHtmlWithBreaks, sanitizeCssColor, sanitizePrintImageUrl } from '../utils/printSanitizer';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';

export const TRANSLATIONS = {
  ar: {
    // General
    save: "حفظ التغييرات", saving: "جاري الحفظ...", cancel: "إلغاء", delete: "حذف", edit: "تعديل", add: "إضافة جديد",
    search: "بحث في السجلات...", confirmDelete: "هل أنت متأكد تماماً؟ لا يمكن التراجع عن هذا الإجراء.",
    uploading: "جاري الرفع...", uploadNew: "اضغط لرفع صورة", mediaLib: "مكتبة الوسائط",
    imageLinkPlaceholder: "ألصق رابط الصورة (https://...)",
    addByLink: "إضافة عبر رابط",
    success: "تمت العملية بنجاح", error: "حدث خطأ غير متوقع", actions: "إجراءات",
    // Analytics
    analytics: "لوحة المعلومات", totalSales: "إجمالي المبيعات", totalOrders: "عدد الطلبات",
    totalCost: "إجمالي التكلفة", grossProfit: "إجمالي الربح", profitMargin: "هامش الربح",
    activity: "سجل النشاط", action: "الإجراء", entity: "العنصر", by: "بواسطة", time: "الوقت",
    lowStock: "تنبيهات المخزون", lowStockItems: "منتجات بحاجة لإعادة طلب", quantity: "الكمية", status: "الحالة",
    avgOrder: "متوسط قيمة الطلب", revenueTrend: "اتجاه الإيرادات", categoryDistribution: "توزيع الفئات",
    trafficVsSales: "الزيارات مقابل المبيعات", refresh: "تحديث", lastDays: "آخر", noData: "لا توجد بيانات حالياً",
    critical: "حرج", warning: "تنبيه", completed: "مكتمل", pending: "قيد الانتظار",
    commandCenter: "مركز قيادة المتجر", dashboardReady: "اللوحة التحليلية جاهزة بالبيانات الحية",
    revenueGrowth: "نمو الإيرادات", ordersGrowth: "نمو الطلبات",
    // Products
    products: "إدارة المنتجات", addProduct: "منتج جديد", productName: "اسم المنتج", price: "سعر البيع", costPrice: "سعر التكلفة",
    stock: "المخزون الحالي", category: "القسم", sku: "رمز المنتج (SKU)", hasVariants: "تفعيل الخيارات المتعددة (ألوان/أحجام)",
    addVariant: "إضافة خيار جديد", variantName: "اسم الخيار (مثال: أحمر / XL)", basePrice: "السعر الأساسي", description: "وصف المنتج",
    mainImage: "الصورة الرئيسية", hoverImage: "صورة التمرير (Hover)", images: "صور المنتج",
    basicInfo: "البيانات الأساسية", inventory: "المخزون والتسعير", organization: "التصنيف والتنظيم",
    seoTitle: "عنوان SEO", seoDesc: "وصف SEO", seoKeywords: "كلمات مفتاحية (SEO)", specs: "المواصفات", addSpec: "إضافة مواصفة",
    bulkActions: "إجراءات جماعية", publish: "نشر", unpublish: "إخفاء", setCategory: "تعيين قسم",
    priceAdjust: "تعديل الأسعار", increase: "رفع", decrease: "خفض", percent: "نسبة مئوية",
    // POS
    pos: "نقطة البيع (POS)", invoice: "الفاتورة الحالية", payPrint: "إتمام ودفع", walkIn: "عميل نقدي",
    total: "الإجمالي النهائي", subtotal: "المجموع", tax: "الضريبة", addToCart: "إضافة", item: "صنف",
    // Orders
    orders: "سجل الطلبات", orderId: "رقم الطلب", customer: "بيانات العميل", date: "تاريخ الطلب", print: "طباعة الفاتورة", orderNotes: "ملاحظات الطلب",
    users: "فريق العمل", addUser: "إضافة موظف", fullName: "الاسم الكامل", username: "اسم المستخدم", password: "كلمة المرور",
    role: "الصلاحية الوظيفية", admin: "مدير النظام", editor: "محرر محتوى", cashier: "كاشير / مبيعات",
    customers: "العملاء", customerName: "الاسم", customerEmail: "البريد الإلكتروني", customerPhone: "رقم الهاتف", customerAddress: "العنوان",
    // Categories
    categories: "أقسام المنتجات", addCategory: "إضافة قسم", catName: "عنوان القسم", catDesc: "وصف مختصر", catImg: "صورة الغلاف",
    // Settings
    settings: "إعدادات النظام", tabGeneral: "عام", tabBranding: "الهوية", tabInvoice: "الفواتير", tabContact: "التواصل",
    siteName: "اسم المتجر", siteDesc: "وصف المتجر (SEO)", email: "البريد الرسمي", phone: "رقم الهاتف",
    primaryColor: "لون الهوية (Primary)", footerText: "نص التذييل (Footer)", logo: "شعار الموقع", invoiceNotes: "شروط الفاتورة",
    // Pages
    pages: "إدارة المحتوى (CMS)", pageBuilder: "محرر الصفحات", newPage: "إنشاء صفحة", pageTitle: "عنوان الصفحة",
    pageSlug: "الرابط الدائم (Slug)", components: "مكونات الصفحة", compHero: "بنر ترحيبي (Hero)", compText: "محتوى نصي", compGrid: "شبكة منتجات"
  },
  en: {
    // English translations mirroring Arabic structure
    save: "Save Changes", saving: "Saving...", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add New",
    search: "Search records...", confirmDelete: "Are you sure? This action cannot be undone.",
    uploading: "Uploading...", uploadNew: "Click to Upload", mediaLib: "Media Library",
    imageLinkPlaceholder: "Paste image URL (https://...)",
    addByLink: "Add by URL",
    success: "Operation Successful", error: "An error occurred", actions: "Actions",
    analytics: "Dashboard", totalSales: "Total Sales", totalOrders: "Total Orders",
    totalCost: "Total Cost", grossProfit: "Gross Profit", profitMargin: "Profit Margin",
    activity: "Activity Log", action: "Action", entity: "Entity", by: "By", time: "Time",
    lowStock: "Stock Alerts", lowStockItems: "Items needing restock", quantity: "Qty", status: "Status",
    avgOrder: "Avg Order Value", revenueTrend: "Revenue Trend", categoryDistribution: "Category Distribution",
    trafficVsSales: "Traffic vs Sales", refresh: "Refresh", lastDays: "Last", noData: "No data available yet",
    critical: "Critical", warning: "Warning", completed: "Completed", pending: "Pending",
    commandCenter: "Store Command Center", dashboardReady: "Your analytics dashboard is synced with live data",
    revenueGrowth: "Revenue Growth", ordersGrowth: "Orders Growth",
    products: "Products Manager", addProduct: "New Product", productName: "Product Name", price: "Selling Price", costPrice: "Cost Price",
    stock: "Current Stock", category: "Category", sku: "SKU", hasVariants: "Enable Variants (Colors/Sizes)",
    addVariant: "Add Variant", variantName: "Variant Name", basePrice: "Base Price", description: "Description",
    mainImage: "Main Image", hoverImage: "Hover Image", images: "Images", basicInfo: "Basic Info",
    inventory: "Inventory & Pricing", organization: "Organization",
    seoTitle: "SEO Title", seoDesc: "SEO Description", seoKeywords: "SEO Keywords", specs: "Specifications", addSpec: "Add Spec",
    bulkActions: "Bulk Actions", publish: "Publish", unpublish: "Unpublish", setCategory: "Set Category",
    priceAdjust: "Price Adjustment", increase: "Increase", decrease: "Decrease", percent: "Percentage",
    pos: "Point of Sale", invoice: "Current Invoice", payPrint: "Pay & Print", walkIn: "Walk-in Customer",
    total: "Grand Total", subtotal: "Subtotal", tax: "Tax", addToCart: "Add", item: "Item",
    orders: "Orders History", orderId: "Order ID", customer: "Customer Info", date: "Order Date", print: "Print Invoice", orderNotes: "Order Notes",
    users: "Staff Team", addUser: "Add Employee", fullName: "Full Name", username: "Username", password: "Password",
    role: "Role", admin: "Administrator", editor: "Content Editor", cashier: "Sales / Cashier",
    customers: "Customers", customerName: "Name", customerEmail: "Email", customerPhone: "Phone", customerAddress: "Address",
    categories: "Categories", addCategory: "Add Category", catName: "Category Title", catDesc: "Short Description", catImg: "Cover Image",
    settings: "System Settings", tabGeneral: "General", tabBranding: "Branding", tabInvoice: "Invoice", tabContact: "Contact",
    siteName: "Store Name", siteDesc: "SEO Description", email: "Official Email", phone: "Phone Number",
    primaryColor: "Brand Color", footerText: "Footer Text", logo: "Store Logo", invoiceNotes: "Invoice Terms",
    pages: "Content Manager (CMS)", pageBuilder: "Page Builder", newPage: "Create Page", pageTitle: "Page Title",
    pageSlug: "Permalink (Slug)", components: "Components", compHero: "Hero Banner", compText: "Rich Text", compGrid: "Product Grid"
  }
};

// =================================================================================================
// 2. UI COMPONENTS KIT (أدوات الواجهة)
// =================================================================================================

export const Card = ({ children, className = "" }) => (
  <div className={`card premium-panel ${className}`}>{children}</div>
);

export const TableShell = ({ children, className = "" }) => (
  <div className={`table-shell ${className}`}>{children}</div>
);

export const ModalFrame = ({ children, onClose, className = "" }) => {
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

export const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled }) => {
  const base = "ui-btn";
  const styles = {
    primary: "ui-btn-primary",
    secondary: "ui-btn-secondary",
    danger: "ui-btn-danger",
    ghost: "ui-btn-ghost"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {Icon && <Icon size={18} />} {children}
    </button>
  );
};

export const Input = ({ label, ...props }) => (
  <div className="space-y-2">
    {label && <label className="ui-field-label">{label}</label>}
    <input className="ui-input" {...props} />
  </div>
);

export const ChartCanvas = ({ height = 300, children, fallback = null }) => {
  const hostRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      const nextWidth = Math.max(0, Math.floor(rect.width));
      setChartWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [height]);

  return (
    <div ref={hostRef} className="w-full" style={{ height: `${height}px`, minHeight: `${height}px` }}>
      {chartWidth > 16 ? children({ width: chartWidth, height }) : (fallback || <div className="h-full w-full" />)}
    </div>
  );
};

// نظام الإشعارات (Toasts)
export const Toast = ({ message, type, onClose }) => (
  <div className={`ui-toast ${type === 'error' ? 'ui-toast-error' : 'ui-toast-success'}`}>
    {type === 'error' ? <XCircle size={24}/> : <CheckCircle size={24}/>}
    <div className="flex-1 font-medium">{message}</div>
    <button onClick={onClose} className="ui-btn ui-btn-ghost ui-btn-icon-sm text-white/80 hover:text-white hover:bg-black/10">
      <X size={16} />
    </button>
  </div>
);

// هوك مخصص لإدارة الإشعارات
export const useToast = () => {
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const clearToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    if (!msg) {
      clearToast();
      return;
    }
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  }, [clearToast]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  return { toast, showToast };
};

// =================================================================================================`r`n// 3. MEDIA & PRINT UTILITIES
// =================================================================================================

export const MediaPicker = ({ onSelect, onClose, lang = 'ar' }) => {
  const t = TRANSLATIONS[lang];
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [search, setSearch] = useState('');

  const refreshMedia = useCallback(async () => {
    const res = await axios.get(`${API_URL}/media`, { withCredentials: true });
    setMedia(res.data || []);
  }, []);

  useEffect(() => {
    refreshMedia().catch(console.error);
  }, [refreshMedia]);

  const handleUpload = async (e) => {
    if (!e.target.files[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      await axios.post(`${API_URL}/media`, formData, { withCredentials: true });
      await refreshMedia();
    } catch { alert(t.error); }
    finally { setUploading(false); }
  };

  const handleAddByLink = async () => {
    const normalizedUrl = String(linkUrl || '').trim();
    if (!normalizedUrl) return;
    setAddingLink(true);
    try {
      await axios.post(`${API_URL}/media/link`, { url: normalizedUrl }, { withCredentials: true });
      setLinkUrl('');
      await refreshMedia();
    } catch (error) {
      alert(error?.response?.data?.error || t.error);
    } finally {
      setAddingLink(false);
    }
  };

  const searchTerm = search.toLowerCase();
  const filteredMedia = media.filter((m) => {
    const haystack = `${m?.filename || ''} ${m?.url || ''}`.toLowerCase();
    return haystack.includes(searchTerm);
  });
  const mediaToolbarFlow = lang === 'ar' ? 'lg:flex-row-reverse' : 'lg:flex-row';

  return (
    <ModalFrame onClose={onClose} className="max-w-6xl h-[90vh] flex flex-col">
        <div className="p-6 border-b border-subtle flex justify-between items-center bg-card-soft/55">
          <h3 className="font-black text-2xl text-primary flex items-center gap-3">
            <div className="bg-card p-2 rounded-lg text-accent"><ImageIcon size={24}/></div>
            {t.mediaLib}
          </h3>
          <button onClick={onClose} className="ui-btn ui-btn-icon ui-btn-icon-danger" aria-label="Close media picker">
            <X size={20}/>
          </button>
        </div>
        
        <div className="p-4 border-b border-subtle bg-card space-y-3">
          <div className={`flex flex-col ${mediaToolbarFlow} gap-3 items-stretch`}>
            <div className="relative flex-1 min-w-0">
              <Search className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={20}/>
              <input 
                className={`ui-input h-[50px] ${lang === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
                placeholder={t.search}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <label className="ui-btn ui-btn-primary justify-center w-full lg:w-[210px] h-[50px] shrink-0 cursor-pointer">
              {uploading ? <RefreshCw className="animate-spin"/> : <Upload size={20}/>}
              {uploading ? t.uploading : t.uploadNew}
              <input type="file" hidden onChange={handleUpload} accept="image/*" />
            </label>
          </div>

          <div className={`flex flex-col ${mediaToolbarFlow} gap-3 items-stretch`}>
            <input
              className={`ui-input h-[50px] flex-1 min-w-0 text-left ${lang === 'ar' ? 'lg:text-right' : ''}`}
              placeholder={t.imageLinkPlaceholder}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleAddByLink}
              disabled={addingLink || !String(linkUrl || '').trim()}
              className="ui-btn ui-btn-secondary justify-center w-full lg:w-[210px] h-[50px] shrink-0 whitespace-nowrap disabled:opacity-60"
            >
              {addingLink ? t.uploading : t.addByLink}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-page">
          {media.length === 0 && !uploading && (
            <div className="h-full flex flex-col items-center justify-center text-muted">
              <ImageIcon size={64} className="mb-4 opacity-20"/>
              <p>مكتبة الوسائط فارغة</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredMedia.map(m => (
              <div key={m.id} onClick={()=>{onSelect(m); onClose()}} className="group relative bg-card border border-subtle rounded-2xl overflow-hidden aspect-square cursor-pointer hover:shadow-lift hover:border-primary hover:-translate-y-1 transition-all">
                <img src={m.url} className="w-full h-full object-cover" alt={m.filename}/>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <div className="bg-card text-primary px-4 py-2 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">اختر</div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </ModalFrame>
  );
};

export const handlePrintInvoice = (order, settings, lang) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
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
  const rowsHtml = items.map((i) => {
    const qty = Number(i.quantity || 0);
    const price = Number(i.price || 0);
    return `
      <tr>
        <td><strong>${escapeHtml(i.name || '')}</strong></td>
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
        <p>${escapeHtml(t.orderId)}: #${orderId}</p>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t.customer)}</span>
          <div class="meta-value">${customerName}</div>
          <div style="font-size:14px;color:#666">${customerPhone}</div>
        </div>
        <div class="meta-box">
          <span class="meta-label">${escapeHtml(t.date)}</span>
          <div class="meta-value">${createdDate}</div>
          <div style="font-size:14px;color:#666">${createdTime}</div>
        </div>
      </div>

      <table>
        <thead><tr><th>${escapeHtml(t.item)}</th><th>${escapeHtml(t.quantity)}</th><th>${escapeHtml(t.price)}</th><th>${escapeHtml(t.total)}</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>${escapeHtml(t.subtotal)}</span><span>${subtotalText}</span></div>
        ${discount > 0 ? `<div class="total-row" style="color:red"><span>${escapeHtml(lang === 'ar' ? 'خصم' : 'Discount')}</span><span>- ${discountText}</span></div>` : ''}
        ${taxAmount > 0 ? `<div class="total-row"><span>${escapeHtml(t.tax)}</span><span>${taxText}</span></div>` : ''}
        <div class="total-row final-total"><span>${escapeHtml(t.total)}</span><span>${totalText}</span></div>
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

