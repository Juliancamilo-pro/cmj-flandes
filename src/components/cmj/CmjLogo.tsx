import React from 'react';

interface CmjLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  officialLogoUrl?: string;
  showLogoText?: boolean;
}

export const CmjLogo: React.FC<CmjLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  officialLogoUrl,
  showLogoText = true,
}) => {
  const dims = officialLogoUrl
    ? size === 'sm'
      ? 'h-10 max-w-[180px]'
      : size === 'lg'
      ? 'h-16 max-w-[260px]'
      : 'h-12 max-w-[220px]'
    : size === 'sm'
    ? 'w-10 h-10'
    : size === 'lg'
    ? 'w-16 h-16'
    : 'w-12 h-12';
  const titleSize =
    size === 'sm'
      ? 'text-sm sm:text-base'
      : size === 'lg'
      ? 'text-xl sm:text-2xl'
      : 'text-base sm:text-lg';

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div className={`${dims} shrink-0 relative`}>
        {officialLogoUrl ? (
          <img
            src={officialLogoUrl}
            alt="Logo Oficial Consejo Municipal de Juventud de Flandes, Tolima"
            className="h-full w-auto object-contain rounded-lg"
          />
        ) : (
          <svg
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-xs"
            aria-label="Escudo Institucional CMJ Flandes, Tolima"
          >
            {/* Outer Heraldic Shield */}
            <path
              d="M40 4L70 14V38C70 57.5 57.2 71.8 40 76C22.8 71.8 10 57.5 10 38V14L40 4Z"
              fill="#FFFFFF"
              stroke="#8C162A"
              strokeWidth="3"
            />
            {/* Top Colombian Tricolor Band */}
            <path d="M13 16.5L40 7.5L67 16.5V22H13V16.5Z" fill="#FCD116" />
            <rect x="13" y="22" width="54" height="4" fill="#003893" />
            <rect x="13" y="26" width="54" height="4" fill="#CE1126" />

            {/* Tolima Vinotinto & Gold Center Field */}
            <rect x="13" y="30" width="54" height="22" fill="#8C162A" />
            {/* Iconic Puente Mariano Ospina Pérez & Río Magdalena (Flandes, Tolima) */}
            <path
              d="M16 46H64M22 46L28 37L34 46M34 46L40 36L46 46M46 46L52 37L58 46"
              stroke="#F2C94C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Río Magdalena Waves */}
            <path
              d="M15 55C21 52.5 27 52.5 33 55C39 57.5 45 57.5 51 55C56 53 61 53 65 55"
              stroke="#003893"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M18 60C23 58 28 58 33 60C38 62 43 62 48 60C53 58 58 58 62 60"
              stroke="#003893"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Bottom Gold Ribbon */}
            <text
              x="40"
              y="70"
              textAnchor="middle"
              fill="#8C162A"
              fontSize="7.5"
              fontWeight="800"
              fontFamily="sans-serif"
              letterSpacing="0.8"
            >
              CMJ FLANDES
            </text>
          </svg>
        )}
      </div>
      {showLogoText && (
        <div className="flex flex-col text-left">
          <span
            className={`font-display font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight ${titleSize}`}
          >
            Consejo Municipal de Juventud
          </span>
          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8c162a] dark:bg-[#f2c94c]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
                Flandes · Tolima · Colombia
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
