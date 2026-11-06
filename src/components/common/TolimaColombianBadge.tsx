import React from 'react';

interface TolimaColombianBadgeProps {
  variant?: 'banner' | 'stamp' | 'inline' | 'watermark';
  className?: string;
}

/**
 * Sutil Distintivo de Identidad Editorial Tolimense y Colombiana
 * Rinde homenaje al majestuoso Nevado del Tolima (5.220 msnm),
 * a la herencia musical y cultural del departamento, y a la tricolor nacional.
 */
export const TolimaColombianBadge: React.FC<TolimaColombianBadgeProps> = ({
  variant = 'banner',
  className = ''
}) => {
  if (variant === 'stamp') {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] font-sans text-stone-700 dark:text-stone-300 ${className}`}>
        {/* Nevado del Tolima Vector Icon */}
        <svg viewBox="0 0 24 16" className="w-5 h-3.5 shrink-0 text-stone-700 dark:text-stone-200" fill="currentColor">
          {/* Base Mountain */}
          <path d="M0 16 L7 5 L12 12 L16 3 L24 16 Z" opacity="0.4" />
          {/* Snowcap (Nevado perpetuo) */}
          <path d="M16 3 L18.5 7.5 L17 8 L15 7.5 L14 8.5 L13.5 7 Z" fill="#ffffff" />
          <path d="M7 5 L9.5 9 L8 9.5 L6.5 9 Z" fill="#ffffff" />
        </svg>

        {/* Micro Tricolor Ribbon */}
        <div className="flex h-3 w-4 rounded-xs overflow-hidden shadow-xs border border-black/10 shrink-0">
          <div className="w-1/2 h-full bg-[#fcd116]" />
          <div className="w-1/4 h-full bg-[#003893]" />
          <div className="w-1/4 h-full bg-[#ce1126]" />
        </div>

        <span className="font-semibold tracking-wide">
          Tolima <span className="text-gold-600 dark:text-gold-400">•</span> Colombia
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center space-x-1.5 text-xs text-stone-500 dark:text-stone-400 ${className}`}>
        {/* Nevado Icon */}
        <svg viewBox="0 0 24 16" className="w-4 h-3 inline-block shrink-0" fill="currentColor">
          <path d="M0 16 L7 5 L12 12 L16 3 L24 16 Z" className="text-stone-400 dark:text-stone-600" />
          <path d="M16 3 L18.5 7.5 L17 8 L15 7.5 L14 8.5 L13.5 7 Z" className="text-white fill-white" />
          <path d="M7 5 L9.5 9 L8 9.5 L6.5 9 Z" className="text-white fill-white" />
        </svg>
        <span className="font-serif italic">Desde el Tolima para toda Colombia</span>
      </span>
    );
  }

  // Default 'banner' variant for footers or headers
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-r from-stone-900/40 via-[#1c1819] to-stone-900/40 border border-stone-800/80 text-stone-300 relative overflow-hidden ${className}`}>
      {/* Decorative Nevado Silhouette in Background */}
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none w-48 h-20 text-white">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full fill-current">
          <polygon points="0,40 25,12 35,24 55,5 75,28 100,40" />
          {/* Snowcap highlight */}
          <polygon points="55,5 62,14 58,15 52,14 49,15" fill="#ffffff" />
          <polygon points="25,12 29,18 26,19 22,18" fill="#ffffff" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          {/* Tricolor & Vinotinto Ribbon */}
          <div className="flex flex-col space-y-0.5 shrink-0">
            <div className="flex h-1.5 w-7 rounded-xs overflow-hidden shadow-xs">
              <div className="w-1/2 h-full bg-[#fcd116]" />
              <div className="w-1/4 h-full bg-[#003893]" />
              <div className="w-1/4 h-full bg-[#ce1126]" />
            </div>
            <div className="flex h-1 w-7 rounded-xs overflow-hidden">
              <div className="w-2/3 h-full bg-[#70132b]" title="Vinotinto Tolima" />
              <div className="w-1/3 h-full bg-[#dfba53]" title="Oro Tolima" />
            </div>
          </div>

          <div>
            <p className="font-serif font-bold text-white tracking-wide uppercase text-[11px]">
              Periodismo Independiente y Reflexión Cívica
            </p>
            <p className="text-[11px] text-stone-400 font-sans">
              Edición originada en el departamento del Tolima con vocación democrática nacional.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-stone-400 shrink-0 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          <span>Nevado del Tolima • Ibagué • Colombia</span>
        </div>
      </div>
    </div>
  );
};
