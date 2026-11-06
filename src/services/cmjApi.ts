import {
  CmjActivity,
  CmjArticle,
  CmjAuditLog,
  CmjCommission,
  CmjCommitment,
  CmjContactMessage,
  CmjDocument,
  CmjInstitutionalConfig,
  CmjInternalNotification,
  CmjKnowledgeItem,
  CmjMediaItem,
  CmjMember,
  CmjPoll,
  CmjProject,
  CmjProposal,
  RolePermissions,
  CmjSession,
  CmjVeeduriaCase,
  CmjWorkPlan,
} from '../types/cmj.ts';
import {
  getClientFallbackOverview,
  saveClientFallbackOverview,
  INITIAL_KNOWLEDGE_SEED,
} from './cmjFallback.ts';

const TOKEN_STORAGE_KEY = 'cmj_flandes_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err: any) {
    throw new Error(err?.message || 'Error de conexión con el servidor institucional.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Server returned HTML (e.g., 404/SPA rewrite)
    throw new Error(`Respuesta inválida del servidor (${res.status} no-JSON).`);
  }

  const data = await res.json().catch(() => {
    throw new Error('Error al interpretar datos del servidor.');
  });

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status} en la solicitud institucional.`);
  }
  return data as T;
}

export interface PublicOverviewResponse {
  config: CmjInstitutionalConfig;
  members: CmjMember[];
  commissions: CmjCommission[];
  sessions: CmjSession[];
  documents: CmjDocument[];
  projects: CmjProject[];
  articles: CmjArticle[];
  activities: CmjActivity[];
  polls: CmjPoll[];
  media: CmjMediaItem[];
}

export interface AdminWorkspaceResponse extends PublicOverviewResponse {
  proposals: CmjProposal[];
  contactMessages: CmjContactMessage[];
  auditLogs: CmjAuditLog[];
  commitments: CmjCommitment[];
  internalNotifications: CmjInternalNotification[];
  veeduriaCases: CmjVeeduriaCase[];
  workPlans: CmjWorkPlan[];
  knowledgeItems: CmjKnowledgeItem[];
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: CmjMember | null;
  permissions: RolePermissions | null;
}

export const cmjApi = {
  // Public
  getPublicOverview: async (): Promise<PublicOverviewResponse> => {
    try {
      const data = await apiFetch<PublicOverviewResponse>('/api/cmj/public/overview');
      if (data && data.config && Array.isArray(data.members)) {
        saveClientFallbackOverview(data);
        return data;
      }
      throw new Error('Respuesta incompleta del servidor.');
    } catch (err) {
      console.warn('Usando respaldo institucional local:', err);
      return getClientFallbackOverview();
    }
  },
  votePoll: (pollId: string, optionId: string, voterKey: string) =>
    apiFetch<{ ok: boolean; poll: CmjPoll }>(`/api/cmj/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId, voterKey }),
    }),
  submitProposal: (payload: {
    authorName: string;
    authorEmail: string;
    authorPhone?: string;
    authorAge?: number;
    neighborhood?: string;
    topic: string;
    title: string;
    description: string;
    honeypot?: string;
  }) =>
    apiFetch<{ ok: boolean; trackingCode: string; proposal: CmjProposal }>('/api/cmj/proposals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  trackProposal: (code: string) =>
    apiFetch<{
      trackingCode: string;
      title: string;
      topic: string;
      status: string;
      institutionalResponse?: string;
      respondedBy?: string;
      respondedAt?: string;
      createdAt: string;
    }>(`/api/cmj/proposals/track/${encodeURIComponent(code)}`),
  submitContact: (payload: {
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    subject: string;
    message: string;
    honeypot?: string;
  }) =>
    apiFetch<{ ok: boolean; id: string }>('/api/cmj/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Auth
  getBootstrapStatus: () =>
    apiFetch<{ adminInitialized: boolean; adminEmail: string; adminName: string }>(
      '/api/cmj/auth/bootstrap-status'
    ),
  initializeAdmin: (email: string, password: string) =>
    apiFetch<{ ok: boolean; token: string; user: CmjMember; permissions: RolePermissions }>(
      '/api/cmj/auth/initialize-admin',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),
  activateInvite: (email: string, inviteCode: string, password: string) =>
    apiFetch<{ ok: boolean; token: string; user: CmjMember; permissions: RolePermissions }>(
      '/api/cmj/auth/activate-invite',
      {
        method: 'POST',
        body: JSON.stringify({ email, inviteCode, password }),
      }
    ),
  login: (email: string, password: string, totpCode?: string) =>
    apiFetch<{
      ok?: boolean;
      mfaRequired?: boolean;
      message?: string;
      token?: string;
      user?: CmjMember;
      permissions?: RolePermissions;
    }>('/api/cmj/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, totpCode }),
    }),
  me: () => apiFetch<AuthMeResponse>('/api/cmj/auth/me'),
  logout: () => apiFetch<{ ok: boolean }>('/api/cmj/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ ok: boolean }>('/api/cmj/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  updateMyProfile: (payload: Partial<CmjMember>) =>
    apiFetch<{ ok: boolean; member: CmjMember }>('/api/cmj/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  setupMfa: () => apiFetch<{ secret: string; otpauthUri: string }>('/api/cmj/auth/mfa/setup', { method: 'POST' }),
  confirmMfa: (code: string) =>
    apiFetch<{ ok: boolean; mfaEnabled: boolean; recoveryCodes: string[]; user: CmjMember }>(
      '/api/cmj/auth/mfa/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    ),

  // File Upload
  uploadFile: async (file: File): Promise<{ fileUrl: string; fileName: string; fileSize: number }> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(file);
    });
    return apiFetch<{ ok: boolean; fileUrl: string; fileName: string; fileSize: number }>(
      '/api/cmj/upload',
      {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          base64Data,
        }),
      }
    );
  },

  // Admin Workspace
  getAdminWorkspace: () => apiFetch<AdminWorkspaceResponse>('/api/cmj/admin/workspace'),
  updateConfig: (config: Partial<CmjInstitutionalConfig>) =>
    apiFetch<{ ok: boolean; config: CmjInstitutionalConfig }>('/api/cmj/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  // Members
  createMember: (payload: Partial<CmjMember>) =>
    apiFetch<{ ok: boolean; member: CmjMember; oneTimeInviteCode: string }>('/api/cmj/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMember: (id: string, payload: Partial<CmjMember>) =>
    apiFetch<{ ok: boolean; member: CmjMember }>(`/api/cmj/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteMember: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/members/${id}`, { method: 'DELETE' }),

  // Commissions
  createCommission: (payload: Partial<CmjCommission>) =>
    apiFetch<{ ok: boolean; commission: CmjCommission }>('/api/cmj/commissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCommission: (id: string, payload: Partial<CmjCommission>) =>
    apiFetch<{ ok: boolean; commission: CmjCommission }>(`/api/cmj/commissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Sessions
  createSession: (payload: Partial<CmjSession> & { publishNow?: boolean }) =>
    apiFetch<{ ok: boolean; session: CmjSession }>('/api/cmj/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSession: (id: string, payload: Partial<CmjSession>) =>
    apiFetch<{ ok: boolean; session: CmjSession }>(`/api/cmj/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteSession: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/sessions/${id}`, { method: 'DELETE' }),

  // Documents
  createDocument: (payload: Partial<CmjDocument> & { versionNotes?: string; publishNow?: boolean }) =>
    apiFetch<{ ok: boolean; document: CmjDocument }>('/api/cmj/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addDocumentVersion: (
    id: string,
    payload: { fileUrl: string; fileName: string; fileSize?: number; notes: string }
  ) =>
    apiFetch<{ ok: boolean; document: CmjDocument }>(`/api/cmj/documents/${id}/version`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDocumentStatus: (id: string, approvalStatus: string) =>
    apiFetch<{ ok: boolean; document: CmjDocument }>(`/api/cmj/documents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus }),
    }),
  deleteDocument: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/documents/${id}`, { method: 'DELETE' }),

  // Projects
  createProject: (payload: Partial<CmjProject> & { publishNow?: boolean }) =>
    apiFetch<{ ok: boolean; project: CmjProject }>('/api/cmj/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProject: (id: string, payload: Partial<CmjProject>) =>
    apiFetch<{ ok: boolean; project: CmjProject }>(`/api/cmj/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProject: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/projects/${id}`, { method: 'DELETE' }),

  // Articles & News
  createArticle: (payload: Partial<CmjArticle> & { requestedStatus?: string }) =>
    apiFetch<{ ok: boolean; article: CmjArticle }>('/api/cmj/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateArticle: (id: string, payload: Partial<CmjArticle>) =>
    apiFetch<{ ok: boolean; article: CmjArticle }>(`/api/cmj/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteArticle: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/articles/${id}`, { method: 'DELETE' }),

  // Activities
  createActivity: (payload: Partial<CmjActivity> & { publishNow?: boolean }) =>
    apiFetch<{ ok: boolean; activity: CmjActivity }>('/api/cmj/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteActivity: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/activities/${id}`, { method: 'DELETE' }),

  // Polls
  createPoll: (payload: {
    title: string;
    description: string;
    pollKind: 'encuesta_opinion' | 'votacion_oficial';
    options: { text: string; imageUrl?: string }[];
    opensAt?: string;
    closesAt?: string;
    isActive?: boolean;
  }) =>
    apiFetch<{ ok: boolean; poll: CmjPoll }>('/api/cmj/polls', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deletePoll: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/polls/${id}`, { method: 'DELETE' }),

  // Media
  createMedia: (payload: Partial<CmjMediaItem>) =>
    apiFetch<{ ok: boolean; mediaItem: CmjMediaItem }>('/api/cmj/media', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteMedia: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/media/${id}`, { method: 'DELETE' }),

  // Proposals
  respondProposal: (id: string, status: string, institutionalResponse: string) =>
    apiFetch<{ ok: boolean; proposal: CmjProposal }>(`/api/cmj/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, institutionalResponse }),
    }),

  // Commitments (Compromisos)
  createCommitment: (payload: Partial<CmjCommitment>) =>
    apiFetch<{ ok: boolean; commitment: CmjCommitment }>('/api/cmj/commitments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCommitment: (id: string, payload: Partial<CmjCommitment>) =>
    apiFetch<{ ok: boolean; commitment: CmjCommitment }>(`/api/cmj/commitments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteCommitment: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/commitments/${id}`, { method: 'DELETE' }),

  // Internal Notifications & Communications
  createNotification: (payload: {
    title: string;
    message: string;
    category?: 'aviso' | 'comunicado' | 'convocatoria' | 'tarea' | 'proyecto';
    priority?: 'normal' | 'alta' | 'urgente';
    targetMemberIds?: string[];
  }) =>
    apiFetch<{ ok: boolean; notification: CmjInternalNotification }>('/api/cmj/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  markNotificationRead: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/notifications/${id}/read`, { method: 'POST' }),

  // Veeduría y Control Social
  createVeeduriaCase: (payload: Partial<CmjVeeduriaCase>) =>
    apiFetch<{ ok: boolean; veeduriaCase: CmjVeeduriaCase }>('/api/cmj/veeduria', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateVeeduriaCase: (id: string, payload: Partial<CmjVeeduriaCase>) =>
    apiFetch<{ ok: boolean; veeduriaCase: CmjVeeduriaCase }>(`/api/cmj/veeduria/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteVeeduriaCase: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/veeduria/${id}`, { method: 'DELETE' }),

  // Work Plans (Plan de Trabajo)
  createWorkPlan: (payload: Partial<CmjWorkPlan>) =>
    apiFetch<{ ok: boolean; workPlan: CmjWorkPlan }>('/api/cmj/work-plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWorkPlan: (id: string, payload: Partial<CmjWorkPlan>) =>
    apiFetch<{ ok: boolean; workPlan: CmjWorkPlan }>(`/api/cmj/work-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteWorkPlan: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/work-plans/${id}`, { method: 'DELETE' }),

  // Knowledge & Training (Formación)
  createKnowledgeItem: (payload: Partial<CmjKnowledgeItem>) =>
    apiFetch<{ ok: boolean; knowledgeItem: CmjKnowledgeItem }>('/api/cmj/knowledge', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteKnowledgeItem: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/cmj/knowledge/${id}`, { method: 'DELETE' }),

  // Backup & Restore
  exportBackup: () => apiFetch<{ exportedAt: string; platform: string; data: unknown }>('/api/cmj/admin/backup'),
  restoreBackup: (data: unknown) =>
    apiFetch<{ ok: boolean }>('/api/cmj/admin/restore', {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),
};
