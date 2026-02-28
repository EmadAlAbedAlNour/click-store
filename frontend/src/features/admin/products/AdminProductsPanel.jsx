import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../app/config';
import { staffAuthConfig } from '../../../shared/api/authConfig';
import ProductFormView from './components/ProductFormView';
import ProductListView from './components/ProductListView';
import Toast from './components/Toast';
import { createEmptyProduct, parseJsonArray, toBool, toNum } from './components/helpers';

export default function AdminProductsPanel({ lang = 'ar', t, MediaPicker }) {
  const L = (ar, en) => (lang === 'ar' ? ar : en);
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publishFilter, setPublishFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [view, setView] = useState('list');
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPricePercent, setBulkPricePercent] = useState('');
  const [bulkPriceCategory, setBulkPriceCategory] = useState('all');
  const [showMedia, setShowMedia] = useState(false);
  const [mediaTarget, setMediaTarget] = useState({ type: 'field', key: 'image_url' });
  const [galleryLink, setGalleryLink] = useState('');
  const [form, setForm] = useState(createEmptyProduct);

  const pushToast = useCallback((message, type = 'success') => {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const mapProductToForm = useCallback((product = {}) => {
    const basePrice = toNum(product.base_price, 0);
    const baseCost = toNum(product.cost_price, 0);
    return {
      id: product.id || null,
      name: String(product.name || ''),
      description: String(product.description || ''),
      category: String(product.category || ''),
      sku: String(product.sku || ''),
      image_url: String(product.image_url || ''),
      hover_image_url: String(product.hover_image_url || ''),
      gallery_images: parseJsonArray(product.gallery_images_json || product.gallery_images).filter(Boolean),
      base_price: basePrice,
      cost_price: baseCost,
      stock_quantity: Math.max(0, Math.trunc(toNum(product.stock_quantity, 0))),
      has_variants: toBool(product.has_variants),
      variants: (Array.isArray(product.variants) ? product.variants : []).map((variant) => ({
        id: variant.id || null,
        name: String(variant.name || ''),
        sku: String(variant.sku || ''),
        price: Math.max(0, toNum(variant.price, basePrice)),
        cost_price: Math.max(0, toNum(variant.cost_price, baseCost)),
        stock_quantity: Math.max(0, Math.trunc(toNum(variant.stock_quantity, 0)))
      })),
      specs: parseJsonArray(product.specs_json || product.specs)
        .map((row) => ({ label: String(row?.label || row?.key || ''), value: String(row?.value || '') }))
        .filter((row) => row.label || row.value),
      seo_title: String(product.seo_title || ''),
      seo_description: String(product.seo_description || ''),
      seo_keywords: String(product.seo_keywords || ''),
      is_published: toBool(product.is_published) ? 1 : 0
    };
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_URL}/products?limit=1000`)
      .then((res) => setProducts(Array.isArray(res?.data?.data) ? res.data.data : []))
      .catch(() => pushToast(t.error, 'error'))
      .finally(() => setLoading(false));
  }, [pushToast, t.error]);

  const fetchMeta = useCallback(() => {
    Promise.all([
      axios.get(`${API_URL}/categories`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/settings`).catch(() => ({ data: {} }))
    ]).then(([categoryRes, settingsRes]) => {
      setCategories(Array.isArray(categoryRes?.data) ? categoryRes.data : []);
      const symbol = String(settingsRes?.data?.currency_symbol || '$').trim();
      setCurrencySymbol(symbol || '$');
    });
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchMeta();
  }, [fetchMeta, fetchProducts]);

  const resetForm = () => {
    setForm(createEmptyProduct());
    setActiveTab('basic');
    setGalleryLink('');
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (product) => {
    setForm(mapProductToForm(product));
    setActiveTab('basic');
    setGalleryLink('');
    setView('form');
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...(Array.isArray(prev.variants) ? prev.variants : []),
        { id: null, name: '', sku: '', price: toNum(prev.base_price, 0), cost_price: toNum(prev.cost_price, 0), stock_quantity: 0 }
      ]
    }));
  };

  const updateVariant = (index, key, value) => {
    setForm((prev) => {
      const variants = [...(Array.isArray(prev.variants) ? prev.variants : [])];
      if (!variants[index]) return prev;
      variants[index] = { ...variants[index], [key]: value };
      return { ...prev, variants };
    });
  };

  const removeVariant = (index) => {
    setForm((prev) => {
      const variants = [...(Array.isArray(prev.variants) ? prev.variants : [])];
      variants.splice(index, 1);
      return { ...prev, variants };
    });
  };

  const addSpec = () => setForm((prev) => ({ ...prev, specs: [...(Array.isArray(prev.specs) ? prev.specs : []), { label: '', value: '' }] }));

  const updateSpec = (index, key, value) => {
    setForm((prev) => {
      const specs = [...(Array.isArray(prev.specs) ? prev.specs : [])];
      if (!specs[index]) return prev;
      specs[index] = { ...specs[index], [key]: value };
      return { ...prev, specs };
    });
  };

  const removeSpec = (index) => {
    setForm((prev) => {
      const specs = [...(Array.isArray(prev.specs) ? prev.specs : [])];
      specs.splice(index, 1);
      return { ...prev, specs };
    });
  };

  const addGalleryImage = (url) => {
    const normalized = String(url || '').trim();
    if (!normalized) return;
    setForm((prev) => {
      const current = Array.isArray(prev.gallery_images) ? prev.gallery_images : [];
      if (current.includes(normalized)) return prev;
      return { ...prev, gallery_images: [...current, normalized] };
    });
  };

  const removeGalleryImage = (index) => {
    setForm((prev) => {
      const next = [...(Array.isArray(prev.gallery_images) ? prev.gallery_images : [])];
      next.splice(index, 1);
      return { ...prev, gallery_images: next };
    });
  };

  const handleMediaSelect = (media) => {
    const url = String(media?.url || '').trim();
    if (!url) return;
    if (mediaTarget.type === 'gallery') {
      addGalleryImage(url);
      return;
    }
    setField(mediaTarget.key, url);
  };

  const buildPayload = () => {
    const hasVariants = toBool(form.has_variants);
    const variants = (Array.isArray(form.variants) ? form.variants : [])
      .map((variant) => ({
        name: String(variant.name || '').trim(),
        sku: String(variant.sku || '').trim(),
        price: Math.max(0, toNum(variant.price, 0)),
        cost_price: Math.max(0, toNum(variant.cost_price, 0)),
        stock_quantity: Math.max(0, Math.trunc(toNum(variant.stock_quantity, 0)))
      }))
      .filter((variant) => variant.name);
    const specs = (Array.isArray(form.specs) ? form.specs : [])
      .map((spec) => ({ label: String(spec.label || '').trim(), value: String(spec.value || '').trim() }))
      .filter((spec) => spec.label || spec.value);
    const gallery = Array.from(new Set((Array.isArray(form.gallery_images) ? form.gallery_images : []).map((img) => String(img || '').trim()).filter(Boolean)));

    return {
      name: String(form.name || '').trim(),
      description: String(form.description || '').trim(),
      category: String(form.category || '').trim(),
      sku: String(form.sku || '').trim(),
      image_url: String(form.image_url || '').trim(),
      hover_image_url: String(form.hover_image_url || '').trim(),
      gallery_images_json: JSON.stringify(gallery),
      base_price: Math.max(0, toNum(form.base_price, 0)),
      cost_price: Math.max(0, toNum(form.cost_price, 0)),
      stock_quantity: hasVariants
        ? variants.reduce((sum, variant) => sum + Number(variant.stock_quantity || 0), 0)
        : Math.max(0, Math.trunc(toNum(form.stock_quantity, 0))),
      has_variants: hasVariants ? 1 : 0,
      variants: hasVariants ? variants : [],
      specs_json: JSON.stringify(specs),
      seo_title: String(form.seo_title || '').trim(),
      seo_description: String(form.seo_description || '').trim(),
      seo_keywords: String(form.seo_keywords || '').trim(),
      is_published: toBool(form.is_published) ? 1 : 0
    };
  };

  const saveProduct = async () => {
    const payload = buildPayload();
    if (!payload.name) {
      pushToast(L('اسم المنتج مطلوب', 'Product name is required'), 'error');
      return;
    }
    if (payload.has_variants && payload.variants.length === 0) {
      pushToast(L('أضف خياراً واحداً على الأقل', 'Add at least one variant'), 'error');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await axios.put(`${API_URL}/products/${form.id}`, payload, {
          ...staffAuthConfig
        });
      } else {
        await axios.post(`${API_URL}/products`, payload, {
          ...staffAuthConfig
        });
      }
      pushToast(t.success, 'success');
      setView('list');
      fetchProducts();
    } catch {
      pushToast(t.error, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        ...staffAuthConfig
      });
      pushToast(t.success, 'success');
      fetchProducts();
    } catch {
      pushToast(t.error, 'error');
    }
  };

  const filteredProducts = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    return products.filter((product) => {
      const rowHasVariants = toBool(product.has_variants);
      const rowStock = rowHasVariants
        ? (Array.isArray(product.variants) ? product.variants.reduce((sum, variant) => sum + Math.max(0, Math.trunc(toNum(variant.stock_quantity, 0))), 0) : 0)
        : Math.max(0, Math.trunc(toNum(product.stock_quantity, 0)));

      const matchesSearch = !q || `${product?.name || ''} ${product?.sku || ''} ${product?.category || ''}`.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' ? true : String(product?.category || '') === categoryFilter;
      const matchesPublish = publishFilter === 'all'
        ? true
        : (publishFilter === 'published' ? toBool(product.is_published) : !toBool(product.is_published));
      const matchesStock = stockFilter === 'all'
        ? true
        : (stockFilter === 'low' ? rowStock > 0 && rowStock <= 5 : rowStock === 0);
      return matchesSearch && matchesCategory && matchesPublish && matchesStock;
    });
  }, [products, search, categoryFilter, publishFilter, stockFilter]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filteredProducts.some((p) => Number(p.id) === Number(id))));
  }, [filteredProducts]);

  const selectedSet = useMemo(() => new Set(selectedIds.map((id) => Number(id))), [selectedIds]);
  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedSet.has(Number(p.id)));

  const toggleSelectOne = (id) => {
    const numericId = Number(id);
    setSelectedIds((prev) => (
      prev.includes(numericId) ? prev.filter((item) => item !== numericId) : [...prev, numericId]
    ));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredProducts.some((p) => Number(p.id) === Number(id))));
      return;
    }
    setSelectedIds((prev) => {
      const merged = new Set(prev.map((id) => Number(id)));
      filteredProducts.forEach((p) => merged.add(Number(p.id)));
      return Array.from(merged);
    });
  };

  const runBulkAction = async ({ action, updates = null }) => {
    if (selectedIds.length === 0) {
      pushToast(L('اختر منتجات أولاً', 'Select products first'), 'error');
      return;
    }
    setBulkLoading(true);
    try {
      await axios.post(
        `${API_URL}/products/bulk`,
        { action, ids: selectedIds, updates },
        { ...staffAuthConfig }
      );
      pushToast(t.success, 'success');
      setSelectedIds([]);
      fetchProducts();
    } catch {
      pushToast(t.error, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const applyBulkCategory = () => {
    if (!bulkCategory) {
      pushToast(L('اختر قسماً أولاً', 'Select a category first'), 'error');
      return;
    }
    runBulkAction({ action: 'update', updates: { category: bulkCategory } });
  };

  const applyBulkPriceAdjust = async (direction) => {
    const rawPercent = Number(bulkPricePercent);
    if (!Number.isFinite(rawPercent) || rawPercent <= 0) {
      pushToast(L('أدخل نسبة صحيحة أكبر من صفر', 'Enter a valid percent greater than zero'), 'error');
      return;
    }
    const signedPercent = direction === 'decrease' ? -Math.abs(rawPercent) : Math.abs(rawPercent);
    setBulkLoading(true);
    try {
      await axios.post(
        `${API_URL}/products/bulk`,
        { action: 'adjust_price', percent: signedPercent, category: bulkPriceCategory || 'all' },
        { ...staffAuthConfig }
      );
      pushToast(L('تم تعديل الأسعار بنجاح', 'Prices adjusted successfully'), 'success');
      fetchProducts();
    } catch {
      pushToast(t.error, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const duplicateProduct = async (product) => {
    const mapped = mapProductToForm(product);
    const hasVariants = toBool(mapped.has_variants);
    const variants = (mapped.variants || []).map((variant) => ({
      name: String(variant.name || '').trim(),
      sku: String(variant.sku || '').trim(),
      price: Math.max(0, Number(variant.price || 0)),
      cost_price: Math.max(0, Number(variant.cost_price || 0)),
      stock_quantity: Math.max(0, Math.trunc(Number(variant.stock_quantity || 0)))
    }));
    const payload = {
      name: `${mapped.name} ${L('(نسخة)', '(Copy)')}`,
      description: mapped.description || '',
      category: mapped.category || '',
      sku: mapped.sku ? `${mapped.sku}-COPY` : '',
      image_url: mapped.image_url || '',
      hover_image_url: mapped.hover_image_url || '',
      gallery_images_json: JSON.stringify(mapped.gallery_images || []),
      base_price: Math.max(0, Number(mapped.base_price || 0)),
      cost_price: Math.max(0, Number(mapped.cost_price || 0)),
      stock_quantity: hasVariants
        ? variants.reduce((sum, variant) => sum + Number(variant.stock_quantity || 0), 0)
        : Math.max(0, Number(mapped.stock_quantity || 0)),
      has_variants: hasVariants ? 1 : 0,
      variants: hasVariants ? variants : [],
      specs_json: JSON.stringify(mapped.specs || []),
      seo_title: mapped.seo_title || '',
      seo_description: mapped.seo_description || '',
      seo_keywords: mapped.seo_keywords || '',
      is_published: toBool(mapped.is_published) ? 1 : 0
    };

    try {
      await axios.post(`${API_URL}/products`, payload, {
        ...staffAuthConfig
      });
      pushToast(L('تم نسخ المنتج بنجاح', 'Product duplicated successfully'), 'success');
      fetchProducts();
    } catch {
      pushToast(t.error, 'error');
    }
  };

  const updatePublishSingle = async (productId, isPublished) => {
    setBulkLoading(true);
    try {
      await axios.post(
        `${API_URL}/products/bulk`,
        { action: 'update', ids: [Number(productId)], updates: { is_published: isPublished ? 1 : 0 } },
        { ...staffAuthConfig }
      );
      pushToast(t.success, 'success');
      fetchProducts();
    } catch {
      pushToast(t.error, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const hasVariants = toBool(form.has_variants);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showMedia && MediaPicker ? (
        <MediaPicker
          onClose={() => setShowMedia(false)}
          onSelect={(media) => {
            handleMediaSelect(media);
            setShowMedia(false);
          }}
          lang={lang}
        />
      ) : null}

      {view === 'form' ? (
        <ProductFormView
          lang={lang}
          t={t}
          L={L}
          form={form}
          categories={categories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasVariants={hasVariants}
          saving={saving}
          setView={setView}
          saveProduct={saveProduct}
          setField={setField}
          addVariant={addVariant}
          updateVariant={updateVariant}
          removeVariant={removeVariant}
          addSpec={addSpec}
          updateSpec={updateSpec}
          removeSpec={removeSpec}
          galleryLink={galleryLink}
          setGalleryLink={setGalleryLink}
          addGalleryImage={addGalleryImage}
          removeGalleryImage={removeGalleryImage}
          setMediaTarget={setMediaTarget}
          setShowMedia={setShowMedia}
        />
      ) : (
        <ProductListView
          lang={lang}
          t={t}
          L={L}
          search={search}
          setSearch={setSearch}
          openCreate={openCreate}
          categories={categories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          publishFilter={publishFilter}
          setPublishFilter={setPublishFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          filteredProducts={filteredProducts}
          selectedIds={selectedIds}
          bulkLoading={bulkLoading}
          runBulkAction={runBulkAction}
          bulkCategory={bulkCategory}
          setBulkCategory={setBulkCategory}
          applyBulkCategory={applyBulkCategory}
          bulkPriceCategory={bulkPriceCategory}
          setBulkPriceCategory={setBulkPriceCategory}
          bulkPricePercent={bulkPricePercent}
          setBulkPricePercent={setBulkPricePercent}
          applyBulkPriceAdjust={applyBulkPriceAdjust}
          allVisibleSelected={allVisibleSelected}
          toggleSelectAllVisible={toggleSelectAllVisible}
          selectedSet={selectedSet}
          toggleSelectOne={toggleSelectOne}
          toBool={toBool}
          toNum={toNum}
          currencySymbol={currencySymbol}
          updatePublishSingle={updatePublishSingle}
          duplicateProduct={duplicateProduct}
          openEdit={openEdit}
          deleteProduct={deleteProduct}
          loading={loading}
        />
      )}
    </>
  );
}
