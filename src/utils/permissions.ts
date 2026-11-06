import { AdProposal, Collaborator, SubscriberUser } from '../types';

export type PermissionCategoryCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  category: PermissionCategoryCode;
  categoryTitle: string;
  defaultEnabled: boolean;
  ownerOnly?: boolean; // Reserved exclusively for the platform owner
}

export const PERMISSION_CATEGORIES: {
  code: PermissionCategoryCode;
  title: string;
  subtitle: string;
  ownerOnly?: boolean;
}[] = [
  {
    code: 'A',
    title: 'A. Publicaciones',
    subtitle: 'Creación, edición, programación y carga multimedia en artículos.'
  },
  {
    code: 'B',
    title: 'B. Encuestas',
    subtitle: 'Creación, publicación, cierre y consulta de encuestas ciudadanas.'
  },
  {
    code: 'C',
    title: 'C. Publicidad',
    subtitle: 'Propuestas publicitarias, campañas y gestión de espacios.'
  },
  {
    code: 'D',
    title: 'D. Comunidad',
    subtitle: 'Perfiles, moderación de comentarios, encuestas y reportes.'
  },
  {
    code: 'E',
    title: 'E. Premium y beneficios',
    subtitle: 'Editor avanzado, ahorro de datos y solicitud de verificación.'
  },
  {
    code: 'F',
    title: 'F. Administración (Reservado al Propietario)',
    subtitle: 'Funciones financieras, precios, configuración global y permisos. Bloqueadas para colaboradores.',
    ownerOnly: true
  }
];

export const COLLABORATOR_PERMISSIONS_CATALOG: PermissionDefinition[] = [
  // A. Publicaciones
  {
    key: 'pub_create',
    label: 'Crear artículos',
    description: 'Redactar nuevos artículos y columnas editoriales.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: true
  },
  {
    key: 'pub_edit_own',
    label: 'Editar sus propios artículos',
    description: 'Modificar borradores o artículos enviados por el propio colaborador.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: true
  },
  {
    key: 'pub_edit_others',
    label: 'Editar artículos de otros autores',
    description: 'Intervenir y corregir textos publicados o en borrador de otros autores.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'pub_delete_drafts',
    label: 'Eliminar sus propios borradores',
    description: 'Borrar borradores propios que aún no han sido publicados.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: true
  },
  {
    key: 'pub_delete_published',
    label: 'Eliminar artículos publicados',
    description: 'Retirar o eliminar artículos ya publicados en el portal.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'pub_submit_review',
    label: 'Enviar artículos a revisión',
    description: 'Enviar textos a la cola de aprobación del propietario.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: true
  },
  {
    key: 'pub_publish_direct',
    label: 'Publicar directamente',
    description: 'Publicar artículos sin esperar aprobación previa del propietario.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'pub_schedule',
    label: 'Programar publicaciones',
    description: 'Definir fecha y hora futura de publicación automática.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'pub_feature',
    label: 'Destacar artículos',
    description: 'Marcar artículos como destacados en la portada principal.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'pub_upload_photos',
    label: 'Subir fotografías',
    description: 'Cargar imágenes de portada y fotografías dentro de artículos.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: true
  },
  {
    key: 'pub_upload_videos',
    label: 'Subir vídeos',
    description: 'Adjuntar o enlazar vídeos en publicaciones editoriales.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'pub_upload_audio',
    label: 'Subir audios',
    description: 'Adjuntar cápsulas sonoras, entrevistas o pódcast.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'pub_use_media_library',
    label: 'Utilizar la biblioteca multimedia',
    description: 'Explorar y reutilizar imágenes almacenadas en la biblioteca.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: true
  },
  {
    key: 'live_create',
    label: 'Transmitir en directo (LIVE)',
    description: 'Crear y conducir transmisiones en directo desde el Estudio LIVE de DULIMA.',
    category: 'A',
    categoryTitle: 'A. Publicaciones',
    defaultEnabled: false
  },
  {
    key: 'live_moderate',
    label: 'Moderar transmisiones LIVE',
    description: 'Moderar chat, preguntas y participantes en transmisiones en directo.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },

  // B. Encuestas
  {
    key: 'polls_create',
    label: 'Crear encuestas',
    description: 'Proponer o crear encuestas ciudadanas en la plataforma.',
    category: 'B',
    categoryTitle: 'B. Encuestas',
    defaultEnabled: false
  },
  {
    key: 'polls_edit_own',
    label: 'Editar sus encuestas',
    description: 'Modificar preguntas u opciones de encuestas creadas por sí mismo.',
    category: 'B',
    categoryTitle: 'B. Encuestas',
    defaultEnabled: false
  },
  {
    key: 'polls_edit_others',
    label: 'Editar encuestas de otros',
    description: 'Modificar encuestas creadas por otros usuarios o autores.',
    category: 'B',
    categoryTitle: 'B. Encuestas',
    defaultEnabled: false
  },
  {
    key: 'polls_publish',
    label: 'Publicar encuestas',
    description: 'Activar encuestas directamente sin revisión previa.',
    category: 'B',
    categoryTitle: 'B. Encuestas',
    defaultEnabled: false
  },
  {
    key: 'polls_close',
    label: 'Cerrar encuestas',
    description: 'Finalizar encuestas activas para cerrar la votación.',
    category: 'B',
    categoryTitle: 'B. Encuestas',
    defaultEnabled: false
  },
  {
    key: 'polls_view_results',
    label: 'Consultar resultados',
    description: 'Ver métricas detalladas y porcentajes de participación.',
    category: 'B',
    categoryTitle: 'B. Encuestas',
    defaultEnabled: true
  },
  {
    key: 'polls_delete',
    label: 'Eliminar encuestas',
    description: 'Borrar encuestas de la base de datos.',
    category: 'B',
    categoryTitle: 'B. Encuestas',
    defaultEnabled: false
  },

  // C. Publicidad
  {
    key: 'ads_create_proposals',
    label: 'Crear propuestas publicitarias',
    description: 'Enviar propuestas de anuncios para revisión del propietario.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: true
  },
  {
    key: 'ads_edit_own',
    label: 'Editar sus propuestas',
    description: 'Modificar propuestas publicitarias propias antes de su aprobación.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: true
  },
  {
    key: 'ads_manage_own_campaigns',
    label: 'Administrar campañas propias',
    description: 'Consultar rendimiento y estado de sus campañas activas.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: true
  },
  {
    key: 'ads_create_direct',
    label: 'Crear anuncios directamente',
    description: 'Publicar anuncios sin pasar por la cola de aprobación.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: false
  },
  {
    key: 'ads_upload_images',
    label: 'Subir imágenes publicitarias',
    description: 'Cargar banners y piezas gráficas para anuncios.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: true
  },
  {
    key: 'ads_upload_videos',
    label: 'Subir vídeos publicitarios',
    description: 'Cargar vídeos cortos silenciosos para espacios publicitarios.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: false
  },
  {
    key: 'ads_view_stats',
    label: 'Consultar estadísticas publicitarias',
    description: 'Ver impresiones, clics y CTR de la plataforma.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: false
  },
  {
    key: 'ads_manage_spaces',
    label: 'Gestionar espacios publicitarios',
    description: 'Configurar ubicaciones y dimensiones de banners.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: false
  },
  {
    key: 'ads_approve_third_party',
    label: 'Aprobar anuncios de terceros',
    description: 'Revisar y aprobar solicitudes publicitarias de suscriptores.',
    category: 'C',
    categoryTitle: 'C. Publicidad',
    defaultEnabled: false
  },

  // D. Comunidad
  {
    key: 'comm_view_profiles',
    label: 'Consultar perfiles',
    description: 'Ver perfiles públicos de autores y colaboradores.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: true
  },
  {
    key: 'comm_moderate_comments',
    label: 'Moderar comentarios',
    description: 'Aprobar o revisar comentarios de lectores en artículos.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },
  {
    key: 'comm_hide_comments',
    label: 'Ocultar comentarios',
    description: 'Ocultar temporalmente comentarios que requieran revisión.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },
  {
    key: 'comm_delete_comments',
    label: 'Eliminar comentarios',
    description: 'Borrar comentarios ofensivos o spam.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },
  {
    key: 'comm_reply_reports',
    label: 'Responder reportes',
    description: 'Atender solicitudes de corrección y reportes de lectores.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },
  {
    key: 'comm_moderate_polls',
    label: 'Moderar encuestas',
    description: 'Revisar encuestas propuestas por suscriptores.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },
  {
    key: 'comm_manage_reports',
    label: 'Gestionar denuncias de contenido',
    description: 'Resolver alertas de contenido inapropiado.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },
  {
    key: 'comm_suspend_users',
    label: 'Suspender usuarios',
    description: 'Restringir temporalmente cuentas que incumplan las normas.',
    category: 'D',
    categoryTitle: 'D. Comunidad',
    defaultEnabled: false
  },

  // E. Premium y beneficios
  {
    key: 'prem_view_benefits',
    label: 'Consultar sus beneficios',
    description: 'Visualizar los beneficios especiales asignados por el propietario.',
    category: 'E',
    categoryTitle: 'E. Premium y beneficios',
    defaultEnabled: true
  },
  {
    key: 'prem_advanced_editor',
    label: 'Acceder al editor avanzado',
    description: 'Usar bloques enriquecidos, citas, encabezados y vista previa dual.',
    category: 'E',
    categoryTitle: 'E. Premium y beneficios',
    defaultEnabled: true
  },
  {
    key: 'prem_media_tools',
    label: 'Utilizar herramientas multimedia',
    description: 'Acceder a recorte, ajuste y gestión avanzada de imágenes.',
    category: 'E',
    categoryTitle: 'E. Premium y beneficios',
    defaultEnabled: true
  },
  {
    key: 'prem_data_saver',
    label: 'Utilizar modo Ahorrar datos',
    description: 'Activar lectura ligera sin carga pesada de recursos.',
    category: 'E',
    categoryTitle: 'E. Premium y beneficios',
    defaultEnabled: true
  },
  {
    key: 'prem_request_verification',
    label: 'Solicitar verificación',
    description: 'Enviar solicitud para obtener la insignia de verificación colombiana.',
    category: 'E',
    categoryTitle: 'E. Premium y beneficios',
    defaultEnabled: true
  },
  {
    key: 'prem_receive_badge',
    label: 'Recibir una insignia cuando sea aprobada',
    description: 'Mostrar la insignia oficial junto a su nombre y publicaciones.',
    category: 'E',
    categoryTitle: 'E. Premium y beneficios',
    defaultEnabled: true
  },

  // F. Administración (Reservado exclusivamente al propietario)
  {
    key: 'admin_view_stats',
    label: 'Consultar estadísticas globales',
    description: 'Acceso completo a analíticas globales del portal.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_view_reports',
    label: 'Consultar reportes administrativos',
    description: 'Acceso a informes consolidados de auditoría.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_view_users',
    label: 'Consultar información de usuarios',
    description: 'Acceso a datos privados de suscriptores y lectores.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_manage_collaborators',
    label: 'Administrar colaboradores',
    description: 'Crear, suspender o eliminar cuentas de colaboradores.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_view_payments',
    label: 'Consultar pagos',
    description: 'Acceso a transacciones, pasarela Wompi y comprobantes.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_view_donations',
    label: 'Consultar donaciones',
    description: 'Acceso al historial privado de donantes y aportes.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_manage_bank_accounts',
    label: 'Administrar cuentas bancarias',
    description: 'Vincular, editar o eliminar cuentas bancarias de desembolso.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_edit_premium_prices',
    label: 'Modificación de precios Premium',
    description: 'Cambiar tarifas, duración y beneficios de los planes Premium.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_edit_ad_rates',
    label: 'Modificar tarifas publicitarias',
    description: 'Cambiar precios por día, semana o mes de los espacios.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_edit_global_settings',
    label: 'Modificar configuraciones generales',
    description: 'Cambiar identidad del sitio, códigos de acceso y reglas globales.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  },
  {
    key: 'admin_manage_user_permissions',
    label: 'Administrar permisos de otros usuarios',
    description: 'Conceder o revocar permisos SÍ/NO a colaboradores.',
    category: 'F',
    categoryTitle: 'F. Administración (Reservado al Propietario)',
    defaultEnabled: false,
    ownerOnly: true
  }
];

export function getDefaultCollaboratorPermissions(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const item of COLLABORATOR_PERMISSIONS_CATALOG) {
    map[item.key] = item.ownerOnly ? false : item.defaultEnabled;
  }
  return map;
}

export function hasCollaboratorPermission(
  collaborator: Collaborator | null | undefined,
  permissionKey: string,
  isAdmin = false
): boolean {
  if (isAdmin) return true;
  if (!collaborator || collaborator.status !== 'activo') return false;

  const def = COLLABORATOR_PERMISSIONS_CATALOG.find((p) => p.key === permissionKey);
  if (def?.ownerOnly) return false; // Strictly reserved for owner

  if (collaborator.permissions && typeof collaborator.permissions[permissionKey] === 'boolean') {
    return collaborator.permissions[permissionKey];
  }
  return def ? def.defaultEnabled : false;
}

/**
 * Checks whether an active Monthly or Annual subscriber can create polls
 */
export function canSubscriberCreatePolls(subscriber: SubscriberUser | null | undefined): boolean {
  if (!subscriber || subscriber.status !== 'activa') return false;
  if (subscriber.endDate && new Date(subscriber.endDate).getTime() < Date.now()) return false;
  return subscriber.period === 'mensual' || subscriber.period === 'anual';
}

/**
 * Checks the 7-day weekly ad proposal benefit for Annual Premium subscribers
 */
export function checkAnnualAdWeeklyEligibility(
  subscriber: SubscriberUser | null | undefined,
  existingAds: AdProposal[],
  weeklyLimit = 1,
  referenceNowMs = Date.now()
): {
  isAnnualActive: boolean;
  allowed: boolean;
  usedThisWeek: number;
  weeklyLimit: number;
  nextAvailableAt: string | null;
} {
  if (
    !subscriber ||
    subscriber.status !== 'activa' ||
    subscriber.period !== 'anual' ||
    (subscriber.endDate && new Date(subscriber.endDate).getTime() < referenceNowMs)
  ) {
    return {
      isAnnualActive: false,
      allowed: false,
      usedThisWeek: 0,
      weeklyLimit,
      nextAvailableAt: null
    };
  }

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const windowStartMs = referenceNowMs - sevenDaysMs;

  const recentAds = existingAds
    .filter((ad) => {
      if (ad.subscriberEmail?.toLowerCase() !== subscriber.email.toLowerCase()) return false;
      if (ad.status === 'rechazado') return false;
      const createdMs = new Date(ad.createdAt).getTime();
      return !isNaN(createdMs) && createdMs >= windowStartMs;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const usedThisWeek = recentAds.length;
  const allowed = usedThisWeek < weeklyLimit;

  let nextAvailableAt: string | null = null;
  if (!allowed && recentAds.length > 0) {
    const oldestInWindowMs = new Date(recentAds[0].createdAt).getTime();
    nextAvailableAt = new Date(oldestInWindowMs + sevenDaysMs).toISOString();
  }

  return {
    isAnnualActive: true,
    allowed,
    usedThisWeek,
    weeklyLimit,
    nextAvailableAt
  };
}

export const OWNER_ONLY_PERMISSION_KEYS = new Set<string>(
  COLLABORATOR_PERMISSIONS_CATALOG.filter((p) => p.ownerOnly).map((p) => p.key)
);

/**
 * Checks whether a user (Owner, authorized Collaborator, or active Monthly/Annual Premium Subscriber)
 * is allowed to create and host LIVE broadcasts on DULIMA.
 */
export function canUserHostLive(
  isAdmin: boolean,
  collaborator: Collaborator | null | undefined,
  subscriber: SubscriberUser | null | undefined
): { allowed: boolean; reason?: string; hostRole?: 'owner' | 'collaborator' | 'subscriber' } {
  if (isAdmin) {
    return { allowed: true, hostRole: 'owner' };
  }

  if (collaborator && collaborator.status === 'activo') {
    const hasLivePerm = hasCollaboratorPermission(collaborator, 'live_create', false);
    if (hasLivePerm) {
      return { allowed: true, hostRole: 'collaborator' };
    }
    return {
      allowed: false,
      reason: 'Tu cuenta de colaborador requiere autorización expresa del propietario para transmitir en LIVE.'
    };
  }

  if (subscriber) {
    const isExpired = subscriber.endDate && new Date(subscriber.endDate).getTime() < Date.now();
    if (subscriber.status !== 'activa' || isExpired) {
      return {
        allowed: false,
        reason: 'Tu suscripción Premium no se encuentra activa o ha vencido. Renuévala para transmitir en LIVE.'
      };
    }
    if (subscriber.period === 'mensual' || subscriber.period === 'anual') {
      return { allowed: true, hostRole: 'subscriber' };
    }
    return {
      allowed: false,
      reason: 'La creación de transmisiones LIVE está disponible exclusivamente para los planes Premium Mensual y Anual.'
    };
  }

  return {
    allowed: false,
    reason: 'Inicia sesión con una cuenta de Propietario, Colaborador autorizado o Suscriptor Premium Mensual/Anual para transmitir.'
  };
}


