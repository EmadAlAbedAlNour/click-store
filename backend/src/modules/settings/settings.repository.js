export const createSettingsRepository = (dbClient) => ({
  getById(id = 1) {
    return dbClient.get('SELECT * FROM settings WHERE id = ?', [id]);
  },

  getFirst() {
    return dbClient.get('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
  },

  updateById(id, columns, values) {
    const sql = `UPDATE settings SET ${columns.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`;
    return dbClient.run(sql, [...values, id]);
  },

  insertWithId(id, columns, values) {
    const sql = `INSERT INTO settings (id, ${columns.join(', ')}) VALUES (?, ${columns.map(() => '?').join(', ')})`;
    return dbClient.run(sql, [id, ...values]);
  }
});
