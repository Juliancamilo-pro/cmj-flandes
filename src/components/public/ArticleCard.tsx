import React from 'react';
import { Clock, Eye, Calendar, ArrowRight } from 'lucide-react';
import { Article } from '../../types';
import { ColombianVerifiedBadge } from '../common/ColombianVerifiedBadge';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../common/OwnerVerifiedBadge';
import { useAuthorDirectory } from '../../hooks/useVerifiedAuthors';

interface ArticleCardProps {
  article: Article;
  onRead: (slug: string) => void;
  featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onRead, featured = false }) => {
  const { isVerifiedAuthor } = useAuthorDirectory();
  const verified = isVerifiedAuthor(article.authorEmail, article.authorName);
  const formattedDate = article.publishedAt
    ? new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(article.publishedAt))
    : new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(article.createdAt));

  if (featured) {
    return (
      <article className="group relative bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Large Cover Image */}
        <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto overflow-hidden bg-stone-100 dark:bg-stone-800">
          <img
            src={article.coverImageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200'}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 bg-[#121212]/90 backdrop-blur-xs text-gold-400 text-xs font-semibold uppercase tracking-wider rounded-full shadow-md">
              {article.categoryName}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
        </div>

        {/* Content */}
        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-white dark:bg-[#18181c]">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-xs text-stone-500 dark:text-stone-400 font-sans">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-gold-600" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-gold-600" />
                {article.readingMinutes || 5} min de lectura
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Eye className="w-3.5 h-3.5 mr-1 text-gold-600" />
                {article.views || 0}
              </span>
            </div>

            <h2 
              onClick={() => onRead(article.slug || article.id)}
              className="text-2xl sm:text-3xl font-bold font-serif text-[#121212] dark:text-white group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors leading-tight cursor-pointer"
            >
              {article.title}
            </h2>

            {article.subtitle && (
              <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed line-clamp-3 font-sans">
                {article.subtitle}
              </p>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="text-xs font-medium text-stone-900 dark:text-stone-200 inline-flex items-center space-x-1">
              <span>Por</span>
              <span className="font-semibold text-[#121212] dark:text-white">{article.authorName || 'Julian Camilo'}</span>
              {isOwnerAuthor(article.authorEmail, article.authorRole, article.authorName) ? (
                <OwnerVerifiedBadge size="sm" />
              ) : (
                verified && <ColombianVerifiedBadge size="sm" />
              )}
            </div>
            <button
              onClick={() => onRead(article.slug || article.id)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-900 dark:text-gold-400 hover:text-gold-700 transition-colors group-hover:translate-x-1 duration-200 cursor-pointer"
            >
              <span>Leer artículo</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold-600" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Cover image */}
      <div 
        onClick={() => onRead(article.slug || article.id)}
        className="relative h-48 sm:h-52 overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer"
      >
        <img
          src={article.coverImageUrl || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800'}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-0.5 bg-[#121212]/90 backdrop-blur-sm text-gold-400 text-[11px] font-semibold uppercase tracking-wider rounded-full shadow-sm">
            {article.categoryName}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2 text-[11px] text-stone-500 dark:text-stone-400 font-sans">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-gold-600" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1 text-gold-600" />
              {article.readingMinutes || 4} min
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1 text-gold-600" />
              {article.views || 0}
            </span>
          </div>

          <h3
            onClick={() => onRead(article.slug || article.id)}
            className="text-lg sm:text-xl font-bold font-serif text-[#121212] dark:text-white group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors leading-snug cursor-pointer line-clamp-2"
          >
            {article.title}
          </h3>

          {article.subtitle && (
            <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed line-clamp-2 font-sans">
              {article.subtitle}
            </p>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans inline-flex items-center space-x-1">
            <span>{article.authorName || 'Julian Camilo'}</span>
            {isOwnerAuthor(article.authorEmail, article.authorRole, article.authorName) ? (
              <OwnerVerifiedBadge size="sm" />
            ) : (
              verified && <ColombianVerifiedBadge size="sm" />
            )}
          </span>
          <button
            onClick={() => onRead(article.slug || article.id)}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-stone-900 dark:text-gold-400 group-hover:text-gold-700 transition-colors cursor-pointer"
          >
            <span>Leer</span>
            <ArrowRight className="w-3 h-3 text-gold-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  );
};
