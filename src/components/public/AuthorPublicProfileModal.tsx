import React from 'react';
import {
  X,
  User,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Globe,
  BookOpen,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { AuthorProfile, Article, SubscriberUser } from '../../types';
import { ColombianVerifiedBadge, isAuthorVerificationActive } from '../common/ColombianVerifiedBadge';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../common/OwnerVerifiedBadge';
import { PoliticalIdentityBadges } from '../common/PoliticalOrgLogo';
import { sanitizeSafeUrl } from '../../utils/security';

interface AuthorPublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorName: string;
  authorProfile?: AuthorProfile | null;
  subscriber?: SubscriberUser | null;
  articles?: Article[];
  onReadArticle?: (slug: string) => void;
}

export const AuthorPublicProfileModal: React.FC<AuthorPublicProfileModalProps> = ({
  isOpen,
  onClose,
  authorName,
  authorProfile,
  subscriber,
  articles = [],
  onReadArticle
}) => {
  if (!isOpen) return null;

  const isVerified = isAuthorVerificationActive(authorProfile, subscriber);

  // Filter published articles by this author
  const authorArticles = articles.filter(
    (a) =>
      (a.status === 'published' || a.status === 'publicado') &&
      a.authorName?.toLowerCase().trim() === (authorProfile?.fullName || authorName).toLowerCase().trim()
  );

  // Respect explicit privacy flags (never expose email/phone unless explicitly authorized)
  const canShowOccupation = authorProfile?.showOccupationPublic !== false && !!authorProfile?.occupation;
  const canShowLocation =
    authorProfile?.showLocationPublic !== false && !!(authorProfile?.city || authorProfile?.country);
  const canShowEmail = authorProfile?.showEmailPublic === true && !!authorProfile?.email;
  const canShowPhone = authorProfile?.showPhonePublic === true && !!authorProfile?.phone;
  const canShowSocials = authorProfile?.showSocialsPublic !== false && !!authorProfile?.socialLinks;

  const socialEntries = canShowSocials
    ? [
        { label: 'X / Twitter', url: sanitizeSafeUrl(authorProfile?.socialLinks?.twitter) },
        { label: 'Instagram', url: sanitizeSafeUrl(authorProfile?.socialLinks?.instagram) },
        { label: 'LinkedIn', url: sanitizeSafeUrl(authorProfile?.socialLinks?.linkedin) },
        { label: 'Sitio Web', url: sanitizeSafeUrl(authorProfile?.socialLinks?.website) }
      ].filter((s) => !!s.url)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#18181c] max-w-xl w-full rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden relative my-auto"
      >
        {/* Colombian Tricolor Top Ribbon */}
        <div className="h-2 w-full flex">
          <span className="bg-[#fcd116] flex-[2]" />
          <span className="bg-[#003893] flex-1" />
          <span className="bg-[#ce1126] flex-1" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Cerrar perfil de autor"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header: Photo, Name, Role & Colombian Verification Badge */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {authorProfile?.photoUrl ? (
              <img
                src={authorProfile.photoUrl}
                alt={authorProfile.fullName || authorName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-400/60 shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 shrink-0">
                <User className="w-9 h-9" />
              </div>
            )}

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-serif font-black text-2xl text-[#121212] dark:text-white">
                  {authorProfile?.fullName || authorName}
                </h3>
                {isOwnerAuthor(authorProfile?.email, authorProfile?.role, authorProfile?.fullName || authorName) ? (
                  <OwnerVerifiedBadge size="md" showLabel />
                ) : (
                  isVerified && (
                    <ColombianVerifiedBadge
                      size="md"
                      authorName={authorProfile?.fullName || authorName}
                      showLabel
                    />
                  )
                )}
                <PoliticalIdentityBadges
                  identity={authorProfile?.politicalIdentity || subscriber?.politicalIdentity}
                  size="md"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-stone-500 dark:text-stone-400 font-sans">
                <span className="px-2.5 py-0.5 rounded-full bg-gold-50 dark:bg-stone-800 text-gold-900 dark:text-gold-300 font-bold uppercase tracking-wider text-[10px]">
                  {authorProfile?.role === 'owner'
                    ? 'Director Editorial'
                    : authorProfile?.role === 'collaborator'
                    ? 'Colaborador Editorial'
                    : 'Autor Suscriptor'}
                </span>

                {canShowOccupation && (
                  <span className="inline-flex items-center space-x-1">
                    <Briefcase className="w-3.5 h-3.5 text-gold-600" />
                    <span>{authorProfile?.occupation}</span>
                  </span>
                )}

                {canShowLocation && (
                  <span className="inline-flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-600" />
                    <span>
                      {[authorProfile?.city, authorProfile?.country].filter(Boolean).join(', ')}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Internal Verification Clarification if verified */}
          {isVerified && (
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0" />
              <span>
                <strong>Insignia Editorial Verificada:</strong> Verificación interna otorgada por la plataforma Julian Camilo. No constituye una certificación gubernamental.
              </span>
            </div>
          )}

          {/* Bio if provided */}
          {authorProfile?.bio && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
                Reseña Biográfica
              </h4>
              <p className="text-sm text-stone-700 dark:text-stone-300 font-sans leading-relaxed whitespace-pre-line">
                {authorProfile.bio}
              </p>
            </div>
          )}

          {/* Authorized Contact & Social Links */}
          {(canShowEmail || canShowPhone || socialEntries.length > 0) && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
                Información Autorizada por el Autor
              </h4>
              <div className="flex flex-wrap gap-2.5 text-xs font-sans">
                {canShowEmail && (
                  <a
                    href={`mailto:${authorProfile?.email}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200"
                  >
                    <Mail className="w-3.5 h-3.5 text-gold-600" />
                    <span>{authorProfile?.email}</span>
                  </a>
                )}
                {canShowPhone && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
                    <Phone className="w-3.5 h-3.5 text-gold-600" />
                    <span>{authorProfile?.phone}</span>
                  </span>
                )}
                {socialEntries.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gold-50 dark:bg-stone-800 text-gold-900 dark:text-gold-300 hover:bg-gold-100 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{s.label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Published Articles by this Author */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gold-600" />
                <span>Publicaciones en la Plataforma ({authorArticles.length})</span>
              </h4>
            </div>

            {authorArticles.length === 0 ? (
              <p className="text-xs text-stone-500 italic">
                Aún no hay publicaciones registradas bajo esta firma.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {authorArticles.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onReadArticle) onReadArticle(art.slug || art.id);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[#faf9f6] dark:bg-stone-900/70 hover:bg-gold-50/60 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                        {art.categoryName}
                      </span>
                      <p className="font-serif font-bold text-sm text-stone-900 dark:text-white truncate">
                        {art.title}
                      </p>
                    </div>
                    <span className="text-[11px] text-stone-400 shrink-0">
                      {art.readingMinutes || 5} min
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
