import React, { useState } from 'react';

const OWNER_EMAIL = 'trujillogordilooo@gmail.com';

export function isOwnerAuthor(
  authorEmail?: string | null,
  authorRole?: string | null,
  authorName?: string | null
): boolean {
  if (authorRole === 'owner') return true;
  if (authorEmail && authorEmail.trim().toLowerCase() === OWNER_EMAIL) return true;
  if (
    authorName &&
    authorName.trim().toLowerCase().includes('julian camilo') &&
    (!authorRole || authorRole === 'owner')
  ) {
    return true;
  }
  return false;
}

interface OwnerVerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Insignia Especial de Propietario Verificado
 * Asignada exclusivamente al propietario oficial de la plataforma (Julian Camilo Trujillo Gordillo),
 * independiente de planes de suscripción y protegida contra suplantación.
 */
export const OwnerVerifiedBadge: React.FC<OwnerVerifiedBadgeProps> = ({
  size = 'sm',
  showLabel = false,
  className = ''
}) => {
  const [open, setOpen] = useState(false);

  const dimensions = {
    xs: 'w-4 h-4',
    sm: 'w-4.5 h-4.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  const tooltipText =
    'Propietario verificado de Julian Camilo. Cuenta oficial de administración de esta plataforma editorial';

  return (
    <span
      className={`relative inline-flex items-center space-x-1 align-middle select-none ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center justify-center focus:outline-none cursor-pointer group"
        aria-label={tooltipText}
        title={tooltipText}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${dimensions} drop-shadow-xs transition-transform group-hover:scale-110`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ownerColombiaShield" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCD116" />
              <stop offset="48%" stopColor="#FCD116" />
              <stop offset="48.1%" stopColor="#003893" />
              <stop offset="74%" stopColor="#003893" />
              <stop offset="74.1%" stopColor="#CE1126" />
              <stop offset="100%" stopColor="#CE1126" />
            </linearGradient>
          </defs>
          {/* Escudo oficial con borde dorado */}
          <path
            d="M12 1.5L20.5 5V11.2C20.5 16.5 16.9 21.1 12 22.7C7.1 21.1 3.5 16.5 3.5 11.2V5L12 1.5Z"
            fill="url(#ownerColombiaShield)"
            stroke="#F2C94C"
            strokeWidth="1.6"
          />
          {/* Centro vinotinto Tolima para contraste */}
          <circle cx="12" cy="11.8" r="5.3" fill="#9B1B30" stroke="#F2C94C" strokeWidth="1" />
          {/* Corona / Estrella de propietario */}
          <path
            d="M9.3 12L11.1 13.8L14.8 10.1"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {showLabel && (
        <span className="text-[11px] font-bold text-[#9B1B30] dark:text-[#F2C94C] font-sans">
          Propietario Verificado
        </span>
      )}

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl bg-[#121214] text-white text-[11px] font-sans shadow-2xl border border-[#F2C94C]/50 z-50 pointer-events-auto text-left space-y-1.5"
        >
          <div className="flex items-center space-x-2 font-bold text-[#F2C94C]">
            <span className="inline-flex flex-col w-3.5 h-2.5 rounded-2xs overflow-hidden shrink-0 border border-white/20">
              <span className="bg-[#fcd116] h-[50%] w-full" />
              <span className="bg-[#003893] h-[25%] w-full" />
              <span className="bg-[#ce1126] h-[25%] w-full" />
            </span>
            <span>DULIMA · Dirección Editorial</span>
          </div>
          <p className="text-stone-100 leading-relaxed font-medium">
            {tooltipText}
          </p>
        </div>
      )}
    </span>
  );
};
