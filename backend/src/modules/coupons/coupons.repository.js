export const createCouponRepository = (dbClient) => ({
  listAll() {
    return dbClient.all('SELECT * FROM coupons ORDER BY id DESC');
  },

  create({ code, type, value }) {
    return dbClient.run(
      'INSERT INTO coupons (code, type, value) VALUES (?, ?, ?)',
      [code, type, value]
    );
  },

  findActiveByCode(code) {
    return dbClient.get('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code]);
  },

  deleteById(id) {
    return dbClient.run('DELETE FROM coupons WHERE id = ?', [id]);
  }
});
