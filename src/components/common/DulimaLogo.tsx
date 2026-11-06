import React from 'react';

interface DulimaLogoProps {
  variant?: 'horizontal' | 'compact';
  showSlogan?: boolean;
  tone?: 'auto' | 'light' | 'dark';
  className?: string;
}

/**
 * Identidad Visual Oficial de DULIMA
 * Emblema geométrico inspirado en el Nevado del Tolima, el sol pijao y los colores
 * del departamento del Tolima (Vinotinto #9B1B30 y Oro #F2C94C).
 */
export const DulimaLogo: React.FC<DulimaLogoProps> = ({
  variant = 'horizontal',
  showSlogan = false,
  tone = 'auto',
  className = ''
}) => {
  const titleColor =
    tone === 'light'
      ? 'text-white'
      : tone === 'dark'
      ? 'text-[#121212]'
      : 'text-[#121212] dark:text-white';

  const sloganColor =
    tone === 'light'
      ? 'text-stone-300'
      : tone === 'dark'
      ? 'text-stone-600'
      : 'text-stone-500 dark:text-stone-400';

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center space-x-2 select-none ${className}`}>
        <svg
          viewBox="0 0 40 40"
          className="w-8 h-8 shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="40" height="40" rx="10" fill="#9B1B30" />
          <circle cx="28" cy="11" r="3" fill="#F2C94C" />
          <path d="M7 30L16.5 14L22.5 22.5L27.5 11.5L33 30H7Z" fill="#F2C94C" />
          <path d="M27.5 11.5L30.2 18.5L27.5 17.2L24.8 18.5L27.5 11.5Z" fill="#FFFFFF" />
          <rect x="7" y="32.5" width="26" height="2.2" rx="1.1" fill="#F2C94C" />
        </svg>
        <span className={`font-display font-extrabold tracking-[0.14em] text-lg ${titleColor}`}>
          DULIMA
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 shadow-xs rounded-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="48" height="48" rx="12" fill="#9B1B30" />
        <rect x="1.5" y="1.5" width="45" height="45" rx="10.5" stroke="#F2C94C" strokeOpacity="0.45" strokeWidth="1" />
        <circle cx="34" cy="13" r="3.6" fill="#F2C94C" />
        <path d="M8 36L19.5 16.5L27 27L33 13.5L40 36H8Z" fill="#F2C94C" />
        <path d="M33 13.5L36.2 21.8L33 20.2L29.8 21.8L33 13.5Z" fill="#FFFFFF" />
        <path d="M19.5 16.5L21.8 22L19.5 20.8L17.2 22L19.5 16.5Z" fill="#FFFFFF" fillOpacity="0.9" />
        <rect x="8" y="39" width="32" height="2.5" rx="1.25" fill="#F2C94C" />
      </svg>

      <div className="flex flex-col leading-none">
        <div className="flex items-center space-x-2">
          <span className={`font-display font-extrabold tracking-[0.16em] text-xl sm:text-2xl ${titleColor}`}>
            DULIMA
          </span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#9B1B30] dark:bg-[#F2C94C]" />
          <span className="hidden sm:inline-block text-[10px] font-sans font-bold uppercase tracking-widest text-[#9B1B30] dark:text-[#F2C94C]">
            Tolima · Colombia
          </span>
        </div>
        {showSlogan && (
          <span className={`text-[11px] font-serif italic mt-1 ${sloganColor}`}>
            La voz del territorio. El poder de las ideas.
          </span>
        )}
      </div>
    </div>
  );
};
