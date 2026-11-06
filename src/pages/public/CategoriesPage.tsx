import React from 'react';
import { Tag, ArrowRight, BookOpen } from 'lucide-react';
import { Category, Article } from '../../types';

interface CategoriesPageProps {
  categories: Category[];
  articles: Article[];
  onSelectCategory: (categorySlug: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  articles,
  onSelectCategory
}) => {
  const publishedArticles = articles.filter(a => a.status === 'published' || a.status === 'publicado');

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="border-b border-[#e5e1d5] dark:border-stone-800 pb-8 space-y-3">
        <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-semibold font-sans">
          <Tag className="w-4 h-4" />
          <span>Ejes Temáticos</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
          Líneas Editoriales & Categorías
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base font-sans max-w-2xl leading-relaxed">
          Explora los artículos, opiniones y ensayos clasificados por sus grandes campos de reflexión y coyuntura.
        </p>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const catArticles = publishedArticles.filter(
            a => a.categoryId === cat.slug || a.categoryName.toLowerCase() === cat.name.toLowerCase()
          );

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="group bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 hover:border-gold-500 dark:hover:border-gold-500 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-3 h-3 rounded-full bg-gold-500"></span>
                  <span className="text-xs font-semibold font-sans text-stone-500 dark:text-stone-400 bg-[#f4f2ec] dark:bg-stone-800 px-3 py-1 rounded-full">
                    {catArticles.length} {catArticles.length === 1 ? 'publicación' : 'publicaciones'}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold font-serif text-[#121212] dark:text-[#f3ede2] group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-stone-600 dark:text-stone-400 text-sm font-sans mt-2 leading-relaxed">
                    {cat.description || `Explora todos los análisis y columnas sobre ${cat.name}.`}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-semibold text-stone-900 dark:text-stone-300 group-hover:text-gold-700 dark:group-hover:text-gold-400">
                <span className="uppercase tracking-wider">Ver publicaciones</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
