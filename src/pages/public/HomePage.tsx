import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Compass, 
  Award, 
  Send,
  History
} from 'lucide-react';
import { Article, Category, Profile, PlatformUpdate } from '../../types';
import { ArticleCard } from '../../components/public/ArticleCard';
import { AdSlotBanner } from '../../components/public/AdSlotBanner';
import { EditorialHubSection } from '../../components/public/EditorialHubSection';
import { getPlatformUpdates } from '../../services/db';

interface HomePageProps {
  profile: Profile;
  articles: Article[];
  categories: Category[];
  onNavigate: (view: string, param?: string) => void;
  onReadArticle: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  profile,
  articles,
  categories,
  onNavigate,
  onReadArticle
}) => {
  const [latestUpdate, setLatestUpdate] = useState<PlatformUpdate | null>(null);

  useEffect(() => {
    getPlatformUpdates()
      .then((items) => {
        const featured = items.find((i) => i.featured) || items[0];
        if (featured) setLatestUpdate(featured);
      })
      .catch(() => {});
  }, []);

  // Only published articles are shown publicly
  const publishedArticles = articles.filter(a => a.status === 'published' || a.status === 'publicado');
  const featuredArticle = publishedArticles.find(a => a.featured) || publishedArticles[0];
  const secondaryArticles = publishedArticles
    .filter(a => a.id !== featuredArticle?.id)
    .slice(0, 6);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO & PRESENTATION SECTION */}
      <section className="relative pt-6 sm:pt-10">
        <div className="bg-gradient-to-b from-[#f4f1ea] dark:from-[#18181c] to-transparent rounded-2xl p-6 sm:p-12 border border-[#e5e1d5] dark:border-stone-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Presentation Text */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#8c162a] text-[#f2c94c] text-xs font-bold uppercase tracking-widest shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Espacio Editorial & Análisis Crítico • Tolima · Colombia</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif text-[#121212] dark:text-white tracking-tight leading-[1.1]">
                {profile.name || 'JULIAN CAMILO'}
              </h1>

              <p className="text-xl sm:text-2xl font-serif italic text-[#8c162a] dark:text-[#f2c94c] font-semibold">
                "{profile.motto || 'La voz del territorio. El poder de las ideas'}"
              </p>

              <p className="text-stone-700 dark:text-stone-300 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
                {profile.bio || 'Espacio de reflexión independiente dedicado al análisis político, los dilemas contemporáneos de la sociedad, la cultura cívica y las ideas que configuran nuestro tiempo.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => onNavigate('articles')}
                  className="btn-dulima-primary"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explorar Publicaciones</span>
                </button>
                <button
                  onClick={() => onNavigate('encuestas')}
                  className="btn-dulima-secondary"
                >
                  <Compass className="w-4 h-4 text-[#166534] dark:text-emerald-400" />
                  <span>Encuestas Ciudadanas</span>
                </button>
                <button
                  onClick={() => onNavigate('about')}
                  className="btn-dulima-secondary"
                >
                  <span>Conocer Trayectoria</span>
                  <ArrowRight className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
                </button>
              </div>
            </div>

            {/* Profile Portrait */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#8c162a] via-[#f2c94c] to-[#166534] rounded-2xl blur-xs opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-2xl overflow-hidden border-2 border-white dark:border-stone-700 shadow-2xl bg-stone-200 dark:bg-stone-800">
                  <img
                    src={profile.photoUrl || '/assets/julian_camilo.jpeg'}
                    alt={profile.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                    <p className="text-sm font-semibold tracking-wide font-sans">{profile.name}</p>
                    <p className="text-xs text-gold-300 font-serif italic">{profile.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Principal Publicitario (no intrusivo) */}
      <AdSlotBanner placement="banner_principal" />

      {/* 2. ARTÍCULO DESTACADO (FEATURED ARTICLE) */}
      {featuredArticle && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#121212] dark:text-white uppercase tracking-wide">
                Artículo Destacado
              </h2>
            </div>
            <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-semibold font-sans">
              Lectura Recomendada
            </span>
          </div>

          <ArticleCard
            article={featuredArticle}
            onRead={onReadArticle}
            featured={true}
          />
        </section>
      )}

      {/* 3. ÚLTIMAS PUBLICACIONES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#121212] dark:text-white uppercase tracking-wide">
              Últimas Publicaciones
            </h2>
          </div>
          {publishedArticles.length > 0 && (
            <button
              onClick={() => onNavigate('articles')}
              className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 hover:text-gold-700 dark:hover:text-gold-400 transition-colors"
            >
              <span>Ver todo el archivo ({publishedArticles.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold-600" />
            </button>
          )}
        </div>

        {secondaryArticles.length === 0 && !featuredArticle ? (
          <div className="p-12 text-center bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl shadow-xs text-stone-500 space-y-2">
            <BookOpen className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="font-serif italic text-lg text-stone-800 dark:text-stone-200">
              Aún no hay publicaciones disponibles.
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Julian Camilo publicará próximamente sus columnas y ensayos de opinión.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {secondaryArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onRead={onReadArticle}
              />
            ))}
          </div>
        )}
      </section>

      {/* Banner Secundario Publicitario */}
      <AdSlotBanner placement="banner_secundario" />

      {/* 4. EXPLORADOR DE CATEGORÍAS */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-[#e5e1d5] dark:border-stone-800 pb-3">
          <Compass className="w-5 h-5 text-gold-600 dark:text-gold-400" />
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#121212] dark:text-white uppercase tracking-wide">
            Líneas de Análisis & Categorías
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('articles', cat.slug)}
              className="group p-5 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl hover:border-gold-500 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold-500"></span>
                  <span className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-sans font-bold">
                    Columna
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#121212] dark:text-white group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-sans line-clamp-2 leading-relaxed">
                  {cat.description || `Artículos y opiniones de ${cat.name}.`}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 group-hover:text-gold-700">
                <span className="font-sans font-medium">Ver artículos</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. NOVEDADES Y ACTUALIZACIONES DE LA PLATAFORMA */}
      {latestUpdate && (
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-[#18181c] to-[#121214] text-white border border-gold-500/30 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gold-400 text-stone-950 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Novedad de la Plataforma</span>
                </span>
                {latestUpdate.versionTag && (
                  <span className="text-[11px] font-mono text-gold-400 font-bold">
                    {latestUpdate.versionTag}
                  </span>
                )}
                <span className="text-xs text-stone-400 font-sans">
                  {new Date(latestUpdate.date).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-white leading-snug">
                {latestUpdate.title}
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans line-clamp-2 leading-relaxed">
                {latestUpdate.summary}
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('actualizaciones', latestUpdate.slug)}
                className="px-4 py-2.5 rounded-xl bg-gold-500 text-stone-950 font-sans text-xs font-bold hover:bg-gold-400 transition-colors inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <span>Conocer Novedad</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 6. SOBRE EL AUTOR SNAPSHOT */}
      <section className="bg-stone-900 dark:bg-[#0c0c0e] text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden border border-stone-800">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none font-serif font-black text-9xl uppercase select-none text-white">
          JC
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-8 space-y-4">
            <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold font-sans">
              Perfil del Autor
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white">
              Voz y Perspectiva en el Debate Público
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-sans max-w-2xl">
              Un compromiso constante con el rigor argumentativo, la independencia crítica y el análisis profundo de los problemas que definen el rumbo de Colombia.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('about')}
                className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 font-sans text-xs uppercase tracking-wider font-bold transition-all inline-flex items-center space-x-2 cursor-pointer"
              >
                <span>Leer Biografía Completa y Formación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="md:col-span-4 flex flex-col items-center md:items-end space-y-2">
            <p className="font-serif italic text-gold-300 text-sm text-center md:text-right">
              "{profile.motto || 'Ideas que merecen ser leídas'}"
            </p>
            <p className="text-xs text-stone-300 font-sans">
              {profile.location || 'Bogotá, Colombia'}
            </p>
          </div>
        </div>
      </section>
      {/* 7. PULSO EDITORIAL: TENDENCIAS, ENCUESTAS, AGENDA Y AUTORES */}
      <EditorialHubSection
        articles={articles}
        onReadArticle={onReadArticle}
      />

      {/* 8. SECCIÓN DE PATROCINADORES */}
      <AdSlotBanner placement="seccion_patrocinadores" variant="sponsors" />
    </div>
  );
};
