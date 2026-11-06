import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, Info, ShieldAlert } from 'lucide-react';
import {
  PoliticalAffiliationType,
  UserPoliticalIdentity,
  UserPoliticalSelection
} from '../../types';
import { POLITICAL_LEGAL_STATUS_LABELS } from '../../data/colombianPoliticalOrgs';
import { sanitizeSafeUrl } from '../../utils/security';

const AFFILIATION_BADGE_LABELS: Record<PoliticalAffiliationType, string> = {
  afiliado: 'Afiliado / Militante declarado',
  simpatizante: 'Simpatizante declarado',
  independiente: 'Movimiento independiente declarado',
  ninguna: 'Sin afiliación política',
  prefiero_no_responder: 'Prefiero no responder'
};

interface PoliticalOrgLogoProps {
  org: UserPoliticalSelection;
  affiliationType: PoliticalAffiliationType;
  declaredByOwner?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const PoliticalOrgLogo: React.FC<PoliticalOrgLogoProps> = ({
  org,
  affiliationType,
  declaredByOwner = false,
  size = 'sm'
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-7 h-7 text-[10px]',
    lg: 'w-9 h-9 text-xs'
  }[size];

  const safeWebsite = sanitizeSafeUrl(org.website);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center align-middle select-none shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`${sizeClasses} rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 shadow-xs flex items-center justify-center font-black tracking-tighter transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 cursor-pointer shrink-0`}
        style={{
          background: org.logoUrl
            ? '#ffffff'
            : `linear-gradient(135deg, ${org.primaryColor || '#9B1B30'} 0%, ${org.secondaryColor || '#121214'} 100%)`,
          color: '#FFFFFF'
        }}
        title={`${org.organizationName} — ${AFFILIATION_BADGE_LABELS[affiliationType]}`}
        aria-label={`Ver información política de ${org.organizationName}`}
      >
        {org.logoUrl ? (
          <img
            src={org.logoUrl}
            alt={org.organizationName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="drop-shadow-xs leading-none px-0.5 truncate">
            {(org.acronym || org.organizationName.slice(0, 3)).toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 bg-white dark:bg-[#1a1a20] text-stone-800 dark:text-stone-100 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 p-4 text-left space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 flex items-center justify-center font-black text-[10px] shrink-0"
              style={{
                background: org.logoUrl
                  ? '#ffffff'
                  : `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.secondaryColor} 100%)`,
                color: '#FFFFFF'
              }}
            >
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.organizationName} className="w-full h-full object-cover" />
              ) : (
                <span>{org.acronym}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-serif font-bold text-sm text-[#121212] dark:text-white leading-snug">
                {org.organizationName}
              </div>
              <div className="text-[11px] font-semibold text-[#9B1B30] dark:text-gold-400">
                {AFFILIATION_BADGE_LABELS[affiliationType]}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900/80 rounded-xl p-2.5 border border-stone-200/80 dark:border-stone-800 space-y-1">
            <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-gold-600 shrink-0" />
              <span>{POLITICAL_LEGAL_STATUS_LABELS[org.legalStatus]}</span>
            </div>
            {org.legalStatusDetail && (
              <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed">
                {org.legalStatusDetail}
              </p>
            )}
          </div>

          <div className="text-[10px] text-stone-500 dark:text-stone-400 flex items-start gap-1.5 leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>
                {declaredByOwner
                  ? 'Información declarada por el propietario.'
                  : 'Organización declarada por el usuario.'}
              </strong>{' '}
              Este logotipo es independiente de la insignia de verificación de DULIMA y no certifica militancia oficial.
            </span>
          </div>

          {safeWebsite && (
            <a
              href={safeWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 hover:underline"
            >
              <span>Consultar información oficial</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </span>
  );
};

interface PoliticalIdentityBadgesProps {
  identity?: UserPoliticalIdentity | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const PoliticalIdentityBadges: React.FC<PoliticalIdentityBadgesProps> = ({
  identity,
  size = 'sm',
  className = ''
}) => {
  if (
    !identity ||
    !identity.isPublic ||
    !identity.organizations ||
    identity.organizations.length === 0 ||
    !['afiliado', 'simpatizante', 'independiente'].includes(identity.affiliationType)
  ) {
    return null;
  }

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1.5 align-middle ${className}`}
      aria-label="Organizaciones políticas declaradas"
    >
      {identity.organizations.map((org) => (
        <PoliticalOrgLogo
          key={org.organizationId}
          org={org}
          affiliationType={identity.affiliationType}
          declaredByOwner={identity.declaredByOwner}
          size={size}
        />
      ))}
    </span>
  );
};
