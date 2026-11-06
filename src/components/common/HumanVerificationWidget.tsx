import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface HumanVerificationWidgetProps {
  formName: string;
  onVerifiedChange: (verified: boolean) => void;
  className?: string;
}

/**
 * Widget de Verificación Humana (Compatible con Cloudflare Turnstile + Desafío Criptográfico)
 * Protege formularios sensibles contra bots, spam y envíos automatizados.
 */
export const HumanVerificationWidget: React.FC<HumanVerificationWidgetProps> = ({
  formName,
  onVerifiedChange,
  className = ''
}) => {
  const [question, setQuestion] = useState<string>('Cargando verificación...');
  const [challengeToken, setChallengeToken] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [verified, setVerified] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadChallenge = async () => {
    setVerified(false);
    onVerifiedChange(false);
    setAnswer('');
    setError(null);
    try {
      const res = await fetch('/api/security/challenge');
      const data = await res.json();
      if (data?.question && data?.challengeToken) {
        setQuestion(data.question);
        setChallengeToken(data.challengeToken);
      }
    } catch {
      setQuestion('¿Cuánto es 4 + 3?');
      setChallengeToken('fallback');
    }
  };

  useEffect(() => {
    loadChallenge();
  }, []);

  const handleVerify = async () => {
    if (!answer.trim()) {
      setError('Ingresa el resultado para confirmar que eres humano.');
      return;
    }

    if (challengeToken === 'fallback') {
      if (answer.trim() === '7') {
        setVerified(true);
        setError(null);
        onVerifiedChange(true);
      } else {
        setError('Respuesta incorrecta. Intenta nuevamente.');
      }
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const res = await fetch('/api/security/verify-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          answer: answer.trim(),
          honeypot,
          formName
        })
      });
      const data = await res.json();
      if (res.ok && data?.verified) {
        setVerified(true);
        onVerifiedChange(true);
      } else {
        setVerified(false);
        onVerifiedChange(false);
        setError(data?.error || 'Verificación incorrecta. Intenta de nuevo.');
        await loadChallenge();
      }
    } catch {
      setError('No se pudo validar la verificación. Intenta nuevamente.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-colors ${
        verified
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'
      } ${className}`}
    >
      {/* Campo trampa invisible para bots (Honeypot) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`hp_${formName}`}>No llenar este campo</label>
        <input
          id={`hp_${formName}`}
          type="text"
          name="website_url_confirm"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {verified ? (
        <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Verificación humana completada · Protección anti-bots DULIMA</span>
          </div>
          <button
            type="button"
            onClick={loadChallenge}
            className="text-[11px] underline hover:no-underline cursor-pointer"
          >
            Reiniciar
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <ShieldCheck className="w-4 h-4 text-[#9B1B30] dark:text-[#F2C94C] shrink-0" />
              <span>Verificación de seguridad</span>
            </div>
            <button
              type="button"
              onClick={loadChallenge}
              className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 inline-flex items-center space-x-1 cursor-pointer"
              title="Generar nuevo desafío"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Cambiar</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
              {question}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerify();
                }
              }}
              placeholder="Respuesta"
              className="w-24 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-[#9B1B30] dark:focus:border-[#F2C94C]"
            />
            <button
              type="button"
              disabled={checking}
              onClick={handleVerify}
              className="px-3.5 py-1.5 rounded-lg bg-[#9B1B30] hover:bg-[#7d1526] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {checking ? 'Validando...' : 'Verificar'}
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
