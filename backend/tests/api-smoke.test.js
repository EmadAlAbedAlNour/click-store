import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { after, before, test } from 'node:test';
import request from 'supertest';
import { createDbClient } from '../src/db/dbClient.js';

let app;
let db;
let dbClient;
let closeDb;

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const dbGet = (sql, params = []) => dbClient.get(sql, params);
const dbRun = (sql, params = []) => dbClient.run(sql, params);

const loginAs = async (agent, { username, password }) => {
  const loginRes = await agent.post('/api/login').send({ username, password });
  assert.equal(loginRes.status, 200);
  return loginRes;
};

const loginAsAdmin = async (agent) => {
  const loginRes = await loginAs(agent, { username: 'admin', password: 'admin123456' });
  assert.equal(loginRes.body?.role, 'admin');
  return loginRes;
};

const ensureStaffUser = async ({ username, password, role = 'editor', full_name = 'Editor User' }) => {
  const existing = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
  if (existing?.id) return Number(existing.id);

  const passwordHash = bcrypt.hashSync(password, 10);
  const created = await dbRun(
    'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
    [username, passwordHash, role, full_name]
  );
  return created.lastID;
};

const ensureAdminUser = async () => {
  const username = 'admin';
  const passwordHash = bcrypt.hashSync('admin123456', 10);
  const existing = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
  if (existing?.id) {
    await dbRun('UPDATE users SET password = ?, role = ?, full_name = ? WHERE id = ?', [
      passwordHash,
      'admin',
      'Super Admin',
      existing.id
    ]);
    return Number(existing.id);
  }

  const created = await dbRun(
    'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
    [username, passwordHash, 'admin', 'Super Admin']
  );
  return Number(created.lastID);
};

const waitForBootstrap = async () => {
  for (let i = 0; i < 30; i += 1) {
    const res = await request(app).get('/api/settings');
    if (res.status === 200) return;
    await wait(100);
  }
  throw new Error('Server bootstrap did not finish in expected time');
};

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_only_jwt_secret_change_me';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.ADMIN_BOOTSTRAP_USERNAME = 'admin';
  process.env.ADMIN_BOOTSTRAP_PASSWORD = 'admin123456';

  const serverModule = await import('../src/server.js');
  app = serverModule.app;
  db = serverModule.db;
  dbClient = createDbClient(db);
  closeDb = serverModule.closeDb;
  await waitForBootstrap();
  await ensureAdminUser();
});

after(async () => {
  if (closeDb) {
    await closeDb();
  }
});

test('GET /api/settings responds with defaults', async () => {
  const res = await request(app).get('/api/settings');
  assert.equal(res.status, 200);
  assert.ok(res.body);
  assert.ok(typeof res.body === 'object');
  assert.ok(Object.hasOwn(res.body, 'tax_rate'));
});

test('GET /api/health responds with healthy payload', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body?.ok, true);
  assert.equal(res.body?.status, 'healthy');
  assert.ok(typeof res.body?.timestamp === 'string');
});

test('staff login sets cookie and /api/auth/me resolves session', async () => {
  const agent = request.agent(app);

  const loginRes = await loginAsAdmin(agent);
  assert.ok(Array.isArray(loginRes.headers['set-cookie']));
  assert.ok(loginRes.headers['set-cookie'].some((cookie) => cookie.includes('staff_auth_token=')));

  const meRes = await agent.get('/api/auth/me');
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body?.username, 'admin');
  assert.equal(meRes.body?.role, 'admin');
});

test('staff login rejects invalid credentials', async () => {
  const res = await request(app).post('/api/login').send({
    username: 'admin',
    password: 'wrong-password'
  });
  assert.equal(res.status, 401);
  assert.equal(res.body?.message, 'خطأ في اسم المستخدم أو كلمة المرور');
});

test('staff logout clears session', async () => {
  const agent = request.agent(app);
  await loginAsAdmin(agent);

  const logoutRes = await agent.post('/api/logout');
  assert.equal(logoutRes.status, 200);
  assert.equal(logoutRes.body?.message, 'Logged out');

  const meRes = await agent.get('/api/auth/me');
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body, null);
});

test('legacy bearer auth remains valid during migration', async () => {
  const admin = await dbGet(
    'SELECT id, username, role, full_name FROM users WHERE username = ?',
    ['admin']
  );
  assert.ok(admin);

  const secretKey = String(process.env.JWT_SECRET || '');
  const bearerToken = jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      full_name: admin.full_name
    },
    secretKey,
    { expiresIn: '24h' }
  );

  const res = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${bearerToken}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('editor is blocked from admin-only endpoints', async () => {
  const username = `editor_${Date.now()}`;
  const password = 'editor123456';
  await ensureStaffUser({
    username,
    password,
    role: 'editor',
    full_name: 'Limited Editor'
  });

  const agent = request.agent(app);
  const loginRes = await loginAs(agent, { username, password });
  assert.equal(loginRes.body?.role, 'editor');

  const usersRes = await agent.get('/api/users');
  assert.equal(usersRes.status, 403);

  const settingsUpdateRes = await agent.put('/api/settings').send({ tax_rate: 7 });
  assert.equal(settingsUpdateRes.status, 403);

  const activityRes = await agent.get('/api/activity');
  assert.equal(activityRes.status, 403);

  const couponsRes = await agent.get('/api/coupons');
  assert.equal(couponsRes.status, 200);
});

test('admin user management validates payload and normalizes full_name', async () => {
  const agent = request.agent(app);
  await loginAsAdmin(agent);

  const username = `staff_${Date.now()}`;
  const createRes = await agent.post('/api/users').send({
    username,
    password: 'secure123',
    role: 'editor'
  });
  assert.equal(createRes.status, 200);
  assert.ok(Number(createRes.body?.id) > 0);

  const listRes = await agent.get('/api/users');
  assert.equal(listRes.status, 200);
  const createdUser = listRes.body.find((row) => row.username === username);
  assert.ok(createdUser);
  assert.equal(createdUser.full_name, username);

  const duplicateRes = await agent.post('/api/users').send({
    username,
    password: 'secure123',
    role: 'editor'
  });
  assert.equal(duplicateRes.status, 409);
  assert.equal(duplicateRes.body?.error, 'Username already exists');

  const weakPasswordRes = await agent.post('/api/users').send({
    username: `weak_${Date.now()}`,
    password: '123',
    role: 'editor'
  });
  assert.equal(weakPasswordRes.status, 400);
  assert.equal(weakPasswordRes.body?.error, 'Password must be at least 6 characters');

  const adminRow = listRes.body.find((row) => row.username === 'admin');
  assert.ok(adminRow);
  const deletePrimaryAdminRes = await agent.delete(`/api/users/${adminRow.id}`);
  assert.equal(deletePrimaryAdminRes.status, 400);
  assert.equal(deletePrimaryAdminRes.body?.error, 'Primary admin cannot be deleted');
});

test('editor can manage categories and media with validation guards', async () => {
  const username = `editor_ops_${Date.now()}`;
  const password = 'editor123456';
  await ensureStaffUser({
    username,
    password,
    role: 'editor',
    full_name: 'Content Editor'
  });

  const agent = request.agent(app);
  const loginRes = await loginAs(agent, { username, password });
  assert.equal(loginRes.body?.role, 'editor');

  const invalidCategoryCreateRes = await agent.post('/api/categories').send({
    name: '   ',
    image_url: 'https://example.com/cat.png',
    description: 'Category from test'
  });
  assert.equal(invalidCategoryCreateRes.status, 400);
  assert.equal(invalidCategoryCreateRes.body?.error, 'Category name is required');

  const createCategoryRes = await agent.post('/api/categories').send({
    name: 'Test Category',
    image_url: 'https://example.com/cat.png',
    description: 'Category from test'
  });
  assert.equal(createCategoryRes.status, 200);
  assert.ok(Number(createCategoryRes.body?.id) > 0);

  const invalidCategoryUpdateRes = await agent
    .put(`/api/categories/${createCategoryRes.body.id}`)
    .send({ name: '   ' });
  assert.equal(invalidCategoryUpdateRes.status, 400);
  assert.equal(invalidCategoryUpdateRes.body?.error, 'Category name is required');

  const validCategoryUpdateRes = await agent
    .put(`/api/categories/${createCategoryRes.body.id}`)
    .send({ name: 'Updated Category' });
  assert.equal(validCategoryUpdateRes.status, 200);
  assert.equal(validCategoryUpdateRes.body?.message, 'Category updated');

  const invalidMediaLinkRes = await agent.post('/api/media/link').send({ url: 'not-a-url' });
  assert.equal(invalidMediaLinkRes.status, 400);
  assert.equal(invalidMediaLinkRes.body?.error, 'Valid image URL is required');

  const validMediaLinkRes = await agent.post('/api/media/link').send({ url: 'https://example.com/image.jpg' });
  assert.equal(validMediaLinkRes.status, 200);
  assert.ok(Number(validMediaLinkRes.body?.id) > 0);

  const mediaListRes = await agent.get('/api/media');
  assert.equal(mediaListRes.status, 200);
  assert.ok(Array.isArray(mediaListRes.body));
  assert.ok(mediaListRes.body.some((row) => Number(row.id) === Number(validMediaLinkRes.body.id)));
});

test('anonymous requests are denied for protected admin routes', async () => {
  const usersRes = await request(app).get('/api/users');
  assert.equal(usersRes.status, 401);

  const mediaRes = await request(app).get('/api/media');
  assert.equal(mediaRes.status, 401);
});

test('unpublished products are hidden from public and visible to staff', async () => {
  const inserted = await dbRun(
    'INSERT INTO products (name, is_published, base_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?)',
    [`Unpublished-${Date.now()}`, 0, 100, 5, 'Accessories']
  );
  const productId = inserted.lastID;
  assert.ok(productId > 0);

  const publicUnpublishedListRes = await request(app).get('/api/products').query({ published: 0 });
  assert.equal(publicUnpublishedListRes.status, 403);

  const publicProductRes = await request(app).get(`/api/products/${productId}`);
  assert.equal(publicProductRes.status, 404);

  const editorUsername = `editor_visibility_${Date.now()}`;
  const editorPassword = 'editor123456';
  await ensureStaffUser({
    username: editorUsername,
    password: editorPassword,
    role: 'editor',
    full_name: 'Visibility Editor'
  });

  const editorAgent = request.agent(app);
  await loginAs(editorAgent, { username: editorUsername, password: editorPassword });

  const staffUnpublishedListRes = await editorAgent.get('/api/products').query({ published: 0, limit: 200 });
  assert.equal(staffUnpublishedListRes.status, 200);
  assert.ok(Array.isArray(staffUnpublishedListRes.body?.data));
  assert.ok(staffUnpublishedListRes.body.data.some((row) => Number(row.id) === Number(productId)));

  const staffProductRes = await editorAgent.get(`/api/products/${productId}`);
  assert.equal(staffProductRes.status, 200);
  assert.equal(Number(staffProductRes.body?.id), Number(productId));
});

test('product batch endpoint returns ordered products with variants for wishlist use', async () => {
  const firstInserted = await dbRun(
    'INSERT INTO products (name, is_published, base_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?)',
    [`Batch-One-${Date.now()}`, 1, 120, 7, 'Accessories']
  );
  const secondInserted = await dbRun(
    'INSERT INTO products (name, is_published, base_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?)',
    [`Batch-Two-${Date.now()}`, 1, 180, 5, 'Accessories']
  );

  const firstId = Number(firstInserted.lastID);
  const secondId = Number(secondInserted.lastID);
  assert.ok(firstId > 0);
  assert.ok(secondId > 0);

  await dbRun(
    'INSERT INTO product_variants (product_id, name, price, cost_price, stock_quantity, sku) VALUES (?, ?, ?, ?, ?, ?)',
    [firstId, 'Variant A', 130, 90, 3, `BATCH-SKU-${Date.now()}`]
  );

  const batchRes = await request(app).get('/api/products/batch').query({
    ids: `${secondId},${firstId},${secondId},invalid`
  });
  assert.equal(batchRes.status, 200);
  assert.ok(Array.isArray(batchRes.body));
  assert.equal(batchRes.body.length, 2);
  assert.equal(Number(batchRes.body?.[0]?.id), secondId);
  assert.equal(Number(batchRes.body?.[1]?.id), firstId);
  assert.ok(Array.isArray(batchRes.body?.[0]?.variants));
  assert.ok(Array.isArray(batchRes.body?.[1]?.variants));
  assert.equal(batchRes.body[1].variants.length, 1);
  assert.equal(Number(batchRes.body[1].variants[0]?.product_id), firstId);
});

test('product batch endpoint respects unpublished visibility rules', async () => {
  const inserted = await dbRun(
    'INSERT INTO products (name, is_published, base_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?)',
    [`Batch-Hidden-${Date.now()}`, 0, 95, 4, 'Accessories']
  );
  const hiddenProductId = Number(inserted.lastID);
  assert.ok(hiddenProductId > 0);

  const publicRes = await request(app).get('/api/products/batch').query({ ids: hiddenProductId });
  assert.equal(publicRes.status, 200);
  assert.ok(Array.isArray(publicRes.body));
  assert.equal(publicRes.body.length, 0);

  const publicForbiddenRes = await request(app).get('/api/products/batch').query({
    ids: hiddenProductId,
    published: 0
  });
  assert.equal(publicForbiddenRes.status, 403);

  const editorUsername = `editor_batch_${Date.now()}`;
  const editorPassword = 'editor123456';
  await ensureStaffUser({
    username: editorUsername,
    password: editorPassword,
    role: 'editor',
    full_name: 'Batch Editor'
  });

  const editorAgent = request.agent(app);
  await loginAs(editorAgent, { username: editorUsername, password: editorPassword });

  const staffRes = await editorAgent.get('/api/products/batch').query({
    ids: hiddenProductId,
    published: 0
  });
  assert.equal(staffRes.status, 200);
  assert.ok(Array.isArray(staffRes.body));
  assert.equal(staffRes.body.length, 1);
  assert.equal(Number(staffRes.body[0]?.id), hiddenProductId);
});

test('page publish visibility and delete guard work as expected', async () => {
  const adminAgent = request.agent(app);
  await loginAsAdmin(adminAgent);

  const slug = `page-${Date.now()}`;
  const createRes = await adminAgent.post('/api/pages').send({
    title: 'Test Page',
    slug,
    is_published: 0,
    blocks: [
      { type: 'text', content: { body: 'Hidden draft' } }
    ]
  });
  assert.equal(createRes.status, 200);
  assert.equal(createRes.body?.message, 'Page saved successfully');

  const publicListRes = await request(app).get('/api/pages');
  assert.equal(publicListRes.status, 200);
  assert.ok(Array.isArray(publicListRes.body));
  assert.ok(!publicListRes.body.some((page) => page.slug === slug));

  const publicDraftRes = await request(app).get(`/api/pages/${slug}`);
  assert.equal(publicDraftRes.status, 404);

  const adminListRes = await adminAgent.get('/api/pages');
  assert.equal(adminListRes.status, 200);
  const adminPage = adminListRes.body.find((page) => page.slug === slug);
  assert.ok(adminPage);
  assert.equal(Number(adminPage.is_published), 0);

  const publishRes = await adminAgent.put(`/api/pages/${adminPage.id}/publish`).send({ is_published: 1 });
  assert.equal(publishRes.status, 200);
  assert.equal(publishRes.body?.message, 'Page publish state updated');

  const publicPublishedRes = await request(app).get(`/api/pages/${slug}`);
  assert.equal(publicPublishedRes.status, 200);
  assert.equal(publicPublishedRes.body?.slug, slug);
  assert.ok(Array.isArray(publicPublishedRes.body?.blocks));

  const homeDeleteRes = await adminAgent.delete('/api/pages/home');
  assert.equal(homeDeleteRes.status, 400);
  assert.equal(homeDeleteRes.body?.error, 'Home page cannot be deleted');

  const deleteRes = await adminAgent.delete(`/api/pages/${slug}`);
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.body?.message, 'Page deleted successfully');
});

test('customer register validates email and password strength', async () => {
  const invalidEmailRes = await request(app).post('/api/customers/register').send({
    email: 'not-an-email',
    password: 'customer123456',
    full_name: 'Invalid Email'
  });
  assert.equal(invalidEmailRes.status, 400);
  assert.equal(invalidEmailRes.body?.error, 'Valid email is required');

  const weakPasswordRes = await request(app).post('/api/customers/register').send({
    email: `weak_${Date.now()}@example.com`,
    password: 'short',
    full_name: 'Weak Password'
  });
  assert.equal(weakPasswordRes.status, 400);
  assert.equal(weakPasswordRes.body?.error, 'Password must be at least 8 characters and include letters and numbers');
});

test('customer register sets cookie and /api/customers/me returns profile', async () => {
  const email = `customer_${Date.now()}@example.com`;
  const agent = request.agent(app);

  const registerRes = await agent.post('/api/customers/register').send({
    email,
    password: 'customer123456',
    full_name: 'Test Customer'
  });
  assert.equal(registerRes.status, 200);
  assert.ok(Array.isArray(registerRes.headers['set-cookie']));
  assert.ok(registerRes.headers['set-cookie'].some((cookie) => cookie.includes('customer_auth_token=')));

  const meRes = await agent.get('/api/customers/me');
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body?.email, email);
  assert.equal(meRes.body?.full_name, 'Test Customer');
});

test('customer can add/list/remove wishlist items', async () => {
  const email = `wishlist_${Date.now()}@example.com`;
  const customerAgent = request.agent(app);

  const registerRes = await customerAgent.post('/api/customers/register').send({
    email,
    password: 'customer123456',
    full_name: 'Wishlist Customer'
  });
  assert.equal(registerRes.status, 200);

  const productsRes = await request(app).get('/api/products').query({ published: 1, limit: 1 });
  assert.equal(productsRes.status, 200);
  const productId = productsRes.body?.data?.[0]?.id;
  assert.ok(Number(productId) > 0);

  const addRes = await customerAgent.post('/api/wishlist').send({ product_id: productId });
  assert.equal(addRes.status, 200);
  assert.equal(addRes.body?.product_id, productId);

  const listRes = await customerAgent.get('/api/wishlist');
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.body));
  assert.ok(listRes.body.some((item) => Number(item.id) === Number(productId)));

  const removeRes = await customerAgent.delete(`/api/wishlist/${productId}`);
  assert.equal(removeRes.status, 200);
  assert.equal(removeRes.body?.product_id, productId);
});

test('admin can list and update customers', async () => {
  const email = `admin_customer_${Date.now()}@example.com`;
  const customerAgent = request.agent(app);
  const registerRes = await customerAgent.post('/api/customers/register').send({
    email,
    password: 'customer123456',
    full_name: 'Managed Customer'
  });
  assert.equal(registerRes.status, 200);

  const customerRow = await dbGet('SELECT id, is_active FROM customers WHERE email = ?', [email]);
  assert.ok(customerRow);
  assert.equal(Number(customerRow.is_active), 1);

  const adminAgent = request.agent(app);
  await loginAsAdmin(adminAgent);

  const listRes = await adminAgent.get('/api/customers');
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.body));
  assert.ok(listRes.body.some((row) => row.email === email));

  const updateRes = await adminAgent.put(`/api/customers/${customerRow.id}`).send({ is_active: 0 });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body?.message, 'Customer updated successfully');

  const updatedRow = await dbGet('SELECT is_active FROM customers WHERE id = ?', [customerRow.id]);
  assert.equal(Number(updatedRow?.is_active), 0);
});

test('admin can create/validate/delete coupon', async () => {
  const agent = request.agent(app);
  await loginAsAdmin(agent);

  const code = `PROMO_${Date.now()}`;
  const createRes = await agent.post('/api/coupons').send({
    code,
    type: 'fixed',
    value: 10
  });
  assert.equal(createRes.status, 200);
  assert.ok(Number(createRes.body?.id) > 0);

  const validateRes = await request(app).post('/api/coupons/validate').send({ code });
  assert.equal(validateRes.status, 200);
  assert.equal(validateRes.body?.code, code);

  const deleteRes = await agent.delete(`/api/coupons/${createRes.body.id}`);
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.body?.message, 'Coupon deleted');

  const validateAfterDeleteRes = await request(app).post('/api/coupons/validate').send({ code });
  assert.equal(validateAfterDeleteRes.status, 404);
});

test('coupon validation returns 400 for invalid payloads', async () => {
  const agent = request.agent(app);
  await loginAsAdmin(agent);

  const missingCodeRes = await agent.post('/api/coupons').send({
    code: '',
    type: 'fixed',
    value: 10
  });
  assert.equal(missingCodeRes.status, 400);
  assert.equal(missingCodeRes.body?.error, 'Coupon code is required');

  const invalidTypeRes = await agent.post('/api/coupons').send({
    code: 'BADTYPE',
    type: 'random',
    value: 10
  });
  assert.equal(invalidTypeRes.status, 400);
  assert.equal(invalidTypeRes.body?.error, 'Coupon type must be fixed or percent');

  const invalidPercentRes = await agent.post('/api/coupons').send({
    code: 'TOOHIGH',
    type: 'percent',
    value: 150
  });
  assert.equal(invalidPercentRes.status, 400);
  assert.equal(invalidPercentRes.body?.error, 'Percent coupon value cannot exceed 100');

  const validateMissingCodeRes = await request(app).post('/api/coupons/validate').send({ code: '' });
  assert.equal(validateMissingCodeRes.status, 400);
  assert.equal(validateMissingCodeRes.body?.error, 'Coupon code is required');
});

test('admin can load analytics and activity payloads', async () => {
  const agent = request.agent(app);
  await loginAsAdmin(agent);

  const analyticsRes = await agent.get('/api/analytics').query({ days: 14 });
  assert.equal(analyticsRes.status, 200);
  assert.equal(analyticsRes.body?.range_days, 14);
  assert.ok(typeof analyticsRes.body?.kpis === 'object');
  assert.ok(Array.isArray(analyticsRes.body?.status_distribution));

  const activityRes = await agent.get('/api/activity').query({ limit: 10 });
  assert.equal(activityRes.status, 200);
  assert.ok(Array.isArray(activityRes.body));
});

test('POST /api/orders creates COD online order and persists payment_method', async () => {
  const productsRes = await request(app).get('/api/products').query({ published: 1, limit: 1 });
  assert.equal(productsRes.status, 200);
  assert.ok(Array.isArray(productsRes.body?.data));
  assert.ok(productsRes.body.data.length > 0);

  const product = productsRes.body.data[0];
  const orderRes = await request(app).post('/api/orders').send({
    customer_name: 'Test Buyer',
    customer_phone: '0000000000',
    customer_address: 'Test Address',
    source: 'online',
    items: [{ id: product.id, quantity: 1 }]
  });

  assert.equal(orderRes.status, 200);
  assert.ok(orderRes.body?.id);

  const row = await dbGet('SELECT id, source, payment_method FROM orders WHERE id = ?', [orderRes.body.id]);
  assert.ok(row);
  assert.equal(row.source, 'online');
  assert.equal(row.payment_method, 'cod');
});

test('admin order status transitions adjust stock correctly', async () => {
  const productsRes = await request(app).get('/api/products').query({ published: 1, limit: 1 });
  assert.equal(productsRes.status, 200);
  const product = productsRes.body.data[0];
  assert.ok(product?.id);

  const beforeRow = await dbGet('SELECT stock_quantity FROM products WHERE id = ?', [product.id]);
  assert.ok(beforeRow);
  const beforeStock = Number(beforeRow.stock_quantity || 0);

  const orderRes = await request(app).post('/api/orders').send({
    customer_name: 'Status Flow',
    customer_phone: '2222222222',
    customer_address: 'Stock Street',
    source: 'online',
    items: [{ id: product.id, quantity: 1 }]
  });
  assert.equal(orderRes.status, 200);
  const orderId = orderRes.body?.id;
  assert.ok(orderId);

  const afterCreateRow = await dbGet('SELECT stock_quantity FROM products WHERE id = ?', [product.id]);
  assert.equal(Number(afterCreateRow.stock_quantity || 0), beforeStock - 1);

  const adminAgent = request.agent(app);
  await loginAsAdmin(adminAgent);

  const cancelRes = await adminAgent.put(`/api/orders/${orderId}`).send({ status: 'cancelled' });
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.body?.message, 'Order updated successfully');

  const afterCancelRow = await dbGet('SELECT stock_quantity FROM products WHERE id = ?', [product.id]);
  assert.equal(Number(afterCancelRow.stock_quantity || 0), beforeStock);

  const resumeRes = await adminAgent.put(`/api/orders/${orderId}`).send({ status: 'processing' });
  assert.equal(resumeRes.status, 200);
  assert.equal(resumeRes.body?.message, 'Order updated successfully');

  const afterResumeRow = await dbGet('SELECT stock_quantity FROM products WHERE id = ?', [product.id]);
  assert.equal(Number(afterResumeRow.stock_quantity || 0), beforeStock - 1);
});

test('admin can bulk transition and cancel selected orders', async () => {
  const inserted = await dbRun(
    'INSERT INTO products (name, is_published, base_price, cost_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?, ?)',
    [`Bulk-${Date.now()}`, 1, 80, 40, 40, 'Testing']
  );
  const productId = inserted.lastID;
  assert.ok(productId > 0);

  const beforeRow = await dbGet('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
  const beforeStock = Number(beforeRow?.stock_quantity || 0);

  const createOrder = async (suffix) => request(app).post('/api/orders').send({
    customer_name: `Bulk Buyer ${suffix}`,
    customer_phone: '4444444444',
    customer_address: 'Bulk Lane',
    source: 'online',
    items: [{ id: productId, quantity: 1 }]
  });

  const orderARes = await createOrder('A');
  const orderBRes = await createOrder('B');
  assert.equal(orderARes.status, 200);
  assert.equal(orderBRes.status, 200);
  const orderAId = Number(orderARes.body?.id);
  const orderBId = Number(orderBRes.body?.id);
  assert.ok(orderAId > 0);
  assert.ok(orderBId > 0);

  const afterCreateRow = await dbGet('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
  assert.equal(Number(afterCreateRow.stock_quantity || 0), beforeStock - 2);

  const adminAgent = request.agent(app);
  await loginAsAdmin(adminAgent);

  const toProcessingRes = await adminAgent.put('/api/orders/bulk').send({
    ids: [orderAId, orderBId],
    status: 'processing'
  });
  assert.equal(toProcessingRes.status, 200);
  assert.equal(Number(toProcessingRes.body?.processed || 0), 2);
  assert.equal(Number(toProcessingRes.body?.failed || 0), 0);

  const orderAAfterProcessing = await dbGet('SELECT status FROM orders WHERE id = ?', [orderAId]);
  const orderBAfterProcessing = await dbGet('SELECT status FROM orders WHERE id = ?', [orderBId]);
  assert.equal(orderAAfterProcessing?.status, 'processing');
  assert.equal(orderBAfterProcessing?.status, 'processing');

  const bulkCancelRes = await adminAgent.put('/api/orders/bulk').send({
    ids: [orderAId, orderBId],
    status: 'cancelled'
  });
  assert.equal(bulkCancelRes.status, 200);
  assert.equal(Number(bulkCancelRes.body?.processed || 0), 2);
  assert.equal(Number(bulkCancelRes.body?.failed || 0), 0);

  const afterCancelRow = await dbGet('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
  assert.equal(Number(afterCancelRow.stock_quantity || 0), beforeStock);
});

test('admin order lifecycle blocks invalid jump from completed to pending', async () => {
  const inserted = await dbRun(
    'INSERT INTO products (name, is_published, base_price, cost_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?, ?)',
    [`Lifecycle-${Date.now()}`, 1, 120, 60, 25, 'Testing']
  );
  const productId = inserted.lastID;
  assert.ok(productId > 0);

  const orderRes = await request(app).post('/api/orders').send({
    customer_name: 'Workflow Guard',
    customer_phone: '3333333333',
    customer_address: 'Flow Street',
    source: 'online',
    items: [{ id: productId, quantity: 1 }]
  });
  assert.equal(orderRes.status, 200);
  const orderId = orderRes.body?.id;
  assert.ok(orderId);

  const adminAgent = request.agent(app);
  await loginAsAdmin(adminAgent);

  const toProcessingRes = await adminAgent.put(`/api/orders/${orderId}`).send({ status: 'processing' });
  assert.equal(toProcessingRes.status, 200);

  const toShippedRes = await adminAgent.put(`/api/orders/${orderId}`).send({ status: 'shipped' });
  assert.equal(toShippedRes.status, 200);

  const toCompletedRes = await adminAgent.put(`/api/orders/${orderId}`).send({ status: 'completed' });
  assert.equal(toCompletedRes.status, 200);

  const invalidJumpRes = await adminAgent.put(`/api/orders/${orderId}`).send({ status: 'pending' });
  assert.equal(invalidJumpRes.status, 409);
  assert.match(String(invalidJumpRes.body?.error || ''), /Invalid status transition/i);
});

test('POST /api/orders rejects POS source for public user', async () => {
  const productsRes = await request(app).get('/api/products').query({ published: 1, limit: 1 });
  assert.equal(productsRes.status, 200);
  const product = productsRes.body.data[0];

  const orderRes = await request(app).post('/api/orders').send({
    customer_name: 'Public User',
    customer_phone: '1111111111',
    customer_address: 'No POS Rights',
    source: 'pos',
    items: [{ id: product.id, quantity: 1 }]
  });

  assert.equal(orderRes.status, 403);
});
