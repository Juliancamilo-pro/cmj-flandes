import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Tag, 
  Search, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Palette, 
  Bug, 
  Cpu, 
  FileEdit, 
  UserCheck,
  ChevronRight,
  ExternalLink,
  Share2
} from 'lucide-react';
import { PlatformUpdate, PlatformUpdateCategory } from '../../types';
import { getPlatformUpdates } from '../../services/db';

interface UpdatesPageProps {
  initialSlug?: string;
  onSelectUpdateSlug?: (slug: string) => void;
}

export const CATEGORY_METADATA: Record<PlatformUpdateCategory, { label: string; icon: any; color: string; badge: string }> = {
  nuevas_funcionalidades: { 
    label: 'Nuevas Funcionalidades', 
    icon: Sparkles, 
    color: 'text-amber-600', 
    badge: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-gold-300 border-amber-300 dark:border-amber-800' 
  },
  mejoras_diseno: { 
    label: 'Mejoras de Diseño', 
    icon: Palette, 
    color: 'text-purple-600', 
    badge: 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800' 
  },
  seguridad: { 
    label: 'Seguridad', 
    icon: ShieldCheck, 
    color: 'text-emerald-600', 
    badge: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
  },
  correccion_errores: { 
    label: 'Corrección de Errores', 
    icon: Bug, 
    color: 'text-rose-600', 
    badge: 'bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-800' 
  },
  rendimiento: { 
    label: 'Rendimiento', 
    icon: Zap, 
    color: 'text-sky-600', 
    badge: 'bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 border-sky-300 dark:border-sky-800' 
  },
  cambios_publicaciones: { 
    label: 'Cambios en Artículos', 
    icon: FileEdit, 
    color: 'text-stone-700', 
    badge: 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-200 border-stone-300 dark:border-stone-700' 
  },
  experiencia_usuario: { 
    label: 'Experiencia de Usuario', 
    icon: UserCheck, 
    color: 'text-teal-600', 
    badge: 'bg-teal-100 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300 border-teal-300 dark:border-teal-800' 
  }
};

export const UpdatesPage: React.FC<UpdatesPageProps> = ({
  initialSlug,
  onSelectUpdateSlug
}) => {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalUpdate, setActiveModalUpdate] = useState<PlatformUpdate | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPlatformUpdates()
      .then((items) => {
        if (!mounted) return;
        setUpdates(items);
        if (initialSlug) {
          const match = items.find((u) => u.slug === initialSlug || u.id === initialSlug);
          if (match) setActiveModalUpdate(match);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [initialSlug]);

  // Filter updates
  const filteredUpdates = updates.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchSummary || matchTags;
    }
    return true;
  });

  const featuredUpdate = updates.find((u) => u.featured) || updates[0];

  const handleOpenDetail = (update: PlatformUpdate) => {
    setActiveModalUpdate(update);
    if (onSelectUpdateSlug) {
      onSelectUpdateSlug(update.slug);
    }
    window.location.hash = `actualizaciones/${update.slug}`;
  };

  const handleCloseDetail = () => {
    setActiveModalUpdate(null);
    window.location.hash = 'actualizaciones';
  };

  // Render markdown-like sections inside modal
  const renderDetailContent = (content: string) => {
    const blocks = content.split('\n\n');
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 pt-3 pb-1 border-b border-stone-200 dark:border-stone-800">
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 pt-4 pb-1">
            {trimmed.replace(/^##\s+/, '')}
          </h2>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').filter((l) => l.trim());
        return (
          <ul key={idx} className="space-y-1.5 list-disc list-inside text-stone-700 dark:text-stone-300 font-sans text-sm pl-2">
            {items.map((it, i) => (
              <li key={i}>{it.replace(/^[-*]\s+/, '')}</li>
            ))}
          </ul>
        );
      }

      return (
        <p key={idx} className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-sans">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Editorial Header with Colombian / Tolima Identity */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gold-100/70 dark:bg-stone-800 border border-gold-300 dark:border-stone-700 text-gold-900 dark:text-gold-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-gold-600" />
          <span>Historial Público de Innovación & Mejoras</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-serif text-[#121212] dark:text-[#f3ede2] tracking-tight">
          Actualizaciones de la Plataforma
        </h1>

        <p className="text-stone-600 dark:text-stone-300 font-serif italic text-base sm:text-lg leading-relaxed">
          Consulta en tiempo real cada avance, nueva herramienta editorial, optimización de velocidad y refuerzo de seguridad implementado en el portal de Julian Camilo.
        </p>
      </div>

      {/* Featured Banner (if any item is marked featured) */}
      {featuredUpdate && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1a1917] via-[#141416] to-[#0c0c0e] text-white border border-gold-500/40 shadow-xl relative overflow-hidden">
          {/* Subtle Colombian Ribbon in upper corner */}
          <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-r from-gold-400 via-sky-600 to-rose-600" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {featuredUpdate.imageUrl && (
              <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-4/3 border border-stone-800 shadow-md">
                <img
                  src={featuredUpdate.imageUrl}
                  alt={featuredUpdate.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-gold-500 text-stone-950 text-[10px] font-bold uppercase tracking-wider">
                  Novedad Destacada
                </div>
              </div>
            )}

            <div className={`space-y-3 ${featuredUpdate.imageUrl ? 'md:col-span-2' : 'md:col-span-3'}`}>
              <div className="flex flex-wrap items-center gap-2">
                {featuredUpdate.versionTag && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/40 text-xs font-mono font-bold">
                    {featuredUpdate.versionTag}
                  </span>
                )}
                <span className="text-xs font-sans text-stone-400 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-gold-400" />
                  {new Date(featuredUpdate.date).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-xs text-stone-500">•</span>
                <span className="text-xs font-semibold text-gold-300 font-sans">
                  {CATEGORY_METADATA[featuredUpdate.category]?.label || 'Actualización'}
                </span>
              </div>

              <h2 className="font-serif font-black text-2xl sm:text-3xl text-white leading-snug">
                {featuredUpdate.title}
              </h2>

              <p className="text-stone-300 font-sans text-sm sm:text-base leading-relaxed line-clamp-3">
                {featuredUpdate.summary}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(featuredUpdate)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-stone-950 text-xs font-bold hover:scale-103 transition-transform shadow-md cursor-pointer"
                >
                  <span>Conocer todos los detalles y beneficios</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por palabra clave o etiqueta..."
              className="w-full pl-9 pr-4 py-2.5 text-xs font-sans rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-stone-900 dark:text-stone-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-stone-500 dark:text-stone-400 font-sans text-right">
            Mostrando {filteredUpdates.length} {filteredUpdates.length === 1 ? 'actualización' : 'actualizaciones'}
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-[#121212] text-white border-transparent shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Todas las Categorías
          </button>

          {(Object.keys(CATEGORY_METADATA) as PlatformUpdateCategory[]).map((catKey) => {
            const meta = CATEGORY_METADATA[catKey];
            const isSelected = selectedCategory === catKey;
            const Icon = meta.icon;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer border ${
                  isSelected
                    ? `${meta.badge} border-transparent shadow-xs font-bold scale-102`
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chronological Timeline Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif italic text-stone-500 text-sm">
            Cargando historial de actualizaciones...
          </p>
        </div>
      ) : filteredUpdates.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
          <Sparkles className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">
            No se encontraron actualizaciones
          </h3>
          <p className="text-xs text-stone-500 font-sans max-w-sm mx-auto">
            Prueba ajustando los filtros de categoría o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUpdates.map((item) => {
            const catMeta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA.nuevas_funcionalidades;
            const CatIcon = catMeta.icon;

            return (
              <article
                key={item.id}
                className="group bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-gold-400/60"
              >
                <div className="space-y-3">
                  {/* Top metadata */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${catMeta.badge}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{catMeta.label}</span>
                    </span>

                    <div className="flex items-center space-x-2 text-xs text-stone-400 font-mono">
                      {item.versionTag && (
                        <span className="font-bold text-stone-700 dark:text-stone-300">
                          {item.versionTag}
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {new Date(item.date).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail if present */}
                  {item.imageUrl && (
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-stone-200 dark:border-stone-800">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 group-hover:text-gold-600 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm font-sans leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                {/* Footer with tags and read more button */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {item.tags?.slice(0, 3).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-sans"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDetail(item)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-stone-900 dark:text-gold-400 hover:text-gold-600 transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Leer más</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL / DRAWER */}
      {activeModalUpdate && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={handleCloseDetail}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#18181c] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-y-auto p-6 sm:p-10 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${CATEGORY_METADATA[activeModalUpdate.category]?.badge}`}>
                    {CATEGORY_METADATA[activeModalUpdate.category]?.label}
                  </span>
                  {activeModalUpdate.versionTag && (
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                      {activeModalUpdate.versionTag}
                    </span>
                  )}
                  <span className="text-xs text-stone-400 font-sans">
                    {new Date(activeModalUpdate.date).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <h2 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 leading-tight">
                  {activeModalUpdate.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image */}
            {activeModalUpdate.imageUrl && (
              <figure className="space-y-2">
                <img
                  src={activeModalUpdate.imageUrl}
                  alt={activeModalUpdate.title}
                  className="w-full rounded-2xl max-h-[380px] object-cover border border-stone-200 dark:border-stone-800 shadow-sm"
                />
                {activeModalUpdate.imageCaption && (
                  <figcaption className="text-center font-sans text-xs text-stone-500 italic">
                    {activeModalUpdate.imageCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Summary Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf9f6] dark:bg-[#202024] border-l-4 border-gold-500 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 font-sans">
                Resumen Ejecutivo del Cambio
              </span>
              <p className="font-serif text-stone-800 dark:text-stone-200 text-base leading-relaxed">
                {activeModalUpdate.summary}
              </p>
            </div>

            {/* Detailed Body Content */}
            <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
              {renderDetailContent(activeModalUpdate.content)}
            </div>

            {/* Tags */}
            {activeModalUpdate.tags && activeModalUpdate.tags.length > 0 && (
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-sans text-stone-400 font-semibold mr-1">
                  Etiquetas:
                </span>
                {activeModalUpdate.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-sans"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs font-sans text-stone-400">
                Publicado por {activeModalUpdate.authorName || 'Julian Camilo'}
              </span>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-5 py-2 rounded-xl bg-[#121212] text-white text-xs font-bold hover:bg-gold-600 hover:text-stone-950 transition-colors"
              >
                Cerrar Novedad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
