import React, { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  Flag,
  BarChart3,
  Settings,
  Ban,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Save,
  ShieldAlert
} from 'lucide-react';
import {
  Collaborator,
  LiveReport,
  LiveStream,
  LiveTechnicalSettings
} from '../../types';
import {
  getLiveStreams,
  updateLiveStream,
  deleteLiveStream,
  getCollaborators,
  saveCollaborator,
  getLiveReports,
  updateLiveReportStatus,
  getLiveTechnicalSettings,
  saveLiveTechnicalSettings
} from '../../services/db';

interface AdminLiveProps {
  ownerEmail: string;
}

export const AdminLive: React.FC<AdminLiveProps> = ({ ownerEmail }) => {
  const [tab, setTab] = useState<'streams' | 'permissions' | 'reports' | 'stats' | 'settings'>('streams');
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [reports, setReports] = useState<LiveReport[]>([]);
  const [techSettings, setTechSettings] = useState<LiveTechnicalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sList, cList, rList, tSet] = await Promise.all([
        getLiveStreams(true),
        getCollaborators(),
        getLiveReports(),
        getLiveTechnicalSettings()
      ]);
      setStreams(sList);
      setCollaborators(cList);
      setReports(rList);
      setTechSettings(tSet);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockOrCancelStream = async (stream: LiveStream, nextStatus: 'bloqueado' | 'cancelado') => {
    await updateLiveStream(stream.id, { status: nextStatus });
    await loadAll();
    setFeedback(`Transmisión "${stream.title}" marcada como ${nextStatus}.`);
  };

  const handleToggleDownload = async (stream: LiveStream) => {
    const next = !stream.allowDownload;
    await updateLiveStream(stream.id, { allowDownload: next });
    await loadAll();
    setFeedback(
      next
        ? `Descarga habilitada para "${stream.title}".`
        : `Descarga deshabilitada para "${stream.title}".`
    );
  };

  const handleToggleCollaboratorLive = async (col: Collaborator) => {
    const current = Boolean(col.permissions?.live_create);
    const nextPerms = { ...(col.permissions || {}), live_create: !current };
    await saveCollaborator({ ...col, permissions: nextPerms }, col.id);
    await loadAll();
    setFeedback(
      !current
        ? `Permiso LIVE activado para ${col.fullName}.`
        : `Permiso LIVE revocado para ${col.fullName}.`
    );
  };

  const handleSaveTechSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techSettings) return;
    await saveLiveTechnicalSettings(techSettings);
    setFeedback('Configuración técnica de LIVE guardada.');
  };

  // Separated DULIMA vs External Platform Metrics
  const totalDulimaViews = streams.reduce((acc, s) => acc + (s.totalViews || 0), 0);
  const totalDulimaReactions = streams.reduce(
    (acc, s) =>
      acc +
      (s.reactions?.like || 0) +
      (s.reactions?.applause || 0) +
      (s.reactions?.fire || 0) +
      (s.reactions?.support || 0) +
      (s.reactions?.insightful || 0),
    0
  );
  const totalYoutubeViews = streams.reduce(
    (acc, s) =>
      acc + (s.destinations?.find((d) => d.platform === 'youtube')?.externalViewers || 0),
    0
  );
  const totalFacebookViews = streams.reduce(
    (acc, s) =>
      acc + (s.destinations?.find((d) => d.platform === 'facebook')?.externalViewers || 0),
    0
  );
  const totalInstagramViews = streams.reduce(
    (acc, s) =>
      acc + (s.destinations?.find((d) => d.platform === 'instagram')?.externalViewers || 0),
    0
  );
  const totalTiktokViews = streams.reduce(
    (acc, s) =>
      acc + (s.destinations?.find((d) => d.platform === 'tiktok')?.externalViewers || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#121212] dark:text-white">
          Administración LIVE de DULIMA
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          Supervisa transmisiones en directo, permisos de colaboradores, grabaciones, reportes, estadísticas separadas por plataforma y límites técnicos.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 overflow-x-auto">
        {[
          { id: 'streams', label: `Transmisiones (${streams.length})` },
          { id: 'permissions', label: 'Permisos Colaboradores' },
          { id: 'reports', label: `Reportes (${reports.filter((r) => r.status === 'pendiente').length})` },
          { id: 'stats', label: 'Estadísticas Separadas' },
          { id: 'settings', label: 'Límites Técnicos' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
              tab === t.id
                ? 'bg-[#ce1126] text-white'
                : 'bg-white dark:bg-[#18181c] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* TAB 1: STREAMS & RECORDINGS */}
      {tab === 'streams' && (
        <div className="space-y-3">
          {streams.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-center text-sm text-stone-500">
              No hay transmisiones registradas.
            </div>
          ) : (
            streams.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-[#121212] dark:text-white">
                      {s.title}
                    </span>
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                      {s.status}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Presentador: {s.hostName} ({s.hostRole}) · {s.totalViews || 0} vistas ·{' '}
                    {new Date(s.createdAt).toLocaleString('es-CO')}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {s.recordingUrl && (
                    <button
                      type="button"
                      onClick={() => handleToggleDownload(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        s.allowDownload
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.allowDownload ? 'Descarga activa' : 'Permitir descarga'}
                    </button>
                  )}

                  {s.status !== 'bloqueado' && (
                    <button
                      type="button"
                      onClick={() => handleBlockOrCancelStream(s, 'bloqueado')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Bloquear</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      await deleteLiveStream(s.id);
                      await loadAll();
                    }}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: COLLABORATOR LIVE PERMISSIONS */}
      {tab === 'permissions' && (
        <div className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-200 dark:divide-stone-800">
          {collaborators.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500">No hay colaboradores registrados.</div>
          ) : (
            collaborators.map((col) => {
              const hasLive = Boolean(col.permissions?.live_create);
              return (
                <div key={col.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-[#121212] dark:text-white">{col.fullName}</div>
                    <div className="text-xs text-stone-500">
                      {col.email} · Estado: {col.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCollaboratorLive(col)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                      hasLive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {hasLive ? 'LIVE Autorizado (Revocar)' : 'Autorizar LIVE'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: REPORTS */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-center text-sm text-stone-500">
              No hay reportes de transmisiones LIVE.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-sm text-[#121212] dark:text-white">
                    {rep.streamTitle} — {rep.reason}
                  </div>
                  <div className="text-xs text-stone-500">
                    Reportado por: {rep.reporterName} · Estado: {rep.status}
                  </div>
                </div>
                {rep.status === 'pendiente' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateLiveReportStatus(rep.id, 'revisado');
                        await loadAll();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Marcar revisado
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateLiveReportStatus(rep.id, 'descartado');
                        await loadAll();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs font-bold cursor-pointer"
                    >
                      Descartar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: SEPARATED PLATFORM STATISTICS */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
            <strong>Transparencia de métricas:</strong> DULIMA separa sus métricas nativas de las reportadas por YouTube,
            Facebook e Instagram, sin sumar audiencias de distintas plataformas como si fueran usuarios únicos.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800">
              <div className="text-xs font-bold text-[#ce1126] uppercase">DULIMA LIVE (Nativo)</div>
              <div className="text-2xl font-black mt-1 text-[#121212] dark:text-white">{totalDulimaViews}</div>
              <div className="text-xs text-stone-500 mt-1">{totalDulimaReactions} reacciones totales</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800">
              <div className="text-xs font-bold text-rose-600 uppercase">YouTube Live</div>
              <div className="text-2xl font-black mt-1 text-[#121212] dark:text-white">{totalYoutubeViews}</div>
              <div className="text-xs text-stone-500 mt-1">Vistas reportadas por YouTube</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800">
              <div className="text-xs font-bold text-sky-600 uppercase">Facebook Live</div>
              <div className="text-2xl font-black mt-1 text-[#121212] dark:text-white">{totalFacebookViews}</div>
              <div className="text-xs text-stone-500 mt-1">Vistas reportadas por Meta</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800">
              <div className="text-xs font-bold text-pink-600 uppercase">Instagram Live</div>
              <div className="text-2xl font-black mt-1 text-[#121212] dark:text-white">{totalInstagramViews}</div>
              <div className="text-xs text-stone-500 mt-1">Vistas reportadas por Instagram</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800">
              <div className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase">TikTok Live</div>
              <div className="text-2xl font-black mt-1 text-[#121212] dark:text-white">{totalTiktokViews}</div>
              <div className="text-xs text-stone-500 mt-1">Vistas reportadas por TikTok</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TECHNICAL LIMITS */}
      {tab === 'settings' && techSettings && (
        <form
          onSubmit={handleSaveTechSettings}
          className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 max-w-xl"
        >
          <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
            Límites Técnicos e Infraestructura LIVE
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Máximo de invitados por sala</label>
              <input
                type="number"
                min={1}
                max={8}
                value={techSettings.maxGuestsDefault}
                onChange={(e) =>
                  setTechSettings({ ...techSettings, maxGuestsDefault: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Bitrate máximo (Kbps)</label>
              <input
                type="number"
                min={500}
                max={10000}
                step={500}
                value={techSettings.maxBitrateKbps}
                onChange={(e) =>
                  setTechSettings({ ...techSettings, maxBitrateKbps: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9B1B30] text-white text-xs font-bold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar límites técnicos</span>
          </button>
        </form>
      )}
    </div>
  );
};
