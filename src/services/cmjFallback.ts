import {
  CmjActivity,
  CmjArticle,
  CmjCommitment,
  CmjDocument,
  CmjInstitutionalConfig,
  CmjInternalNotification,
  CmjKnowledgeItem,
  CmjMediaItem,
  CmjMember,
  CmjPoll,
  CmjProject,
  CmjProposal,
  CmjSession,
  CmjVeeduriaCase,
  CmjWorkPlan,
} from '../types/cmj.ts';
import {
  DEFAULT_COMMISSIONS_SEED,
  DEFAULT_INSTITUTIONAL_CONFIG,
  PRINCIPAL_ADMIN_EMAIL,
} from '../constants/cmj.ts';
import { PublicOverviewResponse, AdminWorkspaceResponse } from './cmjApi.ts';

const FALLBACK_STORE_KEY = 'cmj_flandes_client_store_v1';

export const INITIAL_KNOWLEDGE_SEED: CmjKnowledgeItem[] = [
  {
    id: 'know-1',
    title: 'Estatuto de Ciudadanía Juvenil (Ley 1622 de 2013)',
    category: 'estatuto_1622_1885',
    lawReference: 'Ley Estatutaria 1622 del 29 de abril de 2013',
    description:
      'Marco estatutario que establece las disposiciones para garantizar a todos los y las jóvenes el pleno ejercicio de la ciudadanía juvenil en Colombia, la concertación institucional y las garantías de participación.',
    isOfficialDocument: true,
    publishedAt: '2013-04-29',
    contentText:
      'Regula el Sistema Nacional de Juventudes, los Consejos de Juventud, las Plataformas de las Juventudes y las Asambleas Juveniles en todos los municipios de Colombia, incluyendo Flandes, Tolima.',
  },
  {
    id: 'know-2',
    title: 'Reforma al Estatuto de Ciudadanía Juvenil (Ley 1885 de 2018)',
    category: 'estatuto_1622_1885',
    lawReference: 'Ley Estatutaria 1885 del 1 de marzo de 2018',
    description:
      'Modifica y fortalece la Ley 1622 de 2013 en lo relativo al funcionamiento, elección democrática por voto popular, periodos institucionales y comisiones de concertación de los Consejos Municipales de Juventud.',
    isOfficialDocument: true,
    publishedAt: '2018-03-01',
    contentText:
      'Establece la naturaleza autónoma de consulta y concertación de los CMJ, su relación con las alcaldías municipales y el derecho a presentar iniciativas y proposiciones en sesiones del Concejo Municipal.',
  },
  {
    id: 'know-3',
    title: 'Reglamento Interno Oficial — Consejo Municipal de Juventud Flandes',
    category: 'reglamento_interno',
    lawReference: 'Acuerdo Interno CMJ Flandes N° 001',
    description:
      'Reglamento de funcionamiento interno: sesiones plenarias ordinarias y extraordinarias, régimen de cuórum, atribuciones de la Mesa Directiva, conformación de comisiones de trabajo y deberes de los consejeros.',
    isOfficialDocument: true,
    publishedAt: '2024-01-15',
    contentText:
      'Regula la convocatoria a sesiones con antelación mínima, elaboración de actas con numeración consecutiva, control de asistencia obligatoria y procedimiento de votaciones nominales u ordinarias.',
  },
  {
    id: 'know-4',
    title: 'Guía de Control Social y Veeduría Juvenil en la Gestión Pública',
    category: 'control_social',
    lawReference: 'Ley 850 de 2003 y Ley 1757 de 2015',
    description:
      'Metodología para la vigilancia y fiscalización ciudadana de las políticas públicas de juventud, inversión social y proyectos de la administración municipal de Flandes.',
    isOfficialDocument: false,
    publishedAt: '2024-02-10',
    contentText:
      'Instrucciones prácticas para radicar solicitudes de información oficial (Derechos de Petición), seguimiento a respuestas institucionales y emisión de conceptos no vinculantes del Consejo.',
  },
  {
    id: 'know-5',
    title: 'Metodología de Formulación de Proyectos Juveniles',
    category: 'formulacion_proyectos',
    description:
      'Guía paso a paso para formular proyectos e iniciativas: árbol de problemas, objetivos generales y específicos, cronograma, presupuesto y matriz de indicadores de impacto social.',
    isOfficialDocument: false,
    publishedAt: '2024-02-20',
    contentText:
      'Herramienta para los consejeros en la estructuración de propuestas viables ante entidades del orden municipal, departamental (Gobernación del Tolima) y nacional.',
  },
  {
    id: 'know-6',
    title: 'Manual de Gestión Documental y Elaboración de Actas Institucionales',
    category: 'gestion_documental',
    description:
      'Protocolo oficial para la Secretaría del Consejo sobre elaboración de actas de sesiones, orden del día, registro de proposiciones, expedientes digitales y conservación histórica.',
    isOfficialDocument: false,
    publishedAt: '2024-03-01',
    contentText:
      'Guía técnica para garantizar la inmutabilidad de actas aprobadas, trazabilidad en correcciones de versiones y archivo seguro de documentos institucionales.',
  },
];

export const INITIAL_MEMBERS_SEED: CmjMember[] = [
  {
    id: 'member-admin-principal',
    fullName: 'Secretario',
    email: PRINCIPAL_ADMIN_EMAIL,
    phone: '310 000 0000',
    role: 'admin_principal',
    cargoTitle: 'Secretario del Consejo Municipal de Juventud Flandes',
    commissionId: 'com-institucional',
    commissionName: 'Comisión de Concertación y Gestión Institucional',
    bio: 'Secretario y Administrador Principal del Consejo Municipal de Juventud de Flandes, Tolima. Comprometido con la transparencia documental, la participación democrática juvenil y el fortalecimiento institucional del territorio.',
    interestArea: 'Gestión Pública, Transparencia y Participación Ciudadana',
    functions: [
      'Custodiar el archivo institucional y las actas oficiales del CMJ.',
      'Certificar el cuórum y registrar las asistencias a sesiones plenarias.',
      'Coordinar las comunicaciones institucionales con la Alcaldía y el Concejo Municipal.',
      'Garantizar la publicación y acceso público a los documentos del Consejo.',
    ],
    socialLinks: {
      facebook: 'https://facebook.com/CMJFlandesOficial',
      instagram: 'https://instagram.com/cmj_flandes',
      x: 'https://x.com/CMJFlandes',
    },
    isActive: true,
    isPublicProfile: true,
    accountStatus: 'activo',
    badges: [
      {
        id: 'badge-cmj-oficial',
        type: 'cmj_institucional',
        label: 'CMJ Flandes',
        description: 'Consejo Municipal de Juventud — Flandes, Tolima',
        assignedByAdmin: true,
        visible: true,
      },
      {
        id: 'badge-colombia',
        type: 'colombia',
        label: 'Colombia',
        description: 'Representante Juvenil — República de Colombia',
        assignedByAdmin: true,
        visible: true,
      },
      {
        id: 'badge-cargo-principal',
        type: 'cargo_institucional',
        label: 'Secretario · Admin Principal',
        description: 'Secretario del Consejo Municipal de Juventud Flandes',
        assignedByAdmin: true,
        visible: true,
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export function getClientFallbackOverview(): PublicOverviewResponse {
  try {
    const raw = localStorage.getItem(FALLBACK_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.config && Array.isArray(parsed.members)) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }

  const initialOverview: PublicOverviewResponse = {
    config: DEFAULT_INSTITUTIONAL_CONFIG,
    members: INITIAL_MEMBERS_SEED,
    commissions: DEFAULT_COMMISSIONS_SEED.map((c) => ({
      ...c,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    })),
    sessions: [],
    documents: [],
    projects: [],
    articles: [],
    activities: [],
    polls: [],
    media: [],
  };

  try {
    localStorage.setItem(FALLBACK_STORE_KEY, JSON.stringify(initialOverview));
  } catch {
    // Ignore storage write error
  }

  return initialOverview;
}

export function saveClientFallbackOverview(data: Partial<PublicOverviewResponse>): void {
  try {
    const current = getClientFallbackOverview();
    const updated = { ...current, ...data };
    localStorage.setItem(FALLBACK_STORE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage write error
  }
}
