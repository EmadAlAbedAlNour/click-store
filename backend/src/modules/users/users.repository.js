export const createUserRepository = (dbClient) => ({
  listUsers() {
    return dbClient.all('SELECT id, username, role, full_name, created_at FROM users');
  },

  createUser({ username, passwordHash, role, full_name }) {
    return dbClient.run(
      'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
      [username, passwordHash, role, full_name]
    );
  },

  updateUserFields(targetId, fields, params) {
    return dbClient.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, targetId]);
  },

  getUserById(targetId) {
    return dbClient.get('SELECT id, username, role, full_name FROM users WHERE id = ?', [targetId]);
  },

  deleteUserById(targetId) {
    return dbClient.run('DELETE FROM users WHERE id = ?', [targetId]);
  }
});
