import { Router } from 'express';
import * as ImageController from '../controllers/ImageController';
import { authenticateToken } from '../middleware/authMiddleware';
import upload from '../config/multerConfig'; // Import configured multer instance

const router = Router();

// Apply authentication middleware to all image routes
router.use(authenticateToken);

// Define routes for image handling
// POST /api/images/upload - Handles single file upload with field name 'image'
router.post('/upload', upload.single('image'), ImageController.uploadImage);

// DELETE /api/images/:imageId - Deletes image record and file
router.delete('/:imageId', ImageController.deleteImage);

// GET /uploads/* will be handled by static file serving configured in server.ts

export default router;