export const createCategoryRepository = (dbClient) => ({
  listCategories() {
    return dbClient.all('SELECT * FROM categories ORDER BY id ASC');
  },

  createCategory({ name, image_url, description }) {
    return dbClient.run(
      'INSERT INTO categories (name, image_url, description) VALUES (?, ?, ?)',
      [name, image_url, description]
    );
  },

  updateCategory({ categoryId, name, image_url, description }) {
    return dbClient.run(
      'UPDATE categories SET name = ?, image_url = ?, description = ? WHERE id = ?',
      [name, image_url, description, categoryId]
    );
  },

  deleteCategory(categoryId) {
    return dbClient.run('DELETE FROM categories WHERE id = ?', [categoryId]);
  }
});
