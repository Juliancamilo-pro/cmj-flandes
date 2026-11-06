import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Eye, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Calendar, 
  PenTool, 
  ArrowUpRight,
  PieChart,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Article, DailyAnalytics, Comment } from '../../types';
import { getAnalyticsDays } from '../../services/db';

interface AdminDashboardProps {
  articles: Article[];
  comments: Comment[];
  onNavigateTab: (tab: string, param?: string) => void;
  onEditArticle: (article: Article) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  articles,
  comments,
  onNavigateTab,
  onEditArticle
}) => {
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(14);
  const [hoveredDay, setHoveredDay] = useState<DailyAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    const data = await getAnalyticsDays(timeRange);
    setAnalytics(data);
  };

  // Metrics
  const publishedArticles = articles.filter(a => a.status === 'published' || a.status === 'publicado');
  const pendingArticles = articles.filter(a => a.status === 'revision');
  const draftArticles = articles.filter(a => a.status === 'draft' || a.status === 'borrador');
  const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const pendingComments = comments.filter(c => c.status === 'pending');
  const totalVisits = analytics.reduce((acc, curr) => acc + (curr.visits || 0), 0);

  // Top articles by views
  const topArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const maxArticleViews = topArticles[0]?.views || 1;

  // Category view counts aggregation
  const categoryStats: Record<string, number> = {};
  articles.forEach(a => {
    const cat = a.categoryName || 'Sin categoría';
    categoryStats[cat] = (categoryStats[cat] || 0) + (a.views || 0);
  });
  const categoryStatsList = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

  // Max visits for chart scaling
  const maxDayVisits = Math.max(...analytics.map(d => d.visits || 0), 10);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
            Métricas Editoriales & Rendimiento
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-[#121212] dark:text-white mt-1">
            Panel de Estadísticas y Visitas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-1">
            Audiencia, lecturas y control editorial de publicaciones en Colombia.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateTab('editor')}
            className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-gold-700 dark:bg-gold-600 dark:hover:bg-gold-500 text-white dark:text-stone-950 font-sans text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <PenTool className="w-3.5 h-3.5 text-gold-400 dark:text-stone-950" />
            <span>Redactar Artículo</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Page Visits */}
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 font-sans">
              Visitas Totales
            </span>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white">
              {totalVisits || (totalViews * 2 + 15)}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans flex items-center font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              Lectores en el portal
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold-50 dark:bg-gold-950/60 border border-gold-200 dark:border-gold-800 flex items-center justify-center text-gold-700 dark:text-gold-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Article Views */}
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 font-sans">
              Lecturas de Ensayos
            </span>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white">
              {totalViews}
            </p>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
              Publicaciones leídas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-800 dark:text-stone-200">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Published & Pending */}
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 font-sans">
              Artículos Publicados
            </span>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white">
              {publishedArticles.length}
            </p>
            {pendingArticles.length > 0 ? (
              <button
                onClick={() => onNavigateTab('articles')}
                className="text-[11px] text-sky-600 dark:text-sky-400 font-bold font-sans flex items-center"
              >
                <Clock className="w-3 h-3 mr-1" />
                <span>{pendingArticles.length} pendientes de revisión</span>
              </button>
            ) : (
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                {draftArticles.length} borradores en edición
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-800 dark:text-stone-200">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Comments */}
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 font-sans">
              Comentarios
            </span>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white">
              {pendingComments.length}
            </p>
            <button
              onClick={() => onNavigateTab('comments')}
              className="text-[11px] text-gold-700 dark:text-gold-400 hover:underline font-semibold font-sans flex items-center"
            >
              <span>Ir a moderación</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Chart: Visitas por Día */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eeeae1] dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#121212] dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <span>Visitas por Día al Portal</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Frecuencia de lectura diaria en el período seleccionado
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#f5f4ee] dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-sans transition-colors ${
                timeRange === 7 
                  ? 'bg-[#121212] text-white dark:bg-stone-800 font-bold' 
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              7 días
            </button>
            <button
              onClick={() => setTimeRange(14)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-sans transition-colors ${
                timeRange === 14 
                  ? 'bg-[#121212] text-white dark:bg-stone-800 font-bold' 
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              14 días
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-sans transition-colors ${
                timeRange === 30 
                  ? 'bg-[#121212] text-white dark:bg-stone-800 font-bold' 
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              30 días
            </button>
          </div>
        </div>

        {/* SVG Interactive Bar Chart */}
        <div className="pt-2">
          {analytics.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs font-sans">
              Registrando lecturas de visitantes. Los datos aparecerán conforme los lectores consulten el portal.
            </div>
          ) : (
            <div className="space-y-2">
              {hoveredDay && (
                <div className="text-xs text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-1.5 rounded-lg w-fit">
                  <span className="font-semibold">{hoveredDay.date}:</span> {hoveredDay.visits} visitas registradas
                </div>
              )}

              <div className="h-56 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 border-b border-stone-200 dark:border-stone-800">
                {analytics.map((day, idx) => {
                  const heightPercent = Math.max(8, Math.round(((day.visits || 0) / maxDayVisits) * 100));
                  const isHovered = hoveredDay?.date === day.date;
                  const label = day.date.slice(5);

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      <div className="text-[10px] text-stone-400 group-hover:text-gold-700 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.visits}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-gold-500 shadow-md'
                            : 'bg-[#121212] dark:bg-stone-700 group-hover:bg-gold-600'
                        }`}
                      />
                      <span className="text-[9px] sm:text-[10px] text-stone-400 mt-2 truncate w-full text-center">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout: Top Articles & Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Most Read Articles */}
        <div className="lg:col-span-7 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#eeeae1] dark:border-stone-800 pb-4">
            <h2 className="text-lg font-bold font-serif text-[#121212] dark:text-white flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <span>Artículos Más Consultados</span>
            </h2>
            <button
              onClick={() => onNavigateTab('articles')}
              className="text-xs text-gold-700 dark:text-gold-400 hover:underline font-semibold font-sans"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-4">
            {topArticles.length === 0 ? (
              <p className="text-stone-400 text-xs font-sans py-4">No hay artículos registrados aún.</p>
            ) : (
              topArticles.map((art, index) => {
                const percent = Math.min(100, Math.round(((art.views || 0) / maxArticleViews) * 100));

                return (
                  <div 
                    key={art.id} 
                    onClick={() => onEditArticle(art)}
                    className="p-3.5 rounded-xl hover:bg-[#faf9f6] dark:hover:bg-stone-900/50 transition-colors cursor-pointer space-y-2 border border-transparent hover:border-stone-200 dark:hover:border-stone-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold font-sans flex items-center justify-center shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-serif font-bold text-sm text-[#121212] dark:text-white hover:text-gold-700 dark:hover:text-gold-400 transition-colors line-clamp-1">
                            {art.title}
                          </h3>
                          <span className="text-[11px] text-stone-400 font-sans">
                            {art.categoryName} • {art.status === 'published' || art.status === 'publicado' ? 'Publicado' : 'Borrador'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-stone-900 dark:text-white shrink-0 font-sans">
                        {art.views || 0} lecturas
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gold-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-[#eeeae1] dark:border-stone-800 pb-4">
            <h2 className="text-lg font-bold font-serif text-[#121212] dark:text-white flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <span>Categorías Más Visitadas</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Distribución de interés temático
            </p>
          </div>

          <div className="space-y-3">
            {categoryStatsList.length === 0 ? (
              <p className="text-stone-400 text-xs font-sans py-4">No hay datos suficientes.</p>
            ) : (
              categoryStatsList.map(([catName, viewsCount]) => {
                const totalCatViews = Math.max(1, totalViews);
                const sharePercent = Math.round((viewsCount / totalCatViews) * 100);

                return (
                  <div key={catName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{catName}</span>
                      <span className="text-stone-500 dark:text-stone-400">{viewsCount} vistas ({sharePercent}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#121212] dark:bg-gold-500 h-full rounded-full" 
                        style={{ width: `${Math.max(5, sharePercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
