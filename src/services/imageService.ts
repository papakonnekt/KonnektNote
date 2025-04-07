import apiClient from './apiClient';

// Interface for the response from the upload endpoint
interface UploadedImage {
  id: number;
  filename: string;
  mimetype: string;
  size: number;
  url: string; // Relative URL path like /uploads/filename.ext
  created_at: string;
}

/**
 * Uploads an image file to the server.
 * @param file - The image File object to upload.
 * @returns The metadata of the uploaded image, including its ID and URL path.
 */
export const uploadImage = async (file: File): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append('image', file); // 'image' must match the field name expected by multer on the backend

  const response = await apiClient.post<UploadedImage>('/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important for file uploads
    },
  });
  return response.data;
};

/**
 * Deletes an image from the server.
 * @param imageId - The ID of the image to delete.
 */
export const deleteImage = async (imageId: number): Promise<void> => {
  await apiClient.delete(`/images/${imageId}`);
};

/**
 * Constructs the full URL for displaying an image.
 * Uses the API base URL configured in apiClient.
 * @param relativeUrlPath - The relative URL path returned by the upload endpoint (e.g., /uploads/...).
 * @returns The full absolute URL to the image.
 */
export const getImageUrl = (relativeUrlPath: string | null | undefined): string | null => {
    if (!relativeUrlPath) {
        return null;
    }
    // Ensure the base URL doesn't end with '/api' if the relative path starts with '/uploads'
    const baseUrl = apiClient.defaults.baseURL?.replace(/\/api$/, '') || '';
    // Ensure the relative path starts with a slash
    const cleanRelativePath = relativeUrlPath.startsWith('/') ? relativeUrlPath : `/${relativeUrlPath}`;
    return `${baseUrl}${cleanRelativePath}`;
};