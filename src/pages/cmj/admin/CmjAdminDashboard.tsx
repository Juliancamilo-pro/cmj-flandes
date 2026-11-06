import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  CalendarDays,
  FileText,
  FolderKanban,
  Newspaper,
  Megaphone,
  BarChart3,
  Image as ImageIcon,
  Settings,
  Database,
  Lock,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Download,
  History,
  Briefcase,
  AlertCircle,
  KeyRound,
  UserCircle2,
  Globe,
  Phone,
} from 'lucide-react';
import { useCmjAuth } from '../../../context/CmjAuthContext';
import { AdminWorkspaceResponse, cmjApi } from '../../../services/cmjApi';
import { ImageUploadField } from '../../../components/cmj/ImageUploadField';
import { GoogleWorkspacePanel } from '../../../components/cmj/GoogleWorkspacePanel';
import {
  ALL_ACTIONS,
  DOCUMENT_TYPE_LABELS,
  MEDIA_CATEGORY_LABELS,
  ROLE_LABELS,
} from '../../../constants/cmj';
import {
  CmjAction,
  CmjMember,
  CmjModule,
  CmjRole,
  DocumentType,
  MediaCategory,
} from '../../../types/cmj';
import {
  CouncilorSidebar,
  WorkspaceTabId,
} from '../../../components/cmj/workspace/CouncilorSidebar';
import { MiEspacioTab } from '../../../components/cmj/workspace/MiEspacioTab';
import { ActasSecretariaTab } from '../../../components/cmj/workspace/ActasSecretariaTab';
import { CompromisosTab } from '../../../components/cmj/workspace/CompromisosTab';
import { ComunicacionTab } from '../../../components/cmj/workspace/ComunicacionTab';
import { AsistenciaTab } from '../../../components/cmj/workspace/AsistenciaTab';
import { PlanTrabajoTab } from '../../../components/cmj/workspace/PlanTrabajoTab';
import { VeeduriaTab } from '../../../components/cmj/workspace/VeeduriaTab';
import { FormacionTab } from '../../../components/cmj/workspace/FormacionTab';
import { InformesTab } from '../../../components/cmj/workspace/InformesTab';

export type AdminTab =
  | WorkspaceTabId
  | 'noticias'
  | 'actividades'
  | 'participacion'
  | 'encuestas'
  | 'galeria';

export const CmjAdminDashboard: React.FC<{ onDataChanged: () => void }> = ({
  onDataChanged,
}) => {
  const { user, can, refreshAuth } = useCmjAuth();
  const [tab, setTab] = useState<AdminTab>('mi_espacio');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspace, setWorkspace] = useState<AdminWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadWorkspace = async () => {
    try {
      const data = await cmjApi.getAdminWorkspace();
      setWorkspace(data);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Error cargando panel.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const notify = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    if (type === 'ok') {
      loadWorkspace();
      onDataChanged();
    }
  };

  /* --- MFA & My Profile State --- */
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaUri, setMfaUri] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const [myFullName, setMyFullName] = useState(user?.fullName || '');
  const [myPhone, setMyPhone] = useState(user?.phone || '');
  const [myBio, setMyBio] = useState(user?.bio || '');
  const [myInterestArea, setMyInterestArea] = useState(user?.interestArea || '');
  const [myPhotoUrl, setMyPhotoUrl] = useState(user?.photoUrl || '');
  const [myFunctionsText, setMyFunctionsText] = useState((user?.functions || []).join('\n'));
  const [mySocials, setMySocials] = useState({
    facebook: user?.socialLinks?.facebook || '',
    instagram: user?.socialLinks?.instagram || '',
    x: user?.socialLinks?.x || '',
    tiktok: user?.socialLinks?.tiktok || '',
    youtube: user?.socialLinks?.youtube || '',
    linkedin: user?.socialLinks?.linkedin || '',
  });
  const [hasPolAff, setHasPolAff] = useState(Boolean(user?.politicalAffiliation?.hasAffiliation));
  const [polType, setPolType] = useState<any>(
    user?.politicalAffiliation?.affiliationType || 'ninguna'
  );
  const [polOrg, setPolOrg] = useState(user?.politicalAffiliation?.organizationName || '');
  const [polPublic, setPolPublic] = useState(Boolean(user?.politicalAffiliation?.isPublic));

  useEffect(() => {
    if (user) {
      setMyFullName(user.fullName || '');
      setMyPhone(user.phone || '');
      setMyBio(user.bio || '');
      setMyInterestArea(user.interestArea || '');
      setMyPhotoUrl(user.photoUrl || '');
      setMyFunctionsText((user.functions || []).join('\n'));
      setMySocials({
        facebook: user.socialLinks?.facebook || '',
        instagram: user.socialLinks?.instagram || '',
        x: user.socialLinks?.x || '',
        tiktok: user.socialLinks?.tiktok || '',
        youtube: user.socialLinks?.youtube || '',
        linkedin: user.socialLinks?.linkedin || '',
      });
      setHasPolAff(Boolean(user.politicalAffiliation?.hasAffiliation));
      setPolType(user.politicalAffiliation?.affiliationType || 'ninguna');
      setPolOrg(user.politicalAffiliation?.organizationName || '');
      setPolPublic(Boolean(user.politicalAffiliation?.isPublic));
    }
  }, [user]);

  /* --- Password Change State --- */
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  /* --- New Member State --- */
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CmjRole>('consejero');
  const [newMemberCargo, setNewMemberCargo] = useState('Consejero de Juventud de Flandes');
  const [newMemberComId, setNewMemberComId] = useState('');
  const [newMemberPhoto, setNewMemberPhoto] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState<{ email: string; code: string } | null>(
    null
  );
  const [editingPermsMember, setEditingPermsMember] = useState<CmjMember | null>(null);

  /* --- New Session State --- */
  const [sessTitle, setSessTitle] = useState('');
  const [sessNum, setSessNum] = useState('');
  const [sessType, setSessType] = useState<'ordinaria' | 'extraordinaria' | 'comision' | 'cabildo'>(
    'ordinaria'
  );
  const [sessDate, setSessDate] = useState('');
  const [sessTime, setSessTime] = useState('09:00');
  const [sessLocation, setSessLocation] = useState('Salón del Concejo / Casa de la Juventud, Flandes');
  const [sessOrden, setSessOrden] = useState('');
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<
    { memberId: string; memberName: string; cargoTitle: string; status: 'presente' | 'ausente' | 'excusa'; notes?: string }[]
  >([]);

  /* --- New Document State --- */
  const [docTitle, setDocTitle] = useState('');
  const [docCode, setDocCode] = useState('');
  const [docType, setDocType] = useState<DocumentType>('acta_ordinaria');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [docDesc, setDocDesc] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [versionDocId, setVersionDocId] = useState<string | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');

  /* --- New Project State --- */
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projJust, setProjJust] = useState('');
  const [projPop, setProjPop] = useState('Jóvenes de Flandes, Tolima');
  const [projStatus, setProjStatus] = useState('propuesta');
  const [projProgress, setProjProgress] = useState(0);

  /* --- New Article State --- */
  const [artTitle, setArtTitle] = useState('');
  const [artKind, setArtKind] = useState<'comunicado_oficial' | 'opinion_articulo'>(
    'comunicado_oficial'
  );
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCoverUrl, setArtCoverUrl] = useState('');

  /* --- New Activity State --- */
  const [actTitle, setActTitle] = useState('');
  const [actDate, setActDate] = useState('');
  const [actLocation, setActLocation] = useState('Flandes, Tolima');
  const [actDesc, setActDesc] = useState('');

  /* --- New Commission State --- */
  const [comName, setComName] = useState('');
  const [comDesc, setComDesc] = useState('');

  /* --- New Poll State --- */
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollKind, setPollKind] = useState<'encuesta_opinion' | 'votacion_oficial'>(
    'encuesta_opinion'
  );
  const [pollOptionsText, setPollOptionsText] = useState('');

  /* --- New Media State --- */
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaCategory, setMediaCategory] = useState<MediaCategory>('actividades');
  const [mediaUrl, setMediaUrl] = useState('');

  /* --- Proposal Response State --- */
  const [propResponses, setPropResponses] = useState<Record<string, { status: string; text: string }>>(
    {}
  );

  /* --- Config State --- */
  const [cfgLogoUrl, setCfgLogoUrl] = useState('');
  const [cfgMission, setCfgMission] = useState('');
  const [cfgVision, setCfgVision] = useState('');
  const [cfgAddress, setCfgAddress] = useState('');
  const [cfgHours, setCfgHours] = useState('');
  const [cfgEmail, setCfgEmail] = useState('');

  useEffect(() => {
    if (workspace?.config) {
      setCfgLogoUrl(workspace.config.officialLogoUrl || '');
      setCfgMission(workspace.config.mission);
      setCfgVision(workspace.config.vision);
      setCfgAddress(workspace.config.officeAddress);
      setCfgHours(workspace.config.officeHours);
      setCfgEmail(workspace.config.institutionalEmail);
    }
  }, [workspace?.config]);

  const unreadCount = (workspace?.internalNotifications || []).filter(
    (n) => !n.readByMemberIds?.includes(user?.id || '')
  ).length;

  const pendingCommitmentsCount = (workspace?.commitments || []).filter(
    (c) => c.status === 'pendiente' || c.status === 'en_proceso'
  ).length;

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
            Espacio Privado de Gestión · CMJ Flandes
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            Bienvenido, {user.fullName}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {user.cargoTitle} · Rol: <strong>{ROLE_LABELS[user.role]}</strong> ({user.email})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can('configuracion', 'editar') && (
            <button
              type="button"
              onClick={() => setTab('configuracion')}
              className="btn-dulima-secondary py-1.5 px-3 text-xs"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Cambiar Logo de la Página</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab('workspace')}
            className="btn-dulima-primary py-1.5 px-3 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Google Docs y Chat</span>
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            Sesión Verificada
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold underline ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Councilor Workspace: Responsive Sidebar + Main Module View */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <CouncilorSidebar
          currentTab={tab as WorkspaceTabId}
          onSelectTab={(newTab) => setTab(newTab as AdminTab)}
          currentUser={user}
          can={can}
          unreadCount={unreadCount}
          pendingCommitmentsCount={pendingCommitmentsCount}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        <div className="flex-1 min-w-0 w-full space-y-6">
          {loading && (
            <div className="p-8 text-center text-sm text-stone-500 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800">
              Cargando espacio de trabajo institucional...
            </div>
          )}

          {/* TAB: MI ESPACIO (PERSONALIZED HUB) */}
          {tab === 'mi_espacio' && workspace && (
            <MiEspacioTab
              user={user}
              workspace={workspace}
              onNavigateTab={(targetTab) => setTab(targetTab as AdminTab)}
            />
          )}

          {/* TAB: ACTAS Y SECRETARÍA */}
          {tab === 'actas' && workspace && (
            <ActasSecretariaTab
              documents={workspace.documents}
              currentUser={user}
              canCreate={can('documentos', 'crear')}
              canEdit={can('documentos', 'editar')}
              canDelete={can('documentos', 'eliminar')}
              canApprove={
                can('documentos', 'aprobar') ||
                ['admin_principal', 'presidente', 'secretario'].includes(user.role)
              }
              onRefresh={loadWorkspace}
              notify={notify}
            />
          )}

          {/* TAB: COMPROMISOS */}
          {tab === 'compromisos' && workspace && (
            <CompromisosTab
              commitments={workspace.commitments || []}
              members={workspace.members}
              sessions={workspace.sessions.map((s) => ({
                id: s.id,
                title: s.title,
                sessionNumber: s.sessionNumber,
              }))}
              currentUser={user}
              canCreate={can('compromisos', 'crear')}
              canEdit={can('compromisos', 'editar')}
              canDelete={can('compromisos', 'eliminar')}
              onRefresh={loadWorkspace}
              notify={notify}
            />
          )}

          {/* TAB: COMUNICACIÓN INTERNA */}
          {tab === 'comunicacion' && workspace && (
            <ComunicacionTab
              notifications={workspace.internalNotifications || []}
              currentUser={user}
              canCreate={
                can('noticias', 'crear') ||
                ['admin_principal', 'presidente', 'secretario'].includes(user.role)
              }
              onRefresh={loadWorkspace}
              notify={notify}
            />
          )}

          {/* TAB: CONTROL DE ASISTENCIA */}
          {tab === 'asistencia' && workspace && (
            <AsistenciaTab
              sessions={workspace.sessions}
              members={workspace.members}
              canEdit={can('sesiones', 'editar')}
              onRefresh={loadWorkspace}
              notify={notify}
            />
          )}

          {/* TAB: PLAN DE TRABAJO */}
          {tab === 'plan_trabajo' && workspace && (
            <PlanTrabajoTab
              workPlans={workspace.workPlans || []}
              commissions={workspace.commissions}
              currentUser={user}
              canCreate={can('plan_trabajo', 'crear')}
              canEdit={can('plan_trabajo', 'editar')}
              canDelete={can('plan_trabajo', 'eliminar')}
              onRefresh={loadWorkspace}
              notify={notify}
            />
          )}

          {/* TAB: VEEDURÍA Y CONTROL SOCIAL */}
          {tab === 'veeduria' && workspace && (
            <VeeduriaTab
              cases={workspace.veeduriaCases || []}
              currentUser={user}
              canCreate={can('veeduria', 'crear')}
              canEdit={can('veeduria', 'editar')}
              canDelete={can('veeduria', 'eliminar')}
              onRefresh={loadWorkspace}
              notify={notify}
            />
          )}

          {/* TAB: FORMACIÓN Y LEYES */}
          {tab === 'formacion' && workspace && (
            <FormacionTab
              items={workspace.knowledgeItems || []}
              currentUser={user}
              canManage={can('formacion', 'crear') || user.role === 'admin_principal'}
              onRefresh={loadWorkspace}
              notify={notify}
            />
          )}

          {/* TAB: INFORMES Y TABLEROS */}
          {tab === 'informes' && workspace && (
            <InformesTab workspace={workspace} currentUser={user} />
          )}

      {/* TAB: MI PERFIL Y 2FA */}
      {tab === 'mi_perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                  Editor de Perfil Público del Integrante
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Actualiza tu nombre, fotografía, biografía, funciones y redes sociales visibles en la sección pública del CMJ.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 text-[#8c162a] dark:text-[#f2c94c] text-[11px] font-bold">
                {ROLE_LABELS[user.role]}
              </span>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!myFullName.trim()) {
                  notify('err', 'El nombre completo es obligatorio.');
                  return;
                }
                try {
                  const parsedFunctions = myFunctionsText
                    .split('\n')
                    .map((f) => f.trim())
                    .filter(Boolean);

                  await cmjApi.updateMyProfile({
                    fullName: myFullName.trim(),
                    phone: myPhone.trim(),
                    bio: myBio.trim(),
                    interestArea: myInterestArea.trim(),
                    photoUrl: myPhotoUrl || undefined,
                    functions: parsedFunctions,
                    socialLinks: {
                      facebook: mySocials.facebook.trim() || undefined,
                      instagram: mySocials.instagram.trim() || undefined,
                      x: mySocials.x.trim() || undefined,
                      tiktok: mySocials.tiktok.trim() || undefined,
                      youtube: mySocials.youtube.trim() || undefined,
                      linkedin: mySocials.linkedin.trim() || undefined,
                    },
                    politicalAffiliation: {
                      hasAffiliation: hasPolAff,
                      affiliationType: hasPolAff ? polType : 'ninguna',
                      organizationName: hasPolAff ? polOrg : '',
                      isPublic: hasPolAff && polPublic,
                    },
                  });
                  await refreshAuth();
                  notify('ok', 'Tu perfil público y datos personales fueron actualizados.');
                } catch (err: any) {
                  notify('err', err?.message || 'Error actualizando perfil.');
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={myFullName}
                    onChange={(e) => setMyFullName(e.target.value)}
                    placeholder="Ej. María Fernanda Gómez"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={myPhone}
                      onChange={(e) => setMyPhone(e.target.value)}
                      placeholder="Ej. 310 123 4567"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              <ImageUploadField
                label="Fotografía Oficial de Perfil"
                value={myPhotoUrl}
                onChange={setMyPhotoUrl}
                aspectClass="h-44"
              />

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Biografía / Reseña Institucional
                </label>
                <textarea
                  rows={3}
                  value={myBio}
                  onChange={(e) => setMyBio(e.target.value)}
                  placeholder="Cuéntale a los jóvenes de Flandes sobre tu trayectoria, liderazgo y compromiso..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Área de Interés Principal
                </label>
                <input
                  type="text"
                  list="cmj-interest-areas"
                  value={myInterestArea}
                  onChange={(e) => setMyInterestArea(e.target.value)}
                  placeholder="Ej. Educación y Cultura, Emprendimiento Juvenil, Medio Ambiente..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <datalist id="cmj-interest-areas">
                  <option value="Educación, Cultura y Arte" />
                  <option value="Emprendimiento y Empleo Juvenil" />
                  <option value="Deporte, Recreación y Tiempo Libre" />
                  <option value="Medio Ambiente y Territorio" />
                  <option value="Salud Mental y Bienestar Juvenil" />
                  <option value="Participación Ciudadana y Derechos Humanos" />
                  <option value="Tecnología, Ciencia e Innovación" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Funciones y Responsabilidades (una por línea)
                </label>
                <textarea
                  rows={3}
                  value={myFunctionsText}
                  onChange={(e) => setMyFunctionsText(e.target.value)}
                  placeholder="Ej. Representar a los jóvenes de la zona urbana&#10;Coordinar mesas de participación estudiantil"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>

              {/* Redes Sociales */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#003893] dark:text-[#f2c94c]" />
                  <span className="text-xs font-bold uppercase text-stone-800 dark:text-stone-200">
                    Redes Sociales (Enlaces Públicos)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="url"
                    value={mySocials.facebook}
                    onChange={(e) => setMySocials({ ...mySocials, facebook: e.target.value })}
                    placeholder="Facebook (https://facebook.com/...)"
                    className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <input
                    type="url"
                    value={mySocials.instagram}
                    onChange={(e) => setMySocials({ ...mySocials, instagram: e.target.value })}
                    placeholder="Instagram (https://instagram.com/...)"
                    className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <input
                    type="url"
                    value={mySocials.x}
                    onChange={(e) => setMySocials({ ...mySocials, x: e.target.value })}
                    placeholder="X / Twitter (https://x.com/...)"
                    className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <input
                    type="url"
                    value={mySocials.tiktok}
                    onChange={(e) => setMySocials({ ...mySocials, tiktok: e.target.value })}
                    placeholder="TikTok (https://tiktok.com/@...)"
                    className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <input
                    type="url"
                    value={mySocials.youtube}
                    onChange={(e) => setMySocials({ ...mySocials, youtube: e.target.value })}
                    placeholder="YouTube (https://youtube.com/...)"
                    className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <input
                    type="url"
                    value={mySocials.linkedin}
                    onChange={(e) => setMySocials({ ...mySocials, linkedin: e.target.value })}
                    placeholder="LinkedIn (https://linkedin.com/in/...)"
                    className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                  <input
                    type="checkbox"
                    checked={hasPolAff}
                    onChange={(e) => setHasPolAff(e.target.checked)}
                  />
                  <span>Declarar voluntariamente afinidad o pertenencia a organización política</span>
                </label>

                {hasPolAff && (
                  <div className="space-y-3 pt-2">
                    <select
                      value={polType}
                      onChange={(e) => setPolType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    >
                      <option value="partido">Partido Político</option>
                      <option value="movimiento">Movimiento Político / Juvenil</option>
                      <option value="coalicion">Coalición</option>
                      <option value="independiente">Lista / Movimiento Independiente</option>
                    </select>
                    <input
                      type="text"
                      value={polOrg}
                      onChange={(e) => setPolOrg(e.target.value)}
                      placeholder="Nombre del partido, movimiento o lista"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                    <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <input
                        type="checkbox"
                        checked={polPublic}
                        onChange={(e) => setPolPublic(e.target.checked)}
                      />
                      <span>
                        Autorizo mostrar públicamente esta insignia en mi perfil (privada por defecto)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-dulima-primary">
                Guardar Cambios de Mi Perfil
              </button>
            </form>
          </div>

          {/* Right Column: Live Preview + 2FA + Password */}
          <div className="lg:col-span-5 space-y-6">
            {/* Vista Previa de Tarjeta Pública */}
            <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#003893] dark:text-[#f2c94c]">
                Vista Previa en Portal Público
              </span>
              <div className="flex items-center gap-4">
                {myPhotoUrl ? (
                  <img
                    src={myPhotoUrl}
                    alt={myFullName}
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8c162a] to-[#003893] text-white flex items-center justify-center font-display font-bold text-xl shrink-0">
                    {(myFullName || user.fullName).slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                    {myFullName || user.fullName}
                  </h3>
                  <p className="text-xs font-semibold text-[#8c162a] dark:text-[#f2c94c] truncate">
                    {user.cargoTitle}
                  </p>
                  {myPhone && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Tel: {myPhone}
                    </p>
                  )}
                </div>
              </div>
              {myInterestArea && (
                <div className="px-3 py-1.5 rounded-lg bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 text-[#8c162a] dark:text-[#f2c94c] text-xs font-bold">
                  Área de interés: {myInterestArea}
                </div>
              )}
              {myBio && (
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                  {myBio}
                </p>
              )}
              {Object.values(mySocials).some(Boolean) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(mySocials)
                    .filter(([, url]) => Boolean(url))
                    .map(([net]) => (
                      <span
                        key={net}
                        className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300"
                      >
                        {net}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* 2FA TOTP Security Card */}
            <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                Autenticación en Dos Pasos (2FA / TOTP)
              </h2>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  user.mfaEnabled
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {user.mfaEnabled ? '2FA Activo' : '2FA No Configurado'}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              Protege tu cuenta institucional con códigos temporales de 6 dígitos (Google Authenticator, Authy o similar).
            </p>

            {!mfaSecret ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await cmjApi.setupMfa();
                    setMfaSecret(res.secret);
                    setMfaUri(res.otpauthUri);
                  } catch (err: any) {
                    notify('err', err?.message || 'Error iniciando 2FA.');
                  }
                }}
                className="btn-dulima-secondary"
              >
                <Lock className="w-4 h-4" />
                <span>{user.mfaEnabled ? 'Reconfigurar 2FA' : 'Configurar 2FA Ahora'}</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
                <p className="text-xs font-bold">
                  1. Ingresa esta clave secreta en tu app autenticadora:
                </p>
                <p className="font-mono text-sm font-bold p-2.5 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 select-all">
                  {mfaSecret}
                </p>
                {mfaUri && (
                  <p className="text-[11px] text-stone-500 break-all">URI: {mfaUri}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    className="flex-1 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await cmjApi.confirmMfa(mfaCode);
                        setRecoveryCodes(res.recoveryCodes);
                        setMfaSecret(null);
                        await refreshAuth();
                        notify('ok', '2FA activado exitosamente.');
                      } catch (err: any) {
                        notify('err', err?.message || 'Código inválido.');
                      }
                    }}
                    className="btn-dulima-primary"
                  >
                    Verificar
                  </button>
                </div>
              </div>
            )}

            {recoveryCodes && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Códigos de recuperación (guárdalos en un lugar seguro):
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                  {recoveryCodes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Cambiar Contraseña */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-display font-bold text-stone-900 dark:text-stone-100">
                <KeyRound className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
                <span>Cambiar Mi Contraseña</span>
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPwd.length < 10) {
                    notify('err', 'La nueva contraseña debe tener al menos 10 caracteres.');
                    return;
                  }
                  if (newPwd !== confirmPwd) {
                    notify('err', 'Las contraseñas nuevas no coinciden.');
                    return;
                  }
                  try {
                    await cmjApi.changePassword(currentPwd, newPwd);
                    setCurrentPwd('');
                    setNewPwd('');
                    setConfirmPwd('');
                    notify('ok', 'Tu contraseña ha sido actualizada de forma segura.');
                  } catch (err: any) {
                    notify('err', err?.message || 'No se pudo cambiar la contraseña.');
                  }
                }}
                className="space-y-2.5"
              >
                <input
                  type="password"
                  required
                  placeholder="Contraseña actual"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
                <input
                  type="password"
                  required
                  minLength={10}
                  placeholder="Nueva contraseña (mín. 10 caracteres)"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
                <input
                  type="password"
                  required
                  minLength={10}
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
                <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs">
                  Actualizar Contraseña
                </button>
              </form>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INTEGRANTES Y ROLES */}
      {tab === 'integrantes' && workspace && (
        <div className="space-y-6">
          {can('usuarios', 'crear') && (
            <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
              <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                Registrar Nuevo Integrante / Consejero
              </h2>
              {generatedInvite && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    Integrante creado. Entrega este código único de activación a {generatedInvite.email}:
                  </p>
                  <p className="font-mono text-base font-bold select-all">{generatedInvite.code}</p>
                </div>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const com = workspace.commissions.find((c) => c.id === newMemberComId);
                    const res = await cmjApi.createMember({
                      fullName: newMemberName,
                      email: newMemberEmail,
                      role: newMemberRole,
                      cargoTitle: newMemberCargo,
                      commissionId: com?.id,
                      commissionName: com?.name,
                      photoUrl: newMemberPhoto || undefined,
                    });
                    setGeneratedInvite({ email: res.member.email, code: res.oneTimeInviteCode });
                    setNewMemberName('');
                    setNewMemberEmail('');
                    setNewMemberPhoto('');
                    notify('ok', 'Integrante registrado con código de activación único.');
                  } catch (err: any) {
                    notify('err', err?.message || 'Error creando integrante.');
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
              >
                <input
                  type="text"
                  required
                  placeholder="Nombre completo"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="email"
                  required
                  placeholder="Correo electrónico"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as CmjRole)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  <option value="presidente">Presidente</option>
                  <option value="vicepresidente">Vicepresidente</option>
                  <option value="secretario">Secretario</option>
                  <option value="consejero">Consejero de Juventud</option>
                  <option value="responsable_comision">Responsable de Comisión</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Cargo institucional"
                  value={newMemberCargo}
                  onChange={(e) => setNewMemberCargo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <button type="submit" className="btn-dulima-primary justify-center">
                  <Plus className="w-4 h-4" />
                  <span>Registrar</span>
                </button>
              </form>
            </div>
          )}

          <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-display font-bold">
              Directorio de Cuentas ({workspace.members.length})
            </h3>
            <div className="space-y-3">
              {workspace.members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {m.fullName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#8c162a]/10 text-[#8c162a] dark:bg-[#f2c94c]/15 dark:text-[#f2c94c]">
                        {ROLE_LABELS[m.role]}
                      </span>
                      {m.role === 'admin_principal' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Protegido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">
                      {m.email} · {m.cargoTitle} · Estado: {m.accountStatus}
                    </p>
                  </div>

                  {m.role !== 'admin_principal' && user.role === 'admin_principal' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPermsMember(m)}
                        className="btn-dulima-secondary py-1.5 px-3 text-xs"
                      >
                        Permisos
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const nextStatus =
                            m.accountStatus === 'suspendido' ? 'activo' : 'suspendido';
                          await cmjApi.updateMember(m.id, { accountStatus: nextStatus });
                          notify('ok', `Estado cambiado a ${nextStatus}.`);
                        }}
                        className="btn-dulima-secondary py-1.5 px-3 text-xs"
                      >
                        {m.accountStatus === 'suspendido' ? 'Reactivar' : 'Suspender'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await cmjApi.deleteMember(m.id);
                          notify('ok', 'Integrante eliminado.');
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {editingPermsMember && (
            <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border-2 border-[#8c162a] dark:border-[#f2c94c] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-bold">
                  Permisos Granulares: {editingPermsMember.fullName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPermsMember(null)}
                  className="text-xs font-bold underline"
                >
                  Cerrar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800">
                      <th className="text-left py-2">Módulo</th>
                      {ALL_ACTIONS.map((act) => (
                        <th key={act} className="px-2 py-2 text-center uppercase">
                          {act}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        'sesiones',
                        'documentos',
                        'proyectos',
                        'noticias',
                        'actividades',
                        'comisiones',
                        'participacion',
                        'encuestas',
                        'galeria',
                      ] as CmjModule[]
                    ).map((mod) => {
                      const currentActions =
                        editingPermsMember.customPermissions?.[mod] || [];
                      return (
                        <tr key={mod} className="border-b border-stone-100 dark:border-stone-800/60">
                          <td className="py-2 font-bold uppercase">{mod}</td>
                          {ALL_ACTIONS.map((act) => {
                            const checked = currentActions.includes(act);
                            return (
                              <td key={act} className="text-center py-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...currentActions, act]
                                      : currentActions.filter((a) => a !== act);
                                    setEditingPermsMember({
                                      ...editingPermsMember,
                                      customPermissions: {
                                        ...editingPermsMember.customPermissions,
                                        [mod]: next,
                                      },
                                    });
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await cmjApi.updateMember(editingPermsMember.id, {
                    customPermissions: editingPermsMember.customPermissions,
                  });
                  setEditingPermsMember(null);
                  notify('ok', 'Permisos granulares actualizados.');
                }}
                className="btn-dulima-primary"
              >
                Guardar Permisos
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: SESIONES */}
      {tab === 'sesiones' && workspace && (
        <div className="space-y-6">
          {can('sesiones', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await cmjApi.createSession({
                    title: sessTitle,
                    sessionNumber: sessNum,
                    sessionType: sessType,
                    date: sessDate,
                    startTime: sessTime,
                    location: sessLocation,
                    ordenDelDia: sessOrden
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    publishNow: true,
                  });
                  setSessTitle('');
                  setSessNum('');
                  setSessOrden('');
                  notify('ok', 'Sesión registrada.');
                } catch (err: any) {
                  notify('err', err?.message || 'Error creando sesión.');
                }
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">Programar / Registrar Sesión</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título de la sesión"
                  value={sessTitle}
                  onChange={(e) => setSessTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="text"
                  placeholder="Número (ej. SES-001)"
                  value={sessNum}
                  onChange={(e) => setSessNum(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <select
                  value={sessType}
                  onChange={(e) => setSessType(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  <option value="ordinaria">Ordinaria</option>
                  <option value="extraordinaria">Extraordinaria</option>
                  <option value="comision">Comisión</option>
                  <option value="cabildo">Cabildo</option>
                </select>
                <input
                  type="date"
                  required
                  value={sessDate}
                  onChange={(e) => setSessDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="time"
                  value={sessTime}
                  onChange={(e) => setSessTime(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="text"
                  placeholder="Lugar"
                  value={sessLocation}
                  onChange={(e) => setSessLocation(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Orden del día (un punto por línea)"
                value={sessOrden}
                onChange={(e) => setSessOrden(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
              <button type="submit" className="btn-dulima-primary">
                <Plus className="w-4 h-4" />
                <span>Guardar Sesión</span>
              </button>
            </form>
          )}

          <div className="space-y-3">
            {workspace.sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c]">
                      {s.sessionNumber} · {s.date} · {s.status}
                    </span>
                    <h3 className="font-bold text-sm">{s.title}</h3>
                    {s.attendance && s.attendance.length > 0 && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Asistencia: {s.attendance.filter((a) => a.status === 'presente').length} Presente(s) ·{' '}
                        {s.attendance.filter((a) => a.status === 'excusa').length} Excusa(s) ·{' '}
                        {s.attendance.filter((a) => a.status === 'ausente').length} Ausente(s)
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {can('sesiones', 'editar') && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (attendanceSessionId === s.id) {
                              setAttendanceSessionId(null);
                              return;
                            }
                            const existingMap = new Map(
                              (s.attendance || []).map((a) => [a.memberId, a])
                            );
                            const list = workspace.members.map((m) => {
                              const prev = existingMap.get(m.id);
                              return {
                                memberId: m.id,
                                memberName: m.fullName,
                                cargoTitle: m.cargoTitle,
                                status: prev?.status || 'presente',
                                notes: prev?.notes || '',
                              };
                            });
                            setAttendanceDraft(list);
                            setAttendanceSessionId(s.id);
                          }}
                          className="btn-dulima-secondary py-1.5 px-3 text-xs"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Asistencia</span>
                        </button>
                        <select
                          value={s.status}
                          onChange={async (e) => {
                            await cmjApi.updateSession(s.id, { status: e.target.value as any });
                            notify('ok', 'Estado de sesión actualizado.');
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                        >
                          <option value="programada">Programada</option>
                          <option value="realizada">Realizada</option>
                          <option value="aplazada">Aplazada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </>
                    )}
                    {can('sesiones', 'eliminar') && (
                      <button
                        type="button"
                        onClick={async () => {
                          await cmjApi.deleteSession(s.id);
                          notify('ok', 'Sesión eliminada.');
                        }}
                        className="p-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {attendanceSessionId === s.id && (
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-stone-700 dark:text-stone-200">
                      Registro de Asistencia — {s.title}
                    </h4>
                    <div className="space-y-2">
                      {attendanceDraft.map((item, idx) => (
                        <div
                          key={item.memberId}
                          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-xs"
                        >
                          <div>
                            <span className="font-bold">{item.memberName}</span>
                            <span className="text-stone-500 ml-2">({item.cargoTitle})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={item.status}
                              onChange={(e) => {
                                const next = [...attendanceDraft];
                                next[idx] = {
                                  ...next[idx],
                                  status: e.target.value as any,
                                };
                                setAttendanceDraft(next);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold"
                            >
                              <option value="presente">Presente</option>
                              <option value="excusa">Con Excusa</option>
                              <option value="ausente">Ausente</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Observación (opcional)"
                              value={item.notes || ''}
                              onChange={(e) => {
                                const next = [...attendanceDraft];
                                next[idx] = { ...next[idx], notes: e.target.value };
                                setAttendanceDraft(next);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAttendanceSessionId(null)}
                        className="btn-dulima-secondary py-1.5 px-3 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await cmjApi.updateSession(s.id, { attendance: attendanceDraft });
                          setAttendanceSessionId(null);
                          notify('ok', 'Registro de asistencia guardado.');
                        }}
                        className="btn-dulima-primary py-1.5 px-4 text-xs"
                      >
                        Guardar Asistencia
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: DOCUMENTOS Y ACTAS */}
      {tab === 'documentos' && workspace && (
        <div className="space-y-6">
          {can('documentos', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!docFile) {
                  notify('err', 'Selecciona un archivo PDF o documento.');
                  return;
                }
                try {
                  const up = await cmjApi.uploadFile(docFile);
                  await cmjApi.createDocument({
                    title: docTitle,
                    code: docCode,
                    type: docType,
                    documentDate: docDate,
                    description: docDesc,
                    fileUrl: up.fileUrl,
                    fileName: up.fileName,
                    fileSize: up.fileSize,
                    publishNow: true,
                  });
                  setDocTitle('');
                  setDocCode('');
                  setDocDesc('');
                  setDocFile(null);
                  notify('ok', 'Documento oficial subido y publicado (v1).');
                } catch (err: any) {
                  notify('err', err?.message || 'Error subiendo documento.');
                }
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">
                Subir Acta o Documento Oficial
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título del documento"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="text"
                  placeholder="Código (ej. ACTA-001)"
                  value={docCode}
                  onChange={(e) => setDocCode(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => (
                    <option key={t} value={t}>
                      {DOCUMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Descripción breve"
                value={docDesc}
                onChange={(e) => setDocDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
              <div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="text-xs"
                />
              </div>
              <button type="submit" className="btn-dulima-primary">
                <Upload className="w-4 h-4" />
                <span>Subir Documento Oficial</span>
              </button>
            </form>
          )}

          <div className="space-y-3">
            {workspace.documents.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c]">
                      {d.code} · {DOCUMENT_TYPE_LABELS[d.type]} · v{d.currentVersion}
                    </span>
                    <h3 className="font-bold text-sm">{d.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {can('documentos', 'editar') && (
                      <button
                        type="button"
                        onClick={() => setVersionDocId(versionDocId === d.id ? null : d.id)}
                        className="btn-dulima-secondary py-1.5 px-3 text-xs"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Nueva Versión</span>
                      </button>
                    )}
                    {can('documentos', 'eliminar') && (
                      <button
                        type="button"
                        onClick={async () => {
                          await cmjApi.deleteDocument(d.id);
                          notify('ok', 'Documento eliminado.');
                        }}
                        className="p-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {versionDocId === d.id && (
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/70 flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Nota de la nueva versión"
                      value={versionNotes}
                      onChange={(e) => setVersionNotes(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!versionFile) return;
                        const up = await cmjApi.uploadFile(versionFile);
                        await cmjApi.addDocumentVersion(d.id, {
                          fileUrl: up.fileUrl,
                          fileName: up.fileName,
                          fileSize: up.fileSize,
                          notes: versionNotes || `Versión ${d.currentVersion + 1}`,
                        });
                        setVersionDocId(null);
                        setVersionFile(null);
                        setVersionNotes('');
                        notify('ok', 'Nueva versión agregada conservando historial.');
                      }}
                      className="btn-dulima-primary py-1.5 px-3 text-xs"
                    >
                      Guardar v{d.currentVersion + 1}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: PROYECTOS */}
      {tab === 'proyectos' && workspace && (
        <div className="space-y-6">
          {can('proyectos', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await cmjApi.createProject({
                  name: projName,
                  description: projDesc,
                  justification: projJust,
                  beneficiaryPopulation: projPop,
                  status: projStatus as any,
                  progressPercent: projProgress,
                  publishNow: true,
                });
                setProjName('');
                setProjDesc('');
                setProjJust('');
                notify('ok', 'Proyecto registrado.');
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">Registrar Proyecto o Iniciativa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre del proyecto"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <select
                  value={projStatus}
                  onChange={(e) => setProjStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  <option value="propuesta">Propuesta</option>
                  <option value="en_revision">En revisión</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="en_ejecucion">En ejecución</option>
                  <option value="finalizada">Finalizada</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Avance %"
                  value={projProgress}
                  onChange={(e) => setProjProgress(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Descripción"
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
              <button type="submit" className="btn-dulima-primary">
                <Plus className="w-4 h-4" />
                <span>Guardar Proyecto</span>
              </button>
            </form>
          )}

          <div className="space-y-3">
            {workspace.projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-[#003893] dark:text-blue-400">
                    {p.status} · {p.progressPercent}%
                  </span>
                  <h3 className="font-bold text-sm">{p.name}</h3>
                </div>
                {can('proyectos', 'eliminar') && (
                  <button
                    type="button"
                    onClick={async () => {
                      await cmjApi.deleteProject(p.id);
                      notify('ok', 'Proyecto eliminado.');
                    }}
                    className="p-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: NOTICIAS */}
      {tab === 'noticias' && workspace && (
        <div className="space-y-6">
          {can('noticias', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await cmjApi.createArticle({
                  title: artTitle,
                  kind: artKind,
                  summary: artSummary,
                  content: artContent,
                  coverImageUrl: artCoverUrl || undefined,
                  requestedStatus: can('noticias', 'publicar') ? 'publicado' : 'en_revision',
                });
                setArtTitle('');
                setArtSummary('');
                setArtContent('');
                setArtCoverUrl('');
                notify(
                  'ok',
                  can('noticias', 'publicar')
                    ? 'Publicación difundida.'
                    : 'Publicación enviada a revisión para aprobación.'
                );
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">
                Redactar Noticia o Comunicado Oficial
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título"
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <select
                  value={artKind}
                  onChange={(e) => setArtKind(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  <option value="comunicado_oficial">Comunicado Oficial del CMJ</option>
                  <option value="opinion_articulo">Opinión / Artículo</option>
                </select>
              </div>
              <ImageUploadField
                label="Imagen de Portada (Opcional)"
                value={artCoverUrl}
                onChange={setArtCoverUrl}
                aspectClass="h-40"
              />
              <input
                type="text"
                placeholder="Resumen corto"
                value={artSummary}
                onChange={(e) => setArtSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
              <textarea
                rows={4}
                required
                placeholder="Contenido completo"
                value={artContent}
                onChange={(e) => setArtContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
              <button type="submit" className="btn-dulima-primary">
                <Plus className="w-4 h-4" />
                <span>
                  {can('noticias', 'publicar') ? 'Publicar Ahora' : 'Enviar a Revisión'}
                </span>
              </button>
            </form>
          )}

          <div className="space-y-3">
            {workspace.articles.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold uppercase text-[#8c162a] dark:text-[#f2c94c]">
                    {a.kind} · {a.approvalStatus}
                  </span>
                  <h3 className="font-bold text-sm">{a.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {a.approvalStatus !== 'publicado' && can('noticias', 'publicar') && (
                    <button
                      type="button"
                      onClick={async () => {
                        await cmjApi.updateArticle(a.id, { approvalStatus: 'publicado' });
                        notify('ok', 'Publicación aprobada y publicada.');
                      }}
                      className="btn-dulima-primary py-1.5 px-3 text-xs"
                    >
                      Aprobar y Publicar
                    </button>
                  )}
                  {can('noticias', 'eliminar') && (
                    <button
                      type="button"
                      onClick={async () => {
                        await cmjApi.deleteArticle(a.id);
                        notify('ok', 'Publicación eliminada.');
                      }}
                      className="p-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ACTIVIDADES */}
      {tab === 'actividades' && workspace && (
        <div className="space-y-6">
          {can('actividades', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await cmjApi.createActivity({
                  title: actTitle,
                  date: actDate,
                  location: actLocation,
                  description: actDesc,
                  publishNow: true,
                });
                setActTitle('');
                setActDesc('');
                notify('ok', 'Actividad registrada.');
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">Registrar Actividad Juvenil</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="date"
                  required
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="text"
                  placeholder="Lugar"
                  value={actLocation}
                  onChange={(e) => setActLocation(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Descripción y resultados"
                value={actDesc}
                onChange={(e) => setActDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
              <button type="submit" className="btn-dulima-primary">
                <Plus className="w-4 h-4" />
                <span>Guardar Actividad</span>
              </button>
            </form>
          )}
          <div className="space-y-3">
            {workspace.activities.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-[#166534] dark:text-emerald-400">
                    {a.date} · {a.location}
                  </span>
                  <h3 className="font-bold text-sm">{a.title}</h3>
                </div>
                {can('actividades', 'eliminar') && (
                  <button
                    type="button"
                    onClick={async () => {
                      await cmjApi.deleteActivity(a.id);
                      notify('ok', 'Actividad eliminada.');
                    }}
                    className="p-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: COMISIONES */}
      {tab === 'comisiones' && workspace && (
        <div className="space-y-6">
          {can('comisiones', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await cmjApi.createCommission({ name: comName, description: comDesc });
                setComName('');
                setComDesc('');
                notify('ok', 'Comisión creada.');
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">Crear Comisión de Trabajo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre de la comisión"
                  value={comName}
                  onChange={(e) => setComName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  value={comDesc}
                  onChange={(e) => setComDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <button type="submit" className="btn-dulima-primary">
                <Plus className="w-4 h-4" />
                <span>Agregar Comisión</span>
              </button>
            </form>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspace.commissions.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800"
              >
                <h3 className="font-bold text-sm">{c.name}</h3>
                <p className="text-xs text-stone-500 mt-1">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: PARTICIPACIÓN JUVENIL (PROPUESTAS) */}
      {tab === 'participacion' && workspace && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold">
            Propuestas e Inquietudes Ciudadanas ({workspace.proposals.length})
          </h2>
          {workspace.proposals.length === 0 ? (
            <p className="text-sm text-stone-500">No hay propuestas radicadas aún.</p>
          ) : (
            workspace.proposals.map((prop) => {
              const cur = propResponses[prop.id] || {
                status: prop.status,
                text: prop.institutionalResponse || '',
              };
              return (
                <div
                  key={prop.id}
                  className="rounded-2xl p-5 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#8c162a] dark:text-[#f2c94c]">
                      {prop.trackingCode} · {prop.topic}
                    </span>
                    <span className="text-xs font-bold uppercase">{prop.status}</span>
                  </div>
                  <h3 className="font-bold text-base">{prop.title}</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300">{prop.description}</p>
                  <p className="text-[11px] text-stone-500">
                    Por {prop.authorName} ({prop.authorEmail})
                  </p>
                  {can('participacion', 'editar') && (
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-2">
                      <select
                        value={cur.status}
                        onChange={(e) =>
                          setPropResponses({
                            ...propResponses,
                            [prop.id]: { ...cur, status: e.target.value },
                          })
                        }
                        className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      >
                        <option value="recibida">Recibida</option>
                        <option value="en_revision">En revisión</option>
                        <option value="aceptada">Aceptada</option>
                        <option value="respondida">Respondida</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Respuesta institucional..."
                        value={cur.text}
                        onChange={(e) =>
                          setPropResponses({
                            ...propResponses,
                            [prop.id]: { ...cur, text: e.target.value },
                          })
                        }
                        className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await cmjApi.respondProposal(prop.id, cur.status, cur.text);
                          notify('ok', `Respuesta guardada para ${prop.trackingCode}.`);
                        }}
                        className="btn-dulima-primary py-1.5 px-3 text-xs"
                      >
                        Guardar Respuesta
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB: ENCUESTAS Y VOTACIONES OFICIALES */}
      {(tab === 'encuestas' || tab === 'votaciones') && workspace && (
        <div className="space-y-6">
          {can('encuestas', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const opts = pollOptionsText
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((text) => ({ text }));
                await cmjApi.createPoll({
                  title: pollTitle,
                  description: pollDesc,
                  pollKind,
                  options: opts,
                });
                setPollTitle('');
                setPollDesc('');
                setPollOptionsText('');
                notify('ok', 'Encuesta/Votación publicada.');
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">Crear Encuesta o Votación Oficial</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Pregunta o título"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <select
                  value={pollKind}
                  onChange={(e) => setPollKind(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  <option value="encuesta_opinion">Encuesta de Opinión Ciudadana</option>
                  <option value="votacion_oficial">Votación Oficial / Decisión del Consejo</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                placeholder="Opciones (una por línea, mínimo 2)"
                value={pollOptionsText}
                onChange={(e) => setPollOptionsText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
              <button type="submit" className="btn-dulima-primary">
                <Plus className="w-4 h-4" />
                <span>Publicar Consulta</span>
              </button>
            </form>
          )}
          <div className="space-y-3">
            {workspace.polls.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold uppercase text-[#8c162a] dark:text-[#f2c94c]">
                    {p.pollKind} · {p.totalVotes} votos
                  </span>
                  <h3 className="font-bold text-sm">{p.title}</h3>
                </div>
                {can('encuestas', 'eliminar') && (
                  <button
                    type="button"
                    onClick={async () => {
                      await cmjApi.deletePoll(p.id);
                      notify('ok', 'Encuesta eliminada.');
                    }}
                    className="p-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: GALERÍA */}
      {tab === 'galeria' && workspace && (
        <div className="space-y-6">
          {can('galeria', 'crear') && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!mediaUrl) {
                  notify('err', 'Sube una imagen o video primero.');
                  return;
                }
                const isVideo = /\.(mp4|webm)$/i.test(mediaUrl);
                await cmjApi.createMedia({
                  title: mediaTitle,
                  category: mediaCategory,
                  mediaType: isVideo ? 'video' : 'image',
                  url: mediaUrl,
                });
                setMediaTitle('');
                setMediaUrl('');
                notify('ok', 'Elemento multimedia publicado.');
              }}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <h2 className="text-lg font-display font-bold">Subir Foto o Video</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
                <select
                  value={mediaCategory}
                  onChange={(e) => setMediaCategory(e.target.value as MediaCategory)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  {(Object.keys(MEDIA_CATEGORY_LABELS) as MediaCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {MEDIA_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <ImageUploadField
                label="Archivo Multimedia (Foto o Video)"
                value={mediaUrl}
                onChange={setMediaUrl}
                accept="image/*,video/mp4,video/webm"
                helperText="Arrastra una foto o video aquí o haz clic para seleccionar"
                aspectClass="h-48"
              />
              <button type="submit" className="btn-dulima-primary">
                <Upload className="w-4 h-4" />
                <span>Subir a Galería</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB: CONFIGURACIÓN */}
      {tab === 'configuracion' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await cmjApi.updateConfig({
              officialLogoUrl: cfgLogoUrl,
              mission: cfgMission,
              vision: cfgVision,
              officeAddress: cfgAddress,
              officeHours: cfgHours,
              institutionalEmail: cfgEmail,
            });
            notify('ok', 'Configuración institucional y logo guardados.');
          }}
          className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
        >
          <h2 className="text-lg font-display font-bold">
            Información Institucional y Logo Oficial del CMJ Flandes
          </h2>
          <ImageUploadField
            label="Logo Oficial del Consejo Municipal de Juventud de Flandes (PNG / JPG / WebP)"
            value={cfgLogoUrl}
            onChange={setCfgLogoUrl}
            helperText="Sube el archivo oficial del logo del CMJ Flandes para mostrarlo en el encabezado y pie de página"
            aspectClass="h-32"
          />
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Misión</label>
            <textarea
              rows={3}
              value={cfgMission}
              onChange={(e) => setCfgMission(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Visión</label>
            <textarea
              rows={3}
              value={cfgVision}
              onChange={(e) => setCfgVision(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Dirección Sede</label>
              <input
                type="text"
                value={cfgAddress}
                onChange={(e) => setCfgAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Horario</label>
              <input
                type="text"
                value={cfgHours}
                onChange={(e) => setCfgHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Correo Oficial</label>
              <input
                type="email"
                value={cfgEmail}
                onChange={(e) => setCfgEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="btn-dulima-primary">
            Guardar Configuración
          </button>
        </form>
      )}

      {/* TAB: GOOGLE DOCS & GOOGLE CHAT */}
      {tab === 'workspace' && <GoogleWorkspacePanel />}

      {/* TAB: AUDITORÍA Y RESPALDO */}
      {tab === 'auditoria' && workspace && (
        <div className="space-y-6">
          {user.role === 'admin_principal' && (
            <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-bold">
                  Respaldo y Restauración de Base de Datos
                </h2>
                <p className="text-xs text-stone-500">
                  Exporta una copia completa en JSON o restaura un respaldo previo (exclusivo del Administrador Principal).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const backup = await cmjApi.exportBackup();
                    const blob = new Blob([JSON.stringify(backup, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `respaldo-cmj-flandes-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-dulima-primary"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Respaldo JSON</span>
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-display font-bold">
              Registro de Auditoría y Seguridad ({workspace.auditLogs.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {workspace.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 text-xs flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-[#8c162a] dark:text-[#f2c94c] uppercase">
                      [{log.module}] {log.action}
                    </span>{' '}
                    — <span>{log.details}</span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {log.actorName} · {new Date(log.createdAt).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
