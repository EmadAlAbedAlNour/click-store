export const createOrderRepository = (dbClient) => ({
  async findActiveCouponByCode(code) {
    if (!code) return null;
    return dbClient.get('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code]);
  },

  async getOfferSettings() {
    const sql = 'SELECT tax_rate, special_offer_enabled, special_offer_product_id, special_offer_start_at, special_offer_end_at, special_offer_discount_percent, special_offer_override_price FROM settings WHERE id = 1';
    const row = await dbClient.get(sql, []);
    if (row) return row;
    return dbClient.get(sql.replace('WHERE id = 1', 'ORDER BY id ASC LIMIT 1'), []);
  },

  getVariantWithProductCost(variantId) {
    return dbClient.get(
      `SELECT v.*, p.cost_price AS product_cost_price
       FROM product_variants v
       LEFT JOIN products p ON p.id = v.product_id
       WHERE v.id = ?`,
      [variantId]
    );
  },

  getProductById(productId) {
    return dbClient.get('SELECT * FROM products WHERE id = ?', [productId]);
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

  deductStock(entry) {
    const isVariant = entry.type === 'variant';
    const sql = isVariant
      ? 'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?'
      : 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?';
    return dbClient.run(sql, [entry.quantity, entry.id, entry.quantity]);
  },

  restockStock(entry) {
    const isVariant = entry.type === 'variant';
    const sql = isVariant
      ? 'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?'
      : 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?';
    return dbClient.run(sql, [entry.quantity, entry.id]);
  },

  insertOrder(orderInput) {
    const sql = `INSERT INTO orders
      (customer_id, customer_email, customer_name, customer_phone, customer_address, order_notes, subtotal, discount, tax_amount, total_amount, items_json, source, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    return dbClient.run(sql, [
      orderInput.customer_id,
      orderInput.customer_email,
      orderInput.customer_name,
      orderInput.customer_phone,
      orderInput.customer_address,
      orderInput.order_notes,
      orderInput.subtotal,
      orderInput.discount,
      orderInput.tax_amount,
      orderInput.total_amount,
      orderInput.items_json,
      orderInput.source,
      orderInput.payment_method,
      orderInput.status
    ]);
  },

  listOrders() {
    return dbClient.all('SELECT * FROM orders ORDER BY created_at DESC');
  },

  findOrderById(orderId) {
    return dbClient.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  },

  updateOrder(orderId, updateInput) {
    const sql = `
      UPDATE orders
      SET status = ?,
          customer_name = COALESCE(?, customer_name),
          customer_phone = COALESCE(?, customer_phone),
          customer_address = COALESCE(?, customer_address),
          order_notes = COALESCE(?, order_notes),
          total_amount = COALESCE(?, total_amount)
      WHERE id = ?
    `;

    return dbClient.run(sql, [
      updateInput.status,
      updateInput.customer_name,
      updateInput.customer_phone,
      updateInput.customer_address,
      updateInput.order_notes,
      updateInput.total_amount,
      orderId
    ]);
  }
});
