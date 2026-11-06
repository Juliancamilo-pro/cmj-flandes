import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Check,
  Calendar,
  User,
  Paperclip,
} from 'lucide-react';
import { CmjCommitment, CommitmentStatus, CmjMember } from '../../../types/cmj.ts';
import { cmjApi } from '../../../services/cmjApi.ts';

interface CompromisosTabProps {
  commitments: CmjCommitment[];
  members: CmjMember[];
  sessions: { id: string; title: string; sessionNumber: string }[];
  currentUser: CmjMember;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  notify: (type: 'ok' | 'err', text: string) => void;
}

const STATUS_LABELS: Record<CommitmentStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  en_revision: 'En Revisión',
  cumplido: 'Cumplido',
  vencido: 'Vencido',
  cancelado: 'Cancelado con Justificación',
};

const STATUS_COLORS: Record<CommitmentStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  en_proceso: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  en_revision: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  cumplido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  vencido: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
  cancelado: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-400 dark:border-stone-700',
};

export const CompromisosTab: React.FC<CompromisosTabProps> = ({
  commitments,
  members,
  sessions,
  currentUser,
  canCreate,
  canEdit,
  canDelete,
  onRefresh,
  notify,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterResponsible, setFilterResponsible] = useState<string>('todos');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [responsibleId, setResponsibleId] = useState(currentUser.id);
  const [responsibleName, setResponsibleName] = useState(currentUser.fullName);
  const [deadline, setDeadline] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [status, setStatus] = useState<CommitmentStatus>('pendiente');
  const [notes, setNotes] = useState('');
  const [evidenceInput, setEvidenceInput] = useState('');
  const [evidences, setEvidences] = useState<string[]>([]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setSessionId('');
    setResponsibleId(currentUser.id);
    setResponsibleName(currentUser.fullName);
    setDeadline(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setStatus('pendiente');
    setNotes('');
    setEvidences([]);
    setShowModal(true);
  };

  const handleOpenEdit = (c: CmjCommitment) => {
    setEditingId(c.id);
    setTitle(c.title);
    setDescription(c.description);
    setSessionId(c.sessionId || '');
    setResponsibleId(c.responsibleId);
    setResponsibleName(c.responsibleName);
    setDeadline(c.deadline);
    setStatus(c.status);
    setNotes(c.notes || '');
    setEvidences(c.evidences || []);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !responsibleName.trim()) {
      notify('err', 'El título y el responsable son obligatorios.');
      return;
    }

    const selectedSession = sessions.find((s) => s.id === sessionId);

    try {
      if (editingId) {
        await cmjApi.updateCommitment(editingId, {
          title,
          description,
          sessionId: sessionId || undefined,
          sessionTitle: selectedSession ? selectedSession.title : undefined,
          responsibleId,
          responsibleName,
          deadline,
          status,
          notes,
          evidences,
        });
        notify('ok', 'Compromiso institucional actualizado.');
      } else {
        await cmjApi.createCommitment({
          title,
          description,
          sessionId: sessionId || undefined,
          sessionTitle: selectedSession ? selectedSession.title : undefined,
          responsibleId,
          responsibleName,
          assignedDate: new Date().toISOString().slice(0, 10),
          deadline,
          status,
          notes,
          evidences,
        });
        notify('ok', 'Nuevo compromiso registrado en el Consejo.');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error guardando compromiso.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este compromiso institucional?')) return;
    try {
      await cmjApi.deleteCommitment(id);
      notify('ok', 'Compromiso eliminado.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error eliminando compromiso.');
    }
  };

  const filtered = commitments.filter((c) => {
    if (filterStatus !== 'todos' && c.status !== filterStatus) return false;
    if (filterResponsible !== 'todos' && c.responsibleId !== filterResponsible) return false;
    return true;
  });

  const countPending = commitments.filter((c) => c.status === 'pendiente' || c.status === 'en_proceso').length;
  const countCompleted = commitments.filter((c) => c.status === 'cumplido').length;

  return (
    <div className="space-y-6">
      {/* Header with quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Seguimiento de Compromisos Institucionales
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Tablero de acuerdos y tareas pactadas en sesiones del Consejo Municipal de Juventud Flandes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Compromiso</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold">
          {countPending} Pendiente(s) / En Proceso
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold">
          {countCompleted} Cumplido(s)
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
          Total: {commitments.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <span className="font-bold text-stone-700 dark:text-stone-300">Filtrar:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-medium"
        >
          <option value="todos">Todos los Estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="en_revision">En Revisión</option>
          <option value="cumplido">Cumplido</option>
          <option value="vencido">Vencido</option>
          <option value="cancelado">Cancelado con Justificación</option>
        </select>

        <select
          value={filterResponsible}
          onChange={(e) => setFilterResponsible(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-medium"
        >
          <option value="todos">Todos los Responsables</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.cargoTitle})
            </option>
          ))}
        </select>
      </div>

      {/* Commitments List / Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs hover:border-stone-400 dark:hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase border ${STATUS_COLORS[c.status]}`}>
                  {STATUS_LABELS[c.status]}
                </span>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                      title="Editar compromiso"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Eliminar compromiso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {c.title}
                </h3>
                {c.description && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-3">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400" />
                  <span>Responsable: <strong className="text-stone-800 dark:text-stone-200">{c.responsibleName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#8c162a] dark:text-[#f2c94c]" />
                  <span>Plazo límite: <strong>{c.deadline}</strong></span>
                </div>
                {c.sessionTitle && (
                  <div className="truncate">
                    Sesión de origen: <strong>{c.sessionTitle}</strong>
                  </div>
                )}
                {c.completedDate && (
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Cumplido el: {c.completedDate}
                  </div>
                )}
                {c.evidences && c.evidences.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {c.evidences.map((ev, idx) => (
                      <a
                        key={idx}
                        href={ev}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>Evidencia {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
          <Clock className="w-10 h-10 mx-auto text-stone-400 opacity-60" />
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            No hay compromisos registrados con los filtros seleccionados
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Registra los acuerdos y tareas que el Consejo Municipal de Juventud establezca para su seguimiento institucional.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-dulima-primary py-2 px-4 text-xs font-bold mt-2"
            >
              Registrar Primer Compromiso
            </button>
          )}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              {editingId ? 'Editar Compromiso Institucional' : 'Registrar Nuevo Compromiso'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Título del Compromiso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Redactar propuesta de acuerdo para la Casa de la Juventud"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows={3}
                  placeholder="Alcance, entregables específicos y actividades requeridas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Consejero Responsable *
                  </label>
                  <select
                    value={responsibleId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setResponsibleId(id);
                      const m = members.find((x) => x.id === id);
                      if (m) setResponsibleName(m.fullName);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.cargoTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Sesión de Origen (Opcional)
                  </label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  >
                    <option value="">Ninguna / Tarea Extraordinaria</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sessionNumber} - {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Fecha Límite *
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CommitmentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="cumplido">Cumplido</option>
                    <option value="vencido">Vencido</option>
                    <option value="cancelado">Cancelado con Justificación</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Observaciones / Justificación de Cumplimiento
                </label>
                <input
                  type="text"
                  placeholder="Observaciones de avance o justificación de cancelación..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Enlaces a Evidencias (Documentos, fotos, actas)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={evidenceInput}
                    onChange={(e) => setEvidenceInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (evidenceInput.trim()) {
                        setEvidences([...evidences, evidenceInput.trim()]);
                        setEvidenceInput('');
                      }
                    }}
                    className="btn-dulima-secondary py-1.5 px-3 text-xs"
                  >
                    Agregar
                  </button>
                </div>
                {evidences.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {evidences.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] p-1.5 bg-stone-100 dark:bg-stone-800 rounded">
                        <span className="truncate max-w-xs">{ev}</span>
                        <button
                          type="button"
                          onClick={() => setEvidences(evidences.filter((_, idx) => idx !== i))}
                          className="text-red-500 font-bold ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-dulima-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs font-bold">
                  {editingId ? 'Guardar Cambios' : 'Registrar Compromiso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
