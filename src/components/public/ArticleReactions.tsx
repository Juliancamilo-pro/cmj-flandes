import React, { useState, useEffect } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { ReactionType, ArticleReactions as ReactionsData } from '../../types';
import { recordArticleReaction } from '../../services/db';

interface ArticleReactionsProps {
  articleId: string;
  initialReactions?: ReactionsData;
}

const DEFAULT_REACTIONS: ReactionsData = { yellow: 0, blue: 0, red: 0 };

export const ArticleReactions: React.FC<ArticleReactionsProps> = ({
  articleId,
  initialReactions
}) => {
  const [reactions, setReactions] = useState<ReactionsData>(() => initialReactions || DEFAULT_REACTIONS);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [animatingStar, setAnimatingStar] = useState<ReactionType | null>(null);
  const [saving, setSaving] = useState(false);

  const storageKey = `jc_reaction_${articleId}`;

  // Read stored reaction for current article
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as ReactionType | null;
    if (stored && ['yellow', 'blue', 'red'].includes(stored)) {
      setUserReaction(stored);
    } else {
      setUserReaction(null);
    }
  }, [articleId, storageKey]);

  // Safely sync initial reactions only when numeric counts actually change
  useEffect(() => {
    if (initialReactions) {
      setReactions((prev) => {
        const nextYellow = initialReactions.yellow || 0;
        const nextBlue = initialReactions.blue || 0;
        const nextRed = initialReactions.red || 0;

        if (prev.yellow === nextYellow && prev.blue === nextBlue && prev.red === nextRed) {
          return prev;
        }

        return { yellow: nextYellow, blue: nextBlue, red: nextRed };
      });
    }
  }, [articleId, initialReactions?.yellow, initialReactions?.blue, initialReactions?.red]);

  const handleToggleReaction = async (type: ReactionType) => {
    if (saving) return;

    setSaving(true);
    setAnimatingStar(type);
    setTimeout(() => setAnimatingStar(null), 600);

    const isCurrent = userReaction === type;
    const nextReaction: ReactionType | null = isCurrent ? null : type;
    const previousReaction = userReaction;

    // Optimistic UI update
    setReactions((prev) => {
      const copy = { ...prev };
      if (previousReaction && copy[previousReaction] > 0) {
        copy[previousReaction] = Math.max(0, copy[previousReaction] - 1);
      }
      if (nextReaction) {
        copy[nextReaction] = (copy[nextReaction] || 0) + 1;
      }
      return copy;
    });

    setUserReaction(nextReaction);

    if (nextReaction) {
      localStorage.setItem(storageKey, nextReaction);
    } else {
      localStorage.removeItem(storageKey);
    }

    try {
      const updated = await recordArticleReaction(articleId, nextReaction, previousReaction);
      if (updated && (updated.yellow || updated.blue || updated.red)) {
        setReactions(updated);
      }
    } catch (err) {
      console.warn('Reactions save fallback notice:', err);
    } finally {
      setSaving(false);
    }
  };

  const totalVotes = (reactions.yellow || 0) + (reactions.blue || 0) + (reactions.red || 0);

  return (
    <section className="my-8 p-6 sm:p-8 rounded-3xl bg-[#fbf9f4] dark:bg-[#18181b] border border-[#e8e5dc] dark:border-stone-800 shadow-sm space-y-6">
      {/* Editorial Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eeeae1] dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#121212] dark:text-[#f3ede2]">
              ¿Qué te provocó este análisis?
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            Reacciones de la comunidad inspiradas en los colores de Colombia. Selecciona una estrella para expresar tu opinión.
          </p>
        </div>

        <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 font-sans shrink-0">
          {totalVotes} {totalVotes === 1 ? 'opinión' : 'opiniones'}
        </div>
      </div>

      {/* 3 Tricolor Colombian Stars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ⭐ ESTRELLA AMARILLA: Me gustó */}
        <button
          type="button"
          onClick={() => handleToggleReaction('yellow')}
          className={`group relative p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer select-none ${
            userReaction === 'yellow'
              ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500 shadow-md ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-[#202023] border-[#e8e5dc] dark:border-stone-800 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform ${
                animatingStar === 'yellow' ? 'scale-125 rotate-12' : 'group-hover:scale-110'
              } ${
                userReaction === 'yellow'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Star className={`w-6 h-6 ${userReaction === 'yellow' ? 'fill-stone-950' : 'fill-amber-500'}`} />
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
                <span>Me gustó</span>
                {userReaction === 'yellow' && (
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                    Tu voto
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                Disfruté el artículo o comparto la postura
              </p>
            </div>
          </div>

          <span
            className={`font-mono text-base font-bold ml-2 px-2.5 py-1 rounded-lg ${
              userReaction === 'yellow'
                ? 'bg-amber-500 text-stone-950'
                : 'text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/80'
            }`}
          >
            {reactions.yellow || 0}
          </span>
        </button>

        {/* ⭐ ESTRELLA AZUL: No me gustó */}
        <button
          type="button"
          onClick={() => handleToggleReaction('blue')}
          className={`group relative p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer select-none ${
            userReaction === 'blue'
              ? 'bg-blue-600/10 dark:bg-blue-600/20 border-blue-600 shadow-md ring-2 ring-blue-600/30'
              : 'bg-white dark:bg-[#202023] border-[#e8e5dc] dark:border-stone-800 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform ${
                animatingStar === 'blue' ? 'scale-125 -rotate-12' : 'group-hover:scale-110'
              } ${
                userReaction === 'blue'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Star className={`w-6 h-6 ${userReaction === 'blue' ? 'fill-white' : 'fill-blue-600'}`} />
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
                <span>No me gustó</span>
                {userReaction === 'blue' && (
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-full">
                    Tu voto
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                Difiero con el enfoque o no me convenció
              </p>
            </div>
          </div>

          <span
            className={`font-mono text-base font-bold ml-2 px-2.5 py-1 rounded-lg ${
              userReaction === 'blue'
                ? 'bg-blue-600 text-white'
                : 'text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/80'
            }`}
          >
            {reactions.blue || 0}
          </span>
        </button>

        {/* ⭐ ESTRELLA ROJA: Me hizo enojar */}
        <button
          type="button"
          onClick={() => handleToggleReaction('red')}
          className={`group relative p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer select-none ${
            userReaction === 'red'
              ? 'bg-rose-600/10 dark:bg-rose-600/20 border-rose-600 shadow-md ring-2 ring-rose-600/30'
              : 'bg-white dark:bg-[#202023] border-[#e8e5dc] dark:border-stone-800 hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform ${
                animatingStar === 'red' ? 'scale-125 rotate-12' : 'group-hover:scale-110'
              } ${
                userReaction === 'red'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Star className={`w-6 h-6 ${userReaction === 'red' ? 'fill-white' : 'fill-rose-600'}`} />
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
                <span>Me hizo enojar</span>
                {userReaction === 'red' && (
                  <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-full">
                    Tu voto
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                Indignación o inconformidad con los hechos
              </p>
            </div>
          </div>

          <span
            className={`font-mono text-base font-bold ml-2 px-2.5 py-1 rounded-lg ${
              userReaction === 'red'
                ? 'bg-rose-600 text-white'
                : 'text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/80'
            }`}
          >
            {reactions.red || 0}
          </span>
        </button>
      </div>

      {/* Tricolor Colombian Balance Bar */}
      {totalVotes > 0 && (
        <div className="space-y-1.5 pt-2">
          <div className="h-2 w-full rounded-full overflow-hidden flex bg-stone-200 dark:bg-stone-800">
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${((reactions.yellow || 0) / totalVotes) * 100}%` }}
              title={`Me gustó: ${Math.round(((reactions.yellow || 0) / totalVotes) * 100)}%`}
            />
            <div
              className="bg-blue-600 transition-all duration-500"
              style={{ width: `${((reactions.blue || 0) / totalVotes) * 100}%` }}
              title={`No me gustó: ${Math.round(((reactions.blue || 0) / totalVotes) * 100)}%`}
            />
            <div
              className="bg-rose-600 transition-all duration-500"
              style={{ width: `${((reactions.red || 0) / totalVotes) * 100}%` }}
              title={`Me hizo enojar: ${Math.round(((reactions.red || 0) / totalVotes) * 100)}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span>{Math.round(((reactions.yellow || 0) / totalVotes) * 100)}% Me gustó</span>
            <span>{Math.round(((reactions.blue || 0) / totalVotes) * 100)}% No me gustó</span>
            <span>{Math.round(((reactions.red || 0) / totalVotes) * 100)}% Me hizo enojar</span>
          </div>
        </div>
      )}
    </section>
  );
};
