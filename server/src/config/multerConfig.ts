import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Define the destination directory for uploads
const uploadDir = path.join(__dirname, '../../uploads'); // Relative to dist/config after build

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Upload directory created: ${uploadDir}`);
} else {
  console.log(`Upload directory already exists: ${uploadDir}`);
}


// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Create a unique filename: timestamp-originalName.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `${uniqueSuffix}-${file.originalname.replace(extension, '')}${extension}`;
    cb(null, filename);
  }
});

// File filter function to accept only common image types
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.')); // Reject file
  }
};

// Create the multer instance with storage, file filter, and limits
const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10 MB file size limit
  }
});

export default upload;