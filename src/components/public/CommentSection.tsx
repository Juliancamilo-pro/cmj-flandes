import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, CornerDownRight } from 'lucide-react';
import { Comment, PlatformSettings } from '../../types';
import { getCommentsByArticle, createComment, getSettings } from '../../services/db';
import { ColombianVerifiedBadge } from '../common/ColombianVerifiedBadge';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../common/OwnerVerifiedBadge';
import { HumanVerificationWidget } from '../common/HumanVerificationWidget';
import { sanitizePlainText } from '../../utils/security';
import { useAuthorDirectory } from '../../hooks/useVerifiedAuthors';

interface CommentSectionProps {
  articleId: string;
  articleTitle: string;
  allowComments: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  articleId,
  articleTitle,
  allowComments
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const { isVerifiedAuthor } = useAuthorDirectory();

  // Form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [humanVerified, setHumanVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCommentsAndSettings();
  }, [articleId]);

  const loadCommentsAndSettings = async () => {
    setLoading(true);
    try {
      const [commentsData, settingsData] = await Promise.all([
        getCommentsByArticle(articleId),
        getSettings()
      ]);
      setComments(commentsData);
      setSettings(settingsData);
    } catch (err) {
      console.warn('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitSuccess(null);

    if (!humanVerified) {
      setErrorMessage('Por favor completa la verificación humana antes de publicar tu comentario.');
      return;
    }

    const cleanName = sanitizePlainText(authorName, 80);
    const cleanContent = sanitizePlainText(content, 2000);

    if (!cleanName || !cleanContent) {
      setErrorMessage('Por favor ingresa tu nombre y comentario.');
      return;
    }

    setSubmitting(true);
    try {
      const moderationOn = settings?.moderationEnabled ?? true;
      const initialStatus = moderationOn ? 'pending' : 'approved';

      await createComment({
        articleId,
        articleTitle,
        authorName: cleanName,
        authorEmail: authorEmail.trim() || undefined,
        parentCommentId: replyingTo?.id,
        replyToAuthor: replyingTo?.authorName,
        content: cleanContent,
        status: initialStatus,
        createdAt: new Date().toISOString()
      });

      setContent('');
      setReplyingTo(null);
      if (moderationOn) {
        setSubmitSuccess('Tu comentario ha sido enviado. Será visible en cuanto el moderador lo apruebe.');
      } else {
        setSubmitSuccess('¡Gracias por tu comentario! Ha sido publicado.');
        await loadCommentsAndSettings();
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setErrorMessage('Ocurrió un error al enviar tu comentario. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!allowComments || (settings && !settings.allowCommentsGlobally)) {
    return (
      <div className="border-t border-[#e8e5dc] pt-10 mt-16 text-center text-stone-500 text-sm font-sans italic">
        Los comentarios están desactivados para esta publicación.
      </div>
    );
  }

  return (
    <section className="border-t border-[#e8e5dc] pt-12 mt-16 space-y-10" aria-label="Sección de comentarios">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <MessageSquare className="w-5 h-5 text-gold-600" />
          <h3 className="text-2xl font-bold font-serif text-[#121212]">
            Comentarios y Discusión ({comments.length})
          </h3>
        </div>
        <span className="text-xs text-stone-500 font-sans">
          Espacio abierto al debate constructivo
        </span>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-wider font-sans text-stone-800 dark:text-stone-200">
          Añadir un comentario
        </h4>

        {submitSuccess && (
          <div className="flex items-start space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm p-4 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm p-4 rounded-lg">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Nombre o alias *
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ej. Roberto Martínez"
              maxLength={80}
              required
              className="w-full px-3.5 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Correo electrónico (opcional, no será público)
            </label>
            <input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              maxLength={120}
              className="w-full px-3.5 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Comentario o reflexión *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Comparte tu opinión con respeto..."
            maxLength={2000}
            required
            className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400 resize-y"
          />
          <div className="flex justify-between items-center text-[11px] text-stone-400 dark:text-stone-500 mt-1">
            <span>Se promueve el debate cívico y argumentado.</span>
            <span>{content.length}/2000</span>
          </div>
        </div>

        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300">
            <span className="inline-flex items-center space-x-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-[#9B1B30] dark:text-[#F2C94C]" />
              <span>
                Respondiendo a <strong>{replyingTo.authorName}</strong>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-[11px] underline cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        <HumanVerificationWidget
          formName="comentario_articulo"
          onVerifiedChange={setHumanVerified}
        />

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || !humanVerified}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#121212] dark:bg-gold-500 dark:text-stone-950 text-white hover:bg-gold-700 dark:hover:bg-gold-600 font-sans text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-gold-400 dark:text-stone-950" />
            <span>{submitting ? 'Enviando...' : 'Publicar Comentario'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-stone-400">
            Cargando comentarios...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center bg-[#f6f5f0] dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-xl text-stone-500 text-sm">
            <p className="font-serif italic text-base text-stone-700 dark:text-stone-300">Aún no hay comentarios en este artículo.</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Sé el primero en iniciar la conversación.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const dateStr = new Intl.DateTimeFormat('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(comment.createdAt));

            const initials = comment.authorName
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div 
                key={comment.id}
                className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-xl p-5 sm:p-6 space-y-3 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#121212] dark:bg-stone-800 text-gold-400 font-sans font-bold text-xs flex items-center justify-center">
                      {initials}
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-[#121212] dark:text-[#f3ede2] inline-flex items-center space-x-1.5">
                        <span>{comment.authorName}</span>
                        {isOwnerAuthor(comment.authorEmail, comment.authorRole, comment.authorName) ? (
                          <OwnerVerifiedBadge size="sm" />
                        ) : (
                          isVerifiedAuthor(comment.authorEmail, comment.authorName) && (
                            <ColombianVerifiedBadge size="sm" />
                          )
                        )}
                      </h5>
                      <span className="text-[11px] text-stone-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReplyingTo({ id: comment.id, authorName: comment.authorName })}
                    className="text-xs font-semibold text-stone-500 hover:text-[#9B1B30] dark:hover:text-[#F2C94C] cursor-pointer"
                  >
                    Responder
                  </button>
                </div>

                {comment.replyToAuthor && (
                  <p className="text-[11px] text-[#9B1B30] dark:text-[#F2C94C] font-medium pl-11">
                    ↳ En respuesta a {comment.replyToAuthor}
                  </p>
                )}

                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-sans whitespace-pre-wrap pl-11">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
