import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Edit3, Eye, Search, X } from 'lucide-react';
import { API_URL } from '../../../app/config';
import {
  Card,
  Input,
  ModalFrame,
  TableShell,
  Toast,
  TRANSLATIONS,
  useToast
} from '../shared/adminShared';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';

export const AdminCustomers = ({ lang = 'ar' }) => {
  const t = TRANSLATIONS[lang];
  const locale = getLatinDigitsLocale(lang);
  const { showToast, toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', address: '', is_active: 1 });
  const [editSaving, setEditSaving] = useState(false);

  const formatMoney = (value) => `$${Number(value || 0).toLocaleString(locale, { numberingSystem: 'latn', minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const formatDate = (value) => value ? new Date(value).toLocaleDateString(locale) : '-';

  const fetchCustomers = useCallback(() => {
    axios.get(`${API_URL}/customers`, { withCredentials: true })
      .then((r) => setCustomers(Array.isArray(r.data) ? r.data : []))
      .catch(() => showToast(t.error, 'error'));
  }, [showToast, t.error]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    const rows = customers.filter((c) => {
      const matchesSearch = (
        String(c.full_name || '').toLowerCase().includes(needle)
        || String(c.email || '').toLowerCase().includes(needle)
        || String(c.phone || '').toLowerCase().includes(needle)
      );
      const matchesStatus = statusFilter === 'all'
        ? true
        : (statusFilter === 'active' ? Number(c.is_active) === 1 : Number(c.is_active) !== 1);
      return matchesSearch && matchesStatus;
    });
    if (sortBy === 'spent_desc') rows.sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0));
    if (sortBy === 'spent_asc') rows.sort((a, b) => Number(a.total_spent || 0) - Number(b.total_spent || 0));
    if (sortBy === 'orders_desc') rows.sort((a, b) => Number(b.orders_count || 0) - Number(a.orders_count || 0));
    if (sortBy === 'orders_asc') rows.sort((a, b) => Number(a.orders_count || 0) - Number(b.orders_count || 0));
    if (sortBy === 'newest') rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    if (sortBy === 'oldest') rows.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    return rows;
  }, [customers, search, statusFilter, sortBy]);

  const openCustomerOrders = (customer) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    axios.get(`${API_URL}/customers/${customer.id}/orders`, { withCredentials: true })
      .then((res) => setCustomerOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        showToast(t.error, 'error');
        setCustomerOrders([]);
      })
      .finally(() => setOrdersLoading(false));
  };

  const openEditCustomer = (customer) => {
    setEditCustomer(customer);
    setEditForm({
      full_name: customer?.full_name || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      is_active: Number(customer?.is_active) === 1 ? 1 : 0
    });
  };

  const saveCustomer = async () => {
    if (!editCustomer?.id) return;
    setEditSaving(true);
    try {
      await axios.put(`${API_URL}/customers/${editCustomer.id}`, editForm, { withCredentials: true });
      showToast(t.success);
      setEditCustomer(null);
      fetchCustomers();
    } catch {
      showToast(t.error, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const toggleActive = async (customer) => {
    try {
      await axios.put(`${API_URL}/customers/${customer.id}`, {
        is_active: Number(customer?.is_active) === 1 ? 0 : 1
      }, { withCredentials: true });
      showToast(t.success);
      fetchCustomers();
    } catch {
      showToast(t.error, 'error');
    }
  };

  const activeCount = filtered.filter((c) => Number(c.is_active) === 1).length;
  const inactiveCount = filtered.length - activeCount;

  const exportCustomersCsv = () => {
    const rows = [
      ['id', 'full_name', 'email', 'phone', 'is_active', 'orders_count', 'total_spent', 'created_at'],
      ...filtered.map((c) => [
        c.id,
        c.full_name || '',
        c.email || '',
        c.phone || '',
        Number(c.is_active) === 1 ? 'active' : 'inactive',
        Number(c.orders_count || 0),
        Number(c.total_spent || 0),
        c.created_at || ''
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => showToast(null)} />}

      {selectedCustomer && (
        <ModalFrame onClose={() => setSelectedCustomer(null)} className="w-full max-w-3xl">
          <div className="p-6 border-b border-subtle bg-card-soft flex items-center justify-between">
            <h3 className="font-black text-xl text-primary">
              {lang === 'ar' ? `طلبات العميل #${selectedCustomer.id}` : `Customer Orders #${selectedCustomer.id}`}
            </h3>
            <button onClick={() => setSelectedCustomer(null)} className="ui-btn ui-btn-icon ui-btn-secondary"><X size={16} /></button>
          </div>
          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            {ordersLoading ? <div className="text-center text-muted py-8">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div> : null}
            {!ordersLoading && customerOrders.length === 0 ? <div className="text-center text-muted py-8">{lang === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}</div> : null}
            {!ordersLoading && customerOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-subtle bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-primary">#{order.id}</div>
                  <div className="text-xs text-muted">{formatDate(order.created_at)}</div>
                </div>
                <div className="mt-2 text-sm text-secondary">
                  <span>{lang === 'ar' ? 'الحالة' : 'Status'}: <b>{order.status || 'pending'}</b></span>
                  <span className="mx-2">•</span>
                  <span>{lang === 'ar' ? 'الإجمالي' : 'Total'}: <b>{formatMoney(order.total_amount)}</b></span>
                </div>
              </div>
            ))}
          </div>
        </ModalFrame>
      )}

      {editCustomer && (
        <ModalFrame onClose={() => setEditCustomer(null)} className="w-full max-w-xl">
          <div className="p-6 border-b border-subtle bg-card-soft flex items-center justify-between">
            <h3 className="font-black text-xl text-primary">{lang === 'ar' ? 'تعديل بيانات العميل' : 'Edit Customer'}</h3>
            <button onClick={() => setEditCustomer(null)} className="ui-btn ui-btn-icon ui-btn-secondary"><X size={16} /></button>
          </div>
          <div className="p-6 space-y-4">
            <Input label={t.customerName} value={editForm.full_name} onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))} />
            <Input label={t.customerPhone} value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <div>
              <label className="block text-xs font-bold text-muted mb-2 uppercase">{t.customerAddress}</label>
              <textarea className="ui-textarea h-24" value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="ui-check" checked={Number(editForm.is_active) === 1} onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))} />
              <span className="text-sm font-semibold text-primary">{lang === 'ar' ? 'الحساب نشط' : 'Account active'}</span>
            </label>
            <div className="flex gap-2">
              <button className="ui-btn ui-btn-secondary flex-1" onClick={() => setEditCustomer(null)}>{t.cancel}</button>
              <button className="ui-btn ui-btn-primary flex-1" onClick={saveCustomer} disabled={editSaving}>{editSaving ? t.saving : t.save}</button>
            </div>
          </div>
        </ModalFrame>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-black text-primary">{t.customers}</h2>
        <div className="rounded-xl border border-subtle bg-card-soft px-4 py-2 text-sm text-secondary">
          {lang === 'ar' ? 'نشط' : 'Active'}: <span className="font-black text-primary">{activeCount}</span>
          <span className="mx-2">|</span>
          {lang === 'ar' ? 'غير نشط' : 'Inactive'}: <span className="font-black text-primary">{inactiveCount}</span>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_160px] gap-3">
          <div className="relative">
            <Search className={`absolute top-3.5 text-muted ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={20} />
            <input
              className={`ui-input ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="ui-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{lang === 'ar' ? 'كل الحسابات' : 'All accounts'}</option>
            <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="inactive">{lang === 'ar' ? 'غير نشط' : 'Inactive'}</option>
          </select>
          <select className="ui-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">{lang === 'ar' ? 'الأحدث' : 'Newest'}</option>
            <option value="oldest">{lang === 'ar' ? 'الأقدم' : 'Oldest'}</option>
            <option value="spent_desc">{lang === 'ar' ? 'الأعلى إنفاقاً' : 'Highest spend'}</option>
            <option value="spent_asc">{lang === 'ar' ? 'الأقل إنفاقاً' : 'Lowest spend'}</option>
            <option value="orders_desc">{lang === 'ar' ? 'الأكثر طلباً' : 'Most orders'}</option>
            <option value="orders_asc">{lang === 'ar' ? 'الأقل طلباً' : 'Least orders'}</option>
          </select>
          <button className="ui-btn ui-btn-secondary" onClick={exportCustomersCsv}>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</button>
        </div>
      </Card>

      <TableShell>
        <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <thead className="table-head text-xs font-bold text-muted uppercase">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">{t.customerName}</th>
              <th className="p-4">{t.customerEmail}</th>
              <th className="p-4">{t.customerPhone}</th>
              <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="p-4">{lang === 'ar' ? 'الطلبات' : 'Orders'}</th>
              <th className="p-4">{lang === 'ar' ? 'إجمالي الإنفاق' : 'Total spent'}</th>
              <th className="p-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id} className="table-row">
                <td className="p-4 font-mono">#{c.id}</td>
                <td className="p-4">
                  <div className="font-semibold text-primary">{c.full_name || '-'}</div>
                  <div className="text-xs text-muted">{formatDate(c.created_at)}</div>
                </td>
                <td className="p-4 text-secondary">{c.email || '-'}</td>
                <td className="p-4 text-secondary">{c.phone || '-'}</td>
                <td className="p-4">
                  <button
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${Number(c.is_active) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                    onClick={() => toggleActive(c)}
                  >
                    {Number(c.is_active) === 1 ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'موقوف' : 'Inactive')}
                  </button>
                </td>
                <td className="p-4 font-bold text-primary">{Number(c.orders_count || 0)}</td>
                <td className="p-4 font-bold text-primary">{formatMoney(c.total_spent || 0)}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openCustomerOrders(c)} className="ui-btn ui-btn-icon ui-btn-secondary" title={lang === 'ar' ? 'عرض الطلبات' : 'View orders'}>
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEditCustomer(c)} className="ui-btn ui-btn-icon ui-btn-icon-primary" title={t.edit}>
                      <Edit3 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-muted">{lang === 'ar' ? 'لا توجد نتائج' : 'No results'}</div>}
      </TableShell>
    </div>
  );
};

