import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { DollarSign, Percent, Plus, Search, Tag, TicketPercent, Trash2 } from 'lucide-react';
import { API_URL } from '../../../app/config';
import { Button, Card, Input, Toast, useToast } from '../shared/adminShared';

export const AdminCoupons = ({ lang = 'ar' }) => {
  const { showToast, toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', type: 'fixed', value: '' });

  const L = useCallback((ar, en) => (lang === 'ar' ? ar : en), [lang]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/coupons`, { withCredentials: true });
      setCoupons(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setCoupons([]);
      showToast(error?.response?.data?.error || L('تعذر تحميل الكوبونات', 'Failed to load coupons'), 'error');
    } finally {
      setLoading(false);
    }
  }, [L, showToast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const filteredCoupons = useMemo(() => {
    const needle = String(search || '').trim().toLowerCase();
    if (!needle) return coupons;
    return coupons.filter((coupon) => {
      const code = String(coupon?.code || '').toLowerCase();
      const type = String(coupon?.type || '').toLowerCase();
      const value = String(coupon?.value ?? '').toLowerCase();
      return code.includes(needle) || type.includes(needle) || value.includes(needle);
    });
  }, [search, coupons]);

  const couponStats = useMemo(() => {
    return filteredCoupons.reduce((acc, coupon) => {
      acc.total += 1;
      if (String(coupon?.type || '').toLowerCase() === 'percent') acc.percent += 1;
      if (String(coupon?.type || '').toLowerCase() === 'fixed') acc.fixed += 1;
      return acc;
    }, { total: 0, percent: 0, fixed: 0 });
  }, [filteredCoupons]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const payload = {
      code: String(form.code || '').trim().toUpperCase(),
      type: String(form.type || 'fixed').trim().toLowerCase(),
      value: Number(form.value)
    };

    if (!payload.code) {
      showToast(L('كود الكوبون مطلوب', 'Coupon code is required'), 'error');
      return;
    }
    if (!Number.isFinite(payload.value) || payload.value <= 0) {
      showToast(L('قيمة الكوبون غير صحيحة', 'Coupon value is invalid'), 'error');
      return;
    }

    try {
      await axios.post(`${API_URL}/coupons`, payload, { withCredentials: true });
      showToast(L('تم إنشاء الكوبون بنجاح', 'Coupon created successfully'));
      setForm({ code: '', type: 'fixed', value: '' });
      fetchCoupons();
    } catch (error) {
      showToast(error?.response?.data?.error || L('فشل إنشاء الكوبون', 'Failed to create coupon'), 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    const confirmDelete = window.confirm(L('هل تريد حذف هذا الكوبون؟', 'Delete this coupon?'));
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/coupons/${id}`, { withCredentials: true });
      showToast(L('تم حذف الكوبون', 'Coupon deleted'));
      fetchCoupons();
    } catch (error) {
      showToast(error?.response?.data?.error || L('فشل حذف الكوبون', 'Failed to delete coupon'), 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => showToast(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">{L('إدارة الكوبونات', 'Coupons')}</h1>
          <p className="text-muted mt-1">{L('إنشاء وإدارة خصومات السلة', 'Create and manage checkout discounts')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card p-4 rounded-2xl border shadow-sm">
          <span className="text-xs text-muted font-bold uppercase">{L('إجمالي الكوبونات', 'Total Coupons')}</span>
          <div className="text-2xl font-black text-primary">{couponStats.total}</div>
        </div>
        <div className="bg-card p-4 rounded-2xl border shadow-sm">
          <span className="text-xs text-green-600 font-bold uppercase">{L('خصم نسبي %', 'Percent Coupons')}</span>
          <div className="text-2xl font-black text-green-600">{couponStats.percent}</div>
        </div>
        <div className="bg-card p-4 rounded-2xl border shadow-sm">
          <span className="text-xs text-blue-600 font-bold uppercase">{L('خصم ثابت', 'Fixed Coupons')}</span>
          <div className="text-2xl font-black text-blue-600">{couponStats.fixed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <TicketPercent size={20} className="text-primary" />
            <h2 className="font-bold text-primary">{L('إضافة كوبون جديد', 'Add Coupon')}</h2>
          </div>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <Input
              label={L('كود الكوبون', 'Coupon Code')}
              placeholder={L('مثال: SAVE20', 'Example: SAVE20')}
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            />
            <div>
              <label className="block text-xs font-bold text-muted mb-2 uppercase">{L('نوع الكوبون', 'Coupon Type')}</label>
              <select
                className="ui-select"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="fixed">{L('خصم ثابت', 'Fixed')}</option>
                <option value="percent">{L('خصم نسبي %', 'Percent')}</option>
              </select>
            </div>
            <Input
              label={L('القيمة', 'Value')}
              type="number"
              min="0"
              step="0.01"
              placeholder={form.type === 'percent' ? L('من 1 إلى 100', '1 to 100') : L('مبلغ الخصم', 'Discount amount')}
              value={form.value}
              onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
            />
            <Button className="w-full" icon={Plus}>
              {L('إضافة الكوبون', 'Create Coupon')}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-4 relative">
            <Search className={`absolute top-3.5 text-muted ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={20} />
            <input
              className={`w-full bg-card border-none rounded-xl py-3 shadow-sm outline-none focus:ring-2 ring-focus transition ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
              placeholder={L('ابحث بالكود أو النوع أو القيمة', 'Search by code, type, or value')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted">{L('جاري تحميل الكوبونات...', 'Loading coupons...')}</div>
            ) : filteredCoupons.length === 0 ? (
              <div className="p-10 text-center text-muted">
                <Tag size={34} className="mx-auto mb-3 opacity-30" />
                {L('لا توجد كوبونات حالياً', 'No coupons found')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  <thead className="bg-card-soft text-xs font-bold text-muted uppercase">
                    <tr>
                      <th className="p-4">{L('الكود', 'Code')}</th>
                      <th className="p-4">{L('النوع', 'Type')}</th>
                      <th className="p-4">{L('القيمة', 'Value')}</th>
                      <th className="p-4 text-center">{L('إجراء', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {filteredCoupons.map((coupon) => {
                      const isPercent = String(coupon?.type || '').toLowerCase() === 'percent';
                      return (
                        <tr key={coupon.id} className="hover:bg-primary/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary">{coupon.code}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${isPercent ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {isPercent ? <Percent size={12} /> : <DollarSign size={12} />}
                              {isPercent ? L('نسبي', 'Percent') : L('ثابت', 'Fixed')}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-primary">
                            {isPercent ? `${Number(coupon.value || 0)}%` : `${Number(coupon.value || 0).toFixed(2)}`}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title={L('حذف', 'Delete')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
