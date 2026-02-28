import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, '../../storage/uploads');

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mimeTypeToExtension = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const sanitizeBaseName = (value) => {
  const raw = String(value || '').trim();
  const parsedBase = path.parse(raw).name || 'image';
  const cleaned = parsedBase
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 80);

  return cleaned || 'image';
};

const resolveSafeExtension = (file) => {
  const originalExt = String(path.extname(file?.originalname || '') || '').toLowerCase();
  if (originalExt === '.jpg' || originalExt === '.jpeg') return '.jpg';
  if (originalExt === '.png') return '.png';
  if (originalExt === '.webp') return '.webp';
  return mimeTypeToExtension[String(file?.mimetype || '').toLowerCase()] || '.jpg';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDirectory),
  filename: (req, file, cb) => {
    const safeBaseName = sanitizeBaseName(file?.originalname);
    const safeExtension = resolveSafeExtension(file);
    cb(null, `${Date.now()}-${safeBaseName}${safeExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(String(file.mimetype || '').toLowerCase())) {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES
  }
});

export default upload;
