import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const multerOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      const uniqueName = `photo-${Date.now()}-${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          'Only JPG, PNG, and WebP image files are allowed.',
        ),
        false,
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};

export function getPhotoUrl(filename: string): string {
  const base =
    process.env.LOCAL_UPLOAD_BASE_URL || 'http://localhost:8000/uploads';
  return `${base}/${filename}`;
}
