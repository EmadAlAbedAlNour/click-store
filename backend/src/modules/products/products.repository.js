export const createProductRepository = ({ dbClient }) => ({
  countProducts(whereSql, params = []) {
    return dbClient.get(`SELECT COUNT(*) as count FROM products ${whereSql}`, params);
  },

  getPriceBounds(whereSql, params = []) {
    return dbClient.get(
      `SELECT MIN(base_price) as min_price, MAX(base_price) as max_price FROM products ${whereSql}`,
      params
    );
  },

  listProducts(whereSql, params = [], limit, offset) {
    return dbClient.all(
      `SELECT * FROM products ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
  },

  listVariantsByProductId(productId) {
    return dbClient.all('SELECT * FROM product_variants WHERE product_id = ?', [productId]);
  },

  listVariantsByProductIds(productIds = []) {
    if (!Array.isArray(productIds) || productIds.length === 0) return Promise.resolve([]);
    const placeholders = productIds.map(() => '?').join(',');
    return dbClient.all(
      `SELECT * FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY id ASC`,
      productIds
    );
  },

  listProductsByIds(productIds = [], includeUnpublished = false) {
    if (!Array.isArray(productIds) || productIds.length === 0) return Promise.resolve([]);
    const placeholders = productIds.map(() => '?').join(',');
    const publishedFilter = includeUnpublished ? '' : ' AND is_published = 1';
    return dbClient.all(
      `SELECT * FROM products WHERE id IN (${placeholders})${publishedFilter}`,
      productIds
    );
  },

  findVisibleProductById(productId, includeUnpublished) {
    const sql = includeUnpublished
      ? 'SELECT * FROM products WHERE id = ?'
      : 'SELECT * FROM products WHERE id = ? AND is_published = 1';
    return dbClient.get(sql, [productId]);
  },

  listReviewsByProductId(productId) {
    return dbClient.all('SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC', [productId]);
  },

  createReview({ productId, name, rating, title, body }) {
    return dbClient.run(
      'INSERT INTO product_reviews (product_id, name, rating, title, body) VALUES (?, ?, ?, ?, ?)',
      [productId, name, rating, title, body]
    );
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

  deleteProductsByIds(ids) {
    const placeholders = ids.map(() => '?').join(',');
    return dbClient.run(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
  },

  bulkUpdateProducts(setParts, values, ids) {
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE products SET ${setParts.join(', ')} WHERE id IN (${placeholders})`;
    return dbClient.run(sql, [...values, ...ids]);
  },

  adjustBasePrices({ factor, category }) {
    if (category && category !== 'all') {
      return dbClient.run(
        'UPDATE products SET base_price = ROUND(CASE WHEN base_price * ? < 0 THEN 0 ELSE base_price * ? END, 0) WHERE category = ?',
        [factor, factor, category]
      );
    }
    return dbClient.run(
      'UPDATE products SET base_price = ROUND(CASE WHEN base_price * ? < 0 THEN 0 ELSE base_price * ? END, 0)',
      [factor, factor]
    );
  },

  adjustVariantPrices({ factor, category }) {
    if (category && category !== 'all') {
      return dbClient.run(
        'UPDATE product_variants SET price = ROUND(CASE WHEN price * ? < 0 THEN 0 ELSE price * ? END, 0) WHERE product_id IN (SELECT id FROM products WHERE category = ?)',
        [factor, factor, category]
      );
    }
    return dbClient.run(
      'UPDATE product_variants SET price = ROUND(CASE WHEN price * ? < 0 THEN 0 ELSE price * ? END, 0)',
      [factor, factor]
    );
  },

  insertProduct(values) {
    const sql = 'INSERT INTO products (name, description, image_url, hover_image_url, gallery_images_json, base_price, cost_price, sku, stock_quantity, category, has_variants, is_published, specs_json, seo_title, seo_description, seo_keywords) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    return dbClient.run(sql, values);
  },

  insertVariants(productId, variants) {
    if (!Array.isArray(variants) || variants.length === 0) return Promise.resolve();
    const sql = 'INSERT INTO product_variants (product_id, name, price, cost_price, stock_quantity, sku) VALUES (?,?,?,?,?,?)';
    return variants.reduce(
      (chain, variant) => chain.then(() => dbClient.run(sql, [
        productId,
        variant?.name,
        Number(variant?.price || 0),
        Number(variant?.cost_price || 0),
        Number(variant?.stock_quantity || 0),
        variant?.sku || ''
      ])),
      Promise.resolve()
    );
  },

  updateProductById(productId, values) {
    const sql = 'UPDATE products SET name=?, description=?, image_url=?, hover_image_url=?, gallery_images_json=?, base_price=?, cost_price=?, sku=?, stock_quantity=?, category=?, has_variants=?, is_published=?, specs_json=?, seo_title=?, seo_description=?, seo_keywords=? WHERE id=?';
    return dbClient.run(sql, [...values, productId]);
  },

  deleteVariantsByProductId(productId) {
    return dbClient.run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
  },

  deleteProductById(productId) {
    return dbClient.run('DELETE FROM products WHERE id = ?', [productId]);
  }
});
