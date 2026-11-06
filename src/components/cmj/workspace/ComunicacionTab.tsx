import React, { useState } from 'react';
import {
  Megaphone,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  User,
  Clock,
  Tag,
} from 'lucide-react';
import { CmjInternalNotification, CmjMember } from '../../../types/cmj.ts';
import { cmjApi } from '../../../services/cmjApi.ts';

interface ComunicacionTabProps {
  notifications: CmjInternalNotification[];
  currentUser: CmjMember;
  canCreate: boolean;
  onRefresh: () => void;
  notify: (type: 'ok' | 'err', text: string) => void;
}

export const ComunicacionTab: React.FC<ComunicacionTabProps> = ({
  notifications,
  currentUser,
  canCreate,
  onRefresh,
  notify,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'aviso' | 'comunicado' | 'convocatoria' | 'tarea' | 'proyecto'>('aviso');
  const [priority, setPriority] = useState<'normal' | 'alta' | 'urgente'>('normal');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      notify('err', 'El título y el mensaje son obligatorios.');
      return;
    }
    try {
      await cmjApi.createNotification({
        title,
        message,
        category,
        priority,
      });
      setTitle('');
      setMessage('');
      setShowModal(false);
      notify('ok', 'Comunicado institucional emitido a todos los consejeros.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error enviando comunicado.');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await cmjApi.markNotificationRead(id);
      onRefresh();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Comunicación Institucional Interna
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Canal oficial para emisión y consulta de avisos, acuerdos y circulares entre integrantes del CMJ Flandes.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Aviso / Comunicado</span>
          </button>
        )}
      </div>

      {/* Notifications Feed */}
      {notifications.length > 0 ? (
        <div className="space-y-3.5">
          {notifications.map((n) => {
            const isRead = n.readByMemberIds.includes(currentUser.id);
            return (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition-colors space-y-3 ${
                  isRead
                    ? 'bg-white dark:bg-[#161920] border-stone-200 dark:border-stone-800'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        n.priority === 'urgente'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : n.priority === 'alta'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      Prioridad {n.priority}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#003893] dark:text-blue-400">
                      {n.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{n.createdAt.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {n.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 whitespace-pre-wrap leading-relaxed">
                    {n.message}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                    <User className="w-3.5 h-3.5 text-[#8c162a] dark:text-[#f2c94c]" />
                    <span>
                      Emitido por: <strong>{n.senderName}</strong> ({n.senderCargo})
                    </span>
                  </div>

                  {!isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-xs font-bold text-[#003893] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar como leído</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400 italic">Leído</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
          <Megaphone className="w-10 h-10 mx-auto text-stone-400 opacity-60" />
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            No hay comunicados o avisos internos registrados
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Utiliza este módulo para difundir citaciones, recordatorios de tareas institucionales o notas informativas internas del Consejo.
          </p>
        </div>
      )}

      {/* Modal Emitir Comunicado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              Emitir Aviso Institucional
            </h3>

            <form onSubmit={handleSend} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Asunto / Título *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Recordatorio de entrega de informe de comisión"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  >
                    <option value="aviso">Aviso General</option>
                    <option value="comunicado">Comunicado Oficial</option>
                    <option value="convocatoria">Convocatoria Extraordinaria</option>
                    <option value="tarea">Seguimiento de Tarea</option>
                    <option value="proyecto">Articulación de Proyecto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Mensaje / Contenido Institucional *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe el contenido detallado de la comunicación..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-dulima-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir Comunicado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
