import React from 'react';
import { Zap, ShieldCheck, Check, Sparkles, X, ArrowRight, Gauge, Cpu } from 'lucide-react';

interface DataSaverUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToPremium: () => void;
  currentPlanPeriod?: string;
  isSubscriber?: boolean;
}

export const DataSaverUpgradeModal: React.FC<DataSaverUpgradeModalProps> = ({
  isOpen,
  onClose,
  onGoToPremium,
  currentPlanPeriod,
  isSubscriber
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181c] max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-gold-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold font-sans">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-600 dark:text-amber-400" />
            <span>Beneficio Exclusivo Premium</span>
          </div>

          <h3 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-white leading-tight">
            Modo Ahorro de Datos Premium
          </h3>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
            Esta funcionalidad de ultra-optimización está reservada exclusivamente para los suscriptores de los planes <strong className="text-stone-900 dark:text-white">Mensual ($50.000 COP)</strong> y <strong className="text-stone-900 dark:text-white">Anual ($100.000 COP)</strong>.
          </p>

          {isSubscriber && (currentPlanPeriod === 'individual' || currentPlanPeriod === 'pago_unico' || currentPlanPeriod === 'semanal') && (
            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
              Actualmente posees un <strong>Plan {currentPlanPeriod === 'semanal' ? 'Semanal' : 'Individual'}</strong>. Para desbloquear el ahorro de datos en tus dispositivos, puedes actualizar tu suscripción al Plan Mensual o Anual.
            </div>
          )}
        </div>

        {/* Visual Comparison: Modo Normal vs Modo Ahorro */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Normal Mode */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">
              Modo Estándar
            </span>
            <div className="text-2xl font-serif font-bold text-stone-700 dark:text-stone-300">
              ~4.8 MB
            </div>
            <p className="text-[11px] text-stone-500 font-sans leading-tight">
              Consumo promedio por artículo (fotografías retina, animaciones y precarga).
            </p>
          </div>

          {/* Data Saver Mode */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400/80 dark:border-amber-500/50 space-y-2 text-center relative shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 dark:text-amber-300 font-black block">
              Modo Ahorro Premium
            </span>
            <div className="text-2xl font-serif font-black text-amber-700 dark:text-amber-400 flex items-center justify-center space-x-1">
              <span>~450 KB</span>
            </div>
            <p className="text-[11px] text-amber-900 dark:text-amber-200 font-sans leading-tight font-medium">
              Ahorra hasta el <strong className="font-black text-amber-700 dark:text-amber-300">90%</strong> de datos móviles en cualquier viaje.
            </p>
          </div>
        </div>

        {/* Exclusive Feature Checklist */}
        <div className="space-y-2.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Lo que obtienes con este modo:
          </span>
          <div className="space-y-2 text-xs font-sans text-stone-700 dark:text-stone-300">
            <div className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Carga perezosa (lazy loading) avanzada:</strong> Las imágenes pesadas solo se cargan si decides abrirlas.</span>
            </div>
            <div className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Desactivación automática de reproducción de videos:</strong> Cero consumo involuntario en segundo plano.</span>
            </div>
            <div className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Animaciones mínimas:</strong> Lectura veloz incluso con señal 2G/3G en carreteras de Colombia y Tolima.</span>
            </div>
            <div className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Estimador en vivo de megas ahorrados:</strong> Consulta en tiempo real cuánto ancho de banda has economizado.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Entendido, continuar normal
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToPremium();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-[#121212] dark:bg-amber-400 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 dark:hover:bg-amber-300 transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-stone-950" />
            <span>Ver Planes Mensual y Anual</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
