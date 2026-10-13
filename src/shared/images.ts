/**
 * Image processing utilities for Aura CAD
 * Compresses images client-side into lightweight base64 Data URLs (<60KB)
 * for instant offline caching, Tauri webview compatibility, and zero-latency persistence.
 */

export async function compressImage(
  file: File,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use webp if supported, otherwise jpeg
        try {
          const webp = canvas.toDataURL('image/webp', quality);
          if (webp.startsWith('data:image/webp')) {
            resolve(webp);
            return;
          }
        } catch {
          // fallback
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function processImageUploads(
  files: FileList | File[],
  currentCount = 0,
  maxAllowed = 5
): Promise<string[]> {
  const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
  const remainingSlots = Math.max(0, maxAllowed - currentCount);
  const toProcess = fileArray.slice(0, remainingSlots);

  const compressedPromises = toProcess.map((file) => compressImage(file));
  return Promise.all(compressedPromises);
}
