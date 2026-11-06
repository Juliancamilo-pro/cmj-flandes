import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { subscribeNewsletter } from '../../services/db';

interface NewsletterProps {
  variant?: 'article' | 'footer';
  className?: string;
}

export const Newsletter: React.FC<NewsletterProps> = ({ variant = 'article', className = '' }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setSubmitting(true);
    try {
      await subscribeNewsletter(email.trim());
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error('Newsletter subscription error:', err);
      setError('No fue posible registrar tu suscripción en este momento. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. FOOTER VARIANT (Dark theme)
  if (variant === 'footer') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-gold-400 text-xs font-semibold uppercase tracking-wider font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Boletín Editorial</span>
          </div>
          <h4 className="text-base font-serif font-bold text-white">
            Suscríbete a las lecturas
          </h4>
          <p className="text-xs text-stone-400 font-sans leading-relaxed">
            Recibe en tu correo cada nuevo análisis, columna y ensayo de Julian Camilo. Sin spam.
          </p>
        </div>

        {success ? (
          <div className="flex items-start space-x-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>¡Suscripción confirmada! Te notificaremos con cada nueva publicación.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full pl-9 pr-24 py-2.5 text-xs bg-[#1a1a1a] border border-[#333] rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              />
              <button
                type="submit"
                disabled={submitting}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-gold-600 hover:bg-gold-500 text-stone-950 font-sans text-xs font-bold transition-all disabled:opacity-50"
              >
                {submitting ? '...' : 'Suscribir'}
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </p>
            )}
          </form>
        )}
      </div>
    );
  }

  // 2. ARTICLE VARIANT (Editorial framed card for article detail)
  return (
    <section className={`bg-[#fdfcf9] dark:bg-[#1b1a18] border-2 border-gold-500/40 dark:border-gold-500/30 rounded-2xl p-6 sm:p-10 shadow-sm relative overflow-hidden ${className}`}>
      {/* Decorative subtle gold accent in corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-2xl mx-auto text-center space-y-4 relative z-10">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gold-50 dark:bg-stone-800 border border-gold-200 dark:border-stone-700 flex items-center justify-center text-gold-700 dark:text-gold-400 shadow-xs">
          <Mail className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-widest text-gold-700 dark:text-gold-400 font-bold font-sans">
            Boletín Editorial
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] dark:text-[#f3ede2]">
            Ideas que merecen ser leídas, directo a tu bandeja
          </h3>
          <p className="text-stone-600 dark:text-stone-300 text-sm font-sans max-w-lg mx-auto leading-relaxed">
            Acompaña las reflexiones de Julian Camilo sobre política, sociedad y cultura. Recibe cada nuevo ensayo sin algoritmos de por medio.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm p-4 rounded-xl flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">
              ¡Gracias por suscribirte! Tu correo ha sido registrado con éxito.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingresa tu correo electrónico..."
                  required
                  className="w-full pl-10 pr-3.5 py-3 text-sm border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-[#121212] dark:bg-gold-500 dark:text-stone-950 text-white hover:bg-gold-700 dark:hover:bg-gold-600 font-sans text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 inline-flex items-center justify-center space-x-2 shadow-sm cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-gold-400 dark:text-stone-950" />
                <span>{submitting ? 'Registrando...' : 'Suscribirme'}</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center justify-center space-x-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-sans">
              Privacidad garantizada. Podrás darte de baja en cualquier momento.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};
