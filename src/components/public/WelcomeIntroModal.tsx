import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Check, ShieldCheck, Zap, BookOpen, CreditCard, ChevronRight } from 'lucide-react';
import { useLightReading } from '../../context/LightReadingContext';
import { DulimaLogo } from '../common/DulimaLogo';

interface WelcomeIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export const WELCOME_INTRO_STORAGE_KEY = 'dulima_welcome_intro_seen_v1';

export const WelcomeIntroModal: React.FC<WelcomeIntroModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection
}) => {
  const { isLightReading } = useLightReading();
  const [timeLeft, setTimeLeft] = useState(20);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const updatesHighlights = [
    {
      icon: Sparkles,
      title: 'Renovación Editorial: Bienvenidos a DULIMA',
      description: 'La voz del territorio. El poder de las ideas. Medio digital independiente con identidad tolimense y vocación nacional e internacional.',
      tag: 'Identidad DULIMA'
    },
    {
      icon: BookOpen,
      title: 'Editor en Bloques & Transcripción de Audio',
      description: '13 formatos periodísticos, índice automático, notas al pie, fuentes documentales y dictado de audio con inteligencia artificial.',
      tag: 'Redacción Avanzada'
    },
    {
      icon: ShieldCheck,
      title: 'Centro de Seguridad & Protección 2FA',
      description: 'Verificación humana anti-bots, autenticación de dos factores para el propietario, control de sesiones y copias de seguridad.',
      tag: 'Ciberseguridad'
    },
    {
      icon: CreditCard,
      title: 'Planes Premium & Donaciones Bre-B / QR',
      description: '4 planes flexibles desde $5.000 COP y aportes directos con Nequi, Daviplata y Llave Bre-B sin intermediarios.',
      tag: 'Comunidad'
    }
  ];

  // 20 seconds auto-dismiss countdown
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(20);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    // Auto rotate slides every 4.5 seconds
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % updatesHighlights.length);
    }, 4500);

    // Escape key listener to skip immediately
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      clearInterval(slideTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && timeLeft === 0) {
      handleDismiss();
    }
  }, [isOpen, timeLeft]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(WELCOME_INTRO_STORAGE_KEY, 'true');
      } catch {}
    }
    onClose();
  };

  const handleEnterSite = () => {
    handleDismiss();
  };

  const handleSelectFeature = (index: number) => {
    setActiveSlide(index);
    if (onNavigateToSection) {
      if (index === 1) onNavigateToSection('premium');
      else if (index === 3) onNavigateToSection('donations');
      else onNavigateToSection('actualizaciones');
      handleDismiss();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenido a DULIMA"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300"
    >
      <div className="bg-white dark:bg-[#151518] text-[#121212] dark:text-[#f3ede2] max-w-2xl w-full rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden relative my-auto">
        {/* Tolima Vinotinto & Oro + Colombian Flag Top Ribbon */}
        <div className="relative h-2.5 w-full flex overflow-hidden">
          <div className="bg-[#9B1B30] h-full flex-[2]" />
          <div className="bg-[#F2C94C] h-full flex-1" />
          <div className="bg-[#fcd116] h-full flex-1" />
          <div className="bg-[#003893] h-full flex-[0.5]" />
          <div className="bg-[#ce1126] h-full flex-[0.5]" />
        </div>

        {/* 20-second Countdown Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-stone-900 h-1">
          <div
            className="h-full bg-gradient-to-r from-[#9B1B30] to-[#F2C94C] transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 20) * 100}%` }}
          />
        </div>

        {/* Close / Skip button in top corner */}
        <button
          onClick={handleDismiss}
          className="absolute top-6 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
          aria-label="Omitir presentación"
          title="Omitir introducción (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-9 space-y-6">
          {/* Platform Title & Slogan */}
          <div className="flex flex-col items-center text-center space-y-3 max-w-xl mx-auto pt-1">
            <DulimaLogo variant="horizontal" showSlogan={false} />

            <div className="h-0.5 w-16 bg-[#9B1B30] dark:bg-[#F2C94C] mx-auto rounded-full" />

            <p className="font-serif italic text-base sm:text-xl text-stone-700 dark:text-stone-300 leading-snug px-2">
              "La voz del territorio. El poder de las ideas."
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Medio digital independiente con identidad tolimense · Dirigido por Julian Camilo Trujillo Gordillo
            </p>
          </div>

          {/* Interactive Presentation of Latest Innovations */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
                Últimas Novedades de la Plataforma:
              </span>
              <span className="text-[11px] text-stone-400 font-sans">
                {activeSlide + 1} de {updatesHighlights.length}
              </span>
            </div>

            {/* Active Highlight Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 shadow-xs transition-all flex items-start space-x-4">
              {(() => {
                const Item = updatesHighlights[activeSlide];
                const IconComponent = Item.icon;
                return (
                  <>
                    <div className="p-3 rounded-2xl bg-amber-100 dark:bg-stone-800 text-gold-900 dark:text-gold-300 shrink-0">
                      <IconComponent className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full bg-gold-100 dark:bg-stone-800 text-gold-900 dark:text-gold-300 text-[10px] font-bold font-sans">
                          {Item.tag}
                        </span>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                          {Item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
                        {Item.description}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Slider Dots */}
            <div className="flex justify-center items-center space-x-1.5 pt-1">
              {updatesHighlights.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeSlide === i ? 'w-6 bg-gold-500' : 'w-2 bg-stone-300 dark:bg-stone-700'
                  }`}
                  aria-label={`Ver novedad ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer Actions: Entrar al sitio, Omitir, and Preferences */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Remember preference checkbox */}
              <label className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded text-gold-600 border-stone-300 focus:ring-gold-500 dark:bg-stone-800 dark:border-stone-700"
                />
                <span>No volver a mostrar automáticamente</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Omitir ({timeLeft}s)
                </button>

                <button
                  type="button"
                  onClick={handleEnterSite}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 dark:hover:bg-gold-400 transition-all cursor-pointer shadow-md"
                >
                  <span>Entrar al sitio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
