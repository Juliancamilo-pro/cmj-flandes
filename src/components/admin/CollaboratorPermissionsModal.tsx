import React, { useState, useMemo } from 'react';
import {
  Shield,
  Lock,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  History
} from 'lucide-react';
import {
  Collaborator,
  CollaboratorCustomBenefit,
  PermissionAuditLog
} from '../../types';
import {
  COLLABORATOR_PERMISSIONS_CATALOG,
  PERMISSION_CATEGORIES,
  getDefaultCollaboratorPermissions,
  OWNER_ONLY_PERMISSION_KEYS
} from '../../utils/permissions';
import {
  saveCollaborator,
  logPermissionAudit,
  getPermissionAuditLogs
} from '../../services/db';

interface CollaboratorPermissionsModalProps {
  collaborator: Collaborator | null; // null when creating a new collaborator
  isOpen: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const PRESET_CUSTOM_BENEFITS: { name: string; description: string }[] = [
  { name: 'Acceso a funciones Premium', description: 'Lectura sin límites y herramientas avanzadas de edición.' },
  { name: 'Publicaciones adicionales', description: 'Cupo ampliado de artículos y columnas mensuales.' },
  { name: 'Herramientas multimedia', description: 'Carga prioritaria de galerías, audios y videos.' },
  { name: 'Acceso a encuestas', description: 'Participación destacada y propuesta de consultas ciudadanas.' },
  { name: 'Beneficios publicitarios', description: 'Espacio promocional para proyectos propios.' },
  { name: 'Insignia especial', description: 'Distintivo de Colaborador Destacado en su perfil público.' },
  { name: 'Acceso a estadísticas', description: 'Métricas detalladas de lectura e impacto de sus artículos.' }
];

export const CollaboratorPermissionsModal: React.FC<CollaboratorPermissionsModalProps> = ({
  collaborator,
  isOpen,
  onClose,
  onSaved
}) => {
  const isNew = !collaborator;

  const initialPerms = useMemo<Record<string, boolean>>(() => {
    const base = getDefaultCollaboratorPermissions();
    if (collaborator?.permissions) {
      for (const [k, v] of Object.entries(collaborator.permissions)) {
        if (!OWNER_ONLY_PERMISSION_KEYS.has(k)) {
          base[k] = Boolean(v);
        }
      }
    }
    return base;
  }, [collaborator]);

  const [fullName, setFullName] = useState(collaborator?.fullName || '');
  const [username, setUsername] = useState(collaborator?.username || '');
  const [email, setEmail] = useState(collaborator?.email || '');
  const [phone, setPhone] = useState(collaborator?.phone || '');
  const [photoUrl, setPhotoUrl] = useState(collaborator?.photoUrl || '');
  const [bio, setBio] = useState(collaborator?.bio || '');
  const [status, setStatus] = useState<'activo' | 'suspendido' | 'inactivo'>(
    collaborator?.status || 'activo'
  );
  const [invitationCode, setInvitationCode] = useState(collaborator?.invitationCode || '');

  const [permissions, setPermissions] = useState<Record<string, boolean>>(initialPerms);
  const [customBenefits, setCustomBenefits] = useState<CollaboratorCustomBenefit[]>(
    collaborator?.customBenefits || []
  );
  const [newBenefitName, setNewBenefitName] = useState('');
  const [newBenefitDesc, setNewBenefitDesc] = useState('');

  const [permSearch, setPermSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState<PermissionAuditLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute modified permissions diff before saving
  const modifiedPermissions = COLLABORATOR_PERMISSIONS_CATALOG.filter((p) => {
    if (p.ownerOnly) return false;
    const prevVal = Boolean(initialPerms[p.key]);
    const nextVal = Boolean(permissions[p.key]);
    return prevVal !== nextVal;
  }).map((p) => ({
    key: p.key,
    label: p.label,
    previousValue: Boolean(initialPerms[p.key]),
    newValue: Boolean(permissions[p.key])
  }));

  const togglePermission = (key: string, ownerOnly?: boolean) => {
    if (ownerOnly || OWNER_ONLY_PERMISSION_KEYS.has(key)) return;
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnableAllAllowed = () => {
    const next: Record<string, boolean> = { ...permissions };
    for (const p of COLLABORATOR_PERMISSIONS_CATALOG) {
      if (!p.ownerOnly) next[p.key] = true;
    }
    setPermissions(next);
  };

  const handleDisableAll = () => {
    const next: Record<string, boolean> = { ...permissions };
    for (const p of COLLABORATOR_PERMISSIONS_CATALOG) {
      if (!p.ownerOnly) next[p.key] = false;
    }
    setPermissions(next);
  };

  const handleRestoreDefaults = () => {
    setPermissions(getDefaultCollaboratorPermissions());
  };

  const handleAddBenefit = (name: string, description: string) => {
    if (!name.trim()) return;
    const item: CollaboratorCustomBenefit = {
      id: `ben_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: name.trim(),
      description: description.trim() || 'Beneficio especial asignado por el propietario.',
      assignedAt: new Date().toISOString()
    };
    setCustomBenefits((prev) => [...prev, item]);
    setNewBenefitName('');
    setNewBenefitDesc('');
  };

  const handleRemoveBenefit = (id: string) => {
    setCustomBenefits((prev) => prev.filter((b) => b.id !== id));
  };

  const handleLoadAuditLogs = async () => {
    setShowAuditHistory((prev) => !prev);
    if (collaborator?.id) {
      const logs = await getPermissionAuditLogs(collaborator.id);
      setAuditLogs(logs);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('El nombre completo y el correo electrónico son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const savedId = await saveCollaborator(
        {
          fullName: fullName.trim(),
          username: username.trim() || email.trim().split('@')[0],
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          photoUrl: photoUrl.trim(),
          bio: bio.trim(),
          status,
          invitationCode: invitationCode.trim(),
          permissions,
          customBenefits,
          createdAt: collaborator?.createdAt,
          approvedAt: collaborator?.approvedAt
        },
        collaborator?.id
      );

      // Log every modified permission in PermissionAuditLog
      for (const diff of modifiedPermissions) {
        await logPermissionAudit({
          collaboratorId: savedId,
          collaboratorName: fullName.trim(),
          collaboratorEmail: email.trim().toLowerCase(),
          changedBy: 'Julian Camilo (Propietario)',
          permissionKey: diff.key,
          permissionLabel: diff.label,
          previousValue: diff.previousValue,
          newValue: diff.newValue
        });
      }

      onSaved(
        isNew
          ? `Colaborador ${fullName.trim()} creado con ${Object.values(permissions).filter(Boolean).length} permisos activos.`
          : `Permisos y perfil de ${fullName.trim()} actualizados (${modifiedPermissions.length} cambio(s) registrado(s)).`
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar la configuración del colaborador.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = COLLABORATOR_PERMISSIONS_CATALOG.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (permSearch.trim()) {
      const q = permSearch.toLowerCase();
      return (
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#fcfbf9] dark:bg-[#141417] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#121212] text-white px-6 py-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white">
                {isNew ? 'Crear Nuevo Colaborador' : `Administrar Colaborador: ${collaborator.fullName}`}
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                Configura perfil, matriz individual de permisos (SÍ / NO) y beneficios especiales
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isNew && (
              <button
                type="button"
                onClick={handleLoadAuditLogs}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-stone-200 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-gold-400" />
                <span>Historial</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto font-sans">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Optional Audit History Drawer */}
          {showAuditHistory && (
            <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Auditoría de Cambios de Permisos
              </h4>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-stone-500">No hay cambios de permisos registrados aún.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-stone-200 dark:divide-stone-800 text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {log.permissionLabel}
                        </span>
                        <span className="text-stone-500 ml-2">
                          ({log.previousValue ? 'SÍ' : 'NO'} → {log.newValue ? 'SÍ' : 'NO'})
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {new Date(log.timestamp).toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1. Profile & Account Status */}
          <section className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
              1. Datos de la Cuenta del Colaborador
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. maria_gomez"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Estado de la cuenta
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white font-semibold"
                >
                  <option value="activo">● Activo</option>
                  <option value="suspendido">▲ Suspendido</option>
                  <option value="inactivo">○ Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  URL Foto de Perfil (Opcional)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Biografía editorial breve
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Columnista y analista..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* 2. Individual SÍ/NO Permissions Matrix */}
          <section className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                  2. Matriz Individual de Permisos (SÍ / NO)
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Activa o desactiva cada permiso de forma independiente. La Categoría F está bloqueada para proteger la seguridad del propietario.
                </p>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Buscar permiso por nombre o descripción..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-5">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white font-semibold"
                >
                  <option value="ALL">Todas las categorías (A - F)</option>
                  {PERMISSION_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEnableAllAllowed}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold cursor-pointer hover:bg-emerald-100"
              >
                Activar todos los permisos permitidos
              </button>
              <button
                type="button"
                onClick={handleDisableAll}
                className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] font-bold cursor-pointer hover:bg-rose-100"
              >
                Desactivar todos
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-bold cursor-pointer hover:bg-stone-200"
              >
                Restaurar configuración predeterminada
              </button>
            </div>

            {/* Permissions List */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
              {filteredPermissions.map((perm) => {
                const isOwnerLocked = Boolean(perm.ownerOnly);
                const isEnabled = !isOwnerLocked && Boolean(permissions[perm.key]);
                const isChanged = !isOwnerLocked && Boolean(initialPerms[perm.key]) !== isEnabled;

                return (
                  <div
                    key={perm.key}
                    className={`p-3.5 flex items-center justify-between gap-4 ${
                      isOwnerLocked
                        ? 'bg-stone-100/80 dark:bg-stone-900/60 opacity-80'
                        : isChanged
                        ? 'bg-amber-50/40 dark:bg-amber-950/15'
                        : 'bg-white dark:bg-[#18181c]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          Cat. {perm.category}
                        </span>
                        <span className="text-xs font-bold text-stone-900 dark:text-white">
                          {perm.label}
                        </span>
                        {isChanged && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            • Modificado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {perm.description}
                      </p>
                    </div>

                    {isOwnerLocked ? (
                      <span
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-bold shrink-0"
                        title="Los permisos de administración crítica nunca pueden otorgarse a colaboradores."
                      >
                        <Lock className="w-3 h-3" />
                        <span>Reservado al propietario</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => togglePermission(perm.key, perm.ownerOnly)}
                        aria-pressed={isEnabled}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider transition-all shrink-0 cursor-pointer inline-flex items-center space-x-1.5 ${
                          isEnabled
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {isEnabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{isEnabled ? 'SÍ' : 'NO'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Category G: Custom Special Benefits */}
          <section className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>3. Categoría G: Beneficios Especiales Personalizados</span>
            </h3>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CUSTOM_BENEFITS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddBenefit(preset.name, preset.description)}
                  className="px-2.5 py-1 rounded-lg bg-gold-50 dark:bg-gold-950/30 border border-gold-200 dark:border-gold-800 text-gold-800 dark:text-gold-300 text-[11px] font-semibold hover:bg-gold-100 cursor-pointer"
                >
                  + {preset.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={newBenefitName}
                onChange={(e) => setNewBenefitName(e.target.value)}
                placeholder="Nombre del beneficio personalizado..."
                className="sm:col-span-5 px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
              <input
                type="text"
                value={newBenefitDesc}
                onChange={(e) => setNewBenefitDesc(e.target.value)}
                placeholder="Descripción breve..."
                className="sm:col-span-5 px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddBenefit(newBenefitName, newBenefitDesc)}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-stone-900 dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold inline-flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {customBenefits.length > 0 && (
              <div className="space-y-2">
                {customBenefits.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">{b.name}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">{b.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(b.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Pre-Save Summary of Modified Permissions */}
          {modifiedPermissions.length > 0 && (
            <section className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Resumen de permisos modificados antes de guardar ({modifiedPermissions.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {modifiedPermissions.map((m) => (
                  <div
                    key={m.key}
                    className="flex items-center justify-between bg-white/80 dark:bg-stone-900/80 px-3 py-1.5 rounded-lg border border-amber-200/70 dark:border-amber-800/50"
                  >
                    <span className="font-semibold text-stone-800 dark:text-stone-200 truncate pr-2">
                      {m.label}
                    </span>
                    <span className="font-mono font-bold shrink-0">
                      <span className="text-stone-400">{m.previousValue ? 'SÍ' : 'NO'}</span> →{' '}
                      <span className={m.newValue ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.newValue ? 'SÍ' : 'NO'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
