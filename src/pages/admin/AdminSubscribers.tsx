import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Download, Copy, Check, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { getNewsletterSubscribers, deleteSubscriber } from '../../services/db';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminSubscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const data = await getNewsletterSubscribers();
      setSubscribers(data || []);
    } catch (err) {
      console.warn('Could not load subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const [subToDelete, setSubToDelete] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteSubscriber = async () => {
    if (!subToDelete) return;
    const { id, email } = subToDelete;
    setIsDeleting(true);
    try {
      await deleteSubscriber(id);
      setSuccessMsg(`Suscriptor ${email} eliminado.`);
      await loadSubscribers();
    } catch (err) {
      setErrorMsg('No fue posible eliminar el suscriptor.');
    } finally {
      setIsDeleting(false);
      setSubToDelete(null);
    }
  };

  const copyAllEmails = () => {
    const text = subscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Email,Fecha\n' +
      subscribers.map(s => `"${s.email}","${s.createdAt}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suscriptores_julian_camilo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 font-bold font-sans">
            Comunidad & Audiencia
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] mt-1">
            Suscriptores al Boletín ({subscribers.length})
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-sans mt-0.5">
            Lectores registrados a través del formulario del artículo y del pie de página.
          </p>
        </div>

        {subscribers.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={copyAllEmails}
              className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copied ? '¡Copiados!' : 'Copiar Correos'}</span>
            </button>

            <button
              onClick={downloadCSV}
              className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-gold-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-gold-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        )}
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

      <div className="bg-white border border-[#e8e5dc] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Cargando lista de suscriptores...
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-serif italic text-stone-600">Aún no hay suscriptores registrados.</p>
            <p className="text-xs text-stone-400 font-sans">
              Aparecerán aquí cuando los lectores ingresen su correo en los formularios de Newsletter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {subscribers.map((sub, idx) => {
              const dateStr = new Intl.DateTimeFormat('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }).format(new Date(sub.createdAt));

              return (
                <div key={sub.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f6] transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-xs font-bold font-sans flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-sans font-bold text-sm text-[#121212]">
                        {sub.email}
                      </p>
                      <span className="text-[11px] text-stone-400 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        Suscrito el {dateStr}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSubToDelete({ id: sub.id, email: sub.email })}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Dar de baja suscriptor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={subToDelete !== null}
        title="Dar de baja Suscriptor"
        message={`¿Estás seguro de que deseas eliminar a "${subToDelete?.email}" de la lista de suscriptores?`}
        confirmText="Sí, Eliminar Suscriptor"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteSubscriber}
        onCancel={() => setSubToDelete(null)}
      />
    </div>
  );
};
