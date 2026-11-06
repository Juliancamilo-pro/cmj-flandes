import React, { useState } from 'react';
import {
  Newspaper,
  CalendarDays,
  Megaphone,
  BarChart3,
  Image as ImageIcon,
  Mail,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  X,
  Scale,
  MessageSquare,
} from 'lucide-react';
import {
  CmjActivity,
  CmjArticle,
  CmjInstitutionalConfig,
  CmjMediaItem,
  CmjPoll,
  MediaCategory,
} from '../../types/cmj';
import { MEDIA_CATEGORY_LABELS } from '../../constants/cmj';
import { cmjApi } from '../../services/cmjApi';

/* =========================================================================
   8. NOTICIAS Y COMUNICADOS
   ========================================================================= */
export const NoticiasPage: React.FC<{ articles: CmjArticle[] }> = ({ articles }) => {
  const [kindFilter, setKindFilter] = useState<'todos' | 'comunicado_oficial' | 'opinion_articulo'>('todos');
  const [selectedArticle, setSelectedArticle] = useState<CmjArticle | null>(null);

  const filtered = articles.filter((a) => (kindFilter === 'todos' ? true : a.kind === kindFilter));

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Prensa y Pronunciamientos
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Noticias y Comunicados Oficiales
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Diferenciación clara entre los Comunicados Oficiales del Consejo Municipal de Juventud y los artículos de opinión de sus integrantes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'todos', label: 'Todas las publicaciones' },
          { id: 'comunicado_oficial', label: 'Comunicados Oficiales del CMJ' },
          { id: 'opinion_articulo', label: 'Opinión y Artículos' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setKindFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
              kindFilter === tab.id
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <Newspaper className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            Aún no hay noticias o comunicados publicados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedArticle(art);
              }}
              className="cursor-pointer rounded-2xl overflow-hidden bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-[#8c162a] dark:hover:border-[#f2c94c] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {art.coverImageUrl && (
                  <div className="h-44 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <img
                      src={art.coverImageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 space-y-2.5">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      art.kind === 'comunicado_oficial'
                        ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                        : 'bg-[#003893]/10 text-[#003893] dark:bg-blue-400/15 dark:text-blue-300'
                    }`}
                  >
                    {art.kind === 'comunicado_oficial'
                      ? 'Comunicado Oficial del CMJ'
                      : 'Opinión / Artículo'}
                  </span>
                  <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100 line-clamp-2">
                    {art.title}
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3">
                    {art.summary}
                  </p>
                </div>
              </div>
              <div className="px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
                <span>{art.authorName}</span>
                <span>
                  {art.publishedAt
                    ? new Date(art.publishedAt).toLocaleDateString('es-CO')
                    : new Date(art.createdAt).toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                    selectedArticle.kind === 'comunicado_oficial'
                      ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                      : 'bg-[#003893]/10 text-[#003893] dark:bg-blue-400/15 dark:text-blue-300'
                  }`}
                >
                  {selectedArticle.kind === 'comunicado_oficial'
                    ? 'Comunicado Oficial del CMJ'
                    : 'Opinión / Artículo'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 dark:text-stone-100 mt-2">
                  {selectedArticle.title}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Por <strong>{selectedArticle.authorName}</strong> ({selectedArticle.authorCargo}) · Versión {selectedArticle.versions.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto space-y-4">
              {selectedArticle.coverImageUrl && (
                <img
                  src={selectedArticle.coverImageUrl}
                  alt={selectedArticle.title}
                  className="w-full max-h-80 object-cover rounded-xl"
                />
              )}
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-stone-700 dark:text-stone-200">
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   9. ACTIVIDADES
   ========================================================================= */
export const ActividadesPage: React.FC<{ activities: CmjActivity[] }> = ({ activities }) => {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Agenda Territorial
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Actividades y Jornadas Juveniles
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Encuentros, mesas de trabajo, jornadas comunitarias y eventos realizados en Flandes, Tolima.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <CalendarDays className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No hay actividades publicadas aún
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map((act) => (
            <div
              key={act.id}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#166534] dark:text-emerald-400">
                  <span>{act.date}</span>
                  {act.time && <span>· {act.time}</span>}
                  <span>· {act.location}</span>
                </div>
                <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {act.title}
                </h2>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {act.description}
              </p>

              {act.results && (
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 text-xs text-stone-700 dark:text-stone-300">
                  <strong>Resultados:</strong> {act.results}
                </div>
              )}

              <p className="text-xs text-stone-500">
                Responsables: {act.responsibleNames.join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   11. PARTICIPACIÓN JUVENIL (PROPUESTAS + SEGUIMIENTO POR RADICADO)
   ========================================================================= */
export const ParticipacionPage: React.FC = () => {
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorPhone, setAuthorPhone] = useState('');
  const [authorAge, setAuthorAge] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [topic, setTopic] = useState('Educación');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setCreatedCode(null);
    try {
      const res = await cmjApi.submitProposal({
        authorName,
        authorEmail,
        authorPhone: authorPhone || undefined,
        authorAge: authorAge ? Number(authorAge) : undefined,
        neighborhood: neighborhood || undefined,
        topic,
        title,
        description,
        honeypot,
      });
      setCreatedCode(res.trackingCode);
      setAuthorName('');
      setAuthorEmail('');
      setAuthorPhone('');
      setAuthorAge('');
      setNeighborhood('');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setSubmitError(err?.message || 'No se pudo radicar la propuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackResult(null);
    try {
      const res = await cmjApi.trackProposal(trackCode.trim());
      setTrackResult(res);
    } catch (err: any) {
      setTrackError(err?.message || 'Código de radicado no encontrado.');
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Incidencia Ciudadana
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Participación Juvenil
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Envía tus propuestas, iniciativas o solicitudes al Consejo Municipal de Juventud de Flandes y consulta su estado con tu código de radicado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-7 rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800">
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 mb-4">
            Radicar Propuesta o Solicitud
          </h2>

          {createdCode && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-900 dark:text-emerald-200">
              <p className="font-bold">¡Propuesta radicada exitosamente!</p>
              <p className="mt-1 text-xs">
                Tu código de seguimiento es:{' '}
                <strong className="font-mono text-sm underline">{createdCode}</strong>. Guárdalo para consultar la respuesta oficial del Consejo.
              </p>
            </div>
          )}

          {submitError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={authorPhone}
                  onChange={(e) => setAuthorPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Edad
                </label>
                <input
                  type="number"
                  min={14}
                  max={28}
                  value={authorAge}
                  onChange={(e) => setAuthorAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Barrio o Vereda
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Eje Temático *
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                >
                  <option value="Educación">Educación</option>
                  <option value="Cultura">Cultura</option>
                  <option value="Deporte">Deporte</option>
                  <option value="Salud">Salud y Salud Mental</option>
                  <option value="Medio Ambiente">Medio Ambiente</option>
                  <option value="Empleo y Emprendimiento">Empleo y Emprendimiento</option>
                  <option value="Participación Juvenil">Participación Juvenil</option>
                  <option value="Derechos Humanos">Derechos Humanos</option>
                  <option value="Tecnología">Tecnología e Innovación</option>
                  <option value="Desarrollo Social">Desarrollo Social</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Título de la propuesta *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                Descripción detallada *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-dulima-primary py-3 px-6"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Radicando...' : 'Enviar Propuesta al CMJ'}</span>
            </button>
          </form>
        </div>

        {/* Tracking */}
        <div className="lg:col-span-5 rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-5 h-fit">
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Consultar Estado de Propuesta
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Ingresa el código de radicado (ej. CMJ-2026-XXXX) para verificar si tu iniciativa fue recibida, está en revisión, aceptada o respondida.
          </p>

          <form onSubmit={handleTrack} className="flex gap-2">
            <input
              type="text"
              required
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              placeholder="CMJ-2026-XXXX"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-mono uppercase"
            />
            <button type="submit" className="btn-dulima-primary px-4">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {trackError && (
            <p className="text-xs text-red-600 dark:text-red-400">{trackError}</p>
          )}

          {trackResult && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#8c162a] dark:text-[#f2c94c]">
                  {trackResult.trackingCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                  {trackResult.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {trackResult.title}
              </h3>
              {trackResult.institutionalResponse && (
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
                  <p className="font-bold text-[#166534] dark:text-emerald-400 mb-1">
                    Respuesta Institucional:
                  </p>
                  <p>{trackResult.institutionalResponse}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   12. ENCUESTAS Y VOTACIONES (EXPLICIT DISTINCTION + DUPLICATE PREVENTION)
   ========================================================================= */
export const EncuestasPage: React.FC<{
  polls: CmjPoll[];
  onPollUpdated: (updated: CmjPoll) => void;
}> = ({ polls, onPollUpdated }) => {
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<Record<string, string>>({});

  const getVoterKey = () => {
    let key = localStorage.getItem('cmj_voter_device_id');
    if (!key) {
      key = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('cmj_voter_device_id', key);
    }
    return key;
  };

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingId(pollId);
    setVoteError((prev) => ({ ...prev, [pollId]: '' }));
    try {
      const res = await cmjApi.votePoll(pollId, optionId, getVoterKey());
      onPollUpdated(res.poll);
    } catch (err: any) {
      setVoteError((prev) => ({
        ...prev,
        [pollId]: err?.message || 'No se pudo registrar el voto.',
      }));
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Consultas y Decisiones
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Encuestas y Votaciones
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Cada consulta indica explícitamente si corresponde a una <strong>Encuesta de Opinión Ciudadana</strong> o a una <strong>Votación Oficial / Decisión del Consejo</strong>.
        </p>
      </div>

      {polls.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <BarChart3 className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No hay encuestas o votaciones publicadas en este momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {polls.map((poll) => {
            const isOfficialVote = poll.pollKind === 'votacion_oficial';
            return (
              <div
                key={poll.id}
                className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                      isOfficialVote
                        ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                        : 'bg-[#003893]/10 text-[#003893] dark:bg-blue-400/15 dark:text-blue-300'
                    }`}
                  >
                    {isOfficialVote ? (
                      <>
                        <Scale className="w-3.5 h-3.5" />
                        <span>Votación Oficial / Decisión del Consejo</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Encuesta de Opinión Ciudadana</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs font-bold text-stone-500">
                    {poll.totalVotes} voto(s)
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
                    {poll.title}
                  </h2>
                  {poll.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                      {poll.description}
                    </p>
                  )}
                </div>

                {voteError[poll.id] && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                    {voteError[poll.id]}
                  </div>
                )}

                <div className="space-y-2.5">
                  {poll.options.map((opt) => {
                    const pct =
                      poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="space-y-1">
                        <button
                          type="button"
                          disabled={!poll.isActive || votingId === poll.id}
                          onClick={() => handleVote(poll.id, opt.id)}
                          className="w-full text-left p-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[#8c162a] dark:hover:border-[#f2c94c] transition-colors flex items-center justify-between gap-3"
                        >
                          <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                            {opt.text}
                          </span>
                          <span className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] shrink-0">
                            {pct}% ({opt.votes})
                          </span>
                        </button>
                        <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            className="h-full bg-[#8c162a] dark:bg-[#f2c94c] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-stone-500">
                  Cierre: {new Date(poll.closesAt).toLocaleDateString('es-CO')} ·{' '}
                  {poll.isActive ? 'Abierta' : 'Cerrada'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   14. GALERÍA MULTIMEDIA
   ========================================================================= */
export const GaleriaPage: React.FC<{ media: CmjMediaItem[] }> = ({ media }) => {
  const [category, setCategory] = useState<string>('todas');
  const [lightbox, setLightbox] = useState<CmjMediaItem | null>(null);

  const filtered = media.filter((m) => (category === 'todas' ? true : m.category === category));

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Archivo Visual
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Galería Multimedia
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Registro fotográfico y audiovisual de sesiones, actividades, proyectos y jornadas juveniles en Flandes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('todas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase ${
            category === 'todas'
              ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
              : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800'
          }`}
        >
          Todas
        </button>
        {(Object.keys(MEDIA_CATEGORY_LABELS) as MediaCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase ${
              category === cat
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800'
            }`}
          >
            {MEDIA_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <ImageIcon className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No hay elementos multimedia en esta categoría
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightbox(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setLightbox(item);
              }}
              className="cursor-pointer rounded-2xl overflow-hidden bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-[#8c162a] dark:hover:border-[#f2c94c] transition-all"
            >
              <div className="h-52 bg-stone-100 dark:bg-stone-900 overflow-hidden">
                {item.mediaType === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase text-[#8c162a] dark:text-[#f2c94c]">
                  {MEDIA_CATEGORY_LABELS[item.category]} · {item.eventDate}
                </span>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-4xl w-full bg-white dark:bg-[#161920] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {lightbox.title}
              </h3>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[75vh]">
              {lightbox.mediaType === 'video' ? (
                <video src={lightbox.url} controls className="max-h-[70vh] w-full" />
              ) : (
                <img
                  src={lightbox.url}
                  alt={lightbox.title}
                  className="max-h-[70vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   15. CONTACTO
   ========================================================================= */
export const ContactoPage: React.FC<{ config: CmjInstitutionalConfig }> = ({ config }) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSent(false);
    try {
      await cmjApi.submitContact({
        senderName,
        senderEmail,
        senderPhone: senderPhone || undefined,
        subject,
        message,
        honeypot,
      });
      setSent(true);
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Canales Oficiales
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Contacto Institucional
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Comunícate directamente con la Secretaría y la Mesa Directiva del Consejo Municipal de Juventud de Flandes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
            <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              Información de Atención
            </h2>
            <div className="space-y-3 text-sm text-stone-600 dark:text-stone-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c] shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-stone-900 dark:text-stone-100">Sede Institucional</p>
                  <p>{config.officeAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#003893] dark:text-blue-400 shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-stone-900 dark:text-stone-100">Correo Oficial</p>
                  <p className="break-all">{config.institutionalEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#166534] dark:text-emerald-400 shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-stone-900 dark:text-stone-100">Horario de Atención</p>
                  <p>{config.officeHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800">
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 mb-4">
            Enviar Mensaje
          </h2>

          {sent && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
              Tu mensaje ha sido registrado y enviado a la Secretaría del CMJ Flandes.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Asunto *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                Mensaje *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm"
              />
            </div>

            <button type="submit" disabled={sending} className="btn-dulima-primary py-3 px-6">
              <Send className="w-4 h-4" />
              <span>{sending ? 'Enviando...' : 'Enviar Mensaje'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
