import React from 'react';
import { Box, Copy, Edit3, Plus, Search, Trash2 } from 'lucide-react';

export default function ProductListView({
  lang,
  t,
  L,
  search,
  setSearch,
  openCreate,
  categories,
  categoryFilter,
  setCategoryFilter,
  publishFilter,
  setPublishFilter,
  stockFilter,
  setStockFilter,
  filteredProducts,
  selectedIds,
  bulkLoading,
  runBulkAction,
  bulkCategory,
  setBulkCategory,
  applyBulkCategory,
  bulkPriceCategory,
  setBulkPriceCategory,
  bulkPricePercent,
  setBulkPricePercent,
  applyBulkPriceAdjust,
  allVisibleSelected,
  toggleSelectAllVisible,
  selectedSet,
  toggleSelectOne,
  toBool,
  toNum,
  currencySymbol,
  updatePublishSingle,
  duplicateProduct,
  openEdit,
  deleteProduct,
  loading
}) {
  return (
    <section className="animate-fade-in pb-20" aria-labelledby="admin-products-title">
      <header className="premium-panel p-6 mb-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:items-end">
          <div className="xl:col-span-5 min-w-0">
            <h1 id="admin-products-title" className="text-3xl font-black text-primary">{t.products}</h1>
            <p className="text-muted mt-1">{L('إدارة المنتجات مع التكلفة والمعرض وخيارات المنتج.', 'Products manager with cost, gallery, and variants.')}</p>
          </div>
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 min-w-0">
            <div className="relative min-w-0">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-muted ${lang === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
              <input
                className={`ui-input ${lang === 'ar' ? 'pr-10' : 'pl-10'}`}
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={openCreate} className="ui-btn ui-btn-primary whitespace-nowrap">
              <Plus size={16} />
              {t.addProduct}
            </button>
          </div>
        </div>
      </header>

      <div className="premium-panel p-4 mb-4 space-y-4">
        <section className="rounded-2xl border border-subtle bg-card-soft p-3 sm:p-4">
          <h2 className="ui-field-label mb-3">{L('التصفية والنتائج', 'Filters & Results')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="ui-field-label mb-2 block">{L('القسم', 'Category')}</label>
              <select className="ui-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">{L('كل الأقسام', 'All categories')}</option>
                {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label className="ui-field-label mb-2 block">{L('النشر', 'Publishing')}</label>
              <select className="ui-select" value={publishFilter} onChange={(e) => setPublishFilter(e.target.value)}>
                <option value="all">{L('كل الحالات', 'All statuses')}</option>
                <option value="published">{L('منشور', 'Published')}</option>
                <option value="hidden">{L('مخفي', 'Hidden')}</option>
              </select>
            </div>
            <div>
              <label className="ui-field-label mb-2 block">{L('المخزون', 'Stock')}</label>
              <select className="ui-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option value="all">{L('كل المخزون', 'All stock')}</option>
                <option value="low">{L('مخزون منخفض (1-5)', 'Low stock (1-5)')}</option>
                <option value="out">{L('غير متوفر (0)', 'Out of stock (0)')}</option>
              </select>
            </div>
            <div className="rounded-xl border border-subtle bg-card px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-secondary">{L('النتائج', 'Results')}</span>
              <span className="inline-flex min-w-[44px] justify-center rounded-full px-2.5 py-1 text-sm font-black text-primary bg-card-soft border border-subtle">
                {filteredProducts.length}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-subtle bg-card-soft p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
            <h2 className="ui-field-label">{L('الإجراءات الجماعية', 'Bulk Actions')}</h2>
            <div className="text-sm text-secondary">
              {L('محدد', 'Selected')}: <span className="font-black text-primary">{selectedIds.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              <button
                className="ui-btn ui-btn-secondary ui-btn-sm"
                onClick={() => runBulkAction({ action: 'update', updates: { is_published: 1 } })}
                disabled={bulkLoading || selectedIds.length === 0}
              >
                {L('نشر المحدد', 'Publish selected')}
              </button>
              <button
                className="ui-btn ui-btn-secondary ui-btn-sm"
                onClick={() => runBulkAction({ action: 'update', updates: { is_published: 0 } })}
                disabled={bulkLoading || selectedIds.length === 0}
              >
                {L('إخفاء المحدد', 'Hide selected')}
              </button>
              <select className="ui-select" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} disabled={bulkLoading}>
                <option value="">{L('تعيين قسم للمحدد', 'Assign category')}</option>
                {categories.map((category) => <option key={`bulk-cat-${category.id}`} value={category.name}>{category.name}</option>)}
              </select>
              <button className="ui-btn ui-btn-secondary ui-btn-sm" onClick={applyBulkCategory} disabled={bulkLoading || selectedIds.length === 0}>
                {L('تطبيق القسم', 'Apply category')}
              </button>
            </div>
            <button
              className="ui-btn ui-btn-danger ui-btn-sm xl:min-w-[150px]"
              onClick={() => runBulkAction({ action: 'delete' })}
              disabled={bulkLoading || selectedIds.length === 0}
            >
              {L('حذف المحدد', 'Delete selected')}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-subtle bg-card-soft p-3 sm:p-4">
          <h2 className="ui-field-label mb-3">{L('تعديل الأسعار جماعياً', 'Bulk Price Adjust')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_140px_auto_auto] gap-2">
            <select
              className="ui-select"
              value={bulkPriceCategory}
              onChange={(e) => setBulkPriceCategory(e.target.value)}
              disabled={bulkLoading}
            >
              <option value="all">{L('كل الأقسام', 'All categories')}</option>
              {categories.map((category) => <option key={`bulk-price-cat-${category.id}`} value={category.name}>{category.name}</option>)}
            </select>
            <input
              type="number"
              min="0.1"
              step="0.1"
              className="ui-input"
              placeholder="%"
              value={bulkPricePercent}
              onChange={(e) => setBulkPricePercent(e.target.value)}
            />
            <button className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => applyBulkPriceAdjust('increase')} disabled={bulkLoading}>
              {L('رفع %', 'Increase %')}
            </button>
            <button className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => applyBulkPriceAdjust('decrease')} disabled={bulkLoading}>
              {L('خفض %', 'Decrease %')}
            </button>
          </div>
        </section>
      </div>

      <div className="table-shell overflow-x-auto">
        <table className={`w-full min-w-[860px] ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <caption className="sr-only">{L('جدول المنتجات', 'Products table')}</caption>
          <thead className="table-head text-xs font-bold text-muted uppercase">
            <tr>
              <th className="p-4 w-10">
                <input type="checkbox" className="ui-check" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
              </th>
              <th className="p-4">{t.productName}</th>
              <th className="p-4">{t.category}</th>
              <th className="p-4">{t.price}</th>
              <th className="p-4">{t.costPrice}</th>
              <th className="p-4">{t.stock}</th>
              <th className="p-4">{L('الحالة', 'Status')}</th>
              <th className="p-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((product) => {
              const rowHasVariants = toBool(product.has_variants);
              const rowStock = rowHasVariants
                ? (Array.isArray(product.variants) ? product.variants.reduce((sum, variant) => sum + Math.max(0, Math.trunc(toNum(variant.stock_quantity, 0))), 0) : 0)
                : Math.max(0, Math.trunc(toNum(product.stock_quantity, 0)));
              const isLowStock = rowStock > 0 && rowStock <= 5;
              const isOutOfStock = rowStock === 0;
              return (
                <tr key={product.id} className={`table-row ${isLowStock ? 'bg-amber-500/5' : ''} ${isOutOfStock ? 'bg-red-500/5' : ''}`}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="ui-check"
                      checked={selectedSet.has(Number(product.id))}
                      onChange={() => toggleSelectOne(product.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border border-subtle bg-card-soft overflow-hidden flex items-center justify-center">
                        {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} /> : <Box size={18} className="text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-primary truncate">{product.name}</div>
                        <div className="text-xs text-muted font-mono truncate">{product.sku || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-secondary">{product.category || '-'}</td>
                  <td className="p-4 font-semibold text-primary">{rowHasVariants ? L('خيارات متعددة', 'Variants') : `${currencySymbol}${toNum(product.base_price, 0).toFixed(2)}`}</td>
                  <td className="p-4 font-semibold text-primary">{rowHasVariants ? L('حسب الخيار', 'Per variant') : `${currencySymbol}${toNum(product.cost_price, 0).toFixed(2)}`}</td>
                  <td className="p-4 font-semibold text-primary">
                    <div className="inline-flex items-center gap-2">
                      <span>{rowStock}</span>
                      {isLowStock ? <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">{L('منخفض', 'Low')}</span> : null}
                      {isOutOfStock ? <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-red-100 text-red-700">{L('نفذ', 'Out')}</span> : null}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition ${toBool(product.is_published) ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                      onClick={() => updatePublishSingle(product.id, !toBool(product.is_published))}
                      disabled={bulkLoading}
                    >
                      {toBool(product.is_published) ? L('منشور', 'Published') : L('مخفي', 'Hidden')}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="ui-btn ui-btn-icon ui-btn-secondary" onClick={() => duplicateProduct(product)} title={L('نسخ المنتج', 'Duplicate product')}><Copy size={15} /></button>
                      <button className="ui-btn ui-btn-icon ui-btn-icon-primary" onClick={() => openEdit(product)}><Edit3 size={15} /></button>
                      <button className="ui-btn ui-btn-icon ui-btn-icon-danger" onClick={() => deleteProduct(product.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading ? <div className="p-8 text-center text-muted">{L('جاري التحميل...', 'Loading...')}</div> : null}
        {!loading && filteredProducts.length === 0 ? <div className="p-8 text-center text-muted">{L('لا توجد نتائج', 'No results')}</div> : null}
      </div>
    </section>
  );
}
