import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderKanban,
  FileText,
  Megaphone,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { CmjMember } from '../../../types/cmj.ts';
import { AdminWorkspaceResponse } from '../../../services/cmjApi.ts';
import { ROLE_LABELS } from '../../../constants/cmj.ts';

interface MiEspacioTabProps {
  user: CmjMember;
  workspace: AdminWorkspaceResponse;
  onNavigateTab: (tabId: any) => void;
}

export const MiEspacioTab: React.FC<MiEspacioTabProps> = ({
  user,
  workspace,
  onNavigateTab,
}) => {
  // Real calculations
  const myCommitments = (workspace.commitments || []).filter(
    (c) => c.responsibleId === user.id || c.responsibleName.toLowerCase() === user.fullName.toLowerCase()
  );
  const pendingCommitments = myCommitments.filter((c) => c.status === 'pendiente' || c.status === 'en_proceso');

  const upcomingSessions = (workspace.sessions || [])
    .filter((s) => s.status === 'programada' && s.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextSession = upcomingSessions[0] || null;

  const myProjects = (workspace.projects || []).filter(
    (p) => p.responsibleIds.includes(user.id) || p.responsibleNames.some((n) => n.toLowerCase() === user.fullName.toLowerCase())
  );

  const unreadNotifications = (workspace.internalNotifications || []).filter(
    (n) => !n.readByMemberIds.includes(user.id)
  );

  return (
    <div className="space-y-6">
      {/* Personalized Greeting Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#003893] via-[#002868] to-[#8c162a] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center font-display font-bold text-2xl text-yellow-300 shrink-0">
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-yellow-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>{ROLE_LABELS[user.role] || user.cargoTitle}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                ¡Hola, {user.fullName}!
              </h1>
              <p className="text-xs sm:text-sm text-stone-200 mt-0.5">
                {user.cargoTitle} · {user.commissionName || 'Consejo Municipal de Juventud Flandes, Tolima'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => onNavigateTab('compromisos')}
              className="px-4 py-2 rounded-xl bg-white text-[#003893] hover:bg-yellow-300 hover:text-stone-950 font-bold text-xs transition-colors shadow-md inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mis Compromisos ({pendingCommitments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('mi_perfil')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>Editar Mi Perfil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigateTab('sesiones')}
          className="p-4 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-[#003893] dark:hover:border-blue-500 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Próxima Sesión</span>
            <CalendarDays className="w-4 h-4 text-[#003893] dark:text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold mt-2 text-stone-900 dark:text-stone-100">
            {nextSession ? nextSession.date : 'Sin programar'}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
            {nextSession ? nextSession.title : 'No hay sesiones convocadas'}
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('compromisos')}
          className="p-4 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-amber-500 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Mis Tareas</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold mt-2 text-stone-900 dark:text-stone-100">
            {pendingCommitments.length}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
            Compromisos pendientes
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('proyectos')}
          className="p-4 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-emerald-500 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Proyectos</span>
            <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold mt-2 text-stone-900 dark:text-stone-100">
            {myProjects.length || workspace.projects.length}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
            {myProjects.length > 0 ? `${myProjects.length} asignados a mí` : `${workspace.projects.length} en el Consejo`}
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('comunicacion')}
          className="p-4 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-[#8c162a] cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Avisos Internos</span>
            <Megaphone className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold mt-2 text-stone-900 dark:text-stone-100">
            {unreadNotifications.length}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
            {unreadNotifications.length === 1 ? '1 aviso sin leer' : `${unreadNotifications.length} avisos sin leer`}
          </p>
        </div>
      </div>

      {/* Main Two-Column Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Next Session & Urgent Commitments */}
        <div className="lg:col-span-8 space-y-6">
          {/* Próxima Sesión Convocada */}
          <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#003893] dark:text-blue-400" />
                <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
                  Próxima Sesión del Consejo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('sesiones')}
                className="text-xs font-bold text-[#003893] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Ver calendario completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {nextSession ? (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                    {nextSession.sessionType} · {nextSession.sessionNumber}
                  </span>
                  <span className="text-xs text-stone-500">
                    {nextSession.date} a las {nextSession.startTime}
                  </span>
                </div>
                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  {nextSession.title}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  <strong>Lugar:</strong> {nextSession.location}
                </p>
                {nextSession.ordenDelDia && nextSession.ordenDelDia.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase text-stone-500 mb-1">
                      Orden del Día Propuesto:
                    </p>
                    <ul className="list-decimal list-inside space-y-0.5 text-xs text-stone-700 dark:text-stone-300">
                      {nextSession.ordenDelDia.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="truncate">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500 dark:text-stone-400 space-y-2">
                <CalendarDays className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-semibold">No hay sesiones plenarias programadas en este momento.</p>
                <p className="text-xs">
                  La Mesa Directiva y la Secretaría notificarán oportunamente las convocatorias oficiales.
                </p>
              </div>
            )}
          </div>

          {/* Mis Compromisos Asignados */}
          <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
                  Mis Tareas y Compromisos Institucionales
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('compromisos')}
                className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:underline inline-flex items-center gap-1"
              >
                <span>Gestionar compromisos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {myCommitments.length > 0 ? (
              <div className="space-y-2.5">
                {myCommitments.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Límite: {c.deadline} · Estado: <span className="font-bold uppercase">{c.status}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        c.status === 'cumplido'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : c.status === 'en_proceso'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500 dark:text-stone-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto opacity-40 text-emerald-600" />
                <p className="text-sm font-semibold">No tienes compromisos pendientes por cumplir.</p>
                <p className="text-xs">
                  Puedes registrar un nuevo compromiso institucional derivado de sesiones o mesas de trabajo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Commission, Knowledge & Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mi Comisión de Trabajo */}
          <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
              <span>Mi Comisión</span>
            </div>
            <h4 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
              {user.commissionName || 'Plenaria General'}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Trabajas activamente articulando iniciativas y propuestas para las juventudes de Flandes.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('comisiones')}
              className="w-full btn-dulima-secondary py-1.5 px-3 text-xs font-bold mt-2"
            >
              Ver Espacio de Comisión
            </button>
          </div>

          {/* Formación y Normatividad Rápida */}
          <div className="rounded-2xl p-6 bg-stone-100 dark:bg-[#1b1f28] border border-stone-200 dark:border-stone-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#003893] dark:text-blue-400">
              Biblioteca de Conocimiento
            </span>
            <h4 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
              Estatuto de Ciudadanía Juvenil
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              Consulta las leyes 1622 de 2013 y 1885 de 2018 para fundamentar tus iniciativas y debates.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('formacion')}
              className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:underline inline-flex items-center gap-1"
            >
              <span>Abrir módulo de formación</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Acceso a Secretaría y Actas */}
          <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4 text-[#003893] dark:text-blue-400" />
              <span>Secretaría Digital</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              {workspace.documents.length} documento(s) oficial(es) y actas registradas en el archivo histórico.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('actas')}
              className="w-full btn-dulima-primary py-1.5 px-3 text-xs font-bold"
            >
              Consultar Actas y Documentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
