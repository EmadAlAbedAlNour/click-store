import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Edit3, Plus, Save, Search, Trash2, Users, X } from 'lucide-react';
import { API_URL } from '../../../app/config';
import {
  Button,
  Card,
  Input,
  ModalFrame,
  Toast,
  TRANSLATIONS,
  useToast
} from '../shared/adminShared';

export const AdminUsers = ({ lang = 'ar' }) => {
  const t = TRANSLATIONS[lang];
  const { showToast, toast } = useToast();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [form, setForm] = useState({ username: '', password: '', role: 'editor', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', role: 'editor', password: '' });
  const [editSaving, setEditSaving] = useState(false);

  const normalizeUser = useCallback((row = {}) => {
    const username = String(row?.username || '').trim();
    const fullName = String(row?.full_name || '').trim() || username || 'User';
    return {
      ...row,
      username,
      full_name: fullName
    };
  }, []);

  // جلب البيانات
  const fetchUsers = useCallback(() => {
    setLoading(true);
    axios.get(`${API_URL}/users`, { withCredentials: true })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        const normalized = data.map((row) => normalizeUser(row));
        setUsers(normalized);
        setFiltered(normalized);
      })
      .catch(error => {
        // تجاهل خطأ الصلاحيات بصمت أو إظهار تنبيه لطيف
        if(error.response?.status !== 403) showToast(t.error, 'error');
      })
      .finally(() => setLoading(false));
  }, [normalizeUser, showToast, t.error]);
  
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // البحث الحي
  useEffect(() => {
    const needle = search.toLowerCase();
    const rows = users.filter(u => {
      const matchesSearch = String(u?.full_name || '').toLowerCase().includes(needle)
        || String(u?.username || '').toLowerCase().includes(needle);
      const matchesRole = roleFilter === 'all' ? true : String(u?.role || '') === roleFilter;
      return matchesSearch && matchesRole;
    });
    if (sortBy === 'newest') rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    if (sortBy === 'oldest') rows.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    if (sortBy === 'name_asc') rows.sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''), undefined, { sensitivity: 'base' }));
    if (sortBy === 'name_desc') rows.sort((a, b) => String(b.full_name || '').localeCompare(String(a.full_name || ''), undefined, { sensitivity: 'base' }));
    setFiltered(rows);
  }, [search, users, roleFilter, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = String(form.username || '').trim();
    const password = String(form.password || '');
    const fullName = String(form.full_name || '').trim() || username;
    if (!username) return showToast(lang === 'ar' ? 'اسم المستخدم مطلوب' : 'Username is required', 'error');
    if (password.length < 6) return showToast(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'error');
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/users`, { ...form, username, password, full_name: fullName }, { withCredentials: true });
      setForm({username:'', password:'', full_name:'', role:'editor'}); 
      setView('list'); 
      fetchUsers(); 
      showToast(t.success);
    } catch (error) { 
      showToast(error?.response?.data?.error || error?.response?.data?.message || t.error, "error"); 
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if(confirm(t.confirmDelete)) {
      try {
        await axios.delete(`${API_URL}/users/${id}`, { withCredentials: true });
        fetchUsers();
        showToast(t.success);
      } catch (error) {
        showToast(error?.response?.data?.error || t.error, 'error');
      }
    }
  };

  const openEditUser = (user) => {
    const normalized = normalizeUser(user);
    setEditUser(user);
    setEditForm({
      full_name: normalized.full_name,
      role: normalized?.role || 'editor',
      password: ''
    });
  };

  const saveEditedUser = async () => {
    if (!editUser?.id) return;
    setEditSaving(true);
    try {
      const payload = {
        full_name: String(editForm.full_name || '').trim(),
        role: editForm.role
      };
      if (String(editForm.password || '').trim()) payload.password = String(editForm.password);
      await axios.put(`${API_URL}/users/${editUser.id}`, payload, { withCredentials: true });
      showToast(t.success);
      setEditUser(null);
      fetchUsers();
    } catch {
      showToast(t.error, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const exportUsersCsv = () => {
    const rows = [
      ['id', 'full_name', 'username', 'role', 'created_at'],
      ...filtered.map((u) => {
        const normalized = normalizeUser(u);
        return [normalized.id, normalized.full_name, normalized.username, normalized.role || '', normalized.created_at || ''];
      })
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // مساعد لتحديد لون الصلاحية
  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cashier': return 'bg-green-100 text-green-700 border-green-200';
      case 'editor': return 'bg-primary/10 text-primary border-primary/30';
      default: return 'bg-card-soft text-secondary';
    }
  };

  // 1. FORM VIEW
  if (view === 'form') return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>showToast(null)}/>}
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-primary">{t.addUser}</h2>
        <Button variant="secondary" onClick={() => setView('list')}>{t.cancel}</Button>
      </div>

      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8 bg-primary/10 p-4 rounded-2xl border border-primary/30">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-soft">
            <Users size={24}/>
          </div>
          <div>
            <h3 className="font-bold text-primary">بيانات الحساب الجديد</h3>
            <p className="text-sm text-primary">سيتمكن هذا المستخدم من الدخول فوراً</p>
          </div>
        </div>

        <div className="space-y-6">
          <Input label={t.fullName} value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} placeholder="مثال: أحمد محمد"/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t.username} value={form.username} onChange={e=>setForm({...form, username:e.target.value})} placeholder="اسم الدخول"/>
            <Input label={t.password} type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="••••••"/>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">{t.role}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['admin', 'editor', 'cashier'].map(role => (
                <div key={role} 
                  onClick={() => setForm({...form, role})}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center gap-2 text-center ${form.role === role ? 'border-primary bg-primary/10' : 'border-subtle hover:border-subtle'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${form.role === role ? 'bg-primary' : 'bg-border-subtle'}`}></div>
                  <span className="font-bold capitalize">{t[role]}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4" icon={Save}>
            {loading ? 'جاري الحفظ...' : t.save}
          </Button>
        </div>
      </Card>
    </div>
  );

  // 2. LIST VIEW
  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>showToast(null)}/>}
      {editUser && (
        <ModalFrame onClose={() => setEditUser(null)} className="w-full max-w-xl">
          <div className="p-6 border-b border-subtle flex items-center justify-between bg-card-soft">
            <h3 className="font-black text-xl text-primary">
              {lang === 'ar' ? `تعديل الموظف #${editUser.id}` : `Edit User #${editUser.id}`}
            </h3>
            <button onClick={() => setEditUser(null)} className="ui-btn ui-btn-icon ui-btn-secondary"><X size={16} /></button>
          </div>
          <div className="p-6 space-y-4">
            <Input
              label={t.fullName}
              value={editForm.full_name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
            />
            <div>
              <label className="block text-xs font-bold text-muted mb-2 uppercase">{t.role}</label>
              <select
                className="ui-select"
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="admin">{t.admin}</option>
                <option value="editor">{t.editor}</option>
                <option value="cashier">{t.cashier}</option>
              </select>
            </div>
            <Input
              label={lang === 'ar' ? 'كلمة مرور جديدة (اختياري)' : 'New Password (optional)'}
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••"
            />
            <div className="flex gap-2">
              <button className="ui-btn ui-btn-secondary flex-1" onClick={() => setEditUser(null)}>{t.cancel}</button>
              <button className="ui-btn ui-btn-primary flex-1" onClick={saveEditedUser} disabled={editSaving}>
                {editSaving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </ModalFrame>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary">{t.users}</h1>
          <p className="text-muted mt-1">إدارة صلاحيات الوصول وحسابات الموظفين</p>
        </div>
        <Button onClick={() => { setForm({username:'', password:'', role:'editor', full_name:''}); setView('form'); }} icon={Plus}>
          {t.addUser}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-4 rounded-2xl border shadow-sm">
          <span className="text-xs text-muted font-bold uppercase">إجمالي الفريق</span>
          <div className="text-2xl font-black text-primary">{users.length}</div>
        </div>
        <div className="bg-card p-4 rounded-2xl border shadow-sm">
          <span className="text-xs text-purple-400 font-bold uppercase">المدراء</span>
          <div className="text-2xl font-black text-purple-600">{users.filter(u=>u.role==='admin').length}</div>
        </div>
        <div className="bg-card p-4 rounded-2xl border shadow-sm">
          <span className="text-xs text-primary font-bold uppercase">المحررين</span>
          <div className="text-2xl font-black text-primary">{users.filter(u=>u.role==='editor').length}</div>
        </div>
        <div className="bg-card p-4 rounded-2xl border shadow-sm">
          <span className="text-xs text-green-400 font-bold uppercase">الكاشير</span>
          <div className="text-2xl font-black text-green-600">{users.filter(u=>u.role==='cashier').length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_180px_180px_160px] gap-3">
        <div className="relative">
          <Search className={`absolute top-3.5 text-muted ${lang==='ar'?'right-4':'left-4'}`} size={20}/>
          <input 
            className={`w-full bg-card border-none rounded-xl py-3 shadow-sm outline-none focus:ring-2 ring-focus transition ${lang==='ar'?'pr-12 pl-4':'pl-12 pr-4'}`} 
            placeholder={t.search} 
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="ui-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">{lang === 'ar' ? 'كل الصلاحيات' : 'All roles'}</option>
          <option value="admin">{t.admin}</option>
          <option value="editor">{t.editor}</option>
          <option value="cashier">{t.cashier}</option>
        </select>
        <select className="ui-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">{lang === 'ar' ? 'الأحدث' : 'Newest'}</option>
          <option value="oldest">{lang === 'ar' ? 'الأقدم' : 'Oldest'}</option>
          <option value="name_asc">{lang === 'ar' ? 'الاسم (أ-ي)' : 'Name (A-Z)'}</option>
          <option value="name_desc">{lang === 'ar' ? 'الاسم (ي-أ)' : 'Name (Z-A)'}</option>
        </select>
        <button className="ui-btn ui-btn-secondary" onClick={exportUsersCsv}>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</button>
      </div>

      {/* Users Grid */}
      {loading ? <div className="text-center p-10 text-muted">جاري التحميل...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((u) => {
            const displayName = String(u?.full_name || u?.username || 'User').trim() || 'User';
            const avatarInitial = displayName.charAt(0).toUpperCase();
            return (
              <div key={u.id} className="bg-card p-6 rounded-3xl border border-subtle shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${u.role==='admin' ? 'bg-gradient-to-br from-primary to-primary-strong text-white' : 'bg-card-soft border border-subtle text-primary'}`}>
                    {avatarInitial || 'U'}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadge(u.role)}`}>
                    {t[u.role] || u.role}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-primary">{displayName}</h3>
                <p className="text-sm text-muted mb-4">@{u.username}</p>
                
                <div className="pt-4 border-t border-subtle flex justify-between items-center">
                  <span className="text-xs text-muted font-mono">ID: {u.id}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditUser(u)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition">
                      <Edit3 size={18}/>
                    </button>
                    {u.username !== 'admin' && (
                      <button onClick={()=>deleteUser(u.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition">
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {filtered.length === 0 && !loading && (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-subtle text-muted">
          <Users size={48} className="mx-auto mb-4 opacity-20"/>
          <p>لا يوجد موظفين مطابقين للبحث</p>
        </div>
      )}
    </div>
  );
};

