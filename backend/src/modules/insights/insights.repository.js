export const createInsightRepository = (dbClient) => ({
  getSettingsRow() {
    return dbClient.get('SELECT currency, currency_symbol, site_name FROM settings ORDER BY id ASC LIMIT 1');
  },

  getSummaryRow({ currentRangeStart, prevRangeStart, prevRangeEnd }) {
    return dbClient.get(
      `SELECT
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(status, 'pending')) != 'cancelled' THEN total_amount ELSE 0 END), 0) AS total_sales,
        COUNT(*) AS orders_count,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(status, 'pending')) != 'cancelled' THEN 1 ELSE 0 END), 0) AS revenue_orders_count,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(status, 'pending')) = 'completed' THEN 1 ELSE 0 END), 0) AS completed_orders,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(status, 'pending')) = 'pending' THEN 1 ELSE 0 END), 0) AS pending_orders,
        COALESCE(SUM(CASE WHEN DATE(created_at) >= ? AND LOWER(COALESCE(status, 'pending')) != 'cancelled' THEN total_amount ELSE 0 END), 0) AS current_revenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? AND LOWER(COALESCE(status, 'pending')) != 'cancelled' THEN total_amount ELSE 0 END), 0) AS previous_revenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) >= ? THEN 1 ELSE 0 END), 0) AS current_orders,
        COALESCE(SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END), 0) AS previous_orders
      FROM orders`,
      [currentRangeStart, prevRangeStart, prevRangeEnd, currentRangeStart, prevRangeStart, prevRangeEnd]
    );
  },

  getStatusDistribution() {
    return dbClient.all(
      `SELECT LOWER(COALESCE(status, 'pending')) AS status, COUNT(*) AS count
       FROM orders
       GROUP BY LOWER(COALESCE(status, 'pending'))
       ORDER BY count DESC`
    );
  },

  getRevenueTrendRows(currentRangeStart) {
    return dbClient.all(
      `SELECT
        DATE(created_at) AS day,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS orders_count,
        COUNT(DISTINCT COALESCE(NULLIF(customer_email, ''), NULLIF(customer_phone, ''), NULLIF(customer_name, ''), 'guest-' || id)) AS traffic
       FROM orders
       WHERE DATE(created_at) >= ?
         AND LOWER(COALESCE(status, 'pending')) != 'cancelled'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [currentRangeStart]
    );
  },

  getLowStockRows(threshold) {
    return dbClient.all(
      `SELECT * FROM (
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          COALESCE(NULLIF(p.category, ''), 'Uncategorized') AS category,
          p.stock_quantity AS stock_quantity,
          'product' AS item_type,
          p.name AS display_name
        FROM products p
        WHERE p.has_variants = 0 AND p.stock_quantity <= ?
        UNION ALL
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          COALESCE(NULLIF(p.category, ''), 'Uncategorized') AS category,
          v.stock_quantity AS stock_quantity,
          'variant' AS item_type,
          p.name || ' / ' || v.name AS display_name
        FROM product_variants v
        JOIN products p ON p.id = v.product_id
        WHERE v.stock_quantity <= ?
      ) AS low_stock_rows
      ORDER BY stock_quantity ASC, display_name ASC`,
      [threshold, threshold]
    );
  },

  getOrdersForCost() {
    return dbClient.all("SELECT id, items_json, total_amount, created_at FROM orders WHERE LOWER(COALESCE(status, 'pending')) != 'cancelled'");
  },

  getProductMeta() {
    return dbClient.all('SELECT id, category, cost_price FROM products');
  },

  getVariantMeta() {
    return dbClient.all('SELECT id, product_id, cost_price FROM product_variants');
  },

  listActivity(limit) {
    return dbClient.all(
      `
      SELECT a.*, u.full_name, u.username
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT ?
    `,
      [limit]
    );
  }
});
