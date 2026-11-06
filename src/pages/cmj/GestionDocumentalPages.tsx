import React, { useState } from 'react';
import {
  CalendarDays,
  FileText,
  FolderKanban,
  Briefcase,
  Search,
  Eye,
  Download,
  History,
  X,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import {
  CmjCommission,
  CmjDocument,
  CmjMember,
  CmjProject,
  CmjSession,
  DocumentType,
} from '../../types/cmj';
import { DOCUMENT_TYPE_LABELS } from '../../constants/cmj';

/* =========================================================================
   5. SESIONES
   ========================================================================= */
export const SesionesPage: React.FC<{ sessions: CmjSession[] }> = ({ sessions }) => {
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [typeFilter, setTypeFilter] = useState<string>('todas');

  const filtered = sessions.filter((s) => {
    if (statusFilter !== 'todas' && s.status !== statusFilter) return false;
    if (typeFilter !== 'todas' && s.sessionType !== typeFilter) return false;
    return true;
  });

  const statusBadge = (status: CmjSession['status']) => {
    switch (status) {
      case 'programada':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';
      case 'realizada':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300';
      case 'aplazada':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
      case 'cancelada':
        return 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300';
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Agenda y Convocatorias
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Sesiones del Consejo
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Consulta las sesiones ordinarias, extraordinarias, de comisiones y cabildos juveniles con su orden del día, compromisos y actas asociadas.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
        >
          <option value="todas">Todos los estados</option>
          <option value="programada">Programadas</option>
          <option value="realizada">Realizadas</option>
          <option value="aplazada">Aplazadas</option>
          <option value="cancelada">Canceladas</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
        >
          <option value="todas">Todos los tipos</option>
          <option value="ordinaria">Ordinaria</option>
          <option value="extraordinaria">Extraordinaria</option>
          <option value="comision">De Comisión</option>
          <option value="cabildo">Cabildo Juvenil</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <CalendarDays className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No hay sesiones registradas con estos filtros
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Las convocatorias y sesiones son publicadas oficialmente por la Secretaría del CMJ.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c]">
                    {s.sessionNumber} · Sesión {s.sessionType}
                  </span>
                  <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {s.title}
                  </h2>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${statusBadge(s.status)}`}>
                  {s.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-5 text-xs text-stone-600 dark:text-stone-300">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
                  {s.date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#003893] dark:text-blue-400" />
                  {s.startTime} {s.endTime ? `- ${s.endTime}` : ''}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#166534] dark:text-emerald-400" />
                  {s.location}
                </span>
              </div>

              {s.ordenDelDia && s.ordenDelDia.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Orden del Día
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-stone-700 dark:text-stone-300">
                    {s.ordenDelDia.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ol>
                </div>
              )}

              {s.commitments && s.commitments.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Compromisos y Decisiones
                  </h3>
                  <ul className="space-y-1 text-sm text-stone-700 dark:text-stone-300">
                    {s.commitments.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#166534] dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {s.attendance && s.attendance.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold uppercase text-stone-500">Asistencia:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    {s.attendance.filter((a) => a.status === 'presente').length} Presente(s)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                    {s.attendance.filter((a) => a.status === 'excusa').length} Con Excusa
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-bold">
                    {s.attendance.filter((a) => a.status === 'ausente').length} Ausente(s)
                  </span>
                </div>
              )}

              {s.observations && (
                <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                  Observaciones: {s.observations}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   6. ACTAS Y DOCUMENTOS (SEARCH, FILTERS, PDF VIEWER, VERSION HISTORY)
   ========================================================================= */
export const DocumentosPage: React.FC<{ documents: CmjDocument[] }> = ({ documents }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [viewerDoc, setViewerDoc] = useState<CmjDocument | null>(null);
  const [historyDoc, setHistoryDoc] = useState<CmjDocument | null>(null);

  const filtered = documents.filter((d) => {
    if (typeFilter !== 'todos' && d.type !== typeFilter) return false;
    if (
      search.trim() &&
      !d.title.toLowerCase().includes(search.toLowerCase()) &&
      !d.code.toLowerCase().includes(search.toLowerCase()) &&
      !d.responsibleName.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Archivo Oficial del CMJ Flandes
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Actas y Documentos Oficiales
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Repositorio institucional con visor integrado, descarga directa y trazabilidad completa de versiones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, código o responsable..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
        >
          <option value="todos">Todos los tipos documentales</option>
          {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <FileText className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No se encontraron documentos oficiales
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Las actas, convocatorias e informes se publican con control de versiones desde Secretaría.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 text-[#8c162a] dark:text-[#f2c94c]">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                  <span className="text-xs font-mono font-semibold text-stone-500">
                    {doc.code} · v{doc.currentVersion}
                  </span>
                  <span className="text-xs text-stone-500">· {doc.documentDate}</span>
                </div>
                <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                  {doc.title}
                </h2>
                {doc.description && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                    {doc.description}
                  </p>
                )}
                <p className="text-xs text-stone-500">
                  Responsable: <strong>{doc.responsibleName}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewerDoc(doc)}
                  className="btn-dulima-primary py-2 px-3.5 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualizar</span>
                </button>
                <a
                  href={doc.fileUrl}
                  download={doc.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dulima-secondary py-2 px-3.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setHistoryDoc(doc)}
                  className="btn-dulima-secondary py-2 px-3 text-xs"
                  title="Ver historial de versiones"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>v{doc.currentVersion}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF / Document Viewer Modal */}
      {viewerDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setViewerDoc(null)}
        >
          <div
            className="w-full max-w-5xl h-[85vh] bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase text-[#8c162a] dark:text-[#f2c94c]">
                  {viewerDoc.code} · Versión {viewerDoc.currentVersion}
                </span>
                <h3 className="text-base font-display font-bold text-stone-900 dark:text-stone-100 truncate">
                  {viewerDoc.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewerDoc.fileUrl}
                  download={viewerDoc.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dulima-secondary py-1.5 px-3 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewerDoc(null)}
                  className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-stone-100 dark:bg-stone-950">
              <iframe
                src={viewerDoc.fileUrl}
                title={viewerDoc.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {historyDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setHistoryDoc(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                Historial de Versiones · {historyDoc.code}
              </h3>
              <button
                type="button"
                onClick={() => setHistoryDoc(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[...historyDoc.versions].reverse().map((v) => (
                <div
                  key={v.version}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c]">
                      Versión {v.version}
                    </span>
                    <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                      {v.notes}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Por {v.uploadedBy} · {new Date(v.uploadedAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <a
                    href={v.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-dulima-secondary py-1.5 px-2.5 text-xs shrink-0"
                  >
                    Abrir
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   7. PROYECTOS E INICIATIVAS
   ========================================================================= */
export const ProyectosPage: React.FC<{ projects: CmjProject[] }> = ({ projects }) => {
  const [statusFilter, setStatusFilter] = useState('todos');

  const filtered = projects.filter((p) =>
    statusFilter === 'todos' ? true : p.status === statusFilter
  );

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Iniciativas Juveniles
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Proyectos e Iniciativas
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Seguimiento a las propuestas, proyectos en ejecución y resultados alcanzados para la juventud de Flandes, Tolima.
        </p>
      </div>

      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
        >
          <option value="todos">Todos los estados</option>
          <option value="propuesta">Propuesta</option>
          <option value="en_revision">En revisión</option>
          <option value="aprobada">Aprobada</option>
          <option value="en_ejecucion">En ejecución</option>
          <option value="finalizada">Finalizada</option>
          <option value="archivada">Archivada</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <FolderKanban className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No hay proyectos registrados en esta categoría
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-[#003893]/10 dark:bg-blue-400/15 text-[#003893] dark:text-blue-300">
                    {proj.status.replace('_', ' ')}
                  </span>
                  {proj.commissionName && (
                    <span className="text-xs font-semibold text-stone-500">
                      {proj.commissionName}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
                  {proj.name}
                </h2>

                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {proj.description}
                </p>

                {proj.justification && (
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    <strong>Justificación:</strong> {proj.justification}
                  </div>
                )}

                <div className="text-xs text-stone-500 dark:text-stone-400">
                  <strong>Población beneficiaria:</strong> {proj.beneficiaryPopulation}
                </div>

                {proj.objectives && proj.objectives.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase text-stone-500 mb-1">Objetivos:</p>
                    <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                      {proj.objectives.map((o, i) => (
                        <li key={i}>• {o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-stone-500">Avance del proyecto</span>
                  <span className="text-[#8c162a] dark:text-[#f2c94c]">{proj.progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-[#8c162a] dark:bg-[#f2c94c] rounded-full transition-all"
                    style={{ width: `${proj.progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  Responsables: {proj.responsibleNames.join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   10. COMISIONES DE TRABAJO
   ========================================================================= */
export const ComisionesPage: React.FC<{
  commissions: CmjCommission[];
  members: CmjMember[];
  projects: CmjProject[];
}> = ({ commissions, members, projects }) => {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Organización Temática
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Comisiones de Trabajo
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Mesas temáticas permanentes y especiales del Consejo Municipal de Juventud de Flandes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {commissions.map((com) => {
          const comMembers = members.filter(
            (m) => m.commissionId === com.id || com.memberIds.includes(m.id)
          );
          const comProjects = projects.filter((p) => p.commissionId === com.id);

          return (
            <div
              key={com.id}
              className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 flex items-center justify-center text-[#8c162a] dark:text-[#f2c94c] shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                      {com.name}
                    </h2>
                    {com.leadMemberName && (
                      <p className="text-xs font-semibold text-[#003893] dark:text-blue-400">
                        Responsable: {com.leadMemberName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {com.description}
              </p>

              {com.objectives && com.objectives.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Objetivos
                  </h3>
                  <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                    {com.objectives.map((o, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {comMembers.length} integrante(s)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5" />
                  {comProjects.length} proyecto(s)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
