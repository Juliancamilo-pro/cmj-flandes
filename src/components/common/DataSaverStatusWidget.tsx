import React from 'react';
import { Zap, ShieldCheck, Check, Info } from 'lucide-react';
import { useLightReading } from '../../context/LightReadingContext';

interface DataSaverStatusWidgetProps {
  className?: string;
  articleCount?: number;
}

export const DataSaverStatusWidget: React.FC<DataSaverStatusWidgetProps> = ({
  className = '',
  articleCount = 1
}) => {
  const { isLightReading, toggleLightReading } = useLightReading();

  if (!isLightReading) return null;

  // Each article read in data saver saves roughly 4.35 MB (from 4.8MB down to ~450KB)
  const estimatedSavingsMB = (articleCount * 4.35).toFixed(1);

  return (
    <div className={`p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-amber-400 text-stone-950 font-bold shrink-0">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider text-[11px]">
              Modo Ahorro de Datos Premium Activo
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-[10px] font-bold">
              ~{estimatedSavingsMB} MB Ahorrados
            </span>
          </div>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
            Imágenes de alta resolución bajo demanda y sin autoplay para máxima velocidad móvil.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleLightReading}
        className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-[11px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0 cursor-pointer text-center"
      >
        Desactivar Ahorro
      </button>
    </div>
  );
};
