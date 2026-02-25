import { storage } from './firebase-admin-simple';

/**
 * Upload base64 image to Firebase Storage (server-side)
 * Returns the public download URL
 */
export async function uploadImageToStorage(
  base64Data: string,
  folder: string,
  filename: string
): Promise<string> {
  try {
    // Remove data:image/xxx;base64, prefix if present
    const base64Match = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
    const base64String = base64Match ? base64Match[1] : base64Data;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64String, 'base64');

    // Create file path
    const filePath = `${folder}/${filename}`;
    const file = storage.bucket().file(filePath);

    // Upload file
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
      public: true, // Make file publicly accessible
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${filePath}`;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw new Error('Failed to upload image');
  }
}
