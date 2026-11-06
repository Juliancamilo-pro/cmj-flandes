import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  X,
  Flame,
  Clock,
  Sparkles,
  Bookmark,
  Star,
  Share2,
  Check,
  MessageSquare,
  User as UserIcon,
  BarChart2,
  CheckCircle2,
  Calendar,
  Plus
} from 'lucide-react';
import {
  Article,
  ArticleFormat,
  Category,
  CitizenPoll,
  EditorialPost,
  Profile,
  ReactionType,
  ArticleReactions as ReactionsData
} from '../../types';
import { ArticleCard } from '../../components/public/ArticleCard';
import { Pagination } from '../../components/public/Pagination';
import { AdSlotBanner } from '../../components/public/AdSlotBanner';
import { AuthorPublicProfileModal } from '../../components/public/AuthorPublicProfileModal';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../../components/common/OwnerVerifiedBadge';
import {
  getPosts,
  recordPostReaction,
  getUserFavoriteArticleIds,
  toggleUserFavoriteArticle,
  getCitizenPolls,
  voteInCitizenPoll,
  OFFICIAL_AUTHOR_PORTRAIT
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface ArticlesPageProps {
  articles: Article[];
  categories: Category[];
  profile?: Profile | null;
  initialCategory?: string;
  initialFormat?: string;
  initialTab?: 'articulos' | 'publicaciones' | 'encuestas';
  onNavigate?: (view: string, param?: string) => void;
  onReadArticle: (slug: string) => void;
  onCategorySelect?: (slug: string) => void;
}

const EDITORIAL_FORMATS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos los formatos' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'opinion', label: 'Opinión' },
  { id: 'analisis_politico', label: 'Análisis político' },
  { id: 'investigacion', label: 'Investigación' },
  { id: 'entrevistas', label: 'Entrevistas' },
  { id: 'reportajes', label: 'Reportajes' },
  { id: 'columnas_editoriales', label: 'Columnas' },
  { id: 'comunicados', label: 'Comunicados' },
  { id: 'cronicas', label: 'Crónicas' },
  { id: 'fotoreportajes', label: 'Fotoreportajes' },
  { id: 'publicaciones_audiovisuales', label: 'Contenido audiovisual' },
  { id: 'articulos_academicos', label: 'Artículos académicos' },
  { id: 'publicaciones_breves', label: 'Publicaciones breves' }
];

export const ArticlesPage: React.FC<ArticlesPageProps> = ({
  articles,
  categories,
  profile,
  initialCategory,
  initialFormat,
  initialTab = 'articulos',
  onNavigate,
  onReadArticle
}) => {
  const { user, isAdmin, isCollaborator, isSubscriber, collaborator, subscriber } = useAuth();
  const currentUserId =
    user?.uid || collaborator?.id || subscriber?.id || (isAdmin ? 'owner_julian' : '');
  const hasAccount = Boolean(currentUserId);

  const [activeTab, setActiveTab] = useState<'articulos' | 'publicaciones' | 'encuestas'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedFormat, setSelectedFormat] = useState<string>(initialFormat || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'featured'>('newest');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Brief editorial posts (Publicaciones breves)
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Citizen Polls (Encuestas)
  const [polls, setPolls] = useState<CitizenPoll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [selectedPollOptions, setSelectedPollOptions] = useState<Record<string, string>>({});
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('jc_voted_polls_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  // Author profile modal
  const [selectedAuthor, setSelectedAuthor] = useState<{
    name: string;
    email?: string;
    role?: 'owner' | 'collaborator' | 'subscriber';
    photo?: string;
  } | null>(null);

  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setCurrentPage(1);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialFormat) {
      setSelectedFormat(initialFormat);
      setCurrentPage(1);
    }
  }, [initialFormat]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedFormat, searchTerm, sortBy, onlyFavorites]);

  useEffect(() => {
    if (currentUserId) {
      getUserFavoriteArticleIds(currentUserId).then(setFavoriteIds).catch(() => {});
    }
  }, [currentUserId]);

  useEffect(() => {
    setLoadingPosts(true);
    getPosts()
      .then((data) => setPosts(data.filter((p) => p.status === 'published')))
      .catch(() => {})
      .finally(() => setLoadingPosts(false));

    setLoadingPolls(true);
    getCitizenPolls()
      .then((data) => setPolls(data))
      .catch(() => {})
      .finally(() => setLoadingPolls(false));
  }, []);

  const handleVotePoll = async (pollId: string) => {
    const optionId = selectedPollOptions[pollId];
    if (!optionId || votedPolls[pollId] || votingPollId === pollId) return;
    setVotingPollId(pollId);
    try {
      let voterId = localStorage.getItem('jc_voter_device_id');
      if (!voterId) {
        voterId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem('jc_voter_device_id', voterId);
      }
      await voteInCitizenPoll(pollId, optionId, voterId);
      const nextVoted = { ...votedPolls, [pollId]: optionId };
      setVotedPolls(nextVoted);
      localStorage.setItem('jc_voted_polls_v1', JSON.stringify(nextVoted));
      const updated = await getCitizenPolls();
      setPolls(updated);
    } catch (e) {
      console.error('Error voting in poll:', e);
    } finally {
      setVotingPollId(null);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (!currentUserId) return;
    const updated = await toggleUserFavoriteArticle(currentUserId, articleId);
    setFavoriteIds(updated);
  };

  const handleTogglePostReaction = async (postId: string, type: ReactionType) => {
    const storageKey = `jc_reaction_post_${postId}`;
    const currentReaction = localStorage.getItem(storageKey) as ReactionType | null;
    const isCurrent = currentReaction === type;
    const nextReaction: ReactionType | null = isCurrent ? null : type;
    const prevReaction = currentReaction;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const reactions: ReactionsData = {
          yellow: post.reactions?.yellow || 0,
          blue: post.reactions?.blue || 0,
          red: post.reactions?.red || 0
        };
        if (prevReaction && reactions[prevReaction] > 0) {
          reactions[prevReaction] = Math.max(0, reactions[prevReaction] - 1);
        }
        if (nextReaction) {
          reactions[nextReaction] = (reactions[nextReaction] || 0) + 1;
        }
        return { ...post, reactions };
      })
    );

    if (nextReaction) {
      localStorage.setItem(storageKey, nextReaction);
    } else {
      localStorage.removeItem(storageKey);
    }

    try {
      const updated = await recordPostReaction(postId, nextReaction, prevReaction);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, reactions: updated } : post))
      );
    } catch {}
  };

  const handleSharePost = (post: EditorialPost) => {
    const text = `«${post.content.slice(0, 100)}...» - ${post.authorName} en DULIMA`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Publicación en DULIMA', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === 'published' || a.status === 'publicado'),
    [articles]
  );

  // Recommended / Featured publications
  const recommendedArticles = useMemo(() => {
    return [...publishedArticles]
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.views || 0) - (a.views || 0);
      })
      .slice(0, 3);
  }, [publishedArticles]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    if (selectedFormat === 'publicaciones_breves') return [];

    return publishedArticles
      .filter((article) => {
        if (onlyFavorites && !favoriteIds.includes(article.id)) {
          return false;
        }

        if (selectedFormat !== 'all') {
          const fmt = (article.format || 'opinion') as ArticleFormat;
          if (selectedFormat === 'publicaciones_audiovisuales') {
            if (fmt !== 'publicaciones_audiovisuales' && !article.videoUrl && !article.audioUrl) return false;
          } else if (fmt !== selectedFormat) {
            return false;
          }
        }

        if (selectedCategory !== 'all') {
          const matchesCategory =
            article.categoryId === selectedCategory ||
            article.categoryName.toLowerCase() === selectedCategory.toLowerCase();
          if (!matchesCategory) return false;
        }

        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchesTitle = article.title.toLowerCase().includes(query);
          const matchesAuthor = article.authorName?.toLowerCase().includes(query);
          const matchesSubtitle = article.subtitle?.toLowerCase().includes(query);
          const matchesContent = article.content?.toLowerCase().includes(query);
          const matchesCategory = article.categoryName.toLowerCase().includes(query);
          const matchesTags = article.tags?.some((t) => t.toLowerCase().includes(query));
          if (
            !matchesTitle &&
            !matchesAuthor &&
            !matchesSubtitle &&
            !matchesContent &&
            !matchesCategory &&
            !matchesTags
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') {
          return (b.views || 0) - (a.views || 0);
        }
        if (sortBy === 'featured') {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.views || 0) - (a.views || 0);
        }
        const dateA = new Date(a.publishedAt || a.createdAt).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [
    publishedArticles,
    selectedCategory,
    selectedFormat,
    searchTerm,
    sortBy,
    onlyFavorites,
    favoriteIds
  ]);

  // Filter brief posts when viewing 'all' or 'publicaciones_breves'
  const filteredPosts = useMemo(() => {
    if (selectedFormat !== 'all' && selectedFormat !== 'publicaciones_breves') return [];
    if (onlyFavorites) return [];
    return posts.filter((p) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, selectedFormat, searchTerm, onlyFavorites]);

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedFormat('all');
    setSearchTerm('');
    setSortBy('newest');
    setOnlyFavorites(false);
    setCurrentPage(1);
  };

  const activeCategoryObj = categories.find(
    (c) => c.slug === selectedCategory || c.id === selectedCategory
  );

  return (
    <div className="space-y-10">
      {/* Editorial Header with Tolima Identity */}
      <div className="bg-gradient-to-br from-[#f8f4ec] via-[#fcfbf9] to-[#f3efe4] dark:from-[#19161a] dark:via-[#151518] dark:to-[#18181c] border border-[#e5e1d5] dark:border-stone-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c] font-bold font-sans">
            <BookOpen className="w-4 h-4" />
            <span>Archivo Editorial Unificado · DULIMA Tolima</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#8c162a]" title="Vinotinto Tolima" />
            <span className="w-3 h-3 rounded-full bg-[#f2c94c]" title="Amarillo Dorado Tolima" />
            <span className="w-3 h-3 rounded-full bg-[#166534]" title="Verde Territorio" />
            <span className="w-3 h-3 rounded-full bg-[#1d4ed8]" title="Azul Equilibrio" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
          {selectedCategory !== 'all' && activeCategoryObj ? (
            <>
              Artículos y Publicaciones en{' '}
              <span className="text-[#8c162a] dark:text-[#f2c94c]">{activeCategoryObj.name}</span>
            </>
          ) : (
            'Artículos, Publicaciones y Encuestas'
          )}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base font-sans max-w-3xl leading-relaxed">
          {activeCategoryObj?.description ||
            'Centralizamos ensayos, noticias, opinión, análisis político, publicaciones breves y encuestas ciudadanas del Tolima y Colombia.'}
        </p>

        {/* Primary Section Tabs: Artículos | Publicaciones | Encuestas */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('articulos')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'articulos'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#8c162a] dark:hover:border-[#f2c94c]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Artículos ({publishedArticles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('publicaciones')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'publicaciones'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#8c162a] dark:hover:border-[#f2c94c]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Publicaciones ({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('encuestas')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'encuestas'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#8c162a] dark:hover:border-[#f2c94c]'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Encuestas ({polls.length})</span>
          </button>
        </div>
      </div>

      {/* Filter, Format & Search Bar (for Artículos & Publicaciones) */}
      {activeTab !== 'encuestas' && (
      <div className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Input (Title, Author, Keyword) */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, autor o palabra clave..."
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#fbfbf9] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort selector + Favorites toggle */}
          <div className="md:col-span-6 flex flex-wrap items-center justify-end gap-2">
            {hasAccount && (
              <button
                type="button"
                onClick={() => setOnlyFavorites((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors inline-flex items-center space-x-1.5 cursor-pointer ${
                  onlyFavorites
                    ? 'bg-[#9B1B30] text-white border-[#9B1B30] dark:bg-gold-500 dark:text-stone-950 dark:border-gold-500'
                    : 'bg-[#fbfbf9] dark:bg-[#252422] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-gold-400'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Guardados ({favoriteIds.length})</span>
              </button>
            )}

            <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 bg-[#fbfbf9] dark:bg-[#252422] p-1">
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                  sortBy === 'newest'
                    ? 'bg-[#121212] dark:bg-stone-700 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Más recientes</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                  sortBy === 'popular'
                    ? 'bg-[#121212] dark:bg-stone-700 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-gold-400" />
                <span>Más leídos</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy('featured')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                  sortBy === 'featured'
                    ? 'bg-[#121212] dark:bg-stone-700 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-gold-400" />
                <span>Destacados</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editorial Format Filter */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
            Formato:
          </span>
          {EDITORIAL_FORMATS.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSelectedFormat(fmt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#9B1B30] text-white dark:bg-gold-500 dark:text-stone-950'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" />
            Categorías:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#121212] dark:bg-stone-700 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            Todas ({publishedArticles.length})
          </button>
          {categories.map((cat) => {
            const count = publishedArticles.filter(
              (a) => a.categoryId === cat.slug || a.categoryName === cat.name
            ).length;
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-gold-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat.name} {count > 0 && <span className="opacity-75 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Recommended Publications (shown on default Artículos view) */}
      {activeTab === 'articulos' &&
        selectedFormat === 'all' &&
        selectedCategory === 'all' &&
        !searchTerm.trim() &&
        !onlyFavorites &&
        recommendedArticles.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-xl text-[#121212] dark:text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <span>Publicaciones Recomendadas</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedArticles.map((art) => (
                <div key={`rec_${art.id}`} className="relative group">
                  <ArticleCard article={art} onRead={onReadArticle} />
                  {hasAccount && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, art.id)}
                      title={
                        favoriteIds.includes(art.id)
                          ? 'Quitar de guardados'
                          : 'Guardar en favoritos'
                      }
                      className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                        favoriteIds.includes(art.id)
                          ? 'bg-[#9B1B30] text-white border-[#9B1B30]'
                          : 'bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:text-[#9B1B30]'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Articles Grid */}
      {activeTab === 'articulos' && selectedFormat !== 'publicaciones_breves' && (
        <section className="space-y-6">
          {paginatedArticles.length === 0 && filteredPosts.length === 0 ? (
            <div className="p-12 sm:p-16 text-center bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl shadow-xs space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white">
                No se encontraron publicaciones
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto font-sans">
                No hay artículos o publicaciones que coincidan con los criterios de búsqueda o filtros seleccionados.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2 rounded-lg bg-[#121212] dark:bg-gold-500 dark:text-stone-950 text-white hover:bg-gold-700 transition-colors text-xs uppercase font-semibold tracking-wider cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            </div>
          ) : (
            paginatedArticles.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedArticles.map((article) => (
                    <div key={article.id} className="relative flex flex-col">
                      <ArticleCard article={article} onRead={onReadArticle} />
                      {hasAccount && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, article.id)}
                          title={
                            favoriteIds.includes(article.id)
                              ? 'Quitar de guardados'
                              : 'Guardar en favoritos'
                          }
                          className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                            favoriteIds.includes(article.id)
                              ? 'bg-[#9B1B30] text-white border-[#9B1B30]'
                              : 'bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:text-[#9B1B30]'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredArticles.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )
          )}
        </section>
      )}

      {/* Commercial Ad Slots (Clearly separated from editorial journalism) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <AdSlotBanner placement="entre_articulos" />
        </div>
        <div className="lg:col-span-4">
          <AdSlotBanner placement="lateral_computadores" variant="sidebar" />
        </div>
      </div>

      {/* Brief Editorial Posts / Micro-Columns Feed */}
      {(activeTab === 'publicaciones' ||
        (activeTab === 'articulos' &&
          (selectedFormat === 'all' || selectedFormat === 'publicaciones_breves') &&
          filteredPosts.length > 0)) && (
          <section className="space-y-6 pt-4 border-t border-[#e5e1d5] dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#9B1B30] dark:text-gold-400 font-semibold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Notas Inmediatas & Micro-Columnas</span>
                </div>
                <h2 className="font-serif font-bold text-2xl text-[#121212] dark:text-white">
                  Publicaciones Breves
                </h2>
              </div>
            </div>

            {loadingPosts ? (
              <div className="py-10 text-center text-xs text-stone-500">
                Cargando publicaciones breves...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => {
                  const userReaction = localStorage.getItem(
                    `jc_reaction_post_${post.id}`
                  ) as ReactionType | null;
                  const ownerBadge = isOwnerAuthor(undefined, undefined, post.authorName);

                  return (
                    <article
                      key={post.id}
                      className="p-6 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAuthor({
                                name: post.authorName,
                                role: ownerBadge ? 'owner' : 'collaborator',
                                photo: post.authorPhoto || profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT
                              })
                            }
                            className="flex items-center space-x-3 text-left group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-500 shrink-0 bg-stone-100">
                              <img
                                src={post.authorPhoto || profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT}
                                alt={post.authorName}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:underline">
                                  {post.authorName}
                                </span>
                                {ownerBadge && <OwnerVerifiedBadge size="sm" />}
                              </div>
                              <span className="text-[11px] text-stone-400 font-sans block">
                                {new Date(post.createdAt).toLocaleDateString('es-CO', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSharePost(post)}
                            className="p-2 rounded-lg text-stone-400 hover:text-gold-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title="Compartir publicación"
                          >
                            {copiedId === post.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <p className="text-sm sm:text-base font-serif text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {post.imageUrl && (
                          <figure className="rounded-xl overflow-hidden border border-[#eeeae1] dark:border-stone-800 bg-stone-100 dark:bg-stone-800">
                            <img
                              src={post.imageUrl}
                              alt="Fotografía adjunta"
                              loading="lazy"
                              className="w-full h-auto max-h-72 object-cover"
                            />
                          </figure>
                        )}
                      </div>

                      {/* 3 Reactions: Amarillo (Me gustó), Azul (No me gustó), Rojo (Me hizo enojar) */}
                      <div className="pt-3 border-t border-[#eeeae1] dark:border-stone-800 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePostReaction(post.id, 'yellow')}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              userReaction === 'yellow'
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-50'
                            }`}
                            title="Me gustó"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                userReaction === 'yellow'
                                  ? 'fill-stone-950'
                                  : 'fill-amber-500 text-amber-500'
                              }`}
                            />
                            <span>{post.reactions?.yellow || 0}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePostReaction(post.id, 'blue')}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              userReaction === 'blue'
                                ? 'bg-sky-600 text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-sky-50'
                            }`}
                            title="No me gustó"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                userReaction === 'blue'
                                  ? 'fill-white'
                                  : 'fill-sky-500 text-sky-500'
                              }`}
                            />
                            <span>{post.reactions?.blue || 0}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePostReaction(post.id, 'red')}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              userReaction === 'red'
                                ? 'bg-rose-600 text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-rose-50'
                            }`}
                            title="Me hizo enojar"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                userReaction === 'red'
                                  ? 'fill-white'
                                  : 'fill-rose-500 text-rose-500'
                              }`}
                            />
                            <span>{post.reactions?.red || 0}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAuthor({
                              name: post.authorName,
                              role: ownerBadge ? 'owner' : 'collaborator',
                              photo: post.authorPhoto || profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT
                            })
                          }
                          className="text-[11px] font-semibold text-stone-500 hover:text-[#9B1B30] dark:hover:text-gold-400 inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <UserIcon className="w-3 h-3" />
                          <span>Perfil</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

      {/* ENCUESTAS CIUDADANAS TAB */}
      {activeTab === 'encuestas' && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e1d5] dark:border-stone-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c] font-bold">
                <BarChart2 className="w-4 h-4" />
                <span>Participación Ciudadana · Tolima y Colombia</span>
              </div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#121212] dark:text-white">
                Encuestas y Consultas Abiertas
              </h2>
            </div>

            {onNavigate && (isAdmin || isCollaborator || isSubscriber) && (
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    isAdmin
                      ? 'admin'
                      : isCollaborator
                      ? 'collaborator-panel'
                      : 'subscriber-panel'
                  )
                }
                className="btn-dulima-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Crear o gestionar encuestas</span>
              </button>
            )}
          </div>

          {loadingPolls ? (
            <div className="py-12 text-center text-sm text-stone-500">
              Cargando encuestas ciudadanas...
            </div>
          ) : polls.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl space-y-3">
              <BarChart2 className="w-10 h-10 mx-auto text-[#8c162a] dark:text-[#f2c94c] opacity-70" />
              <h3 className="font-serif text-xl font-bold text-[#121212] dark:text-white">
                No hay encuestas publicadas en este momento
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Cuando el equipo editorial o los suscriptores autorizados publiquen nuevas consultas ciudadanas, aparecerán aquí para que puedas participar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...polls]
                .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
                .map((poll) => {
                  const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes || 0), 0);
                  const userChoice = votedPolls[poll.id];
                  const pendingChoice = selectedPollOptions[poll.id];
                  const creatorDisplayName = poll.creatorName || profile?.name || 'Julian Camilo';
                  const nowMs = Date.now();
                  const isScheduled =
                    poll.status === 'borrador' ||
                    (poll.publishedAt && new Date(poll.publishedAt).getTime() > nowMs);
                  const isClosed =
                    poll.status === 'cerrada' ||
                    (poll.closesAt && new Date(poll.closesAt).getTime() < nowMs);
                  const showResults = Boolean(userChoice) || Boolean(isClosed);

                  return (
                    <article
                      key={poll.id}
                      className={`bg-white dark:bg-[#18181c] border rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between transition-all ${
                        poll.featured
                          ? 'border-[#f2c94c] ring-1 ring-[#f2c94c]/30'
                          : 'border-[#e8e5dc] dark:border-stone-800'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Creator Header & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAuthor({
                                name: creatorDisplayName,
                                email: poll.creatorEmail,
                                role: poll.creatorRole || 'owner',
                                photo: poll.creatorPhotoUrl || profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT
                              })
                            }
                            className="inline-flex items-center space-x-2.5 text-left group cursor-pointer"
                            title="Ver perfil público del creador"
                          >
                            {poll.creatorPhotoUrl ? (
                              <img
                                src={poll.creatorPhotoUrl}
                                alt={creatorDisplayName}
                                className="w-9 h-9 rounded-full object-cover border border-[#f2c94c]/60"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#8c162a]/15 dark:bg-[#f2c94c]/20 text-[#8c162a] dark:text-[#f2c94c] flex items-center justify-center font-serif font-bold text-sm">
                                {creatorDisplayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-[#8c162a] dark:group-hover:text-[#f2c94c] transition-colors block">
                                {creatorDisplayName}
                              </span>
                              <span className="text-[11px] text-stone-500 dark:text-stone-400 inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(poll.publishedAt || poll.createdAt).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                                {poll.closesAt && (
                                  <span>
                                    · Cierra:{' '}
                                    {new Date(poll.closesAt).toLocaleDateString('es-CO', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                )}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-2">
                            {poll.featured && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f2c94c]/25 text-[#886514] dark:text-[#f2c94c]">
                                ★ Destacada
                              </span>
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isClosed
                                  ? 'bg-[#8c162a]/15 text-[#8c162a] dark:bg-rose-950/60 dark:text-rose-300'
                                  : isScheduled
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {isClosed ? 'Finalizada' : isScheduled ? 'Programada' : 'Activa'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Main Question */}
                        <div className="space-y-1.5">
                          {poll.title && (
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c] block">
                              {poll.title}
                            </span>
                          )}
                          <h3 className="font-serif font-bold text-lg sm:text-xl text-[#121212] dark:text-white leading-snug">
                            {poll.question}
                          </h3>
                          {poll.description && (
                            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                              {poll.description}
                            </p>
                          )}
                        </div>

                        {/* Options & Results */}
                        <div className="space-y-2.5">
                          {poll.options.map((opt) => {
                            const pct =
                              totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                            const isVoted = userChoice === opt.id;
                            const isPicked = pendingChoice === opt.id;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={Boolean(userChoice) || Boolean(isClosed) || Boolean(isScheduled) || votingPollId === poll.id}
                                onClick={() =>
                                  setSelectedPollOptions((prev) => ({ ...prev, [poll.id]: opt.id }))
                                }
                                className={`w-full text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                                  isVoted || isPicked
                                    ? 'border-[#8c162a] dark:border-[#f2c94c] bg-[#8c162a]/5 dark:bg-[#f2c94c]/10'
                                    : 'border-stone-200 dark:border-stone-800 hover:border-[#8c162a]/60 dark:hover:border-[#f2c94c]/60 bg-[#faf9f6] dark:bg-stone-900'
                                } ${
                                  userChoice || isClosed || isScheduled ? 'cursor-default' : 'cursor-pointer'
                                }`}
                              >
                                {showResults && (
                                  <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8c162a]/15 to-[#f2c94c]/25 dark:from-[#f2c94c]/20 dark:to-[#8c162a]/20 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                )}
                                <div className="relative flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-[#121212] dark:text-white">
                                  <span className="flex items-center space-x-2">
                                    {(isVoted || isPicked) && (
                                      <CheckCircle2 className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c] shrink-0" />
                                    )}
                                    <span>{opt.text}</span>
                                  </span>
                                  {showResults && (
                                    <span className="font-mono text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] shrink-0">
                                      {pct}% ({opt.votes || 0})
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer: Participant count + Participate button */}
                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                          Participantes:{' '}
                          <strong className="text-stone-900 dark:text-white">{totalVotes}</strong>
                        </span>

                        {!userChoice && !isClosed && !isScheduled ? (
                          <button
                            type="button"
                            disabled={!pendingChoice || votingPollId === poll.id}
                            onClick={() => handleVotePoll(poll.id)}
                            className="btn-dulima-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {votingPollId === poll.id ? 'Registrando...' : 'Participar'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-[#166534] dark:text-emerald-400">
                            {userChoice
                              ? '✓ Participación registrada'
                              : isClosed
                              ? 'Consulta finalizada'
                              : 'Próximamente'}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {/* Author Public Profile Modal */}
      {selectedAuthor && (
        <AuthorPublicProfileModal
          isOpen={Boolean(selectedAuthor)}
          onClose={() => setSelectedAuthor(null)}
          authorName={selectedAuthor.name}
          articles={publishedArticles}
          onReadArticle={onReadArticle}
        />
      )}
    </div>
  );
};
