import React, { useState } from 'react';
import { 
  MessageSquare, 
  Check, 
  X, 
  Trash2, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  ExternalLink 
} from 'lucide-react';
import { Comment, CommentStatus } from '../../types';
import { updateCommentStatus, deleteComment } from '../../services/db';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface AdminCommentsProps {
  comments: Comment[];
  onRefresh: () => Promise<void>;
  onPreviewArticle: (idOrSlug: string) => void;
}

export const AdminComments: React.FC<AdminCommentsProps> = ({
  comments,
  onRefresh,
  onPreviewArticle
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredComments = comments.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const handleStatusChange = async (id: string, newStatus: CommentStatus) => {
    setLoadingId(id);
    setErrorMsg(null);
    try {
      await updateCommentStatus(id, newStatus);
      setSuccessMsg(`Comentario ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}.`);
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to change comment status:', err);
      setErrorMsg('No fue posible actualizar el estado del comentario.');
    } finally {
      setLoadingId(null);
    }
  };

  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const id = commentToDelete;
    setLoadingId(id);
    setErrorMsg(null);
    try {
      await deleteComment(id);
      setSuccessMsg('Comentario eliminado.');
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      setErrorMsg('No fue posible eliminar el comentario.');
    } finally {
      setLoadingId(null);
      setCommentToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 font-bold font-sans">
            Comunidad y Debate
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] mt-1">
            Moderación de Comentarios
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-sans mt-0.5">
            Aprueba, rechaza o elimina los comentarios recibidos de los lectores.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'pending' ? 'bg-[#121212] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pendientes ({comments.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'approved' ? 'bg-[#121212] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Aprobados ({comments.filter(c => c.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'rejected' ? 'bg-[#121212] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Rechazados ({comments.filter(c => c.status === 'rejected').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-[#121212] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todos ({comments.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="bg-white border border-[#e8e5dc] rounded-2xl p-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-serif italic text-stone-600">
              No hay comentarios en la sección de {filter === 'pending' ? 'pendientes' : filter}.
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => {
            const dateStr = new Intl.DateTimeFormat('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(comment.createdAt));

            return (
              <div 
                key={comment.id}
                className="bg-white border border-[#e8e5dc] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-gold-400 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#121212] font-sans">
                        {comment.authorName}
                      </span>
                      {comment.authorEmail && (
                        <span className="text-[11px] text-stone-400 font-mono">
                          &lt;{comment.authorEmail}&gt;
                        </span>
                      )}
                      {comment.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                          Pendiente
                        </span>
                      )}
                      {comment.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          Aprobado
                        </span>
                      )}
                      {comment.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                          Rechazado
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-500 flex items-center space-x-2">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {dateStr}
                      </span>
                      <span>•</span>
                      <button
                        onClick={() => onPreviewArticle(comment.articleId)}
                        className="text-gold-700 hover:text-gold-900 inline-flex items-center space-x-1"
                      >
                        <span className="truncate max-w-xs">{comment.articleTitle || 'Ver artículo'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0 pt-2 sm:pt-0">
                    {comment.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(comment.id, 'approved')}
                        disabled={loadingId === comment.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar</span>
                      </button>
                    )}

                    {comment.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(comment.id, 'rejected')}
                        disabled={loadingId === comment.id}
                        className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    )}

                    <button
                      onClick={() => setCommentToDelete(comment.id)}
                      disabled={loadingId === comment.id}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-stone-800 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={commentToDelete !== null}
        title="Eliminar Comentario"
        message="¿Estás seguro de que deseas eliminar permanentemente este comentario? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar Comentario"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={loadingId !== null}
        onConfirm={confirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};
