/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Drive 1P Integration Service for Julian Camilo Editorial Platform
 * Conforms to Google Workspace API Integration specifications
 */

import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Article, PlatformSettings } from '../types';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  iconLink?: string;
}

// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Create provider with Google Drive scopes
function getDriveProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  GOOGLE_DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'online'
  });
  return provider;
}

/**
 * Initialize Google Drive auth state listener
 */
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Drive scopes via popup
 */
export const signInGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = getDriveProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso para Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve active Drive access token
 */
export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Disconnect Google Drive session
 */
export const disconnectDrive = async (): Promise<void> => {
  cachedAccessToken = null;
};

/**
 * List files from Google Drive
 */
export const listDriveFiles = async (options?: {
  pageSize?: number;
  query?: string;
  mimeTypeFilter?: 'all' | 'images' | 'documents';
}): Promise<DriveFileItem[]> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Se requiere autenticación con Google Drive.');
  }

  const pageSize = options?.pageSize || 30;
  let qParts = ["trashed = false"];

  if (options?.mimeTypeFilter === 'images') {
    qParts.push("mimeType contains 'image/'");
  } else if (options?.mimeTypeFilter === 'documents') {
    qParts.push("(mimeType contains 'document' or mimeType contains 'pdf' or mimeType contains 'text')");
  }

  if (options?.query?.trim()) {
    qParts.push(`name contains '${options.query.trim().replace(/'/g, "\\'")}'`);
  }

  const q = encodeURIComponent(qParts.join(' and '));
  const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,size,createdTime,modifiedTime,iconLink)');
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${q}&fields=${fields}&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('La sesión de Google Drive ha expirado. Por favor inicia sesión nuevamente.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Error al consultar archivos de Google Drive.');
  }

  const json = await res.json();
  return (json.files || []) as DriveFileItem[];
};

/**
 * Uploads a file directly to Google Drive
 */
export const uploadFileToDrive = async (
  file: File,
  folderName: string = 'Julian Camilo - Plataforma Editorial'
): Promise<DriveFileItem> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Se requiere autenticación con Google Drive.');
  }

  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    description: `Subido desde la plataforma editorial Julian Camilo el ${new Date().toLocaleDateString('es-CO')}`
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webContentLink,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'No fue posible subir el archivo a Google Drive.');
  }

  return (await res.json()) as DriveFileItem;
};

/**
 * Backs up editorial content (articles, metadata) to a JSON file in Google Drive
 */
export const createDriveEditorialBackup = async (
  articles: Article[],
  settings?: PlatformSettings | null
): Promise<DriveFileItem> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Se requiere autenticación con Google Drive.');
  }

  const backupData = {
    title: 'Copia de Respaldo Editorial - Julian Camilo',
    exportDate: new Date().toISOString(),
    totalArticles: articles.length,
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      subtitle: a.subtitle,
      content: a.content,
      categoryId: a.categoryId,
      categoryName: a.categoryName,
      status: a.status,
      coverImageUrl: a.coverImageUrl,
      createdAt: a.createdAt,
      publishedAt: a.publishedAt
    })),
    platformSettings: settings || {}
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const filename = `Respaldo_Editorial_Julian_Camilo_${new Date().toISOString().split('T')[0]}.json`;

  const metadata = {
    name: filename,
    mimeType: 'application/json',
    description: 'Copia de seguridad editorial completa de Julian Camilo Plataforma Editorial'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al guardar la copia de respaldo en Google Drive.');
  }

  return (await res.json()) as DriveFileItem;
};

/**
 * Delete a file in Google Drive (Requires user confirmation in UI before calling)
 */
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Se requiere autenticación con Google Drive.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'No fue posible eliminar el archivo en Google Drive.');
  }
};
