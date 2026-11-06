import React from 'react';
import {
  X,
  User,
  Briefcase,
  FileText,
  FolderKanban,
  CalendarDays,
  Newspaper,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import {
  CmjActivity,
  CmjArticle,
  CmjDocument,
  CmjMember,
  CmjProject,
} from '../../types/cmj';
import { ROLE_LABELS } from '../../constants/cmj';
import { CmjBadges } from './CmjBadges';

interface CouncilorProfileModalProps {
  member: CmjMember | null;
  onClose: () => void;
  projects: CmjProject[];
  activities: CmjActivity[];
  documents: CmjDocument[];
  articles: CmjArticle[];
}

export const CouncilorProfileModal: React.FC<CouncilorProfileModalProps> = ({
  member,
  onClose,
  projects,
  activities,
  documents,
  articles,
}) => {
  if (!member) return null;

  const memberProjects = projects.filter(
    (p) =>
      p.responsibleIds.includes(member.id) ||
      p.responsibleNames.some((n) => n.toLowerCase() === member.fullName.toLowerCase())
  );
  const memberActivities = activities.filter((a) =>
    a.responsibleNames.some((n) => n.toLowerCase() === member.fullName.toLowerCase())
  );
  const memberDocuments = documents.filter(
    (d) =>
      d.responsibleId === member.id ||
      d.responsibleName.toLowerCase() === member.fullName.toLowerCase()
  );
  const memberArticles = articles.filter(
    (a) =>
      a.authorId === member.id ||
      a.authorName.toLowerCase() === member.fullName.toLowerCase()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tolima-ribbon">
          <div className="tolima-vinotinto" />
          <div className="tolima-gold" />
        </div>

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-100 dark:bg-stone-800 border-2 border-[#8c162a]/30 dark:border-[#f2c94c]/40 overflow-hidden shrink-0 flex items-center justify-center">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-stone-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c]">
                  {ROLE_LABELS[member.role] || member.cargoTitle}
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {member.fullName}
                </h2>
                <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                  {member.cargoTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar perfil"
                className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <CmjBadges
                badges={member.badges}
                politicalAffiliation={member.politicalAffiliation}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Commission & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Briefcase className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
                <span>Comisión Asignada</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
                {member.commissionName || 'Plenaria del Consejo Municipal de Juventud'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Mail className="w-4 h-4 text-[#003893] dark:text-blue-400" />
                <span>Contacto Institucional</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                {member.email}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-2">
              Reseña Institucional
            </h3>
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {member.bio || 'Integrante oficial del Consejo Municipal de Juventud de Flandes, Tolima.'}
            </p>
          </div>

          {/* Interest Area */}
          {member.interestArea && (
            <div className="p-4 rounded-xl bg-[#8c162a]/5 dark:bg-[#f2c94c]/10 border border-[#8c162a]/20 dark:border-[#f2c94c]/25">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c]">
                Área de Interés y Enfoque Juvenil
              </h3>
              <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-100">
                {member.interestArea}
              </p>
            </div>
          )}

          {/* Social Links */}
          {member.socialLinks &&
            Object.values(member.socialLinks).some((v) => v && v.trim().length > 0) && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-2">
                  Redes Sociales
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['facebook', 'Facebook'],
                      ['instagram', 'Instagram'],
                      ['x', 'X / Twitter'],
                      ['tiktok', 'TikTok'],
                      ['youtube', 'YouTube'],
                      ['linkedin', 'LinkedIn'],
                    ] as const
                  ).map(([key, label]) => {
                    const url = member.socialLinks?.[key];
                    if (!url) return null;
                    const href = url.startsWith('http') ? url : `https://${url}`;
                    return (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-[#8c162a] hover:text-white dark:hover:bg-[#f2c94c] dark:hover:text-stone-950 text-xs font-bold transition-colors"
                      >
                        {label}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Functions */}
          {member.functions && member.functions.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-2">
                Funciones y Responsabilidades
              </h3>
              <ul className="space-y-2">
                {member.functions.map((fn, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#166534] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{fn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Work */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div>
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                <FolderKanban className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
                <span>Proyectos Asociados ({memberProjects.length})</span>
              </h4>
              {memberProjects.length === 0 ? (
                <p className="text-xs text-stone-500">Sin proyectos asociados registrados aún.</p>
              ) : (
                <ul className="space-y-1.5">
                  {memberProjects.map((p) => (
                    <li key={p.id} className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      • {p.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                <CalendarDays className="w-4 h-4 text-[#003893] dark:text-blue-400" />
                <span>Actividades ({memberActivities.length})</span>
              </h4>
              {memberActivities.length === 0 ? (
                <p className="text-xs text-stone-500">Sin actividades registradas aún.</p>
              ) : (
                <ul className="space-y-1.5">
                  {memberActivities.map((a) => (
                    <li key={a.id} className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      • {a.title} ({a.date})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                <FileText className="w-4 h-4 text-[#166534] dark:text-emerald-400" />
                <span>Documentos e Informes ({memberDocuments.length})</span>
              </h4>
              {memberDocuments.length === 0 ? (
                <p className="text-xs text-stone-500">Sin documentos registrados aún.</p>
              ) : (
                <ul className="space-y-1.5">
                  {memberDocuments.map((d) => (
                    <li key={d.id} className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      • {d.title} (v{d.currentVersion})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                <Newspaper className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
                <span>Publicaciones ({memberArticles.length})</span>
              </h4>
              {memberArticles.length === 0 ? (
                <p className="text-xs text-stone-500">Sin publicaciones registradas aún.</p>
              ) : (
                <ul className="space-y-1.5">
                  {memberArticles.map((art) => (
                    <li key={art.id} className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      • {art.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
