import React, { useEffect, useState } from 'react';
import { X, Shield, KeyRound, UserPlus, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cmjApi } from '../../services/cmjApi';
import { useCmjAuth } from '../../context/CmjAuthContext';
import { PRINCIPAL_ADMIN_EMAIL } from '../../constants/cmj';

interface CmjAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthTab = 'login' | 'activate' | 'init_admin';

export const CmjAuthModal: React.FC<CmjAuthModalProps> = ({ open, onClose, onSuccess }) => {
  const { setAuthenticatedSession } = useCmjAuth();
  const [tab, setTab] = useState<AuthTab>('login');
  const [adminInitialized, setAdminInitialized] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaStep, setMfaStep] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMfaStep(false);
    setTotpCode('');
    cmjApi
      .getBootstrapStatus()
      .then((res) => {
        setAdminInitialized(res.adminInitialized);
        if (!res.adminInitialized) {
          setTab('init_admin');
          setEmail(PRINCIPAL_ADMIN_EMAIL);
        } else {
          setTab('login');
        }
      })
      .catch(() => {
        setAdminInitialized(true);
      });
  }, [open]);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await cmjApi.login(email, password, mfaStep ? totpCode : undefined);
      if (res.mfaRequired) {
        setMfaStep(true);
        setLoading(false);
        return;
      }
      if (res.ok && res.token && res.user && res.permissions) {
        setAuthenticatedSession(res.token, res.user, res.permissions);
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError('La contraseña debe tener al menos 10 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const res = await cmjApi.initializeAdmin(email, password);
      if (res.ok && res.token && res.user && res.permissions) {
        setAuthenticatedSession(res.token, res.user, res.permissions);
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo inicializar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError('La contraseña debe tener al menos 10 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const res = await cmjApi.activateInvite(email, inviteCode, password);
      if (res.ok && res.token && res.user && res.permissions) {
        setAuthenticatedSession(res.token, res.user, res.permissions);
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo activar la invitación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tolima-ribbon">
          <div className="tolima-vinotinto" />
          <div className="tolima-gold" />
        </div>

        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 flex items-center justify-center text-[#8c162a] dark:text-[#f2c94c]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-stone-900 dark:text-stone-100">
                Acceso Institucional CMJ
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Consejo Municipal de Juventud Flandes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-stone-200 dark:border-stone-800">
          {!adminInitialized && (
            <button
              type="button"
              onClick={() => {
                setTab('init_admin');
                setError(null);
              }}
              className={`pb-2.5 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                tab === 'init_admin'
                  ? 'border-[#8c162a] dark:border-[#f2c94c] text-[#8c162a] dark:text-[#f2c94c]'
                  : 'border-transparent text-stone-500'
              }`}
            >
              Configurar Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`pb-2.5 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-[#8c162a] dark:border-[#f2c94c] text-[#8c162a] dark:text-[#f2c94c]'
                : 'border-transparent text-stone-500'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('activate');
              setError(null);
            }}
            className={`pb-2.5 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              tab === 'activate'
                ? 'border-[#8c162a] dark:border-[#f2c94c] text-[#8c162a] dark:text-[#f2c94c]'
                : 'border-transparent text-stone-500'
            }`}
          >
            Activar Invitación
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'init_admin' && !adminInitialized && (
            <form onSubmit={handleInitializeAdmin} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
                <strong>Primer ingreso del Administrador Principal:</strong> Configura una contraseña privada (mínimo 10 caracteres) para la cuenta oficial del Secretario.
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Correo Oficial
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Contraseña Privada (mín. 10 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-dulima-primary py-3 justify-center"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Configurando...' : 'Guardar Contraseña y Entrar'}</span>
              </button>
            </form>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Correo Institucional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>

              {mfaStep && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 mb-1">
                    Código 2FA (6 dígitos) o Código de Recuperación
                  </label>
                  <input
                    type="text"
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full px-3.5 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-stone-900 text-sm font-mono tracking-widest"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-dulima-primary py-3 justify-center"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Verificando...' : mfaStep ? 'Verificar 2FA y Entrar' : 'Ingresar'}</span>
              </button>
            </form>
          )}

          {tab === 'activate' && (
            <form onSubmit={handleActivateInvite} className="space-y-4">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Si el Administrador Principal te registró como consejero o integrante, ingresa tu correo y el código único de activación.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Correo Registrado
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Código de Invitación
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Nueva Contraseña (mín. 10 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-dulima-primary py-3 justify-center"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Activando...' : 'Activar Cuenta'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
