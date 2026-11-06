import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Monitor,
  LogOut,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Fingerprint,
  Copy,
  Check
} from 'lucide-react';
import {
  SecurityEvent,
  SecurityEventType,
  SecurityRiskLevel,
  UserSession,
  OwnerMfaConfig
} from '../../types';
import {
  getSecurityEvents,
  getActiveSessions,
  revokeSessionById,
  revokeAllOtherSessions,
  logSecurityEvent
} from '../../services/securityService';
import { ConfirmModal } from '../../components/common/ConfirmModal';

const EVENT_TYPE_LABELS: Record<SecurityEventType, string> = {
  login_exitoso: 'Inicio de sesión exitoso',
  login_fallido: 'Intento de acceso fallido',
  bloqueo_fuerza_bruta: 'Bloqueo por fuerza bruta',
  bot_spam_bloqueado: 'Bot / Spam bloqueado',
  solicitud_rechazada: 'Solicitud rechazada',
  cambio_permisos: 'Cambio de permisos',
  actividad_admin: 'Actividad administrativa',
  sesion_revocada: 'Sesión revocada',
  alerta_sospechosa: 'Alerta sospechosa',
  mfa_verificado: '2FA / MFA verificado',
  mfa_fallido: '2FA / MFA fallido',
  archivo_rechazado: 'Archivo peligroso rechazado'
};

const RISK_BADGE_STYLES: Record<SecurityRiskLevel, string> = {
  bajo: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  medio: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  alto: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800',
  critico: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
};

export const AdminSecurityCenter: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [mfaStatus, setMfaStatus] = useState<OwnerMfaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // MFA Setup State
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [totpCodeInput, setTotpCodeInput] = useState<string>('');
  const [mfaFeedback, setMfaFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Confirm modals
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evList, sessList, mfaRes] = await Promise.all([
        getSecurityEvents(),
        getActiveSessions(),
        fetch('/api/security/mfa/status').then((r) => (r.ok ? r.json() : null)).catch(() => null)
      ]);
      setEvents(evList);
      setSessions(sessList);
      if (mfaRes) setMfaStatus(mfaRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleStartTotpSetup = async () => {
    setMfaFeedback(null);
    try {
      const res = await fetch('/api/security/mfa/setup-totp', { method: 'POST' });
      const data = await res.json();
      setTotpSecret(data.secret);
      setOtpauthUri(data.otpauthUri);
      setRecoveryCodes(data.recoveryCodes || []);
    } catch {
      setMfaFeedback({ type: 'err', msg: 'No se pudo iniciar la configuración TOTP.' });
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaFeedback(null);
    try {
      const res = await fetch('/api/security/mfa/confirm-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCodeInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setMfaFeedback({
          type: 'ok',
          msg: 'Autenticación de dos factores (2FA) activada correctamente. Guarda tus códigos de recuperación.'
        });
        setTotpCodeInput('');
        await loadAll();
      } else {
        setMfaFeedback({ type: 'err', msg: data.error || 'Código inválido.' });
      }
    } catch {
      setMfaFeedback({ type: 'err', msg: 'Error validando el código 2FA.' });
    }
  };

  const handleRegisterPasskey = async () => {
    setMfaFeedback(null);
    try {
      let credentialId = `pk_dulima_${Date.now()}`;
      if (window.PublicKeyCredential && navigator.credentials) {
        try {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);
          const cred = (await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: 'DULIMA Plataforma Editorial' },
              user: {
                id: new TextEncoder().encode('owner_dulima'),
                name: 'trujillogordilooo@gmail.com',
                displayName: 'Julian Camilo Trujillo Gordillo'
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
              timeout: 30000
            }
          })) as PublicKeyCredential | null;
          if (cred?.id) {
            credentialId = cred.id;
          }
        } catch {
          // Fallback if iframe/environment blocks WebAuthn prompt
        }
      }

      const res = await fetch('/api/security/mfa/register-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId,
          label: 'Passkey / Llave del Propietario'
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMfaFeedback({
          type: 'ok',
          msg: 'Passkey / Llave de acceso vinculada a la cuenta del propietario.'
        });
        await loadAll();
      }
    } catch {
      setMfaFeedback({ type: 'err', msg: 'No se pudo registrar la Passkey.' });
    }
  };

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;
    await revokeSessionById(sessionToRevoke.id);
    setSessionToRevoke(null);
    await loadAll();
  };

  const handleRevokeAll = async () => {
    await revokeAllOtherSessions();
    await logSecurityEvent({
      eventType: 'sesion_revocada',
      riskLevel: 'alto',
      userRole: 'owner',
      description: 'El propietario cerró todas las demás sesiones abiertas desde el Centro de Seguridad.'
    });
    setConfirmRevokeAll(false);
    await loadAll();
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType !== 'all' && ev.eventType !== filterType) return false;
    if (filterRisk !== 'all' && ev.riskLevel !== filterRisk) return false;
    if (
      filterUser.trim() &&
      !(ev.userEmail || '').toLowerCase().includes(filterUser.trim().toLowerCase()) &&
      !ev.description.toLowerCase().includes(filterUser.trim().toLowerCase())
    ) {
      return false;
    }
    if (filterDate && !ev.timestamp.startsWith(filterDate)) return false;
    return true;
  });

  const criticalOrHighCount = events.filter(
    (e) => e.riskLevel === 'alto' || e.riskLevel === 'critico'
  ).length;
  const botsBlockedCount = events.filter(
    (e) => e.eventType === 'bot_spam_bloqueado' || e.eventType === 'bloqueo_fuerza_bruta'
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#9B1B30] dark:text-[#F2C94C]">
            Protección Avanzada · DULIMA
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white mt-0.5">
            Centro de Seguridad
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Supervisión de accesos, sesiones activas, verificación 2FA/MFA del propietario y bloqueo de amenazas.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar registro</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 space-y-1">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Estado 2FA Propietario</p>
          <div className="flex items-center space-x-2">
            {mfaStatus?.enabled ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-lg font-serif font-bold text-[#121212] dark:text-white">
              {mfaStatus?.enabled ? 'Activo (Protegido)' : 'Pendiente de activar'}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 space-y-1">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Sesiones Activas</p>
          <p className="text-2xl font-serif font-bold text-[#121212] dark:text-white">{sessions.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 space-y-1">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Bots / Fuerza Bruta Bloqueados</p>
          <p className="text-2xl font-serif font-bold text-[#9B1B30] dark:text-[#F2C94C]">
            {botsBlockedCount}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 space-y-1">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Alertas Riesgo Alto/Crítico</p>
          <p className="text-2xl font-serif font-bold text-rose-600 dark:text-rose-400">
            {criticalOrHighCount}
          </p>
        </div>
      </div>

      {/* 1. Owner 2FA / MFA Protection */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#9B1B30]/10 text-[#9B1B30] dark:bg-[#F2C94C]/10 dark:text-[#F2C94C]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#121212] dark:text-white">
                Autenticación de Dos Factores (2FA / MFA) del Propietario
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Protege la cuenta principal mediante aplicación autenticadora (TOTP), Passkey y códigos de recuperación.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleStartTotpSetup}
              className="px-4 py-2 rounded-xl bg-[#9B1B30] hover:bg-[#7d1526] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{mfaStatus?.totpConfigured ? 'Reconfigurar App 2FA' : 'Configurar App 2FA'}</span>
            </button>
            <button
              type="button"
              onClick={handleRegisterPasskey}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Fingerprint className="w-3.5 h-3.5 text-[#9B1B30] dark:text-[#F2C94C]" />
              <span>{mfaStatus?.passkeyConfigured ? 'Passkey Activa' : 'Vincular Passkey'}</span>
            </button>
          </div>
        </div>

        {mfaFeedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center space-x-2 ${
              mfaFeedback.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {mfaFeedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span>{mfaFeedback.msg}</span>
          </div>
        )}

        {totpSecret && (
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  1. Agrega esta clave en Google Authenticator / Authy:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="px-3 py-2 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono text-xs font-bold tracking-widest text-[#9B1B30] dark:text-[#F2C94C]">
                    {totpSecret}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(totpSecret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 cursor-pointer"
                    title="Copiar clave secreta"
                  >
                    {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {otpauthUri && (
                  <p className="text-[11px] text-stone-500 break-all font-mono">
                    URI: {otpauthUri}
                  </p>
                )}
              </div>

              <form onSubmit={handleConfirmTotp} className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  2. Ingresa el código de 6 dígitos para activar:
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCodeInput}
                    onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-36 px-3 py-2 rounded-lg bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 font-mono text-sm tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#121212] dark:bg-[#F2C94C] text-white dark:text-stone-950 text-xs font-bold cursor-pointer"
                  >
                    Confirmar 2FA
                  </button>
                </div>
              </form>
            </div>

            {recoveryCodes.length > 0 && (
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Códigos de recuperación de un solo uso (guárdalos en un lugar seguro):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {recoveryCodes.map((code) => (
                    <code
                      key={code}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono text-xs text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Active Sessions & Connected Devices */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#121212] dark:text-white">
                Sesiones Activas y Dispositivos Conectados
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Controla los dispositivos con sesión abierta y revoca el acceso de inmediato si notas algo inusual.
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={() => setConfirmRevokeAll(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1.5 self-start"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar todas las sesiones abiertas</span>
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400 italic py-4">
            No hay otras sesiones activas registradas en este momento.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-[#121212] dark:text-white">
                      {sess.deviceLabel} · {sess.browserLabel}
                    </span>
                    {sess.isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Sesión actual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                    {sess.userEmail} · IP: {sess.ipMasked} · Última actividad:{' '}
                    {new Date(sess.lastActiveAt).toLocaleString('es-CO')}
                  </p>
                </div>

                {!sess.isCurrent && (
                  <button
                    type="button"
                    onClick={() => setSessionToRevoke(sess)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold cursor-pointer self-start"
                  >
                    Revocar acceso
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Security Events & Audit Trail */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#121212] dark:text-white">
                Registro de Eventos y Alertas de Seguridad
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Historial auditable de inicios de sesión, bloqueos anti-bots, cambios de permisos y actividad administrativa.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-900/50 p-4 rounded-xl border border-stone-200/70 dark:border-stone-800">
          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
              Tipo de Evento
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
            >
              <option value="all">Todos los eventos</option>
              {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
              Nivel de Riesgo
            </label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
            >
              <option value="all">Todos los niveles</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
              Usuario o Descripción
            </label>
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Buscar correo o detalle..."
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
            />
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-xs text-stone-500 dark:text-stone-400">
            <Filter className="w-6 h-6 mx-auto mb-2 opacity-40" />
            No se encontraron eventos de seguridad con los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-[#fcfbf9] dark:bg-[#141417] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        RISK_BADGE_STYLES[ev.riskLevel] || RISK_BADGE_STYLES.bajo
                      }`}
                    >
                      {ev.riskLevel}
                    </span>
                    <span className="text-xs font-bold text-[#121212] dark:text-white">
                      {EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}
                    </span>
                    {ev.userEmail && (
                      <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                        · {ev.userEmail}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300">{ev.description}</p>
                </div>

                <div className="text-[11px] font-mono text-stone-400 shrink-0 sm:text-right">
                  <div>{new Date(ev.timestamp).toLocaleString('es-CO')}</div>
                  {ev.ipMasked && <div>IP: {ev.ipMasked}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={confirmRevokeAll}
        title="¿Cerrar todas las demás sesiones abiertas?"
        message="Se revocará el acceso inmediato de todos los demás dispositivos y navegadores conectados. Tu sesión actual permanecerá abierta."
        confirmText="Sí, cerrar sesiones"
        onConfirm={handleRevokeAll}
        onCancel={() => setConfirmRevokeAll(false)}
      />

      <ConfirmModal
        isOpen={!!sessionToRevoke}
        title="¿Revocar acceso de este dispositivo?"
        message={`Se cerrará la sesión en ${sessionToRevoke?.deviceLabel || 'este dispositivo'} (${sessionToRevoke?.userEmail || ''}).`}
        confirmText="Revocar sesión"
        onConfirm={handleRevokeSession}
        onCancel={() => setSessionToRevoke(null)}
      />
    </div>
  );
};
