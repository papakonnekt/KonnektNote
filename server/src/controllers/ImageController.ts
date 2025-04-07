import { Request, Response, NextFunction } from 'express';
import * as ImageService from '../services/ImageService';
import upload from '../config/multerConfig'; // Import configured multer instance
// Uses global augmentation for req.user

// Controller to handle single image upload
export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No image file uploaded' });
      return;
    }

    // Extract necessary data from multer's req.file
    const fileData: ImageService.NewImageData = {
      filename: req.file.originalname,
      path: req.file.path, // Absolute path from multer
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const newImageRecord = await ImageService.createImageRecord(userId, fileData);

    // Construct the public URL path
    const imageUrl = ImageService.getImageUrl(newImageRecord.filepath);

    // Return the image metadata including the URL path
    res.status(201).json({
        id: newImageRecord.id,
        filename: newImageRecord.filename,
        mimetype: newImageRecord.mimetype,
        size: newImageRecord.size,
        url: imageUrl, // Send back the relative URL path
        created_at: newImageRecord.created_at,
    });

  } catch (error) {
     // Handle potential multer errors (e.g., file size limit)
     if (error instanceof Error && error.message.includes('File too large')) {
        res.status(400).json({ message: 'File too large. Maximum size allowed is 10MB.' });
     } else if (error instanceof Error && error.message.includes('Invalid file type')) {
        res.status(400).json({ message: error.message });
     }
     else {
        next(error); // Pass other errors to the global handler
     }
  }
}

// Controller to handle image deletion
export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;
        const imageId = parseInt(req.params.imageId, 10);

        if (!userId) {
          res.status(401).json({ message: 'User not authenticated' });
          return;
        }
        if (isNaN(imageId)) {
            res.status(400).json({ message: 'Invalid image ID format' });
            return;
        }

        // Pass only imageId as userId check is implicit now
        const deletedCount = await ImageService.deleteImageRecord(imageId);

        if (deletedCount === 0) {
          res.status(404).json({ message: 'Image not found or access denied' });
        } else {
          res.status(204).send(); // No content on successful deletion
        }
    } catch (error) {
        next(error);
    }
}

// Note: Image retrieval is handled by serving static files from /uploads
// No specific controller needed for GET /api/images/:imageId if using static serving.