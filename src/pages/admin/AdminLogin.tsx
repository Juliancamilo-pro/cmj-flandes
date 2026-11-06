import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  Mail, 
  Key, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { registerActiveSession } from '../../services/securityService';
import { DulimaLogo } from '../../components/common/DulimaLogo';

interface AdminLoginProps {
  onBackToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToPublic }) => {
  const { loginWithGoogle, loginWithPassword, loginWithCode, ownerEmail } = useAuth();
  
  const [accessCode, setAccessCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const checkBruteForce = async (targetEmail: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/security/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Acceso bloqueado temporalmente por seguridad.');
        return false;
      }
    } catch {}
    return true;
  };

  const reportLoginAttempt = async (targetEmail: string, success: boolean) => {
    try {
      await fetch('/api/security/login-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, success, role: 'owner' })
      });
    } catch {}
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!accessCode.trim()) {
      setErrorMessage('Por favor ingresa el código de acceso.');
      return;
    }

    const allowed = await checkBruteForce(ownerEmail);
    if (!allowed) return;

    const success = loginWithCode(accessCode.trim());
    await reportLoginAttempt(ownerEmail, success);
    if (success) {
      await registerActiveSession(ownerEmail, 'owner');
    } else {
      setErrorMessage('Código de acceso incorrecto. Verifica el código e intenta nuevamente.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      await reportLoginAttempt(ownerEmail, true);
      await registerActiveSession(ownerEmail, 'owner');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      await reportLoginAttempt(ownerEmail, false);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('La ventana de inicio de sesión fue cerrada antes de completar.');
      } else {
        setErrorMessage(err.message || 'Error al autenticar con Google. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const allowed = await checkBruteForce(email.trim());
    if (!allowed) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithPassword(email.trim(), password);
      await reportLoginAttempt(email.trim(), true);
      await registerActiveSession(email.trim(), 'owner');
    } catch (err: any) {
      console.error('Password sign in error:', err);
      await reportLoginAttempt(email.trim(), false);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Credenciales incorrectas o usuario no registrado con contraseña. Puedes usar el Código de Acceso del Autor.');
      } else {
        setErrorMessage(err.message || 'Error al iniciar sesión con contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top back button */}
      <div className="max-w-md w-full mx-auto">
        <button
          onClick={onBackToPublic}
          className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold text-stone-400 hover:text-gold-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al portal público</span>
        </button>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full mx-auto bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <DulimaLogo variant="compact" tone="light" />
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white uppercase tracking-tight pt-1">
            Acceso Editorial
          </h2>
          <p className="text-xs text-stone-400 font-sans tracking-wide">
            Panel Privado de Administración — DULIMA
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs p-3.5 rounded-xl flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Direct Access with Author Code (111965400) */}
        <form onSubmit={handleCodeLogin} className="p-4 bg-[#222222] border-2 border-gold-500/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gold-400 uppercase tracking-wider font-sans">
              Código de Acceso del Autor
            </label>
            <span className="text-[10px] text-stone-400 font-mono">PIN</span>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 text-gold-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Ingresa tu código de acceso..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#121212] border border-stone-700 rounded-lg text-white font-mono tracking-widest focus:outline-none focus:border-gold-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-gold-500 hover:bg-gold-400 text-stone-950 font-sans text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-md"
          >
            Entrar con Código
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#333]"></div>
          <span className="flex-shrink mx-4 text-[11px] text-stone-500 uppercase tracking-widest font-sans">
            O mediante cuenta
          </span>
          <div className="flex-grow border-t border-[#333]"></div>
        </div>

        {/* Alternative: Google and Email Login */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-sans text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-3 shadow-md disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Verificando...' : 'Acceder con Google (Recomendado)'}</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#333]"></div>
            <span className="flex-shrink mx-4 text-[11px] text-stone-500 uppercase tracking-widest font-sans">
              O con correo y contraseña
            </span>
            <div className="flex-grow border-t border-[#333]"></div>
          </div>

          {/* Email / Password login */}
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="autor@juliancamilo.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#121212] border border-[#333] rounded-lg text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#121212] border border-[#333] rounded-lg text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gold-600 hover:bg-gold-500 text-stone-950 font-sans text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        {/* Security & Access Information */}
        <div className="pt-4 border-t border-[#2e2e2e] space-y-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center space-x-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors w-full justify-center"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo configurar la cuenta autorizada?</span>
          </button>

          {showGuide && (
            <div className="p-3 bg-[#141414] border border-[#333] rounded-lg text-[11px] text-stone-400 space-y-1.5 leading-relaxed animate-in fade-in">
              <p className="font-semibold text-stone-200">Seguridad estricta y autorización:</p>
              <p>
                • No se permite registro público de visitantes.
              </p>
              <p>
                • El propietario autorizado configurado en el sistema es <span className="text-gold-300 font-mono">{ownerEmail}</span>.
              </p>
              <p>
                • Inicia sesión directamente con ese correo en "Acceder con Google" para obtener acceso inmediato al panel de administración.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center text-xs text-stone-600 font-sans">
        DULIMA • Sistema Editorial Protegido por Firebase Auth, 2FA & Firestore Rules
      </div>
    </div>
  );
};
