import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../app/config';
import { TRANSLATIONS, TableShell, Toast, useToast } from '../shared/adminShared';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';

export const AdminActivity = ({ lang = 'ar' }) => {
  const t = TRANSLATIONS[lang];
  const locale = getLatinDigitsLocale(lang);
  const { toast, showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API_URL}/activity`, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        setRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => showToast(t.error, 'error'))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [showToast, t.error]);

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => showToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black text-primary">{t.activity}</h2>
      </div>
      <TableShell>
        <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <thead className="table-head text-xs font-bold text-muted uppercase">
            <tr>
              <th className="p-4">{t.action}</th>
              <th className="p-4">{t.entity}</th>
              <th className="p-4">{t.by}</th>
              <th className="p-4">{t.time}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="table-row">
                <td className="p-4 font-semibold text-primary">{row.action}</td>
                <td className="p-4 text-secondary">{row.entity} #{row.entity_id || '-'}</td>
                <td className="p-4 text-secondary">{row.username || row.user_id || '-'}</td>
                <td className="p-4 text-muted text-sm">{new Date(row.created_at).toLocaleString(locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-6 text-center text-muted">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>}
        {!loading && rows.length === 0 && <div className="p-6 text-center text-muted">{lang === 'ar' ? 'لا توجد نتائج' : 'No data'}</div>}
      </TableShell>
    </div>
  );
};

