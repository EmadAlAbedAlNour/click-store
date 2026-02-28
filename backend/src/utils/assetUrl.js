const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const isRelativeUploadAssetPath = (value) => {
  const raw = String(value ?? '').trim();
  return /^\/uploads\/.+/i.test(raw);
};

const hasUploadsPrefix = (value) => /^uploads\/.+/i.test(value);

const normalizeUploadsPath = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (isRelativeUploadAssetPath(raw)) return raw;
  if (hasUploadsPrefix(raw)) return `/${raw}`;
  return raw;
};

export const normalizeUploadAssetUrl = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const normalizedRelative = normalizeUploadsPath(raw);
  if (normalizedRelative !== raw) return normalizedRelative;

  if (raw.startsWith('/')) return raw;

  try {
    const parsed = new URL(raw);
    const host = String(parsed.hostname || '').toLowerCase();
    const path = normalizeUploadsPath(parsed.pathname || '');
    if (LOCALHOST_HOSTNAMES.has(host) && isRelativeUploadAssetPath(path)) {
      return `${path}${parsed.search || ''}${parsed.hash || ''}`;
    }
  } catch {
    return raw;
  }

  return raw;
};
