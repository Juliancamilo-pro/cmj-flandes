import React, { useState } from 'react';
import { X, FileWarning, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { createCorrectionRequest } from '../../services/db';
import { checkFormRateLimit, sanitizePlainText } from '../../utils/security';

interface CorrectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
  articleSlug?: string;
}

export const CorrectionRequestModal: React.FC<CorrectionRequestModalProps> = ({
  isOpen,
  onClose,
  articleId,
  articleTitle,
  articleSlug
}) => {
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [sectionOrParagraph, setSectionOrParagraph] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rate = checkFormRateLimit('correction_request', 8000);
    if (!rate.allowed) {
      setError(`Por favor espera ${rate.waitSeconds} segundos antes de enviar otra solicitud.`);
      return;
    }

    if (!requesterName.trim() || !description.trim()) {
      setError('Por favor ingresa tu nombre y el detalle de la corrección o aclaración.');
      return;
    }

    setSubmitting(true);
    try {
      await createCorrectionRequest({
        articleId,
        articleTitle,
        articleSlug: articleSlug || articleId,
        requesterName: sanitizePlainText(requesterName, 100),
        requesterEmail: sanitizePlainText(requesterEmail, 120) || undefined,
        sectionOrParagraph: sanitizePlainText(sectionOrParagraph, 180) || undefined,
        description: sanitizePlainText(description, 1500)
      });
      setSuccess(true);
    } catch {
      setError('No se pudo enviar la solicitud. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    setDescription('');
    setSectionOrParagraph('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center space-x-2">
            <FileWarning className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
              Solicitar Corrección o Aclaración
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                Solicitud recibida por la redacción
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                El equipo editorial revisará tu observación sobre "{articleTitle}" y publicará una aclaración o rectificación si corresponde.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Artículo: <strong className="text-stone-800 dark:text-stone-200">{articleTitle}</strong>
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tu nombre *
                </label>
                <input
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Correo (Opcional)
                </label>
                <input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Sección o párrafo (Opcional)
              </label>
              <input
                type="text"
                value={sectionOrParagraph}
                onChange={(e) => setSectionOrParagraph(e.target.value)}
                placeholder="Ej. Párrafo 3, cifra de presupuesto..."
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Detalle y fuentes de respaldo *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica qué parte del texto requiere precisión o rectificación..."
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Enviando...' : 'Enviar Solicitud'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
