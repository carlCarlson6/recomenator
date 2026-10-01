import {
  isAvatarContentType,
  MAX_AVATAR_BYTES,
  type AvatarContentType,
} from '#/modules/commands/groups/domain/avatarRules.js';

export const AVATAR_MAX_DIMENSION = 512;

const OUTPUT_QUALITY = 0.85;

export type ProcessedAvatar = {
  blob: Blob;
  contentType: AvatarContentType;
};

export function validateAvatarFile(file: File): string | null {
  if (!isAvatarContentType(file.type)) {
    return 'Please choose a JPEG, PNG, WebP, or AVIF image.';
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'Images must be 5 MB or smaller.';
  }
  return null;
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall back to an <img> decode below
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not read image'));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Re-encodes an avatar client-side: caps the longest edge, strips EXIF
 * metadata and keeps the upload small. Falls back to JPEG when the browser
 * cannot encode WebP.
 */
export async function processAvatarImage(file: File): Promise<ProcessedAvatar> {
  const image = await loadImage(file);
  const sourceWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const sourceHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  if (!sourceWidth || !sourceHeight) throw new Error('Could not read image dimensions');

  const scale = Math.min(1, AVATAR_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process image');
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  if (!(image instanceof HTMLImageElement)) image.close();

  const webp = await canvasToBlob(canvas, 'image/webp', OUTPUT_QUALITY);
  if (webp) return { blob: webp, contentType: 'image/webp' };

  const jpeg = await canvasToBlob(canvas, 'image/jpeg', OUTPUT_QUALITY);
  if (jpeg) return { blob: jpeg, contentType: 'image/jpeg' };

  throw new Error('Could not encode image');
}
