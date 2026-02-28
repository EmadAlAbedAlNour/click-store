import React from 'react';
import { Image as ImageIcon, Plus, Save, Trash2 } from 'lucide-react';

export default function ProductFormView({
  lang,
  t,
  L,
  form,
  categories,
  activeTab,
  setActiveTab,
  hasVariants,
  saving,
  setView,
  saveProduct,
  setField,
  addVariant,
  updateVariant,
  removeVariant,
  addSpec,
  updateSpec,
  removeSpec,
  galleryLink,
  setGalleryLink,
  addGalleryImage,
  removeGalleryImage,
  setMediaTarget,
  setShowMedia
}) {
  return (
    <section className="max-w-7xl mx-auto animate-fade-in pb-20" aria-labelledby="admin-product-form-title">
      <header className="premium-panel p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 id="admin-product-form-title" className="text-3xl font-black text-primary">{form.id ? L('تعديل منتج', 'Edit Product') : t.addProduct}</h2>
          <p className="text-muted mt-1">{L('إدارة متقدمة للصور والتكلفة والمواصفات.', 'Advanced media, cost, and specs management.')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setView('list')} className="ui-btn ui-btn-secondary">{t.cancel}</button>
          <button onClick={saveProduct} disabled={saving} className="ui-btn ui-btn-primary">
            <Save size={16} />
            {saving ? t.saving : t.save}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <nav className="lg:col-span-3" aria-label={L('تبويبات المنتج', 'Product tabs')}>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {[
              { id: 'basic', label: L('أساسي', 'Basic') },
              { id: 'pricing', label: L('الأسعار والمخزون', 'Pricing & Stock') },
              { id: 'media', label: L('الصور والمعرض', 'Media & Gallery') },
              { id: 'content', label: L('المواصفات و SEO', 'Specs & SEO') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 min-w-[170px] lg:min-w-0 lg:w-full text-start rounded-2xl px-4 py-3 border transition ${activeTab === tab.id ? 'bg-primary/10 border-primary/40 text-primary shadow-soft' : 'bg-card border-subtle text-secondary hover:bg-card-soft'}`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="font-bold">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="lg:col-span-9 premium-panel p-5 sm:p-6 space-y-6">
          {activeTab === 'basic' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="ui-field-label">{t.productName}</label>
                  <input className="ui-input" value={form.name} onChange={(e) => setField('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="ui-field-label">{t.category}</label>
                  <select className="ui-select" value={form.category} onChange={(e) => setField('category', e.target.value)}>
                    <option value="">{L('اختر القسم', 'Select category')}</option>
                    {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="ui-field-label">{t.description}</label>
                <textarea className="ui-textarea h-32" value={form.description} onChange={(e) => setField('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="ui-field-label">{t.sku}</label>
                  <input className="ui-input" value={form.sku} onChange={(e) => setField('sku', e.target.value)} />
                </div>
                <label className="inline-flex items-center gap-3 rounded-xl border border-subtle bg-card-soft px-4 py-3 mt-6">
                  <input type="checkbox" className="ui-check" checked={Number(form.is_published) === 1} onChange={(e) => setField('is_published', e.target.checked ? 1 : 0)} />
                  <span className="font-semibold text-primary">{L('منشور', 'Published')}</span>
                </label>
              </div>
            </div>
          ) : null}

          {activeTab === 'pricing' ? (
            <div className="space-y-4">
              <label className="inline-flex items-center gap-3 rounded-xl border border-subtle bg-card-soft px-4 py-3">
                <input type="checkbox" className="ui-check" checked={hasVariants} onChange={(e) => setField('has_variants', e.target.checked)} />
                <span className="font-semibold text-primary">{t.hasVariants}</span>
              </label>

              {!hasVariants ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><label className="ui-field-label">{t.basePrice}</label><input type="number" className="ui-input" value={form.base_price} onChange={(e) => setField('base_price', e.target.value)} /></div>
                  <div className="space-y-2"><label className="ui-field-label">{t.costPrice}</label><input type="number" className="ui-input" value={form.cost_price} onChange={(e) => setField('cost_price', e.target.value)} /></div>
                  <div className="space-y-2"><label className="ui-field-label">{t.stock}</label><input type="number" className="ui-input" value={form.stock_quantity} onChange={(e) => setField('stock_quantity', e.target.value)} /></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-primary">{L('قائمة الخيارات', 'Variants')}</h3>
                    <button onClick={addVariant} className="ui-btn ui-btn-secondary ui-btn-sm"><Plus size={14} />{t.addVariant}</button>
                  </div>
                  {form.variants.map((variant, index) => (
                    <div key={`${index}-${variant.id || 'new'}`} className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-xl border border-subtle bg-card p-3">
                      <input className="ui-input" placeholder={t.variantName} value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} />
                      <input className="ui-input" placeholder={t.sku} value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} />
                      <input type="number" className="ui-input" placeholder={t.price} value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} />
                      <input type="number" className="ui-input" placeholder={t.costPrice} value={variant.cost_price} onChange={(e) => updateVariant(index, 'cost_price', e.target.value)} />
                      <div className="flex gap-2">
                        <input type="number" className="ui-input" placeholder={t.stock} value={variant.stock_quantity} onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)} />
                        <button onClick={() => removeVariant(index)} className="ui-btn ui-btn-icon ui-btn-icon-danger"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {form.variants.length === 0 ? <div className="text-sm text-muted rounded-xl border border-dashed border-subtle p-4 text-center">{L('لا توجد خيارات.', 'No variants yet.')}</div> : null}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'media' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="relative aspect-video rounded-2xl border-2 border-dashed border-subtle bg-card-soft overflow-hidden hover:border-primary/50 transition" onClick={() => { setMediaTarget({ type: 'field', key: 'image_url' }); setShowMedia(true); }}>
                  {form.image_url ? <img src={form.image_url} alt="main" className="w-full h-full object-cover" /> : <div className="h-full flex flex-col items-center justify-center text-muted"><ImageIcon size={34} /><span>{t.mainImage}</span></div>}
                </button>
                <button className="relative aspect-video rounded-2xl border-2 border-dashed border-subtle bg-card-soft overflow-hidden hover:border-primary/50 transition" onClick={() => { setMediaTarget({ type: 'field', key: 'hover_image_url' }); setShowMedia(true); }}>
                  {form.hover_image_url ? <img src={form.hover_image_url} alt="hover" className="w-full h-full object-cover" /> : <div className="h-full flex flex-col items-center justify-center text-muted"><ImageIcon size={34} /><span>{t.hoverImage}</span></div>}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="ui-input"
                  placeholder={L('رابط الصورة الرئيسية', 'Main image URL')}
                  value={form.image_url}
                  onChange={(e) => setField('image_url', e.target.value)}
                />
                <input
                  className="ui-input"
                  placeholder={L('رابط صورة التمرير', 'Hover image URL')}
                  value={form.hover_image_url}
                  onChange={(e) => setField('hover_image_url', e.target.value)}
                />
              </div>

              <div className="rounded-2xl border border-subtle bg-card p-4">
                <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between mb-3">
                  <h3 className="font-black text-primary">{L('معرض الصور', 'Gallery')}</h3>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input className="ui-input w-full" placeholder={L('رابط صورة https://...', 'Image URL https://...')} value={galleryLink} onChange={(e) => setGalleryLink(e.target.value)} />
                    <button onClick={() => { addGalleryImage(galleryLink); setGalleryLink(''); }} className="ui-btn ui-btn-secondary ui-btn-sm">{L('إضافة', 'Add')}</button>
                    <button onClick={() => { setMediaTarget({ type: 'gallery' }); setShowMedia(true); }} className="ui-btn ui-btn-secondary ui-btn-sm">{L('من الوسائط', 'Media')}</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {form.gallery_images.map((img, index) => (
                    <div key={`${img}-${index}`} className="relative rounded-xl border border-subtle bg-card-soft overflow-hidden aspect-square group">
                      <img src={img} className="w-full h-full object-cover" alt={`gallery-${index}`} />
                      <button onClick={() => removeGalleryImage(index)} className={`absolute top-1 ${lang === 'ar' ? 'left-1' : 'right-1'} ui-btn ui-btn-icon ui-btn-icon-danger opacity-0 group-hover:opacity-100 transition`}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
                {form.gallery_images.length === 0 ? <div className="text-sm text-muted rounded-xl border border-dashed border-subtle p-4 text-center mt-3">{L('لا توجد صور في المعرض.', 'No gallery images.')}</div> : null}
              </div>
            </div>
          ) : null}

          {activeTab === 'content' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-subtle bg-card p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-primary">{t.specs}</h3>
                  <button onClick={addSpec} className="ui-btn ui-btn-secondary ui-btn-sm"><Plus size={14} />{t.addSpec}</button>
                </div>
                <div className="space-y-2">
                  {form.specs.map((spec, index) => (
                    <div key={`spec-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input className="ui-input" placeholder={L('العنوان', 'Label')} value={spec.label} onChange={(e) => updateSpec(index, 'label', e.target.value)} />
                      <div className="flex gap-2">
                        <input className="ui-input" placeholder={L('القيمة', 'Value')} value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} />
                        <button onClick={() => removeSpec(index)} className="ui-btn ui-btn-icon ui-btn-icon-danger"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-subtle bg-card p-4 space-y-3">
                <h3 className="font-black text-primary">SEO</h3>
                <input className="ui-input" placeholder={t.seoTitle} value={form.seo_title} onChange={(e) => setField('seo_title', e.target.value)} />
                <textarea className="ui-textarea h-24" placeholder={t.seoDesc} value={form.seo_description} onChange={(e) => setField('seo_description', e.target.value)} />
                <input className="ui-input" placeholder={t.seoKeywords} value={form.seo_keywords} onChange={(e) => setField('seo_keywords', e.target.value)} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
