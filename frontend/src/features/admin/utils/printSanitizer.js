const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_COLOR = /^rgba?\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i;
const HSL_COLOR = /^hsla?\(\s*(?:360|3[0-5]\d|[12]?\d?\d)(?:deg)?\s*,\s*(?:100|[1-9]?\d)%\s*,\s*(?:100|[1-9]?\d)%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i;
const NAMED_COLOR = /^[a-z]{3,20}$/i;

export const escapeHtml = (value) => (
  String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char])
);

export const escapeHtmlWithBreaks = (value) => (
  escapeHtml(value).replace(/\r\n|\r|\n/g, '<br/>')
);

export const sanitizePrintImageUrl = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  if (normalized.startsWith('/') && !normalized.startsWith('//')) return normalized;

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(normalized, base);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return normalized;
    }
  } catch {
    return '';
  }

  return '';
};

export const sanitizeCssColor = (value, fallback = '#2563eb') => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return fallback;
  if (HEX_COLOR.test(normalized) || RGB_COLOR.test(normalized) || HSL_COLOR.test(normalized) || NAMED_COLOR.test(normalized)) {
    return normalized;
  }
  return fallback;
};
