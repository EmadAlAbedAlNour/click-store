export const createMediaRepository = (dbClient) => ({
  createMedia({ url, filename, mime_type }) {
    return dbClient.run(
      'INSERT INTO media (url, filename, mime_type) VALUES (?, ?, ?)',
      [url, filename, mime_type]
    );
  },

  listMedia() {
    return dbClient.all('SELECT * FROM media ORDER BY created_at DESC');
  }
});
