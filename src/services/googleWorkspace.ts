import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.spaces.create',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.memberships',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
// In-memory access token cache ONLY (never localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Workspace.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogleWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getWorkspaceAccessToken = (): string | null => cachedAccessToken;

async function googleApiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (!cachedAccessToken) {
    throw new Error('Debes iniciar sesión con Google para acceder a Google Docs y Google Chat.');
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Error ${res.status} en Google Workspace API.`);
  }
  return data as T;
}

/* =========================================================================
   GOOGLE DOCS API
   ========================================================================= */
export interface GoogleDocSummary {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export async function listGoogleDocs(): Promise<GoogleDocSummary[]> {
  const q = encodeURIComponent(
    "mimeType='application/vnd.google-apps.document' and trashed=false"
  );
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const res = await googleApiFetch<{ files?: GoogleDocSummary[] }>(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=20`
  );
  return res.files || [];
}

export async function readGoogleDoc(documentId: string): Promise<{
  documentId: string;
  title: string;
  bodyText: string;
}> {
  const doc = await googleApiFetch<any>(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`
  );
  const paragraphs: string[] = [];
  const content = doc?.body?.content || [];
  for (const elem of content) {
    if (elem.paragraph?.elements) {
      const line = elem.paragraph.elements
        .map((pe: any) => pe.textRun?.content || '')
        .join('');
      if (line) paragraphs.push(line);
    }
  }
  return {
    documentId: doc.documentId,
    title: doc.title || 'Sin título',
    bodyText: paragraphs.join(''),
  };
}

export async function createGoogleDoc(title: string, initialText?: string): Promise<{
  documentId: string;
  title: string;
}> {
  const created = await googleApiFetch<{ documentId: string; title: string }>(
    'https://docs.googleapis.com/v1/documents',
    {
      method: 'POST',
      body: JSON.stringify({ title }),
    }
  );
  if (initialText && initialText.trim()) {
    await appendTextToGoogleDoc(created.documentId, initialText);
  }
  return created;
}

export async function appendTextToGoogleDoc(documentId: string, text: string): Promise<void> {
  await googleApiFetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              endOfSegmentLocation: { segmentId: '' },
              text: `\n${text}`,
            },
          },
        ],
      }),
    }
  );
}

/* =========================================================================
   GOOGLE CHAT API
   ========================================================================= */
export interface GoogleChatSpace {
  name: string;
  displayName?: string;
  spaceType?: string;
}

export interface GoogleChatMessage {
  name: string;
  text?: string;
  createTime?: string;
  sender?: {
    name?: string;
    displayName?: string;
    type?: string;
  };
}

export async function listChatSpaces(): Promise<GoogleChatSpace[]> {
  const res = await googleApiFetch<{ spaces?: GoogleChatSpace[] }>(
    'https://chat.googleapis.com/v1/spaces?pageSize=30'
  );
  return res.spaces || [];
}

export async function listChatMessages(spaceName: string): Promise<GoogleChatMessage[]> {
  const res = await googleApiFetch<{ messages?: GoogleChatMessage[] }>(
    `https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=30&orderBy=createTime desc`
  );
  return (res.messages || []).reverse();
}

export async function sendChatMessage(spaceName: string, text: string): Promise<GoogleChatMessage> {
  return googleApiFetch<GoogleChatMessage>(
    `https://chat.googleapis.com/v1/${spaceName}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    }
  );
}

export async function createChatSpace(displayName: string): Promise<GoogleChatSpace> {
  return googleApiFetch<GoogleChatSpace>('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    body: JSON.stringify({
      spaceType: 'SPACE',
      displayName,
    }),
  });
}
