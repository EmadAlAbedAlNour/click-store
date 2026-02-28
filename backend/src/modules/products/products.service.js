import { normalizeUploadAssetUrl } from '../../utils/assetUrl.js';

const toError = (status, error, extra = {}) => ({ ok: false, status, error, ...extra });
const MAX_BATCH_PRODUCT_IDS = 200;
const toSafePriceNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const normalizeGalleryImagesValue = (value) => {
  if (!value) return value;

  const isArrayInput = Array.isArray(value);
  let parsed = [];

  if (isArrayInput) {
    parsed = value;
  } else if (typeof value === 'string') {
    try {
      const maybeParsed = JSON.parse(value);
      parsed = Array.isArray(maybeParsed) ? maybeParsed : [];
    } catch {
      return value;
    }
  } else {
    return value;
  }

  const normalized = parsed
    .map((entry) => normalizeUploadAssetUrl(entry))
    .filter((entry) => String(entry || '').trim().length > 0);

  return isArrayInput ? normalized : JSON.stringify(normalized);
};

const normalizeProductAssetUrls = (product = {}) => ({
  ...product,
  image_url: normalizeUploadAssetUrl(product?.image_url),
  hover_image_url: normalizeUploadAssetUrl(product?.hover_image_url),
  gallery_images_json: normalizeGalleryImagesValue(product?.gallery_images_json),
  gallery_images: normalizeGalleryImagesValue(product?.gallery_images)
});

const parseBatchProductIds = (idsInput, max = MAX_BATCH_PRODUCT_IDS) => {
  const raw = Array.isArray(idsInput) ? idsInput.join(',') : String(idsInput || '');
  const parts = raw.split(',').map((item) => String(item || '').trim()).filter(Boolean);
  const ids = [];
  const seen = new Set();

  for (const part of parts) {
    const parsed = Number.parseInt(part, 10);
    if (!Number.isInteger(parsed) || parsed <= 0 || seen.has(parsed)) continue;
    seen.add(parsed);
    ids.push(parsed);
    if (ids.length >= max) break;
  }

  return ids;
};

const hydrateProductsWithVariants = async (productRepository, products = []) => {
  const baseProducts = Array.isArray(products) ? products : [];
  if (baseProducts.length === 0) return [];

  const productIds = baseProducts
    .map((product) => Number(product?.id))
    .filter((id) => Number.isInteger(id) && id > 0);

  let variants = [];
  try {
    variants = await productRepository.listVariantsByProductIds(productIds);
  } catch {
    variants = [];
  }

  const variantsByProductId = new Map();
  for (const variant of variants || []) {
    const productId = Number(variant?.product_id);
    if (!Number.isInteger(productId) || productId <= 0) continue;
    if (!variantsByProductId.has(productId)) variantsByProductId.set(productId, []);
    variantsByProductId.get(productId).push(variant);
  }

  return baseProducts.map((product) => ({
    ...product,
    variants: variantsByProductId.get(Number(product.id)) || []
  }));
};

export const createProductService = ({
  productRepository,
  normalizeSeoKeywords,
  normalizeJsonField
}) => ({
  async listProducts(query, staffUser) {
    const includeUnpublished = Boolean(staffUser && query.published !== '1');
    const requestedPublished = query.published;
    if (!staffUser && requestedPublished === '0') {
      return toError(403, 'Forbidden', { sendStatus: true });
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = query.search ? `%${query.search}%` : '%';
    const category = query.category;
    const excludeId = query.exclude ? parseInt(query.exclude, 10) : null;

    const whereClauses = ['LOWER(name) LIKE LOWER(?)'];
    const params = [search];
    if (!includeUnpublished) whereClauses.push('is_published = 1');
    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }
    if (excludeId) {
      whereClauses.push('id != ?');
      params.push(excludeId);
    }
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
      const countRow = await productRepository.countProducts(whereSql, params);
      const priceBoundsRow = await productRepository.getPriceBounds(whereSql, params);
      const totalItems = Number(countRow?.count || 0);
      const totalPages = Math.ceil(totalItems / limit);

      const products = await productRepository.listProducts(whereSql, params, limit, offset);
      const fullProducts = await hydrateProductsWithVariants(productRepository, products || []);
      const normalizedProducts = fullProducts.map((product) => normalizeProductAssetUrls(product));

      return {
        ok: true,
        status: 200,
        data: {
          data: normalizedProducts,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: totalItems,
            per_page: limit,
            min_base_price: toSafePriceNumber(priceBoundsRow?.min_price),
            max_base_price: toSafePriceNumber(priceBoundsRow?.max_price)
          }
        }
      };
    } catch (error) {
      return toError(500, error.message);
    }
  },

  async listProductsBatch(query = {}, staffUser) {
    const includeUnpublished = Boolean(staffUser && query.published !== '1');
    const requestedPublished = query.published;
    if (!staffUser && requestedPublished === '0') {
      return toError(403, 'Forbidden', { sendStatus: true });
    }

    const ids = parseBatchProductIds(query.ids);
    if (ids.length === 0) {
      return { ok: true, status: 200, data: [] };
    }

    try {
      const products = await productRepository.listProductsByIds(ids, includeUnpublished);
      const fullProducts = await hydrateProductsWithVariants(productRepository, products || []);
      const normalizedProducts = fullProducts.map((product) => normalizeProductAssetUrls(product));
      const byId = new Map((normalizedProducts || []).map((product) => [Number(product.id), product]));
      const orderedProducts = ids.map((id) => byId.get(id)).filter(Boolean);
      return { ok: true, status: 200, data: orderedProducts };
    } catch (error) {
      return toError(500, error.message);
    }
  },

  async listReviews(productId, staffUser, query = {}) {
    try {
      const includeUnpublished = Boolean(staffUser) && query.published !== '1';
      const product = await productRepository.findVisibleProductById(productId, includeUnpublished);
      if (!product) return toError(404, 'Product Not Found');

      const rows = await productRepository.listReviewsByProductId(productId);
      return { ok: true, status: 200, data: rows || [] };
    } catch (error) {
      return toError(500, error.message);
    }
  },

  async createReview(productId, staffUser, payload = {}, query = {}) {
    try {
      const includeUnpublished = Boolean(staffUser) && query.published !== '1';
      const product = await productRepository.findVisibleProductById(productId, includeUnpublished);
      if (!product) return toError(404, 'Product Not Found');

      const { name, rating, title, body } = payload;
      const safeName = name && String(name).trim() ? String(name).trim() : 'Guest';
      const rate = Math.min(5, Math.max(1, parseInt(rating || 5, 10)));
      const safeTitle = title ? String(title).trim() : '';
      const safeBody = body ? String(body).trim() : '';
      if (!safeTitle && !safeBody) {
        return toError(400, 'Review content is required');
      }

      const inserted = await productRepository.createReview({
        productId,
        name: safeName,
        rating: rate,
        title: safeTitle,
        body: safeBody
      });

      return { ok: true, status: 200, data: { id: inserted.lastID, message: 'Review submitted' } };
    } catch (error) {
      return toError(500, error.message);
    }
  },

  async bulkAction(payload = {}) {
    const { action, ids, updates } = payload;
    if (action !== 'adjust_price') {
      if (!Array.isArray(ids) || ids.length === 0) {
        return toError(400, 'No product ids provided');
      }
    }

    if (action === 'delete') {
      try {
        const deleted = await productRepository.deleteProductsByIds(ids);
        return {
          ok: true,
          status: 200,
          data: { message: 'Products deleted', count: deleted.changes },
          meta: { action: 'delete', ids }
        };
      } catch (error) {
        return toError(500, error.message);
      }
    }

    if (action === 'update') {
      const allowed = new Set([
        'is_published',
        'category',
        'base_price',
        'cost_price',
        'stock_quantity',
        'seo_title',
        'seo_description',
        'seo_keywords'
      ]);
      const setParts = [];
      const values = [];
      const safeUpdates = updates || {};

      Object.keys(safeUpdates).forEach((key) => {
        if (!allowed.has(key)) return;
        let val = safeUpdates[key];
        if (key === 'is_published') val = Number(val) === 1 ? 1 : 0;
        if (key === 'seo_keywords') val = normalizeSeoKeywords(val);
        setParts.push(`${key} = ?`);
        values.push(val);
      });

      if (setParts.length === 0) {
        return toError(400, 'No valid fields to update');
      }

      try {
        const updated = await productRepository.bulkUpdateProducts(setParts, values, ids);
        return {
          ok: true,
          status: 200,
          data: { message: 'Products updated', count: updated.changes },
          meta: { action: 'update', ids, updates: safeUpdates }
        };
      } catch (error) {
        return toError(500, error.message);
      }
    }

    if (action === 'adjust_price') {
      const percent = Number(payload.percent);
      const category = payload.category;
      const useCategory = category && category !== 'all';
      if (Number.isNaN(percent) || !Number.isFinite(percent)) {
        return toError(400, 'Invalid percent');
      }
      const factor = 1 + (percent / 100);
      if (factor <= 0) return toError(400, 'Invalid percent value');

      let transactionStarted = false;
      try {
        await productRepository.beginTransaction();
        transactionStarted = true;

        await productRepository.adjustBasePrices({ factor, category: useCategory ? category : null });
        await productRepository.adjustVariantPrices({ factor, category: useCategory ? category : null });

        await productRepository.commitTransaction();
        transactionStarted = false;

        const effectiveCategory = useCategory ? category : 'all';
        return {
          ok: true,
          status: 200,
          data: { message: 'Prices adjusted', percent, category: effectiveCategory },
          meta: { action: 'adjust_price', percent, category: effectiveCategory }
        };
      } catch (error) {
        if (transactionStarted) {
          try {
            await productRepository.rollbackTransaction();
          } catch {
            // ignore rollback failures
          }
        }
        return toError(500, error.message);
      }
    }

    return toError(400, 'Invalid action');
  },

  async getProductById(productId, staffUser, query = {}) {
    try {
      const includeUnpublished = Boolean(staffUser) && query.published !== '1';
      const product = await productRepository.findVisibleProductById(productId, includeUnpublished);
      if (!product) return toError(404, 'Product Not Found');

      const variants = await productRepository.listVariantsByProductId(productId);
      return { ok: true, status: 200, data: { ...normalizeProductAssetUrls(product), variants: variants || [] } };
    } catch (error) {
      return toError(500, error.message);
    }
  },

  async createProduct(payload = {}) {
    const {
      name,
      description,
      image_url,
      hover_image_url,
      gallery_images_json,
      base_price,
      cost_price,
      sku,
      stock_quantity,
      category,
      has_variants,
      variants,
      is_published,
      specs_json,
      seo_title,
      seo_description,
      seo_keywords
    } = payload;

    const specsJson = normalizeJsonField(specs_json || payload.specs);
    const galleryJson = normalizeGalleryImagesValue(normalizeJsonField(gallery_images_json ?? payload.gallery_images, '[]'));
    const imageUrl = normalizeUploadAssetUrl(image_url);
    const hoverImageUrl = normalizeUploadAssetUrl(hover_image_url);
    const seoKeywords = normalizeSeoKeywords(seo_keywords);
    const publishValue = Number(is_published) === 1 ? 1 : 0;

    try {
      const inserted = await productRepository.insertProduct([
        name,
        description,
        imageUrl,
        hoverImageUrl,
        galleryJson,
        base_price,
        cost_price || 0,
        sku,
        stock_quantity,
        category,
        has_variants ? 1 : 0,
        publishValue,
        specsJson,
        seo_title || '',
        seo_description || '',
        seoKeywords
      ]);

      const newProductId = inserted.lastID;
      if (has_variants && Array.isArray(variants) && variants.length > 0) {
        await productRepository.insertVariants(newProductId, variants);
      }

      return {
        ok: true,
        status: 200,
        data: { id: newProductId, message: 'Product created successfully' },
        meta: { productId: newProductId, name }
      };
    } catch (error) {
      return toError(500, error.message);
    }
  },

  async updateProduct(productId, payload = {}) {
    const {
      name,
      description,
      image_url,
      hover_image_url,
      gallery_images_json,
      base_price,
      cost_price,
      sku,
      stock_quantity,
      category,
      has_variants,
      variants,
      is_published,
      specs_json,
      seo_title,
      seo_description,
      seo_keywords
    } = payload;

    const specsJson = normalizeJsonField(specs_json || payload.specs);
    const galleryJson = normalizeGalleryImagesValue(normalizeJsonField(gallery_images_json ?? payload.gallery_images, '[]'));
    const imageUrl = normalizeUploadAssetUrl(image_url);
    const hoverImageUrl = normalizeUploadAssetUrl(hover_image_url);
    const seoKeywords = normalizeSeoKeywords(seo_keywords);
    const publishValue = Number(is_published) === 1 ? 1 : 0;

    let transactionStarted = false;
    try {
      await productRepository.beginTransaction();
      transactionStarted = true;

      const updated = await productRepository.updateProductById(productId, [
        name,
        description,
        imageUrl,
        hoverImageUrl,
        galleryJson,
        base_price,
        cost_price || 0,
        sku,
        stock_quantity,
        category,
        has_variants ? 1 : 0,
        publishValue,
        specsJson,
        seo_title || '',
        seo_description || '',
        seoKeywords
      ]);

      if (updated.changes === 0) {
        await productRepository.rollbackTransaction();
        return toError(404, 'Product not found');
      }

      await productRepository.deleteVariantsByProductId(productId);
      const incomingVariants = has_variants && Array.isArray(variants) ? variants : [];
      if (incomingVariants.length > 0) {
        await productRepository.insertVariants(productId, incomingVariants);
      }

      await productRepository.commitTransaction();
      transactionStarted = false;

      return {
        ok: true,
        status: 200,
        data: { message: 'Product updated successfully' },
        meta: { productId, name }
      };
    } catch (error) {
      if (transactionStarted) {
        try {
          await productRepository.rollbackTransaction();
        } catch {
          // ignore rollback failures
        }
      }
      return toError(500, error.message);
    }
  },

  async deleteProduct(productId) {
    try {
      await productRepository.deleteProductById(productId);
      return {
        ok: true,
        status: 200,
        data: { message: 'Product deleted' },
        meta: { productId }
      };
    } catch (error) {
      return toError(500, error.message);
    }
  }
});
