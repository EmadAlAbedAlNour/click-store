import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const CUSTOMER_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value = '') => EMAIL_PATTERN.test(String(value || '').trim());
const hasStrongPassword = (value = '') => {
  const password = String(value || '');
  if (password.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

export const createCustomerService = ({
  customerRepository,
  secretKey,
  saltRounds
}) => ({
  async registerCustomer(payload = {}) {
    const safeEmail = String(payload?.email || '').trim();
    const safePassword = String(payload?.password || '');
    const { full_name, phone, address } = payload;
    if (!safeEmail || !safePassword) {
      return { ok: false, status: 400, error: 'Email and password are required' };
    }
    if (!isValidEmail(safeEmail)) {
      return { ok: false, status: 400, error: 'Valid email is required' };
    }
    if (!hasStrongPassword(safePassword)) {
      return {
        ok: false,
        status: 400,
        error: 'Password must be at least 8 characters and include letters and numbers'
      };
    }

    try {
      const passwordHash = bcrypt.hashSync(safePassword, saltRounds);
      const created = await customerRepository.createCustomer({
        email: safeEmail,
        passwordHash,
        full_name,
        phone,
        address
      });
      const token = jwt.sign(
        {
          id: created.lastID,
          email: safeEmail,
          full_name: full_name || '',
          role: 'customer'
        },
        secretKey,
        { expiresIn: '30d' }
      );
      return {
        ok: true,
        status: 200,
        data: { message: 'Account created' },
        token,
        cookieMaxAgeMs: CUSTOMER_TOKEN_MAX_AGE_MS
      };
    } catch {
      return { ok: false, status: 500, error: 'Email already exists or database error' };
    }
  },

  async loginCustomer(payload = {}) {
    const { email, password } = payload;
    try {
      const row = await customerRepository.findCustomerByEmail(email);
      if (!row) return { ok: false, status: 401, error: 'Invalid credentials', messageKey: 'message' };
      if (Number(row.is_active) !== 1) {
        return { ok: false, status: 403, error: 'Account is inactive', messageKey: 'message' };
      }
      const passwordOk = bcrypt.compareSync(password, row.password);
      if (!passwordOk) return { ok: false, status: 401, error: 'Invalid credentials', messageKey: 'message' };

      const token = jwt.sign(
        {
          id: row.id,
          email: row.email,
          full_name: row.full_name || '',
          role: 'customer'
        },
        secretKey,
        { expiresIn: '30d' }
      );
      return {
        ok: true,
        status: 200,
        data: { message: 'Login successful' },
        token,
        cookieMaxAgeMs: CUSTOMER_TOKEN_MAX_AGE_MS
      };
    } catch {
      return { ok: false, status: 500, error: 'Database error during login' };
    }
  },

  async resolveCustomerMe(customerSession) {
    if (!customerSession || customerSession?.role !== 'customer') {
      return { ok: true, status: 200, data: null };
    }

    try {
      const row = await customerRepository.findCustomerProfileById(customerSession.id);
      if (!row || Number(row.is_active) !== 1) {
        return { ok: true, status: 200, data: null, clearCookie: true };
      }
      return { ok: true, status: 200, data: row };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async updateOwnProfile(customerId, payload = {}) {
    try {
      await customerRepository.updateOwnProfile(customerId, payload);
      return { ok: true, status: 200, data: { message: 'Profile updated' } };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async listOwnOrders(customerId) {
    try {
      const rows = await customerRepository.listOrdersByCustomerId(customerId);
      return { ok: true, status: 200, data: rows };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async listCustomersForAdmin() {
    try {
      const rows = await customerRepository.listCustomersWithStats();
      return { ok: true, status: 200, data: rows };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async updateCustomerForAdmin(customerIdInput, payload = {}) {
    const customerId = Number(customerIdInput);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      return { ok: false, status: 400, error: 'Invalid customer id' };
    }

    const fields = [];
    const values = [];

    if (payload.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(String(payload.full_name || '').trim());
    }
    if (payload.phone !== undefined) {
      fields.push('phone = ?');
      values.push(String(payload.phone || '').trim());
    }
    if (payload.address !== undefined) {
      fields.push('address = ?');
      values.push(String(payload.address || '').trim());
    }
    if (payload.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(Number(payload.is_active) === 1 || payload.is_active === true ? 1 : 0);
    }

    if (fields.length === 0) {
      return { ok: false, status: 400, error: 'No fields to update' };
    }

    try {
      const result = await customerRepository.updateCustomerFields(customerId, fields, values);
      if (result.changes === 0) {
        return { ok: false, status: 404, error: 'Customer not found' };
      }
      return {
        ok: true,
        status: 200,
        data: { message: 'Customer updated successfully' },
        meta: { customerId, updatedFieldsCount: fields.length }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async listCustomerOrdersForAdmin(customerIdInput) {
    const customerId = Number(customerIdInput);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      return { ok: false, status: 400, error: 'Invalid customer id' };
    }

    try {
      const rows = await customerRepository.listOrdersByCustomerId(customerId);
      return { ok: true, status: 200, data: rows || [] };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async listWishlist(customerId) {
    try {
      const rows = await customerRepository.listWishlistByCustomerId(customerId);
      return { ok: true, status: 200, data: rows || [] };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async addWishlistItem(customerId, productIdInput) {
    const productId = Number(productIdInput);
    if (!productId) return { ok: false, status: 400, error: 'product_id is required' };

    try {
      const product = await customerRepository.findProductById(productId);
      if (!product) return { ok: false, status: 404, error: 'Product not found' };
      await customerRepository.addWishlistItem(customerId, productId);
      return {
        ok: true,
        status: 200,
        data: { message: 'Added to wishlist', product_id: productId }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async removeWishlistItem(customerId, productIdInput) {
    const productId = Number(productIdInput);
    if (!productId) return { ok: false, status: 400, error: 'Invalid product id' };

    try {
      const result = await customerRepository.removeWishlistItem(customerId, productId);
      return {
        ok: true,
        status: 200,
        data: { message: 'Removed from wishlist', product_id: productId, removed: result.changes || 0 }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  }
});
