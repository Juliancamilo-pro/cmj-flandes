import React, { useState } from 'react';
import { AuthorProfile, SubscriberUser } from '../../types';

interface ColombianVerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  authorName?: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Evaluates whether an AuthorProfile currently holds an active, valid Colombian Editorial Verification Badge.
 * If the author is a subscriber, verifies that their Monthly or Annual plan is active and not expired.
 */
export function isAuthorVerificationActive(
  profile?: AuthorProfile | null,
  subscriber?: SubscriberUser | null
): boolean {
  if (!profile || profile.verificationStatus !== 'verificado') {
    return false;
  }

  // Owner and active collaborators do not expire via subscription
  if (profile.role === 'owner' || profile.role === 'collaborator') {
    return true;
  }

  // For subscribers, check subscription validity & eligible plan (mensual or anual)
  if (subscriber) {
    const isExpired = new Date(subscriber.endDate).getTime() < Date.now();
    const isEligiblePlan = subscriber.period === 'mensual' || subscriber.period === 'anual';
    if (subscriber.status !== 'activa' || isExpired || !isEligiblePlan) {
      return false;
    }
  } else if (profile.verificationExpiresAt) {
    if (new Date(profile.verificationExpiresAt).getTime() < Date.now()) {
      return false;
    }
  }

  return true;
}

export const ColombianVerifiedBadge: React.FC<ColombianVerifiedBadgeProps> = ({
  size = 'sm',
  authorName,
  showLabel = false,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const dimensions = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  return (
    <span
      className={`relative inline-flex items-center space-x-1 align-middle select-none ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
        }}
        className="inline-flex items-center justify-center focus:outline-none cursor-pointer group"
        aria-label="Autor verificado en la plataforma editorial Julian Camilo"
        title="Verificación interna de la plataforma editorial Julian Camilo (No es certificación gubernamental)"
      >
        {/* Custom Rosette / Shield Badge with Colombian Flag Tricolor Ring */}
        <svg
          viewBox="0 0 24 24"
          className={`${dimensions} drop-shadow-2xs transition-transform group-hover:scale-110`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="colombiaTricolorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCD116" />
              <stop offset="50%" stopColor="#FCD116" />
              <stop offset="50.1%" stopColor="#003893" />
              <stop offset="75%" stopColor="#003893" />
              <stop offset="75.1%" stopColor="#CE1126" />
              <stop offset="100%" stopColor="#CE1126" />
            </linearGradient>
          </defs>
          {/* Scalloped / Rosette Verification Seal */}
          <path
            d="M12 1.5L14.4 3.4L17.4 3.1L18.6 5.9L21.3 7.2L20.9 10.2L22.6 12.6L20.8 15L21.1 18L18.4 19.2L17.1 21.9L14.1 21.5L11.8 23.2L9.5 21.4L6.5 21.7L5.3 18.9L2.6 17.6L3 14.6L1.3 12.2L3.1 9.8L2.8 6.8L5.5 5.6L6.8 2.9L9.8 3.3L12 1.5Z"
            fill="url(#colombiaTricolorGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.1"
          />
          {/* Inner dark contrast circle for crisp checkmark legibility */}
          <circle cx="12" cy="12.2" r="5.6" fill="#121214" fillOpacity="0.82" />
          {/* Crisp White Checkmark */}
          <path
            d="M9.4 12.3L11.2 14.1L14.8 10.3"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {showLabel && (
        <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 font-sans inline-flex items-center space-x-1">
          <span>✓ Verificado CO</span>
        </span>
      )}

      {/* Informative Tooltip with Mandatory Disclaimer */}
      {showTooltip && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-[#121214] text-white text-[11px] font-sans shadow-xl border border-stone-700 z-50 pointer-events-auto text-left space-y-1.5"
        >
          <div className="flex items-center space-x-1.5 font-bold text-gold-400">
            <span className="inline-flex flex-col w-3 h-2 rounded-2xs overflow-hidden shrink-0">
              <span className="bg-[#fcd116] h-[50%] w-full" />
              <span className="bg-[#003893] h-[25%] w-full" />
              <span className="bg-[#ce1126] h-[25%] w-full" />
            </span>
            <span>Autor Verificado • Julian Camilo</span>
          </div>
          <p className="text-stone-300 leading-relaxed">
            {authorName ? `${authorName} cuenta con ` : 'Cuenta con '}
            insignia de identidad editorial aprobada por la dirección de la plataforma.
          </p>
          <p className="text-[10px] text-stone-400 border-t border-stone-800 pt-1 italic">
            Nota: Es una verificación interna de esta plataforma editorial y no constituye una certificación gubernamental.
          </p>
        </div>
      )}
    </span>
  );
};
