import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Edit3, Eye, Printer, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { API_URL } from '../../../app/config';
import {
  Button,
  Card,
  handlePrintInvoice,
  Input,
  ModalFrame,
  Toast,
  TRANSLATIONS,
  useToast
} from '../shared/adminShared';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
const STATUS_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['pending', 'shipped', 'cancelled'],
  shipped: ['processing', 'completed'],
  completed: ['shipped'],
  cancelled: ['pending', 'processing']
};
const NEXT_WORKFLOW_STATUS = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'completed',
  completed: null,
  cancelled: 'processing'
};
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;
const AUTO_REFRESH_MS = 45000;

const normalizeStatus = (value) => {
  const normalized = String(value || 'pending').toLowerCase().trim();
  return ORDER_STATUSES.includes(normalized) ? normalized : 'pending';
};

const isTransitionAllowed = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;
  return (STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);
};

const getAllowedStatusOptions = (status) => {
  const normalized = normalizeStatus(status);
  const allowed = STATUS_TRANSITIONS[normalized] || [];
  return Array.from(new Set([normalized, ...allowed]));
};

const getNextWorkflowStatus = (status) => NEXT_WORKFLOW_STATUS[normalizeStatus(status)] || null;

const parseErrorMessage = (error, fallback) => (
  error?.response?.data?.error
  || error?.response?.data?.message
  || fallback
);

const parseOrderTimestamp = (value) => {
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
};

const useDebouncedValue = (value, delayMs = 220) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};

export const AdminOrders = ({ lang = 'ar' }) => {
  const t = TRANSLATIONS[lang];
  const locale = getLatinDigitsLocale(lang);
  const { showToast, toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [settings, setSettings] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [orderBusyById, setOrderBusyById] = useState({});
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isBulkBusy, setBulkBusy] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('processing');

  // حالة التعديل
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [detailsOrder, setDetailsOrder] = useState(null);

  const ui = useMemo(() => (
    lang === 'ar'
      ? {
          title: 'إدارة الطلبات',
          loadFailed: 'تعذر تحميل الطلبات',
          updateFailed: 'فشل تحديث الطلب',
          updated: 'تم تحديث الطلب',
          statusUpdated: 'تم تغيير الحالة',
          cancelled: 'تم إلغاء الطلب',
          cannotCancel: 'لا يمكن إلغاء الطلب في حالته الحالية',
          noNextStep: 'الطلب في آخر مرحلة',
          invalidTransition: (from, to) => `لا يمكن نقل الطلب من ${from} إلى ${to}`,
          confirmCancel: 'هل أنت متأكد من إلغاء هذا الطلب؟ سيتم نقله إلى قائمة (ملغي).',
          customerNameRequired: 'اسم العميل مطلوب',
          customerPhoneRequired: 'رقم الهاتف مطلوب',
          invalidTotal: 'قيمة الإجمالي غير صحيحة',
          noData: 'لا توجد طلبات',
          noDataExport: 'لا توجد بيانات لتصديرها',
          refresh: 'تحديث',
          refreshing: 'جاري التحديث...',
          lastSync: 'آخر مزامنة',
          count: 'العدد',
          orderValue: 'الإيراد (بدون الملغي)',
          cancelledCount: 'ملغي',
          allTime: 'كل الفترات',
          last7Days: 'آخر 7 أيام',
          last30Days: 'آخر 30 يوم',
          last90Days: 'آخر 90 يوم',
          sortNewest: 'الأحدث',
          sortOldest: 'الأقدم',
          sortHighAmount: 'الأعلى قيمة',
          sortLowAmount: 'الأقل قيمة',
          rowsPerPage: 'عدد السجلات',
          showing: 'عرض',
          from: 'من',
          nextStep: 'الخطوة التالية',
          done: 'مكتمل سير العمل',
          advance: 'التالي',
          save: 'حفظ التغييرات',
          editOrder: 'تعديل الطلب',
          selectedLabel: 'المحدد',
          noSelection: 'اختر طلباً واحداً على الأقل',
          applyBulk: 'تطبيق جماعي',
          cancelSelected: 'إلغاء المحدد',
          clearSelection: 'إلغاء التحديد',
          selectAllFiltered: 'تحديد كل النتائج',
          clearAllFiltered: 'مسح كل النتائج',
          bulkFailed: 'فشل التحديث الجماعي',
          bulkResult: (ok, failed) => `تم تحديث ${ok} وفشل ${failed}`
        }
      : {
          title: 'Orders Management',
          loadFailed: 'Unable to load orders',
          updateFailed: 'Unable to update order',
          updated: 'Order updated',
          statusUpdated: 'Order status updated',
          cancelled: 'Order cancelled',
          cannotCancel: 'This order cannot be cancelled from its current status',
          noNextStep: 'Order is already in final stage',
          invalidTransition: (from, to) => `Cannot move order from ${from} to ${to}`,
          confirmCancel: 'Are you sure you want to cancel this order? It will move to (Cancelled).',
          customerNameRequired: 'Customer name is required',
          customerPhoneRequired: 'Customer phone is required',
          invalidTotal: 'Total amount is invalid',
          noData: 'No orders found',
          noDataExport: 'No rows to export',
          refresh: 'Refresh',
          refreshing: 'Refreshing...',
          lastSync: 'Last sync',
          count: 'Count',
          orderValue: 'Revenue (excl. cancelled)',
          cancelledCount: 'Cancelled',
          allTime: 'All time',
          last7Days: 'Last 7 days',
          last30Days: 'Last 30 days',
          last90Days: 'Last 90 days',
          sortNewest: 'Newest',
          sortOldest: 'Oldest',
          sortHighAmount: 'Highest amount',
          sortLowAmount: 'Lowest amount',
          rowsPerPage: 'Rows per page',
          showing: 'Showing',
          from: 'of',
          nextStep: 'Next step',
          done: 'Workflow complete',
          advance: 'Advance',
          save: 'Save Changes',
          editOrder: 'Edit Order',
          selectedLabel: 'Selected',
          noSelection: 'Select at least one order',
          applyBulk: 'Apply Bulk',
          cancelSelected: 'Cancel Selected',
          clearSelection: 'Clear Selection',
          selectAllFiltered: 'Select all results',
          clearAllFiltered: 'Clear all results',
          bulkFailed: 'Bulk update failed',
          bulkResult: (ok, failed) => `Updated ${ok}, failed ${failed}`
        }
  ), [lang]);

  const getStatusLabel = useCallback((status) => ({
    completed: lang === 'ar' ? 'مكتمل' : 'Completed',
    pending: lang === 'ar' ? 'انتظار' : 'Pending',
    processing: lang === 'ar' ? 'قيد التجهيز' : 'Processing',
    shipped: lang === 'ar' ? 'تم الشحن' : 'Shipped',
    cancelled: lang === 'ar' ? 'ملغي' : 'Cancelled'
  }[normalizeStatus(status)] || status), [lang]);

  const parseItems = useCallback((value) => {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [ordRes, setRes] = await Promise.all([
        axios.get(`${API_URL}/orders`, { withCredentials: true }),
        axios.get(`${API_URL}/settings`)
      ]);
      setOrders(Array.isArray(ordRes?.data) ? ordRes.data : []);
      setSettings(setRes?.data || {});
      setLastSyncAt(new Date());
    } catch (error) {
      if (!silent) showToast(parseErrorMessage(error, ui.loadFailed), 'error');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [showToast, ui.loadFailed]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchOrders({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  const debouncedSearch = useDebouncedValue(search);

  const scopedOrders = useMemo(() => {
    const needle = String(debouncedSearch || '').trim().toLowerCase();
    const rawNeedle = String(debouncedSearch || '').trim();
    const days = Number(dateRangeFilter);
    const minTs = dateRangeFilter !== 'all' && Number.isFinite(days) && days > 0
      ? Date.now() - (days * 24 * 60 * 60 * 1000)
      : null;

    return orders.filter((order) => {
      if (needle) {
        const matches = (
          String(order.customer_name || '').toLowerCase().includes(needle)
          || String(order.customer_phone || '').toLowerCase().includes(needle)
          || String(order.customer_address || '').toLowerCase().includes(needle)
          || String(order.id || '').includes(rawNeedle)
        );
        if (!matches) return false;
      }

      if (minTs !== null) {
        const ts = parseOrderTimestamp(order.created_at);
        if (!Number.isFinite(ts) || ts < minTs) return false;
      }

      return true;
    });
  }, [orders, debouncedSearch, dateRangeFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: scopedOrders.length, pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 };
    scopedOrders.forEach((order) => {
      const key = normalizeStatus(order.status);
      if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
    });
    return counts;
  }, [scopedOrders]);

  const statusScopedOrders = useMemo(() => {
    if (statusFilter === 'all') return scopedOrders;
    return scopedOrders.filter((order) => normalizeStatus(order.status) === statusFilter);
  }, [scopedOrders, statusFilter]);

  const sortedOrders = useMemo(() => {
    const rows = [...statusScopedOrders];
    rows.sort((a, b) => {
      const timeA = parseOrderTimestamp(a.created_at);
      const timeB = parseOrderTimestamp(b.created_at);
      const amountA = Number(a.total_amount || 0);
      const amountB = Number(b.total_amount || 0);

      switch (sortBy) {
        case 'oldest':
          return timeA - timeB;
        case 'amount_desc':
          return amountB - amountA || timeB - timeA;
        case 'amount_asc':
          return amountA - amountB || timeB - timeA;
        case 'newest':
        default:
          return timeB - timeA;
      }
    });
    return rows;
  }, [statusScopedOrders, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateRangeFilter, statusFilter, sortBy, pageSize]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, page, pageSize]);

  const pageStart = sortedOrders.length === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const pageEnd = Math.min(page * pageSize, sortedOrders.length);
  const selectedIdSet = useMemo(() => new Set(selectedOrderIds.map((id) => Number(id))), [selectedOrderIds]);
  const currentPageIds = useMemo(() => pagedOrders.map((order) => Number(order.id)), [pagedOrders]);
  const isAllCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIdSet.has(id));
  const isAnyCurrentPageSelected = currentPageIds.some((id) => selectedIdSet.has(id));

  useEffect(() => {
    setSelectedOrderIds((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return [];
      const existingIds = new Set(orders.map((order) => Number(order.id)));
      const next = prev.filter((id) => existingIds.has(Number(id)));
      if (next.length === prev.length && next.every((id, idx) => Number(id) === Number(prev[idx]))) return prev;
      return next;
    });
  }, [orders]);

  const nonCancelledRevenue = scopedOrders
    .filter((order) => normalizeStatus(order.status) !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  const currencySymbol = String(settings?.currency_symbol || '$').trim() || '$';
  const formatMoney = (value) => `${currencySymbol}${Number(value || 0).toLocaleString(locale, { numberingSystem: 'latn', minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const setOrderBusy = useCallback((orderId, busy) => {
    setOrderBusyById((prev) => {
      const next = { ...prev };
      if (busy) next[orderId] = true;
      else delete next[orderId];
      return next;
    });
  }, []);

  const patchOrderInState = useCallback((orderId, patch) => {
    setOrders((prev) => prev.map((order) => (
      Number(order.id) === Number(orderId) ? { ...order, ...patch } : order
    )));
    setDetailsOrder((prev) => (
      prev && Number(prev.id) === Number(orderId) ? { ...prev, ...patch } : prev
    ));
    setEditForm((prev) => (
      prev && Number(prev.id) === Number(orderId) ? { ...prev, ...patch } : prev
    ));
  }, []);

  const runOrderUpdate = useCallback(async ({ orderId, payload, successMessage }) => {
    const numericId = Number(orderId);
    if (!Number.isFinite(numericId) || numericId <= 0) return false;

    setOrderBusy(numericId, true);
    try {
      const res = await axios.put(`${API_URL}/orders/${numericId}`, payload, { withCredentials: true });
      const updatedOrder = res?.data?.order;
      if (updatedOrder && typeof updatedOrder === 'object') patchOrderInState(numericId, updatedOrder);
      else patchOrderInState(numericId, payload);

      const warning = String(res?.data?.warning || '').trim();
      const baseMessage = successMessage || res?.data?.message || ui.updated;
      showToast(warning ? `${baseMessage} - ${warning}` : baseMessage, warning ? 'error' : 'success');
      return true;
    } catch (error) {
      showToast(parseErrorMessage(error, ui.updateFailed), 'error');
      return false;
    } finally {
      setOrderBusy(numericId, false);
    }
  }, [patchOrderInState, setOrderBusy, showToast, ui.updated, ui.updateFailed]);

  const patchOrdersInState = useCallback((updatedOrders) => {
    if (!Array.isArray(updatedOrders) || updatedOrders.length === 0) return;
    updatedOrders.forEach((order) => {
      if (!order || typeof order !== 'object') return;
      patchOrderInState(order.id, order);
    });
  }, [patchOrderInState]);

  const toggleOrderSelection = useCallback((orderId) => {
    const numericId = Number(orderId);
    if (!Number.isFinite(numericId) || numericId <= 0) return;
    setSelectedOrderIds((prev) => (
      prev.some((id) => Number(id) === numericId)
        ? prev.filter((id) => Number(id) !== numericId)
        : [...prev, numericId]
    ));
  }, []);

  const toggleCurrentPageSelection = useCallback(() => {
    if (currentPageIds.length === 0) return;
    setSelectedOrderIds((prev) => {
      const prevSet = new Set(prev.map((id) => Number(id)));
      const allSelected = currentPageIds.every((id) => prevSet.has(id));
      if (allSelected) {
        return prev.filter((id) => !currentPageIds.includes(Number(id)));
      }
      const nextSet = new Set(prevSet);
      currentPageIds.forEach((id) => nextSet.add(id));
      return Array.from(nextSet);
    });
  }, [currentPageIds]);

  const selectAllFiltered = useCallback(() => {
    setSelectedOrderIds(sortedOrders.map((order) => Number(order.id)));
  }, [sortedOrders]);

  const clearSelection = useCallback(() => {
    setSelectedOrderIds([]);
  }, []);

  const runBulkStatusUpdate = useCallback(async (nextStatusInput) => {
    const targetStatus = normalizeStatus(nextStatusInput);
    const ids = Array.from(new Set(selectedOrderIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)));
    if (ids.length === 0) {
      showToast(ui.noSelection, 'error');
      return;
    }

    setBulkBusy(true);
    try {
      const res = await axios.put(`${API_URL}/orders/bulk`, {
        ids,
        status: targetStatus
      }, { withCredentials: true });

      const updatedOrders = Array.isArray(res?.data?.updated_orders) ? res.data.updated_orders : [];
      patchOrdersInState(updatedOrders);

      const failures = Array.isArray(res?.data?.failures) ? res.data.failures : [];
      const failedIds = failures
        .map((entry) => Number(entry?.id))
        .filter((id) => Number.isFinite(id) && id > 0);
      const successfulCount = Number(res?.data?.processed || updatedOrders.length || 0);
      const failedCount = Number(res?.data?.failed || failedIds.length || 0);

      showToast(ui.bulkResult(successfulCount, failedCount), failedCount > 0 ? 'error' : 'success');

      if (failedIds.length > 0) setSelectedOrderIds(failedIds);
      else setSelectedOrderIds([]);

      if (!updatedOrders.length && !failedCount) {
        fetchOrders({ silent: true });
      }
    } catch (error) {
      showToast(parseErrorMessage(error, ui.bulkFailed), 'error');
    } finally {
      setBulkBusy(false);
    }
  }, [fetchOrders, patchOrdersInState, selectedOrderIds, showToast, ui]);

  const updateStatus = useCallback(async (order, nextStatusInput) => {
    const currentStatus = normalizeStatus(order?.status);
    const nextStatus = normalizeStatus(nextStatusInput);
    if (currentStatus === nextStatus) return;

    if (!isTransitionAllowed(currentStatus, nextStatus)) {
      showToast(ui.invalidTransition(getStatusLabel(currentStatus), getStatusLabel(nextStatus)), 'error');
      return;
    }

    await runOrderUpdate({
      orderId: order.id,
      payload: { status: nextStatus },
      successMessage: ui.statusUpdated
    });
  }, [getStatusLabel, runOrderUpdate, showToast, ui]);

  const cancelOrder = useCallback(async (order) => {
    const currentStatus = normalizeStatus(order?.status);
    if (!isTransitionAllowed(currentStatus, 'cancelled')) {
      showToast(ui.cannotCancel, 'error');
      return;
    }
    if (!window.confirm(ui.confirmCancel)) return;
    await runOrderUpdate({
      orderId: order.id,
      payload: { status: 'cancelled' },
      successMessage: ui.cancelled
    });
  }, [runOrderUpdate, showToast, ui]);

  const advanceOrder = useCallback(async (order) => {
    const nextStatus = getNextWorkflowStatus(order?.status);
    if (!nextStatus) {
      showToast(ui.noNextStep, 'error');
      return;
    }
    await updateStatus(order, nextStatus);
  }, [showToast, ui.noNextStep, updateStatus]);

  // فتح نافذة التعديل
  const openEditModal = (order) => {
    setEditForm({
      id: order.id,
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      customer_address: order.customer_address || '',
      order_notes: order.order_notes || '',
      total_amount: Number(order.total_amount || 0),
      status: normalizeStatus(order.status)
    });
    setIsEditOpen(true);
  };

  const editStatusOptions = useMemo(() => {
    const sourceOrder = orders.find((order) => Number(order.id) === Number(editForm.id));
    return getAllowedStatusOptions(sourceOrder?.status || editForm?.status);
  }, [orders, editForm.id, editForm.status]);

  // حفظ التعديلات
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    const customerName = String(editForm.customer_name || '').trim();
    const customerPhone = String(editForm.customer_phone || '').trim();
    const customerAddress = String(editForm.customer_address || '').trim();
    const orderNotes = String(editForm.order_notes || '').trim();
    const safeStatus = normalizeStatus(editForm.status);
    const totalAmount = Number(editForm.total_amount);

    if (!customerName) {
      showToast(ui.customerNameRequired, 'error');
      return;
    }
    if (!customerPhone) {
      showToast(ui.customerPhoneRequired, 'error');
      return;
    }
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      showToast(ui.invalidTotal, 'error');
      return;
    }

    const sourceOrder = orders.find((order) => Number(order.id) === Number(editForm.id));
    if (sourceOrder && !isTransitionAllowed(normalizeStatus(sourceOrder.status), safeStatus)) {
      showToast(ui.invalidTransition(getStatusLabel(sourceOrder.status), getStatusLabel(safeStatus)), 'error');
      return;
    }

    const saved = await runOrderUpdate({
      orderId: editForm.id,
      payload: {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        order_notes: orderNotes,
        total_amount: totalAmount,
        status: safeStatus
      },
      successMessage: ui.updated
    });

    if (saved) setIsEditOpen(false);
  };

  const exportFilteredCsv = () => {
    if (sortedOrders.length === 0) {
      showToast(ui.noDataExport, 'error');
      return;
    }
    const rows = [
      ['id', 'customer_name', 'customer_phone', 'status', 'total_amount', 'created_at'],
      ...sortedOrders.map((order) => [
        order.id,
        order.customer_name,
        order.customer_phone,
        normalizeStatus(order.status),
        order.total_amount,
        order.created_at
      ])
    ];
    const csvBody = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = `\uFEFF${csvBody}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20 relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => showToast(null)} />}

      {/* Edit Modal Overlay */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b flex justify-between items-center bg-card-soft">
              <h3 className="font-bold text-xl text-primary">
                {lang === 'ar' ? `${ui.editOrder} #${editForm.id}` : `${ui.editOrder} #${editForm.id}`}
              </h3>
              <button onClick={() => setIsEditOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
              <Input
                label={lang === 'ar' ? 'اسم العميل' : 'Customer name'}
                value={editForm.customer_name || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, customer_name: e.target.value }))}
              />
              <Input
                label={lang === 'ar' ? 'رقم الهاتف' : 'Phone number'}
                value={editForm.customer_phone || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
              />
              <div>
                <label className="block text-xs font-bold text-muted mb-1">{lang === 'ar' ? 'العنوان' : 'Address'}</label>
                <textarea
                  className="w-full border p-3 rounded-xl resize-none h-24"
                  value={editForm.customer_address || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, customer_address: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">{lang === 'ar' ? 'ملاحظات الطلب' : 'Order notes'}</label>
                <textarea
                  className="w-full border p-3 rounded-xl resize-none h-20"
                  value={editForm.order_notes || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, order_notes: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`${lang === 'ar' ? 'الإجمالي' : 'Total'} (${currencySymbol})`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.total_amount ?? 0}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, total_amount: e.target.value }))}
                />
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">{lang === 'ar' ? 'الحالة' : 'Status'}</label>
                  <select
                    className="w-full border p-3 rounded-xl bg-card"
                    value={normalizeStatus(editForm.status)}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {editStatusOptions.map((statusKey) => (
                      <option key={`edit-status-${statusKey}`} value={statusKey}>
                        {getStatusLabel(statusKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button className="w-full mt-4">{ui.save}</Button>
            </form>
          </div>
        </div>
      )}

      {detailsOrder && (
        <ModalFrame onClose={() => setDetailsOrder(null)} className="w-full max-w-2xl">
          <div className="p-6 border-b border-subtle bg-card-soft flex items-center justify-between">
            <h3 className="font-black text-xl text-primary">
              {lang === 'ar' ? `تفاصيل الطلب #${detailsOrder.id}` : `Order #${detailsOrder.id} Details`}
            </h3>
            <button onClick={() => setDetailsOrder(null)} className="ui-btn ui-btn-icon ui-btn-secondary"><X size={16} /></button>
          </div>
          <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-subtle bg-card-soft px-3 py-2">
                <div className="text-muted">{lang === 'ar' ? 'العميل' : 'Customer'}</div>
                <div className="font-bold text-primary">{detailsOrder.customer_name || '-'}</div>
              </div>
              <div className="rounded-xl border border-subtle bg-card-soft px-3 py-2">
                <div className="text-muted">{lang === 'ar' ? 'الهاتف' : 'Phone'}</div>
                <div className="font-bold text-primary">{detailsOrder.customer_phone || '-'}</div>
              </div>
              <div className="rounded-xl border border-subtle bg-card-soft px-3 py-2 md:col-span-2">
                <div className="text-muted">{lang === 'ar' ? 'العنوان' : 'Address'}</div>
                <div className="font-bold text-primary">{detailsOrder.customer_address || '-'}</div>
              </div>
              {detailsOrder.order_notes ? (
                <div className="rounded-xl border border-subtle bg-card-soft px-3 py-2 md:col-span-2">
                  <div className="text-muted">{lang === 'ar' ? 'ملاحظات الطلب' : 'Order notes'}</div>
                  <div className="font-semibold text-primary">{detailsOrder.order_notes}</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-subtle bg-card p-4">
              <div className="font-black text-primary mb-3">{lang === 'ar' ? 'عناصر الطلب' : 'Order Items'}</div>
              <div className="space-y-2">
                {parseItems(detailsOrder.items_json).map((item, idx) => (
                  <div key={`${idx}-${item?.id || item?.name || 'item'}`} className="flex items-center justify-between gap-3 text-sm border-b border-subtle pb-2 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-semibold text-primary truncate">{item?.name || '-'}</div>
                      <div className="text-xs text-muted">x{Number(item?.quantity || 0)}</div>
                    </div>
                    <div className="font-black text-primary">{formatMoney(item?.price || 0)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-subtle bg-card-soft p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted">{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="font-bold text-primary text-end">{formatMoney(detailsOrder.subtotal || detailsOrder.total_amount || 0)}</span>
                <span className="text-muted">{lang === 'ar' ? 'الخصم' : 'Discount'}</span>
                <span className="font-bold text-primary text-end">{formatMoney(detailsOrder.discount || 0)}</span>
                <span className="text-muted">{lang === 'ar' ? 'الضريبة' : 'Tax'}</span>
                <span className="font-bold text-primary text-end">{formatMoney(detailsOrder.tax_amount || 0)}</span>
                <span className="text-muted">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="font-black text-primary text-end">{formatMoney(detailsOrder.total_amount || 0)}</span>
              </div>
            </div>
            <button onClick={() => handlePrintInvoice(detailsOrder, settings, lang)} className="ui-btn ui-btn-secondary w-full">
              <Printer size={15} />
              {lang === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
            </button>
          </div>
        </ModalFrame>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary">{t.orders}</h1>
          <p className="text-muted mt-1">{ui.title}</p>
        </div>
        <div className="flex items-stretch gap-3 w-full md:w-auto">
          <div className="bg-card px-6 py-3 rounded-2xl border shadow-sm flex items-center gap-4 flex-1 md:flex-none">
            <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
              <span className="text-xs font-bold text-muted block">{ui.orderValue}</span>
              <span className="text-xl font-black text-primary">{formatMoney(nonCancelledRevenue)}</span>
            </div>
            <div className="h-8 w-px bg-border-subtle"></div>
            <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
              <span className="text-xs font-bold text-muted block">{ui.count}</span>
              <span className="text-xl font-black text-primary">{statusCounts.all}</span>
            </div>
            <div className="h-8 w-px bg-border-subtle"></div>
            <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
              <span className="text-xs font-bold text-muted block">{ui.cancelledCount}</span>
              <span className="text-xl font-black text-primary">{statusCounts.cancelled}</span>
            </div>
            <button onClick={exportFilteredCsv} className="ui-btn ui-btn-secondary ui-btn-sm">{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</button>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={isLoading || isRefreshing || isBulkBusy}
            className={`bg-card px-4 py-3 rounded-2xl border shadow-sm flex flex-col items-center justify-center min-w-[110px] ${isLoading || isRefreshing || isBulkBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={ui.refresh}
            aria-label={ui.refresh}
          >
            <RefreshCw size={16} className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold text-muted mt-1">{ui.refresh}</span>
            <span className="text-[11px] text-muted mt-0.5">
              {lastSyncAt ? lastSyncAt.toLocaleTimeString(locale) : '-'}
            </span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 mb-6 flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className={`absolute top-3.5 text-muted ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={20} />
          <input
            className={`w-full py-3 bg-card-soft rounded-xl outline-none focus:ring-2 ring-focus ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="ui-select min-w-[160px]" value={dateRangeFilter} onChange={(e) => setDateRangeFilter(e.target.value)}>
          <option value="all">{ui.allTime}</option>
          <option value="7">{ui.last7Days}</option>
          <option value="30">{ui.last30Days}</option>
          <option value="90">{ui.last90Days}</option>
        </select>
        <select className="ui-select min-w-[160px]" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">{ui.sortNewest}</option>
          <option value="oldest">{ui.sortOldest}</option>
          <option value="amount_desc">{ui.sortHighAmount}</option>
          <option value="amount_asc">{ui.sortLowAmount}</option>
        </select>
        <select
          className="ui-select min-w-[130px]"
          value={String(pageSize)}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={`page-size-${size}`} value={size}>{ui.rowsPerPage}: {size}</option>
          ))}
        </select>
        <div className="w-full flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectAllFiltered}
            disabled={isBulkBusy || sortedOrders.length === 0}
            className={`ui-btn ui-btn-secondary ui-btn-sm ${isBulkBusy || sortedOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {ui.selectAllFiltered}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={isBulkBusy || selectedOrderIds.length === 0}
            className={`ui-btn ui-btn-secondary ui-btn-sm ${isBulkBusy || selectedOrderIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {ui.clearAllFiltered}
          </button>
          <span className="text-xs font-bold text-muted">
            {ui.selectedLabel}: {selectedOrderIds.length}
          </span>
        </div>
        {selectedOrderIds.length > 0 && (
          <div className="w-full rounded-xl border border-subtle bg-card-soft px-3 py-3 flex flex-wrap items-center gap-2">
            <div className="text-sm font-bold text-primary">
              {ui.selectedLabel}: {selectedOrderIds.length}
            </div>
            <select
              className="ui-select min-w-[150px]"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              disabled={isBulkBusy}
            >
              {ORDER_STATUSES.map((statusKey) => (
                <option key={`bulk-status-${statusKey}`} value={statusKey}>
                  {getStatusLabel(statusKey)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => runBulkStatusUpdate(bulkStatus)}
              disabled={isBulkBusy}
              className={`ui-btn ui-btn-primary ui-btn-sm ${isBulkBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ui.applyBulk}
            </button>
            <button
              type="button"
              onClick={() => runBulkStatusUpdate('cancelled')}
              disabled={isBulkBusy}
              className={`ui-btn ui-btn-danger ui-btn-sm ${isBulkBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ui.cancelSelected}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={isBulkBusy}
              className={`ui-btn ui-btn-secondary ui-btn-sm ${isBulkBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ui.clearSelection}
            </button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {['all', ...ORDER_STATUSES].map((statusKey) => (
          <button
            key={`summary-${statusKey}`}
            onClick={() => setStatusFilter(statusKey)}
            className={`rounded-xl border px-3 py-3 text-start transition ${statusFilter === statusKey ? 'border-primary/40 bg-primary/10' : 'border-subtle bg-card'}`}
          >
            <div className="text-xs font-bold text-muted uppercase">
              {statusKey === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : getStatusLabel(statusKey)}
            </div>
            <div className="text-2xl font-black text-primary mt-1">
              {statusCounts[statusKey] ?? 0}
            </div>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <thead className="bg-card-soft text-xs font-bold text-muted uppercase">
            <tr>
              <th className="p-5 w-12 text-center">
                <input
                  type="checkbox"
                  className="ui-check"
                  checked={isAllCurrentPageSelected}
                  onChange={toggleCurrentPageSelection}
                  disabled={isBulkBusy || currentPageIds.length === 0}
                  aria-checked={isAllCurrentPageSelected ? 'true' : (isAnyCurrentPageSelected ? 'mixed' : 'false')}
                  aria-label={lang === 'ar' ? 'تحديد الصفحة الحالية' : 'Select current page'}
                />
              </th>
              <th className="p-5">#</th>
              <th className="p-5">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
              <th className="p-5">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
              <th className="p-5">{lang === 'ar' ? 'العناصر' : 'Items'}</th>
              <th className="p-5">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="p-5">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
              <th className="p-5 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-muted">{ui.refreshing}</td>
              </tr>
            ) : pagedOrders.map((order) => {
              const orderStatus = normalizeStatus(order.status);
              const orderStatusOptions = getAllowedStatusOptions(orderStatus);
              const nextStatus = getNextWorkflowStatus(orderStatus);
              const canAdvance = !!nextStatus && isTransitionAllowed(orderStatus, nextStatus);
              const canCancel = isTransitionAllowed(orderStatus, 'cancelled');
              const rowBusy = Boolean(orderBusyById[order.id]) || isBulkBusy;
              const isSelected = selectedIdSet.has(Number(order.id));

              return (
                <tr key={order.id} className="hover:bg-primary/10 transition group">
                  <td className="p-5 text-center">
                    <input
                      type="checkbox"
                      className="ui-check"
                      checked={isSelected}
                      onChange={() => toggleOrderSelection(order.id)}
                      disabled={rowBusy}
                      aria-label={lang === 'ar' ? `تحديد الطلب ${order.id}` : `Select order ${order.id}`}
                    />
                  </td>
                  <td className="p-5 font-mono font-bold text-primary">#{order.id}</td>
                  <td className="p-5">
                    <div>
                      <div className="font-bold">{order.customer_name}</div>
                      <div className="text-xs text-muted">{order.customer_phone}</div>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-secondary">{new Date(order.created_at).toLocaleDateString(locale)}</td>
                  <td className="p-5 text-sm font-bold text-primary">{parseItems(order.items_json).length}</td>
                  <td className="p-5">
                    <select
                      className="ui-select text-xs font-bold min-w-[130px]"
                      value={orderStatus}
                      onChange={(e) => updateStatus(order, e.target.value)}
                      disabled={rowBusy || orderStatusOptions.length <= 1}
                    >
                      {orderStatusOptions.map((statusKey) => (
                        <option key={`status-option-${order.id}-${statusKey}`} value={statusKey}>
                          {getStatusLabel(statusKey)}
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-muted mt-1">
                      {canAdvance
                        ? `${ui.nextStep}: ${getStatusLabel(nextStatus)}`
                        : ui.done}
                    </div>
                  </td>
                  <td className="p-5 font-black text-primary">{formatMoney(order.total_amount)}</td>
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDetailsOrder(order)}
                        className={`p-2 bg-card-soft text-secondary rounded-lg hover:bg-card ${rowBusy ? 'opacity-50 pointer-events-none' : ''}`}
                        title={lang === 'ar' ? 'تفاصيل' : 'Details'}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(order)}
                        className={`p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/10 ${rowBusy ? 'opacity-50 pointer-events-none' : ''}`}
                        title={lang === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handlePrintInvoice(order, settings, lang)}
                        className={`p-2 bg-card-soft text-secondary rounded-lg hover:bg-card ${rowBusy ? 'opacity-50 pointer-events-none' : ''}`}
                        title={lang === 'ar' ? 'طباعة' : 'Print'}
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={() => advanceOrder(order)}
                        disabled={!canAdvance || rowBusy}
                        className={`p-2 rounded-lg ${canAdvance ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-card-soft text-muted'} ${(!canAdvance || rowBusy) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={ui.advance}
                      >
                        {lang === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <button
                        onClick={() => cancelOrder(order)}
                        disabled={!canCancel || rowBusy}
                        className={`p-2 rounded-lg ${canCancel ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-card-soft text-muted'} ${(!canCancel || rowBusy) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={lang === 'ar' ? 'إلغاء الطلب' : 'Cancel order'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isLoading && sortedOrders.length === 0 && (
          <div className="p-10 text-center text-muted">{ui.noData}</div>
        )}

        {sortedOrders.length > 0 && (
          <div className="border-t border-subtle px-4 py-3 bg-card-soft/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted">
              {ui.showing} {pageStart}-{pageEnd} {ui.from} {sortedOrders.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`ui-btn ui-btn-secondary ui-btn-sm ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                {lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <span className="text-sm font-bold text-primary min-w-[70px] text-center">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className={`ui-btn ui-btn-secondary ui-btn-sm ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                {lang === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
