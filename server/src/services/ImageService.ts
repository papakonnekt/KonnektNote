import db from '../db'; // Knex instance
import fs from 'fs/promises'; // Use promises version of fs
import path from 'path';

// Define the structure of an Image record
export interface Image {
  id: number;
  // user_id: number; // Removed as per revised plan
  filename: string; // Original filename
  filepath: string; // Path relative to uploads dir
  mimetype: string;
  size: number;
  created_at: string;
  deleted_at?: string | Date | null; // Add deleted_at
}

// Data needed when creating an image record (comes from multer's req.file)
export interface NewImageData {
  filename: string;
  path: string; // Note: multer provides absolute path, we need relative
  mimetype: string;
  size: number;
}

const TABLE_NAME = 'images';
const UPLOAD_DIR = path.join(__dirname, '../../uploads'); // Base directory for uploads

/**
 * Creates a new image metadata record in the database.
 * @param userId - The ID of the user uploading the image (kept for potential future use/logging, but not stored on table).
 * @param fileData - The file information from multer (req.file).
 * @returns The newly created image record.
 */
export async function createImageRecord(userId: number, fileData: NewImageData): Promise<Image> {
  // Convert absolute filepath from multer to relative path for storage
  const relativePath = path.relative(UPLOAD_DIR, fileData.path);

  const [newImage] = await db(TABLE_NAME)
    .insert({
      // user_id: userId, // Removed
      filename: fileData.filename, // Original filename
      filepath: relativePath,      // Store relative path
      mimetype: fileData.mimetype,
      size: fileData.size,
    })
    .returning('*');
  return newImage;
}

/**
 * Retrieves image metadata by its ID.
 * Ownership should be checked by the entity linking to the image.
 * @param imageId - The ID of the image to retrieve.
 * @returns The image record if found and not deleted, otherwise undefined.
 */
export async function getImageRecord(imageId: number): Promise<Image | undefined> {
  return db(TABLE_NAME)
    .where({ id: imageId })
    .whereNull('deleted_at') // Exclude deleted
    .first();
}

/**
 * Soft deletes an image record from the database. Does NOT delete the physical file.
 * @param imageId - The ID of the image to soft delete.
 * @returns The number of database rows updated (0 or 1).
 */
export async function deleteImageRecord(imageId: number): Promise<number> {
  // Note: This only soft deletes the record. File cleanup might need a separate process.
  // Check if record exists and is not already deleted
  const imageRecord = await db(TABLE_NAME).where({ id: imageId }).whereNull('deleted_at').first('id');

  if (!imageRecord) {
    console.log(`Image record not found or already deleted for ID: ${imageId}`);
    return 0; // Not found or already deleted
  }

  // Soft delete the database record
  const deletedCount = await db(TABLE_NAME)
    .where({ id: imageId })
    .update({ deleted_at: db.fn.now() });

  if (deletedCount > 0) {
      console.log(`Soft deleted image record ID: ${imageId}.`);
  }

  return deletedCount;
}

/**
 * Helper function to construct the public URL for an image based on its relative path.
 * Assumes images are served statically from '/uploads'.
 * @param relativePath - The relative path stored in the database.
 * @returns The public URL path for the image, or null if input is invalid.
 */
export function getImageUrl(relativePath: string | null | undefined): string | null {
    if (!relativePath) {
        return null;
    }
    // Ensure forward slashes for URL consistency, even on Windows
    const urlPath = relativePath.replace(/\\/g, '/');
    // Ensure the path starts with a single slash
    return `/uploads/${urlPath.startsWith('/') ? urlPath.substring(1) : urlPath}`;
}