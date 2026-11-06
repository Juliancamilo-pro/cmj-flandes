import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { UploadProgressItem, UploadStatus } from '../types';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
];

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  format: 'webp' | 'jpeg';
}

export interface UploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

// Active tasks registry to support cancellation
const activeUploadTasks = new Map<string, UploadTask>();

/**
 * Validates file format, extension, and basic sanity.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No se ha seleccionado ningún archivo.' };
  }

  // Check extension
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Formato de archivo .${ext} no admitido. Formatos válidos: JPG, PNG, WebP y AVIF.`
    };
  }

  // Check MIME type
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo MIME no compatible (${file.type}). Solo se admiten imágenes JPG, PNG, WebP o AVIF.`
    };
  }

  // Maximum raw file size before compression: 30 MB
  const maxBytes = 30 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: 'La imagen supera el límite máximo de 30 MB.'
    };
  }

  return { valid: true };
}

/**
 * Generate a unique fingerprint to detect duplicates.
 */
export async function computeFileHash(file: File): Promise<string> {
  try {
    const slice = file.slice(0, 64 * 1024); // First 64KB for speed
    const buffer = await slice.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    return `${file.size}_${hashHex}`;
  } catch (e) {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
}

/**
 * Reads an image file into an HTMLImageElement with integrity validation.
 */
export function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen. Es posible que esté dañado.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo seleccionado no es una imagen válida o está dañado.'));
      img.onload = () => {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error('La imagen no contiene dimensiones válidas.'));
          return;
        }
        resolve(img);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses, optimizes and generates high-efficiency WebP/JPEG + thumbnail.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.84
): Promise<ProcessedImage> {
  const img = await loadImageElement(file);

  let { naturalWidth: width, naturalHeight: height } = img;

  // Scale down if larger than maximum boundaries
  if (width > maxWidth || height > maxHeight) {
    if (width / maxWidth > height / maxHeight) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  // 1. Generate full-size optimized image
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el procesador de imágenes en el navegador.');
  }

  // Smooth rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Attempt WebP output first (best compression)
  let format: 'webp' | 'jpeg' = 'webp';
  let dataUrl = canvas.toDataURL('image/webp', quality);
  if (!dataUrl.startsWith('data:image/webp')) {
    format = 'jpeg';
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  // Convert full image to Blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || new Blob()),
      format === 'webp' ? 'image/webp' : 'image/jpeg',
      quality
    );
  });

  // 2. Generate micro-thumbnail (200px width)
  const thumbWidth = Math.min(240, width);
  const thumbHeight = Math.round((height * thumbWidth) / width);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  let thumbnailUrl = '';
  if (thumbCtx) {
    thumbCtx.imageSmoothingEnabled = true;
    thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
    thumbnailUrl = thumbCanvas.toDataURL('image/webp', 0.65);
  } else {
    thumbnailUrl = dataUrl;
  }

  return {
    blob,
    dataUrl,
    thumbnailUrl,
    width,
    height,
    originalSize: file.size,
    optimizedSize: blob.size,
    format
  };
}

/**
 * Adaptively compresses an image so its Data URL fits safely under maxBytes (e.g., 650 KB for Firestore).
 */
async function compressToSafeDataUrl(
  img: HTMLImageElement,
  initialWidth: number,
  initialHeight: number,
  format: 'webp' | 'jpeg',
  maxDataUrlBytes = 650 * 1024
): Promise<{ dataUrl: string; width: number; height: number; size: number }> {
  let w = initialWidth;
  let h = initialHeight;
  let q = 0.82;
  const mime = format === 'webp' ? 'image/webp' : 'image/jpeg';

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, w);
    canvas.height = Math.max(1, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) break;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const dataUrl = canvas.toDataURL(mime, q);
    const approxBytes = Math.round((dataUrl.length * 3) / 4);
    if (approxBytes <= maxDataUrlBytes || attempt === 5) {
      return { dataUrl, width: w, height: h, size: approxBytes };
    }

    // Reduce quality first, then dimensions
    if (q > 0.55) {
      q = Math.max(0.5, q - 0.14);
    } else {
      w = Math.round(w * 0.78);
      h = Math.round(h * 0.78);
    }
  }

  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = Math.max(1, Math.min(800, initialWidth));
  fallbackCanvas.height = Math.max(1, Math.round((initialHeight * fallbackCanvas.width) / initialWidth));
  const fCtx = fallbackCanvas.getContext('2d');
  fCtx?.drawImage(img, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
  const fallbackUrl = fallbackCanvas.toDataURL('image/jpeg', 0.65);
  return {
    dataUrl: fallbackUrl,
    width: fallbackCanvas.width,
    height: fallbackCanvas.height,
    size: Math.round((fallbackUrl.length * 3) / 4)
  };
}

/**
 * Uploads an image with real progress tracking, stall protection, resumability, and abort support.
 */
export async function uploadImageWithProgress(
  file: File,
  uploadId: string,
  options: UploadOptions = {}
): Promise<{ url: string; optimized: ProcessedImage; storageProvider: 'firebase_storage' | 'firestore_media' }> {
  const { folder = 'articles', maxWidth = 1920, maxHeight = 1920, quality = 0.84, onProgress, signal } = options;

  // 1. Validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (signal?.aborted) {
    throw new Error('Subida cancelada por el usuario.');
  }

  onProgress?.(10); // 10% - Optimizing image

  // 2. Client-side optimization (compression, WebP, thumbnail)
  const optimized = await optimizeImage(file, maxWidth, maxHeight, quality);

  if (signal?.aborted) {
    throw new Error('Subida cancelada por el usuario.');
  }

  onProgress?.(25); // 25% - Compression complete

  // 3. Attempt direct Firebase Storage upload with stall protection (prevents 25% hang)
  try {
    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\.[^/.]+$/, '')}.${optimized.format}`;
    const storageRef = ref(storage, `${folder}/${cleanFileName}`);

    const uploadTask = uploadBytesResumable(storageRef, optimized.blob, {
      contentType: optimized.format === 'webp' ? 'image/webp' : 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        width: String(optimized.width),
        height: String(optimized.height)
      }
    });

    activeUploadTasks.set(uploadId, uploadTask);

    if (signal?.aborted) {
      uploadTask.cancel();
      activeUploadTasks.delete(uploadId);
      throw new Error('Subida cancelada por el usuario.');
    }

    signal?.addEventListener('abort', () => {
      uploadTask.cancel();
      activeUploadTasks.delete(uploadId);
    });

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      let lastBytes = 0;
      // Stall guard: if 0 bytes transferred after 6 seconds, abort stalled Storage task and use Firestore-safe storage
      const stallTimer = setTimeout(() => {
        if (lastBytes === 0) {
          uploadTask.cancel();
          reject(new Error('STORAGE_STALLED'));
        }
      }, 6000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          lastBytes = snapshot.bytesTransferred;
          if (snapshot.totalBytes > 0) {
            if (snapshot.bytesTransferred > 0) {
              clearTimeout(stallTimer);
            }
            // Map 25% - 95% to real network progress
            const netPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 70;
            const totalPercent = Math.min(95, Math.round(25 + netPercent));
            onProgress?.(totalPercent);
          }
        },
        (error) => {
          clearTimeout(stallTimer);
          activeUploadTasks.delete(uploadId);
          reject(error);
        },
        async () => {
          clearTimeout(stallTimer);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            activeUploadTasks.delete(uploadId);
            onProgress?.(100);
            resolve(url);
          } catch (urlErr) {
            activeUploadTasks.delete(uploadId);
            reject(urlErr);
          }
        }
      );
    });

    return { url: downloadUrl, optimized, storageProvider: 'firebase_storage' };
  } catch (storageError: any) {
    activeUploadTasks.delete(uploadId);

    // If cancelled intentionally by user
    if (signal?.aborted || (storageError?.code === 'storage/canceled' && storageError?.message !== 'STORAGE_STALLED')) {
      throw new Error('Subida cancelada por el usuario.');
    }

    // Adaptive Firestore-safe compression (< 650 KB) with real progress steps
    onProgress?.(55);
    const img = await loadImageElement(file);
    if (signal?.aborted) {
      throw new Error('Subida cancelada por el usuario.');
    }
    onProgress?.(80);
    const safeCompressed = await compressToSafeDataUrl(
      img,
      optimized.width,
      optimized.height,
      optimized.format,
      650 * 1024
    );
    onProgress?.(100);

    return {
      url: safeCompressed.dataUrl,
      optimized: {
        ...optimized,
        dataUrl: safeCompressed.dataUrl,
        width: safeCompressed.width,
        height: safeCompressed.height,
        optimizedSize: safeCompressed.size
      },
      storageProvider: 'firestore_media'
    };
  }
}

/**
 * Cancel an active upload task by ID.
 */
export function cancelActiveUpload(uploadId: string): boolean {
  const task = activeUploadTasks.get(uploadId);
  if (task) {
    task.cancel();
    activeUploadTasks.delete(uploadId);
    return true;
  }
  return false;
}

/**
 * Format bytes to readable human format (KB, MB).
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
