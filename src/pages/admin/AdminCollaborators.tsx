import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Check, 
  X, 
  Key, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Save, 
  UserCheck, 
  Phone, 
  Mail, 
  Calendar,
  Shield,
  ShieldCheck,
  RefreshCw,
  Search,
  Award,
  History,
  Ban,
  RotateCcw,
  Plus,
  Trash2,
  Sliders
} from 'lucide-react';
import { 
  CollaboratorRequest, 
  Collaborator, 
  PlatformSettings,
  AuthorProfile,
  SubscriberUser,
  VerificationPolicy,
  VerificationStatus
} from '../../types';
import { 
  getCollaboratorRequests, 
  updateCollaboratorRequestStatus, 
  getCollaborators, 
  updateCollaboratorStatus,
  deleteCollaborator,
  getSettings, 
  updateSettings,
  getAuthorProfiles,
  getSubscribers,
  getVerificationPolicy,
  saveVerificationPolicy,
  adminManageAuthorVerification,
  checkVerificationEligibility
} from '../../services/db';
import { ColombianVerifiedBadge, isAuthorVerificationActive } from '../../components/common/ColombianVerifiedBadge';
import { CollaboratorPermissionsModal } from '../../components/admin/CollaboratorPermissionsModal';

export const AdminCollaborators: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'verifications'>('collaborators');
  const [requests, setRequests] = useState<CollaboratorRequest[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [authorProfiles, setAuthorProfiles] = useState<AuthorProfile[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberUser[]>([]);
  const [verificationPolicy, setVerificationPolicy] = useState<VerificationPolicy>('suspender_al_vencer');
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [verifSearch, setVerifSearch] = useState('');
  const [verifFilter, setVerifFilter] = useState<string>('all');
  const [verifNote, setVerifNote] = useState<Record<string, string>>({});
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings editing
  const [newCode, setNewCode] = useState('');
  const [codeActive, setCodeActive] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Review modal / feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Collaborator Permissions & Profile Modal
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reqs, cols, sets, profiles, subs, policy] = await Promise.all([
        getCollaboratorRequests(),
        getCollaborators(),
        getSettings(),
        getAuthorProfiles(),
        getSubscribers(),
        getVerificationPolicy()
      ]);
      setRequests(reqs);
      setCollaborators(cols);
      setSettings(sets);
      setAuthorProfiles(profiles);
      setSubscribers(subs);
      setVerificationPolicy(policy);
      setNewCode(sets.invitationCode || 'COLOMBIA2026');
      setCodeActive(sets.invitationCodeActive ?? true);
    } catch (e) {
      console.error('Error loading collaboration data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVerificationPolicy = async () => {
    setSavingPolicy(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await saveVerificationPolicy(verificationPolicy);
      setSuccessMsg('Política de vencimiento de verificación guardada.');
    } catch {
      setErrorMsg('No se pudo guardar la política de verificación.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleVerificationAction = async (
    profile: AuthorProfile,
    action: 'aprobar' | 'rechazar' | 'retirar' | 'renovar'
  ) => {
    setProcessingId(profile.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const reason = verifNote[profile.id] || '';
      const matchingSub = subscribers.find(
        (s) => s.email?.toLowerCase() === profile.email?.toLowerCase()
      );
      const matchingCol = collaborators.find(
        (c) => c.email?.toLowerCase() === profile.email?.toLowerCase()
      );
      const updated = await adminManageAuthorVerification({
        profileId: profile.id,
        action,
        reason: reason || undefined,
        subscriber: matchingSub,
        collaborator: matchingCol
      });
      setSuccessMsg(`Estado de verificación de ${profile.fullName} actualizado a: ${updated.verificationStatus}.`);
      await loadAll();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al gestionar la verificación.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (req: CollaboratorRequest) => {
    setProcessingId(req.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateCollaboratorRequestStatus(req.id, 'aprobada');
      setSuccessMsg(`Se aprobó la solicitud de ${req.fullName}. Ahora puede acceder al escritorio editorial.`);
      await loadAll();
    } catch (e: any) {
      setErrorMsg('Error al aprobar la solicitud.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: CollaboratorRequest) => {
    setProcessingId(req.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateCollaboratorRequestStatus(req.id, 'rechazada');
      setSuccessMsg(`Se rechazó la solicitud de ${req.fullName}.`);
      await loadAll();
    } catch (e: any) {
      setErrorMsg('Error al rechazar la solicitud.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleCollaboratorStatus = async (col: Collaborator) => {
    const nextStatus = col.status === 'activo' ? 'suspendido' : 'activo';
    try {
      await updateCollaboratorStatus(col.id, nextStatus);
      await loadAll();
    } catch (e: any) {
      setErrorMsg('Error al actualizar el estado del colaborador.');
    }
  };

  const handleSaveCodeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      setErrorMsg('El código de invitación no puede estar vacío.');
      return;
    }

    setSavingSettings(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateSettings({
        invitationCode: newCode.trim(),
        invitationCodeActive: codeActive
      });
      setSuccessMsg('Código de invitación y política de acceso guardados.');
      await loadAll();
    } catch (e: any) {
      setErrorMsg('Error al guardar la configuración del código.');
    } finally {
      setSavingSettings(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pendiente');
  const pendingVerificationsCount = authorProfiles.filter(p => p.verificationStatus === 'pendiente').length;

  const filteredProfiles = authorProfiles.filter((p) => {
    const status = p.verificationStatus || 'no_solicitada';
    if (verifFilter !== 'all' && status !== verifFilter) return false;
    if (verifSearch.trim()) {
      const q = verifSearch.toLowerCase();
      return (
        p.fullName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
            Comité Editorial & Red de Articulistas
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] dark:text-white mt-1">
            Colaboración y Verificaciones
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Aprueba solicitudes de colaboradores, gestiona códigos de invitación y administra la insignia de verificación colombiana.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white self-start sm:self-auto transition-colors cursor-pointer"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('collaborators')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'collaborators'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          Colaboradores ({collaborators.length})
        </button>
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center space-x-2 cursor-pointer ${
            activeTab === 'verifications'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Verificaciones ({authorProfiles.length})</span>
          {pendingVerificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black">
              {pendingVerificationsCount}
            </span>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'collaborators' && (
        <>
          {/* 1. Invitation Code Administration */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <Key className="w-5 h-5 text-gold-600 dark:text-gold-400" />
          <span>Código de Invitación Editorial</span>
        </h2>

        <form onSubmit={handleSaveCodeSettings} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
              Código Activo para Solicitudes
            </label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="COLOMBIA2026"
              className="w-full p-2.5 font-mono text-sm uppercase tracking-wider font-bold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Las personas que deseen colaborar deberán ingresar este código exacto en el formulario público.
            </p>
          </div>

          <div className="sm:col-span-3">
            <label className="flex items-center space-x-2 cursor-pointer p-2.5 border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900">
              <input
                type="checkbox"
                checked={codeActive}
                onChange={(e) => setCodeActive(e.target.checked)}
                className="w-4 h-4 accent-gold-600 rounded"
              />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Aceptar solicitudes
              </span>
            </label>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 px-4 rounded-xl bg-[#121212] hover:bg-gold-700 dark:bg-gold-600 dark:hover:bg-gold-500 text-white dark:text-stone-950 font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Guardando...' : 'Actualizar Código'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Pending Requests Section */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            <span>Solicitudes Pendientes de Aprobación ({pendingRequests.length})</span>
          </h2>
          {pendingRequests.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
              Requieren tu revisión
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <UserCheck className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="text-xs text-stone-500 font-serif italic">
              No hay solicitudes pendientes en este momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {pendingRequests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 font-sans">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                      {req.fullName}
                    </h3>
                    <span className="text-[10px] text-stone-400">
                      • {new Date(req.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{req.email}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{req.phone}</span>
                    </span>
                    <span className="text-[11px] font-mono bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                      Código: {req.invitationCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={processingId === req.id}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprobar</span>
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={processingId === req.id}
                    className="px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-600 hover:text-rose-600 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Approved Collaborators Directory */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Administrar Colaboradores ({collaborators.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => {
              setEditingCollaborator(null);
              setPermModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Colaborador</span>
          </button>
        </div>

        {collaborators.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Users className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="text-xs text-stone-500 font-serif italic">
              Aún no tienes colaboradores registrados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Colaborador</th>
                  <th className="py-3 px-3">Contacto</th>
                  <th className="py-3 px-3">Permisos y Beneficios</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {collaborators.map((col) => {
                  const activePermsCount = col.permissions
                    ? Object.values(col.permissions).filter(Boolean).length
                    : 6;
                  const benefitsCount = col.customBenefits?.length || 0;

                  return (
                    <tr key={col.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-stone-900 dark:text-white">
                        <div>{col.fullName}</div>
                        {col.username && (
                          <div className="text-[10px] text-stone-400">@{col.username}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-500 dark:text-stone-400">
                        <div>{col.email}</div>
                        <div className="text-[10px] text-stone-400">{col.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-gold-50 dark:bg-gold-950/40 text-gold-800 dark:text-gold-300 text-[10px] font-bold">
                            {activePermsCount} permisos SÍ
                          </span>
                          {benefitsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                              +{benefitsCount} beneficios
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {col.status === 'activo' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            ● Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            ▲ {col.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCollaborator(col);
                              setPermModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-md text-xs font-bold text-gold-700 dark:text-gold-300 bg-gold-50 dark:bg-gold-950/40 hover:bg-gold-100 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                            title="Configurar permisos individuales SÍ/NO y beneficios"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Permisos</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCollaboratorStatus(col)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            {col.status === 'activo' ? 'Suspender' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteCollaborator(col.id, col.fullName);
                              setSuccessMsg(`Colaborador ${col.fullName} eliminado.`);
                              await loadAll();
                            }}
                            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Eliminar colaborador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'verifications' && (
        <div className="space-y-6">
          {/* Expiration Policy Card */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                  <span>Política de Vencimiento de Suscripción</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Define qué ocurre automáticamente con la insignia colombiana cuando vence el plan Mensual o Anual de un autor verificado.
                </p>
              </div>
              <button
                onClick={handleSaveVerificationPolicy}
                disabled={savingPolicy}
                className="px-4 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{savingPolicy ? 'Guardando...' : 'Guardar Política'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  verificationPolicy === 'suspender_al_vencer'
                    ? 'border-gold-500 bg-gold-50/50 dark:bg-gold-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-[#faf9f6] dark:bg-stone-900'
                }`}
              >
                <input
                  type="radio"
                  name="verifPolicy"
                  checked={verificationPolicy === 'suspender_al_vencer'}
                  onChange={() => setVerificationPolicy('suspender_al_vencer')}
                  className="mt-1 accent-gold-600"
                />
                <div>
                  <span className="block text-xs font-bold text-[#121212] dark:text-white">
                    Suspender insignia al vencer
                  </span>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    La insignia deja de mostrarse inmediatamente si la suscripción Mensual o Anual expira o se suspende.
                  </span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  verificationPolicy === 'pendiente_renovacion_al_vencer'
                    ? 'border-gold-500 bg-gold-50/50 dark:bg-gold-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-[#faf9f6] dark:bg-stone-900'
                }`}
              >
                <input
                  type="radio"
                  name="verifPolicy"
                  checked={verificationPolicy === 'pendiente_renovacion_al_vencer'}
                  onChange={() => setVerificationPolicy('pendiente_renovacion_al_vencer')}
                  className="mt-1 accent-gold-600"
                />
                <div>
                  <span className="block text-xs font-bold text-[#121212] dark:text-white">
                    Marcar como pendiente de renovación
                  </span>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    La insignia se oculta públicamente y pasa a estado "Pendiente de renovación" para revisión del propietario.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={verifSearch}
                onChange={(e) => setVerifSearch(e.target.value)}
                placeholder="Buscar autor por nombre, correo u ocupación..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>

            <select
              value={verifFilter}
              onChange={(e) => setVerifFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white font-semibold"
            >
              <option value="all">Todos los perfiles ({authorProfiles.length})</option>
              <option value="pendiente">Solicitudes pendientes ({pendingVerificationsCount})</option>
              <option value="verificado">Verificados activos</option>
              <option value="suspendido">Suspendidos</option>
              <option value="pendiente_renovacion">Pendiente de renovación</option>
              <option value="rechazado">Rechazados</option>
              <option value="revocada">Revocados</option>
              <option value="no_verificado">Sin solicitar</option>
            </select>
          </div>

          {/* Author Profiles & Verification List */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            {filteredProfiles.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Award className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
                <p className="font-serif italic text-sm text-stone-500">
                  No se encontraron perfiles de autor con este criterio.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredProfiles.map((prof) => {
                  const matchingSub = subscribers.find(
                    (s) => s.email?.toLowerCase() === prof.email?.toLowerCase()
                  );
                  const matchingCol = collaborators.find(
                    (c) => c.email?.toLowerCase() === prof.email?.toLowerCase()
                  );
                  const eligibility = checkVerificationEligibility({
                    role: prof.role,
                    subscriber: matchingSub,
                    collaborator: matchingCol
                  });
                  const badgeActive = isAuthorVerificationActive(prof, matchingSub);

                  return (
                    <div key={prof.id} className="p-5 space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex items-start space-x-3.5">
                          {prof.photoUrl ? (
                            <img
                              src={prof.photoUrl}
                              alt={prof.fullName}
                              className="w-12 h-12 rounded-full object-cover border border-gold-400 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-serif font-bold text-stone-500 shrink-0">
                              {prof.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white inline-flex items-center space-x-1.5">
                                <span>{prof.fullName}</span>
                                {badgeActive && <ColombianVerifiedBadge size="sm" />}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                {prof.verificationStatus || 'no_verificado'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                              {prof.email && <span>{prof.email}</span>}
                              {prof.occupation && <span>• {prof.occupation}</span>}
                              {(prof.city || prof.country) && (
                                <span>• {[prof.city, prof.country].filter(Boolean).join(', ')}</span>
                              )}
                            </div>

                            {/* Contracted Plan & Eligibility Status */}
                            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-semibold text-stone-700 dark:text-stone-300">
                                Plan: {matchingSub ? `${matchingSub.planName} (${matchingSub.period}) — ${matchingSub.status}` : 'Sin suscripción activa'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-semibold ${
                                  eligibility.eligible
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                }`}
                              >
                                {eligibility.eligible ? 'Elegible (Mensual/Anual activo)' : eligibility.reason}
                              </span>
                            </div>

                            {prof.bio && (
                              <p className="text-xs text-stone-600 dark:text-stone-300 pt-1 line-clamp-2">
                                {prof.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Owner Verification Actions */}
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={processingId === prof.id}
                              onClick={() => handleVerificationAction(prof, 'aprobar')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprobar / Renovar</span>
                            </button>

                            <button
                              type="button"
                              disabled={processingId === prof.id}
                              onClick={() => handleVerificationAction(prof, 'rechazar')}
                              className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>

                            <button
                              type="button"
                              disabled={processingId === prof.id}
                              onClick={() => handleVerificationAction(prof, 'retirar')}
                              className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Retirar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedHistoryId(expandedHistoryId === prof.id ? null : prof.id)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Historial</span>
                            </button>
                          </div>

                          <input
                            type="text"
                            value={verifNote[prof.id] || ''}
                            onChange={(e) =>
                              setVerifNote((prev) => ({ ...prev, [prof.id]: e.target.value }))
                            }
                            placeholder="Nota interna o motivo (opcional)..."
                            className="w-full sm:w-64 px-2.5 py-1.5 text-[11px] border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Expandable History & Public Visibility Summary */}
                      {expandedHistoryId === prof.id && (
                        <div className="p-4 rounded-xl bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-stone-700 dark:text-stone-200">
                              Campos autorizados para perfil público:
                            </span>{' '}
                            <span className="text-stone-500">
                              {[
                                prof.showOccupationPublic && 'Ocupación',
                                prof.showLocationPublic && 'Ciudad/País',
                                prof.showEmailPublic && 'Correo',
                                prof.showPhonePublic && 'Teléfono',
                                prof.showSocialsPublic && 'Redes Sociales'
                              ]
                                .filter(Boolean)
                                .join(', ') || 'Solo nombre y biografía'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <span className="font-bold text-stone-700 dark:text-stone-200 block">
                              Historial de cambios de verificación:
                            </span>
                            {!prof.verificationHistory || prof.verificationHistory.length === 0 ? (
                              <p className="text-stone-400 italic">Sin movimientos registrados.</p>
                            ) : (
                              <ul className="space-y-1">
                                {prof.verificationHistory.map((h, idx) => (
                                  <li key={h.id || idx} className="text-[11px] text-stone-600 dark:text-stone-300">
                                    • <strong>{h.action}</strong> — {new Date(h.timestamp).toLocaleString('es-CO')} por {h.actor}
                                    {h.reason ? ` (${h.reason})` : ''}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Collaborator Permissions & Profile Modal */}
      <CollaboratorPermissionsModal
        key={editingCollaborator?.id || 'new'}
        collaborator={editingCollaborator}
        isOpen={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        onSaved={async (msg) => {
          setSuccessMsg(msg);
          await loadAll();
        }}
      />
    </div>
  );
};
