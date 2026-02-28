import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Edit3, Image as ImageIcon, Layers, Plus, Save, Search, Trash2 } from 'lucide-react';
import { API_URL } from '../../../app/config';
import {
  Button,
  Card,
  Input,
  MediaPicker,
  Toast,
  TRANSLATIONS,
  useToast
} from '../shared/adminShared';

export const AdminCategories = ({ lang = 'ar' }) => {
  const t = TRANSLATIONS[lang];
  const { showToast, toast } = useToast();
  const [cats, setC] = useState([]);
  const [filteredCats, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ id: null, name: '', description: '', image_url: '' });
  const [productCounts, setProductCounts] = useState({});
  const [sortBy, setSortBy] = useState('name_asc');
  const [showMedia, setShowMedia] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetch = () => Promise.all([
    axios.get(`${API_URL}/categories`).catch(() => ({ data: [] })),
    axios.get(`${API_URL}/products?limit=1000`).catch(() => ({ data: { data: [] } }))
  ]).then(([catRes, prodRes]) => {
    const data = Array.isArray(catRes.data) ? catRes.data : [];
    const products = Array.isArray(prodRes?.data?.data) ? prodRes.data.data : [];
    const counts = {};
    products.forEach((product) => {
      const key = String(product?.category || '').trim();
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    setProductCounts(counts);
    setC(data);
    setFiltered(data);
  }).catch(() => {
    setC([]);
    setFiltered([]);
    setProductCounts({});
  });

  useEffect(() => { fetch(); }, []);

  // Live Search
  useEffect(() => {
    const needle = search.toLowerCase();
    setFiltered(cats.filter(c =>
      String(c?.name || '').toLowerCase().includes(needle)
      || String(c?.description || '').toLowerCase().includes(needle)
    ));
  }, [search, cats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return showToast("الاسم مطلوب", "error");
    
    try {
      if (isEditing && form.id) {
        await axios.put(
          `${API_URL}/categories/${form.id}`,
          { name: form.name, description: form.description, image_url: form.image_url },
          { withCredentials: true }
        );
        showToast("تم التحديث بنجاح");
      } else {
        await axios.post(`${API_URL}/categories`, form, { withCredentials: true });
        showToast(t.success);
      }
      resetForm();
      fetch();
    } catch { showToast(t.error, 'error'); }
  };

  const deleteCat = (id) => {
    const target = cats.find((item) => Number(item.id) === Number(id));
    const categoryName = String(target?.name || '');
    const linkedProducts = Number(productCounts[categoryName] || 0);
    const warning = linkedProducts > 0
      ? `\n${lang === 'ar' ? `سيؤثر هذا على ${linkedProducts} منتج مرتبط.` : `This will affect ${linkedProducts} linked products.`}`
      : '';
    if(confirm(`${t.confirmDelete}${warning}`)) axios.delete(`${API_URL}/categories/${id}`, { withCredentials: true }).then(() => {
      fetch();
      showToast("تم الحذف");
    });
  };

  const startEdit = (cat) => {
    setForm({ id: cat.id, name: cat.name || '', description: cat.description || '', image_url: cat.image_url || '' });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setForm({ id: null, name: '', description: '', image_url: '' });
    setIsEditing(false);
  };

  const visibleCats = useMemo(() => {
    const cloned = [...filteredCats];
    if (sortBy === 'name_desc') cloned.sort((a, b) => String(b.name || '').localeCompare(String(a.name || ''), undefined, { sensitivity: 'base' }));
    if (sortBy === 'name_asc') cloned.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
    if (sortBy === 'count_desc') cloned.sort((a, b) => Number(productCounts[b.name] || 0) - Number(productCounts[a.name] || 0));
    if (sortBy === 'count_asc') cloned.sort((a, b) => Number(productCounts[a.name] || 0) - Number(productCounts[b.name] || 0));
    return cloned;
  }, [filteredCats, sortBy, productCounts]);

  const exportCategoriesCsv = () => {
    const rows = [
      ['id', 'name', 'description', 'linked_products'],
      ...visibleCats.map((c) => [c.id, c.name || '', c.description || '', Number(productCounts[c.name] || 0)])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>showToast(null)}/>}
      {showMedia && <MediaPicker onClose={()=>setShowMedia(false)} onSelect={(m)=>setForm({...form, image_url: m.url})} lang={lang}/>}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary">{t.categories}</h1>
          <p className="text-muted mt-1">تنظيم وتصنيف منتجات المتجر</p>
        </div>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative w-full md:w-96">
            <Search className={`absolute top-3.5 text-muted ${lang==='ar'?'right-4':'left-4'}`} size={20}/>
            <input 
              className={`w-full bg-card border-none rounded-xl py-3 shadow-sm outline-none focus:ring-2 ring-focus transition ${lang==='ar'?'pr-12 pl-4':'pl-12 pr-4'}`} 
              placeholder={t.search} 
              value={search} 
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="ui-select md:w-52" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name_asc">{lang === 'ar' ? 'الاسم (أ-ي)' : 'Name (A-Z)'}</option>
            <option value="name_desc">{lang === 'ar' ? 'الاسم (ي-أ)' : 'Name (Z-A)'}</option>
            <option value="count_desc">{lang === 'ar' ? 'الأكثر منتجات' : 'Most products'}</option>
            <option value="count_asc">{lang === 'ar' ? 'الأقل منتجات' : 'Least products'}</option>
          </select>
          <button className="ui-btn ui-btn-secondary md:w-auto" onClick={exportCategoriesCsv}>
            {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left: Form */}
        <Card className="p-6 sticky top-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              {isEditing ? <Edit3 size={20} className="text-primary"/> : <Plus size={20} className="text-green-600"/>}
              {isEditing ? t.edit : t.addCategory}
            </h3>
            {isEditing && <button onClick={resetForm} className="text-xs text-red-500 font-bold hover:underline">{t.cancel}</button>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-muted mb-2 uppercase">{t.catImg}</label>
              <div onClick={()=>setShowMedia(true)} className="h-40 border-2 border-dashed border-subtle rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-card-soft hover:border-primary/30 transition relative overflow-hidden group">
                {form.image_url ? (
                  <>
                    <img src={form.image_url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span className="text-white font-bold text-sm">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted">
                    <ImageIcon size={32} className="mx-auto mb-2"/>
                    <span className="text-sm font-medium">اختر صورة</span>
                  </div>
                )}
              </div>
            </div>

            <Input required label={t.catName} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="مثال: إلكترونيات"/>
            
            <div>
              <label className="block text-xs font-bold text-muted mb-2 uppercase">{t.catDesc}</label>
              <textarea className="w-full border border-subtle rounded-xl p-3 h-24 focus:ring-2 ring-focus outline-none resize-none transition" placeholder="وصف قصير يظهر للعملاء..." value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/>
            </div>

            <Button className="w-full" icon={isEditing ? Save : Plus}>
              {isEditing ? t.save : t.add}
            </Button>
          </form>
        </Card>

        {/* Right: Grid List */}
        <div className="lg:col-span-2">
          {visibleCats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-3xl border border-dashed border-subtle text-muted">
              <Layers size={48} className="mb-4 opacity-20"/>
              <p>لا توجد أقسام مطابقة</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {visibleCats.map(c => (
                <div key={c.id} className="group bg-card p-4 rounded-2xl border border-subtle shadow-sm hover:shadow-md transition-all flex items-start gap-4 relative overflow-hidden">
                  <div className="w-20 h-20 bg-card-soft rounded-xl overflow-hidden shrink-0 border border-subtle">
                    {c.image_url ? <img src={c.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-muted"><Layers/></div>}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className="font-bold text-lg text-primary truncate">{c.name}</h4>
                    <p className="text-sm text-muted line-clamp-2 leading-relaxed">{c.description || 'لا يوجد وصف'}</p>
                    <div className="mt-3 inline-flex items-center rounded-full border border-subtle bg-card-soft px-2.5 py-1 text-[11px] font-bold text-secondary">
                      {lang === 'ar' ? 'منتجات مرتبطة' : 'Linked products'}: <span className="text-primary ms-1">{Number(productCounts[c.name] || 0)}</span>
                    </div>
                  </div>

                  {/* Actions (Hover) */}
                  <div className={`absolute top-2 ${lang === 'ar' ? 'right-2 -translate-x-4 group-hover:translate-x-0' : 'left-2 translate-x-4 group-hover:translate-x-0'} flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all`}>
                    <button onClick={()=>startEdit(c)} className="p-2 bg-card text-primary shadow-sm rounded-lg hover:bg-primary hover:text-white border transition"><Edit3 size={16}/></button>
                    <button onClick={()=>deleteCat(c.id)} className="p-2 bg-card text-red-500 shadow-sm rounded-lg hover:bg-red-500 hover:text-white border transition"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

