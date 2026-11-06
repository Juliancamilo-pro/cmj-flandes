import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  Tag, 
  Share2, 
  BookOpen, 
  User, 
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Zap,
  ZapOff,
  ExternalLink,
  Info,
  Flag,
  Check,
  FileWarning,
  BookMarked,
  Scale,
  Printer,
  ListTree
} from 'lucide-react';
import { Article, Profile, AdProposal, ArticleFormat, AuthorProfile } from '../../types';
import { ShareButtons } from '../../components/public/ShareButtons';
import { ArticleReactions } from '../../components/public/ArticleReactions';
import { CommentSection } from '../../components/public/CommentSection';
import { Newsletter } from '../../components/public/Newsletter';
import { LightImage } from '../../components/common/LightImage';
import { AudioPlayer } from '../../components/common/AudioPlayer';
import { VideoEmbed } from '../../components/common/VideoEmbed';
import { PhotoGalleryViewer } from '../../components/common/PhotoGalleryViewer';
import { ContentReportModal } from '../../components/public/ContentReportModal';
import { CorrectionRequestModal } from '../../components/public/CorrectionRequestModal';
import { AuthorPublicProfileModal } from '../../components/public/AuthorPublicProfileModal';
import { ColombianVerifiedBadge } from '../../components/common/ColombianVerifiedBadge';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../../components/common/OwnerVerifiedBadge';
import { AdSlotBanner } from '../../components/public/AdSlotBanner';
import { DataSaverStatusWidget } from '../../components/common/DataSaverStatusWidget';
import { useLightReading } from '../../context/LightReadingContext';
import { useAuthorDirectory } from '../../hooks/useVerifiedAuthors';
import { sanitizeSafeUrl } from '../../utils/security';
import { 
  incrementArticleViews, 
  recordVisit, 
  getPublicActiveAds, 
  recordAdImpression, 
  recordAdClick,
  isArticleSavedInList,
  saveArticleToReadingList,
  removeArticleFromReadingList
} from '../../services/db';

interface ArticleDetailPageProps {
  article: Article;
  profile: Profile;
  relatedArticles: Article[];
  onBack: () => void;
  onReadArticle: (slug: string) => void;
  onSelectCategory: (categorySlug: string) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  article,
  profile,
  relatedArticles,
  onBack,
  onReadArticle,
  onSelectCategory
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isLightReading, toggleLightReading } = useLightReading();
  const [sponsorAds, setSponsorAds] = useState<AdProposal[]>([]);

  // Reader tools state
  const [isSaved, setIsSaved] = useState(() => isArticleSavedInList(article.id || article.slug));
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [authorProfileModal, setAuthorProfileModal] = useState<AuthorProfile | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  const { findAuthorProfile, isVerifiedAuthor } = useAuthorDirectory();
  const matchedAuthorProfile = findAuthorProfile(article.authorEmail, article.authorName);
  const authorIsVerified = isVerifiedAuthor(article.authorEmail, article.authorName);

  // Dynamic reading time estimation based on 200 wpm standard
  const calculatedReadingMinutes = React.useMemo(() => {
    if (article.readingMinutes) return article.readingMinutes;
    const words = article.content ? article.content.trim().split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(words / 200));
  }, [article.content, article.readingMinutes]);

  const handleToggleBookmark = () => {
    if (isSaved) {
      removeArticleFromReadingList(article.id);
      setIsSaved(false);
      setBookmarkToast('Artículo retirado de tu lista de lectura.');
    } else {
      saveArticleToReadingList(article);
      setIsSaved(true);
      setBookmarkToast('Artículo guardado para leer después.');
    }
    setTimeout(() => setBookmarkToast(null), 3000);
  };

  useEffect(() => {
    let mounted = true;
    getPublicActiveAds('article_banner')
      .then((ads) => {
        if (mounted && ads.length > 0) {
          setSponsorAds(ads);
          recordAdImpression(ads[0].id);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [article.id]);

  // 1. Dynamic SEO Metadata configuration
  useEffect(() => {
    const originalTitle = document.title;
    
    // Set dynamic page title
    document.title = `${article.title} — DULIMA`;

    // Dynamic meta description derived from subtitle or first 160 characters of content
    const rawExcerpt = article.subtitle || article.content.replace(/<[^>]+>/g, '').slice(0, 160).trim();
    const cleanDescription = rawExcerpt ? `${rawExcerpt}...` : 'Artículo editorial de análisis y opinión en DULIMA.';

    let metaDesc = document.querySelector('meta[name="description"]');
    let ogDesc = document.querySelector('meta[property="og:description"]');
    let ogTitle = document.querySelector('meta[property="og:title"]');

    const originalDescContent = metaDesc ? metaDesc.getAttribute('content') : '';

    if (metaDesc) metaDesc.setAttribute('content', cleanDescription);
    if (ogDesc) ogDesc.setAttribute('content', cleanDescription);
    if (ogTitle) ogTitle.setAttribute('content', `${article.title} — DULIMA`);

    // Restore on unmount
    return () => {
      document.title = originalTitle;
      if (metaDesc && originalDescContent) metaDesc.setAttribute('content', originalDescContent);
      if (ogDesc && originalDescContent) ogDesc.setAttribute('content', originalDescContent);
      if (ogTitle) ogTitle.setAttribute('content', 'Julian Camilo — Plataforma Editorial');
    };
  }, [article.id, article.title, article.subtitle, article.content]);

  // 2. View tracking and scroll progress
  useEffect(() => {
    // Record view in database and analytics
    incrementArticleViews(article.id, article.views);
    recordVisit(`/articulo/${article.slug || article.id}`, article.id, article.categoryName);

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const totalScrollable = scrollHeight - clientHeight;
      if (totalScrollable > 0) {
        const progress = (scrollTop / totalScrollable) * 100;
        setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))));
      } else {
        setScrollProgress(0);
      }
    };

    // Calculate immediately on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [article.id]);

  const formattedDate = article.publishedAt
    ? new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date(article.publishedAt))
    : new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date(article.createdAt));

  const formatLabels: Record<ArticleFormat, { label: string; badgeClass: string }> = {
    noticias: { label: 'Noticias', badgeClass: 'bg-red-800 text-white' },
    opinion: { label: 'Opinión', badgeClass: 'bg-stone-800 text-stone-100' },
    analisis_politico: { label: 'Análisis político', badgeClass: 'bg-indigo-800 text-white' },
    investigacion: { label: 'Investigación', badgeClass: 'bg-[#9B1B30] text-white' },
    entrevistas: { label: 'Entrevistas', badgeClass: 'bg-emerald-800 text-white' },
    reportajes: { label: 'Reportajes', badgeClass: 'bg-amber-700 text-white' },
    columnas_editoriales: { label: 'Columnas editoriales', badgeClass: 'bg-stone-900 text-gold-300' },
    comunicados: { label: 'Comunicados', badgeClass: 'bg-blue-800 text-white' },
    cronicas: { label: 'Crónicas', badgeClass: 'bg-orange-800 text-white' },
    fotoreportajes: { label: 'Fotoreportajes', badgeClass: 'bg-teal-800 text-white' },
    publicaciones_audiovisuales: { label: 'Publicaciones audiovisuales', badgeClass: 'bg-purple-800 text-white' },
    editoriales: { label: 'Editoriales', badgeClass: 'bg-[#70132b] text-[#F2C94C]' },
    articulos_academicos: { label: 'Artículos académicos', badgeClass: 'bg-slate-800 text-white' },
    noticia: { label: 'Noticia', badgeClass: 'bg-red-800 text-white' },
    reportaje: { label: 'Reportaje', badgeClass: 'bg-amber-700 text-white' },
    entrevista: { label: 'Entrevista', badgeClass: 'bg-emerald-800 text-white' },
    analisis: { label: 'Análisis', badgeClass: 'bg-indigo-800 text-white' },
    columna: { label: 'Columna', badgeClass: 'bg-stone-900 text-gold-300' },
    comunicado: { label: 'Comunicado', badgeClass: 'bg-blue-800 text-white' },
    multimedia: { label: 'Multimedia', badgeClass: 'bg-purple-800 text-white' },
    galeria: { label: 'Galería', badgeClass: 'bg-teal-800 text-white' },
    video: { label: 'Video Especial', badgeClass: 'bg-rose-700 text-white' },
    audio: { label: 'Columna Sonora', badgeClass: 'bg-gold-700 text-stone-950' }
  };

  const currentFormat = article.format ? formatLabels[article.format] : null;

  // Helper to render formatted editorial content safely
  const renderEditorialContent = (content: string) => {
    // Splits by paragraphs or double line breaks and formats headings/quotes
    const blocks = content.split('\n\n');

    return blocks.map((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H1 Heading: starts with #
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={index} className="text-3xl sm:text-4xl font-serif font-black text-[#121212] dark:text-[#f3ede2] pt-8 pb-3 border-b border-stone-200 dark:border-stone-800">
            {trimmed.replace(/^#\s+/, '')}
          </h1>
        );
      }

      // H2 Heading: starts with ##
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-[#f3ede2] pt-7 pb-2.5">
            {trimmed.replace(/^##\s+/, '')}
          </h2>
        );
      }

      // H3 Heading: starts with ###
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl sm:text-2xl font-serif font-bold text-[#1a1a1a] dark:text-[#e4ddd2] pt-5 pb-1.5">
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }

      // Pullquote: starts with > (supports author attribution with > — Author)
      if (trimmed.startsWith('> ')) {
        const lines = trimmed.split('\n');
        const quoteText = lines[0].replace(/^>\s+/, '').replace(/^"/, '').replace(/"$/, '');
        const authorLine = lines.find((l) => l.trim().startsWith('> —') || l.trim().startsWith('> -'));
        const authorClean = authorLine ? authorLine.replace(/^>[—\-]\s*/, '') : null;

        return (
          <blockquote key={index} className="my-8 pl-6 sm:pl-8 py-3.5 border-l-4 border-gold-500 font-serif italic text-xl sm:text-2xl text-stone-800 dark:text-stone-200 bg-[#fbf9f4] dark:bg-[#1f1e1c] rounded-r-2xl space-y-2">
            <p className="leading-snug">"{quoteText}"</p>
            {authorClean && (
              <cite className="block text-xs font-sans font-semibold text-stone-500 dark:text-stone-400 not-italic uppercase tracking-wider">
                — {authorClean}
              </cite>
            )}
          </blockquote>
        );
      }

      // Context Callout Info Box: :::info ... :::
      if (trimmed.startsWith(':::info') || trimmed.startsWith(':::alerta')) {
        const body = trimmed.replace(/^:::[a-z]+\n?/, '').replace(/\n?:::$/, '');
        return (
          <div key={index} className="my-8 p-5 sm:p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border-l-4 border-amber-500 text-stone-800 dark:text-amber-100 font-sans space-y-1.5 shadow-xs">
            <div className="flex items-center space-x-1.5 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Contexto & Información Clave</span>
            </div>
            <p className="text-sm leading-relaxed">{body}</p>
          </div>
        );
      }

      // Section divider with subtle Colombian & Tolima micro-accent
      if (trimmed === '---') {
        return (
          <div key={index} className="my-10 flex items-center justify-center space-x-3">
            <div className="h-px bg-[#e7e4dc] dark:bg-stone-800 flex-1"></div>
            <div className="flex space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-400"></span>
              <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            </div>
            <div className="h-px bg-[#e7e4dc] dark:bg-stone-800 flex-1"></div>
          </div>
        );
      }

      // Inline image markdown: ![caption](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        const caption = imgMatch[1];
        const url = imgMatch[2];
        return (
          <figure key={index} className="my-8 space-y-2">
            <LightImage
              src={url}
              alt={caption || article.title}
              caption={caption}
              className="w-full rounded-2xl object-cover max-h-[500px]"
            />
          </figure>
        );
      }

      // Bullet list: starts with - or *
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').filter(i => i.trim());
        return (
          <ul key={index} className="my-6 space-y-2.5 list-disc list-inside text-stone-700 dark:text-stone-300 font-sans leading-relaxed pl-3 text-base sm:text-lg">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>
                {item.replace(/^[-*]\s+/, '')}
              </li>
            ))}
          </ul>
        );
      }

      // Numbered list: starts with 1. 2. etc.
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n').filter(i => i.trim());
        return (
          <ol key={index} className="my-6 space-y-2.5 list-decimal list-inside text-stone-700 dark:text-stone-300 font-sans leading-relaxed pl-3 text-base sm:text-lg">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>
                {item.replace(/^\d+\.\s+/, '')}
              </li>
            ))}
          </ol>
        );
      }

      // Standard paragraph with optimized editorial spacing
      return (
        <p key={index} className="text-stone-800 dark:text-stone-200 text-base sm:text-lg sm:leading-[1.8] font-serif tracking-normal my-5">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="relative">
      {/* Horizontal Reading Progress Bar pinned at the very top of viewport */}
      <div 
        className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-[#e7e4dc]/50 dark:bg-stone-800/60 backdrop-blur-xs pointer-events-none"
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de lectura"
      >
        <div 
          className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-amber-300 transition-[width] duration-150 ease-out shadow-[0_0_10px_rgba(212,175,55,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating progress percentage pill when scrolling */}
      {scrollProgress > 3 && (
        <div 
          className="fixed bottom-6 right-6 z-40 bg-[#121212]/90 dark:bg-stone-900/90 backdrop-blur-md text-white border border-gold-500/40 rounded-full py-1.5 px-3.5 shadow-xl flex items-center space-x-2 text-xs font-sans animate-in fade-in duration-200"
          title="Avance de lectura"
        >
          <Bookmark className="w-3.5 h-3.5 text-gold-400" />
          <span className="font-semibold text-gold-300">{scrollProgress}%</span>
          <span className="text-stone-300 text-[11px] hidden sm:inline">leído</span>
        </div>
      )}

      <article className="max-w-4xl mx-auto space-y-10">
        {/* Back navigation & Category / Format badges */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#eeeae1] dark:border-stone-800 pb-4 gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-wider font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gold-600 dark:text-gold-400" />
            <span>Volver al archivo</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format badge if defined */}
            {currentFormat && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs ${currentFormat.badgeClass}`}>
                {currentFormat.label}
              </span>
            )}

            {/* Quick Data Saver toggle */}
            <button
              onClick={toggleLightReading}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center space-x-1.5 transition-colors cursor-pointer border ${
                isLightReading
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
              title="Ahorra datos móviles cargando imágenes bajo demanda"
            >
              {isLightReading ? <Zap className="w-3.5 h-3.5 fill-current text-amber-600" /> : <ZapOff className="w-3.5 h-3.5 text-stone-400" />}
              <span>{isLightReading ? 'Ahorro de Datos' : 'Lectura Ligera'}</span>
            </button>

            <div className="flex items-center space-x-1.5 p-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 pl-2 pr-1 font-sans">
                Texto:
              </span>
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`w-6 h-6 rounded-full text-xs font-serif font-bold transition-all ${
                  fontSize === 'sm' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
                title="Tamaño de letra compacta"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('base')}
                className={`w-6 h-6 rounded-full text-xs font-serif font-bold transition-all ${
                  fontSize === 'base' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
                title="Tamaño de letra estándar"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`w-6 h-6 rounded-full text-xs font-serif font-bold transition-all ${
                  fontSize === 'lg' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
                title="Tamaño de letra grande"
              >
                A+
              </button>
            </div>

            {/* Bookmark button */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer border ${
                isSaved
                  ? 'bg-gold-100 text-gold-900 border-gold-300 dark:bg-stone-800 dark:text-gold-300 dark:border-stone-700 font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
              title={isSaved ? 'Artículo guardado en tu lista de lectura' : 'Guardar artículo para leer después'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
              ) : (
                <Bookmark className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
            </button>

            {/* Report Content Button */}
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="Reportar contenido inapropiado o impreciso"
              aria-label="Reportar contenido"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSelectCategory(article.categoryId || article.categoryName)}
              className="px-3 py-1 rounded-full bg-gold-50 dark:bg-stone-800 text-gold-800 dark:text-gold-300 border border-gold-200 dark:border-stone-700 text-xs font-semibold uppercase tracking-wider hover:bg-gold-100 dark:hover:bg-stone-700 transition-colors"
            >
              {article.categoryName}
            </button>
          </div>
        </div>

        {/* Feedback toast for bookmark */}
        {bookmarkToast && (
          <div className="p-3 rounded-2xl bg-gold-50 dark:bg-stone-900 border border-gold-200 dark:border-stone-700 text-xs text-gold-900 dark:text-gold-300 flex items-center space-x-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bookmarkToast}</span>
          </div>
        )}

        {/* Article Header & Typography */}
        <header className="space-y-6 text-center sm:text-left">
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black font-serif text-[#121212] dark:text-[#f3ede2] leading-[1.15] tracking-tight">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg sm:text-2xl text-stone-600 dark:text-stone-300 font-serif italic leading-relaxed">
              {article.subtitle}
            </p>
          )}

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between border-y border-[#eeeae1] dark:border-stone-800 py-4 gap-4 text-xs text-stone-500 dark:text-stone-400 font-sans">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (matchedAuthorProfile) {
                    setAuthorProfileModal(matchedAuthorProfile);
                  } else {
                    setAuthorProfileModal({
                      id: 'public-author',
                      role: (article.authorRole as 'owner' | 'collaborator' | 'subscriber') || 'owner',
                      fullName: article.authorName || profile.name || 'Julian Camilo',
                      bio: article.authorRole === 'owner' || !article.authorRole ? profile.bio : undefined,
                      photoUrl: article.authorRole === 'owner' || !article.authorRole ? profile.photoUrl : undefined,
                      createdAt: article.createdAt,
                      updatedAt: article.updatedAt || article.createdAt
                    });
                  }
                }}
                className="font-semibold text-stone-900 dark:text-stone-200 hover:text-gold-700 dark:hover:text-gold-400 flex items-center space-x-1.5 cursor-pointer"
                title="Ver perfil público del autor"
              >
                <User className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                <span>Por {article.authorName || 'Julian Camilo'}</span>
                {isOwnerAuthor(article.authorEmail, article.authorRole, article.authorName) ? (
                  <OwnerVerifiedBadge size="sm" />
                ) : (
                  authorIsVerified && <ColombianVerifiedBadge size="sm" />
                )}
                {article.authorRole === 'subscriber' && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-gold-100 dark:bg-stone-800 text-gold-900 dark:text-gold-300 text-[10px] font-bold">
                    Autor Suscriptor
                  </span>
                )}
              </button>
              <span>•</span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-gold-600 dark:text-gold-400" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-gold-600 dark:text-gold-400" />
                {calculatedReadingMinutes} min de lectura
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Eye className="w-3.5 h-3.5 mr-1 text-gold-600 dark:text-gold-400" />
                {(article.views || 0) + 1} lecturas
              </span>
            </div>

            {/* Social Share & Export PDF in header */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer print:hidden"
                title="Exportar o imprimir artículo en PDF"
              >
                <Printer className="w-3.5 h-3.5 text-[#9B1B30] dark:text-[#F2C94C]" />
                <span>PDF</span>
              </button>
              <ShareButtons
                title={article.title}
                description={article.subtitle}
              />
            </div>
          </div>
        </header>

        {/* Data Saver Info Banner if Active */}
        <DataSaverStatusWidget articleCount={1} />

        {/* Cover Image with LightImage (On-Demand in Data Saver Mode) */}
        {article.coverImageUrl && (
          <LightImage
            src={article.coverImageUrl}
            alt={article.title}
            caption={article.coverImageCaption}
            className="w-full h-auto max-h-[520px] object-cover rounded-2xl"
          />
        )}

        {/* Audio Player if article includes audio */}
        {article.audioUrl && (
          <div className="my-6">
            <AudioPlayer
              src={article.audioUrl}
              title={article.audioTitle || article.title}
              author={article.authorName || 'Julian Camilo'}
              coverUrl={article.audioCoverUrl || article.coverImageUrl}
            />
          </div>
        )}

        {/* Video Embed if article includes video */}
        {article.videoUrl && (
          <VideoEmbed
            url={article.videoUrl}
            title={article.videoTitle}
            caption={article.videoDescription}
          />
        )}

        {/* Índice Automático si el artículo contiene subtítulos */}
        {(() => {
          const headings = (article.content || '')
            .split('\n\n')
            .map((b) => b.trim())
            .filter((b) => b.startsWith('## ') || b.startsWith('### '))
            .map((b) => ({
              level: b.startsWith('### ') ? 3 : 2,
              text: b.replace(/^#{2,3}\s+/, '')
            }));
          if (headings.length < 2) return null;
          return (
            <nav
              aria-label="Índice automático del artículo"
              className="p-5 rounded-2xl bg-[#faf9f6] dark:bg-stone-900/70 border border-[#e8e5dc] dark:border-stone-800 space-y-2.5"
            >
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#9B1B30] dark:text-[#F2C94C]">
                <ListTree className="w-4 h-4" />
                <span>Índice automático</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm font-sans text-stone-700 dark:text-stone-300">
                {headings.map((h, i) => (
                  <li key={i} className={h.level === 3 ? 'pl-4 text-stone-500 dark:text-stone-400' : 'font-semibold'}>
                    • {h.text}
                  </li>
                ))}
              </ul>
            </nav>
          );
        })()}

        {/* Main Article Body with Professional Editorial Spacing & Dynamic Font Size */}
        <div className={`prose max-w-none space-y-6 pt-2 text-stone-900 dark:text-stone-200 border-b border-[#eeeae1] dark:border-stone-800 pb-12 ${
          fontSize === 'sm' ? 'prose-sm text-sm sm:text-base leading-relaxed' :
          fontSize === 'lg' ? 'prose-xl text-lg sm:text-xl leading-loose' :
          'prose-lg text-base sm:text-lg leading-relaxed'
        }`}>
          {renderEditorialContent(article.content)}
        </div>

        {/* Photo Gallery Viewer if article includes attached photos */}
        {article.galleryImages && article.galleryImages.length > 0 && (
          <PhotoGalleryViewer
            images={article.galleryImages}
            title="Galería Fotográfica del Reportaje"
          />
        )}

        {/* Aclaraciones y Rectificaciones Editoriales */}
        {article.rectifications && article.rectifications.length > 0 && (
          <section className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Aclaraciones y Rectificaciones Editoriales</span>
            </div>
            <div className="space-y-2.5">
              {article.rectifications.map((rect, idx) => (
                <div key={idx} className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 space-y-0.5">
                  <div className="font-bold uppercase text-[10px] text-amber-800 dark:text-amber-400">
                    {rect.type} • {new Date(rect.publishedAt).toLocaleDateString('es-CO')}
                  </div>
                  <p className="leading-relaxed">{rect.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fuentes y Referencias */}
        {article.sources && article.sources.length > 0 && (
          <section className="p-5 sm:p-6 rounded-2xl bg-[#faf9f6] dark:bg-stone-900 border border-[#e8e5dc] dark:border-stone-800 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              <BookMarked className="w-4 h-4 text-gold-600" />
              <span>Fuentes y Referencias Consultadas</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              {article.sources.map((src, idx) => {
                const safeSrcUrl = sanitizeSafeUrl(src.url);
                return (
                  <li key={idx} className="flex items-start justify-between gap-2">
                    <span>
                      • <strong className="text-stone-800 dark:text-stone-100">{src.title}</strong>
                      {src.authorOrMedia ? ` — ${src.authorOrMedia}` : ''}
                    </span>
                    {safeSrcUrl && (
                      <a
                        href={safeSrcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-gold-700 dark:text-gold-400 hover:underline shrink-0"
                      >
                        <span>Consultar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Solicitar corrección o aclaración */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setCorrectionModalOpen(true)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-500 hover:text-gold-700 dark:text-stone-400 dark:hover:text-gold-400 transition-colors cursor-pointer"
          >
            <FileWarning className="w-3.5 h-3.5" />
            <span>¿Detectaste un dato impreciso? Solicitar corrección o aclaración editorial</span>
          </button>
        </div>

        {/* Tags Chips if present */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-gold-500" />
              <span>Temas relacionados:</span>
            </span>
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-sans hover:bg-stone-200 dark:hover:bg-stone-750 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Sponsored Ad Banner by Subscribers (if active & approved) */}
        {sponsorAds.length > 0 && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#faf9f6] dark:bg-stone-900 border border-gold-300/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-stone-400 font-sans">
              <span>Espacio Publicitario Patrocinado</span>
              <span className="text-gold-600 dark:text-gold-400 font-bold">{sponsorAds[0].businessName}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {sponsorAds[0].bannerUrl && (
                <div className="w-full sm:w-44 h-28 rounded-xl overflow-hidden shrink-0 border border-stone-200 dark:border-stone-800">
                  <img src={sponsorAds[0].bannerUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-1.5 flex-1 text-center sm:text-left">
                <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                  {sponsorAds[0].headline}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
                  {sponsorAds[0].bodyCopy}
                </p>
                <div className="pt-1">
                  <a
                    href={sponsorAds[0].targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordAdClick(sponsorAds[0].id)}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold hover:bg-gold-600 transition-colors"
                  >
                    <span>Conocer más</span>
                    <ExternalLink className="w-3 h-3 text-gold-400 dark:text-stone-950" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Colombian Flag 3-Star Reactions: Amarillo (Me gustó), Azul (No me gustó), Rojo (Me hizo enojar) */}
        <ArticleReactions
          articleId={article.id}
          initialReactions={article.reactions}
        />

        {/* Bottom Share Bar */}
        <div className="bg-[#fcfbf9] dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2]">
              ¿Te resultó valioso este análisis?
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Compártelo en tus redes y propicia la conversación.
            </p>
          </div>
          <ShareButtons
            title={article.title}
            description={article.subtitle}
          />
        </div>

        {/* Author Bio Signature Box */}
        <section className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold-500 shrink-0 bg-stone-100 dark:bg-stone-800">
            <img
              src={profile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'}
              alt={profile.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="font-serif font-bold text-xl text-[#121212] dark:text-[#f3ede2]">
                {profile.name}
              </h3>
              <span className="text-xs text-gold-700 dark:text-gold-400 font-serif italic">
                "{profile.motto || 'Ideas que merecen ser leídas'}"
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
              {profile.bio || 'Columnista y analista político independiente. Editor de esta plataforma y observador de la coyuntura política y ciudadana.'}
            </p>
          </div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="space-y-6 pt-6">
            <h3 className="text-xl font-bold font-serif text-[#121212] dark:text-[#f3ede2] uppercase tracking-wide border-b border-[#eeeae1] dark:border-stone-800 pb-3">
              Otras lecturas recomendadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.slice(0, 2).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onReadArticle(rel.slug || rel.id)}
                  className="group p-5 bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-xl hover:border-gold-500 dark:hover:border-gold-500 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400 font-sans">
                    {rel.categoryName}
                  </span>
                  <h4 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2] group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans line-clamp-2">
                    {rel.subtitle}
                  </p>
                  <div className="pt-2 text-xs font-semibold text-stone-900 dark:text-stone-300 group-hover:text-gold-700 dark:group-hover:text-gold-400 flex items-center space-x-1">
                    <span>Leer artículo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Editorial Newsletter Subscription */}
        <Newsletter variant="article" />

        {/* Ad Slot at end of publication */}
        <AdSlotBanner placement="final_publicaciones" />

        {/* Comments Section */}
        <CommentSection
          articleId={article.id}
          articleTitle={article.title}
          allowComments={article.allowComments}
        />
      </article>

      {/* Inappropriate Content Reporting Modal */}
      <ContentReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        articleId={article.id}
        articleTitle={article.title}
      />

      {/* Editorial Correction Request Modal */}
      <CorrectionRequestModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        articleId={article.id}
        articleTitle={article.title}
      />

      {/* Public Author Profile Modal */}
      {authorProfileModal && (
        <AuthorPublicProfileModal
          isOpen={Boolean(authorProfileModal)}
          authorName={authorProfileModal.fullName}
          authorProfile={authorProfileModal}
          articles={relatedArticles}
          onClose={() => setAuthorProfileModal(null)}
          onReadArticle={(slug) => {
            setAuthorProfileModal(null);
            onReadArticle(slug);
          }}
        />
      )}
    </div>
  );
};
