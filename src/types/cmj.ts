export type CmjRole =
  | 'admin_principal'
  | 'presidente'
  | 'vicepresidente'
  | 'secretario'
  | 'consejero'
  | 'responsable_comision';

export type CmjModule =
  | 'inicio'
  | 'quienes_somos'
  | 'integrantes'
  | 'gestion'
  | 'sesiones'
  | 'documentos'
  | 'proyectos'
  | 'noticias'
  | 'actividades'
  | 'comisiones'
  | 'participacion'
  | 'encuestas'
  | 'transparencia'
  | 'galeria'
  | 'contacto'
  | 'usuarios'
  | 'configuracion'
  | 'auditoria'
  | 'compromisos'
  | 'comunicacion'
  | 'veeduria'
  | 'plan_trabajo'
  | 'formacion'
  | 'asistencia'
  | 'votaciones'
  | 'informes'
  | 'mi_espacio';

export type CmjAction =
  | 'consultar'
  | 'crear'
  | 'editar'
  | 'enviar_revision'
  | 'aprobar'
  | 'publicar'
  | 'archivar'
  | 'eliminar';

export type RolePermissions = Record<CmjModule, CmjAction[]>;

export type ApprovalStatus =
  | 'borrador'
  | 'en_revision'
  | 'aprobado'
  | 'publicado'
  | 'archivado';

export type SessionStatus =
  | 'programada'
  | 'realizada'
  | 'aplazada'
  | 'cancelada';

export type ProjectStatus =
  | 'propuesta'
  | 'en_revision'
  | 'aprobada'
  | 'en_ejecucion'
  | 'finalizada'
  | 'archivada';

export type DocumentType =
  | 'acta_ordinaria'
  | 'acta_extraordinaria'
  | 'convocatoria'
  | 'informe_gestion'
  | 'proyecto'
  | 'proposicion'
  | 'reglamento'
  | 'normativo';

export type MediaCategory =
  | 'sesiones'
  | 'actividades'
  | 'proyectos'
  | 'eventos'
  | 'reuniones'
  | 'jornadas_juveniles';

export type ProposalStatus =
  | 'recibida'
  | 'en_revision'
  | 'aceptada'
  | 'respondida';

export interface PoliticalAffiliation {
  hasAffiliation: boolean;
  affiliationType: 'partido' | 'movimiento' | 'coalicion' | 'independiente' | 'ninguna';
  organizationName: string;
  logoUrl?: string;
  isPublic: boolean;
  consentGrantedAt?: string;
}

export interface CmjBadge {
  id: string;
  type: 'cmj_institucional' | 'colombia' | 'cargo_institucional' | 'politica';
  label: string;
  description: string;
  assignedByAdmin: boolean;
  visible: boolean;
}

export interface CmjMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: CmjRole;
  cargoTitle: string;
  commissionId?: string;
  commissionName?: string;
  bio: string;
  interestArea?: string;
  functions: string[];
  photoUrl?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  };
  isActive: boolean;
  isPublicProfile: boolean;
  accountStatus: 'pendiente_activacion' | 'activo' | 'suspendido';
  mfaEnabled?: boolean;
  badges: CmjBadge[];
  politicalAffiliation?: PoliticalAffiliation;
  customPermissions?: Partial<RolePermissions>;
  createdAt: string;
  updatedAt: string;
}

export interface CmjCommission {
  id: string;
  name: string;
  slug: string;
  description: string;
  objectives: string[];
  leadMemberId?: string;
  leadMemberName?: string;
  memberIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAttendanceRecord {
  memberId: string;
  memberName: string;
  cargoTitle: string;
  status: 'presente' | 'ausente' | 'excusa';
  notes?: string;
}

export interface CmjSession {
  id: string;
  title: string;
  sessionNumber: string;
  sessionType: 'ordinaria' | 'extraordinaria' | 'comision' | 'cabildo';
  status: SessionStatus;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  convocatoriaUrl?: string;
  ordenDelDia: string[];
  participantIds: string[];
  participantNames: string[];
  attendance?: SessionAttendanceRecord[];
  linkedDocumentId?: string;
  linkedDocumentTitle?: string;
  commitments: string[];
  observations?: string;
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  version: number;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  notes: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CmjDocument {
  id: string;
  title: string;
  code: string;
  type: DocumentType;
  category: string;
  description: string;
  documentDate: string;
  responsibleId?: string;
  responsibleName: string;
  commissionId?: string;
  currentVersion: number;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  versions: DocumentVersion[];
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmjProject {
  id: string;
  name: string;
  description: string;
  justification: string;
  objectives: string[];
  beneficiaryPopulation: string;
  status: ProjectStatus;
  progressPercent: number;
  commissionId?: string;
  commissionName?: string;
  responsibleIds: string[];
  responsibleNames: string[];
  documentUrls: { title: string; url: string }[];
  photoUrls: string[];
  results?: string;
  startDate?: string;
  endDate?: string;
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleVersion {
  version: number;
  title: string;
  summary: string;
  content: string;
  editedBy: string;
  editedAt: string;
}

export interface CmjArticle {
  id: string;
  title: string;
  slug: string;
  kind: 'comunicado_oficial' | 'opinion_articulo';
  category: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  authorId: string;
  authorName: string;
  authorCargo: string;
  approvalStatus: ApprovalStatus;
  scheduledAt?: string;
  publishedAt?: string;
  approvedBy?: string;
  versions: ArticleVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface CmjActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  commissionId?: string;
  commissionName?: string;
  responsibleNames: string[];
  objectives: string[];
  results?: string;
  photoUrls: string[];
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string;
  votes: number;
}

export interface CmjPoll {
  id: string;
  title: string;
  description: string;
  pollKind: 'encuesta_opinion' | 'votacion_oficial';
  options: PollOption[];
  opensAt: string;
  closesAt: string;
  isActive: boolean;
  allowMultiple: boolean;
  totalVotes: number;
  voterFingerprints: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmjMediaItem {
  id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  url: string;
  category: MediaCategory;
  eventDate: string;
  uploadedBy: string;
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface CmjProposal {
  id: string;
  trackingCode: string;
  authorName: string;
  authorEmail: string;
  authorPhone?: string;
  authorAge?: number;
  neighborhood?: string;
  topic: string;
  title: string;
  description: string;
  status: ProposalStatus;
  institutionalResponse?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmjContactMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
  status: 'nuevo' | 'leido' | 'respondido';
  response?: string;
  createdAt: string;
}

export interface CmjAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: CmjRole | 'ciudadano' | 'sistema';
  action: string;
  module: CmjModule | 'auth' | 'backup';
  targetId?: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface CmjInstitutionalConfig {
  officialName: string;
  shortName: string;
  municipality: string;
  department: string;
  country: string;
  period: string;
  officialLogoUrl?: string;
  municipalityLogoUrl?: string;
  showLogoText?: boolean;
  mission: string;
  vision: string;
  objectives: string[];
  legalFramework: string[];
  history: string;
  institutionalEmail: string;
  institutionalPhone: string;
  officeAddress: string;
  officeHours: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    x?: string;
  };
  transparencyPrinciples: string[];
  updatedAt: string;
}

export type CommitmentStatus =
  | 'pendiente'
  | 'en_proceso'
  | 'en_revision'
  | 'cumplido'
  | 'vencido'
  | 'cancelado';

export interface CmjCommitment {
  id: string;
  title: string;
  description: string;
  sessionId?: string;
  sessionTitle?: string;
  responsibleId: string;
  responsibleName: string;
  assignedDate: string;
  deadline: string;
  status: CommitmentStatus;
  evidences: string[];
  notes?: string;
  completedDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmjInternalNotification {
  id: string;
  title: string;
  message: string;
  senderId: string;
  senderName: string;
  senderCargo: string;
  category: 'aviso' | 'comunicado' | 'convocatoria' | 'tarea' | 'proyecto';
  priority: 'normal' | 'alta' | 'urgente';
  targetMemberIds: string[];
  readByMemberIds: string[];
  createdAt: string;
}

export type VeeduriaStatus =
  | 'radicado'
  | 'en_espera'
  | 'respondido'
  | 'compromiso_pactado'
  | 'seguimiento_cerrado';

export interface CmjVeeduriaCase {
  id: string;
  title: string;
  issueDescription: string;
  targetEntity: string;
  filedRadicadoNumber?: string;
  filingDate: string;
  expectedResponseDate?: string;
  officialResponse?: string;
  responseDate?: string;
  commitmentsGiven?: string;
  status: VeeduriaStatus;
  evidenceUrls: string[];
  responsibleMemberName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkPlanActivity {
  id: string;
  name: string;
  responsible: string;
  targetDate: string;
  progress: number;
  status: 'planeada' | 'en_curso' | 'completada';
}

export interface CmjWorkPlan {
  id: string;
  title: string;
  strategicAxis: string;
  objectives: string[];
  activities: WorkPlanActivity[];
  commissionId?: string;
  commissionName?: string;
  year: number;
  status: 'activo' | 'en_revision' | 'cerrado';
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeCategory =
  | 'estatuto_1622_1885'
  | 'reglamento_interno'
  | 'participacion_democratica'
  | 'formulacion_proyectos'
  | 'control_social'
  | 'politicas_publicas'
  | 'liderazgo'
  | 'comunicacion'
  | 'gestion_documental';

export interface CmjKnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  description: string;
  lawReference?: string;
  isOfficialDocument: boolean;
  fileUrl?: string;
  externalLink?: string;
  contentText?: string;
  publishedAt: string;
}

export type PublicPageId =
  | 'inicio'
  | 'quienes-somos'
  | 'integrantes'
  | 'gestion'
  | 'control-politico'
  | 'rendicion-cuentas'
  | 'sesiones'
  | 'documentos'
  | 'proyectos'
  | 'noticias'
  | 'actividades'
  | 'comisiones'
  | 'participacion'
  | 'encuestas'
  | 'transparencia'
  | 'galeria'
  | 'contacto'
  | 'panel-admin';
