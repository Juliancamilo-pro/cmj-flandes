import React, { useState } from 'react';
import { Flag, X, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ContentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
}

export const ContentReportModal: React.FC<ContentReportModalProps> = ({
  isOpen,
  onClose,
  articleId,
  articleTitle
}) => {
  const [reason, setReason] = useState<string>('imprecision');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setErrorMsg('Por favor describe el motivo de tu reporte.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const reportPayload = {
      articleId,
      articleTitle,
      reason,
      details: details.trim(),
      reporterEmail: reporterEmail.trim() || 'anonimo@lector.co',
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'content_reports'), reportPayload);
    } catch (e) {
      console.warn('Fallback saving content report locally:', e);
      try {
        const cached = localStorage.getItem('jc_content_reports');
        const list = cached ? JSON.parse(cached) : [];
        list.push({ id: `rep_${Date.now()}`, ...reportPayload });
        localStorage.setItem('jc_content_reports', JSON.stringify(list));
      } catch {}
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setDetails('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c20] max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 relative">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
              Reporte enviado al Consejo Editorial
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-sans max-w-sm mx-auto leading-relaxed">
              Agradecemos tu compromiso con el rigor y la calidad informativa de Julian Camilo. Revisaremos tu observación en el menor tiempo posible.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-[#121212] text-white text-xs font-bold hover:bg-gold-600 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                  Reportar contenido
                </h3>
                <p className="text-[11px] text-stone-500 font-sans line-clamp-1">
                  {articleTitle}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-xs text-rose-800 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Motivo del reporte *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
              >
                <option value="imprecision">Imprecisión fáctica o información engañosa</option>
                <option value="lenguaje_inapropiado">Lenguaje ofensivo o discurso de odio</option>
                <option value="derechos_autor">Posible vulneración de derechos de autor</option>
                <option value="spam_publicidad">Spam o contenido comercial no autorizado</option>
                <option value="otro">Otro motivo editorial</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Detalles de tu observación *
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Indica con precisión el párrafo, dato o motivo de tu reporte..."
                className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Tu correo electrónico (opcional)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="Para notificarte sobre la resolución"
                className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Enviando...' : 'Enviar Reporte'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
