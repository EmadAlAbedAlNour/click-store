import { normalizeUploadAssetUrl } from '../../utils/assetUrl.js';

const normalizeCategoryAssetUrls = (category = {}) => ({
  ...category,
  image_url: normalizeUploadAssetUrl(category?.image_url)
});

export const createCategoryService = ({ categoryRepository }) => ({
  async listCategories() {
    try {
      const rows = await categoryRepository.listCategories();
      return { ok: true, status: 200, data: (rows || []).map((row) => normalizeCategoryAssetUrls(row)) };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async createCategory(payload = {}) {
    const safeName = String(payload?.name || '').trim();
    const safeImageUrl = normalizeUploadAssetUrl(payload?.image_url);
    const safeDescription = String(payload?.description || '').trim();

    if (!safeName) {
      return { ok: false, status: 400, error: 'Category name is required' };
    }

    try {
      const created = await categoryRepository.createCategory({
        name: safeName,
        image_url: safeImageUrl,
        description: safeDescription
      });
      return {
        ok: true,
        status: 200,
        data: { id: created.lastID, message: 'Category created' },
        meta: { categoryId: created.lastID, name: safeName }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async updateCategory(categoryIdInput, payload = {}) {
    const categoryId = Number(categoryIdInput);
    const safeName = String(payload.name || '').trim();

    if (!safeName) {
      return { ok: false, status: 400, error: 'Category name is required' };
    }

    try {
      const updated = await categoryRepository.updateCategory({
        categoryId,
        name: safeName,
        image_url: normalizeUploadAssetUrl(payload?.image_url),
        description: payload.description || ''
      });

      if (updated.changes === 0) {
        return { ok: false, status: 404, error: 'Category not found' };
      }

      return {
        ok: true,
        status: 200,
        data: { message: 'Category updated' },
        meta: { categoryId, name: safeName }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async deleteCategory(categoryIdInput) {
    try {
      await categoryRepository.deleteCategory(categoryIdInput);
      return {
        ok: true,
        status: 200,
        data: { message: 'Category deleted' },
        meta: { categoryId: categoryIdInput }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  }
});
