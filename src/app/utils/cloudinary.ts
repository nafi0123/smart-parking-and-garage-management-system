import { Readable } from 'node:stream';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import multer from 'multer';
import AppError from '../errors/AppError';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit per image
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image files (JPG, PNG, WEBP, etc.) are allowed!'));
    }
  },
});

/**
 * Upload a single buffer to Cloudinary
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder = 'smart_parking/garages',
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(new AppError(500, `Cloudinary upload failed: ${error.message}`));
        }
        if (!result) {
          return reject(new AppError(500, 'Cloudinary upload failed: No response'));
        }
        resolve(result);
      },
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Upload multiple files to Cloudinary and return array of secure URLs
 */
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder = 'smart_parking/garages',
): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) => uploadBufferToCloudinary(file.buffer, folder));
  const results = await Promise.all(uploadPromises);
  return results.map((res) => res.secure_url);
};

export default cloudinary;
