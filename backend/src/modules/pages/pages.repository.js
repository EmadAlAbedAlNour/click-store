export const createPageRepository = (dbClient) => ({
  listPages(includeUnpublished) {
    const whereClause = includeUnpublished ? '' : 'WHERE p.is_published = 1';
    const sql = `
      SELECT
        p.id,
        p.title,
        p.slug,
        p.is_published,
        p.created_at,
        COUNT(pb.id) AS blocks_count
      FROM pages p
      LEFT JOIN page_blocks pb ON pb.page_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.id ASC
    `;
    return dbClient.all(sql);
  },

  findPageBySlug(slug, includeUnpublished) {
    const sql = includeUnpublished
      ? 'SELECT * FROM pages WHERE slug = ?'
      : 'SELECT * FROM pages WHERE slug = ? AND is_published = 1';
    return dbClient.get(sql, [slug]);
  },

  findAnyPageBySlug(slug) {
    return dbClient.get('SELECT id, slug FROM pages WHERE slug = ?', [slug]);
  },

  listBlocksByPageId(pageId) {
    return dbClient.all('SELECT * FROM page_blocks WHERE page_id = ? ORDER BY sort_order ASC', [pageId]);
  },

  beginTransaction() {
    return dbClient.run('BEGIN TRANSACTION');
  },

  commitTransaction() {
    return dbClient.run('COMMIT');
  },

  rollbackTransaction() {
    return dbClient.run('ROLLBACK');
  },

  updatePageById(pageId, { title, is_published }) {
    return dbClient.run(
      'UPDATE pages SET title = ?, is_published = ? WHERE id = ?',
      [title, is_published, pageId]
    );
  },

  insertPage({ title, slug, is_published }) {
    return dbClient.run(
      'INSERT INTO pages (title, slug, is_published) VALUES (?, ?, ?)',
      [title, slug, is_published]
    );
  },

  deleteBlocksByPageId(pageId) {
    return dbClient.run('DELETE FROM page_blocks WHERE page_id = ?', [pageId]);
  },

  insertBlock({ page_id, type, content, sort_order }) {
    return dbClient.run(
      'INSERT INTO page_blocks (page_id, type, content, sort_order) VALUES (?, ?, ?, ?)',
      [page_id, type, content, sort_order]
    );
  },

  updatePublishById(pageId, is_published) {
    return dbClient.run('UPDATE pages SET is_published = ? WHERE id = ?', [is_published, pageId]);
  },

  deletePageById(pageId) {
    return dbClient.run('DELETE FROM pages WHERE id = ?', [pageId]);
  }
});
