import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Star, 
  Share2, 
  Calendar, 
  Tag, 
  Check, 
  Copy,
  Clock
} from 'lucide-react';
import { EditorialPost, Profile, ReactionType, ArticleReactions as ReactionsData } from '../../types';
import { getPosts, recordPostReaction, OFFICIAL_AUTHOR_PORTRAIT } from '../../services/db';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../../components/common/OwnerVerifiedBadge';

interface PostsPageProps {
  profile: Profile | null;
}

export const PostsPage: React.FC<PostsPageProps> = ({ profile }) => {
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts();
      setPosts(data.filter(p => p.status === 'published'));
    } catch (e) {
      console.error('Error fetching posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReaction = async (postId: string, type: ReactionType) => {
    const storageKey = `jc_reaction_post_${postId}`;
    const currentReaction = localStorage.getItem(storageKey) as ReactionType | null;

    const isCurrent = currentReaction === type;
    const nextReaction: ReactionType | null = isCurrent ? null : type;
    const prevReaction = currentReaction;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const reactions: ReactionsData = {
          yellow: post.reactions?.yellow || 0,
          blue: post.reactions?.blue || 0,
          red: post.reactions?.red || 0,
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
    } catch (e) {
      console.warn('Reaction record notice:', e);
    }
  };

  const handleShare = (post: EditorialPost) => {
    const text = `«${post.content.slice(0, 100)}...» - Julian Camilo`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Publicación de Julian Camilo', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-12 space-y-10">
      {/* Editorial Header */}
      <header className="text-center space-y-4 max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-50 dark:bg-gold-950/40 border border-gold-200 dark:border-gold-800 text-gold-800 dark:text-gold-300 text-xs font-semibold uppercase tracking-wider font-sans">
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          <span>Notas Inmediatas & Micro-Columnas</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-serif text-[#121212] dark:text-[#f3ede2] leading-tight">
          Publicaciones Rápidas
        </h1>

        <p className="text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
          Pensamientos de coyuntura, observaciones del debate público y apuntes espontáneos compartidos directamente por Julian Camilo.
        </p>

        {/* Colombian Flag Bar */}
        <div className="h-1.5 w-20 mx-auto rounded-full overflow-hidden flex shadow-sm">
          <div className="bg-[#FCD116] w-1/2 h-full" />
          <div className="bg-[#003893] w-1/4 h-full" />
          <div className="bg-[#CE1126] w-1/4 h-full" />
        </div>
      </header>

      {/* Posts Feed */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif italic text-stone-500 text-sm">Cargando publicaciones...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-[#1b1a18] rounded-3xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm">
          <MessageSquare className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
          <h3 className="font-serif font-bold text-xl text-stone-800 dark:text-stone-200">
            Aún no hay publicaciones recientes
          </h3>
          <p className="text-xs text-stone-500 font-sans max-w-sm mx-auto">
            Julian Camilo compartirá pronto sus notas editoriales breves y análisis de actualidad.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const userReaction = localStorage.getItem(`jc_reaction_post_${post.id}`) as ReactionType | null;

            return (
              <article
                key={post.id}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 shadow-sm space-y-5 hover:border-gold-400 transition-all"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gold-500 shrink-0 bg-stone-100">
                      <img
                        src={post.authorPhoto || profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT}
                        alt={post.authorName}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                          {post.authorName}
                        </span>
                        {isOwnerAuthor(undefined, undefined, post.authorName) && (
                          <OwnerVerifiedBadge size="sm" />
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400 font-sans block">
                        {new Date(post.createdAt).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="p-2 rounded-xl text-stone-400 hover:text-gold-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    title="Compartir publicación"
                  >
                    {copiedId === post.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Content */}
                <p className="text-base sm:text-lg font-serif text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Attached Image */}
                {post.imageUrl && (
                  <figure className="rounded-2xl overflow-hidden border border-[#eeeae1] dark:border-stone-800 bg-stone-100 dark:bg-stone-800">
                    <img
                      src={post.imageUrl}
                      alt="Fotografía adjunta"
                      loading="lazy"
                      className="w-full h-auto max-h-[480px] object-cover"
                    />
                    {post.imageCaption && (
                      <figcaption className="text-xs text-stone-500 italic p-2.5 text-center bg-stone-50 dark:bg-stone-900 font-sans">
                        {post.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-semibold text-gold-700 dark:text-gold-400 bg-gold-50 dark:bg-gold-950/40 px-2.5 py-0.5 rounded-lg font-sans"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tricolor Reactions Bar */}
                <div className="pt-4 border-t border-[#eeeae1] dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Estrella Amarilla */}
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(post.id, 'yellow')}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userReaction === 'yellow'
                          ? 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30'
                      }`}
                      title="Me gustó (Estrella amarilla)"
                    >
                      <Star className={`w-3.5 h-3.5 ${userReaction === 'yellow' ? 'fill-stone-950' : 'fill-amber-500 text-amber-500'}`} />
                      <span>{post.reactions?.yellow || 0}</span>
                    </button>

                    {/* Estrella Azul */}
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(post.id, 'blue')}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userReaction === 'blue'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30'
                      }`}
                      title="No me gustó (Estrella azul)"
                    >
                      <Star className={`w-3.5 h-3.5 ${userReaction === 'blue' ? 'fill-white' : 'fill-blue-600 text-blue-600'}`} />
                      <span>{post.reactions?.blue || 0}</span>
                    </button>

                    {/* Estrella Roja */}
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(post.id, 'red')}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userReaction === 'red'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30'
                      }`}
                      title="Me hizo enojar (Estrella roja)"
                    >
                      <Star className={`w-3.5 h-3.5 ${userReaction === 'red' ? 'fill-white' : 'fill-rose-600 text-rose-600'}`} />
                      <span>{post.reactions?.red || 0}</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-stone-400 font-sans hidden sm:inline">
                    Reacciones colombianas
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
