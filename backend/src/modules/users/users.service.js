import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ALLOWED_ROLES = new Set(['admin', 'editor', 'cashier']);

const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const normalizeUsername = (value) => String(value || '').trim();
const normalizeFullName = (fullName, fallbackUsername = '') => {
  const cleaned = String(fullName || '').trim();
  if (cleaned) return cleaned;
  return normalizeUsername(fallbackUsername);
};

const isUniqueConstraintError = (error) => (
  error?.code === '23505'
  || String(error?.message || '').toLowerCase().includes('unique constraint')
  || String(error?.message || '').toLowerCase().includes('duplicate key')
);

export const createUserService = ({
  userRepository,
  saltRounds,
  secretKey
}) => ({
  async listUsers() {
    try {
      const rows = await userRepository.listUsers();
      const normalizedRows = rows.map((row) => ({
        ...row,
        full_name: normalizeFullName(row?.full_name, row?.username)
      }));
      return { ok: true, status: 200, data: normalizedRows };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async createUser(payload = {}) {
    const username = normalizeUsername(payload?.username);
    const password = String(payload?.password || '');
    const role = normalizeRole(payload?.role);
    const full_name = normalizeFullName(payload?.full_name, username);

    if (!username) return { ok: false, status: 400, error: 'Username is required' };
    if (!password || password.length < 6) return { ok: false, status: 400, error: 'Password must be at least 6 characters' };
    if (!ALLOWED_ROLES.has(role)) return { ok: false, status: 400, error: 'Invalid role' };

    try {
      const passwordHash = bcrypt.hashSync(password, saltRounds);
      const created = await userRepository.createUser({ username, passwordHash, role, full_name });
      return {
        ok: true,
        status: 200,
        data: { id: created.lastID, message: 'User created' },
        meta: { userId: created.lastID, username }
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return { ok: false, status: 409, error: 'Username already exists' };
      }
      return { ok: false, status: 500, error: 'Database error while creating user' };
    }
  },

  async updateUser({ targetId, payload = {}, requestUserId }) {
    const parsedTargetId = Number(targetId);
    if (!Number.isFinite(parsedTargetId) || parsedTargetId <= 0) {
      return { ok: false, status: 400, error: 'Invalid user id' };
    }

    let existing;
    try {
      existing = await userRepository.getUserById(parsedTargetId);
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
    if (!existing) return { ok: false, status: 404, error: 'User not found' };

    const { full_name, role, password } = payload;
    const fields = [];
    const params = [];

    if (full_name !== undefined) {
      const normalizedName = normalizeFullName(full_name, existing.username);
      fields.push('full_name = ?');
      params.push(normalizedName);
    }
    if (role !== undefined) {
      const normalizedRole = normalizeRole(role);
      if (!ALLOWED_ROLES.has(normalizedRole)) {
        return { ok: false, status: 400, error: 'Invalid role' };
      }
      fields.push('role = ?');
      params.push(normalizedRole);
    }
    if (password) {
      if (String(password).length < 6) {
        return { ok: false, status: 400, error: 'Password must be at least 6 characters' };
      }
      fields.push('password = ?');
      params.push(bcrypt.hashSync(password, saltRounds));
    }

    if (fields.length === 0) {
      return { ok: false, status: 400, error: 'No fields to update' };
    }

    try {
      const updated = await userRepository.updateUserFields(parsedTargetId, fields, params);
      if (!updated?.changes) return { ok: false, status: 404, error: 'User not found' };

      const row = await userRepository.getUserById(parsedTargetId);
      const normalizedRow = row
        ? {
            ...row,
            full_name: normalizeFullName(row?.full_name, row?.username)
          }
        : row;

      let newToken = null;
      if (parsedTargetId === requestUserId && normalizedRow) {
        newToken = jwt.sign(
          {
            id: normalizedRow.id,
            username: normalizedRow.username,
            role: normalizedRow.role,
            full_name: normalizedRow.full_name
          },
          secretKey,
          { expiresIn: '24h' }
        );
      }

      return {
        ok: true,
        status: 200,
        refreshedToken: newToken,
        data: { message: 'User updated', user: normalizedRow },
        meta: { targetId, full_name }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async deleteUser(targetId) {
    const parsedTargetId = Number(targetId);
    if (!Number.isFinite(parsedTargetId) || parsedTargetId <= 0) {
      return { ok: false, status: 400, error: 'Invalid user id' };
    }

    try {
      const existing = await userRepository.getUserById(parsedTargetId);
      if (!existing) return { ok: false, status: 404, error: 'User not found' };
      if (String(existing.username || '').toLowerCase() === 'admin') {
        return { ok: false, status: 400, error: 'Primary admin cannot be deleted' };
      }

      const deleted = await userRepository.deleteUserById(parsedTargetId);
      if (!deleted?.changes) return { ok: false, status: 404, error: 'User not found' };
      return { ok: true, status: 200, data: { message: 'User deleted' }, meta: { targetId: parsedTargetId } };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  }
});
