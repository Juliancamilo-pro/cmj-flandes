export type ArticleStatus = 
  | 'draft' 
  | 'published' 
  | 'scheduled'
  | 'borrador'
  | 'revision'
  | 'en_revision'
  | 'cambios'
  | 'aprobado'
  | 'publicado'
  | 'rechazado';

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year?: string;
  description?: string;
  order?: number;
}

export interface TrajectoryItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  description?: string;
  order?: number;
}

export interface CustomSocialLink {
  id: string;
  label: string;
  url: string;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  threads?: string;
  whatsapp?: string;
  telegram?: string;
  substack?: string;
  podcast?: string;
  website?: string;
  github?: string;
  customLinks?: CustomSocialLink[];
}

export interface Profile {
  id?: string;
  name: string;
  title: string;
  motto: string;
  bio: string;
  photoUrl: string;
  location: string;
  contactEmail: string;
  interests: string[];
  education: EducationItem[];
  trajectory: TrajectoryItem[];
  socialLinks: SocialLinks;
  politicalIdentity?: UserPoliticalIdentity;
  updatedAt?: string;
}

export type ArticleFormat = 
  | 'noticias'
  | 'opinion'
  | 'analisis_politico'
  | 'investigacion'
  | 'entrevistas'
  | 'reportajes'
  | 'columnas_editoriales'
  | 'comunicados'
  | 'cronicas'
  | 'fotoreportajes'
  | 'publicaciones_audiovisuales'
  | 'editoriales'
  | 'articulos_academicos'
  // Legacy aliases for backwards compatibility
  | 'noticia'
  | 'reportaje'
  | 'entrevista'
  | 'analisis'
  | 'columna'
  | 'comunicado'
  | 'multimedia'
  | 'galeria'
  | 'video'
  | 'audio';

export type ArticleBlockType =
  | 'paragraph'
  | 'heading2'
  | 'heading3'
  | 'quote'
  | 'list_ordered'
  | 'list_unordered'
  | 'divider'
  | 'table'
  | 'callout'
  | 'image'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'document';

export interface ArticleBlock {
  id: string;
  type: ArticleBlockType;
  content?: string;
  items?: string[];
  tableRows?: string[][];
  calloutTitle?: string;
  calloutTone?: 'info' | 'warning' | 'editorial';
  mediaUrl?: string;
  mediaCaption?: string;
  mediaCredit?: string;
  gallery?: GalleryImage[];
}

export interface ArticleFootnote {
  id: string;
  number: number;
  text: string;
}

export interface GalleryImage {
  id?: string;
  url: string;
  caption?: string;
  credit?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  blocks?: ArticleBlock[];
  footnotes?: ArticleFootnote[];
  showTableOfContents?: boolean;
  excerpt?: string;
  format?: ArticleFormat;
  coverImageUrl: string;
  coverImageCaption?: string;
  categoryId: string;
  categoryName: string;
  status: ArticleStatus;
  scheduledFor?: string;
  allowComments: boolean;
  views: number;
  readingMinutes: number;
  featured: boolean;
  pinned?: boolean;
  tags?: string[];
  // Multimedia fields
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  videoPosterUrl?: string;
  audioUrl?: string;
  audioTitle?: string;
  audioDuration?: string;
  audioCoverUrl?: string;
  galleryImages?: GalleryImage[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorEmail?: string;
  authorId?: string;
  authorRole?: 'owner' | 'collaborator' | 'subscriber';
  reactions?: {
    yellow: number; // Me gustó (Estrella amarilla)
    blue: number;   // No me gustó (Estrella azul)
    red: number;    // Me hizo enojar (Estrella roja)
  };
  reviewNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  sources?: ArticleSource[];
  rectifications?: ArticleRectification[];
}

export interface ArticleSource {
  id: string;
  sourceName?: string;
  title: string;
  url?: string;
  pdfUrl?: string;
  authorOrMedia?: string;
  date?: string;
}

export interface ArticleRectification {
  id: string;
  type: 'aclaracion' | 'rectificacion' | 'fe_de_erratas';
  content: string;
  publishedAt: string;
  publishedBy: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color?: string;
  order: number;
  articleCount?: number;
}

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  articleId: string;
  articleTitle: string;
  authorName: string;
  authorEmail?: string;
  authorRole?: 'owner' | 'collaborator' | 'subscriber' | 'public';
  parentCommentId?: string;
  replyToAuthor?: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
}

export interface DailyAnalytics {
  id?: string;
  date: string; // YYYY-MM-DD
  visits: number;
  articleViews: Record<string, number>;
  categoryViews: Record<string, number>;
  updatedAt: string;
}

export interface PlatformSettings {
  id?: string;
  siteTitle: string;
  siteMotto: string;
  moderationEnabled: boolean;
  allowCommentsGlobally: boolean;
  contactEmail: string;
  invitationCode: string;
  invitationCodeActive: boolean;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export type CollaboratorRequestStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface CollaboratorRequest {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  invitationCode?: string;
  editorialArea?: string;
  motivation?: string;
  status: CollaboratorRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface CollaboratorCustomBenefit {
  id: string;
  name: string;
  description: string;
  assignedAt: string;
}

export interface Collaborator {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  phone: string;
  photoUrl?: string;
  bio?: string;
  invitationCode?: string;
  status: 'activo' | 'suspendido' | 'inactivo';
  permissions?: Record<string, boolean>;
  customBenefits?: CollaboratorCustomBenefit[];
  createdAt: string;
  approvedAt: string;
  lastActiveAt?: string;
  articlesCount?: number;
  politicalIdentity?: UserPoliticalIdentity;
}

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  fileName: string;
  fileSize?: number;
  fileHash?: string;
  category?: 'articles' | 'ads' | 'profiles' | 'general';
  dimensions?: { width: number; height: number };
  mimeType?: string;
  createdAt: string;
  usedIn?: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details?: string;
  createdAt: string;
  type: 'article' | 'collaborator' | 'profile' | 'media' | 'security' | 'settings';
}

/* =========================================================================
   REACTIONS (BANDERA DE COLOMBIA)
   ========================================================================= */
export type ReactionType = 'yellow' | 'blue' | 'red';

export interface ArticleReactions {
  yellow: number; // Estrella Amarilla - Me gustó
  blue: number;   // Estrella Azul - No me gustó
  red: number;    // Estrella Roja - Me hizo enojar
}

export interface UserReactionRecord {
  id?: string;
  articleId: string;
  visitorId: string;
  reactionType: ReactionType;
  updatedAt: string;
}

/* =========================================================================
   DONACIONES & FINANZAS
   ========================================================================= */
export type PaymentMethod = 
  | 'pse' 
  | 'nequi' 
  | 'daviplata' 
  | 'card' 
  | 'bancolombia_qr'
  | 'bancolombia_transfer'
  | 'efecty';

// 7 official transactional states required for production integrity
export type FinancialTransactionStatus = 
  | 'pendiente' 
  | 'procesando' 
  | 'aprobado' 
  | 'rechazado' 
  | 'cancelado' 
  | 'reembolsado' 
  | 'desembolsado'
  | 'aprobada' 
  | 'rechazada' 
  | 'cancelada'; // backwards compat

export type DonationStatus = FinancialTransactionStatus;

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amountCOP: number;
  currency: 'COP' | 'USD';
  paymentMethod: PaymentMethod;
  status: DonationStatus;
  reference: string;
  transactionId?: string;
  message?: string;
  isAnonymous?: boolean;
  bankName?: string;
  disbursementStatus?: 'pendiente' | 'desembolsado';
  createdAt: string;
  confirmedAt?: string;
  receiptNumber?: string;
}

/* =========================================================================
   IMAGE UPLOAD QUEUE
   ========================================================================= */
export type UploadStatus = 'queued' | 'processing' | 'uploading' | 'completed' | 'error' | 'cancelled';

export interface UploadProgressItem {
  id: string;
  file: File;
  name: string;
  size: number;
  optimizedSize?: number;
  previewUrl: string;
  progress: number; // 0 - 100
  status: UploadStatus;
  error?: string;
  uploadedUrl?: string;
}

/* =========================================================================
   PUBLICACIONES / POSTS BREVES (Notas Rápidas & Actualizaciones)
   ========================================================================= */
export interface EditorialPost {
  id: string;
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  authorName: string;
  authorPhoto?: string;
  tags?: string[];
  likes: number;
  reactions?: ArticleReactions;
  createdAt: string;
  updatedAt?: string;
  status: 'published' | 'draft';
}

/* =========================================================================
   SISTEMA DE PLANES DE SUSCRIPCIÓN PREMIUM (Configuración Dinámica)
   ========================================================================= */
export type SubscriptionPlanPeriod = 'individual' | 'pago_unico' | 'semanal' | 'mensual' | 'anual';
export type SubscriptionPeriod = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'pago_unico' | 'semanal' | 'individual';
export type SubscriptionStatus = 'activa' | 'vencida' | 'cancelada' | 'pendiente_pago' | 'suspendida';

export interface SubscriptionPlan {
  id: string; // e.g. "plan_individual", "plan_semanal", "plan_mensual", "plan_anual"
  slug?: string; // "individual", "semanal", "mensual", "anual"
  name: string; // e.g. "Plan Individual", "Plan Semanal"
  tagline?: string; // e.g. "Envío de 1 artículo a revisión", "Acceso semanal ilimitado"
  priceCOP: number; // 5000, 10000, 50000, 100000
  originalPriceCOP?: number; // Para mostrar descuento tachado
  durationDays: number; // 1 (pago único), 7, 30, 365
  period: SubscriptionPlanPeriod;
  description: string;
  articleLimit?: number; // 1 para individual; 0 o 999 para ilimitados durante vigencia
  articlesAllowed?: number;
  adProposalsLimit?: number; // 0, 1, 3, 10 o ilimitado
  adProposalsAllowed?: number;
  adProposalsWeeklyLimit?: number; // e.g. 1 propuesta por semana para plan anual
  benefits: string[];
  isActive: boolean;
  isPopular?: boolean;
  badge?: string; // e.g. "Más Popular", "Ahorra 40%", "Acceso Inmediato"
  discountBadge?: string;
  order: number;
  discountPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriberUser {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  planId: string; // ID del plan seleccionado (e.g. "plan_individual")
  planName: string; // e.g. "Plan Individual", "Plan Mensual"
  amountCOP: number;
  period: SubscriptionPlanPeriod | SubscriptionPeriod;
  durationDays?: number;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  articlesAllowed: number; // Cuota máxima según plan (e.g. 1 para individual, 999 para mensual/anual)
  articlesSubmittedCount: number; // Conteo real de artículos enviados a revisión
  adProposalsAllowed: number;
  adProposalsSubmittedCount: number;
  paymentMethod: PaymentMethod;
  lastPaymentRef?: string;
  totalPaidCOP: number;
  paymentStatus?: 'aprobado' | 'pendiente' | 'rechazado' | 'reembolsado';
  politicalIdentity?: UserPoliticalIdentity;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPaymentRecord {
  id: string;
  subscriberId?: string;
  subscriberEmail: string;
  subscriberName: string;
  planId: string;
  planName: string;
  amountCOP: number;
  paymentMethod: PaymentMethod;
  period?: SubscriptionPlanPeriod | string;
  status: 'aprobado' | 'pendiente' | 'rechazado' | 'reembolsado';
  reference: string;
  transactionId?: string;
  gatewayResponse?: string;
  receiptNumber: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  confirmedAt?: string;
  refundedAt?: string;
  refundReason?: string;
}


/* =========================================================================
   GUARDAR ARTÍCULOS / MARCADORES DE LECTURA
   ========================================================================= */
export interface SavedArticle {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  articleCategory: string;
  articleCoverUrl?: string;
  readingMinutes?: number;
  savedAt: string;
}

/* =========================================================================
   REPORTES DE CONTENIDO INAPROPIADO
   ========================================================================= */
export type ReportReason = 
  | 'informacion_falsa' 
  | 'lenguaje_ofensivo' 
  | 'derechos_autor' 
  | 'spam' 
  | 'otro';

export interface ContentReport {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  reason: ReportReason;
  details: string;
  reporterEmail?: string;
  reporterName?: string;
  status: 'pendiente' | 'revisado' | 'descartado';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

/* =========================================================================
   HISTORIAL DE VERSIONES DE ARTÍCULOS
   ========================================================================= */
export interface ArticleVersionSnapshot {
  id: string;
  articleId: string;
  versionNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  changeSummary?: string;
  authorName: string;
  createdAt: string;
}

/* =========================================================================
   PUBLICIDAD & PROPUESTAS ANUNCIOS (Suscriptores Premium)
   ========================================================================= */
export type AdPlacement =
  | 'banner_principal'
  | 'banner_secundario'
  | 'entre_articulos'
  | 'final_publicaciones'
  | 'lateral_computadores'
  | 'seccion_patrocinadores'
  | 'sidebar'
  | 'article_banner'
  | 'feed_sponsor'
  | 'footer'
  | (string & {});

export type AdProposalStatus =
  | 'borrador'
  | 'pendiente'
  | 'en_revision'
  | 'cambios'
  | 'aprobado'
  | 'rechazado'
  | 'pendiente_pago'
  | 'programado'
  | 'activo'
  | 'finalizado'
  | 'suspendido'
  | 'publicado';

export type AdFormatCategory = 'grafico' | 'audiovisual' | 'interactivo' | 'especial';

export type AdFormatType =
  | 'imagen_publicitaria'
  | 'banner_horizontal'
  | 'banner_vertical'
  | 'tarjeta_promocional'
  | 'anuncio_cuadrado'
  | 'en_articulo'
  | 'video_publicitario'
  | 'clip_promocional'
  | 'audio_opcional'
  | 'anuncio_interactivo'
  | 'publicacion_patrocinada'
  | 'promocion_temporal'
  | 'evento'
  | 'lanzamiento_producto'
  | 'campana_institucional'
  | 'campana_comercial'
  | 'directorio_anunciantes';

export type AdCtaType =
  | 'conocer_mas'
  | 'visitar_sitio'
  | 'ver_productos'
  | 'solicitar_info'
  | 'contactar_anunciante'
  | 'ver_promocion';

export interface AdPricingConfig {
  placement: AdPlacement;
  label: string;
  description: string;
  locationDescription?: string;
  defaultFormat?: AdFormatType;
  priceCOP: number;
  pricePerDayCOP?: number;
  pricePerWeekCOP?: number;
  pricePerMonthCOP?: number;
  specialPriceCOP?: number;
  discountPercent?: number;
  recommendedDimensions?: string;
  allowedTypes?: ('imagen' | 'video' | 'texto' | 'interactivo' | 'especial')[];
  durationDays: number;
  availability?: 'disponible' | 'ocupado' | 'reservado';
  associatedCampaignId?: string;
  associatedCampaignName?: string;
  active: boolean;
}

export interface AdProposal {
  id: string;
  subscriberId: string;
  subscriberEmail: string;
  subscriberName: string;
  authorRole?: 'collaborator' | 'subscriber' | 'owner';
  isOwnerAd?: boolean;
  businessName: string;
  advertiserName?: string;
  headline: string;
  bodyCopy: string;
  category?: string;
  formatCategory?: AdFormatCategory;
  adFormat?: AdFormatType;
  mediaType?: 'imagen' | 'video';
  bannerUrl: string;
  galleryUrls?: string[];
  videoUrl?: string;
  audioUrl?: string;
  videoDurationSeconds?: number;
  bannerCaption?: string;
  targetUrl?: string;
  ctaType?: AdCtaType;
  ctaLabel?: string;
  promoCode?: string;
  expandableDetails?: string;
  whatsappNumber?: string;
  contactInfo?: string;
  requestedPlacement: AdPlacement;
  activePlacement?: AdPlacement;
  status: AdProposalStatus;
  priceCOP?: number;
  budgetCOP?: number;
  durationDays?: number;
  paymentStatus?: 'no_aplica' | 'pendiente' | 'pagado';
  editorNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  startTime?: string;
  endTime?: string;
  pausedAt?: string;
  impressions?: number;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdLeadInquiry {
  id: string;
  adId: string;
  businessName: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  message: string;
  createdAt: string;
}

/* =========================================================================
   CONFIGURACIÓN FINANCIERA & PASARELA DE PAGOS REALES (Wompi / Mercado Pago)
   ========================================================================= */
export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  enabled: boolean;
  accountHolder: string;
  accountNumber?: string;
  breBKey?: string;
  bankEntity: string;
  qrImageUrl?: string;
  instructions?: string;
  badge?: string;
  allowManualReference?: boolean;
}

export interface FinancialSettings {
  id?: string;
  provider: 'wompi' | 'mercadopago';
  wompiPublicKey: string; // e.g. pub_prod_... or pub_test_...
  wompiIntegritySecret?: string;
  mercadopagoPublicKey?: string;
  bankName: string; // e.g. 'Bancolombia', 'Davivienda'
  accountType: 'ahorros' | 'corriente' | 'deposito_electronico';
  accountNumber: string;
  accountHolder: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'Pasaporte';
  documentNumber: string;
  isVerified: boolean;
  commissionRateWompi: string; // e.g. '2.65% + $700 COP + IVA'
  disbursementTime: string; // e.g. 'T+1 días hábiles en Bancolombia'
  monthlySubscriptionCOP: number; // default: 20000
  subscriptionPeriod: SubscriptionPeriod; // default: 'mensual'
  suggestedDonationAmounts?: number[]; // e.g. [10000, 20000, 50000, 100000, 200000]
  donationCustomMessage?: string;
  paymentMethodsConfig?: {
    nequi?: PaymentMethodConfig;
    daviplata?: PaymentMethodConfig;
    bancolombia_qr?: PaymentMethodConfig;
    pse?: PaymentMethodConfig;
    card?: PaymentMethodConfig;
    [key: string]: PaymentMethodConfig | undefined;
  };
  updatedAt?: string;
}


/* =========================================================================
   CUENTAS BANCARIAS DE RECEPCIÓN Y DESEMBOLSOS (Propietario / Admin)
   ========================================================================= */
export type BankAccountType = 'ahorros' | 'corriente' | 'deposito_electronico';
export type BankAccountVerificationStatus = 'verificada' | 'en_revision' | 'pendiente_documentacion' | 'rechazada';

export interface BankAccount {
  id: string;
  bankName: string; // e.g. 'Bancolombia', 'Davivienda', 'Nequi', 'Daviplata', 'Banco de Bogotá', 'BBVA'
  bankCode?: string;
  accountType: BankAccountType;
  accountNumber: string; // Raw stored privately, masked when displayed (****1234)
  accountHolder: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'Pasaporte';
  documentNumber: string;
  holderEmail?: string;
  alias: string; // e.g. "Cuenta Principal Bancolombia", "Nequi Desembolsos"
  isPrimary: boolean; // Indicates the active receiving account for disbursements
  verificationStatus: BankAccountVerificationStatus;
  verificationNotes?: string;
  isActive?: boolean;
  deactivatedAt?: string;
  deactivationReason?: string;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   HISTORIAL DE DESEMBOLSOS A CUENTAS BANCARIAS
   ========================================================================= */
export type DisbursementStatus = 'programado' | 'procesando' | 'desembolsado' | 'fallido';

export interface DisbursementRecord {
  id: string;
  bankAccountId: string;
  bankName: string;
  accountNumberMasked: string;
  amountCOP: number;
  reference: string;
  period: string; // e.g. "Semana 44 - Noviembre 2026"
  status: DisbursementStatus;
  notes?: string;
  createdAt: string;
  disbursedAt?: string;
}

/* =========================================================================
   AUDITORÍA FINANCIERA Y SEGURIDAD
   ========================================================================= */
export interface FinancialAuditLog {
  id: string;
  action: string;
  details: string;
  adminEmail: string;
  timestamp: string;
}

/* =========================================================================
   HISTORIAL PÚBLICO DE ACTUALIZACIONES (Changelog de la plataforma)
   ========================================================================= */
export type PlatformUpdateCategory = 
  | 'nuevas_funcionalidades'
  | 'mejoras_diseno'
  | 'seguridad'
  | 'correccion_errores'
  | 'rendimiento'
  | 'cambios_publicaciones'
  | 'experiencia_usuario';

export interface PlatformUpdate {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string; // Detailed description of what changed, how it works, and benefits
  date: string; // YYYY-MM-DD
  imageUrl?: string;
  imageCaption?: string;
  category: PlatformUpdateCategory;
  tags: string[];
  status: 'publicado' | 'borrador';
  featured: boolean; // Display in special featured spot on home page
  versionTag?: string; // e.g. "v2.5.0"
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   PERFILES DE AUTOR & VERIFICACIÓN CON IDENTIDAD COLOMBIANA
   ========================================================================= */
export type VerificationStatus =
  | 'no_verificado'
  | 'pendiente'
  | 'verificado'
  | 'rechazado'
  | 'suspendido'
  | 'pendiente_renovacion';

export type VerificationPolicy = 'suspender_al_vencer' | 'pendiente_renovacion_al_vencer';

export interface VerificationHistoryItem {
  id: string;
  action: 'solicitada' | 'aprobada' | 'rechazada' | 'retirada' | 'renovada' | 'suspendida';
  actor: string;
  reason?: string;
  timestamp: string;
}

export interface AuthorProfile {
  id: string;
  userId?: string;
  role: 'owner' | 'collaborator' | 'subscriber';
  fullName: string; // Único campo obligatorio
  phone?: string;
  email?: string;
  occupation?: string;
  photoUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  socialLinks?: SocialLinks;
  // Controles de privacidad explícitos (por defecto false para datos personales)
  showPhonePublic?: boolean;
  showEmailPublic?: boolean;
  showOccupationPublic?: boolean;
  showLocationPublic?: boolean;
  showSocialsPublic?: boolean;
  // Campos de verificación (solo modificables por el propietario/servidor)
  verificationStatus?: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationExpiresAt?: string;
  verificationNotes?: string;
  verificationHistory?: VerificationHistoryItem[];
  politicalIdentity?: UserPoliticalIdentity;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   SOLICITUDES DE CORRECCIÓN Y RECTIFICACIÓN EDITORIAL
   ========================================================================= */
export interface CorrectionRequest {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  requesterName: string;
  requesterEmail?: string;
  sectionOrParagraph?: string;
  description: string;
  suggestedCorrection?: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  adminResponse?: string;
  createdAt: string;
  reviewedAt?: string;
}

/* =========================================================================
   ENCUESTAS CIUDADANAS Y RESULTADOS ESTADÍSTICOS
   ========================================================================= */
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export type PollStatus = 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'activa' | 'cerrada';

export interface CitizenPoll {
  id: string;
  title?: string;
  question: string;
  description?: string;
  category?: string;
  options: PollOption[];
  totalVotes: number;
  status: PollStatus;
  creatorName?: string;
  creatorEmail?: string;
  creatorPhotoUrl?: string;
  creatorRole?: 'owner' | 'collaborator' | 'subscriber';
  creatorPlanPeriod?: SubscriptionPlanPeriod;
  publishedAt?: string;
  closesAt?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   AGENDA DE ACONTECIMIENTOS Y CALENDARIO DE EVENTOS
   ========================================================================= */
export type EditorialEventCategory = 'foro' | 'debate' | 'lanzamiento' | 'cultural' | 'civico' | 'otro';

export interface EditorialEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location: string;
  city?: string;
  category: EditorialEventCategory;
  registrationUrl?: string;
  isFeatured?: boolean;
  status: 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   RECONOCIMIENTO A COLABORADORES
   ========================================================================= */
export interface CollaboratorRecognition {
  id: string;
  authorName: string;
  authorEmail?: string;
  roleLabel: string;
  title: string;
  reason: string;
  date: string;
  featured: boolean;
  createdAt: string;
}

/* =========================================================================
   ACCESIBILIDAD VISUAL (DALTONISMO, CONTRASTE, TIPOGRAFÍA Y FORMAS)
   ========================================================================= */
export type ColorBlindnessMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface AccessibilitySettings {
  colorBlindness: ColorBlindnessMode;
  highContrast: boolean;
  softContrast: boolean;
  textSize: 'normal' | 'large' | 'xlarge';
  shapeIndicators: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
}

/* =========================================================================
   AUDITORÍA DE PERMISOS Y ACTIVIDAD DE COLABORADORES
   ========================================================================= */
export interface PermissionAuditLog {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorEmail: string;
  changedBy: string;
  permissionKey: string;
  permissionLabel: string;
  previousValue: boolean;
  newValue: boolean;
  timestamp: string;
}

/* =========================================================================
   CENTRO DE SEGURIDAD, SESIONES, 2FA/MFA, MODERACIÓN Y COPIAS DE SEGURIDAD
   ========================================================================= */
export type SecurityRiskLevel = 'bajo' | 'medio' | 'alto' | 'critico';

export type SecurityEventType =
  | 'login_exitoso'
  | 'login_fallido'
  | 'bloqueo_fuerza_bruta'
  | 'bot_spam_bloqueado'
  | 'solicitud_rechazada'
  | 'cambio_permisos'
  | 'actividad_admin'
  | 'sesion_revocada'
  | 'alerta_sospechosa'
  | 'mfa_verificado'
  | 'mfa_fallido'
  | 'archivo_rechazado';

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  riskLevel: SecurityRiskLevel;
  userEmail?: string;
  userRole?: string;
  ipMasked?: string;
  userAgent?: string;
  deviceLabel?: string;
  locationLabel?: string;
  description: string;
  endpoint?: string;
  timestamp: string;
}

export interface UserSession {
  id: string;
  userEmail: string;
  userRole: 'owner' | 'collaborator' | 'subscriber';
  deviceLabel: string;
  browserLabel: string;
  ipMasked: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent?: boolean;
  revoked?: boolean;
  revokedAt?: string;
}

export interface OwnerMfaConfig {
  enabled: boolean;
  totpConfigured: boolean;
  passkeyConfigured: boolean;
  passkeyLabel?: string;
  recoveryCodesRemaining: number;
  lastVerifiedAt?: string;
  updatedAt: string;
}

export interface SystemBackup {
  id: string;
  label: string;
  type: 'manual' | 'programada';
  status: 'completada' | 'fallida' | 'en_progreso';
  collectionsIncluded: string[];
  totalRecords: number;
  sizeBytes: number;
  checksumSha256: string;
  createdBy: string;
  createdAt: string;
  notes?: string;
}

export interface ModerationLog {
  id: string;
  targetType: 'comment' | 'article' | 'user';
  targetId: string;
  targetSummary: string;
  action: 'ocultar' | 'eliminar' | 'aprobar' | 'suspender_cuenta' | 'reactivar_cuenta' | 'descartar_reporte';
  reason: string;
  moderatorEmail: string;
  timestamp: string;
}

/* =========================================================================
   IDENTIDAD POLÍTICA VOLUNTARIA Y CATÁLOGO CNE (RUPYM)
   ========================================================================= */
export type PoliticalAffiliationType =
  | 'afiliado'
  | 'simpatizante'
  | 'independiente'
  | 'ninguna'
  | 'prefiero_no_responder';

export type PoliticalOrgCategory = 'A' | 'B' | 'C' | 'D';

export type PoliticalLegalStatus =
  | 'vigente'
  | 'sin_personeria'
  | 'en_fusion_o_transicion'
  | 'anulada_judicialmente'
  | 'agrupacion_ciudadana'
  | 'no_verificada';

export interface PoliticalOrganization {
  id: string;
  officialName: string;
  shortName: string;
  acronym: string;
  category: PoliticalOrgCategory;
  legalStatus: PoliticalLegalStatus;
  legalStatusDetail: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  website?: string;
  description: string;
  verificationSource: string;
  lastUpdated: string;
  isOfficialCatalog: boolean;
  isCoalition?: boolean;
  memberOrgIds?: string[];
  createdByEmail?: string;
  createdAt: string;
}

export interface PendingPoliticalOrganization {
  id: string;
  officialName: string;
  acronym?: string;
  orgType: string;
  legalStatusKnown?: string;
  website?: string;
  description: string;
  logoUrl?: string;
  verificationSource: string;
  submittedByEmail: string;
  submittedByName: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface UserPoliticalSelection {
  organizationId: string;
  organizationName: string;
  acronym: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  legalStatus: PoliticalLegalStatus;
  legalStatusDetail: string;
  website?: string;
  isCoalition?: boolean;
}

export interface UserPoliticalIdentity {
  affiliationType: PoliticalAffiliationType;
  organizations: UserPoliticalSelection[];
  isPublic: boolean;
  consentGivenAt?: string;
  updatedAt: string;
  declaredByOwner?: boolean;
}

export interface PoliticalAuditLog {
  id: string;
  action:
    | 'catalogo_crear'
    | 'catalogo_editar'
    | 'catalogo_eliminar'
    | 'propuesta_aprobar'
    | 'propuesta_rechazar'
    | 'perfil_actualizar'
    | 'perfil_ocultar'
    | 'perfil_eliminar';
  actorEmail: string;
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
}

/* =========================================================================
   PLATAFORMA LIVE DE DULIMA & MULTISTREAM
   ========================================================================= */
export type LiveStreamFormat =
  | 'webcam'
  | 'mobile_camera'
  | 'audio_only'
  | 'screen_share'
  | 'window_share'
  | 'camera_and_screen'
  | 'interview'
  | 'multi_guest'
  | 'obs_studio'
  | 'rtmp_custom';

export type LiveOrientation = 'horizontal' | 'vertical';
export type LiveQuality = 'auto' | '1080p' | '720p' | '480p' | '360p';
export type LivePrivacy = 'publico' | 'no_listado' | 'privado';
export type LiveStatus =
  | 'borrador'
  | 'programado'
  | 'proximamente'
  | 'en_directo'
  | 'finalizado'
  | 'cancelado'
  | 'bloqueado';

export type LivePlatformDestination = 'dulima' | 'youtube' | 'facebook' | 'instagram' | 'tiktok';

export interface LiveDestinationStatus {
  platform: LivePlatformDestination;
  enabled: boolean;
  status: 'conectado' | 'transmitiendo' | 'error' | 'desconectado' | 'finalizado';
  externalUrl?: string;
  errorMessage?: string;
  externalViewers?: number;
}

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  hostName: string;
  hostEmail: string;
  hostRole: 'owner' | 'collaborator' | 'subscriber';
  hostPhotoUrl?: string;
  hostPoliticalIdentity?: UserPoliticalIdentity;
  format: LiveStreamFormat;
  orientation: LiveOrientation;
  quality: LiveQuality;
  privacy: LivePrivacy;
  status: LiveStatus;
  scheduledAt?: string;
  timezone?: string;
  estimatedDurationMin?: number;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  inviteToken?: string;
  maxGuests: number;
  recordEnabled: boolean;
  recordingAuthorized: boolean;
  recordingUrl?: string;
  allowDownload?: boolean;
  chatClosed?: boolean;
  qaMode?: boolean;
  pinnedQuestionId?: string;
  highlightedCommentId?: string;
  moderatorEmails?: string[];
  mutedEmailsOrNames?: string[];
  blockedEmailsOrNames?: string[];
  destinations: LiveDestinationStatus[];
  concurrentViewers: number;
  peakViewers: number;
  totalViews: number;
  likesCount: number;
  reactions: {
    like: number;
    applause: number;
    fire: number;
    support: number;
    insightful: number;
  };
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveChatMessage {
  id: string;
  streamId: string;
  senderName: string;
  senderEmail?: string;
  senderRole: 'owner' | 'collaborator' | 'moderator' | 'subscriber' | 'public';
  content: string;
  isQuestion?: boolean;
  isHighlighted?: boolean;
  isPinned?: boolean;
  createdAt: string;
}

export interface LivePollOption {
  id: string;
  text: string;
  votes: number;
}

export interface LivePoll {
  id: string;
  streamId: string;
  question: string;
  options: LivePollOption[];
  isActive: boolean;
  createdAt: string;
}

export interface LiveGuestRequest {
  id: string;
  streamId: string;
  guestName: string;
  guestEmail?: string;
  status: 'pendiente' | 'aceptado' | 'rechazado' | 'retirado';
  audioEnabled: boolean;
  videoEnabled: boolean;
  createdAt: string;
}

export interface LiveReminder {
  id: string;
  streamId: string;
  userEmail: string;
  userName?: string;
  createdAt: string;
}

export interface LiveReport {
  id: string;
  streamId: string;
  streamTitle: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: 'pendiente' | 'revisado' | 'descartado';
  createdAt: string;
}

export interface PlatformConnection {
  id: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  ownerEmail: string;
  connected: boolean;
  connectionMethod: 'oauth' | 'rtmp_manual' | 'none';
  accountName?: string;
  accountId?: string;
  scopes?: string[];
  rtmpServerUrl?: string;
  hasStreamKey?: boolean;
  lastCheckedAt?: string;
  errorNote?: string;
}

export interface LiveTechnicalSettings {
  id?: string;
  maxGuestsDefault: number;
  maxBitrateKbps: number;
  allowCollaboratorLiveByDefault: boolean;
  allowSubscriberMonthlyLive: boolean;
  allowSubscriberAnnualLive: boolean;
  allowRecordingDownloadByDefault: boolean;
  updatedAt: string;
}


