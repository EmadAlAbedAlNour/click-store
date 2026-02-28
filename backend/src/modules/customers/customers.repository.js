export const createCustomerRepository = (dbClient) => ({
  createCustomer({ email, passwordHash, full_name, phone, address }) {
    return dbClient.run(
      'INSERT INTO customers (email, password, full_name, phone, address) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, full_name || '', phone || '', address || '']
    );
  },

  findCustomerByEmail(email) {
    return dbClient.get('SELECT * FROM customers WHERE email = ?', [email]);
  },

  findCustomerProfileById(customerId) {
    return dbClient.get(
      'SELECT id, email, full_name, phone, address, is_active, created_at FROM customers WHERE id = ?',
      [customerId]
    );
  },

  updateOwnProfile(customerId, { full_name, phone, address }) {
    return dbClient.run(
      'UPDATE customers SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?',
      [full_name, phone, address, customerId]
    );
  },

  listOrdersByCustomerId(customerId) {
    return dbClient.all(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  },

  listCustomersWithStats() {
    return dbClient.all(
      `
      SELECT
        c.id,
        c.email,
        c.full_name,
        c.phone,
        c.address,
        c.is_active,
        c.created_at,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(o.status, 'pending')) != 'cancelled' THEN 1 ELSE 0 END), 0) AS orders_count,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(o.status, 'pending')) != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent,
        MAX(o.created_at) AS last_order_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `
    );
  },

  updateCustomerFields(customerId, fields, values) {
    return dbClient.run(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
      [...values, customerId]
    );
  },

  findProductById(productId) {
    return dbClient.get('SELECT id FROM products WHERE id = ?', [productId]);
  },

  listWishlistByCustomerId(customerId) {
    return dbClient.all(
      `
      SELECT
        w.id AS wishlist_id,
        w.created_at AS saved_at,
        p.*
      FROM wishlists w
      JOIN products p ON p.id = w.product_id
      WHERE w.customer_id = ?
      ORDER BY w.created_at DESC
    `,
      [customerId]
    );
  },

  addWishlistItem(customerId, productId) {
    return dbClient.run(
      'INSERT INTO wishlists (customer_id, product_id) VALUES (?, ?) ON CONFLICT (customer_id, product_id) DO NOTHING',
      [customerId, productId]
    );
  },

  removeWishlistItem(customerId, productId) {
    return dbClient.run(
      'DELETE FROM wishlists WHERE customer_id = ? AND product_id = ?',
      [customerId, productId]
    );
  }
});
