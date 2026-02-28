export const createCouponService = ({ couponRepository }) => ({
  async listCoupons() {
    try {
      const rows = await couponRepository.listAll();
      return { ok: true, status: 200, data: rows };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async createCoupon(payload = {}) {
    const code = String(payload.code || '').trim();
    const type = String(payload.type || '').trim().toLowerCase();
    const value = Number(payload.value);

    if (!code) {
      return { ok: false, status: 400, error: 'Coupon code is required' };
    }

    if (!['fixed', 'percent'].includes(type)) {
      return { ok: false, status: 400, error: 'Coupon type must be fixed or percent' };
    }

    if (!Number.isFinite(value) || value <= 0) {
      return { ok: false, status: 400, error: 'Coupon value must be a positive number' };
    }

    if (type === 'percent' && value > 100) {
      return { ok: false, status: 400, error: 'Percent coupon value cannot exceed 100' };
    }

    try {
      const result = await couponRepository.create({ code, type, value });
      return {
        ok: true,
        status: 200,
        data: { id: result.lastID, message: 'Coupon created' }
      };
    } catch {
      return { ok: false, status: 500, error: 'Coupon code likely exists' };
    }
  },

  async validateCoupon(payload = {}) {
    const code = String(payload.code || '').trim();
    if (!code) {
      return { ok: false, status: 400, error: 'Coupon code is required' };
    }

    try {
      const row = await couponRepository.findActiveByCode(code);
      if (!row) {
        return { ok: false, status: 404, error: 'Invalid or expired coupon' };
      }
      return { ok: true, status: 200, data: row };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async deleteCoupon(idInput) {
    const id = Number(idInput);
    if (!Number.isFinite(id) || id <= 0) {
      return { ok: false, status: 400, error: 'Invalid coupon id' };
    }

    try {
      await couponRepository.deleteById(id);
      return { ok: true, status: 200, data: { message: 'Coupon deleted' } };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  }
});
