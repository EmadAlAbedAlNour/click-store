import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  TrendingUp,
  X,
  XCircle
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import axiosClient from '../../../shared/api/axiosClient';
import { useSettingsContext } from '../../../shared/contexts/SettingsContext';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';

const CURRENCY_SYMBOLS_BY_CODE = {
  USD: '$',
  EUR: 'EUR',
  GBP: 'GBP',
  AED: 'AED',
  SAR: 'SAR',
  EGP: 'EGP'
};

const TRANSLATIONS = {
  ar: {
    addProduct: 'منتج جديد',
    categoryDistribution: 'توزيع الفئات',
    commandCenter: 'مركز قيادة المتجر',
    dashboardReady: 'اللوحة التحليلية جاهزة بالبيانات الحية',
    error: 'حدث خطأ غير متوقع',
    grossProfit: 'إجمالي الربح',
    lastDays: 'آخر',
    lowStock: 'تنبيهات المخزون',
    lowStockItems: 'منتجات بحاجة لإعادة طلب',
    noData: 'لا توجد بيانات حالياً',
    orders: 'سجل الطلبات',
    ordersGrowth: 'نمو الطلبات',
    pos: 'نقطة البيع (POS)',
    profitMargin: 'هامش الربح',
    refresh: 'تحديث',
    revenueGrowth: 'نمو الإيرادات',
    revenueTrend: 'اتجاه الإيرادات',
    settings: 'إعدادات النظام',
    status: 'الحالة',
    totalCost: 'إجمالي التكلفة',
    totalOrders: 'عدد الطلبات',
    totalSales: 'إجمالي المبيعات',
    trafficVsSales: 'الزيارات مقابل المبيعات',
    avgOrder: 'متوسط قيمة الطلب',
    critical: 'حرج',
    warning: 'تنبيه'
  },
  en: {
    addProduct: 'New Product',
    categoryDistribution: 'Category Distribution',
    commandCenter: 'Store Command Center',
    dashboardReady: 'Your analytics dashboard is synced with live data',
    error: 'An error occurred',
    grossProfit: 'Gross Profit',
    lastDays: 'Last',
    lowStock: 'Stock Alerts',
    lowStockItems: 'Items needing restock',
    noData: 'No data available yet',
    orders: 'Orders History',
    ordersGrowth: 'Orders Growth',
    pos: 'Point of Sale',
    profitMargin: 'Profit Margin',
    refresh: 'Refresh',
    revenueGrowth: 'Revenue Growth',
    revenueTrend: 'Revenue Trend',
    settings: 'System Settings',
    status: 'Status',
    totalCost: 'Total Cost',
    totalOrders: 'Total Orders',
    totalSales: 'Total Sales',
    trafficVsSales: 'Traffic vs Sales',
    avgOrder: 'Avg Order Value',
    critical: 'Critical',
    warning: 'Warning'
  }
};

const Card = ({ children, className = '' }) => (
  <div className={`card premium-panel ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled }) => {
  const base = 'ui-btn';
  const styles = {
    primary: 'ui-btn-primary',
    secondary: 'ui-btn-secondary',
    danger: 'ui-btn-danger',
    ghost: 'ui-btn-ghost'
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ChartCanvas = ({ height = 300, children, fallback = null }) => {
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

const Toast = ({ message, type, onClose }) => (
  <div className={`ui-toast ${type === 'error' ? 'ui-toast-error' : 'ui-toast-success'}`}>
    {type === 'error' ? <XCircle size={24} /> : <CheckCircle size={24} />}
    <div className="flex-1 font-medium">{message}</div>
    <button onClick={onClose} className="ui-btn ui-btn-ghost ui-btn-icon-sm text-white/80 hover:text-white hover:bg-black/10">
      <X size={16} />
    </button>
  </div>
);

const useToast = () => {
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

const DashboardPage = ({ lang = 'ar' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const { toast, showToast } = useToast();
  const { settings: siteSettings, loading: settingsLoading } = useSettingsContext();
  const locale = getLatinDigitsLocale(lang);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_sales: 0,
    orders_count: 0,
    currency_symbol: '$',
    range_days: 14,
    kpis: {
      total_sales: 0,
      total_cost: 0,
      gross_profit: 0,
      profit_margin_pct: 0,
      orders_count: 0,
      revenue_orders_count: 0,
      avg_order_value: 0,
      completed_orders: 0,
      pending_orders: 0,
      revenue_growth_pct: 0,
      orders_growth_pct: 0
    },
    revenue_trend: [],
    category_distribution: [],
    traffic_vs_sales: [],
    status_distribution: [],
    low_stock: [],
    low_stock_summary: { critical: 0, warning: 0, total: 0 }
  });

  const chartPalette = ['var(--color-primary)', 'var(--color-primary-2)', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
  const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const resolveCurrencySymbol = useCallback((rawCurrency) => {
    if (!rawCurrency) return '$';
    if (rawCurrency.length <= 3 && CURRENCY_SYMBOLS_BY_CODE[rawCurrency.toUpperCase()]) {
      return CURRENCY_SYMBOLS_BY_CODE[rawCurrency.toUpperCase()];
    }
    return rawCurrency;
  }, []);

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return `${stats.currency_symbol || '$'}${n.toLocaleString(locale, { numberingSystem: 'latn', minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };
  const formatNumber = (value) => Number(value || 0).toLocaleString(locale, { numberingSystem: 'latn' });
  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
  const growthTone = (value) => (Number(value || 0) >= 0 ? 'text-emerald-600' : 'text-red-600');

  const quickActions = [
    { label: t.pos, icon: <DollarSign size={22} />, color: 'from-primary to-primary-strong', path: '/admin/pos' },
    { label: t.addProduct, icon: <Plus size={22} />, color: 'from-violet-600 to-purple-700', path: '/admin/products' },
    { label: t.orders, icon: <FileText size={22} />, color: 'from-orange-500 to-amber-600', path: '/admin/orders' },
    { label: t.settings, icon: <Settings size={22} />, color: 'from-primary-strong to-primary', path: '/admin/settings' }
  ];

  const fetchAnalytics = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    if (!silent) setLoading(true);
    try {
      const res = await axiosClient.get('/analytics', { params: { days: 14 } });
      const payload = res?.data?.data || res?.data || {};
      const overview = payload?.overview || {};
      const rawPieChart = Array.isArray(payload?.pie_chart)
        ? payload.pie_chart
        : (Array.isArray(payload?.status_distribution) ? payload.status_distribution : []);
      const rawLowStock = Array.isArray(payload?.low_stock) ? payload.low_stock : [];

      const normalizeLabel = (dateStr, fallbackLabel) => {
        if (!dateStr) return fallbackLabel || '';
        const dateObj = new Date(`${dateStr}T00:00:00`);
        if (Number.isNaN(dateObj.getTime())) return fallbackLabel || dateStr;
        return dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      };

      const salesChart = Array.isArray(payload?.sales_chart) ? payload.sales_chart : [];
      const legacyRevenueTrend = Array.isArray(payload?.revenue_trend) ? payload.revenue_trend : [];
      const revenueSource = salesChart.length > 0 ? salesChart : legacyRevenueTrend;
      const revenueTrend = revenueSource.map((row) => {
        const date = row.date || row.label;
        const revenue = toNumber(row.revenue ?? row.total_sales ?? row.sales ?? row.amount);
        const orders = toNumber(row.orders ?? row.orders_count ?? row.count);
        const cost = toNumber(row.cost ?? row.total_cost);
        const profit = toNumber(row.profit ?? row.gross_profit, revenue - cost);
        return {
          ...row,
          date,
          label: normalizeLabel(date, row.label || date || ''),
          revenue,
          orders,
          cost,
          profit
        };
      });

      const lowStock = rawLowStock.map((item) => {
        const stockQuantity = toNumber(item.stock_quantity ?? item.stock);
        return {
          ...item,
          stock_quantity: stockQuantity,
          severity: item.severity || (stockQuantity <= 2 ? 'critical' : 'warning')
        };
      });

      const statusDistribution = rawPieChart.map((item) => ({
        name: item.name || item.status || (lang === 'ar' ? 'غير محدد' : 'Unknown'),
        value: toNumber(item.value ?? item.count)
      }));

      const totalSales = toNumber(overview.revenue ?? payload.total_sales ?? payload?.kpis?.total_sales);
      const ordersCount = toNumber(overview.orders ?? payload.orders_count ?? payload?.kpis?.orders_count);
      const currencySymbol = resolveCurrencySymbol(payload.currency_symbol || siteSettings?.currency);
      const completedOrders = statusDistribution.reduce((sum, entry) => (
        ['completed', 'delivered', 'shipped'].includes(String(entry.name).toLowerCase())
          ? sum + toNumber(entry.value)
          : sum
      ), 0);
      const pendingOrders = statusDistribution.reduce((sum, entry) => (
        ['pending', 'processing'].includes(String(entry.name).toLowerCase())
          ? sum + toNumber(entry.value)
          : sum
      ), 0);
      const totalCost = toNumber(payload?.kpis?.total_cost ?? payload.total_cost);
      const grossProfit = toNumber(payload?.kpis?.gross_profit ?? payload.gross_profit, totalSales - totalCost);
      const profitMarginPct = toNumber(
        payload?.kpis?.profit_margin_pct,
        totalSales > 0 ? (grossProfit / totalSales) * 100 : 0
      );

      const trafficVsSales = Array.isArray(payload.traffic_vs_sales)
        ? payload.traffic_vs_sales.map((row) => ({ ...row, label: normalizeLabel(row.date, row.label) }))
        : [];
      setStats({
        total_sales: totalSales,
        orders_count: ordersCount,
        currency_symbol: currencySymbol,
        range_days: Number(payload.range_days || 14),
        kpis: {
          total_sales: totalSales,
          total_cost: totalCost,
          gross_profit: grossProfit,
          profit_margin_pct: profitMarginPct,
          orders_count: ordersCount,
          revenue_orders_count: toNumber(payload?.kpis?.revenue_orders_count, ordersCount),
          avg_order_value: toNumber(payload?.kpis?.avg_order_value, ordersCount > 0 ? totalSales / ordersCount : 0),
          completed_orders: toNumber(payload?.kpis?.completed_orders, completedOrders),
          pending_orders: toNumber(payload?.kpis?.pending_orders, pendingOrders),
          revenue_growth_pct: toNumber(payload?.kpis?.revenue_growth_pct),
          orders_growth_pct: toNumber(payload?.kpis?.orders_growth_pct)
        },
        revenue_trend: revenueTrend,
        category_distribution: Array.isArray(payload.category_distribution) ? payload.category_distribution : [],
        traffic_vs_sales: trafficVsSales,
        status_distribution: statusDistribution,
        low_stock: lowStock,
        low_stock_summary: payload.low_stock_summary || {
          critical: lowStock.filter((i) => i.severity === 'critical').length,
          warning: lowStock.filter((i) => i.severity !== 'critical').length,
          total: lowStock.length
        }
      });
    } catch (error) {
      console.error('Admin analytics fetch failed:', error);
      showToast(t.error, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lang, locale, resolveCurrencySymbol, showToast, siteSettings?.currency, t.error]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const skeleton = (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={`stat-skeleton-${idx}`} className="p-5 space-y-4">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-8 w-36" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Card className="xl:col-span-8 p-5">
          <div className="skeleton h-4 w-36 mb-5" />
          <div className="skeleton h-[280px] w-full rounded-2xl" />
        </Card>
        <Card className="xl:col-span-4 p-5">
          <div className="skeleton h-4 w-36 mb-5" />
          <div className="skeleton h-[280px] w-full rounded-2xl" />
        </Card>
        <Card className="xl:col-span-7 p-5">
          <div className="skeleton h-4 w-44 mb-5" />
          <div className="skeleton h-[260px] w-full rounded-2xl" />
        </Card>
        <Card className="xl:col-span-5 p-5 space-y-4">
          <div className="skeleton h-4 w-44" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={`stock-skeleton-${idx}`} className="space-y-2">
              <div className="skeleton h-3 w-3/4" />
              <div className="skeleton h-2.5 w-full rounded-full" />
            </div>
          ))}
        </Card>
      </div>
    </>
  );

  if (loading || settingsLoading) return skeleton;

  return (
    <section className="space-y-6 pb-20" aria-labelledby="dashboard-title">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 id="dashboard-title" className="text-3xl lg:text-4xl font-black text-primary tracking-tight">{t.commandCenter}</h1>
          <p className="text-muted mt-2">{t.dashboardReady}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-2xl border border-subtle shadow-sm text-sm font-bold text-secondary">
            <Calendar size={16} className="text-primary" />
            {new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <Button variant="secondary" className="px-4 py-2.5" onClick={() => fetchAnalytics({ silent: true })}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{t.refresh}</span>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label={lang === 'ar' ? 'روابط سريعة' : 'Quick actions'}>
        {quickActions.map((action, idx) => (
          <a
            key={`qa-${idx}`}
            href={action.path}
            className="premium-panel p-4 border border-subtle hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 group"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-lg`}>
              {action.icon}
            </div>
            <span className="font-bold text-sm md:text-base text-secondary group-hover:text-primary">{action.label}</span>
          </a>
        ))}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label={lang === 'ar' ? 'الملخصات' : 'Summary cards'}>
        <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-primary to-primary-strong text-white border-none">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mb-5">
              <DollarSign size={20} />
            </div>
            <p className="text-sm text-white/80 mb-1">{t.totalSales}</p>
            <p className="text-3xl font-black">{formatMoney(stats.kpis.total_sales)}</p>
            <p className={`text-xs mt-3 ${Number(stats.kpis.revenue_growth_pct) >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
              {t.revenueGrowth}: {formatPercent(stats.kpis.revenue_growth_pct)}
            </p>
          </div>
          <div className="absolute right-0 top-0 w-40 h-40 bg-black/10 rounded-full blur-3xl -mr-14 -mt-14" />
        </Card>

        <Card className="p-5 border border-subtle">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-5">
            <ShoppingBag size={20} />
          </div>
          <p className="text-sm text-muted mb-1">{t.totalOrders}</p>
          <p className="text-3xl font-black text-primary">{formatNumber(stats.kpis.orders_count)}</p>
          <p className={`text-xs mt-3 ${growthTone(stats.kpis.orders_growth_pct)}`}>
            {t.ordersGrowth}: {formatPercent(stats.kpis.orders_growth_pct)}
          </p>
        </Card>

        <Card className="p-5 border border-subtle">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
            <TrendingUp size={20} />
          </div>
          <p className="text-sm text-muted mb-1">{t.grossProfit}</p>
          <p className="text-3xl font-black text-primary">{formatMoney(stats.kpis.gross_profit)}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted">
            <span>{t.totalCost}: {formatMoney(stats.kpis.total_cost)}</span>
            <span>{t.profitMargin}: {formatPercent(stats.kpis.profit_margin_pct)}</span>
          </div>
          <p className="text-xs text-muted mt-2">{t.avgOrder}: {formatMoney(stats.kpis.avg_order_value)}</p>
        </Card>

        <Card className="p-5 border border-subtle">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm text-muted mb-1">{t.lowStock}</p>
          <p className="text-3xl font-black text-primary">{formatNumber(stats.low_stock_summary.total)}</p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="text-red-600">{t.critical}: {formatNumber(stats.low_stock_summary.critical)}</span>
            <span className="text-amber-600">{t.warning}: {formatNumber(stats.low_stock_summary.warning)}</span>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4" aria-label={lang === 'ar' ? 'المخططات والتحليلات' : 'Charts and analytics'}>
        <Card className="xl:col-span-8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg text-primary">{t.revenueTrend}</h3>
            <span className="text-xs text-muted">{t.lastDays} {stats.range_days} {lang === 'ar' ? 'يوماً' : 'days'}</span>
          </div>
          {stats.revenue_trend.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted">{t.noData}</div>
          ) : (
            <ChartCanvas height={300}>
              {({ width, height }) => (
                <LineChart width={width} height={height} data={stats.revenue_trend} margin={{ top: 10, right: 18, left: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 14px 30px rgba(15,23,42,0.12)' }}
                    formatter={(value, key) => {
                      if (key === 'revenue') return [formatMoney(value), t.totalSales];
                      if (key === 'cost') return [formatMoney(value), t.totalCost];
                      if (key === 'profit') return [formatMoney(value), t.grossProfit];
                      return [formatNumber(value), t.totalOrders];
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="cost" stroke="#f97316" strokeWidth={2.5} dot={false} strokeDasharray="6 4" />
                  <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="orders" stroke="#14b8a6" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              )}
            </ChartCanvas>
          )}
        </Card>

        <Card className="xl:col-span-4 p-5">
          <h3 className="font-black text-lg text-primary mb-4">{t.categoryDistribution}</h3>
          {stats.category_distribution.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted">{t.noData}</div>
          ) : (
            <ChartCanvas height={300}>
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                  <Pie
                    data={stats.category_distribution.slice(0, 6)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {stats.category_distribution.slice(0, 6).map((_, idx) => (
                      <Cell key={`cat-cell-${idx}`} fill={chartPalette[idx % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatMoney(value), t.totalSales]} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              )}
            </ChartCanvas>
          )}
        </Card>

        <Card className="xl:col-span-7 p-5">
          <h3 className="font-black text-lg text-primary mb-4">{t.trafficVsSales}</h3>
          {stats.traffic_vs_sales.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted">{t.noData}</div>
          ) : (
            <ChartCanvas height={260}>
              {({ width, height }) => (
                <BarChart width={width} height={height} data={stats.traffic_vs_sales} margin={{ top: 8, right: 18, left: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 14px 30px rgba(15,23,42,0.12)' }}
                    formatter={(value, key) => [formatNumber(value), key === 'traffic' ? (lang === 'ar' ? 'الزيارات' : 'Traffic') : (lang === 'ar' ? 'المبيعات' : 'Sales')]}
                  />
                  <Legend />
                  <Bar dataKey="traffic" name={lang === 'ar' ? 'الزيارات' : 'Traffic'} fill="#94a3b8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="sales" name={lang === 'ar' ? 'المبيعات' : 'Sales'} fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ChartCanvas>
          )}
        </Card>

        <Card className="xl:col-span-5 p-5">
          <h3 className="font-black text-lg text-primary mb-4">{t.lowStockItems}</h3>
          {stats.low_stock.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted">{lang === 'ar' ? 'المخزون ممتاز 👌' : 'Inventory health is excellent'}</div>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {stats.low_stock.slice(0, 10).map((item, idx) => {
                const quantity = Number(item.stock_quantity || 0);
                const progress = Math.max(8, Math.min(100, (quantity / 10) * 100));
                const isCritical = item.severity === 'critical';
                return (
                  <div key={`low-stock-${idx}`} className={`rounded-2xl border p-3 ${isCritical ? 'border-red-200 bg-red-50/70' : 'border-amber-200 bg-amber-50/70'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-bold text-sm text-primary">{item.name}</p>
                        <p className="text-xs text-muted">{item.category || (lang === 'ar' ? 'غير مصنف' : 'Uncategorized')}</p>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isCritical ? t.critical : t.warning} • {formatNumber(quantity)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-card-soft border border-subtle">
                      <div
                        className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-subtle">
            <h4 className="text-sm font-black text-secondary mb-3">{t.status}</h4>
            <div className="space-y-2">
              {(stats.status_distribution || []).slice(0, 4).map((s, idx) => (
                <div key={`status-${idx}`} className="flex items-center justify-between text-sm">
                  <span className="text-secondary">{s.name}</span>
                  <span className="font-black text-primary">{formatNumber(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => showToast(null)} />}
    </section>
  );
};

export default DashboardPage;
