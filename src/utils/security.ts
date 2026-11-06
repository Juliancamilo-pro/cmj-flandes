/**
 * Security, Privacy, and Anti-Abuse Utilities for Julian Camilo Editorial Platform
 */

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];

/**
 * Validates and sanitizes external URLs to prevent XSS / open-redirect / malicious links.
 * Allows http://, https://, mailto:, tel:, and relative paths starting with /.
 */
export function sanitizeSafeUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Allow relative internal paths
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  for (const proto of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      return '';
    }
  }

  // If no protocol is provided, prepend https://
  if (!/^https?:\/\//i.test(trimmed) && !/^mailto:/i.test(trimmed) && !/^tel:/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Checks if a URL is valid and safe without modifying it, returning true if empty (optional) or valid.
 */
export function isValidOptionalUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || !rawUrl.trim()) return true;
  return sanitizeSafeUrl(rawUrl) !== '';
}

/**
 * Sanitizes plain text input by stripping HTML tags and enforcing max length.
 */
export function sanitizePlainText(input: string, maxLength = 2000): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates an uploaded image file against allowed MIME types and maximum size.
 */
export function validateImageFile(
  file: File,
  maxSizeMB = 5
): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato de archivo no permitido. Solo se aceptan imágenes JPG, PNG, WebP o GIF.'
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `La imagen supera el tamaño máximo permitido de ${maxSizeMB} MB.`
    };
  }

  return { valid: true };
}

/**
 * Client-side anti-spam rate limiter for public forms.
 * Prevents rapid-fire automated submissions.
 */
export function checkFormRateLimit(
  formKey: string,
  cooldownMs = 10000
): { allowed: boolean; waitSeconds: number } {
  try {
    const storageKey = `jc_rate_limit_${formKey}`;
    const lastSubmit = localStorage.getItem(storageKey);
    const now = Date.now();
    if (lastSubmit) {
      const elapsed = now - Number(lastSubmit);
      if (elapsed < cooldownMs) {
        return {
          allowed: false,
          waitSeconds: Math.ceil((cooldownMs - elapsed) / 1000)
        };
      }
    }
    localStorage.setItem(storageKey, String(now));
    return { allowed: true, waitSeconds: 0 };
  } catch {
    return { allowed: true, waitSeconds: 0 };
  }
}
