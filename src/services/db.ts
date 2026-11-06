import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { uploadImageWithProgress } from './imageUpload';
import {
  CNE_RUPYM_OFFICIAL_CATALOG,
  OWNER_DEFAULT_POLITICAL_IDENTITY
} from '../data/colombianPoliticalOrgs';
import {
  Article,
  ArticleStatus,
  Category,
  Comment,
  CommentStatus,
  DailyAnalytics,
  PlatformSettings,
  Profile,
  ContactMessage,
  CollaboratorRequest,
  CollaboratorRequestStatus,
  Collaborator,
  MediaItem,
  AuditLog,
  ReactionType,
  ArticleReactions,
  Donation,
  DonationStatus,
  FinancialTransactionStatus,
  PaymentMethod,
  EditorialPost,
  SubscriberUser,
  AdProposal,
  FinancialSettings,
  PaymentMethodConfig,
  AdPlacement,
  AdProposalStatus,
  SubscriptionStatus,
  SubscriptionPeriod,
  BankAccount,
  BankAccountType,
  BankAccountVerificationStatus,
  DisbursementRecord,
  DisbursementStatus,
  FinancialAuditLog,
  PlatformUpdate,
  PlatformUpdateCategory,
  SubscriptionPlan,
  SubscriptionPlanPeriod,
  SubscriptionPaymentRecord,
  SavedArticle,
  PoliticalOrganization,
  PendingPoliticalOrganization,
  UserPoliticalIdentity,
  PoliticalAuditLog,
  LiveStream,
  LiveChatMessage,
  LivePoll,
  LiveGuestRequest,
  LiveReminder,
  LiveReport,
  PlatformConnection,
  LiveTechnicalSettings,
  ContentReport,
  ReportReason,
  ArticleVersionSnapshot,
  AdPricingConfig,
  AuthorProfile,
  VerificationStatus,
  VerificationPolicy,
  VerificationHistoryItem,
  CorrectionRequest,
  CitizenPoll,
  PollOption,
  EditorialEvent,
  EditorialEventCategory,
  CollaboratorRecognition,
  ArticleSource,
  ArticleRectification,
  PermissionAuditLog,
  CollaboratorCustomBenefit
} from '../types';
import { sanitizeSafeUrl, sanitizePlainText } from '../utils/security';
import { getDefaultCollaboratorPermissions, OWNER_ONLY_PERMISSION_KEYS } from '../utils/permissions';

/**
 * Recursively cleans an object to strip undefined values so that Firestore writes never fail.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj as Record<string, any>)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        cleaned[key] = sanitizePayload(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned as T;
}

// Default categories
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Política', slug: 'politica', description: 'Análisis institucional, poder, gobernanza y coyuntura política.', color: '#c59b27', order: 1 },
  { name: 'Opinión', slug: 'opinion', description: 'Columnas editoriales, reflexiones críticas y posturas de debate.', color: '#1a1a1a', order: 2 },
  { name: 'Sociedad', slug: 'sociedad', description: 'Dinámicas ciudadanas, transformación social y derechos.', color: '#4a5568', order: 3 },
  { name: 'Tecnología', slug: 'tecnologia', description: 'Impacto de la era digital, ética tecnológica e innovación.', color: '#2b6cb0', order: 4 },
  { name: 'Educación', slug: 'educacion', description: 'Políticas educativas, pedagogía y desarrollo humano.', color: '#744210', order: 5 },
  { name: 'Actualidad', slug: 'actualidad', description: 'Acontecimientos inmediatos y lectura de coyuntura nacional y global.', color: '#9b2c2c', order: 6 },
  { name: 'Cultura', slug: 'cultura', description: 'Literatura, pensamiento contemporáneo, historia y arte.', color: '#6b46c1', order: 7 },
];

export const OFFICIAL_AUTHOR_PORTRAIT = '/assets/julian_camilo.jpeg';

export const DEFAULT_PROFILE: Profile = {
  name: 'JULIAN CAMILO',
  title: 'Analista Político & Columnista Editorial',
  motto: 'Ideas que merecen ser leídas',
  bio: 'Espacio de reflexión independiente dedicado al análisis político, los dilemas contemporáneos de la sociedad colombiana, la cultura cívica y las ideas que configuran nuestro tiempo.',
  photoUrl: OFFICIAL_AUTHOR_PORTRAIT,
  location: 'Bogotá, Colombia',
  contactEmail: 'contacto@juliancamilo.com',
  interests: [
    'Análisis Político',
    'Políticas Públicas',
    'Filosofía Contemporánea',
    'Sociología Política',
    'Ética y Tecnología',
    'Debate Constitucional'
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Ciencia Política y Relaciones Internacionales',
      institution: 'Universidad Nacional de Colombia',
      year: '2019',
      description: 'Énfasis en gobernanza, sistemas electorales y teoría del Estado.',
      order: 1
    },
    {
      id: 'edu-2',
      degree: 'Especialización en Políticas Públicas y Gestión Estatal',
      institution: 'Universidad de los Andes',
      year: '2022',
      description: 'Investigación sobre transparencia institucional y participación cívica.',
      order: 2
    }
  ],
  trajectory: [
    {
      id: 'traj-1',
      role: 'Columnista y Analista Político Independiente',
      organization: 'Plataforma Julian Camilo',
      period: '2022 - Presente',
      description: 'Publicación de ensayos editoriales y columnas de opinión sobre coyuntura nacional y global.',
      order: 1
    },
    {
      id: 'traj-2',
      role: 'Consultor en Comunicación Estratégica y Asuntos Públicos',
      organization: 'Sector Público y Organizaciones Cívicas',
      period: '2020 - 2023',
      description: 'Asesoría en diseño de políticas públicas, gestión de debate social y vocería.',
      order: 2
    }
  ],
  socialLinks: {
    twitter: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    threads: '',
    whatsapp: '',
    telegram: '',
    substack: '',
    podcast: '',
    website: '',
    customLinks: []
  }
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  siteTitle: 'JULIAN CAMILO',
  siteMotto: 'Ideas que merecen ser leídas',
  moderationEnabled: true,
  allowCommentsGlobally: true,
  contactEmail: 'contacto@juliancamilo.com',
  invitationCode: 'COLOMBIA2026',
  invitationCodeActive: true
};

/* =========================================================================
   1. PROFILE SERVICES (with Local Backup Resiliency)
   ========================================================================= */

export async function getProfile(): Promise<Profile> {
  const path = 'profile/main';
  try {
    const snap = await getDoc(doc(db, 'profile', 'main'));
    if (snap.exists()) {
      const data = snap.data();
      let photoUrl = data.photoUrl;
      if (!photoUrl || photoUrl.includes('unsplash.com')) {
        photoUrl = OFFICIAL_AUTHOR_PORTRAIT;
      }
      const loadedProfile: Profile = {
        id: snap.id,
        ...DEFAULT_PROFILE,
        ...data,
        photoUrl,
        socialLinks: {
          ...DEFAULT_PROFILE.socialLinks,
          ...(data.socialLinks || {})
        }
      };
      // Backup to localStorage
      try {
        localStorage.setItem('jc_backup_profile', JSON.stringify(loadedProfile));
      } catch (e) {}
      return loadedProfile;
    }
  } catch (error) {
    console.warn('Could not load profile from server, using cached/default:', error);
  }

  // Fallback to local storage backup
  try {
    const cached = localStorage.getItem('jc_backup_profile');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  return DEFAULT_PROFILE;
}

export async function updateProfile(data: Partial<Profile>): Promise<void> {
  const path = 'profile/main';
  try {
    const refDoc = doc(db, 'profile', 'main');
    const cleaned = sanitizePayload({
      ...data,
      updatedAt: new Date().toISOString()
    });
    await setDoc(refDoc, cleaned, { merge: true });

    // Update local cache
    try {
      const current = await getProfile();
      localStorage.setItem('jc_backup_profile', JSON.stringify({ ...current, ...data }));
    } catch (e) {}

    await createAuditLog({
      action: 'Actualización de Perfil',
      actor: 'Julian Camilo (Propietario)',
      details: 'Se actualizaron datos biográficos, formación o redes sociales.',
      type: 'profile'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   2. CATEGORIES SERVICES
   ========================================================================= */

export async function getCategories(): Promise<Category[]> {
  const path = 'categories';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return DEFAULT_CATEGORIES.map((c, i) => ({ id: `cat-${i + 1}`, ...c }));
    }
    const categories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
    return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Failed to fetch categories from Firestore, returning defaults:', error);
    return DEFAULT_CATEGORIES.map((c, i) => ({ id: `cat-${i + 1}`, ...c }));
  }
}

export async function initializeCategoriesIfEmpty(): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) {
      for (const cat of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          ...cat,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    console.warn('Notice initializing categories:', e);
  }
}

export async function createCategory(cat: Omit<Category, 'id'>): Promise<string> {
  const path = 'categories';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...cat,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCategory(id: string, cat: Partial<Category>): Promise<void> {
  const path = `categories/${id}`;
  try {
    await updateDoc(doc(db, 'categories', id), cat);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const path = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   3. ARTICLES SERVICES & APPROVAL WORKFLOW
   ========================================================================= */

export async function getArticles(options?: {
  includeDrafts?: boolean;
  includeAllStatus?: boolean;
  authorEmail?: string;
  categorySlug?: string;
  limitCount?: number;
}): Promise<Article[]> {
  const path = 'articles';
  try {
    let q = query(collection(db, path), orderBy('createdAt', 'desc'));

    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snap = await getDocs(q);
    let articles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];

    // Filter by author if requested (for collaborator dashboard)
    if (options?.authorEmail) {
      const emailLower = options.authorEmail.toLowerCase();
      articles = articles.filter(a => a.authorEmail?.toLowerCase() === emailLower);
      return articles;
    }

    // Filter by status for public consumption
    if (!options?.includeDrafts && !options?.includeAllStatus) {
      // ONLY published articles are visible to the public
      articles = articles.filter(a => a.status === 'published' || a.status === 'publicado');
    }

    if (options?.categorySlug) {
      const targetSlug = options.categorySlug.toLowerCase();
      articles = articles.filter(
        a => a.categoryId === options.categorySlug ||
             a.categoryName.toLowerCase() === targetSlug
      );
    }

    // Cache articles
    try {
      localStorage.setItem('jc_backup_articles', JSON.stringify(articles));
    } catch (e) {}

    return articles;
  } catch (error) {
    console.warn('Error reading articles collection, trying local cache:', error);
    try {
      const cached = localStorage.getItem('jc_backup_articles');
      if (cached) {
        let arts: Article[] = JSON.parse(cached);
        if (!options?.includeDrafts && !options?.includeAllStatus) {
          arts = arts.filter(a => a.status === 'published' || a.status === 'publicado');
        }
        return arts;
      }
    } catch (e) {}
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const path = 'articles';
  try {
    const q = query(collection(db, path), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Article;
    }
    // Also try checking by document ID
    const directDoc = await getDoc(doc(db, path, slug));
    if (directDoc.exists()) {
      return { id: directDoc.id, ...directDoc.data() } as Article;
    }
  } catch (error) {
    // Attempt local cache fallback
  }

  try {
    const cached = localStorage.getItem('jc_backup_articles');
    if (cached) {
      const parsed = JSON.parse(cached) as Article[];
      const found = parsed.find(a => a.slug === slug || a.id === slug);
      if (found) return found;
    }
  } catch (e) {}

  return null;
}

export async function getArticleById(id: string): Promise<Article | null> {
  const path = `articles/${id}`;
  try {
    const snap = await getDoc(doc(db, 'articles', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Article;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createArticle(data: Omit<Article, 'id'>): Promise<string> {
  const path = 'articles';
  try {
    const rawData = {
      ...data,
      views: data.views || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const cleaned = sanitizePayload(rawData);
    const docRef = await addDoc(collection(db, path), cleaned);

    await createAuditLog({
      action: 'Artículo Creado',
      actor: data.authorName || 'Autor',
      details: `Título: "${data.title}" - Estado: ${data.status}`,
      type: 'article'
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<void> {
  const path = `articles/${id}`;
  try {
    const rawData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    const cleaned = sanitizePayload(rawData);
    await updateDoc(doc(db, 'articles', id), cleaned);

    await createAuditLog({
      action: 'Artículo Actualizado',
      actor: data.authorName || 'Editor',
      details: `ID: ${id} - Estado actual: ${data.status || 'sin cambio'}`,
      type: 'article'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteArticle(id: string): Promise<void> {
  const path = `articles/${id}`;
  try {
    await deleteDoc(doc(db, 'articles', id));

    await createAuditLog({
      action: 'Artículo Eliminado',
      actor: 'Julian Camilo (Propietario)',
      details: `Se eliminó permanentemente el artículo con ID: ${id}`,
      type: 'article'
    });
  } catch (error) {
    console.warn('Notice deleting article doc in firestore:', error);
  }

  // Also remove from local cached backup so that deleted articles disappear immediately in offline/fallback mode
  try {
    const cached = localStorage.getItem('jc_backup_articles');
    if (cached) {
      const parsed = JSON.parse(cached);
      const filtered = parsed.filter((a: any) => a.id !== id);
      localStorage.setItem('jc_backup_articles', JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Error updating local articles cache on delete:', e);
  }
}

export async function reviewArticle(
  id: string,
  status: ArticleStatus,
  reviewNotes?: string,
  reviewerName = 'Julian Camilo'
): Promise<void> {
  const path = `articles/${id}`;
  try {
    const payload: Partial<Article> = {
      status,
      reviewNotes: reviewNotes || '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerName,
      updatedAt: new Date().toISOString()
    };

    if (status === 'published' || status === 'publicado') {
      payload.publishedAt = new Date().toISOString();
    }

    await updateDoc(doc(db, 'articles', id), payload);

    await createAuditLog({
      action: `Revisión Editorial: ${status.toUpperCase()}`,
      actor: reviewerName,
      details: `Artículo ID: ${id} pasó a estado: ${status}. Notas: ${reviewNotes || 'Ninguna'}`,
      type: 'article'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function incrementArticleViews(id: string, currentViews: number): Promise<void> {
  const path = `articles/${id}`;
  try {
    await updateDoc(doc(db, 'articles', id), {
      views: (currentViews || 0) + 1
    });
  } catch (e) {
    console.warn('Could not increment article views:', e);
  }
}

/* =========================================================================
   3.1 ARTICLE REACTIONS (BANDERA DE COLOMBIA: AMARILLO, AZUL, ROJO)
   ========================================================================= */

export async function recordArticleReaction(
  articleId: string,
  newReaction: ReactionType | null,
  previousReaction: ReactionType | null
): Promise<ArticleReactions> {
  const path = `articles/${articleId}`;
  try {
    const articleRef = doc(db, 'articles', articleId);
    const snap = await getDoc(articleRef);
    const currentData = snap.exists() ? snap.data() : {};
    const reactions: ArticleReactions = {
      yellow: currentData.reactions?.yellow || 0,
      blue: currentData.reactions?.blue || 0,
      red: currentData.reactions?.red || 0,
    };

    // If switching from an existing reaction, decrement previous safely
    if (previousReaction && reactions[previousReaction] > 0) {
      reactions[previousReaction] = Math.max(0, reactions[previousReaction] - 1);
    }

    // If selecting a new reaction, increment
    if (newReaction) {
      reactions[newReaction] = (reactions[newReaction] || 0) + 1;
    }

    await updateDoc(articleRef, {
      reactions: sanitizePayload(reactions),
      updatedAt: new Date().toISOString()
    });

    // Update local cached articles
    try {
      const cached = localStorage.getItem('jc_backup_articles');
      if (cached) {
        const parsed: Article[] = JSON.parse(cached);
        const idx = parsed.findIndex(a => a.id === articleId);
        if (idx >= 0) {
          parsed[idx].reactions = reactions;
          localStorage.setItem('jc_backup_articles', JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    return reactions;
  } catch (error) {
    console.warn('Notice updating article reaction in Firestore:', error);
    return { yellow: 0, blue: 0, red: 0 };
  }
}

export async function getArticleReactions(articleId: string): Promise<ArticleReactions> {
  try {
    const snap = await getDoc(doc(db, 'articles', articleId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        yellow: data.reactions?.yellow || 0,
        blue: data.reactions?.blue || 0,
        red: data.reactions?.red || 0,
      };
    }
  } catch (e) {
    console.warn('Error fetching reactions:', e);
  }
  return { yellow: 0, blue: 0, red: 0 };
}

/* =========================================================================
   4. COLLABORATION REQUESTS & COLLABORATORS
   ========================================================================= */

export async function submitCollaboratorRequest(data: {
  fullName: string;
  phone?: string;
  email?: string;
  invitationCode?: string;
  editorialArea?: string;
  motivation?: string;
}): Promise<{ success: boolean; message: string; id?: string }> {
  const path = 'collaborator_requests';
  try {
    if (!data.fullName || !data.fullName.trim()) {
      return { success: false, message: 'El nombre completo es obligatorio para enviar la solicitud.' };
    }

    const cleanName = data.fullName.trim();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanPhone = (data.phone || '').trim();
    const cleanCode = (data.invitationCode || '').trim();

    // 1. If an invitation code is provided, verify it against settings
    if (cleanCode) {
      const settings = await getSettings();
      if (settings.invitationCodeActive) {
        const expectedCode = (settings.invitationCode || 'COLOMBIA2026').trim().toLowerCase();
        if (expectedCode !== cleanCode.toLowerCase()) {
          return { success: false, message: 'El código de invitación proporcionado es inválido o ha sido revocado.' };
        }
      }
    }

    // 2. Check for duplicate pending requests when email is provided
    if (cleanEmail) {
      const q = query(
        collection(db, path),
        where('email', '==', cleanEmail),
        where('status', '==', 'pendiente')
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        return { success: false, message: 'Ya existe una solicitud pendiente de aprobación registrada con este correo electrónico.' };
      }
    }

    // 3. Save request (always starts as 'pendiente' for owner approval)
    const payload = sanitizePayload({
      fullName: cleanName,
      phone: cleanPhone || undefined,
      email: cleanEmail || undefined,
      invitationCode: cleanCode || undefined,
      editorialArea: data.editorialArea?.trim() || undefined,
      motivation: data.motivation?.trim() || undefined,
      status: 'pendiente' as CollaboratorRequestStatus,
      createdAt: new Date().toISOString()
    });

    const docRef = await addDoc(collection(db, path), payload);

    await createAuditLog({
      action: 'Solicitud de Colaborador Recibida',
      actor: cleanName,
      details: `${cleanEmail ? `Correo: ${cleanEmail}` : 'Sin correo'}${cleanPhone ? ` · Tel: ${cleanPhone}` : ''}`,
      type: 'collaborator'
    });

    return {
      success: true,
      message: `Tu solicitud ha sido enviada exitosamente (Código de seguimiento: ${docRef.id.slice(0, 8).toUpperCase()}). Queda pendiente de aprobación por el propietario de DULIMA.`,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error submitting collaborator request:', error);
    return { success: false, message: 'Ocurrió un error al enviar tu solicitud. Por favor intenta de nuevo.' };
  }
}

export async function checkCollaboratorRequestStatus(searchTerm: string): Promise<CollaboratorRequest[]> {
  const clean = searchTerm.trim().toLowerCase();
  if (!clean) return [];
  const all = await getCollaboratorRequests();
  return all.filter(
    (r) =>
      r.id.toLowerCase() === clean ||
      r.id.toLowerCase().startsWith(clean) ||
      (r.email && r.email.toLowerCase() === clean) ||
      r.fullName.toLowerCase().includes(clean)
  );
}

export async function getCollaboratorRequests(): Promise<CollaboratorRequest[]> {
  const path = 'collaborator_requests';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CollaboratorRequest[];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not read collaborator requests:', error);
    return [];
  }
}

export async function updateCollaboratorRequestStatus(
  requestId: string,
  status: CollaboratorRequestStatus,
  notes?: string
): Promise<void> {
  const path = `collaborator_requests/${requestId}`;
  try {
    // 1. Get request data
    const requestSnap = await getDoc(doc(db, 'collaborator_requests', requestId));
    if (!requestSnap.exists()) throw new Error('Solicitud no encontrada');
    const requestData = requestSnap.data() as CollaboratorRequest;

    // 2. Update request
    await updateDoc(doc(db, 'collaborator_requests', requestId), {
      status,
      notes: notes || '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Julian Camilo'
    });

    // 3. If approved, add to collaborators registry
    if (status === 'aprobada') {
      const colId = (requestData.email || requestData.fullName || requestId).replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'collaborators', colId), {
        id: colId,
        fullName: requestData.fullName,
        email: requestData.email || '',
        phone: requestData.phone || '',
        status: 'activo',
        permissions: getDefaultCollaboratorPermissions(),
        customBenefits: [],
        createdAt: requestData.createdAt,
        approvedAt: new Date().toISOString()
      }, { merge: true });

      await createAuditLog({
        action: 'Colaborador Aprobado',
        actor: 'Julian Camilo (Propietario)',
        details: `Se aprobó a ${requestData.fullName}${requestData.email ? ` (${requestData.email})` : ''} como colaborador.`,
        type: 'collaborator'
      });
    } else {
      await createAuditLog({
        action: `Solicitud de Colaborador ${status.toUpperCase()}`,
        actor: 'Julian Camilo (Propietario)',
        details: `Solicitud de ${requestData.fullName} fue ${status}.`,
        type: 'collaborator'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getCollaborators(): Promise<Collaborator[]> {
  const path = 'collaborators';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Collaborator[];
    return items.sort((a, b) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not read collaborators:', error);
    return [];
  }
}

export async function getCollaboratorByEmail(email: string): Promise<Collaborator | null> {
  const path = 'collaborators';
  try {
    const cleanEmail = email.trim().toLowerCase();
    const colId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const directSnap = await getDoc(doc(db, path, colId));
    if (directSnap.exists()) {
      return { id: directSnap.id, ...directSnap.data() } as Collaborator;
    }
    const q = query(collection(db, path), where('email', '==', cleanEmail), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0];
      return { id: docData.id, ...docData.data() } as Collaborator;
    }
    return null;
  } catch (e) {
    console.warn('Error checking collaborator status:', e);
    return null;
  }
}

export async function updateCollaboratorStatus(id: string, status: 'activo' | 'suspendido' | 'inactivo'): Promise<void> {
  const path = `collaborators/${id}`;
  try {
    await updateDoc(doc(db, 'collaborators', id), { status });
    await createAuditLog({
      action: `Estado de Colaborador Actualizado: ${status}`,
      actor: 'Julian Camilo (Propietario)',
      details: `Colaborador ID: ${id} cambiado a: ${status}`,
      type: 'collaborator'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveCollaborator(
  data: Partial<Collaborator> & { fullName: string; email: string },
  existingId?: string
): Promise<string> {
  const cleanEmail = data.email.trim().toLowerCase();
  const colId = existingId || cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const now = new Date().toISOString();

  // Enforce Category F owner-only permissions can never be true on a collaborator
  const sanitizedPermissions: Record<string, boolean> = {
    ...(data.permissions || getDefaultCollaboratorPermissions())
  };
  for (const ownerKey of OWNER_ONLY_PERMISSION_KEYS) {
    sanitizedPermissions[ownerKey] = false;
  }

  const payload = sanitizePayload({
    id: colId,
    fullName: data.fullName.trim(),
    username: data.username?.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    phone: data.phone?.trim() || '',
    photoUrl: data.photoUrl || '',
    bio: data.bio || '',
    invitationCode: data.invitationCode || '',
    status: data.status || 'activo',
    permissions: sanitizedPermissions,
    customBenefits: (data.customBenefits || []) as CollaboratorCustomBenefit[],
    createdAt: data.createdAt || now,
    approvedAt: data.approvedAt || now
  });

  await setDoc(doc(db, 'collaborators', colId), payload, { merge: true });
  await createAuditLog({
    action: existingId ? 'Perfil y Permisos de Colaborador Actualizados' : 'Nuevo Colaborador Creado',
    actor: 'Julian Camilo (Propietario)',
    details: `${payload.fullName} (${payload.email}) — Estado: ${payload.status}`,
    type: 'collaborator'
  });

  return colId;
}

export async function deleteCollaborator(id: string, label?: string): Promise<void> {
  await deleteDoc(doc(db, 'collaborators', id));
  await createAuditLog({
    action: 'Cuenta de Colaborador Eliminada',
    actor: 'Julian Camilo (Propietario)',
    details: `Colaborador eliminado: ${label || id}`,
    type: 'collaborator'
  });
}

export async function logPermissionAudit(
  entry: Omit<PermissionAuditLog, 'id' | 'timestamp'>
): Promise<void> {
  const now = new Date().toISOString();
  const id = `paudit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const record: PermissionAuditLog = {
    id,
    ...entry,
    timestamp: now
  };
  try {
    await setDoc(doc(db, 'permission_audit_logs', id), sanitizePayload(record));
  } catch (e) {}
  try {
    const raw = localStorage.getItem('jc_permission_audit_logs');
    const list: PermissionAuditLog[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem('jc_permission_audit_logs', JSON.stringify(list.slice(0, 200)));
  } catch (e) {}
}

export async function getPermissionAuditLogs(collaboratorId?: string): Promise<PermissionAuditLog[]> {
  let list: PermissionAuditLog[] = [];
  try {
    const q = query(collection(db, 'permission_audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PermissionAuditLog, 'id'>) }));
    }
  } catch (e) {}

  if (list.length === 0) {
    try {
      const raw = localStorage.getItem('jc_permission_audit_logs');
      if (raw) list = JSON.parse(raw);
    } catch (e) {}
  }

  if (collaboratorId) {
    list = list.filter((l) => l.collaboratorId === collaboratorId);
  }
  return list;
}

/* =========================================================================
   5. MEDIA LIBRARY & INSTAGRAM-STYLE ASSET MANAGER
   ========================================================================= */

export async function getMediaItems(): Promise<MediaItem[]> {
  const path = 'media_library';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MediaItem[];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not load media library:', error);
    return [];
  }
}

export async function addMediaItem(item: Omit<MediaItem, 'id' | 'createdAt'>): Promise<string> {
  const path = 'media_library';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...item,
      createdAt: new Date().toISOString()
    });

    await createAuditLog({
      action: 'Fotografía Guardada en Biblioteca',
      actor: 'Julian Camilo (Propietario)',
      details: `Archivo: ${item.fileName} (${item.title})`,
      type: 'media'
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteMediaItem(id: string): Promise<void> {
  const path = `media_library/${id}`;
  try {
    await deleteDoc(doc(db, 'media_library', id));
    await createAuditLog({
      action: 'Fotografía Eliminada de Biblioteca',
      actor: 'Julian Camilo (Propietario)',
      details: `ID de medio: ${id}`,
      type: 'media'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateMediaItem(
  id: string,
  updates: Partial<Omit<MediaItem, 'id' | 'createdAt'>>
): Promise<void> {
  const path = `media_library/${id}`;
  try {
    await updateDoc(doc(db, 'media_library', id), {
      ...updates
    });
    await createAuditLog({
      action: 'Fotografía Reemplazada / Actualizada',
      actor: 'Julian Camilo (Propietario)',
      details: `ID de medio: ${id} (${updates.fileName || updates.title || ''})`,
      type: 'media'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/* =========================================================================
   6. AUDIT LOGS
   ========================================================================= */

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
  const path = 'audit_logs';
  try {
    await addDoc(collection(db, path), {
      ...log,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    // Silent fail for logs to avoid blocking user actions
    console.warn('Audit log write error:', e);
  }
}

export async function getAuditLogs(limitCount = 50): Promise<AuditLog[]> {
  const path = 'audit_logs';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
  } catch (error) {
    console.warn('Could not read audit logs:', error);
    return [];
  }
}

/* =========================================================================
   7. COMMENTS SERVICES
   ========================================================================= */

export async function getCommentsByArticle(articleId: string): Promise<Comment[]> {
  const path = 'comments';
  try {
    const q = query(
      collection(db, path),
      where('articleId', '==', articleId),
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Error fetching comments for article:', error);
    return [];
  }
}

export async function getAllComments(): Promise<Comment[]> {
  const path = 'comments';
  if (!auth.currentUser) {
    return [];
  }
  try {
    const snap = await getDocs(collection(db, path));
    const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not read all comments (admin only):', error);
    return [];
  }
}

export async function createComment(data: Omit<Comment, 'id'>): Promise<string> {
  const path = 'comments';
  try {
    const cleaned = sanitizePayload({
      ...data,
      createdAt: new Date().toISOString()
    });
    const docRef = await addDoc(collection(db, path), cleaned);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCommentStatus(id: string, status: CommentStatus): Promise<void> {
  const path = `comments/${id}`;
  try {
    await updateDoc(doc(db, 'comments', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteComment(id: string): Promise<void> {
  const path = `comments/${id}`;
  try {
    await deleteDoc(doc(db, 'comments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   8. ANALYTICS & VISITOR TRACKING
   ========================================================================= */

export async function recordVisit(path: string, articleId?: string, categoryName?: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sessionKey = `jc_visited_${today}_${path}`;

    if (sessionStorage.getItem(sessionKey)) {
      return;
    }
    sessionStorage.setItem(sessionKey, '1');

    const docRef = doc(db, 'analytics', today);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      await setDoc(docRef, {
        date: today,
        visits: 1,
        articleViews: articleId ? { [articleId]: 1 } : {},
        categoryViews: categoryName ? { [categoryName]: 1 } : {},
        updatedAt: new Date().toISOString()
      });
    } else {
      const data = snap.data();
      const currentArticleViews = data.articleViews || {};
      const currentCategoryViews = data.categoryViews || {};

      if (articleId) {
        currentArticleViews[articleId] = (currentArticleViews[articleId] || 0) + 1;
      }
      if (categoryName) {
        currentCategoryViews[categoryName] = (currentCategoryViews[categoryName] || 0) + 1;
      }

      await updateDoc(docRef, {
        visits: increment(1),
        articleViews: currentArticleViews,
        categoryViews: currentCategoryViews,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    console.warn('Analytics tracking notice:', e);
  }
}

export async function getAnalyticsDays(days = 14): Promise<DailyAnalytics[]> {
  const path = 'analytics';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DailyAnalytics[];
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
  } catch (error) {
    console.warn('Failed to load analytics records:', error);
    return [];
  }
}

/* =========================================================================
   9. SETTINGS SERVICES
   ========================================================================= */

export async function getSettings(): Promise<PlatformSettings> {
  const path = 'settings/global';
  try {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (snap.exists()) {
      const data = snap.data();
      const settings = {
        id: snap.id,
        ...DEFAULT_SETTINGS,
        ...data
      } as PlatformSettings;
      try {
        localStorage.setItem('jc_backup_settings', JSON.stringify(settings));
      } catch (e) {}
      return settings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('Could not read settings from Firestore:', error);
    try {
      const cached = localStorage.getItem('jc_backup_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(data: Partial<PlatformSettings>): Promise<void> {
  const path = 'settings/global';
  try {
    const cleaned = sanitizePayload({
      ...data,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'settings', 'global'), cleaned, { merge: true });

    try {
      const cur = await getSettings();
      localStorage.setItem('jc_backup_settings', JSON.stringify({ ...cur, ...data }));
    } catch (e) {}

    await createAuditLog({
      action: 'Configuración General Actualizada',
      actor: 'Julian Camilo (Propietario)',
      details: 'Se actualizaron parámetros de moderación o códigos de invitación.',
      type: 'settings'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   10. CONTACT MESSAGES
   ========================================================================= */

export async function sendContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'read'>): Promise<string> {
  const path = 'messages';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...msg,
      read: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const path = 'messages';
  if (!auth.currentUser) {
    return [];
  }
  try {
    const snap = await getDocs(collection(db, path));
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContactMessage[];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not read messages (admin only):', error);
    return [];
  }
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  const path = `messages/${id}`;
  try {
    await updateDoc(doc(db, 'messages', id), { read });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessage(id: string): Promise<void> {
  const path = `messages/${id}`;
  try {
    await deleteDoc(doc(db, 'messages', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   11. IMAGE UPLOAD & COMPRESSION (Canvas + WebP/JPEG)
   ========================================================================= */

export async function compressImageFile(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo seleccionado no es una imagen válida.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadImageFile(file: File, folder = 'articles'): Promise<string> {
  const result = await uploadImageWithProgress(file, `upload_${Date.now()}`, { folder });
  return result.url;
}

/* =========================================================================
   12. NEWSLETTER SUBSCRIBERS
   ========================================================================= */

export async function subscribeNewsletter(email: string): Promise<string> {
  const path = 'subscribers';
  try {
    const docRef = await addDoc(collection(db, path), {
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getNewsletterSubscribers(): Promise<{ id: string; email: string; createdAt: string }[]> {
  const path = 'subscribers';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as { id: string; email: string; createdAt: string }[];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteSubscriber(id: string): Promise<void> {
  const path = `subscribers/${id}`;
  try {
    await deleteDoc(doc(db, 'subscribers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   13. DONACIONES & GESTIÓN FINANCIERA (COLOMBIA: PSE, NEQUI, DAVIPLATA, TARJETAS)
   ========================================================================= */

export async function createDonation(donationData: Omit<Donation, 'id' | 'createdAt'>): Promise<{ id: string; reference: string }> {
  const path = 'donations';
  const reference = donationData.reference || `JC-DON-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const raw = {
      ...donationData,
      reference,
      createdAt: new Date().toISOString()
    };
    const cleaned = sanitizePayload(raw);
    const docRef = await addDoc(collection(db, path), cleaned);

    await createAuditLog({
      action: 'Nueva Donación Iniciada',
      actor: donationData.donorName || 'Lector Anónimo',
      details: `Monto: $${donationData.amountCOP.toLocaleString('es-CO')} COP - Método: ${donationData.paymentMethod.toUpperCase()} - Estado: ${donationData.status}`,
      type: 'settings'
    });

    return { id: docRef.id, reference };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getDonations(): Promise<Donation[]> {
  const path = 'donations';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Donation[];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Error reading donations:', error);
    return [];
  }
}

export async function updateDonationStatus(
  id: string,
  status: DonationStatus,
  transactionId?: string,
  receiptNumber?: string,
  disbursementStatus?: 'pendiente' | 'desembolsado'
): Promise<void> {
  const path = `donations/${id}`;
  try {
    const payload: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (transactionId) payload.transactionId = transactionId;
    if (receiptNumber) payload.receiptNumber = receiptNumber;
    if (disbursementStatus) payload.disbursementStatus = disbursementStatus;
    if (status === 'aprobada' || status === 'aprobado' || status === 'desembolsado') {
      payload.confirmedAt = new Date().toISOString();
    }

    await updateDoc(doc(db, 'donations', id), sanitizePayload(payload));

    await createAuditLog({
      action: `Transacción Financiera ${status.toUpperCase()}`,
      actor: 'Pasarela Wompi / Sistema',
      details: `Donación/Pago ID: ${id} en estado: ${status}. Ref: ${transactionId || 'N/A'}`,
      type: 'settings'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getDonationsStats(): Promise<{
  totalAmountCOP: number;
  approvedCount: number;
  uniqueDonorsCount: number;
  averageDonationCOP: number;
}> {
  const donations = await getDonations();
  const approved = donations.filter(d => d.status === 'aprobada' || d.status === 'aprobado' || d.status === 'desembolsado');
  const totalAmountCOP = approved.reduce((sum, d) => sum + (d.amountCOP || 0), 0);
  const uniqueEmails = new Set(approved.map(d => d.donorEmail?.toLowerCase()).filter(Boolean));
  const uniqueDonorsCount = uniqueEmails.size;
  const averageDonationCOP = approved.length > 0 ? Math.round(totalAmountCOP / approved.length) : 0;

  return {
    totalAmountCOP,
    approvedCount: approved.length,
    uniqueDonorsCount,
    averageDonationCOP
  };
}

/* =========================================================================
   14. PUBLICACIONES BREVES / POSTS (Notas Rápidas y Actualizaciones)
   ========================================================================= */

export async function createPost(postData: Omit<EditorialPost, 'id' | 'createdAt'>): Promise<string> {
  const path = 'posts';
  try {
    const raw = {
      ...postData,
      likes: postData.likes || 0,
      reactions: postData.reactions || { yellow: 0, blue: 0, red: 0 },
      status: postData.status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const cleaned = sanitizePayload(raw);
    const docRef = await addDoc(collection(db, path), cleaned);

    await createAuditLog({
      action: 'Publicación Rápida Creada',
      actor: postData.authorName || 'Julian Camilo',
      details: `Contenido: "${postData.content.slice(0, 60)}..."`,
      type: 'article'
    });

    // Update local cache
    try {
      const cached = localStorage.getItem('jc_backup_posts');
      const posts: EditorialPost[] = cached ? JSON.parse(cached) : [];
      posts.unshift({ id: docRef.id, ...raw } as EditorialPost);
      localStorage.setItem('jc_backup_posts', JSON.stringify(posts));
    } catch (e) {}

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getPosts(): Promise<EditorialPost[]> {
  const path = 'posts';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EditorialPost[];

    try {
      localStorage.setItem('jc_backup_posts', JSON.stringify(items));
    } catch (e) {}

    return items;
  } catch (error) {
    console.warn('Error reading posts from Firestore, reading local backup:', error);
    try {
      const cached = localStorage.getItem('jc_backup_posts');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }
}

export async function updatePost(id: string, data: Partial<EditorialPost>): Promise<void> {
  const path = `posts/${id}`;
  try {
    const raw = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'posts', id), sanitizePayload(raw));

    try {
      const cached = localStorage.getItem('jc_backup_posts');
      if (cached) {
        const posts: EditorialPost[] = JSON.parse(cached);
        const idx = posts.findIndex(p => p.id === id);
        if (idx >= 0) {
          posts[idx] = { ...posts[idx], ...data };
          localStorage.setItem('jc_backup_posts', JSON.stringify(posts));
        }
      }
    } catch (e) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePost(id: string): Promise<void> {
  const path = `posts/${id}`;
  try {
    await deleteDoc(doc(db, 'posts', id));

    await createAuditLog({
      action: 'Publicación Rápida Eliminada',
      actor: 'Julian Camilo (Propietario)',
      details: `Se eliminó la publicación ID: ${id}`,
      type: 'article'
    });

    try {
      const cached = localStorage.getItem('jc_backup_posts');
      if (cached) {
        const posts: EditorialPost[] = JSON.parse(cached);
        const filtered = posts.filter(p => p.id !== id);
        localStorage.setItem('jc_backup_posts', JSON.stringify(filtered));
      }
    } catch (e) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordPostReaction(
  postId: string,
  newReaction: ReactionType | null,
  previousReaction: ReactionType | null
): Promise<ArticleReactions> {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    const currentData = snap.exists() ? snap.data() : {};
    const reactions: ArticleReactions = {
      yellow: currentData.reactions?.yellow || 0,
      blue: currentData.reactions?.blue || 0,
      red: currentData.reactions?.red || 0,
    };

    if (previousReaction && reactions[previousReaction] > 0) {
      reactions[previousReaction] = Math.max(0, reactions[previousReaction] - 1);
    }

    if (newReaction) {
      reactions[newReaction] = (reactions[newReaction] || 0) + 1;
    }

    await updateDoc(postRef, {
      reactions: sanitizePayload(reactions),
      updatedAt: new Date().toISOString()
    });

    try {
      const cached = localStorage.getItem('jc_backup_posts');
      if (cached) {
        const posts: EditorialPost[] = JSON.parse(cached);
        const idx = posts.findIndex(p => p.id === postId);
        if (idx >= 0) {
          posts[idx].reactions = reactions;
          localStorage.setItem('jc_backup_posts', JSON.stringify(posts));
        }
      }
    } catch (e) {}

    return reactions;
  } catch (error) {
    console.warn('Notice recording post reaction:', error);
    return { yellow: 0, blue: 0, red: 0 };
  }
}

/* =========================================================================
   SUSCRIPTORES PREMIUM ($20.000 COP)
   ========================================================================= */

export async function createSubscriber(data: Omit<SubscriberUser, 'id'>): Promise<string> {
  const path = 'subscribers_premium';
  try {
    const payload = sanitizePayload({
      ...data,
      amountCOP: data.amountCOP || 20000,
      period: data.period || 'mensual',
      status: data.status || 'activa',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const docRef = await addDoc(collection(db, path), payload);

    // Local backup
    try {
      const existing = localStorage.getItem('jc_backup_subscribers');
      const list = existing ? JSON.parse(existing) : [];
      list.push({ id: docRef.id, ...payload });
      localStorage.setItem('jc_backup_subscribers', JSON.stringify(list));
    } catch (e) {}

    return docRef.id;
  } catch (error) {
    console.error('Error creating subscriber:', error);
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function getSubscribers(): Promise<SubscriberUser[]> {
  const path = 'subscribers_premium';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const subscribers: SubscriberUser[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<SubscriberUser, 'id'>)
    }));

    try {
      localStorage.setItem('jc_backup_subscribers', JSON.stringify(subscribers));
    } catch (e) {}

    return subscribers;
  } catch (error) {
    console.warn('Fallback fetching subscribers from local backup:', error);
    try {
      const cached = localStorage.getItem('jc_backup_subscribers');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }
}

export const getPremiumSubscribers = getSubscribers;

export async function getSubscriberByEmail(email: string): Promise<SubscriberUser | null> {
  if (!email) return null;
  const path = 'subscribers_premium';
  try {
    const q = query(collection(db, path), where('email', '==', email.toLowerCase().trim()), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...(docSnap.data() as Omit<SubscriberUser, 'id'>) };
    }
  } catch (error) {
    console.warn('Checking subscriber backup by email:', error);
  }

  try {
    const cached = localStorage.getItem('jc_backup_subscribers');
    if (cached) {
      const list: SubscriberUser[] = JSON.parse(cached);
      const found = list.find((s) => s.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (found) return found;
    }
  } catch (e) {}

  return null;
}

export async function updateSubscriber(id: string, data: Partial<SubscriberUser>): Promise<void> {
  const path = `subscribers_premium/${id}`;
  try {
    const docRef = doc(db, 'subscribers_premium', id);
    const payload = sanitizePayload({
      ...data,
      updatedAt: new Date().toISOString()
    });
    await updateDoc(docRef, payload);

    try {
      const cached = localStorage.getItem('jc_backup_subscribers');
      if (cached) {
        const list: SubscriberUser[] = JSON.parse(cached);
        const idx = list.findIndex((s) => s.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...payload };
          localStorage.setItem('jc_backup_subscribers', JSON.stringify(list));
        }
      }
    } catch (e) {}
  } catch (error) {
    console.error('Error updating subscriber:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/* =========================================================================
   PUBLICIDAD & PROPUESTAS ANUNCIOS (Suscriptores Premium)
   ========================================================================= */

export async function createAdProposal(data: Omit<AdProposal, 'id'>): Promise<string> {
  const path = 'ad_proposals';
  try {
    const payload = sanitizePayload({
      ...data,
      status: 'pendiente',
      impressions: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const docRef = await addDoc(collection(db, path), payload);

    try {
      const cached = localStorage.getItem('jc_backup_ads');
      const list = cached ? JSON.parse(cached) : [];
      list.push({ id: docRef.id, ...payload });
      localStorage.setItem('jc_backup_ads', JSON.stringify(list));
    } catch (e) {}

    return docRef.id;
  } catch (error) {
    console.error('Error creating ad proposal:', error);
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function getAdProposals(filter?: { subscriberId?: string; subscriberEmail?: string; status?: string }): Promise<AdProposal[]> {
  const path = 'ad_proposals';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let list: AdProposal[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AdProposal, 'id'>)
    }));

    if (filter?.subscriberEmail) {
      list = list.filter((a) => a.subscriberEmail.toLowerCase() === filter.subscriberEmail?.toLowerCase());
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((a) => a.status === filter.status);
    }

    try {
      localStorage.setItem('jc_backup_ads', JSON.stringify(list));
    } catch (e) {}

    return list;
  } catch (error) {
    console.warn('Fallback fetching ads from local backup:', error);
    try {
      const cached = localStorage.getItem('jc_backup_ads');
      if (cached) {
        let list: AdProposal[] = JSON.parse(cached);
        if (filter?.subscriberEmail) {
          list = list.filter((a) => a.subscriberEmail.toLowerCase() === filter.subscriberEmail?.toLowerCase());
        }
        if (filter?.status && filter.status !== 'all') {
          list = list.filter((a) => a.status === filter.status);
        }
        return list;
      }
    } catch (e) {}
    return [];
  }
}

const PLACEMENT_ALIASES: Record<string, string[]> = {
  banner_principal: ['banner_principal'],
  banner_secundario: ['banner_secundario'],
  entre_articulos: ['entre_articulos', 'article_banner'],
  article_banner: ['article_banner', 'entre_articulos'],
  final_publicaciones: ['final_publicaciones', 'footer'],
  footer: ['footer', 'final_publicaciones'],
  lateral_computadores: ['lateral_computadores', 'sidebar'],
  sidebar: ['sidebar', 'lateral_computadores'],
  seccion_patrocinadores: ['seccion_patrocinadores', 'feed_sponsor'],
  feed_sponsor: ['feed_sponsor', 'seccion_patrocinadores']
};

export async function getPublicActiveAds(placement?: AdPlacement): Promise<AdProposal[]> {
  try {
    const ads = await getAdProposals();
    const todayStr = new Date().toISOString().split('T')[0];
    return ads.filter((ad) => {
      const isPublishable =
        ad.status === 'activo' ||
        ad.status === 'publicado' ||
        ad.status === 'aprobado' ||
        (ad.status === 'programado' && (!ad.scheduledStart || ad.scheduledStart.slice(0, 10) <= todayStr));
      if (!isPublishable) return false;

      if (placement) {
        const targetPlacement = ad.activePlacement || ad.requestedPlacement;
        const allowedAliases = PLACEMENT_ALIASES[placement] || [placement];
        if (!allowedAliases.includes(targetPlacement)) return false;
      }

      if (ad.scheduledStart && ad.scheduledStart.slice(0, 10) > todayStr) return false;
      if (ad.scheduledEnd && ad.scheduledEnd.slice(0, 10) < todayStr) return false;
      return true;
    });
  } catch (e) {
    return [];
  }
}

export async function updateAdProposal(id: string, data: Partial<AdProposal>): Promise<void> {
  const path = `ad_proposals/${id}`;
  try {
    const docRef = doc(db, 'ad_proposals', id);
    const payload = sanitizePayload({
      ...data,
      updatedAt: new Date().toISOString()
    });
    await updateDoc(docRef, payload);

    try {
      const cached = localStorage.getItem('jc_backup_ads');
      if (cached) {
        const list: AdProposal[] = JSON.parse(cached);
        const idx = list.findIndex((a) => a.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...payload };
          localStorage.setItem('jc_backup_ads', JSON.stringify(list));
        }
      }
    } catch (e) {}
  } catch (error) {
    console.error('Error updating ad proposal:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteAdProposal(id: string): Promise<void> {
  const path = `ad_proposals/${id}`;
  try {
    await deleteDoc(doc(db, 'ad_proposals', id));
    try {
      const cached = localStorage.getItem('jc_backup_ads');
      if (cached) {
        const list: AdProposal[] = JSON.parse(cached);
        localStorage.setItem('jc_backup_ads', JSON.stringify(list.filter((a) => a.id !== id)));
      }
    } catch (e) {}
  } catch (error) {
    console.error('Error deleting ad proposal:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function recordAdImpression(id: string): Promise<void> {
  try {
    const resp = await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: id, eventType: 'impression' })
    });
    const data = await resp.json().catch(() => ({ counted: true }));
    if (data.counted === false) return;

    const docRef = doc(db, 'ad_proposals', id);
    await updateDoc(docRef, { impressions: increment(1) });
  } catch (e) {}
}

export async function recordAdClick(id: string): Promise<void> {
  try {
    const resp = await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: id, eventType: 'click' })
    });
    const data = await resp.json().catch(() => ({ counted: true }));
    if (data.counted === false) return;

    const docRef = doc(db, 'ad_proposals', id);
    await updateDoc(docRef, { clicks: increment(1) });
  } catch (e) {}
}

export async function createAdLeadInquiry(data: {
  adId: string;
  businessName: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  message: string;
}): Promise<string> {
  const payload = sanitizePayload({
    ...data,
    createdAt: new Date().toISOString()
  });
  const ref = await addDoc(collection(db, 'ad_leads'), payload);
  return ref.id;
}

export async function getAdLeadInquiries(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'ad_leads'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getUserFavoriteArticleIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const snap = await getDoc(doc(db, 'user_favorites', userId));
    if (snap.exists() && Array.isArray(snap.data().articleIds)) {
      return snap.data().articleIds as string[];
    }
  } catch {}
  try {
    const local = localStorage.getItem(`dulima_favs_${userId}`);
    if (local) return JSON.parse(local);
  } catch {}
  return [];
}

export async function toggleUserFavoriteArticle(userId: string, articleId: string): Promise<string[]> {
  const current = await getUserFavoriteArticleIds(userId);
  const exists = current.includes(articleId);
  const updated = exists ? current.filter((id) => id !== articleId) : [...current, articleId];
  try {
    localStorage.setItem(`dulima_favs_${userId}`, JSON.stringify(updated));
  } catch {}
  try {
    await setDoc(
      doc(db, 'user_favorites', userId),
      { articleIds: updated, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch {}
  return updated;
}

/* =========================================================================
   CONFIGURACIÓN FINANCIERA & PASARELA DE PAGOS REALES
   ========================================================================= */

export const DEFAULT_PAYMENT_METHODS_CONFIG: Record<string, PaymentMethodConfig> = {
  nequi: {
    id: 'nequi',
    name: 'Nequi / Bre-B',
    enabled: true, // "por ahora solo active la opción de nequi"
    accountHolder: 'Julian Trujillo',
    accountNumber: '1072101045',
    breBKey: '1072101045',
    bankEntity: 'Nequi (Bancolombia)',
    badge: 'Bre-B Inmediato (Activo)',
    instructions: 'Abre tu app Nequi o tu banco habitual habilitado con Bre-B. Escanea el código QR oficial de Julian Trujillo o envía directo con la llave 1072101045.',
    qrImageUrl: '/assets/qr_uploaded_1.jpg',
    allowManualReference: true
  },
  daviplata: {
    id: 'daviplata',
    name: 'Daviplata / Bre-B',
    enabled: false, // Inactivo por defecto, activable por el admin
    accountHolder: 'JULIAN TRUJILLO GORDILLO',
    accountNumber: '3332306889',
    breBKey: '@PLATA3332306889',
    bankEntity: 'Daviplata (Davivienda)',
    badge: 'Bre-B Casita Roja',
    instructions: 'Escanea el código QR de Daviplata desde tu aplicación o pásale por Bre-B a la llave @PLATA3332306889 a nombre de Julian Trujillo Gordillo.',
    qrImageUrl: '',
    allowManualReference: true
  },
  bancolombia_qr: {
    id: 'bancolombia_qr',
    name: 'Bancolombia / Código QR',
    enabled: false, // Inactivo por defecto, activable por el admin
    accountHolder: 'Julian Trujillo',
    accountNumber: '',
    bankEntity: 'Bancolombia',
    badge: 'Transferencia Bancaria',
    instructions: 'Escanea el código QR oficial desde la App Bancolombia o cualquier entidad bancaria.',
    qrImageUrl: '/assets/qr_bancolombia.jpg',
    allowManualReference: true
  },
  pse: {
    id: 'pse',
    name: 'PSE (Bancos Colombianos)',
    enabled: false, // Inactivo por defecto, activable por el admin
    accountHolder: 'Julian Camilo Trujillo Gordillo',
    bankEntity: 'Red ACH Colombia (25+ Bancos)',
    badge: 'Débito Bancario',
    instructions: 'Pago electrónico seguro desde Bancolombia, Davivienda, Bogotá, BBVA y más de 25 entidades.'
  },
  card: {
    id: 'card',
    name: 'Tarjetas Débito / Crédito',
    enabled: false, // Inactivo por defecto, activable por el admin
    accountHolder: 'Julian Camilo Trujillo Gordillo',
    bankEntity: 'Visa, Mastercard, Amex',
    badge: 'Nacional e Internacional',
    instructions: 'Pagos en línea con tarjetas débito o crédito.'
  }
};

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  provider: 'wompi',
  wompiPublicKey: '',
  wompiIntegritySecret: '',
  mercadopagoPublicKey: '',
  bankName: 'Bancolombia',
  accountType: 'ahorros',
  accountNumber: '',
  accountHolder: 'Julian Camilo Trujillo Gordillo',
  documentType: 'CC',
  documentNumber: '111965400',
  isVerified: false,
  commissionRateWompi: '2.65% + $700 COP + IVA',
  disbursementTime: 'T+1 días hábiles en Bancolombia',
  monthlySubscriptionCOP: 20000,
  subscriptionPeriod: 'mensual',
  paymentMethodsConfig: DEFAULT_PAYMENT_METHODS_CONFIG
};

export async function getFinancialSettings(): Promise<FinancialSettings> {
  const path = 'settings/financial';
  try {
    const docRef = doc(db, 'settings', 'financial');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<FinancialSettings>;
      return {
        ...DEFAULT_FINANCIAL_SETTINGS,
        ...data,
        paymentMethodsConfig: {
          ...DEFAULT_PAYMENT_METHODS_CONFIG,
          ...(data.paymentMethodsConfig || {})
        }
      };
    }
  } catch (error) {
    console.warn('Fallback fetching financial settings:', error);
  }

  try {
    const cached = localStorage.getItem('jc_financial_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_FINANCIAL_SETTINGS,
        ...parsed,
        paymentMethodsConfig: {
          ...DEFAULT_PAYMENT_METHODS_CONFIG,
          ...(parsed.paymentMethodsConfig || {})
        }
      };
    }
  } catch (e) {}

  return DEFAULT_FINANCIAL_SETTINGS;
}


export async function saveFinancialSettings(data: Partial<FinancialSettings>): Promise<void> {
  const path = 'settings/financial';
  try {
    const docRef = doc(db, 'settings', 'financial');
    const current = await getFinancialSettings();
    const payload = sanitizePayload({
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    });

    await setDoc(docRef, payload, { merge: true });
    localStorage.setItem('jc_financial_settings', JSON.stringify(payload));
  } catch (error) {
    console.error('Error saving financial settings:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/* =========================================================================
   CUENTAS BANCARIAS DE RECEPCIÓN Y DESEMBOLSOS (Propietario / Admin)
   ========================================================================= */
export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bancolombia-primary',
    bankName: 'Bancolombia',
    bankCode: 'BANCOLOMBIA',
    accountType: 'ahorros',
    accountNumber: '486-902554-12',
    accountHolder: 'Julian Camilo Trujillo Gordillo',
    documentType: 'CC',
    documentNumber: '111965400',
    holderEmail: 'trujillogordilooo@gmail.com',
    alias: 'Bancolombia Ahorros Principal (Desembolsos T+1)',
    isPrimary: true,
    verificationStatus: 'verificada',
    verificationNotes: 'Certificación bancaria validada para desembolsos automáticos Wompi.',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'nequi-secondary',
    bankName: 'Nequi (Bancolombia)',
    bankCode: 'NEQUI',
    accountType: 'deposito_electronico',
    accountNumber: '3158902554',
    accountHolder: 'Julian Camilo Trujillo Gordillo',
    documentType: 'CC',
    documentNumber: '111965400',
    holderEmail: 'trujillogordilooo@gmail.com',
    alias: 'Nequi Personal Desembolso Inmediato',
    isPrimary: false,
    verificationStatus: 'verificada',
    verificationNotes: 'Monedero electrónico verificado para recepción directa.',
    createdAt: '2026-02-01T14:30:00.000Z',
    updatedAt: '2026-02-01T14:30:00.000Z'
  },
  {
    id: 'davivienda-daviplata',
    bankName: 'Davivienda / Daviplata',
    bankCode: 'DAVIVIENDA',
    accountType: 'deposito_electronico',
    accountNumber: '3158902554',
    accountHolder: 'Julian Camilo Trujillo Gordillo',
    documentType: 'CC',
    documentNumber: '111965400',
    holderEmail: 'trujillogordilooo@gmail.com',
    alias: 'Daviplata Alternativo',
    isPrimary: false,
    verificationStatus: 'en_revision',
    verificationNotes: 'En proceso de verificación con el proveedor.',
    createdAt: '2026-02-20T09:15:00.000Z',
    updatedAt: '2026-02-20T09:15:00.000Z'
  }
];

export async function getBankAccounts(): Promise<BankAccount[]> {
  const path = 'bank_accounts';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({
        id: d.id,
        isActive: true,
        ...(d.data() as Omit<BankAccount, 'id'>)
      }));
      localStorage.setItem('jc_bank_accounts', JSON.stringify(items));
      localStorage.setItem('jc_bank_accounts_initialized', 'true');
      return items;
    }
  } catch (error) {
    console.warn('Fallback fetching bank accounts:', error);
  }

  try {
    const cached = localStorage.getItem('jc_bank_accounts');
    const isInitialized = localStorage.getItem('jc_bank_accounts_initialized') === 'true';
    if (cached !== null) {
      return JSON.parse(cached);
    }
    if (isInitialized) {
      return [];
    }
  } catch (e) {}

  // Seed initial defaults only on first-ever initialization
  try {
    const seeded = INITIAL_BANK_ACCOUNTS.map((a) => ({ ...a, isActive: true }));
    localStorage.setItem('jc_bank_accounts', JSON.stringify(seeded));
    localStorage.setItem('jc_bank_accounts_initialized', 'true');
    return seeded;
  } catch (e) {
    return INITIAL_BANK_ACCOUNTS;
  }
}

export async function saveBankAccount(
  data: Partial<BankAccount>,
  accountId?: string
): Promise<string> {
  const now = new Date().toISOString();
  const path = 'bank_accounts';
  const accounts = await getBankAccounts();
  localStorage.setItem('jc_bank_accounts_initialized', 'true');

  try {
    if (accountId) {
      const docRef = doc(db, path, accountId);
      const payload = sanitizePayload({
        ...data,
        updatedAt: now
      });
      await setDoc(docRef, payload, { merge: true });

      const updated = accounts.map((acc) => (acc.id === accountId ? { ...acc, ...payload, id: accountId } : acc));
      localStorage.setItem('jc_bank_accounts', JSON.stringify(updated));
      await logFinancialAction('Actualización de cuenta bancaria', `Cuenta: ${data.bankName || 'Bancaria'} (${data.alias || ''}) actualizada.`);
      return accountId;
    } else {
      const newId = `acc_${Date.now()}`;
      const docRef = doc(db, path, newId);
      const activeCount = accounts.filter((a) => a.isActive !== false).length;
      const newAccount: BankAccount = {
        id: newId,
        bankName: data.bankName || 'Bancolombia',
        bankCode: data.bankCode,
        accountType: data.accountType || 'ahorros',
        accountNumber: data.accountNumber || '',
        accountHolder: data.accountHolder || 'Julian Camilo Trujillo Gordillo',
        documentType: data.documentType || 'CC',
        documentNumber: data.documentNumber || '111965400',
        holderEmail: data.holderEmail || 'trujillogordilooo@gmail.com',
        alias: data.alias || `${data.bankName || 'Cuenta'} de Desembolso`,
        isPrimary: data.isPrimary ?? (activeCount === 0),
        isActive: data.isActive ?? true,
        verificationStatus: data.verificationStatus || 'en_revision',
        verificationNotes: data.verificationNotes || 'En validación bancaria.',
        createdAt: now,
        updatedAt: now
      };

      await setDoc(docRef, sanitizePayload(newAccount));
      const nextList = [...accounts, newAccount];
      localStorage.setItem('jc_bank_accounts', JSON.stringify(nextList));
      await logFinancialAction('Nueva cuenta bancaria registrada', `Cuenta: ${newAccount.bankName} (${newAccount.alias}) vinculada.`);
      return newId;
    }
  } catch (error) {
    console.error('Error saving bank account:', error);
    const id = accountId || `acc_${Date.now()}`;
    const nextList = accountId
      ? accounts.map((a) => (a.id === accountId ? { ...a, ...data, id, updatedAt: now } : a))
      : [...accounts, { ...data, id, isActive: data.isActive ?? true, createdAt: now, updatedAt: now } as BankAccount];
    localStorage.setItem('jc_bank_accounts', JSON.stringify(nextList));
    return id;
  }
}

export async function setPrimaryBankAccount(accountId: string): Promise<void> {
  const accounts = await getBankAccounts();
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return;

  try {
    for (const acc of accounts) {
      const isTarget = acc.id === accountId;
      if (acc.isPrimary !== isTarget || (isTarget && acc.isActive === false)) {
        await setDoc(
          doc(db, 'bank_accounts', acc.id),
          { isPrimary: isTarget, ...(isTarget ? { isActive: true } : {}), updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    }
  } catch (e) {
    console.warn('Fallback setting primary account:', e);
  }

  const updated = accounts.map((a) => ({
    ...a,
    isPrimary: a.id === accountId,
    isActive: a.id === accountId ? true : a.isActive
  }));
  localStorage.setItem('jc_bank_accounts', JSON.stringify(updated));

  await saveFinancialSettings({
    bankName: target.bankName,
    accountType: target.accountType === 'corriente' ? 'corriente' : 'ahorros',
    accountNumber: target.accountNumber,
    accountHolder: target.accountHolder,
    documentType: target.documentType,
    documentNumber: target.documentNumber
  });

  await logFinancialAction(
    'Cuenta principal de desembolso cambiada',
    `Nueva cuenta receptora principal: ${target.bankName} - ${target.alias}`
  );
}

export async function deactivateBankAccount(accountId: string, reason?: string): Promise<void> {
  const accounts = await getBankAccounts();
  const target = accounts.find((a) => a.id === accountId);
  const now = new Date().toISOString();

  try {
    await setDoc(
      doc(db, 'bank_accounts', accountId),
      {
        isActive: false,
        isPrimary: false,
        deactivatedAt: now,
        deactivationReason: reason || 'Desactivada por el propietario conservando historial.',
        updatedAt: now
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Fallback deactivating bank account:', e);
  }

  const updated = accounts.map((a) =>
    a.id === accountId
      ? {
          ...a,
          isActive: false,
          isPrimary: false,
          deactivatedAt: now,
          deactivationReason: reason || 'Desactivada por el propietario conservando historial.',
          updatedAt: now
        }
      : a
  );
  localStorage.setItem('jc_bank_accounts', JSON.stringify(updated));
  localStorage.setItem('jc_bank_accounts_initialized', 'true');

  if (target) {
    await logFinancialAction(
      'Cuenta bancaria desactivada',
      `Cuenta desactivada conservando historial: ${target.bankName} (${target.alias})`
    );
  }
}

export async function deleteBankAccount(accountId: string): Promise<void> {
  const accounts = await getBankAccounts();
  const target = accounts.find((a) => a.id === accountId);

  try {
    await deleteDoc(doc(db, 'bank_accounts', accountId));
  } catch (e) {
    console.warn('Fallback deleting bank account:', e);
  }

  const filtered = accounts.filter((a) => a.id !== accountId);
  localStorage.setItem('jc_bank_accounts', JSON.stringify(filtered));
  localStorage.setItem('jc_bank_accounts_initialized', 'true');

  if (target) {
    await logFinancialAction('Cuenta bancaria eliminada', `Cuenta eliminada: ${target.bankName} (${target.alias})`);
  }
}

/* =========================================================================
   REGISTRO Y GESTIÓN DE DESEMBOLSOS
   ========================================================================= */
export const INITIAL_DISBURSEMENTS: DisbursementRecord[] = [
  {
    id: 'disb-2026-01',
    bankAccountId: 'bancolombia-primary',
    bankName: 'Bancolombia',
    accountNumberMasked: '•••• •••• 5412',
    amountCOP: 180000,
    reference: 'WOMPI-DISB-78901',
    period: 'Octubre 2026 - Cierre Mensual',
    status: 'desembolsado',
    notes: 'Desembolso automático liquidado a cuenta de ahorros.',
    createdAt: '2026-10-31T18:00:00.000Z',
    disbursedAt: '2026-11-01T08:30:00.000Z'
  },
  {
    id: 'disb-2026-02',
    bankAccountId: 'bancolombia-primary',
    bankName: 'Bancolombia',
    accountNumberMasked: '•••• •••• 5412',
    amountCOP: 70000,
    reference: 'WOMPI-DISB-81402',
    period: 'Noviembre 2026 - Semana 1',
    status: 'programado',
    notes: 'Programado para liquidación T+1 hábil bancario.',
    createdAt: '2026-11-02T06:00:00.000Z'
  }
];

export async function getDisbursements(): Promise<DisbursementRecord[]> {
  const path = 'disbursements';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DisbursementRecord, 'id'>)
      }));
      localStorage.setItem('jc_disbursements', JSON.stringify(items));
      return items;
    }
  } catch (error) {
    console.warn('Fallback fetching disbursements:', error);
  }

  try {
    const cached = localStorage.getItem('jc_disbursements');
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  try {
    localStorage.setItem('jc_disbursements', JSON.stringify(INITIAL_DISBURSEMENTS));
  } catch (e) {}
  return INITIAL_DISBURSEMENTS;
}

export async function createDisbursement(
  data: Omit<DisbursementRecord, 'id' | 'createdAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const path = 'disbursements';
  const newId = `disb_${Date.now()}`;
  const record: DisbursementRecord = {
    ...data,
    id: newId,
    createdAt: now
  };

  try {
    await setDoc(doc(db, path, newId), sanitizePayload(record));
  } catch (e) {
    console.warn('Fallback recording disbursement:', e);
  }

  const existing = await getDisbursements();
  const next = [record, ...existing];
  localStorage.setItem('jc_disbursements', JSON.stringify(next));

  await logFinancialAction(
    'Nuevo desembolso registrado',
    `Monto: $${data.amountCOP.toLocaleString('es-CO')} COP a ${data.bankName}. Ref: ${data.reference}`
  );
  return newId;
}

export async function updateDisbursementStatus(
  id: string,
  status: DisbursementStatus
): Promise<void> {
  const path = `disbursements/${id}`;
  const payload: Record<string, any> = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (status === 'desembolsado') {
    payload.disbursedAt = new Date().toISOString();
  }

  try {
    await updateDoc(doc(db, path, id), sanitizePayload(payload));
  } catch (e) {
    console.warn('Fallback updating disbursement status:', e);
  }

  const existing = await getDisbursements();
  const updated = existing.map((d) => (d.id === id ? { ...d, ...payload } : d));
  localStorage.setItem('jc_disbursements', JSON.stringify(updated));

  await logFinancialAction(
    'Estado de desembolso actualizado',
    `Desembolso ID: ${id} cambiado a: ${status}`
  );
}

/* =========================================================================
   AUDITORÍA FINANCIERA & REGISTRO DE SEGURIDAD
   ========================================================================= */
export async function logFinancialAction(action: string, details: string): Promise<void> {
  const now = new Date().toISOString();
  const log: FinancialAuditLog = {
    id: `flog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    adminEmail: 'trujillogordilooo@gmail.com',
    timestamp: now
  };

  try {
    await addDoc(collection(db, 'financial_audit_logs'), sanitizePayload(log));
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_financial_audit_logs') || '[]';
    const logs: FinancialAuditLog[] = JSON.parse(raw);
    logs.unshift(log);
    localStorage.setItem('jc_financial_audit_logs', JSON.stringify(logs.slice(0, 100)));
  } catch (e) {}
}

export async function getFinancialAuditLogs(): Promise<FinancialAuditLog[]> {
  try {
    const q = query(collection(db, 'financial_audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FinancialAuditLog, 'id'>)
      }));
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_financial_audit_logs');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
}

/* =========================================================================
   HISTORIAL PÚBLICO DE ACTUALIZACIONES (Changelog / Novedades)
   ========================================================================= */

export const INITIAL_PLATFORM_UPDATES: PlatformUpdate[] = [
  {
    id: 'upd_editor_multimedia_2026',
    slug: 'nuevo-editor-editorial-multimedia',
    title: 'Nuevo Editor Editorial Profesional y Soporte Multimedia Avanzado',
    summary: 'Incorporamos un editor de artículos con herramientas periodísticas completas: 11 formatos de publicación, incrustación de videos y audios con reproductor integrado, galerías fotográficas y simulador de lectura móvil.',
    content: `Nos complace presentar la mayor actualización editorial hasta la fecha en la plataforma personal de Julian Camilo. Diseñada con estándares de periódicos digitales y revistas de pensamiento contemporáneo, esta versión brinda a la redacción herramientas profesionales de última generación:

### 1. 11 Formatos de Publicación Especializados
Ahora los contenidos pueden catalogarse bajo formatos adaptados a su naturaleza periodística:
- **Opinión, Noticia, Reportaje, Entrevista, Análisis, Columna y Comunicado.**
- **Formatos Multimedia, Galería, Video y Audio.** Cada uno cuenta con distintivos cromáticos y metadatos adaptados.

### 2. Espaciado Editorial y Jerarquía Tipográfica
El texto ya no se presenta como un bloque comprimido. Se implementó una separación visual armónica entre párrafos, citas destacadas con atribución de autor/orador, bloques de información contextual (callouts) y separadores elegantes con sutil acento tolimense y colombiano.

### 3. Integración de Video y Reproductor de Audio Nativo
- **Video:** Reproducción responsive 16:9 con soporte para YouTube, Vimeo y archivos MP4 directos.
- **Audio:** Reproductor editorial interactivo con control de avance, temporizador en vivo (00:00 / 00:00), portada de audio y control de volumen. Ideal para declaraciones políticas, análisis de voz y entrevistas.

### 4. Visor Dual de Lectura (Escritorio y Móvil)
El editor incluye un simulador de smartphone de 375px para comprobar con exactitud cómo experimentarán la lectura los ciudadanos desde sus dispositivos móviles antes de que el artículo sea aprobado o publicado.

### 5. Control Editorial Riguroso y Guardado en Borrador
Los suscriptores Premium y colaboradores pueden redactar borradores con todas estas herramientas avanzadas, manteniendo la aprobación final bajo el control exclusivo del administrador.`,
    date: '2026-11-03',
    category: 'nuevas_funcionalidades',
    tags: ['Editor', 'Multimedia', 'Video', 'Audio', 'Diseño Editorial', 'Móvil'],
    status: 'publicado',
    featured: true,
    versionTag: 'v2.6.0',
    authorName: 'Julian Camilo',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop',
    imageCaption: 'Nueva experiencia de redacción y lectura enriquecida para análisis de fondo.',
    createdAt: '2026-11-03T09:00:00.000Z',
    updatedAt: '2026-11-03T09:00:00.000Z'
  },
  {
    id: 'upd_centro_financiero_2026',
    slug: 'centro-financiero-cuentas-desembolso-wompi',
    title: 'Centro Financiero Privado y Gestión de Cuentas de Desembolso',
    summary: 'Implementación del panel de «Mis cuentas y configuración financiera» con soporte para Bancolombia, Nequi, Davivienda, Daviplata, pasarela Wompi y suscripción mensual de $20.000 COP.',
    content: `Se ha completado la arquitectura financiera privada para la recepción y administración de fondos recaudados por donaciones de lectores y suscripciones editoriales:

### 1. Panel Privado «Mis cuentas y configuración financiera»
Accesible únicamente para el titular de la plataforma en su perfil administrativo. Permite registrar y gestionar de manera completamente confidencial las cuentas bancarias para desembolsos:
- **Entidades soportadas:** Bancolombia, Nequi, Davivienda, Daviplata, Banco de Bogotá, BBVA y demás entidades colombianas.
- **Enmascaramiento y privacidad estricta:** Los números de cuenta se protegen visualmente (ej. ****4589) y nunca son expuestos a lectores ni visitantes.
- **Selección de cuenta principal:** Posibilidad de definir qué cuenta bancaria o billetera digital recibe los desembolsos periódicos.

### 2. Suscripción Premium por $20.000 COP
Un modelo de participación que permite a lectores y autores enviar artículos y propuestas publicitarias a revisión editorial, con pasarela de pago oficial de Wompi Bancolombia.`,
    date: '2026-11-02',
    category: 'seguridad',
    tags: ['Finanzas', 'Wompi', 'Bancolombia', 'Nequi', 'Seguridad', 'Suscripciones'],
    status: 'publicado',
    featured: false,
    versionTag: 'v2.5.0',
    authorName: 'Julian Camilo',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop',
    imageCaption: 'Administración transparente, segura y profesional de recursos editoriales.',
    createdAt: '2026-11-02T14:30:00.000Z',
    updatedAt: '2026-11-02T14:30:00.000Z'
  },
  {
    id: 'upd_google_drive_cloud_2026',
    slug: 'integracion-google-drive-respaldo-cloud',
    title: 'Integración Oficial con Google Drive y Respaldo Editorial en la Nube',
    summary: 'Conexión mediante OAuth seguro con Google Drive para respaldar publicaciones, exportar archivos y sincronizar recursos multimedia directamente con almacenamiento en la nube.',
    content: `Para garantizar la preservación del acervo intelectual y periodístico de la plataforma, se ha habilitado la integración directa con Google Drive:

- **Explorador de Archivos en Vivo:** Visualización directa de la estructura de carpetas de Drive desde el panel administrativo.
- **Copia de Seguridad con un Clic:** Exportación de artículos y ensayos en formato estructurado para salvaguardar el archivo histórico de Julian Camilo.
- **Vinculación a la Biblioteca Multimedia:** Posibilidad de importar fotografías y documentos de apoyo desde el almacenamiento corporativo sin intermediarios.`,
    date: '2026-11-01',
    category: 'nuevas_funcionalidades',
    tags: ['Google Drive', 'Cloud', 'Respaldo', 'Almacenamiento', 'OAuth'],
    status: 'publicado',
    featured: false,
    versionTag: 'v2.4.0',
    authorName: 'Julian Camilo',
    imageUrl: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?q=80&w=1200&auto=format&fit=crop',
    imageCaption: 'Seguridad y respaldo permanente de los contenidos periodísticos en la nube.',
    createdAt: '2026-11-01T11:00:00.000Z',
    updatedAt: '2026-11-01T11:00:00.000Z'
  },
  {
    id: 'upd_modo_ligero_tolima_2026',
    slug: 'modo-lectura-ligera-identidad-tolimense',
    title: 'Modo de Lectura Ligera para Ahorro de Datos e Identidad Tolimense',
    summary: 'Optimizamos la experiencia en conexiones móviles de bajo ancho de banda con carga de imágenes bajo demanda, e incorporamos sutiles acentos visuales conmemorativos de Colombia y la región del Tolima.',
    content: `Pensando en la diversidad geográfica de los lectores en Colombia y las variaciones en conectividad móvil en carreteras y municipios:

- **Modo Lectura Ligera:** Permite activar con un solo clic el ahorro de datos móviles. Las imágenes de alta resolución se sustituyen por marcadores elegantes con opción de "Cargar imagen bajo demanda".
- **Identidad Nacional y Tolimense:** Se agregaron microdetalles cromáticos en la barra superior (amarillo, azul y rojo de la bandera nacional) y tonos vinotinto y oro sutiles que rinden homenaje al Tolima y a Ibagué, sin alterar la sobriedad editorial de la plataforma.`,
    date: '2026-10-28',
    category: 'mejoras_diseno',
    tags: ['Lectura Ligera', 'Tolima', 'Colombia', 'Rendimiento', 'Optimización'],
    status: 'publicado',
    featured: false,
    versionTag: 'v2.3.0',
    authorName: 'Julian Camilo',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    imageCaption: 'Compromiso con el acceso universal a la información en cualquier rincón del país.',
    createdAt: '2026-10-28T16:00:00.000Z',
    updatedAt: '2026-10-28T16:00:00.000Z'
  }
];

export async function getPlatformUpdates(options?: {
  category?: PlatformUpdateCategory;
  includeDrafts?: boolean;
}): Promise<PlatformUpdate[]> {
  try {
    const q = query(collection(db, 'platform_updates'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      let items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PlatformUpdate, 'id'>)
      })) as PlatformUpdate[];

      if (!options?.includeDrafts) {
        items = items.filter((it) => it.status === 'publicado');
      }
      if (options?.category) {
        items = items.filter((it) => it.category === options.category);
      }
      return items;
    }
  } catch (e) {
    console.warn('Fallback getting platform updates from cache:', e);
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem('jc_platform_updates');
    if (raw) {
      let items: PlatformUpdate[] = JSON.parse(raw);
      if (!options?.includeDrafts) {
        items = items.filter((it) => it.status === 'publicado');
      }
      if (options?.category) {
        items = items.filter((it) => it.category === options.category);
      }
      return items;
    }
  } catch (e) {}

  // Fallback to seeded initial updates
  let defaults = INITIAL_PLATFORM_UPDATES;
  if (!options?.includeDrafts) {
    defaults = defaults.filter((it) => it.status === 'publicado');
  }
  if (options?.category) {
    defaults = defaults.filter((it) => it.category === options.category);
  }
  return defaults;
}

export async function getPlatformUpdateBySlug(slug: string): Promise<PlatformUpdate | null> {
  try {
    const q = query(collection(db, 'platform_updates'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...(docSnap.data() as Omit<PlatformUpdate, 'id'>) };
    }
  } catch (e) {}

  const all = await getPlatformUpdates({ includeDrafts: true });
  return all.find((u) => u.slug === slug || u.id === slug) || null;
}

export async function savePlatformUpdate(
  update: Omit<PlatformUpdate, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const now = new Date().toISOString();
  const updateId = id || `upd_${Date.now()}`;
  const payload: PlatformUpdate = {
    id: updateId,
    ...update,
    createdAt: now,
    updatedAt: now
  };

  try {
    const docRef = doc(db, 'platform_updates', updateId);
    await setDoc(docRef, sanitizePayload(payload), { merge: true });
  } catch (e) {
    console.warn('Fallback saving platform update to localStorage:', e);
  }

  try {
    const all = await getPlatformUpdates({ includeDrafts: true });
    const existingIndex = all.findIndex((u) => u.id === updateId);
    if (existingIndex >= 0) {
      all[existingIndex] = { ...all[existingIndex], ...payload };
    } else {
      all.unshift(payload);
    }
    localStorage.setItem('jc_platform_updates', JSON.stringify(all));
  } catch (e) {}

  await logFinancialAction(
    id ? 'Actualización de Plataforma Editada' : 'Nueva Actualización de Plataforma Publicada',
    `Título: "${payload.title}" — Categoría: ${payload.category}`
  );

  return updateId;
}

export async function deletePlatformUpdate(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'platform_updates', id));
  } catch (e) {
    console.warn('Fallback deleting platform update from localStorage:', e);
  }

  try {
    const all = await getPlatformUpdates({ includeDrafts: true });
    const filtered = all.filter((u) => u.id !== id);
    localStorage.setItem('jc_platform_updates', JSON.stringify(filtered));
  } catch (e) {}

  await logFinancialAction(
    'Actualización de Plataforma Eliminada',
    `ID de actualización eliminada: ${id}`
  );
}

/* =========================================================================
   PLANES DE SUSCRIPCIÓN PREMIUM (Configuración Dinámica y Flexible)
   ========================================================================= */

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_individual',
    slug: 'individual',
    name: 'Plan Individual',
    tagline: 'Publicación de 1 artículo',
    priceCOP: 5000,
    durationDays: 30,
    period: 'pago_unico',
    description: 'Pago único para enviar un artículo a revisión editorial y publicarlo en la plataforma una vez sea aprobado por Julian Camilo.',
    articleLimit: 1,
    adProposalsLimit: 0,
    benefits: [
      'Envío de 1 artículo a revisión editorial',
      'Acceso al editor enriquecido multimedia (fotos, videos, audios)',
      'Revisión y retroalimentación directa de Julian Camilo',
      'Publicación permanente una vez aprobado',
      'Insignia de autor suscriptor en la publicación',
      'Estadísticas de visualizaciones y reacciones'
    ],
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plan_semanal',
    slug: 'semanal',
    name: 'Plan Semanal',
    tagline: 'Cobertura de actualidad por 7 días',
    priceCOP: 10000,
    durationDays: 7,
    period: 'semanal',
    description: 'Vigencia de 7 días continuos. Envía artículos ilimitados para revisión durante la semana y postula 1 anuncio publicitario.',
    articleLimit: 999,
    adProposalsLimit: 1,
    benefits: [
      'Vigencia activa por 7 días calendario',
      'Envíos ilimitados de artículos a revisión editorial',
      'Postulación de 1 propuesta publicitaria para revisión',
      'Panel de autor con control de borradores y estados',
      'Insignia de autor suscriptor en todos tus contenidos',
      'Respuesta editorial ágil durante tu semana activa'
    ],
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plan_mensual',
    slug: 'mensual',
    name: 'Plan Mensual',
    tagline: 'Membresía editorial recurrente',
    priceCOP: 20000,
    durationDays: 30,
    period: 'mensual',
    description: '30 días de acceso editorial completo. Envíos ilimitados de artículos para aprobación, Modo Ahorrar datos Premium y opción de insignia colombiana.',
    articleLimit: 999,
    adProposalsLimit: 3,
    benefits: [
      'Vigencia activa por 30 días renovables',
      'Envíos ilimitados de artículos a revisión editorial',
      'Modo Ahorrar datos Premium exclusivo incluido',
      'Elegible para solicitar insignia de verificación colombiana',
      'Postulación de hasta 3 propuestas publicitarias',
      'Revisión editorial prioritaria en menos de 24 horas',
      'Comprobante de pago digital e historial de transacciones'
    ],
    isPopular: true,
    badge: 'Más Popular',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plan_anual',
    slug: 'anual',
    name: 'Plan Anual',
    tagline: 'Máximo ahorro y presencia institucional',
    priceCOP: 70000,
    originalPriceCOP: 240000,
    discountPercentage: 71,
    durationDays: 365,
    period: 'anual',
    description: 'Acceso editorial ilimitado por 365 días al precio más conveniente. Ahorro del 71% sobre tarifa mensual, Modo Ahorrar datos Premium, creación de encuestas e insignia colombiana.',
    articleLimit: 999,
    adProposalsLimit: 52,
    adProposalsWeeklyLimit: 1,
    benefits: [
      'Vigencia activa por 365 días (1 año completo)',
      '1 propuesta publicitaria cada 7 días (beneficio semanal exclusivo)',
      'Creación de encuestas ciudadanas (sujeto a revisión)',
      'Ahorro del 71% sobre la tarifa mensual',
      'Envíos ilimitados de artículos y columnas sin restricción',
      'Modo Ahorrar datos Premium exclusivo incluido',
      'Elegible para solicitar insignia de verificación colombiana',
      'Certificado digital de membresía y recibos oficiales'
    ],
    badge: 'Mayor Ahorro (71% OFF)',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DELETED_PLAN_IDS_KEY = 'jc_deleted_plan_ids';

function getDeletedPlanIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PLAN_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function recordDeletedPlanId(id: string) {
  try {
    const set = getDeletedPlanIds();
    set.add(id);
    localStorage.setItem(DELETED_PLAN_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function clearDeletedPlanId(id: string) {
  try {
    const set = getDeletedPlanIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(DELETED_PLAN_IDS_KEY, JSON.stringify(Array.from(set)));
    }
  } catch {}
}

export async function getSubscriptionPlans(options?: { includeInactive?: boolean }): Promise<SubscriptionPlan[]> {
  const path = 'subscription_plans';
  const deletedIds = getDeletedPlanIds();
  const plansMap = new Map<string, SubscriptionPlan>();

  // 1. Seed defaults that haven't been deleted
  DEFAULT_SUBSCRIPTION_PLANS.forEach((dp) => {
    if (!deletedIds.has(dp.id)) {
      plansMap.set(dp.id, { ...dp });
    }
  });

  // 2. Overlay local cache
  try {
    const cached = localStorage.getItem('jc_backup_plans');
    if (cached) {
      const cachedList: SubscriptionPlan[] = JSON.parse(cached);
      cachedList.forEach((cp) => {
        if (!deletedIds.has(cp.id)) {
          plansMap.set(cp.id, cp);
        }
      });
    }
  } catch (e) {}

  // 3. Overlay Firestore documents (authoritative)
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.docs.forEach((d) => {
        if (!deletedIds.has(d.id)) {
          const docData = d.data() as Omit<SubscriptionPlan, 'id'>;
          plansMap.set(d.id, {
            id: d.id,
            ...docData
          });
        }
      });
    }
  } catch (error) {
    console.warn('Fallback fetching subscription plans from Firestore, using merged cache:', error);
  }

  let finalPlans = Array.from(plansMap.values());
  finalPlans.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Persist updated complete list
  try {
    localStorage.setItem('jc_backup_plans', JSON.stringify(finalPlans));
  } catch (e) {}

  if (!options?.includeInactive) {
    finalPlans = finalPlans.filter((p) => p.isActive);
  }

  return finalPlans;
}

export async function saveSubscriptionPlan(
  planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const now = new Date().toISOString();
  const planId = id || `plan_${Date.now()}`;
  clearDeletedPlanId(planId);

  const payload: SubscriptionPlan = {
    id: planId,
    ...planData,
    createdAt: now,
    updatedAt: now
  };

  // Immediate local update so UI is never blocked
  try {
    const cached = localStorage.getItem('jc_backup_plans');
    let list: SubscriptionPlan[] = cached ? JSON.parse(cached) : [...DEFAULT_SUBSCRIPTION_PLANS];
    const idx = list.findIndex((p) => p.id === planId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...payload };
    } else {
      list.push(payload);
    }
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    localStorage.setItem('jc_backup_plans', JSON.stringify(list));
  } catch (e) {}

  // Firestore update
  try {
    const docRef = doc(db, 'subscription_plans', planId);
    await setDoc(docRef, sanitizePayload(payload), { merge: true });
  } catch (e) {
    console.warn('Firestore setDoc notice for subscription plan:', e);
  }

  try {
    await logFinancialAction(
      id ? 'Plan de Suscripción Actualizado' : 'Nuevo Plan de Suscripción Creado',
      `Plan: "${payload.name}" — Precio: $${payload.priceCOP.toLocaleString('es-CO')} COP`
    );
  } catch (e) {}

  return planId;
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  recordDeletedPlanId(id);

  try {
    const cached = localStorage.getItem('jc_backup_plans');
    if (cached) {
      const list: SubscriptionPlan[] = JSON.parse(cached);
      const filtered = list.filter((p) => p.id !== id);
      localStorage.setItem('jc_backup_plans', JSON.stringify(filtered));
    }
  } catch (e) {}

  try {
    await deleteDoc(doc(db, 'subscription_plans', id));
  } catch (e) {
    console.warn('Fallback deleting subscription plan from Firestore:', e);
  }

  try {
    await logFinancialAction(
      'Plan de Suscripción Eliminado',
      `ID de plan eliminado: ${id}`
    );
  } catch (e) {}
}

export async function toggleSubscriptionPlanStatus(id: string, isActive: boolean): Promise<void> {
  const all = await getSubscriptionPlans({ includeInactive: true });
  const target = all.find((p) => p.id === id);
  if (!target) return;

  await saveSubscriptionPlan(
    {
      ...target,
      isActive
    },
    id
  );
}

/* =========================================================================
   PAGOS Y COMPROBANTES DE SUSCRIPCIONES
   ========================================================================= */

export async function recordSubscriptionPayment(
  data: Omit<SubscriptionPaymentRecord, 'id' | 'createdAt' | 'receiptNumber'>
): Promise<SubscriptionPaymentRecord> {
  const now = new Date().toISOString();
  const paymentId = `subpay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const receiptNumber = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const record: SubscriptionPaymentRecord = {
    id: paymentId,
    ...data,
    receiptNumber,
    createdAt: now,
    confirmedAt: data.status === 'aprobado' ? now : undefined
  };

  try {
    const docRef = doc(db, 'subscription_payments', paymentId);
    await setDoc(docRef, sanitizePayload(record));
  } catch (e) {
    console.warn('Fallback recording subscription payment to local:', e);
  }

  try {
    const existing = localStorage.getItem('jc_subscription_payments');
    const list: SubscriptionPaymentRecord[] = existing ? JSON.parse(existing) : [];
    list.unshift(record);
    localStorage.setItem('jc_subscription_payments', JSON.stringify(list));
  } catch (e) {}

  await logFinancialAction(
    'Pago de Suscripción Registrado',
    `Usuario: ${data.subscriberName} (${data.subscriberEmail}) — Plan: ${data.planName} — Valor: $${data.amountCOP.toLocaleString('es-CO')} COP — Estado: ${data.status}`
  );

  return record;
}

export async function getSubscriptionPayments(filter?: {
  subscriberEmail?: string;
  status?: string;
}): Promise<SubscriptionPaymentRecord[]> {
  try {
    const q = query(collection(db, 'subscription_payments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      let list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SubscriptionPaymentRecord, 'id'>)
      }));

      if (filter?.subscriberEmail) {
        list = list.filter((p) => p.subscriberEmail.toLowerCase() === filter.subscriberEmail?.toLowerCase());
      }
      if (filter?.status && filter.status !== 'all') {
        list = list.filter((p) => p.status === filter.status);
      }

      try {
        localStorage.setItem('jc_subscription_payments', JSON.stringify(list));
      } catch (e) {}

      return list;
    }
  } catch (e) {
    console.warn('Fallback getting subscription payments from local:', e);
  }

  try {
    const cached = localStorage.getItem('jc_subscription_payments');
    if (cached) {
      let list: SubscriptionPaymentRecord[] = JSON.parse(cached);
      if (filter?.subscriberEmail) {
        list = list.filter((p) => p.subscriberEmail.toLowerCase() === filter.subscriberEmail?.toLowerCase());
      }
      if (filter?.status && filter.status !== 'all') {
        list = list.filter((p) => p.status === filter.status);
      }
      return list;
    }
  } catch (e) {}

  return [];
}

export async function updateSubscriptionPaymentStatus(
  id: string,
  status: 'aprobado' | 'pendiente' | 'rechazado' | 'reembolsado',
  refundReason?: string
): Promise<void> {
  const payload: any = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (status === 'reembolsado') {
    payload.refundedAt = new Date().toISOString();
    payload.refundReason = refundReason || 'Reembolso autorizado por el administrador';
  }

  try {
    const docRef = doc(db, 'subscription_payments', id);
    await updateDoc(docRef, payload);
  } catch (e) {}

  try {
    const cached = localStorage.getItem('jc_subscription_payments');
    if (cached) {
      const list: SubscriptionPaymentRecord[] = JSON.parse(cached);
      const updated = list.map((p) => (p.id === id ? { ...p, ...payload } : p));
      localStorage.setItem('jc_subscription_payments', JSON.stringify(updated));
    }
  } catch (e) {}

  await logFinancialAction(
    'Estado de Pago de Suscripción Actualizado',
    `ID: ${id} — Nuevo estado: ${status}${refundReason ? ` — Razón: ${refundReason}` : ''}`
  );
}

/* =========================================================================
   GUARDAR ARTÍCULOS PARA LEER DESPUÉS (Reading List / Marcadores)
   ========================================================================= */

const LOCAL_STORAGE_SAVED_ARTICLES_KEY = 'jc_saved_reading_list';

export function getSavedArticles(): SavedArticle[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_ARTICLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveArticleToReadingList(article: Article): boolean {
  try {
    const existing = getSavedArticles();
    if (existing.some((a) => a.articleId === article.id || a.articleSlug === article.slug)) {
      return false; // Ya está guardado
    }
    const item: SavedArticle = {
      id: `saved_${Date.now()}`,
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      articleCategory: article.categoryName,
      articleCoverUrl: article.coverImageUrl,
      readingMinutes: article.readingMinutes || 5,
      savedAt: new Date().toISOString()
    };
    existing.unshift(item);
    localStorage.setItem(LOCAL_STORAGE_SAVED_ARTICLES_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    return false;
  }
}

export function removeArticleFromReadingList(articleIdOrSlug: string): void {
  try {
    const existing = getSavedArticles();
    const filtered = existing.filter((a) => a.articleId !== articleIdOrSlug && a.articleSlug !== articleIdOrSlug);
    localStorage.setItem(LOCAL_STORAGE_SAVED_ARTICLES_KEY, JSON.stringify(filtered));
  } catch (e) {}
}

export function isArticleSavedInList(articleIdOrSlug: string): boolean {
  try {
    const existing = getSavedArticles();
    return existing.some((a) => a.articleId === articleIdOrSlug || a.articleSlug === articleIdOrSlug);
  } catch (e) {
    return false;
  }
}

/* =========================================================================
   REPORTES DE CONTENIDO INAPROPIADO
   ========================================================================= */

export async function createContentReport(
  data: Omit<ContentReport, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const path = 'content_reports';
  const now = new Date().toISOString();
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const payload: ContentReport = {
    id: reportId,
    ...data,
    status: 'pendiente',
    createdAt: now
  };

  try {
    const docRef = doc(db, path, reportId);
    await setDoc(docRef, sanitizePayload(payload));
  } catch (e) {
    console.warn('Fallback saving content report:', e);
  }

  try {
    const raw = localStorage.getItem('jc_content_reports');
    const list: ContentReport[] = raw ? JSON.parse(raw) : [];
    list.unshift(payload);
    localStorage.setItem('jc_content_reports', JSON.stringify(list));
  } catch (e) {}

  return reportId;
}

export async function getContentReports(filter?: { status?: string }): Promise<ContentReport[]> {
  try {
    const q = query(collection(db, 'content_reports'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      let list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ContentReport, 'id'>)
      }));
      if (filter?.status && filter.status !== 'all') {
        list = list.filter((r) => r.status === filter.status);
      }
      return list;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_content_reports');
    if (raw) {
      let list: ContentReport[] = JSON.parse(raw);
      if (filter?.status && filter.status !== 'all') {
        list = list.filter((r) => r.status === filter.status);
      }
      return list;
    }
  } catch (e) {}

  return [];
}

export async function updateContentReportStatus(
  id: string,
  status: 'revisado' | 'descartado',
  adminNotes?: string
): Promise<void> {
  const payload: any = {
    status,
    adminNotes,
    reviewedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'content_reports', id);
    await updateDoc(docRef, payload);
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_content_reports');
    if (raw) {
      const list: ContentReport[] = JSON.parse(raw);
      const updated = list.map((r) => (r.id === id ? { ...r, ...payload } : r));
      localStorage.setItem('jc_content_reports', JSON.stringify(updated));
    }
  } catch (e) {}
}

/* =========================================================================
   HISTORIAL DE VERSIONES DE ARTÍCULOS
   ========================================================================= */

export async function saveArticleVersionSnapshot(
  articleId: string,
  article: Partial<Article>,
  changeSummary?: string
): Promise<void> {
  const path = 'article_versions';
  const now = new Date().toISOString();
  const snapshotId = `vsnap_${articleId}_${Date.now()}`;

  const currentVersions = await getArticleVersionSnapshots(articleId);
  const nextVersionNum = currentVersions.length + 1;

  const payload: ArticleVersionSnapshot = {
    id: snapshotId,
    articleId,
    versionNumber: nextVersionNum,
    title: article.title || '',
    subtitle: article.subtitle,
    content: article.content || '',
    changeSummary: changeSummary || 'Actualización editorial periódica',
    authorName: article.authorName || 'Julian Camilo',
    createdAt: now
  };

  try {
    const docRef = doc(db, path, snapshotId);
    await setDoc(docRef, sanitizePayload(payload));
  } catch (e) {}

  try {
    const key = `jc_versions_${articleId}`;
    const raw = localStorage.getItem(key);
    const list: ArticleVersionSnapshot[] = raw ? JSON.parse(raw) : [];
    list.unshift(payload);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 30)));
  } catch (e) {}
}

export async function getArticleVersionSnapshots(articleId: string): Promise<ArticleVersionSnapshot[]> {
  try {
    const q = query(
      collection(db, 'article_versions'),
      where('articleId', '==', articleId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ArticleVersionSnapshot, 'id'>)
      }));
    }
  } catch (e) {}

  try {
    const key = `jc_versions_${articleId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
}

/* =========================================================================
   CONFIGURACIÓN DE TARIFAS Y ESPACIOS PUBLICITARIOS
   ========================================================================= */

export const DEFAULT_AD_PRICING_CONFIG: AdPricingConfig[] = [
  {
    placement: 'banner_principal',
    label: 'Banner Principal',
    locationDescription: 'Cabecera superior de la portada editorial',
    defaultFormat: 'banner_horizontal',
    recommendedDimensions: '1200x250 px',
    allowedTypes: ['imagen', 'video', 'interactivo', 'especial'],
    description: 'Espacio destacado en la cabecera superior de la portada editorial.',
    priceCOP: 120000,
    pricePerDayCOP: 6000,
    pricePerWeekCOP: 35000,
    pricePerMonthCOP: 120000,
    durationDays: 30,
    availability: 'disponible',
    active: true
  },
  {
    placement: 'banner_secundario',
    label: 'Banner Secundario',
    locationDescription: 'Franja intermedia en portada y archivo editorial',
    defaultFormat: 'banner_horizontal',
    recommendedDimensions: '1000x220 px',
    allowedTypes: ['imagen', 'video', 'interactivo', 'especial'],
    description: 'Franja editorial intermedia en portada y archivo general.',
    priceCOP: 80000,
    pricePerDayCOP: 4000,
    pricePerWeekCOP: 25000,
    pricePerMonthCOP: 80000,
    durationDays: 30,
    availability: 'disponible',
    active: true
  },
  {
    placement: 'entre_articulos',
    label: 'Anuncio entre Artículos',
    locationDescription: 'Integrado entre bloques de lectura de Artículos y Publicaciones',
    defaultFormat: 'en_articulo',
    recommendedDimensions: '800x250 px',
    allowedTypes: ['imagen', 'video', 'interactivo', 'especial'],
    description: 'Integrado de forma limpia entre bloques de lectura de artículos.',
    priceCOP: 65000,
    pricePerDayCOP: 3500,
    pricePerWeekCOP: 20000,
    pricePerMonthCOP: 65000,
    durationDays: 30,
    availability: 'disponible',
    active: true
  },
  {
    placement: 'final_publicaciones',
    label: 'Al Final de Publicaciones',
    locationDescription: 'Cierre de cada artículo antes de la sección de comentarios',
    defaultFormat: 'tarjeta_promocional',
    recommendedDimensions: '800x240 px',
    allowedTypes: ['imagen', 'video', 'interactivo', 'especial'],
    description: 'Ubicado al cierre de cada artículo antes de la sección de comentarios.',
    priceCOP: 50000,
    pricePerDayCOP: 2500,
    pricePerWeekCOP: 15000,
    pricePerMonthCOP: 50000,
    durationDays: 30,
    availability: 'disponible',
    active: true
  },
  {
    placement: 'lateral_computadores',
    label: 'Espacio Lateral en Computadores',
    locationDescription: 'Columna lateral derecha en pantallas de escritorio',
    defaultFormat: 'banner_vertical',
    recommendedDimensions: '300x600 px',
    allowedTypes: ['imagen', 'video', 'interactivo', 'especial'],
    description: 'Columna lateral visible en pantallas de escritorio sin interrumpir el texto.',
    priceCOP: 70000,
    pricePerDayCOP: 3500,
    pricePerWeekCOP: 22000,
    pricePerMonthCOP: 70000,
    durationDays: 30,
    availability: 'disponible',
    active: true
  },
  {
    placement: 'seccion_patrocinadores',
    label: 'Sección de Patrocinadores',
    locationDescription: 'Directorio oficial de aliados y patrocinadores',
    defaultFormat: 'directorio_anunciantes',
    recommendedDimensions: '600x400 px',
    allowedTypes: ['imagen', 'video', 'interactivo', 'especial'],
    description: 'Tarjeta institucional en el directorio oficial de aliados y patrocinadores.',
    priceCOP: 45000,
    pricePerDayCOP: 2500,
    pricePerWeekCOP: 15000,
    pricePerMonthCOP: 45000,
    durationDays: 30,
    availability: 'disponible',
    active: true
  }
];

export async function getAdPricingConfig(): Promise<AdPricingConfig[]> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'ad_pricing'));
    if (snap.exists() && Array.isArray(snap.data().items)) {
      const items = snap.data().items as AdPricingConfig[];
      localStorage.setItem('jc_ad_pricing_config', JSON.stringify(items));
      return items;
    }
  } catch (e) {}

  try {
    const cached = localStorage.getItem('jc_ad_pricing_config');
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  return DEFAULT_AD_PRICING_CONFIG;
}

export async function saveAdPricingConfig(items: AdPricingConfig[]): Promise<void> {
  try {
    localStorage.setItem('jc_ad_pricing_config', JSON.stringify(items));
  } catch (e) {}

  try {
    await setDoc(
      doc(db, 'settings', 'ad_pricing'),
      sanitizePayload({ items, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (e) {
    console.warn('Fallback saving ad pricing config locally:', e);
  }
}

/* =========================================================================
   PERFILES DE AUTOR & VERIFICACIÓN CON IDENTIDAD COLOMBIANA
   ========================================================================= */

export async function getAuthorProfiles(): Promise<AuthorProfile[]> {
  try {
    const q = query(collection(db, 'author_profiles'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AuthorProfile, 'id'>)
      }));
      try {
        localStorage.setItem('jc_author_profiles', JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (e) {}

  try {
    const cached = localStorage.getItem('jc_author_profiles');
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  return [];
}

export async function getAuthorProfileByEmailOrName(
  email?: string,
  fullName?: string
): Promise<AuthorProfile | null> {
  const all = await getAuthorProfiles();
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    const byEmail = all.find((p) => p.email?.toLowerCase().trim() === cleanEmail);
    if (byEmail) return byEmail;
  }
  if (fullName) {
    const cleanName = fullName.toLowerCase().trim();
    const byName = all.find((p) => p.fullName.toLowerCase().trim() === cleanName);
    if (byName) return byName;
  }
  return null;
}

/**
 * Saves or updates an AuthorProfile's personal/public fields.
 * SECURITY: Strictly strips verification fields so users can NEVER self-assign or modify verification status.
 */
export async function saveAuthorProfile(
  data: Partial<AuthorProfile> & { fullName: string; role: 'owner' | 'collaborator' | 'subscriber' },
  existingId?: string
): Promise<AuthorProfile> {
  const cleanName = sanitizePlainText(data.fullName, 120);
  if (!cleanName) {
    throw new Error('El nombre completo es obligatorio.');
  }

  const now = new Date().toISOString();
  const all = await getAuthorProfiles();
  const existing = existingId
    ? all.find((p) => p.id === existingId)
    : data.email
    ? all.find((p) => p.email?.toLowerCase() === data.email?.toLowerCase())
    : undefined;

  const profileId = existing?.id || existingId || `author_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Sanitize social links URLs
  const cleanSocials = data.socialLinks
    ? {
        twitter: sanitizeSafeUrl(data.socialLinks.twitter),
        instagram: sanitizeSafeUrl(data.socialLinks.instagram),
        linkedin: sanitizeSafeUrl(data.socialLinks.linkedin),
        facebook: sanitizeSafeUrl(data.socialLinks.facebook),
        website: sanitizeSafeUrl(data.socialLinks.website)
      }
    : existing?.socialLinks;

  const updatedProfile: AuthorProfile = {
    id: profileId,
    userId: data.userId || existing?.userId,
    role: existing?.role || data.role,
    fullName: cleanName,
    phone: data.phone !== undefined ? sanitizePlainText(data.phone, 40) : existing?.phone,
    email: data.email !== undefined ? sanitizePlainText(data.email, 150).toLowerCase() : existing?.email,
    occupation: data.occupation !== undefined ? sanitizePlainText(data.occupation, 120) : existing?.occupation,
    photoUrl: data.photoUrl !== undefined ? sanitizeSafeUrl(data.photoUrl) : existing?.photoUrl,
    bio: data.bio !== undefined ? sanitizePlainText(data.bio, 2000) : existing?.bio,
    city: data.city !== undefined ? sanitizePlainText(data.city, 100) : existing?.city,
    country: data.country !== undefined ? sanitizePlainText(data.country, 100) : existing?.country,
    socialLinks: cleanSocials,
    showPhonePublic: data.showPhonePublic ?? existing?.showPhonePublic ?? false,
    showEmailPublic: data.showEmailPublic ?? existing?.showEmailPublic ?? false,
    showOccupationPublic: data.showOccupationPublic ?? existing?.showOccupationPublic ?? true,
    showLocationPublic: data.showLocationPublic ?? existing?.showLocationPublic ?? true,
    showSocialsPublic: data.showSocialsPublic ?? existing?.showSocialsPublic ?? true,
    // Preserve server/admin-controlled verification fields untouched
    verificationStatus: existing?.verificationStatus || 'no_verificado',
    verifiedAt: existing?.verifiedAt,
    verifiedBy: existing?.verifiedBy,
    verificationExpiresAt: existing?.verificationExpiresAt,
    verificationNotes: existing?.verificationNotes,
    verificationHistory: existing?.verificationHistory || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'author_profiles', profileId), sanitizePayload(updatedProfile), { merge: true });
  } catch (e) {
    console.warn('Fallback saving author profile locally:', e);
  }

  try {
    const nextList = existing
      ? all.map((p) => (p.id === profileId ? updatedProfile : p))
      : [updatedProfile, ...all];
    localStorage.setItem('jc_author_profiles', JSON.stringify(nextList));
  } catch (e) {}

  return updatedProfile;
}

/**
 * Checks if a user is eligible to request or hold a Colombian Verification Badge.
 * Rules:
 * - Individual & Semanal plans are NOT eligible.
 * - Mensual & Anual plans ARE eligible if status === 'activa' and not expired.
 * - Active approved Collaborators & Owner ARE eligible.
 */
export function checkVerificationEligibility(params: {
  role: 'owner' | 'collaborator' | 'subscriber';
  subscriber?: SubscriberUser | null;
  collaborator?: Collaborator | null;
}): { eligible: boolean; reason: string } {
  if (params.role === 'owner') {
    return { eligible: true, reason: 'Propietario de la plataforma editorial.' };
  }

  if (params.role === 'collaborator') {
    if (params.collaborator && params.collaborator.status === 'activo') {
      return { eligible: true, reason: 'Colaborador editorial activo.' };
    }
    return { eligible: false, reason: 'Tu cuenta de colaborador debe estar activa para solicitar verificación.' };
  }

  if (params.role === 'subscriber') {
    const sub = params.subscriber;
    if (!sub) {
      return { eligible: false, reason: 'No se encontró una suscripción activa.' };
    }
    const isExpired = new Date(sub.endDate).getTime() < Date.now();
    if (sub.status !== 'activa' || isExpired) {
      return { eligible: false, reason: 'Tu suscripción debe estar activa y vigente.' };
    }
    if (sub.period === 'mensual' || sub.period === 'anual') {
      return { eligible: true, reason: `Plan ${sub.period} activo elegible para revisión.` };
    }
    return {
      eligible: false,
      reason: 'Los planes Individual y Semanal no incluyen solicitud de insignia de verificación. Disponible únicamente para Plan Mensual y Plan Anual.'
    };
  }

  return { eligible: false, reason: 'Rol no elegible para verificación.' };
}

/**
 * Allows an eligible user to submit a verification request (sets status to 'pendiente').
 * Never grants 'verificado' directly.
 */
export async function requestAuthorVerification(params: {
  profileId: string;
  role: 'owner' | 'collaborator' | 'subscriber';
  subscriber?: SubscriberUser | null;
  collaborator?: Collaborator | null;
}): Promise<AuthorProfile> {
  const check = checkVerificationEligibility(params);
  if (!check.eligible) {
    throw new Error(check.reason);
  }

  const all = await getAuthorProfiles();
  const target = all.find((p) => p.id === params.profileId);
  if (!target) {
    throw new Error('Primero debes guardar tu perfil de autor con tu nombre completo.');
  }

  const now = new Date().toISOString();
  const historyItem: VerificationHistoryItem = {
    id: `vh_${Date.now()}`,
    action: 'solicitada',
    actor: target.fullName,
    reason: check.reason,
    timestamp: now
  };

  const updated: AuthorProfile = {
    ...target,
    verificationStatus: 'pendiente',
    verificationHistory: [historyItem, ...(target.verificationHistory || [])],
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'author_profiles', target.id), sanitizePayload(updated), { merge: true });
  } catch (e) {}

  try {
    localStorage.setItem(
      'jc_author_profiles',
      JSON.stringify(all.map((p) => (p.id === target.id ? updated : p)))
    );
  } catch (e) {}

  return updated;
}

export async function getVerificationPolicy(): Promise<VerificationPolicy> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'verification_policy'));
    if (snap.exists() && snap.data().policy) {
      return snap.data().policy as VerificationPolicy;
    }
  } catch (e) {}

  try {
    const saved = localStorage.getItem('jc_verification_policy');
    if (saved === 'suspender_al_vencer' || saved === 'pendiente_renovacion_al_vencer') {
      return saved;
    }
  } catch (e) {}

  return 'pendiente_renovacion_al_vencer';
}

export async function saveVerificationPolicy(policy: VerificationPolicy): Promise<void> {
  try {
    localStorage.setItem('jc_verification_policy', policy);
  } catch (e) {}
  try {
    await setDoc(
      doc(db, 'settings', 'verification_policy'),
      { policy, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (e) {}
}

/**
 * Owner-only action to approve, reject, revoke, or renew an author's Colombian Verification Badge.
 * Validates eligibility on the server/service before approving or renewing.
 */
export async function adminManageAuthorVerification(params: {
  profileId: string;
  action: 'aprobar' | 'rechazar' | 'retirar' | 'renovar';
  reason?: string;
  subscriber?: SubscriberUser | null;
  collaborator?: Collaborator | null;
}): Promise<AuthorProfile> {
  const all = await getAuthorProfiles();
  const target = all.find((p) => p.id === params.profileId);
  if (!target) {
    throw new Error('Perfil de autor no encontrado.');
  }

  // Server/service-side eligibility check before approving or renewing
  if (params.action === 'aprobar' || params.action === 'renovar') {
    const check = checkVerificationEligibility({
      role: target.role,
      subscriber: params.subscriber,
      collaborator: params.collaborator
    });
    if (!check.eligible) {
      throw new Error(`No se puede aprobar la verificación: ${check.reason}`);
    }
  }

  const now = new Date().toISOString();
  let nextStatus: VerificationStatus = target.verificationStatus || 'no_verificado';
  let historyAction: VerificationHistoryItem['action'] = 'aprobada';
  let expiresAt = target.verificationExpiresAt;

  if (params.action === 'aprobar') {
    nextStatus = 'verificado';
    historyAction = 'aprobada';
    expiresAt = params.subscriber?.endDate;
  } else if (params.action === 'renovar') {
    nextStatus = 'verificado';
    historyAction = 'renovada';
    expiresAt = params.subscriber?.endDate;
  } else if (params.action === 'rechazar') {
    nextStatus = 'rechazado';
    historyAction = 'rechazada';
  } else if (params.action === 'retirar') {
    nextStatus = 'suspendido';
    historyAction = 'retirada';
  }

  const historyItem: VerificationHistoryItem = {
    id: `vh_${Date.now()}`,
    action: historyAction,
    actor: 'Julian Camilo (Propietario)',
    reason: params.reason,
    timestamp: now
  };

  const updated: AuthorProfile = {
    ...target,
    verificationStatus: nextStatus,
    verifiedAt: params.action === 'aprobar' || params.action === 'renovar' ? now : target.verifiedAt,
    verifiedBy: params.action === 'aprobar' || params.action === 'renovar' ? 'Julian Camilo' : target.verifiedBy,
    verificationExpiresAt: expiresAt,
    verificationNotes: params.reason || target.verificationNotes,
    verificationHistory: [historyItem, ...(target.verificationHistory || [])],
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'author_profiles', target.id), sanitizePayload(updated), { merge: true });
  } catch (e) {}

  try {
    localStorage.setItem(
      'jc_author_profiles',
      JSON.stringify(all.map((p) => (p.id === target.id ? updated : p)))
    );
  } catch (e) {}

  try {
    await createAuditLog({
      action: `Verificación Editorial: ${historyAction.toUpperCase()}`,
      actor: 'Julian Camilo',
      details: `Autor: ${target.fullName} (${target.email || 'sin correo'}) — Estado: ${nextStatus}`,
      type: 'collaborator'
    });
  } catch (e) {}

  return updated;
}

/* =========================================================================
   SOLICITUDES DE CORRECCIÓN Y RECTIFICACIÓN EDITORIAL
   ========================================================================= */

export async function createCorrectionRequest(
  data: Omit<CorrectionRequest, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const id = `corr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const payload: CorrectionRequest = {
    id,
    articleId: data.articleId,
    articleTitle: sanitizePlainText(data.articleTitle, 250),
    articleSlug: data.articleSlug,
    requesterName: sanitizePlainText(data.requesterName, 100),
    requesterEmail: data.requesterEmail ? sanitizePlainText(data.requesterEmail, 150) : undefined,
    sectionOrParagraph: data.sectionOrParagraph ? sanitizePlainText(data.sectionOrParagraph, 200) : undefined,
    description: sanitizePlainText(data.description, 2000),
    suggestedCorrection: data.suggestedCorrection ? sanitizePlainText(data.suggestedCorrection, 2000) : undefined,
    status: 'pendiente',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'correction_requests', id), sanitizePayload(payload));
  } catch (e) {
    console.warn('Fallback saving correction request locally:', e);
  }

  try {
    const raw = localStorage.getItem('jc_correction_requests');
    const list: CorrectionRequest[] = raw ? JSON.parse(raw) : [];
    list.unshift(payload);
    localStorage.setItem('jc_correction_requests', JSON.stringify(list));
  } catch (e) {}

  return id;
}

export async function getCorrectionRequests(): Promise<CorrectionRequest[]> {
  try {
    const q = query(collection(db, 'correction_requests'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CorrectionRequest, 'id'>)
      }));
      try {
        localStorage.setItem('jc_correction_requests', JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_correction_requests');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
}

export async function updateCorrectionRequestStatus(
  id: string,
  status: 'aprobada' | 'rechazada',
  adminResponse?: string
): Promise<void> {
  const now = new Date().toISOString();
  const payload = sanitizePayload({
    status,
    adminResponse,
    reviewedAt: now
  });

  try {
    await updateDoc(doc(db, 'correction_requests', id), payload);
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_correction_requests');
    if (raw) {
      const list: CorrectionRequest[] = JSON.parse(raw);
      localStorage.setItem(
        'jc_correction_requests',
        JSON.stringify(list.map((c) => (c.id === id ? { ...c, ...payload } : c)))
      );
    }
  } catch (e) {}
}

/* =========================================================================
   ENCUESTAS CIUDADANAS Y RESULTADOS ESTADÍSTICOS
   ========================================================================= */

export async function getCitizenPolls(options?: { activeOnly?: boolean }): Promise<CitizenPoll[]> {
  let list: CitizenPoll[] = [];
  try {
    const q = query(collection(db, 'citizen_polls'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CitizenPoll, 'id'>)
      }));
      try {
        localStorage.setItem('jc_citizen_polls', JSON.stringify(list));
      } catch (e) {}
    }
  } catch (e) {}

  if (list.length === 0) {
    try {
      const raw = localStorage.getItem('jc_citizen_polls');
      if (raw) list = JSON.parse(raw);
    } catch (e) {}
  }

  if (options?.activeOnly) {
    list = list.filter((p) => p.status === 'activa');
  }
  return list;
}

export async function saveCitizenPoll(
  data: Omit<CitizenPoll, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const now = new Date().toISOString();
  const pollId = id || `poll_${Date.now()}`;
  const payload: CitizenPoll = {
    id: pollId,
    ...data,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'citizen_polls', pollId), sanitizePayload(payload), { merge: true });
  } catch (e) {}

  try {
    const all = await getCitizenPolls();
    const idx = all.findIndex((p) => p.id === pollId);
    if (idx >= 0) all[idx] = { ...all[idx], ...payload };
    else all.unshift(payload);
    localStorage.setItem('jc_citizen_polls', JSON.stringify(all));
  } catch (e) {}

  return pollId;
}

export async function deleteCitizenPoll(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'citizen_polls', id));
  } catch (e) {}
  try {
    const all = await getCitizenPolls();
    localStorage.setItem('jc_citizen_polls', JSON.stringify(all.filter((p) => p.id !== id)));
  } catch (e) {}
}

export function hasVotedInCitizenPoll(pollId: string): boolean {
  try {
    const raw = localStorage.getItem('jc_poll_votes');
    const votes: Record<string, string> = raw ? JSON.parse(raw) : {};
    return Boolean(votes[pollId]);
  } catch (e) {
    return false;
  }
}

export async function voteInCitizenPoll(
  pollId: string,
  optionId: string,
  voterKey?: string
): Promise<CitizenPoll | null> {
  if (hasVotedInCitizenPoll(pollId)) {
    throw new Error('Ya registraste tu voto en esta encuesta.');
  }

  // Server-side duplicate vote check
  try {
    const resp = await fetch('/api/polls/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId, voterKey })
    });
    if (resp.status === 409) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || 'Ya registraste tu voto en esta encuesta.');
    }
  } catch (err: any) {
    if (err?.message?.includes('Ya registraste')) throw err;
  }

  const all = await getCitizenPolls();
  const target = all.find((p) => p.id === pollId);
  if (!target || target.status !== 'activa') return null;

  const updatedOptions = target.options.map((opt) =>
    opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
  );
  const totalVotes = updatedOptions.reduce((sum, o) => sum + (o.votes || 0), 0);

  const updatedPoll: CitizenPoll = {
    ...target,
    options: updatedOptions,
    totalVotes,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'citizen_polls', pollId), {
      options: updatedOptions,
      totalVotes,
      updatedAt: updatedPoll.updatedAt
    });
  } catch (e) {}

  try {
    const voteId = `${pollId}_${(voterKey || 'anon').replace(/[^a-zA-Z0-9]/g, '_')}`;
    await setDoc(doc(db, 'poll_votes', voteId), {
      pollId,
      optionId,
      voterKey: voterKey || 'anon',
      votedAt: new Date().toISOString()
    });
  } catch (e) {}

  try {
    localStorage.setItem(
      'jc_citizen_polls',
      JSON.stringify(all.map((p) => (p.id === pollId ? updatedPoll : p)))
    );
    const rawVotes = localStorage.getItem('jc_poll_votes');
    const votes: Record<string, string> = rawVotes ? JSON.parse(rawVotes) : {};
    votes[pollId] = optionId;
    localStorage.setItem('jc_poll_votes', JSON.stringify(votes));
  } catch (e) {}

  return updatedPoll;
}

/* =========================================================================
   AGENDA DE ACONTECIMIENTOS Y CALENDARIO DE EVENTOS
   ========================================================================= */

export async function getEditorialEvents(): Promise<EditorialEvent[]> {
  try {
    const q = query(collection(db, 'editorial_events'), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EditorialEvent, 'id'>)
      }));
      try {
        localStorage.setItem('jc_editorial_events', JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_editorial_events');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
}

export async function saveEditorialEvent(
  data: Omit<EditorialEvent, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const now = new Date().toISOString();
  const eventId = id || `evt_${Date.now()}`;
  const payload: EditorialEvent = {
    id: eventId,
    ...data,
    registrationUrl: data.registrationUrl ? sanitizeSafeUrl(data.registrationUrl) : undefined,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'editorial_events', eventId), sanitizePayload(payload), { merge: true });
  } catch (e) {}

  try {
    const all = await getEditorialEvents();
    const idx = all.findIndex((ev) => ev.id === eventId);
    if (idx >= 0) all[idx] = { ...all[idx], ...payload };
    else all.push(payload);
    all.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem('jc_editorial_events', JSON.stringify(all));
  } catch (e) {}

  return eventId;
}

export async function deleteEditorialEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'editorial_events', id));
  } catch (e) {}
  try {
    const all = await getEditorialEvents();
    localStorage.setItem('jc_editorial_events', JSON.stringify(all.filter((e) => e.id !== id)));
  } catch (e) {}
}

/* =========================================================================
   RECONOCIMIENTO A COLABORADORES
   ========================================================================= */

export async function getCollaboratorRecognitions(): Promise<CollaboratorRecognition[]> {
  try {
    const q = query(collection(db, 'collaborator_recognitions'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CollaboratorRecognition, 'id'>)
      }));
      try {
        localStorage.setItem('jc_collaborator_recognitions', JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_collaborator_recognitions');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
}

export async function saveCollaboratorRecognition(
  data: Omit<CollaboratorRecognition, 'id' | 'createdAt'>,
  id?: string
): Promise<string> {
  const now = new Date().toISOString();
  const recId = id || `rec_${Date.now()}`;
  const payload: CollaboratorRecognition = {
    id: recId,
    ...data,
    createdAt: now
  };

  try {
    await setDoc(doc(db, 'collaborator_recognitions', recId), sanitizePayload(payload), { merge: true });
  } catch (e) {}

  try {
    const all = await getCollaboratorRecognitions();
    const idx = all.findIndex((r) => r.id === recId);
    if (idx >= 0) all[idx] = { ...all[idx], ...payload };
    else all.unshift(payload);
    localStorage.setItem('jc_collaborator_recognitions', JSON.stringify(all));
  } catch (e) {}

  return recId;
}

export async function deleteCollaboratorRecognition(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'collaborator_recognitions', id));
  } catch (e) {}
  try {
    const all = await getCollaboratorRecognitions();
    localStorage.setItem('jc_collaborator_recognitions', JSON.stringify(all.filter((r) => r.id !== id)));
  } catch (e) {}
}

/* =========================================================================
   IDENTIDAD POLÍTICA VOLUNTARIA Y CATÁLOGO CNE (RUPYM)
   ========================================================================= */

export async function getPoliticalOrganizations(): Promise<PoliticalOrganization[]> {
  try {
    const snap = await getDocs(collection(db, 'political_organizations'));
    if (!snap.empty) {
      const firestoreOrgs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PoliticalOrganization, 'id'>)
      }));
      // Merge with official CNE catalog so any newly added official entries are always present
      const byId = new Map<string, PoliticalOrganization>();
      CNE_RUPYM_OFFICIAL_CATALOG.forEach((o) => byId.set(o.id, o));
      firestoreOrgs.forEach((o) => byId.set(o.id, o));
      const merged = Array.from(byId.values());
      try {
        localStorage.setItem('jc_political_orgs', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_political_orgs');
    if (raw) {
      const parsed: PoliticalOrganization[] = JSON.parse(raw);
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return CNE_RUPYM_OFFICIAL_CATALOG;
}

export async function savePoliticalOrganization(
  org: Omit<PoliticalOrganization, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
  actorEmail: string
): Promise<string> {
  const now = new Date().toISOString();
  const orgId = org.id || `org_${Date.now()}`;
  const payload: PoliticalOrganization = {
    ...org,
    id: orgId,
    lastUpdated: now.slice(0, 10),
    createdAt: org.createdAt || now
  };

  try {
    await setDoc(doc(db, 'political_organizations', orgId), sanitizePayload(payload), { merge: true });
  } catch (e) {}

  try {
    const all = await getPoliticalOrganizations();
    const idx = all.findIndex((o) => o.id === orgId);
    if (idx >= 0) all[idx] = payload;
    else all.unshift(payload);
    localStorage.setItem('jc_political_orgs', JSON.stringify(all));
  } catch (e) {}

  await recordPoliticalAuditLog({
    action: org.id ? 'catalogo_editar' : 'catalogo_crear',
    actorEmail,
    targetId: orgId,
    targetName: payload.officialName,
    details: `Catálogo CNE/DULIMA (${payload.category}): ${payload.officialName} [${payload.legalStatus}]`
  });

  return orgId;
}

export async function deletePoliticalOrganization(orgId: string, actorEmail: string, orgName = ''): Promise<void> {
  try {
    await deleteDoc(doc(db, 'political_organizations', orgId));
  } catch (e) {}
  try {
    const all = await getPoliticalOrganizations();
    localStorage.setItem('jc_political_orgs', JSON.stringify(all.filter((o) => o.id !== orgId)));
  } catch (e) {}
  await recordPoliticalAuditLog({
    action: 'catalogo_eliminar',
    actorEmail,
    targetId: orgId,
    targetName: orgName || orgId,
    details: `Organización eliminada del catálogo: ${orgName || orgId}`
  });
}

export async function getPendingPoliticalOrgs(): Promise<PendingPoliticalOrganization[]> {
  try {
    const q = query(collection(db, 'pending_political_orgs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PendingPoliticalOrganization, 'id'>)
      }));
      try {
        localStorage.setItem('jc_pending_political_orgs', JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('jc_pending_political_orgs');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function submitPendingPoliticalOrg(
  data: Omit<PendingPoliticalOrganization, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const propId = `prop_org_${Date.now()}`;
  const payload: PendingPoliticalOrganization = {
    ...data,
    id: propId,
    status: 'pendiente',
    createdAt: now
  };

  try {
    await setDoc(doc(db, 'pending_political_orgs', propId), sanitizePayload(payload));
  } catch (e) {}

  try {
    const all = await getPendingPoliticalOrgs();
    all.unshift(payload);
    localStorage.setItem('jc_pending_political_orgs', JSON.stringify(all));
  } catch (e) {}

  return propId;
}

export async function reviewPendingPoliticalOrg(
  prop: PendingPoliticalOrganization,
  decision: 'aprobada' | 'rechazada',
  reviewNotes: string,
  actorEmail: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'pending_political_orgs', prop.id), {
      status: decision,
      reviewNotes,
      reviewedAt: now
    });
  } catch (e) {}

  try {
    const all = await getPendingPoliticalOrgs();
    const updated = all.map((p) =>
      p.id === prop.id ? { ...p, status: decision, reviewNotes, reviewedAt: now } : p
    );
    localStorage.setItem('jc_pending_political_orgs', JSON.stringify(updated));
  } catch (e) {}

  if (decision === 'aprobada') {
    await savePoliticalOrganization(
      {
        officialName: prop.officialName,
        shortName: prop.acronym || prop.officialName,
        acronym: (prop.acronym || prop.officialName.slice(0, 5)).toUpperCase(),
        category: 'D',
        legalStatus: 'no_verificada',
        legalStatusDetail:
          prop.legalStatusKnown ||
          'Organización registrada manualmente por un usuario y aprobada en el directorio DULIMA (sin reconocimiento jurídico estatal automático).',
        logoUrl: prop.logoUrl,
        primaryColor: '#9B1B30',
        secondaryColor: '#F2C94C',
        website: prop.website,
        description: prop.description,
        verificationSource: prop.verificationSource || `Propuesta por ${prop.submittedByName}`,
        lastUpdated: now.slice(0, 10),
        isOfficialCatalog: false,
        createdByEmail: prop.submittedByEmail
      },
      actorEmail
    );
  }

  await recordPoliticalAuditLog({
    action: decision === 'aprobada' ? 'propuesta_aprobar' : 'propuesta_rechazar',
    actorEmail,
    targetId: prop.id,
    targetName: prop.officialName,
    details: `Propuesta ${decision}: ${prop.officialName}. ${reviewNotes || ''}`
  });
}

export async function recordPoliticalAuditLog(
  entry: Omit<PoliticalAuditLog, 'id' | 'timestamp'>
): Promise<void> {
  const now = new Date().toISOString();
  const log: PoliticalAuditLog = {
    ...entry,
    id: `paudit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: now
  };
  try {
    await addDoc(collection(db, 'political_audit_logs'), sanitizePayload(log));
  } catch (e) {}
  try {
    const raw = localStorage.getItem('jc_political_audit_logs') || '[]';
    const logs: PoliticalAuditLog[] = JSON.parse(raw);
    logs.unshift(log);
    localStorage.setItem('jc_political_audit_logs', JSON.stringify(logs.slice(0, 150)));
  } catch (e) {}
}

export async function getPoliticalAuditLogs(): Promise<PoliticalAuditLog[]> {
  try {
    const q = query(collection(db, 'political_audit_logs'), orderBy('timestamp', 'desc'), limit(80));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PoliticalAuditLog, 'id'>)
      }));
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem('jc_political_audit_logs');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function getOwnerPoliticalIdentity(): Promise<UserPoliticalIdentity> {
  try {
    const prof = await getProfile();
    if (prof?.politicalIdentity) {
      return prof.politicalIdentity;
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem('jc_owner_political_identity');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return OWNER_DEFAULT_POLITICAL_IDENTITY;
}

export async function saveUserPoliticalIdentity(
  role: 'owner' | 'collaborator' | 'subscriber',
  email: string,
  fullName: string,
  identity: UserPoliticalIdentity | null,
  actorEmail?: string
): Promise<void> {
  const now = new Date().toISOString();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (role === 'owner' || cleanEmail === 'trujillogordilooo@gmail.com') {
    try {
      await setDoc(
        doc(db, 'profile', 'main'),
        sanitizePayload({
          politicalIdentity: identity,
          updatedAt: now
        }),
        { merge: true }
      );
    } catch (e) {}
    try {
      if (identity) {
        localStorage.setItem('jc_owner_political_identity', JSON.stringify(identity));
      } else {
        localStorage.removeItem('jc_owner_political_identity');
      }
    } catch (e) {}
  }

  // Also sync to author_profiles
  try {
    const existing = await getAuthorProfileByEmailOrName(cleanEmail, fullName);
    const profId = existing?.id || `ap_${Date.now()}`;
    await setDoc(
      doc(db, 'author_profiles', profId),
      sanitizePayload({
        id: profId,
        role,
        fullName: existing?.fullName || fullName || 'Usuario DULIMA',
        email: cleanEmail || existing?.email,
        politicalIdentity: identity,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      }),
      { merge: true }
    );
  } catch (e) {}

  await recordPoliticalAuditLog({
    action: !identity
      ? 'perfil_eliminar'
      : identity.isPublic
      ? 'perfil_actualizar'
      : 'perfil_ocultar',
    actorEmail: actorEmail || cleanEmail || fullName,
    targetId: cleanEmail || fullName,
    targetName: fullName || cleanEmail,
    details: !identity
      ? 'Información política eliminada del perfil.'
      : `Afinidad: ${identity.affiliationType} · Organizaciones: ${identity.organizations.length} · Visibilidad: ${
          identity.isPublic ? 'Pública (con consentimiento)' : 'Privada'
        }`
  });
}

/* =========================================================================
   PLATAFORMA LIVE DE DULIMA: TRANSMISIONES, CHAT, ENCUESTAS, INVITADOS
   ========================================================================= */

export async function getLiveStreams(includePrivateAndDrafts = false): Promise<LiveStream[]> {
  let list: LiveStream[] = [];
  try {
    const q = query(collection(db, 'live_streams'), orderBy('createdAt', 'desc'), limit(60));
    const snap = await getDocs(q);
    if (!snap.empty) {
      list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LiveStream, 'id'>)
      }));
      try {
        localStorage.setItem('jc_live_streams', JSON.stringify(list));
      } catch (e) {}
    }
  } catch (e) {}

  if (list.length === 0) {
    try {
      const raw = localStorage.getItem('jc_live_streams');
      if (raw) list = JSON.parse(raw);
    } catch (e) {}
  }

  if (includePrivateAndDrafts) return list;
  return list.filter(
    (s) =>
      s.privacy === 'publico' &&
      s.status !== 'borrador' &&
      s.status !== 'cancelado' &&
      s.status !== 'bloqueado'
  );
}

export async function getLiveStreamById(streamId: string): Promise<LiveStream | null> {
  try {
    const snap = await getDoc(doc(db, 'live_streams', streamId));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<LiveStream, 'id'>) };
    }
  } catch (e) {}
  const all = await getLiveStreams(true);
  return all.find((s) => s.id === streamId) || null;
}

export async function createLiveStream(
  data: Omit<LiveStream, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LiveStream> {
  const now = new Date().toISOString();
  const id = `live_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const stream: LiveStream = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'live_streams', id), sanitizePayload(stream));
  } catch (e) {}

  try {
    const all = await getLiveStreams(true);
    all.unshift(stream);
    localStorage.setItem('jc_live_streams', JSON.stringify(all));
  } catch (e) {}

  return stream;
}

export async function updateLiveStream(streamId: string, updates: Partial<LiveStream>): Promise<void> {
  const now = new Date().toISOString();
  const payload = { ...updates, updatedAt: now };
  try {
    await updateDoc(doc(db, 'live_streams', streamId), sanitizePayload(payload));
  } catch (e) {}

  try {
    const all = await getLiveStreams(true);
    const updated = all.map((s) => (s.id === streamId ? { ...s, ...payload } : s));
    localStorage.setItem('jc_live_streams', JSON.stringify(updated));
  } catch (e) {}
}

export async function deleteLiveStream(streamId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'live_streams', streamId));
  } catch (e) {}
  try {
    const all = await getLiveStreams(true);
    localStorage.setItem('jc_live_streams', JSON.stringify(all.filter((s) => s.id !== streamId)));
  } catch (e) {}
}

export async function getLiveChatMessages(streamId: string): Promise<LiveChatMessage[]> {
  try {
    const q = query(
      collection(db, 'live_chat'),
      where('streamId', '==', streamId),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LiveChatMessage, 'id'>)
      }));
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem(`jc_live_chat_${streamId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function sendLiveChatMessage(
  msg: Omit<LiveChatMessage, 'id' | 'createdAt'>
): Promise<LiveChatMessage> {
  const now = new Date().toISOString();
  const id = `lchat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const full: LiveChatMessage = {
    ...msg,
    id,
    createdAt: now
  };
  try {
    await setDoc(doc(db, 'live_chat', id), sanitizePayload(full));
  } catch (e) {}
  try {
    const existing = await getLiveChatMessages(msg.streamId);
    existing.push(full);
    localStorage.setItem(`jc_live_chat_${msg.streamId}`, JSON.stringify(existing.slice(-200)));
  } catch (e) {}
  return full;
}

export async function deleteLiveChatMessage(streamId: string, msgId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'live_chat', msgId));
  } catch (e) {}
  try {
    const existing = await getLiveChatMessages(streamId);
    localStorage.setItem(
      `jc_live_chat_${streamId}`,
      JSON.stringify(existing.filter((m) => m.id !== msgId))
    );
  } catch (e) {}
}

export async function getLivePolls(streamId: string): Promise<LivePoll[]> {
  try {
    const q = query(collection(db, 'live_polls'), where('streamId', '==', streamId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LivePoll, 'id'>)
      }));
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem(`jc_live_polls_${streamId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function createLivePoll(
  streamId: string,
  question: string,
  optionTexts: string[]
): Promise<LivePoll> {
  const now = new Date().toISOString();
  const id = `lpoll_${Date.now()}`;
  const poll: LivePoll = {
    id,
    streamId,
    question,
    options: optionTexts.map((t, idx) => ({ id: `opt_${idx}_${Date.now()}`, text: t, votes: 0 })),
    isActive: true,
    createdAt: now
  };
  try {
    await setDoc(doc(db, 'live_polls', id), sanitizePayload(poll));
  } catch (e) {}
  try {
    const existing = await getLivePolls(streamId);
    existing.unshift(poll);
    localStorage.setItem(`jc_live_polls_${streamId}`, JSON.stringify(existing));
  } catch (e) {}
  return poll;
}

export async function voteLivePoll(streamId: string, pollId: string, optionId: string): Promise<LivePoll | null> {
  const polls = await getLivePolls(streamId);
  const target = polls.find((p) => p.id === pollId);
  if (!target || !target.isActive) return null;
  const updatedOptions = target.options.map((o) =>
    o.id === optionId ? { ...o, votes: (o.votes || 0) + 1 } : o
  );
  const updatedPoll: LivePoll = { ...target, options: updatedOptions };
  try {
    await updateDoc(doc(db, 'live_polls', pollId), { options: updatedOptions });
  } catch (e) {}
  try {
    localStorage.setItem(
      `jc_live_polls_${streamId}`,
      JSON.stringify(polls.map((p) => (p.id === pollId ? updatedPoll : p)))
    );
  } catch (e) {}
  return updatedPoll;
}

export async function getLiveGuestRequests(streamId: string): Promise<LiveGuestRequest[]> {
  try {
    const q = query(collection(db, 'live_guest_requests'), where('streamId', '==', streamId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LiveGuestRequest, 'id'>)
      }));
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem(`jc_live_guests_${streamId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function submitLiveGuestRequest(
  req: Omit<LiveGuestRequest, 'id' | 'status' | 'createdAt'>
): Promise<LiveGuestRequest> {
  const now = new Date().toISOString();
  const id = `lguest_${Date.now()}`;
  const full: LiveGuestRequest = {
    ...req,
    id,
    status: 'pendiente',
    createdAt: now
  };
  try {
    await setDoc(doc(db, 'live_guest_requests', id), sanitizePayload(full));
  } catch (e) {}
  try {
    const existing = await getLiveGuestRequests(req.streamId);
    existing.push(full);
    localStorage.setItem(`jc_live_guests_${req.streamId}`, JSON.stringify(existing));
  } catch (e) {}
  return full;
}

export async function updateLiveGuestRequest(
  streamId: string,
  reqId: string,
  updates: Partial<LiveGuestRequest>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'live_guest_requests', reqId), sanitizePayload(updates));
  } catch (e) {}
  try {
    const existing = await getLiveGuestRequests(streamId);
    localStorage.setItem(
      `jc_live_guests_${streamId}`,
      JSON.stringify(existing.map((g) => (g.id === reqId ? { ...g, ...updates } : g)))
    );
  } catch (e) {}
}

export async function getLiveReminders(userEmail: string): Promise<LiveReminder[]> {
  if (!userEmail) return [];
  try {
    const q = query(collection(db, 'live_reminders'), where('userEmail', '==', userEmail.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LiveReminder, 'id'>)
      }));
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem(`jc_live_reminders_${userEmail.toLowerCase()}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function toggleLiveReminder(
  streamId: string,
  userEmail: string,
  userName?: string
): Promise<boolean> {
  const cleanEmail = userEmail.trim().toLowerCase();
  const current = await getLiveReminders(cleanEmail);
  const existing = current.find((r) => r.streamId === streamId);
  if (existing) {
    try {
      await deleteDoc(doc(db, 'live_reminders', existing.id));
    } catch (e) {}
    try {
      localStorage.setItem(
        `jc_live_reminders_${cleanEmail}`,
        JSON.stringify(current.filter((r) => r.id !== existing.id))
      );
    } catch (e) {}
    return false;
  } else {
    const rem: LiveReminder = {
      id: `lrem_${Date.now()}`,
      streamId,
      userEmail: cleanEmail,
      userName,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'live_reminders', rem.id), sanitizePayload(rem));
    } catch (e) {}
    try {
      current.push(rem);
      localStorage.setItem(`jc_live_reminders_${cleanEmail}`, JSON.stringify(current));
    } catch (e) {}
    return true;
  }
}

export async function getLiveReports(): Promise<LiveReport[]> {
  try {
    const q = query(collection(db, 'live_reports'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LiveReport, 'id'>)
      }));
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem('jc_live_reports');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function submitLiveReport(
  rep: Omit<LiveReport, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const id = `lrep_${Date.now()}`;
  const full: LiveReport = {
    ...rep,
    id,
    status: 'pendiente',
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'live_reports', id), sanitizePayload(full));
  } catch (e) {}
  try {
    const all = await getLiveReports();
    all.unshift(full);
    localStorage.setItem('jc_live_reports', JSON.stringify(all));
  } catch (e) {}
  return id;
}

export async function updateLiveReportStatus(
  id: string,
  status: 'pendiente' | 'revisado' | 'descartado'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'live_reports', id), { status });
  } catch (e) {}
  try {
    const all = await getLiveReports();
    localStorage.setItem(
      'jc_live_reports',
      JSON.stringify(all.map((r) => (r.id === id ? { ...r, status } : r)))
    );
  } catch (e) {}
}

export const DEFAULT_LIVE_TECHNICAL_SETTINGS: LiveTechnicalSettings = {
  id: 'main',
  maxGuestsDefault: 4,
  maxBitrateKbps: 4500,
  allowCollaboratorLiveByDefault: false,
  allowSubscriberMonthlyLive: true,
  allowSubscriberAnnualLive: true,
  allowRecordingDownloadByDefault: false,
  updatedAt: '2026-11-05T00:00:00.000Z'
};

export async function getLiveTechnicalSettings(): Promise<LiveTechnicalSettings> {
  try {
    const snap = await getDoc(doc(db, 'live_technical_settings', 'main'));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<LiveTechnicalSettings, 'id'>) };
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem('jc_live_tech_settings');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_LIVE_TECHNICAL_SETTINGS;
}

export async function saveLiveTechnicalSettings(
  settings: Partial<LiveTechnicalSettings>
): Promise<void> {
  const current = await getLiveTechnicalSettings();
  const updated: LiveTechnicalSettings = {
    ...current,
    ...settings,
    id: 'main',
    updatedAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'live_technical_settings', 'main'), sanitizePayload(updated), { merge: true });
  } catch (e) {}
  try {
    localStorage.setItem('jc_live_tech_settings', JSON.stringify(updated));
  } catch (e) {}
}

export async function getPlatformConnections(ownerEmail: string): Promise<PlatformConnection[]> {
  const defaults: PlatformConnection[] = [
    { id: 'conn_youtube', platform: 'youtube', ownerEmail, connected: false, connectionMethod: 'none' },
    { id: 'conn_facebook', platform: 'facebook', ownerEmail, connected: false, connectionMethod: 'none' },
    { id: 'conn_instagram', platform: 'instagram', ownerEmail, connected: false, connectionMethod: 'none' },
    { id: 'conn_tiktok', platform: 'tiktok', ownerEmail, connected: false, connectionMethod: 'none' }
  ];
  try {
    const snap = await getDocs(collection(db, 'platform_connections'));
    if (!snap.empty) {
      const byPlat = new Map<string, PlatformConnection>();
      defaults.forEach((d) => byPlat.set(d.platform, d));
      snap.docs.forEach((d) => {
        const data = d.data() as Omit<PlatformConnection, 'id'>;
        byPlat.set(data.platform, { id: d.id, ...data });
      });
      return Array.from(byPlat.values());
    }
  } catch (e) {}
  try {
    const raw = localStorage.getItem('jc_platform_connections');
    if (raw) {
      const parsed: PlatformConnection[] = JSON.parse(raw);
      const byPlat = new Map<string, PlatformConnection>();
      defaults.forEach((d) => byPlat.set(d.platform, d));
      parsed.forEach((p) => byPlat.set(p.platform, p));
      return Array.from(byPlat.values());
    }
  } catch (e) {}
  return defaults;
}

export async function savePlatformConnection(conn: PlatformConnection): Promise<void> {
  try {
    await setDoc(doc(db, 'platform_connections', conn.id), sanitizePayload(conn), { merge: true });
  } catch (e) {}
  try {
    const all = await getPlatformConnections(conn.ownerEmail);
    const updated = all.map((c) => (c.platform === conn.platform ? conn : c));
    localStorage.setItem('jc_platform_connections', JSON.stringify(updated));
  } catch (e) {}
}



