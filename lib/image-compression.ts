/**
 * Compress base64 image to reduce size
 * Returns compressed base64 string
 */
export function compressBase64Image(
  base64Data: string,
  maxSizeKB: number = 400
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();

    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions (reduce size if too large)
      let width = img.width;
      let height = img.height;
      const maxDimension = 1200; // Max width or height

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to meet size requirement
      let quality = 0.8;
      let compressed = canvas.toDataURL('image/jpeg', quality);

      // Reduce quality until size is acceptable
      while (compressed.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(compressed);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = base64Data;
  });
}
