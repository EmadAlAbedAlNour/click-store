export const createAuthRepository = (dbClient) => ({
  findUserByUsername(username) {
    return dbClient.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  },

  upgradePasswordHash(userId, passwordHash) {
    return dbClient.run('UPDATE users SET password = ? WHERE id = ?', [passwordHash, userId]);
  },

  findStaffSessionUserById(userId) {
    return dbClient.get('SELECT id, username, role, full_name FROM users WHERE id = ?', [userId]);
  }
});
