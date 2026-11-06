import React, { useState } from 'react';
import {
  Users,
  User,
  ShieldCheck,
  Scale,
  Target,
  Eye,
  BookOpen,
  BarChart3,
  FileText,
  FolderKanban,
  CalendarDays,
  CheckCircle2,
  Search,
  ShieldAlert,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  CmjActivity,
  CmjCommission,
  CmjDocument,
  CmjInstitutionalConfig,
  CmjMember,
  CmjProject,
  CmjRole,
  CmjSession,
  PublicPageId,
} from '../../types/cmj';
import { ROLE_HIERARCHY_ORDER, ROLE_LABELS } from '../../constants/cmj';
import { CmjBadges } from '../../components/cmj/CmjBadges';

/* =========================================================================
   2. QUIÉNES SOMOS
   ========================================================================= */
export const QuienesSomosPage: React.FC<{ config: CmjInstitutionalConfig }> = ({ config }) => {
  return (
    <div className="space-y-10">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Identidad Institucional · Flandes, Tolima
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Quiénes Somos
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 mt-2 max-w-3xl">
          {config.history}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 flex items-center justify-center text-[#8c162a] dark:text-[#f2c94c]">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Misión Institucional
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {config.mission}
          </p>
        </div>

        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#003893]/10 dark:bg-blue-400/15 flex items-center justify-center text-[#003893] dark:text-blue-400">
            <Eye className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Visión Institucional
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {config.vision}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            <BookOpen className="w-5 h-5 text-[#8c162a] dark:text-[#f2c94c]" />
            <span>Objetivos del Consejo</span>
          </h2>
          <ul className="space-y-3">
            {config.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-[#166534] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            <Scale className="w-5 h-5 text-[#003893] dark:text-blue-400" />
            <span>Marco Legal y Normativo</span>
          </h2>
          <ul className="space-y-3">
            {config.legalFramework.map((law, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                <ShieldCheck className="w-4 h-4 text-[#003893] dark:text-blue-400 shrink-0 mt-0.5" />
                <span>{law}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. INTEGRANTES DEL CMJ (AUTOMATIC HIERARCHY + PROFILE MODAL)
   ========================================================================= */
export const IntegrantesPage: React.FC<{
  members: CmjMember[];
  commissions: CmjCommission[];
  onSelectMember: (m: CmjMember) => void;
}> = ({ members, commissions, onSelectMember }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [commissionFilter, setCommissionFilter] = useState<string>('todas');

  const sorted = [...members]
    .sort((a, b) => (ROLE_HIERARCHY_ORDER[a.role] || 99) - (ROLE_HIERARCHY_ORDER[b.role] || 99))
    .filter((m) => {
      if (roleFilter !== 'todos' && m.role !== roleFilter) return false;
      if (commissionFilter !== 'todas' && m.commissionId !== commissionFilter) return false;
      if (
        search.trim() &&
        !m.fullName.toLowerCase().includes(search.toLowerCase()) &&
        !m.cargoTitle.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Directorio Oficial
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Integrantes del Consejo Municipal de Juventud
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Ordenados jerárquicamente: Presidente, Vicepresidente, Secretario, Consejeros y Responsables de Comisiones. Haz clic en cualquier integrante para ver su perfil completo.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o cargo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
        >
          <option value="todos">Todos los cargos</option>
          {(Object.keys(ROLE_LABELS) as CmjRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={commissionFilter}
          onChange={(e) => setCommissionFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-sm"
        >
          <option value="todas">Todas las comisiones</option>
          {commissions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center">
          <Users className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No se encontraron integrantes con los filtros seleccionados
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Los integrantes son registrados y publicados oficialmente por la Secretaría del CMJ Flandes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMember(m)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectMember(m);
              }}
              className="cursor-pointer rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-[#8c162a] dark:hover:border-[#f2c94c] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-stone-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c]">
                      {ROLE_LABELS[m.role]}
                    </span>
                    <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100 truncate">
                      {m.fullName}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {m.cargoTitle}
                    </p>
                  </div>
                </div>

                {m.commissionName && (
                  <p className="mt-3 text-xs font-semibold text-[#003893] dark:text-blue-400">
                    Comisión: {m.commissionName}
                  </p>
                )}

                <p className="mt-2 text-xs text-stone-600 dark:text-stone-300 line-clamp-3">
                  {m.bio}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                <CmjBadges
                  badges={m.badges}
                  politicalAffiliation={m.politicalAffiliation}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   4. GESTIÓN INSTITUCIONAL (REAL CALCULATED METRICS & REPORTS)
   ========================================================================= */
export const GestionPage: React.FC<{
  sessions: CmjSession[];
  documents: CmjDocument[];
  projects: CmjProject[];
  activities: CmjActivity[];
  onNavigate: (p: PublicPageId) => void;
}> = ({ sessions, documents, projects, activities, onNavigate }) => {
  const realizedSessions = sessions.filter((s) => s.status === 'realizada').length;
  const managementReports = documents.filter((d) => d.type === 'informe_gestion');
  const completedProjects = projects.filter((p) => p.status === 'finalizada').length;

  return (
    <div className="space-y-10">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
          Rendición de Cuentas
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Gestión Institucional
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Indicadores reales calculados directamente a partir de las sesiones, actas, proyectos y actividades publicadas por el CMJ Flandes.
        </p>
      </div>

      {/* Botones Solicitados dentro de Gestión: Control Político y Rendición de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#8c162a]/10 via-white dark:via-[#161920] to-[#8c162a]/5 border-2 border-[#8c162a]/30 dark:border-[#f2c94c]/40 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
                Veeduría e Interlocución
              </span>
            </div>
            <h2 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">
              Control Político a la Alcaldía
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Consulta las citaciones formales a secretarios de despacho de la Alcaldía de Flandes, cuestionarios oficiales radicados, respuestas institucionales y la vigilancia del CMJ al Plan de Desarrollo en temas de juventud.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('control-politico')}
            className="btn-dulima-primary justify-between w-full text-xs py-3 px-4"
          >
            <span>Ingresar a Control Político</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#003893]/10 via-white dark:via-[#161920] to-[#003893]/5 border-2 border-[#003893]/30 dark:border-blue-400/40 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#003893] text-white dark:bg-blue-600 dark:text-white">
                <Award className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#003893] dark:text-blue-400">
                Democracia Participativa
              </span>
            </div>
            <h2 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">
              Rendición de Cuentas
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Accede a las audiencias públicas ciudadanas del CMJ Flandes, informes periódicos radicados ante la Personería Municipal y formula preguntas para el próximo diálogo comunitario con las juventudes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('rendicion-cuentas')}
            className="btn-dulima-secondary justify-between w-full text-xs py-3 px-4 border-[#003893]/30 text-[#003893] dark:text-blue-300 dark:border-blue-700 hover:bg-[#003893]/5"
          >
            <span>Ingresar a Rendición de Cuentas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800">
          <CalendarDays className="w-6 h-6 text-[#8c162a] dark:text-[#f2c94c]" />
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100 mt-3">
            {realizedSessions} / {sessions.length}
          </p>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Sesiones realizadas / publicadas
          </p>
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800">
          <FileText className="w-6 h-6 text-[#003893] dark:text-blue-400" />
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100 mt-3">
            {documents.length}
          </p>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Documentos oficiales en archivo
          </p>
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800">
          <FolderKanban className="w-6 h-6 text-[#166534] dark:text-emerald-400" />
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100 mt-3">
            {completedProjects} / {projects.length}
          </p>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Proyectos finalizados / totales
          </p>
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800">
          <BarChart3 className="w-6 h-6 text-[#8c162a] dark:text-[#f2c94c]" />
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100 mt-3">
            {activities.length}
          </p>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Actividades juveniles ejecutadas
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Informes de Gestión Publicados
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('documentos')}
            className="text-xs font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c] hover:underline"
          >
            Ir a Actas y Documentos
          </button>
        </div>

        {managementReports.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
            Aún no se han publicado informes de gestión en el repositorio documental.
          </p>
        ) : (
          <div className="space-y-3">
            {managementReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {rep.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Fecha: {rep.documentDate} · Versión {rep.currentVersion} · Responsable: {rep.responsibleName}
                  </p>
                </div>
                <a
                  href={rep.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dulima-secondary py-1.5 px-3 text-xs"
                >
                  Descargar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   13. TRANSPARENCIA
   ========================================================================= */
export const TransparenciaPage: React.FC<{
  config: CmjInstitutionalConfig;
  documents: CmjDocument[];
  members: CmjMember[];
  onNavigate: (p: PublicPageId) => void;
}> = ({ config, documents, members, onNavigate }) => {
  return (
    <div className="space-y-10">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#166534] dark:text-emerald-400">
          Acceso a la Información Pública
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
          Portal de Transparencia
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-3xl">
          Compromiso institucional del Consejo Municipal de Juventud de Flandes con la publicidad, la trazabilidad documental y el control social ciudadano.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
            Principios de Transparencia del CMJ
          </h2>
          <ul className="space-y-3">
            {config.transparencyPrinciples.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                <ShieldCheck className="w-4 h-4 text-[#166534] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
            Acceso Directo a Información Oficial
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('documentos')}
              className="btn-dulima-secondary justify-start"
            >
              <FileText className="w-4 h-4" />
              <span>Actas ({documents.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('integrantes')}
              className="btn-dulima-secondary justify-start"
            >
              <Users className="w-4 h-4" />
              <span>Directorio ({members.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sesiones')}
              className="btn-dulima-secondary justify-start"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Sesiones y Convocatorias</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('participacion')}
              className="btn-dulima-secondary justify-start"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Radicar Propuesta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
