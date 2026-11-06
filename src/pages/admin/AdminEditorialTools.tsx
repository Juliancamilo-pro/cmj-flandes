import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Calendar,
  FileWarning,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  TrendingUp,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import {
  Article,
  CitizenPoll,
  EditorialEvent,
  EditorialEventCategory,
  CorrectionRequest,
  CollaboratorRecognition
} from '../../types';
import {
  getCitizenPolls,
  saveCitizenPoll,
  deleteCitizenPoll,
  getEditorialEvents,
  saveEditorialEvent,
  deleteEditorialEvent,
  getCorrectionRequests,
  updateCorrectionRequestStatus,
  getCollaboratorRecognitions,
  saveCollaboratorRecognition,
  deleteCollaboratorRecognition
} from '../../services/db';

interface AdminEditorialToolsProps {
  articles: Article[];
}

export const AdminEditorialTools: React.FC<AdminEditorialToolsProps> = ({ articles }) => {
  const [activeTab, setActiveTab] = useState<'polls' | 'events' | 'corrections' | 'stats'>('polls');
  const [polls, setPolls] = useState<CitizenPoll[]>([]);
  const [events, setEvents] = useState<EditorialEvent[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [recognitions, setRecognitions] = useState<CollaboratorRecognition[]>([]);
  const [loading, setLoading] = useState(true);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New / Edit Poll state
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [pollTitle, setPollTitle] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollClosesAt, setPollClosesAt] = useState('');
  const [pollFeatured, setPollFeatured] = useState(false);
  const [pollStatusFilter, setPollStatusFilter] = useState<'all' | 'pendiente' | 'activa' | 'cerrada' | 'rechazada'>('all');
  const [pollOptionsText, setPollOptionsText] = useState('Sí, estoy de acuerdo\nNo estoy de acuerdo\nNeutral / Requiere más debate');
  const [savingPoll, setSavingPoll] = useState(false);

  // New Event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCategory, setEventCategory] = useState<EditorialEventCategory>('foro');
  const [eventUrl, setEventUrl] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  // New Recognition state
  const [recName, setRecName] = useState('');
  const [recBadge, setRecBadge] = useState('Columna Destacada del Mes');
  const [recReason, setRecReason] = useState('');
  const [savingRec, setSavingRec] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, ev, cor, rec] = await Promise.all([
        getCitizenPolls(),
        getEditorialEvents(),
        getCorrectionRequests(),
        getCollaboratorRecognitions()
      ]);
      setPolls(p);
      setEvents(ev);
      setCorrections(cor);
      setRecognitions(rec);
    } catch {
      setErrorMsg('Error al cargar las herramientas editoriales.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = pollOptionsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!pollQuestion.trim() || lines.length < 2) {
      setErrorMsg('Ingresa una pregunta y al menos 2 opciones (una por línea).');
      return;
    }

    setSavingPoll(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const existing = editingPollId ? polls.find((p) => p.id === editingPollId) : undefined;
      await saveCitizenPoll(
        {
          title: pollTitle.trim() || undefined,
          question: pollQuestion.trim(),
          description: pollDescription.trim() || undefined,
          options: lines.map((text, idx) => ({
            id: existing?.options[idx]?.id || `opt_${Date.now()}_${idx}`,
            text,
            votes: existing?.options[idx]?.votes || 0
          })),
          totalVotes: existing?.totalVotes || 0,
          status: existing?.status || 'activa',
          creatorName: existing?.creatorName || 'Julian Camilo',
          creatorRole: existing?.creatorRole || 'owner',
          publishedAt: existing?.publishedAt || new Date().toISOString(),
          closesAt: pollClosesAt ? new Date(pollClosesAt).toISOString() : undefined,
          featured: pollFeatured
        },
        editingPollId || undefined
      );
      setEditingPollId(null);
      setPollTitle('');
      setPollQuestion('');
      setPollDescription('');
      setPollClosesAt('');
      setPollFeatured(false);
      setPollOptionsText('Sí, estoy de acuerdo\nNo estoy de acuerdo\nNeutral / Requiere más debate');
      setSuccessMsg(editingPollId ? 'Encuesta actualizada correctamente.' : 'Encuesta ciudadana publicada.');
      await loadAll();
    } catch {
      setErrorMsg('No se pudo guardar la encuesta.');
    } finally {
      setSavingPoll(false);
    }
  };

  const handleEditPoll = (poll: CitizenPoll) => {
    setEditingPollId(poll.id);
    setPollTitle(poll.title || '');
    setPollQuestion(poll.question);
    setPollDescription(poll.description || '');
    setPollClosesAt(poll.closesAt ? poll.closesAt.slice(0, 16) : '');
    setPollFeatured(Boolean(poll.featured));
    setPollOptionsText(poll.options.map((o) => o.text).join('\n'));
  };

  const handlePollStatusChange = async (poll: CitizenPoll, nextStatus: CitizenPoll['status']) => {
    await saveCitizenPoll(
      {
        ...poll,
        status: nextStatus,
        publishedAt: nextStatus === 'activa' ? poll.publishedAt || new Date().toISOString() : poll.publishedAt
      },
      poll.id
    );
    setSuccessMsg(`Estado de la encuesta cambiado a: ${nextStatus}.`);
    await loadAll();
  };

  const handleToggleFeaturedPoll = async (poll: CitizenPoll) => {
    await saveCitizenPoll(
      {
        ...poll,
        featured: !poll.featured
      },
      poll.id
    );
    await loadAll();
  };

  const handleDeletePoll = async (id: string) => {
    await deleteCitizenPoll(id);
    setSuccessMsg('Encuesta eliminada.');
    await loadAll();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      setErrorMsg('Ingresa el título y la fecha del evento.');
      return;
    }
    setSavingEvent(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await saveEditorialEvent({
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDate,
        location: eventLocation.trim() || 'Por confirmar',
        category: eventCategory,
        registrationUrl: eventUrl.trim() || undefined,
        isFeatured: true,
        status: 'programado'
      });
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setEventLocation('');
      setEventUrl('');
      setSuccessMsg('Evento agregado a la agenda.');
      await loadAll();
    } catch {
      setErrorMsg('Error al guardar el evento.');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEditorialEvent(id);
    setSuccessMsg('Evento eliminado.');
    await loadAll();
  };

  const handleCorrectionStatus = async (
    id: string,
    status: 'aprobada' | 'rechazada'
  ) => {
    await updateCorrectionRequestStatus(id, status);
    setSuccessMsg(`Solicitud marcada como ${status}.`);
    await loadAll();
  };

  const handleCreateRecognition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recName.trim() || !recBadge.trim() || !recReason.trim()) {
      setErrorMsg('Completa todos los campos del reconocimiento.');
      return;
    }
    setSavingRec(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await saveCollaboratorRecognition({
        authorName: recName.trim(),
        roleLabel: 'Colaborador Editorial',
        title: recBadge.trim(),
        reason: recReason.trim(),
        date: new Date().toISOString().split('T')[0],
        featured: true
      });
      setRecName('');
      setRecReason('');
      setSuccessMsg('Reconocimiento publicado.');
      await loadAll();
    } catch {
      setErrorMsg('Error al guardar el reconocimiento.');
    } finally {
      setSavingRec(false);
    }
  };

  const handleDeleteRecognition = async (id: string) => {
    await deleteCollaboratorRecognition(id);
    await loadAll();
  };

  const pendingCorrectionsCount = corrections.filter((c) => c.status === 'pendiente').length;

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
            Participación, Agenda & Transparencia
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] dark:text-white mt-1">
            Herramientas Editoriales
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Gestiona encuestas ciudadanas, agenda de eventos, solicitudes de corrección, reconocimientos y estadísticas por artículo.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer self-start sm:self-auto"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('polls')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
            activeTab === 'polls'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          Encuestas Ciudadanas ({polls.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
            activeTab === 'events'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          Agenda de Eventos ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
            activeTab === 'corrections'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          Solicitudes de Corrección ({pendingCorrectionsCount})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          Reconocimientos y Estadísticas
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: CITIZEN POLLS */}
      {activeTab === 'polls' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateOrUpdatePoll}
            className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs h-fit"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                {editingPollId ? 'Editar Encuesta Ciudadana' : 'Nueva Encuesta Ciudadana'}
              </h2>
              {editingPollId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPollId(null);
                    setPollTitle('');
                    setPollQuestion('');
                    setPollDescription('');
                    setPollClosesAt('');
                    setPollFeatured(false);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Título de la encuesta (Opcional)
              </label>
              <input
                type="text"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="Ej. Consulta Regional 2026"
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Pregunta principal *
              </label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ej. ¿Cuál debe ser la prioridad de inversión regional?"
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Contexto breve (Opcional)
              </label>
              <input
                type="text"
                value={pollDescription}
                onChange={(e) => setPollDescription(e.target.value)}
                placeholder="Contexto de la consulta..."
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Opciones (una por línea) *
              </label>
              <textarea
                rows={4}
                value={pollOptionsText}
                onChange={(e) => setPollOptionsText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Fecha de finalización programada (Opcional)
              </label>
              <input
                type="datetime-local"
                value={pollClosesAt}
                onChange={(e) => setPollClosesAt(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
            <label className="flex items-center space-x-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pollFeatured}
                onChange={(e) => setPollFeatured(e.target.checked)}
                className="w-4 h-4 accent-gold-600 rounded"
              />
              <span>Destacar encuesta en la página principal</span>
            </label>
            <button
              type="submit"
              disabled={savingPoll}
              className="w-full py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {savingPoll ? 'Guardando...' : editingPollId ? 'Guardar Cambios' : 'Publicar Encuesta'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                Filtrar encuestas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'pendiente', 'activa', 'cerrada', 'rechazada'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPollStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase cursor-pointer ${
                      pollStatusFilter === st
                        ? 'bg-gold-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {st === 'all' ? 'Todas' : st}
                  </button>
                ))}
              </div>
            </div>

            {polls
              .filter((p) => (pollStatusFilter === 'all' ? true : p.status === pollStatusFilter))
              .map((poll) => {
                const total = poll.options.reduce((a, b) => a + (b.votes || 0), 0);
                return (
                  <div
                    key={poll.id}
                    className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        {poll.title && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600">
                            {poll.title}
                          </span>
                        )}
                        <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                          {poll.question}
                        </h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          Creador: <strong>{poll.creatorName || 'Julian Camilo'}</strong>{' '}
                          {poll.creatorPlanPeriod ? `(Plan ${poll.creatorPlanPeriod})` : ''} • Participantes:{' '}
                          <strong>{total}</strong> • Estado:{' '}
                          <strong className="uppercase">{poll.status}</strong>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {poll.status === 'pendiente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePollStatusChange(poll, 'activa')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white cursor-pointer"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePollStatusChange(poll, 'rechazada')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 text-white cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedPoll(poll)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            poll.featured
                              ? 'bg-gold-500 text-stone-950'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {poll.featured ? '★ Destacada' : 'Destacar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditPoll(poll)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
                        >
                          Editar
                        </button>
                        {poll.status !== 'pendiente' && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePollStatusChange(poll, poll.status === 'activa' ? 'cerrada' : 'activa')
                            }
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
                          >
                            {poll.status === 'activa' ? 'Cerrar' : 'Reabrir'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePoll(poll.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Eliminar encuesta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
                      {poll.options.map((o) => {
                        const pct = total > 0 ? Math.round(((o.votes || 0) / total) * 100) : 0;
                        return (
                          <div key={o.id} className="flex justify-between text-xs text-stone-600 dark:text-stone-300">
                            <span>{o.text}</span>
                            <span className="font-mono font-bold">
                              {pct}% ({o.votes || 0} votos)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS AGENDA */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateEvent}
            className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs h-fit"
          >
            <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
              Agregar Acontecimiento / Evento
            </h2>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Título del evento *
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Ej. Foro Regional sobre Transparencia"
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Categoría
                </label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as EditorialEventCategory)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  <option value="foro">Foro</option>
                  <option value="debate">Debate</option>
                  <option value="lanzamiento">Lanzamiento</option>
                  <option value="cultural">Cultural</option>
                  <option value="civico">Cívico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Lugar o modalidad
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Ej. Ibagué, Tolima / Transmisión en vivo"
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={savingEvent}
              className="w-full py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {savingEvent ? 'Guardando...' : 'Agregar a la Agenda'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 flex items-start justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gold-600">
                    {ev.category} • {ev.date}
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{ev.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CORRECTION REQUESTS */}
      {activeTab === 'corrections' && (
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800 shadow-xs">
          {corrections.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 font-serif italic">
              No hay solicitudes de corrección o aclaración registradas.
            </div>
          ) : (
            corrections.map((cor) => (
              <div key={cor.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {cor.sectionOrParagraph && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {cor.sectionOrParagraph}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                      {cor.status}
                    </span>
                    <span className="text-xs font-semibold text-[#121212] dark:text-white">
                      {cor.articleTitle}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">{cor.description}</p>
                  <p className="text-[11px] text-stone-400">
                    Enviado por: {cor.requesterName} {cor.requesterEmail ? `(${cor.requesterEmail})` : ''}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleCorrectionStatus(cor.id, 'aprobada')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleCorrectionStatus(cor.id, 'rechazada')}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: RECOGNITIONS & INDIVIDUAL PUBLICATION STATS */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateRecognition}
              className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs"
            >
              <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                Reconocimiento a Colaboradores
              </h2>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre del colaborador o autor *
                </label>
                <input
                  type="text"
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Distinción o insignia *
                </label>
                <input
                  type="text"
                  value={recBadge}
                  onChange={(e) => setRecBadge(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Motivo del reconocimiento *
                </label>
                <textarea
                  rows={2}
                  value={recReason}
                  onChange={(e) => setRecReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={savingRec}
                className="w-full py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {savingRec ? 'Guardando...' : 'Otorgar Reconocimiento'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {recognitions.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gold-600">{rec.title}</span>
                    <h4 className="font-serif font-bold text-sm text-[#121212] dark:text-white">
                      {rec.authorName}
                    </h4>
                    <p className="text-xs text-stone-500">{rec.reason}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteRecognition(rec.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Publication Statistics */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
              Estadísticas Individuales de Publicaciones ({articles.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Publicación</th>
                    <th className="py-3 px-3">Autor</th>
                    <th className="py-3 px-3">Lecturas</th>
                    <th className="py-3 px-3">Reacciones</th>
                    <th className="py-3 px-3">Fuentes</th>
                    <th className="py-3 px-3">Rectificaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {articles.map((art) => {
                    const totalReactions =
                      (art.reactions?.yellow || 0) +
                      (art.reactions?.blue || 0) +
                      (art.reactions?.red || 0);
                    return (
                      <tr key={art.id}>
                        <td className="py-3 px-3 font-semibold text-[#121212] dark:text-white max-w-xs truncate">
                          {art.title}
                        </td>
                        <td className="py-3 px-3 text-stone-500">{art.authorName || 'Julian Camilo'}</td>
                        <td className="py-3 px-3 font-mono font-bold">{art.views || 0}</td>
                        <td className="py-3 px-3 font-mono">{totalReactions}</td>
                        <td className="py-3 px-3 font-mono">{art.sources?.length || 0}</td>
                        <td className="py-3 px-3 font-mono">{art.rectifications?.length || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
