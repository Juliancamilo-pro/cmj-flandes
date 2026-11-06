import React, { useState } from 'react';
import { Mail, Check, Trash2, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { ContactMessage } from '../../types';
import { markMessageRead, deleteContactMessage } from '../../services/db';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface AdminMessagesProps {
  messages: ContactMessage[];
  onRefresh: () => Promise<void>;
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({ messages, onRefresh }) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      await markMessageRead(id, !currentRead);
      await onRefresh();
    } catch (err) {
      console.error('Error toggling read status:', err);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      await deleteContactMessage(messageToDelete);
      setSuccessMsg('Mensaje eliminado.');
      await onRefresh();
    } catch (err) {
      setErrorMsg('No fue posible eliminar el mensaje.');
    } finally {
      setIsDeleting(false);
      setMessageToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-[#e5e1d5] pb-6">
        <span className="text-xs uppercase tracking-widest text-gold-600 font-bold font-sans">
          Buzón de Correspondencia
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] mt-1">
          Mensajes de Contacto
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-sans mt-0.5">
          Comunicaciones y propuestas enviadas por los lectores a través del portal.
        </p>
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

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-white border border-[#e8e5dc] rounded-2xl p-12 text-center space-y-2">
            <Mail className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-serif italic text-stone-600">
              No hay mensajes recibidos aún en la bandeja.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const dateStr = new Intl.DateTimeFormat('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(msg.createdAt));

            return (
              <div 
                key={msg.id}
                className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs space-y-3 transition-colors ${
                  msg.read ? 'border-[#e8e5dc] opacity-80' : 'border-gold-500 bg-[#fffdf8]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-[#121212] font-sans">
                        {msg.name}
                      </h3>
                      <span className="text-xs text-stone-500 font-mono">
                        &lt;{msg.email}&gt;
                      </span>
                      {!msg.read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-gold-900">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-stone-700 font-serif mt-0.5">
                      Asunto: {msg.subject}
                    </p>
                    <span className="text-[11px] text-stone-400 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      className="px-3 py-1.5 rounded-lg bg-[#121212] text-white text-xs font-semibold hover:bg-gold-700 transition-colors inline-flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3 text-gold-400" />
                      <span>Responder</span>
                    </a>

                    <button
                      onClick={() => handleToggleRead(msg.id, msg.read)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
                      title={msg.read ? 'Marcar como no leído' : 'Marcar como leído'}
                    >
                      {msg.read ? 'No leído' : 'Leído'}
                    </button>

                    <button
                      onClick={() => setMessageToDelete(msg.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar mensaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-stone-800 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={messageToDelete !== null}
        title="Eliminar Mensaje"
        message="¿Estás seguro de que deseas eliminar este mensaje de contacto? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar Mensaje"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteMessage}
        onCancel={() => setMessageToDelete(null)}
      />
    </div>
  );
};
