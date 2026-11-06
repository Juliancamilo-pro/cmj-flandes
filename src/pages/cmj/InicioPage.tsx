import React from 'react';
import {
  ArrowRight,
  Users,
  FileText,
  CalendarDays,
  FolderKanban,
  Newspaper,
  Megaphone,
  BarChart3,
  ShieldCheck,
  User,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  CmjActivity,
  CmjArticle,
  CmjDocument,
  CmjInstitutionalConfig,
  CmjMember,
  CmjPoll,
  CmjProject,
  CmjSession,
  PublicPageId,
} from '../../types/cmj';
import { DOCUMENT_TYPE_LABELS, ROLE_HIERARCHY_ORDER, ROLE_LABELS } from '../../constants/cmj';
import { CmjBadges } from '../../components/cmj/CmjBadges';

interface InicioPageProps {
  config: CmjInstitutionalConfig;
  members: CmjMember[];
  sessions: CmjSession[];
  documents: CmjDocument[];
  projects: CmjProject[];
  articles: CmjArticle[];
  activities: CmjActivity[];
  polls: CmjPoll[];
  onNavigate: (page: PublicPageId) => void;
  onSelectMember: (member: CmjMember) => void;
}

export const InicioPage: React.FC<InicioPageProps> = ({
  config,
  members,
  sessions,
  documents,
  projects,
  articles,
  activities,
  polls,
  onNavigate,
  onSelectMember,
}) => {
  const sortedMembers = [...members].sort(
    (a, b) => (ROLE_HIERARCHY_ORDER[a.role] || 99) - (ROLE_HIERARCHY_ORDER[b.role] || 99)
  );

  const presidente = sortedMembers.find((m) => m.role === 'presidente');
  const vicepresidente = sortedMembers.find((m) => m.role === 'vicepresidente');
  const secretario = sortedMembers.find(
    (m) => m.role === 'secretario' || m.role === 'admin_principal'
  );
  const otherMembers = sortedMembers.filter(
    (m) => m.id !== presidente?.id && m.id !== vicepresidente?.id && m.id !== secretario?.id
  );

  const mesaDirectivaSlots: {
    order: number;
    label: string;
    member?: CmjMember;
  }[] = [
    { order: 1, label: '1. Presidente del CMJ', member: presidente },
    { order: 2, label: '2. Vicepresidente del CMJ', member: vicepresidente },
    { order: 3, label: '3. Secretario del CMJ', member: secretario },
  ];

  const upcomingSessions = sessions.filter((s) => s.status === 'programada').slice(0, 3);
  const recentDocs = documents.slice(0, 4);
  const recentNews = articles.slice(0, 3);
  const recentActivities = activities.slice(0, 3);
  const activeProjects = projects.slice(0, 3);
  const activePolls = polls.filter((p) => p.isActive).slice(0, 2);

  return (
    <div className="space-y-16">
      {/* 1. Hero Institucional */}
      <section className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="grid grid-cols-2 h-2 w-full">
          <div className="colombia-ribbon h-full">
            <div className="colombia-yellow" />
            <div className="colombia-blue" />
            <div className="colombia-red" />
          </div>
          <div className="tolima-ribbon h-full">
            <div className="tolima-vinotinto" />
            <div className="tolima-gold" />
          </div>
        </div>

        <div className="p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 text-[#8c162a] dark:text-[#f2c94c] text-xs font-bold uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5" />
              <span>Flandes · Tolima · Colombia</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.12]">
              Consejo Municipal de Juventud Flandes
            </h1>

            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
              {config.mission}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('participacion')}
                className="btn-dulima-primary"
              >
                <Megaphone className="w-4 h-4" />
                <span>Enviar Propuesta Juvenil</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('documentos')}
                className="btn-dulima-secondary"
              >
                <FileText className="w-4 h-4" />
                <span>Consultar Actas y Documentos</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('integrantes')}
                className="btn-dulima-secondary"
              >
                <Users className="w-4 h-4" />
                <span>Ver Integrantes</span>
              </button>
            </div>
          </div>

          {/* Real Institutional Summary Card (Zero Fake Numbers) */}
          <div className="lg:col-span-4 bg-stone-50 dark:bg-stone-900/70 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Estado Institucional
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#166534] dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Ley 1622 / 1885</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#161920] border border-stone-200/80 dark:border-stone-800">
                <p className="text-2xl font-display font-bold text-[#8c162a] dark:text-[#f2c94c]">
                  {members.length}
                </p>
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5">
                  Integrantes activos
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#161920] border border-stone-200/80 dark:border-stone-800">
                <p className="text-2xl font-display font-bold text-[#003893] dark:text-blue-400">
                  {sessions.length}
                </p>
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5">
                  Sesiones publicadas
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#161920] border border-stone-200/80 dark:border-stone-800">
                <p className="text-2xl font-display font-bold text-[#166534] dark:text-emerald-400">
                  {documents.length}
                </p>
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5">
                  Actas y documentos
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#161920] border border-stone-200/80 dark:border-stone-800">
                <p className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">
                  {projects.length}
                </p>
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5">
                  Proyectos juveniles
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sección destacada: «Conoce a nuestros representantes» */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
              Representación Juvenil de Flandes
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
              Conoce a nuestros representantes
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              Mesa Directiva y Consejeros Municipales de Juventud organizados por jerarquía institucional.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('integrantes')}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c] hover:underline shrink-0"
          >
            <span>Ver directorio completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mesa Directiva (1. Presidente, 2. Vicepresidente, 3. Secretario) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mesaDirectivaSlots.map((slot) => {
            const m = slot.member;
            if (!m) {
              return (
                <div
                  key={slot.order}
                  className="rounded-2xl p-6 bg-stone-50/80 dark:bg-stone-900/40 border border-dashed border-stone-300 dark:border-stone-700 flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {slot.label}
                    </span>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-stone-200/70 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                          Cargo por asignar
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          Disponible para registro desde Secretaría
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={slot.order}
                onClick={() => onSelectMember(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectMember(m);
                }}
                className="group cursor-pointer rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-[#8c162a] dark:hover:border-[#f2c94c] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 text-[#8c162a] dark:text-[#f2c94c]">
                      {slot.label}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={m.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-stone-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#8c162a] dark:group-hover:text-[#f2c94c] transition-colors truncate">
                        {m.fullName}
                      </h3>
                      <p className="text-xs font-medium text-stone-600 dark:text-stone-400 line-clamp-2">
                        {m.cargoTitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <CmjBadges
                      badges={m.badges}
                      politicalAffiliation={m.politicalAffiliation}
                      compact
                    />
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-[#8c162a] dark:text-[#f2c94c]">
                  <span>Ver perfil institucional</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Councilors & Commission Leads */}
        {otherMembers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {otherMembers.slice(0, 8).map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMember(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectMember(m);
                }}
                className="cursor-pointer rounded-xl p-4 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 hover:border-[#8c162a] dark:hover:border-[#f2c94c] transition-all flex items-center gap-3.5"
              >
                <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-stone-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {m.fullName}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                    {ROLE_LABELS[m.role] || m.cargoTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Próximas Sesiones & Documentos Recientes */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas Sesiones */}
        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-[#8c162a] dark:text-[#f2c94c]" />
              <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
                Próximas Sesiones
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sesiones')}
              className="text-xs font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c] hover:underline"
            >
              Ver todas
            </button>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-900/50 text-center text-sm text-stone-500 dark:text-stone-400">
              No hay sesiones programadas publicadas en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#003893] dark:text-blue-400">
                      {s.sessionNumber} · {s.sessionType}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                      {s.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      {s.date} · {s.startTime} · {s.location}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    Programada
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentos Recientes */}
        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#003893] dark:text-blue-400" />
              <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
                Actas y Documentos Recientes
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('documentos')}
              className="text-xs font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c] hover:underline"
            >
              Ver archivo
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-900/50 text-center text-sm text-stone-500 dark:text-stone-400">
              Aún no se han publicado actas o documentos oficiales.
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c]">
                      {DOCUMENT_TYPE_LABELS[d.type]} · v{d.currentVersion}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                      {d.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Fecha: {d.documentDate} · Responsable: {d.responsibleName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('documentos')}
                    className="btn-dulima-secondary py-1.5 px-3 text-[11px] shrink-0"
                  >
                    Consultar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Noticias, Actividades y Proyectos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Noticias */}
        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              <Newspaper className="w-5 h-5 text-[#8c162a] dark:text-[#f2c94c]" />
              <span>Noticias y Comunicados</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('noticias')}
              className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:underline"
            >
              Ver más
            </button>
          </div>
          {recentNews.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
              Sin noticias o comunicados publicados aún.
            </p>
          ) : (
            <div className="space-y-3">
              {recentNews.map((art) => (
                <div
                  key={art.id}
                  onClick={() => onNavigate('noticias')}
                  className="cursor-pointer p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c]">
                    {art.kind === 'comunicado_oficial' ? 'Comunicado Oficial' : 'Opinión / Artículo'}
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 line-clamp-2">
                    {art.title}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividades */}
        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              <CheckCircle2 className="w-5 h-5 text-[#166534] dark:text-emerald-400" />
              <span>Actividades Recientes</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('actividades')}
              className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:underline"
            >
              Ver más
            </button>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
              Sin actividades registradas aún.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => onNavigate('actividades')}
                  className="cursor-pointer p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] dark:text-emerald-400">
                    {act.date} · {act.location}
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 line-clamp-2">
                    {act.title}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proyectos */}
        <div className="rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              <FolderKanban className="w-5 h-5 text-[#003893] dark:text-blue-400" />
              <span>Proyectos e Iniciativas</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('proyectos')}
              className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:underline"
            >
              Ver más
            </button>
          </div>
          {activeProjects.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
              Sin proyectos publicados aún.
            </p>
          ) : (
            <div className="space-y-3">
              {activeProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onNavigate('proyectos')}
                  className="cursor-pointer p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <span className="text-[#003893] dark:text-blue-400">{proj.status}</span>
                    <span>{proj.progressPercent}%</span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 line-clamp-2">
                    {proj.name}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Encuestas Activas & Participación Ciudadana */}
      <section className="rounded-3xl p-8 bg-stone-100/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
            <BarChart3 className="w-4 h-4" />
            <span>Participación Democrática Juvenil</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">
            Tu voz construye las políticas de juventud en Flandes
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {activePolls.length > 0
              ? `Hay ${activePolls.length} consulta(s) ciudadana(s) activa(s) en este momento.`
              : 'Envía tus propuestas, inquietudes o iniciativas directamente al Consejo Municipal de Juventud y haz seguimiento con tu código de radicado.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('encuestas')}
            className="btn-dulima-primary"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Encuestas y Votaciones</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('transparencia')}
            className="btn-dulima-secondary"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Portal de Transparencia</span>
          </button>
        </div>
      </section>
    </div>
  );
};
