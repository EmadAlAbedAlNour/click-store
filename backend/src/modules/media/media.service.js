import { isRelativeUploadAssetPath, normalizeUploadAssetUrl } from '../../utils/assetUrl.js';

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const mediaFilenameFromUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'external-image';

  if (raw.startsWith('/')) {
    const candidate = decodeURIComponent(raw.split('?')[0].split('#')[0] || '')
      .split('/')
      .filter(Boolean)
      .pop();
    if (candidate && candidate.trim()) return candidate.trim().slice(0, 255);
    return 'external-image';
  }

  try {
    const parsed = new URL(raw);
    const candidate = decodeURIComponent(parsed.pathname || '')
      .split('/')
      .filter(Boolean)
      .pop();
    if (candidate && candidate.trim()) return candidate.trim().slice(0, 255);
  } catch {
    // ignore
  }
  return 'external-image';
};

export const createMediaService = ({ mediaRepository }) => ({
  async uploadFile({ file }) {
    if (!file) {
      return { ok: false, status: 400, error: 'No file uploaded' };
    }

    const fileUrl = normalizeUploadAssetUrl(`/uploads/${file.filename}`);
    const fileName = file.filename;
    const mimeType = file.mimetype || '';

    try {
      const created = await mediaRepository.createMedia({
        url: fileUrl,
        filename: fileName,
        mime_type: mimeType
      });
      return {
        ok: true,
        status: 200,
        data: {
          id: created.lastID,
          url: fileUrl,
          filename: fileName,
          mime_type: mimeType,
          message: 'File uploaded successfully'
        }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async addExternalLink(urlInput) {
    const normalizedUrl = normalizeUploadAssetUrl(urlInput);
    const isLocalUploadPath = isRelativeUploadAssetPath(normalizedUrl);
    if (!normalizedUrl || (!isLocalUploadPath && !isValidHttpUrl(normalizedUrl))) {
      return { ok: false, status: 400, error: 'Valid image URL is required' };
    }

    const fileName = mediaFilenameFromUrl(normalizedUrl);
    const mimeType = isLocalUploadPath ? 'image/upload' : 'external/link';

    try {
      const created = await mediaRepository.createMedia({
        url: normalizedUrl,
        filename: fileName,
        mime_type: mimeType
      });

      return {
        ok: true,
        status: 200,
        data: {
          id: created.lastID,
          url: normalizedUrl,
          filename: fileName,
          mime_type: mimeType,
          message: 'External image saved successfully'
        }
      };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  },

  async listMedia() {
    try {
      const rows = await mediaRepository.listMedia();
      const normalizedRows = rows.map((row) => ({
        ...row,
        url: normalizeUploadAssetUrl(row?.url)
      }));
      return { ok: true, status: 200, data: normalizedRows };
    } catch (error) {
      return { ok: false, status: 500, error: error.message };
    }
  }
});
