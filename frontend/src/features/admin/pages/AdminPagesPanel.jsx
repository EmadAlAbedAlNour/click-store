import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Layout,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  Users
} from 'lucide-react';
import { API_URL } from '../../../app/config';
import { staffAuthConfig } from '../../../shared/api/authConfig';
import { getLatinDigitsLocale } from '../../../shared/utils/localeDigits';

const isPublished = (value) => Number(value) === 1 || value === true;

const sanitizeSlug = (value) => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
);

const createBlockTemplate = (type, lang) => {
  if (type === 'hero') {
    return { type, content: { title: '', subtitle: '', image: '' } };
  }
  if (type === 'text') {
    return { type, content: { body: '<p></p>' } };
  }
  if (type === 'grid') {
    return { type, content: { title: '', count: 4 } };
  }
  if (type === 'about_layout') {
    return {
      type,
      content: {
        eyebrow: lang === 'ar' ? 'من نحن' : 'About Us',
        title: '',
        subtitle: '',
        story_title: '',
        story_body: '',
        bullet_1: '',
        bullet_2: '',
        bullet_3: '',
        cta_title: '',
        cta_body: '',
        cta_primary_text: lang === 'ar' ? 'تصفح المنتجات' : 'Browse Products',
        cta_primary_link: '/shop',
        cta_secondary_text: lang === 'ar' ? 'تواصل معنا' : 'Contact Us',
        cta_secondary_link: '/contact'
      }
    };
  }
  if (type === 'contact_layout') {
    return {
      type,
      content: {
        eyebrow: lang === 'ar' ? 'تواصل معنا' : 'Contact',
        title: '',
        subtitle: '',
        support_title: '',
        support_body: '',
        hours_label: lang === 'ar' ? 'أوقات العمل' : 'Working Hours',
        hours_value: '',
        social_title: '',
        location_note: ''
      }
    };
  }
  return { type: 'text', content: { body: '<p></p>' } };
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="ui-field-label">{label}</label>
    {children}
  </div>
);

export default function AdminPagesPanel({ lang = 'ar', t, MediaPicker }) {
  const L = useCallback((ar, en) => (lang === 'ar' ? ar : en), [lang]);
  const locale = getLatinDigitsLocale(lang);
  const [toast, setToast] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [editor, setEditor] = useState(null);
  const [showMedia, setShowMedia] = useState(false);
  const [activeBlock, setActiveBlock] = useState(null);

  const pushToast = useCallback((message, type = 'success') => {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const authConfig = staffAuthConfig;

  const fetchPages = useCallback(() => {
    setLoading(true);
    axios.get(`${API_URL}/pages`, authConfig)
      .then((res) => setPages(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        setPages([]);
        pushToast(t.error, 'error');
      })
      .finally(() => setLoading(false));
  }, [authConfig, pushToast, t.error]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const openEditor = async (slug) => {
    try {
      const res = await axios.get(`${API_URL}/pages/${slug}`, authConfig);
      const page = res?.data || {};
      setEditor({
        ...page,
        title: String(page?.title || ''),
        slug: String(page?.slug || ''),
        is_published: isPublished(page?.is_published) ? 1 : 0,
        blocks: Array.isArray(page?.blocks) ? page.blocks : []
      });
    } catch {
      pushToast(t.error, 'error');
    }
  };

  const openNewPage = () => {
    setEditor({ title: '', slug: '', is_published: 1, blocks: [] });
  };

  const addBlock = (type) => {
    setEditor((prev) => ({
      ...prev,
      blocks: [...(Array.isArray(prev?.blocks) ? prev.blocks : []), createBlockTemplate(type, lang)]
    }));
  };

  const updateBlock = (idx, key, value) => {
    setEditor((prev) => {
      const blocks = [...(Array.isArray(prev?.blocks) ? prev.blocks : [])];
      if (!blocks[idx]) return prev;
      blocks[idx] = {
        ...blocks[idx],
        content: {
          ...(blocks[idx]?.content || {}),
          [key]: value
        }
      };
      return { ...prev, blocks };
    });
  };

  const removeBlock = (idx) => {
    setEditor((prev) => {
      const blocks = [...(Array.isArray(prev?.blocks) ? prev.blocks : [])];
      blocks.splice(idx, 1);
      return { ...prev, blocks };
    });
  };

  const moveBlock = (idx, direction) => {
    setEditor((prev) => {
      const blocks = [...(Array.isArray(prev?.blocks) ? prev.blocks : [])];
      if (direction === 'up' && idx > 0) {
        [blocks[idx], blocks[idx - 1]] = [blocks[idx - 1], blocks[idx]];
      } else if (direction === 'down' && idx < blocks.length - 1) {
        [blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]];
      }
      return { ...prev, blocks };
    });
  };

  const savePage = async () => {
    const safeTitle = String(editor?.title || '').trim();
    const safeSlug = sanitizeSlug(editor?.slug);
    if (!safeTitle || !safeSlug) {
      pushToast(L('العنوان والرابط مطلوبان', 'Title and slug are required'), 'error');
      return;
    }

    const payload = {
      title: safeTitle,
      slug: safeSlug,
      is_published: isPublished(editor?.is_published) ? 1 : 0,
      blocks: (Array.isArray(editor?.blocks) ? editor.blocks : []).map((block) => ({
        type: String(block?.type || 'text'),
        content: block?.content || {}
      }))
    };

    setSaving(true);
    try {
      await axios.post(`${API_URL}/pages`, payload, authConfig);
      setEditor(null);
      fetchPages();
      pushToast(t.success);
    } catch {
      pushToast(t.error, 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (page) => {
    const next = isPublished(page?.is_published) ? 0 : 1;
    setPages((prev) => prev.map((item) => (item.id === page.id ? { ...item, is_published: next } : item)));
    try {
      await axios.put(`${API_URL}/pages/${page.id}/publish`, { is_published: next }, authConfig);
      pushToast(L('تم تحديث حالة النشر', 'Publish state updated'));
    } catch {
      setPages((prev) => prev.map((item) => (item.id === page.id ? { ...item, is_published: isPublished(page?.is_published) ? 1 : 0 } : item)));
      pushToast(t.error, 'error');
    }
  };

  const duplicatePage = async (page) => {
    try {
      const res = await axios.get(`${API_URL}/pages/${page.slug}`, authConfig);
      const source = res?.data || {};
      const slugs = new Set(pages.map((item) => String(item.slug || '')));
      const base = `${source.slug || page.slug}-copy`;
      let candidate = base;
      let n = 2;
      while (slugs.has(candidate)) {
        candidate = `${base}-${n}`;
        n += 1;
      }

      await axios.post(
        `${API_URL}/pages`,
        {
          title: `${source.title || page.title} ${lang === 'ar' ? '(نسخة)' : '(Copy)'}`,
          slug: candidate,
          is_published: 0,
          blocks: Array.isArray(source.blocks) ? source.blocks : []
        },
        authConfig
      );
      fetchPages();
      pushToast(L('تم إنشاء نسخة من الصفحة', 'Page duplicated'));
    } catch {
      pushToast(t.error, 'error');
    }
  };

  const deletePage = async (page) => {
    if (!page?.slug) return;
    if (page.slug === 'home') {
      pushToast(L('لا يمكن حذف الصفحة الرئيسية', 'Home page cannot be deleted'), 'error');
      return;
    }
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await axios.delete(`${API_URL}/pages/${page.slug}`, authConfig);
      setPages((prev) => prev.filter((item) => item.slug !== page.slug));
      pushToast(t.success);
    } catch {
      pushToast(t.error, 'error');
    }
  };

  const visiblePages = useMemo(() => {
    const needle = String(search || '').toLowerCase();
    let result = pages.filter((page) => (
      String(page?.title || '').toLowerCase().includes(needle)
      || String(page?.slug || '').toLowerCase().includes(needle)
    ));

    if (statusFilter !== 'all') {
      result = result.filter((page) => (statusFilter === 'published' ? isPublished(page?.is_published) : !isPublished(page?.is_published)));
    }

    if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (sortBy === 'title_asc') {
      result = [...result].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'title_desc') {
      result = [...result].sort((a, b) => String(b.title || '').localeCompare(String(a.title || ''), undefined, { sensitivity: 'base' }));
    } else {
      result = [...result].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [pages, search, sortBy, statusFilter]);

  const pageStats = useMemo(() => {
    const published = pages.filter((item) => isPublished(item?.is_published)).length;
    return {
      total: pages.length,
      published,
      drafts: pages.length - published
    };
  }, [pages]);

  if (editor) {
    return (
      <section className="max-w-7xl mx-auto animate-fade-in pb-20" aria-labelledby="admin-page-editor-title">
        {toast ? (
          <div className={`ui-toast ${toast.type === 'error' ? 'ui-toast-error' : 'ui-toast-success'}`}>
            <div className="flex-1 font-medium">{toast.message}</div>
            <button onClick={() => setToast(null)} className="ui-btn ui-btn-ghost ui-btn-icon-sm text-white/85 hover:text-white hover:bg-black/10">x</button>
          </div>
        ) : null}
        {showMedia && MediaPicker ? (
          <MediaPicker
            onClose={() => setShowMedia(false)}
            onSelect={(media) => {
              if (activeBlock) updateBlock(activeBlock.idx, activeBlock.key, String(media?.url || ''));
              setShowMedia(false);
            }}
            lang={lang}
          />
        ) : null}

        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-card border border-subtle rounded-2xl p-4 mb-6 sticky top-4 z-20 shadow-soft">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditor(null)} className="ui-btn ui-btn-icon ui-btn-secondary">
              {lang === 'ar' ? <ArrowRight size={17} /> : <ArrowLeft size={17} />}
            </button>
            <div>
              <h2 id="admin-page-editor-title" className="text-xl font-black text-primary">{editor.slug === 'home' ? L('الصفحة الرئيسية', 'Home Page') : (editor.title || L('صفحة جديدة', 'New Page'))}</h2>
              <span className="text-xs text-muted font-mono">/{editor.slug || 'new-page'}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setEditor(null)} className="ui-btn ui-btn-secondary">{t.cancel}</button>
            <button onClick={savePage} disabled={saving} className="ui-btn ui-btn-primary"><Save size={15} />{saving ? t.saving : t.save}</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <div className="premium-panel p-5 space-y-4">
              <h3 className="font-black text-primary flex items-center gap-2"><Settings size={16} />{L('إعدادات الصفحة', 'Page Settings')}</h3>
              <Field label={t.pageTitle}>
                <input className="ui-input" value={editor.title || ''} onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))} />
              </Field>
              <Field label={t.pageSlug}>
                <input
                  className={`ui-input ${editor.slug === 'home' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={editor.slug || ''}
                  disabled={editor.slug === 'home'}
                  onChange={(e) => setEditor((prev) => ({ ...prev, slug: sanitizeSlug(e.target.value) }))}
                />
              </Field>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="ui-check"
                  checked={isPublished(editor?.is_published)}
                  onChange={(e) => setEditor((prev) => ({ ...prev, is_published: e.target.checked ? 1 : 0 }))}
                />
                <span className="text-sm font-semibold text-primary">{L('منشورة', 'Published')}</span>
              </label>
            </div>

            <div className="premium-panel p-5 space-y-2">
              <h3 className="font-black text-primary flex items-center gap-2"><Box size={16} />{t.components}</h3>
              <button onClick={() => addBlock('hero')} className="w-full text-start rounded-xl border border-subtle bg-card-soft px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"><ImageIcon size={14} className="inline me-2" />{t.compHero}</button>
              <button onClick={() => addBlock('text')} className="w-full text-start rounded-xl border border-subtle bg-card-soft px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"><FileText size={14} className="inline me-2" />{t.compText}</button>
              <button onClick={() => addBlock('grid')} className="w-full text-start rounded-xl border border-subtle bg-card-soft px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"><Layout size={14} className="inline me-2" />{t.compGrid}</button>
              <button onClick={() => addBlock('about_layout')} className="w-full text-start rounded-xl border border-subtle bg-card-soft px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"><Users size={14} className="inline me-2" />{L('قسم من نحن', 'About Layout')}</button>
              <button onClick={() => addBlock('contact_layout')} className="w-full text-start rounded-xl border border-subtle bg-card-soft px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"><Mail size={14} className="inline me-2" />{L('قسم التواصل', 'Contact Layout')}</button>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {(editor.blocks || []).length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-subtle bg-card-soft h-64 flex items-center justify-center text-muted">
                {L('الصفحة فارغة، أضف أول مكوّن من القائمة', 'Page is empty, add your first block from the panel')}
              </div>
            ) : null}

            {(editor.blocks || []).map((block, idx) => (
              <div key={`${block.type}-${idx}`} className="premium-panel overflow-hidden">
                <div className="px-4 py-3 bg-card-soft border-b border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-muted bg-card border border-subtle rounded-full px-2 py-1">{block.type}</span>
                    <span className="text-xs text-muted">#{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="ui-btn ui-btn-icon ui-btn-secondary disabled:opacity-40"><ChevronUp size={14} /></button>
                    <button onClick={() => moveBlock(idx, 'down')} disabled={idx === (editor.blocks || []).length - 1} className="ui-btn ui-btn-icon ui-btn-secondary disabled:opacity-40"><ChevronDown size={14} /></button>
                    <button onClick={() => removeBlock(idx)} className="ui-btn ui-btn-icon ui-btn-icon-danger"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {block.type === 'hero' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="ui-input" placeholder={L('العنوان الرئيسي', 'Title')} value={block.content?.title || ''} onChange={(e) => updateBlock(idx, 'title', e.target.value)} />
                        <input className="ui-input" placeholder={L('العنوان الفرعي', 'Subtitle')} value={block.content?.subtitle || ''} onChange={(e) => updateBlock(idx, 'subtitle', e.target.value)} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-20 rounded-xl border border-subtle bg-card-soft overflow-hidden flex items-center justify-center">
                          {block.content?.image ? <img src={block.content.image} alt="hero-block" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-muted" />}
                        </div>
                        <button className="ui-btn ui-btn-secondary" onClick={() => { setActiveBlock({ idx, key: 'image' }); setShowMedia(true); }}>
                          {L('اختيار صورة', 'Pick image')}
                        </button>
                      </div>
                    </>
                  ) : null}

                  {block.type === 'text' ? (
                    <textarea className="ui-textarea h-36 font-mono text-sm" value={block.content?.body || ''} onChange={(e) => updateBlock(idx, 'body', e.target.value)} />
                  ) : null}

                  {block.type === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className="ui-input" placeholder={L('عنوان القسم', 'Section title')} value={block.content?.title || ''} onChange={(e) => updateBlock(idx, 'title', e.target.value)} />
                      <input type="number" min="1" className="ui-input" placeholder={L('عدد المنتجات', 'Products count')} value={block.content?.count || 4} onChange={(e) => updateBlock(idx, 'count', e.target.value)} />
                    </div>
                  ) : null}

                  {block.type === 'about_layout' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className="ui-input" placeholder={L('العنوان الرئيسي', 'Main title')} value={block.content?.title || ''} onChange={(e) => updateBlock(idx, 'title', e.target.value)} />
                      <input className="ui-input" placeholder={L('العنوان الفرعي', 'Subtitle')} value={block.content?.subtitle || ''} onChange={(e) => updateBlock(idx, 'subtitle', e.target.value)} />
                      <input className="ui-input" placeholder={L('عنوان القصة', 'Story title')} value={block.content?.story_title || ''} onChange={(e) => updateBlock(idx, 'story_title', e.target.value)} />
                      <input className="ui-input" placeholder={L('نص الشارة العلوية', 'Eyebrow')} value={block.content?.eyebrow || ''} onChange={(e) => updateBlock(idx, 'eyebrow', e.target.value)} />
                      <textarea className="ui-textarea h-20 md:col-span-2" placeholder={L('نص القصة', 'Story body')} value={block.content?.story_body || ''} onChange={(e) => updateBlock(idx, 'story_body', e.target.value)} />
                      <input className="ui-input" placeholder={L('ميزة 1', 'Bullet 1')} value={block.content?.bullet_1 || ''} onChange={(e) => updateBlock(idx, 'bullet_1', e.target.value)} />
                      <input className="ui-input" placeholder={L('ميزة 2', 'Bullet 2')} value={block.content?.bullet_2 || ''} onChange={(e) => updateBlock(idx, 'bullet_2', e.target.value)} />
                      <input className="ui-input md:col-span-2" placeholder={L('ميزة 3', 'Bullet 3')} value={block.content?.bullet_3 || ''} onChange={(e) => updateBlock(idx, 'bullet_3', e.target.value)} />
                      <input className="ui-input" placeholder={L('عنوان CTA', 'CTA title')} value={block.content?.cta_title || ''} onChange={(e) => updateBlock(idx, 'cta_title', e.target.value)} />
                      <input className="ui-input" placeholder={L('وصف CTA', 'CTA body')} value={block.content?.cta_body || ''} onChange={(e) => updateBlock(idx, 'cta_body', e.target.value)} />
                      <input className="ui-input" placeholder={L('زر أساسي', 'Primary button text')} value={block.content?.cta_primary_text || ''} onChange={(e) => updateBlock(idx, 'cta_primary_text', e.target.value)} />
                      <input className="ui-input" placeholder={L('رابط الزر الأساسي', 'Primary button link')} value={block.content?.cta_primary_link || ''} onChange={(e) => updateBlock(idx, 'cta_primary_link', e.target.value)} />
                      <input className="ui-input" placeholder={L('زر ثانوي', 'Secondary button text')} value={block.content?.cta_secondary_text || ''} onChange={(e) => updateBlock(idx, 'cta_secondary_text', e.target.value)} />
                      <input className="ui-input" placeholder={L('رابط الزر الثانوي', 'Secondary button link')} value={block.content?.cta_secondary_link || ''} onChange={(e) => updateBlock(idx, 'cta_secondary_link', e.target.value)} />
                    </div>
                  ) : null}

                  {block.type === 'contact_layout' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className="ui-input" placeholder={L('العنوان الرئيسي', 'Main title')} value={block.content?.title || ''} onChange={(e) => updateBlock(idx, 'title', e.target.value)} />
                      <input className="ui-input" placeholder={L('العنوان الفرعي', 'Subtitle')} value={block.content?.subtitle || ''} onChange={(e) => updateBlock(idx, 'subtitle', e.target.value)} />
                      <input className="ui-input" placeholder={L('عنوان الدعم', 'Support title')} value={block.content?.support_title || ''} onChange={(e) => updateBlock(idx, 'support_title', e.target.value)} />
                      <input className="ui-input" placeholder={L('عنوان السوشيال', 'Social title')} value={block.content?.social_title || ''} onChange={(e) => updateBlock(idx, 'social_title', e.target.value)} />
                      <input className="ui-input" placeholder={L('عنوان ساعات العمل', 'Hours label')} value={block.content?.hours_label || ''} onChange={(e) => updateBlock(idx, 'hours_label', e.target.value)} />
                      <input className="ui-input" placeholder={L('قيمة ساعات العمل', 'Hours value')} value={block.content?.hours_value || ''} onChange={(e) => updateBlock(idx, 'hours_value', e.target.value)} />
                      <textarea className="ui-textarea h-20 md:col-span-2" placeholder={L('نص الدعم', 'Support body')} value={block.content?.support_body || ''} onChange={(e) => updateBlock(idx, 'support_body', e.target.value)} />
                      <textarea className="ui-textarea h-20 md:col-span-2" placeholder={L('ملاحظة الموقع', 'Location note')} value={block.content?.location_note || ''} onChange={(e) => updateBlock(idx, 'location_note', e.target.value)} />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto animate-fade-in pb-20" aria-labelledby="admin-pages-title">
      {toast ? (
        <div className={`ui-toast ${toast.type === 'error' ? 'ui-toast-error' : 'ui-toast-success'}`}>
          <div className="flex-1 font-medium">{toast.message}</div>
          <button onClick={() => setToast(null)} className="ui-btn ui-btn-ghost ui-btn-icon-sm text-white/85 hover:text-white hover:bg-black/10">x</button>
        </div>
      ) : null}

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h2 id="admin-pages-title" className="text-3xl font-black text-primary">{t.pages}</h2>
          <p className="text-muted mt-1">{L('إدارة الصفحات والمحتوى المرئي للواجهة', 'Manage storefront pages and visual content')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button onClick={fetchPages} className="ui-btn ui-btn-secondary ui-btn-sm"><RefreshCw size={14} />{t.refresh}</button>
          <button onClick={openNewPage} className="ui-btn ui-btn-primary"><Plus size={14} />{t.newPage}</button>
        </div>
      </header>

      <div className="premium-panel p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_170px_170px] gap-3">
          <div className="relative">
            <Search className={`absolute top-3.5 text-muted ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={20} />
            <input className={`ui-input ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="ui-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{L('كل الصفحات', 'All pages')}</option>
            <option value="published">{L('منشورة', 'Published')}</option>
            <option value="draft">{L('مسودة', 'Draft')}</option>
          </select>
          <select className="ui-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">{L('الأحدث', 'Newest')}</option>
            <option value="oldest">{L('الأقدم', 'Oldest')}</option>
            <option value="title_asc">{L('الاسم (أ-ي)', 'Title (A-Z)')}</option>
            <option value="title_desc">{L('الاسم (ي-أ)', 'Title (Z-A)')}</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-secondary">
          <span>{L('الإجمالي', 'Total')}: <b className="text-primary">{pageStats.total}</b></span>
          <span>{L('منشورة', 'Published')}: <b className="text-primary">{pageStats.published}</b></span>
          <span>{L('مسودات', 'Drafts')}: <b className="text-primary">{pageStats.drafts}</b></span>
        </div>
      </div>

      {loading ? <div className="text-center py-16 text-muted">{L('جاري التحميل...', 'Loading...')}</div> : null}

      {!loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visiblePages.map((page) => (
            <div key={page.id} className="premium-panel p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-black text-primary">{page.title}</h3>
                  <p className="text-xs text-muted font-mono mt-1">/{page.slug}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${isPublished(page.is_published) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isPublished(page.is_published) ? L('منشورة', 'Published') : L('مسودة', 'Draft')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted mb-4">
                <span>{L('عدد البلوكات', 'Blocks')}: <b className="text-primary">{Number(page.blocks_count || 0)}</b></span>
                <span>{new Date(page.created_at || Date.now()).toLocaleDateString(locale)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => openEditor(page.slug)} className="ui-btn ui-btn-primary ui-btn-sm"><Edit3 size={14} />{t.edit}</button>
                <a href={page.slug === 'home' ? '/' : `/${page.slug}`} target="_blank" rel="noreferrer" className="ui-btn ui-btn-secondary ui-btn-sm"><Eye size={14} />{L('معاينة', 'Preview')}</a>
                <button onClick={() => togglePublish(page)} className="ui-btn ui-btn-secondary ui-btn-sm"><Globe size={14} />{isPublished(page.is_published) ? L('إخفاء', 'Unpublish') : L('نشر', 'Publish')}</button>
                <button onClick={() => duplicatePage(page)} className="ui-btn ui-btn-secondary ui-btn-sm"><Copy size={14} />{L('نسخ', 'Duplicate')}</button>
                {page.slug !== 'home' ? (
                  <button onClick={() => deletePage(page)} className="ui-btn ui-btn-danger ui-btn-sm col-span-2"><Trash2 size={14} />{t.delete}</button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && visiblePages.length === 0 ? (
        <div className="text-center py-16 text-muted">{L('لا توجد صفحات مطابقة', 'No pages found')}</div>
      ) : null}
    </section>
  );
}
