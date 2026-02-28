const errorResult = (status, error) => ({ ok: false, status, error });

export const createPageService = ({ pageRepository, normalizeJsonField }) => ({
  async listPages(staffUser) {
    try {
      const rows = await pageRepository.listPages(Boolean(staffUser));
      return { ok: true, status: 200, data: rows };
    } catch (error) {
      return errorResult(500, error.message);
    }
  },

  async getPageBySlug(slug, staffUser) {
    try {
      const page = await pageRepository.findPageBySlug(slug, Boolean(staffUser));
      if (!page) return errorResult(404, 'Page not found');

      const blocks = await pageRepository.listBlocksByPageId(page.id);
      const parsedBlocks = (blocks || []).map((block) => {
        let parsedContent = {};
        try {
          parsedContent = JSON.parse(block.content || '{}');
        } catch {
          parsedContent = {};
        }
        return {
          ...block,
          content: parsedContent
        };
      });

      return { ok: true, status: 200, data: { ...page, blocks: parsedBlocks } };
    } catch (error) {
      return errorResult(500, error.message);
    }
  },

  async savePage(payload = {}) {
    const title = String(payload?.title || '').trim();
    const slug = String(payload?.slug || '').trim();
    const incomingBlocks = Array.isArray(payload?.blocks) ? payload.blocks : [];
    const publishInput = payload?.is_published;
    const safePublish = Number(publishInput) === 1 || publishInput === true ? 1 : 0;

    if (!title) return errorResult(400, 'Page title is required');
    if (!slug) return errorResult(400, 'Page slug is required');

    let transactionStarted = false;
    try {
      const existingPage = await pageRepository.findAnyPageBySlug(slug);
      await pageRepository.beginTransaction();
      transactionStarted = true;

      let pageId;
      if (existingPage) {
        const updated = await pageRepository.updatePageById(existingPage.id, {
          title,
          is_published: safePublish
        });
        if (updated.changes === 0) {
          await pageRepository.rollbackTransaction();
          return errorResult(404, 'Page not found');
        }
        pageId = existingPage.id;
      } else {
        const inserted = await pageRepository.insertPage({ title, slug, is_published: safePublish });
        pageId = inserted.lastID;
      }

      await pageRepository.deleteBlocksByPageId(pageId);
      for (let idx = 0; idx < incomingBlocks.length; idx += 1) {
        const block = incomingBlocks[idx] || {};
        const blockType = String(block.type || '').trim() || 'text';
        const blockContent = normalizeJsonField(block.content, '{}');
        await pageRepository.insertBlock({
          page_id: pageId,
          type: blockType,
          content: blockContent,
          sort_order: idx
        });
      }

      await pageRepository.commitTransaction();
      transactionStarted = false;

      return {
        ok: true,
        status: 200,
        data: { message: 'Page saved successfully' },
        meta: {
          action: existingPage ? 'update' : 'create',
          pageId,
          slug,
          title,
          blocks: incomingBlocks.length,
          is_published: safePublish
        }
      };
    } catch (error) {
      if (transactionStarted) {
        try {
          await pageRepository.rollbackTransaction();
        } catch {
          // ignore rollback failure
        }
      }
      return errorResult(500, error.message);
    }
  },

  async setPublishState(pageIdInput, payload = {}) {
    const pageId = Number(pageIdInput);
    if (!Number.isFinite(pageId) || pageId <= 0) {
      return errorResult(400, 'Invalid page id');
    }

    const publishInput = payload?.is_published;
    const safePublish = Number(publishInput) === 1 || publishInput === true ? 1 : 0;

    try {
      const updated = await pageRepository.updatePublishById(pageId, safePublish);
      if (updated.changes === 0) return errorResult(404, 'Page not found');

      return {
        ok: true,
        status: 200,
        data: { message: 'Page publish state updated' },
        meta: { pageId, is_published: safePublish }
      };
    } catch (error) {
      return errorResult(500, error.message);
    }
  },

  async deletePage(slugInput) {
    const slug = String(slugInput || '').trim();
    if (!slug) return errorResult(400, 'Page slug is required');
    if (slug === 'home') return errorResult(400, 'Home page cannot be deleted');

    try {
      const page = await pageRepository.findAnyPageBySlug(slug);
      if (!page) return errorResult(404, 'Page not found');

      const deleted = await pageRepository.deletePageById(page.id);
      if (deleted.changes === 0) return errorResult(404, 'Page not found');

      return {
        ok: true,
        status: 200,
        data: { message: 'Page deleted successfully' },
        meta: { pageId: page.id, slug }
      };
    } catch (error) {
      return errorResult(500, error.message);
    }
  }
});
