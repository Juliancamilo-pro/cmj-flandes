import React, { useState } from 'react';
import { 
  FileText, 
  PenTool, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Calendar, 
  Search, 
  Filter, 
  AlertCircle,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  ShieldCheck,
  User,
  X,
  Check
} from 'lucide-react';
import { Article, ArticleStatus } from '../../types';
import { deleteArticle, reviewArticle } from '../../services/db';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface AdminArticlesProps {
  articles: Article[];
  onNewArticle: () => void;
  onEditArticle: (article: Article) => void;
  onPreviewArticle: (slug: string) => void;
  onRefresh: () => Promise<void>;
}

export const AdminArticles: React.FC<AdminArticlesProps> = ({
  articles,
  onNewArticle,
  onEditArticle,
  onPreviewArticle,
  onRefresh
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review Modal state
  const [reviewingArticle, setReviewingArticle] = useState<Article | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Delete Modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  const pendingCount = articles.filter(a => a.status === 'revision').length;

  const filteredArticles = articles.filter(art => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'published' && !(art.status === 'published' || art.status === 'publicado')) return false;
      if (filterStatus === 'draft' && !(art.status === 'draft' || art.status === 'borrador')) return false;
      if (filterStatus === 'revision' && art.status !== 'revision') return false;
      if (filterStatus === 'cambios' && art.status !== 'cambios') return false;
      if (filterStatus === 'rechazado' && art.status !== 'rechazado') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchAuthor = art.authorName?.toLowerCase().includes(q);
      const matchCat = art.categoryName?.toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchCat;
    }
    return true;
  });

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { id } = itemToDelete;
    setDeletingId(id);
    setErrorMsg(null);
    try {
      await deleteArticle(id);
      setSuccessMsg('Artículo eliminado permanentemente.');
      await onRefresh();
    } catch (err: any) {
      console.warn('Delete attempt:', err);
      setErrorMsg('No fue posible eliminar el artículo.');
      await onRefresh();
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const handleReviewAction = async (status: ArticleStatus) => {
    if (!reviewingArticle) return;
    setIsSubmittingReview(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await reviewArticle(reviewingArticle.id, status, reviewNotes, 'Julian Camilo');
      setSuccessMsg(
        status === 'publicado' 
          ? `Artículo "${reviewingArticle.title}" aprobado y publicado exitosamente.`
          : status === 'cambios'
          ? `Se solicitaron modificaciones al autor con tus observaciones.`
          : `Artículo rechazado.`
      );
      setReviewingArticle(null);
      setReviewNotes('');
      await onRefresh();
    } catch (e: any) {
      setErrorMsg('Error al registrar la revisión editorial.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case 'published':
      case 'publicado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            Publicado
          </span>
        );
      case 'revision':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Pendiente Revisión</span>
          </span>
        );
      case 'cambios':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Requiere Cambios</span>
          </span>
        );
      case 'aprobado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
            Aprobado
          </span>
        );
      case 'rechazado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            Rechazado
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
            Programado
          </span>
        );
      case 'draft':
      case 'borrador':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300">
            Borrador
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Article Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
            Catálogo Editorial & Aprobaciones
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] dark:text-white mt-1">
            Gestión de Artículos
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Crea, edita, aprueba columnas de colaboradores y administra publicaciones con control total.
          </p>
        </div>

        <button
          onClick={onNewArticle}
          className="px-5 py-2.5 rounded-xl bg-[#121212] hover:bg-gold-700 dark:bg-gold-600 dark:hover:bg-gold-500 text-white dark:text-stone-950 font-sans text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Redactar Artículo</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and search controls */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, autor o categoría..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 font-sans">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'all' 
                ? 'bg-[#121212] text-white dark:bg-white dark:text-stone-950 font-bold' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Todos ({articles.length})
          </button>

          {/* Pending reviews badge */}
          <button
            onClick={() => setFilterStatus('revision')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              filterStatus === 'revision'
                ? 'bg-sky-700 text-white font-bold'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'published' 
                ? 'bg-emerald-800 text-white font-bold' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Publicados ({articles.filter(a => a.status === 'published' || a.status === 'publicado').length})
          </button>

          <button
            onClick={() => setFilterStatus('cambios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'cambios' 
                ? 'bg-amber-800 text-white font-bold' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Con Cambios ({articles.filter(a => a.status === 'cambios').length})
          </button>

          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'draft' 
                ? 'bg-stone-700 text-white font-bold' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Borradores ({articles.filter(a => a.status === 'draft' || a.status === 'borrador').length})
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="font-serif italic text-stone-600 dark:text-stone-400">No se encontraron artículos.</p>
            <button
              onClick={onNewArticle}
              className="text-xs uppercase tracking-wider font-semibold text-gold-700 dark:text-gold-400 hover:underline"
            >
              Crear nuevo artículo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f7f6f2] dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 uppercase tracking-wider font-sans font-semibold">
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-4">Autor</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-sans">
                {filteredArticles.map((art) => {
                  const dateStr = new Intl.DateTimeFormat('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }).format(new Date(art.publishedAt || art.createdAt));

                  const isPending = art.status === 'revision';

                  return (
                    <tr 
                      key={art.id} 
                      className={`hover:bg-[#faf9f6] dark:hover:bg-stone-900/50 transition-colors group ${
                        isPending ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-center space-x-3">
                          {art.coverImageUrl && (
                            <img
                              src={art.coverImageUrl}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-stone-100 dark:bg-stone-800"
                            />
                          )}
                          <div>
                            <h3 
                              onClick={() => onEditArticle(art)}
                              className="font-serif font-bold text-sm text-[#121212] dark:text-white group-hover:text-gold-700 dark:group-hover:text-gold-400 cursor-pointer line-clamp-1"
                            >
                              {art.title}
                            </h3>
                            <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                              {art.subtitle || 'Sin subtítulo'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-stone-700 dark:text-stone-300">
                        <div className="font-semibold text-xs flex items-center space-x-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{art.authorName || 'Julian Camilo'}</span>
                        </div>
                        {art.authorRole === 'collaborator' && (
                          <span className="text-[10px] text-gold-600 font-medium">Colaborador</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                          {art.categoryName}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(art.status)}
                      </td>

                      <td className="py-4 px-4 text-stone-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap space-x-1">
                        {/* If pending review, show dedicated Review Button */}
                        {isPending && (
                          <button
                            onClick={() => {
                              setReviewingArticle(art);
                              setReviewNotes(art.reviewNotes || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] inline-flex items-center space-x-1 shadow-xs transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Revisar</span>
                          </button>
                        )}

                        <button
                          onClick={() => onPreviewArticle(art.slug || art.id)}
                          title="Previsualizar en la web pública"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditArticle(art)}
                          title="Editar artículo"
                          className="p-1.5 rounded-lg text-gold-700 hover:text-gold-900 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-950/40 transition-colors"
                        >
                          <PenTool className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ id: art.id, title: art.title })}
                          disabled={deletingId === art.id}
                          title="Eliminar artículo"
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal for Julian Camilo */}
      {reviewingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#121212] dark:text-white">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-[#faf9f6] dark:bg-stone-900">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base">Revisión Editorial de Artículo</h3>
                  <p className="text-[11px] text-stone-500">Autor: {reviewingArticle.authorName} ({reviewingArticle.authorEmail})</p>
                </div>
              </div>
              <button
                onClick={() => setReviewingArticle(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Article Content Preview */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {reviewingArticle.categoryName}
                </span>
                <h2 className="text-2xl font-serif font-black mt-2">{reviewingArticle.title}</h2>
                {reviewingArticle.subtitle && (
                  <p className="text-sm font-sans text-stone-500 dark:text-stone-400 mt-1 italic">
                    {reviewingArticle.subtitle}
                  </p>
                )}
              </div>

              {reviewingArticle.coverImageUrl && (
                <img
                  src={reviewingArticle.coverImageUrl}
                  alt=""
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}

              <div className="p-4 bg-[#faf9f6] dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-sm font-serif leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {reviewingArticle.content}
              </div>

              {/* Revision Notes Input */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Observaciones / Notas para el Colaborador (opcional si apruebas, requerido si pides cambios):
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ej. Excelente análisis; por favor amplía el tercer párrafo respecto a la reforma electoral..."
                  className="w-full p-3 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>
            </div>

            {/* Footer with 3 decisions */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-[#faf9f6] dark:bg-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewingArticle(null)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                Cerrar sin cambios
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewAction('rechazado')}
                  className="px-3.5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-rose-600 hover:text-white text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors"
                >
                  Rechazar
                </button>

                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewAction('cambios')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors"
                >
                  Solicitar Modificaciones
                </button>

                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewAction('publicado')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-xs transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprobar y Publicar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Eliminar Artículo"
        message={`¿Estás seguro de que deseas eliminar permanentemente el artículo "${itemToDelete?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar Artículo"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
