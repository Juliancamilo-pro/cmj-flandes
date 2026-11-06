import React from 'react';
import { Award, Flag, ShieldCheck, Landmark } from 'lucide-react';
import { CmjBadge, PoliticalAffiliation } from '../../types/cmj';

interface CmjBadgesProps {
  badges?: CmjBadge[];
  politicalAffiliation?: PoliticalAffiliation;
  compact?: boolean;
}

export const CmjBadges: React.FC<CmjBadgesProps> = ({
  badges = [],
  politicalAffiliation,
  compact = false,
}) => {
  const visibleBadges = badges.filter((b) => b.visible);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleBadges.map((badge) => {
        if (badge.type === 'cmj_institucional') {
          return (
            <span
              key={badge.id}
              title={badge.description}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#8c162a]/10 text-[#8c162a] dark:bg-[#f2c94c]/15 dark:text-[#f2c94c] border border-[#8c162a]/25 dark:border-[#f2c94c]/30"
            >
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>{badge.label}</span>
            </span>
          );
        }

        if (badge.type === 'colombia') {
          return (
            <span
              key={badge.id}
              title={badge.description}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700"
            >
              <span className="inline-flex flex-col w-3 h-2.5 rounded-[2px] overflow-hidden shrink-0 border border-stone-300 dark:border-stone-600">
                <span className="h-1/2 w-full bg-[#fcd116]" />
                <span className="h-1/4 w-full bg-[#003893]" />
                <span className="h-1/4 w-full bg-[#ce1126]" />
              </span>
              <span>{badge.label}</span>
            </span>
          );
        }

        if (badge.type === 'cargo_institucional') {
          return (
            <span
              key={badge.id}
              title={badge.description}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#003893]/10 text-[#003893] dark:bg-blue-400/15 dark:text-blue-300 border border-[#003893]/20 dark:border-blue-400/30"
            >
              <Award className="w-3 h-3 shrink-0" />
              <span>{badge.label}</span>
            </span>
          );
        }

        return null;
      })}

      {politicalAffiliation &&
        politicalAffiliation.hasAffiliation &&
        politicalAffiliation.isPublic &&
        politicalAffiliation.organizationName && (
          <span
            title={`Afinidad política declarada voluntariamente (${politicalAffiliation.affiliationType})`}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50"
          >
            {politicalAffiliation.logoUrl ? (
              <img
                src={politicalAffiliation.logoUrl}
                alt={politicalAffiliation.organizationName}
                className="w-3.5 h-3.5 rounded-full object-cover"
              />
            ) : (
              <Landmark className="w-3 h-3 shrink-0" />
            )}
            <span>
              {compact
                ? politicalAffiliation.organizationName
                : `Afinidad: ${politicalAffiliation.organizationName}`}
            </span>
          </span>
        )}
    </div>
  );
};
