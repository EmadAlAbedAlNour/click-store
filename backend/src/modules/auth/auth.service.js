import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const STAFF_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24;

export const createAuthService = ({
  authRepository,
  secretKey,
  saltRounds
}) => ({
  async login(payload = {}) {
    const username = String(payload?.username || '').trim();
    const password = String(payload?.password || '');

    if (!username || !password) {
      return { ok: false, status: 401, error: 'خطأ في اسم المستخدم أو كلمة المرور', key: 'message' };
    }

    let row;
    try {
      row = await authRepository.findUserByUsername(username);
    } catch {
      return { ok: false, status: 500, error: 'Database error during login', key: 'error' };
    }

    if (!row) {
      return { ok: false, status: 401, error: 'خطأ في اسم المستخدم أو كلمة المرور', key: 'message' };
    }

    const isHashed = row.password?.startsWith('$2');
    const passwordOk = isHashed ? bcrypt.compareSync(password, row.password) : row.password === password;
    if (!passwordOk) {
      return { ok: false, status: 401, error: 'خطأ في اسم المستخدم أو كلمة المرور', key: 'message' };
    }

    if (!isHashed) {
      const newHash = bcrypt.hashSync(password, saltRounds);
      authRepository.upgradePasswordHash(row.id, newHash).catch(() => {
        // Preserve previous behavior: login succeeds even if background hash upgrade fails.
      });
    }

    const token = jwt.sign(
      {
        id: row.id,
        username: row.username,
        role: row.role,
        full_name: row.full_name
      },
      secretKey,
      { expiresIn: '24h' }
    );

    return {
      ok: true,
      status: 200,
      token,
      cookieMaxAgeMs: STAFF_TOKEN_MAX_AGE_MS,
      data: {
        message: 'Login successful',
        role: row.role,
        full_name: row.full_name
      }
    };
  },

  async resolveMe(sessionUser) {
    if (!sessionUser || sessionUser?.role === 'customer') {
      return { ok: true, status: 200, data: null };
    }

    try {
      const row = await authRepository.findStaffSessionUserById(sessionUser.id);
      if (!row) {
        return { ok: true, status: 200, data: null, clearCookie: true };
      }
      return {
        ok: true,
        status: 200,
        data: {
          id: row.id,
          username: row.username || '',
          role: row.role,
          full_name: row.full_name || row.username || ''
        }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message, key: 'error' };
    }
  },

  logout() {
    return { ok: true, status: 200, data: { message: 'Logged out' } };
  }
});
