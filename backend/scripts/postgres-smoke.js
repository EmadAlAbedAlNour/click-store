import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { closeDb } from '../src/db/connection.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForBootstrap = async () => {
  for (let i = 0; i < 30; i += 1) {
    const res = await request(app).get('/api/settings');
    if (res.status === 200) return;
    await wait(100);
  }
  throw new Error('Bootstrap did not finish in expected time');
};

const run = async () => {
  const report = [];
  await waitForBootstrap();

  const healthRes = await request(app).get('/api/health');
  assert.equal(healthRes.status, 200);
  assert.equal(healthRes.body?.ok, true);
  report.push('GET /api/health -> 200');

  const settingsRes = await request(app).get('/api/settings');
  assert.equal(settingsRes.status, 200);
  assert.ok(typeof settingsRes.body === 'object');
  report.push('GET /api/settings -> 200');

  const productsRes = await request(app).get('/api/products').query({ published: 1, limit: 5 });
  assert.equal(productsRes.status, 200);
  assert.ok(Array.isArray(productsRes.body?.data));
  assert.ok(productsRes.body.data.length > 0);
  report.push('GET /api/products -> 200');

  const firstProductId = Number(productsRes.body.data[0]?.id);
  assert.ok(Number.isInteger(firstProductId) && firstProductId > 0);

  const pagesRes = await request(app).get('/api/pages');
  assert.equal(pagesRes.status, 200);
  assert.ok(Array.isArray(pagesRes.body));
  report.push('GET /api/pages -> 200');

  const invalidCouponRes = await request(app).post('/api/coupons/validate').send({ code: 'NOT_REAL_CODE' });
  assert.ok([404, 400].includes(invalidCouponRes.status));
  report.push('POST /api/coupons/validate (invalid) -> ok');

  const customerAgent = request.agent(app);
  const email = `pg_smoke_${Date.now()}@example.com`;
  const password = 'customer123456';
  const registerRes = await customerAgent.post('/api/customers/register').send({
    email,
    password,
    full_name: 'Postgres Smoke User'
  });
  assert.equal(registerRes.status, 200);
  report.push('POST /api/customers/register -> 200');

  const customerMeRes = await customerAgent.get('/api/customers/me');
  assert.equal(customerMeRes.status, 200);
  assert.equal(customerMeRes.body?.email, email);
  report.push('GET /api/customers/me -> 200');

  const addWishlistRes = await customerAgent.post('/api/wishlist').send({ product_id: firstProductId });
  assert.equal(addWishlistRes.status, 200);
  report.push('POST /api/wishlist -> 200');

  const listWishlistRes = await customerAgent.get('/api/wishlist');
  assert.equal(listWishlistRes.status, 200);
  assert.ok(Array.isArray(listWishlistRes.body));
  assert.ok(listWishlistRes.body.some((item) => Number(item?.id) === firstProductId));
  report.push('GET /api/wishlist -> 200');

  const removeWishlistRes = await customerAgent.delete(`/api/wishlist/${firstProductId}`);
  assert.equal(removeWishlistRes.status, 200);
  report.push('DELETE /api/wishlist/:id -> 200');

  const orderRes = await request(app).post('/api/orders').send({
    customer_name: 'Postgres Smoke Buyer',
    customer_phone: '0100000000',
    customer_address: 'Postgres Street',
    source: 'online',
    items: [{ id: firstProductId, quantity: 1 }]
  });
  assert.equal(orderRes.status, 200);
  assert.ok(Number(orderRes.body?.id) > 0);
  report.push('POST /api/orders -> 200');

  return report;
};

run()
  .then(async (report) => {
    report.forEach((line) => console.log(`✔ ${line}`));
    await closeDb();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`✖ PostgreSQL smoke failed: ${error.message}`);
    try {
      await closeDb();
    } catch {
      // ignore close errors in smoke mode
    }
    process.exit(1);
  });
