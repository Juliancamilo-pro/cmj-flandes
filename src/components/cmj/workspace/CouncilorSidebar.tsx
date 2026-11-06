import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  CheckCircle2,
  FolderKanban,
  Briefcase,
  Megaphone,
  BookOpen,
  UserCheck,
  Vote,
  Target,
  ShieldAlert,
  GraduationCap,
  BarChart3,
  UserCircle2,
  Users,
  Settings,
  Database,
  Lock,
  X,
  Menu,
} from 'lucide-react';
import { CmjMember, CmjModule, CmjAction } from '../../../types/cmj.ts';

export type WorkspaceTabId =
  | 'mi_espacio'
  | 'sesiones'
  | 'actas'
  | 'compromisos'
  | 'proyectos'
  | 'comisiones'
  | 'comunicacion'
  | 'documentos'
  | 'asistencia'
  | 'votaciones'
  | 'plan_trabajo'
  | 'veeduria'
  | 'formacion'
  | 'informes'
  | 'mi_perfil'
  | 'integrantes'
  | 'configuracion'
  | 'workspace'
  | 'auditoria';

interface NavItem {
  id: WorkspaceTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  module?: CmjModule;
  action?: CmjAction;
  adminOnly?: boolean;
}

interface CouncilorSidebarProps {
  currentTab: WorkspaceTabId;
  onSelectTab: (tab: WorkspaceTabId) => void;
  currentUser: CmjMember;
  can: (module: CmjModule, action: CmjAction) => boolean;
  unreadCount?: number;
  pendingCommitmentsCount?: number;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export const CouncilorSidebar: React.FC<CouncilorSidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  can,
  unreadCount = 0,
  pendingCommitmentsCount = 0,
  mobileOpen,
  onToggleMobile,
}) => {
  const isDirectivo = ['admin_principal', 'presidente', 'vicepresidente', 'secretario'].includes(
    currentUser.role
  );

  const items: NavItem[] = [
    { id: 'mi_espacio', label: 'Mi Espacio', icon: LayoutDashboard },
    { id: 'sesiones', label: 'Sesiones', icon: CalendarDays },
    { id: 'actas', label: 'Actas y Secretaría', icon: FileText },
    {
      id: 'compromisos',
      label: 'Compromisos',
      icon: CheckCircle2,
      badge: pendingCommitmentsCount > 0 ? pendingCommitmentsCount : undefined,
    },
    { id: 'proyectos', label: 'Proyectos Juveniles', icon: FolderKanban },
    { id: 'comisiones', label: 'Comisiones de Trabajo', icon: Briefcase },
    {
      id: 'comunicacion',
      label: 'Comunicación Interna',
      icon: Megaphone,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: 'documentos', label: 'Biblioteca Documental', icon: BookOpen },
    { id: 'asistencia', label: 'Control de Asistencia', icon: UserCheck },
    { id: 'votaciones', label: 'Consultas y Votaciones', icon: Vote },
    { id: 'plan_trabajo', label: 'Plan de Trabajo', icon: Target },
    { id: 'veeduria', label: 'Veeduría y Control Social', icon: ShieldAlert },
    { id: 'formacion', label: 'Formación y Leyes', icon: GraduationCap },
    { id: 'informes', label: 'Informes y Tableros', icon: BarChart3 },
    { id: 'mi_perfil', label: 'Mi Perfil y Seguridad', icon: UserCircle2 },
    // Management & Security sections
    {
      id: 'integrantes',
      label: 'Integrantes y Roles',
      icon: Users,
      module: 'usuarios',
      action: 'consultar',
    },
    {
      id: 'configuracion',
      label: 'Logo y Configuración',
      icon: Settings,
      module: 'configuracion',
      action: 'editar',
    },
    { id: 'workspace', label: 'Google Workspace', icon: Lock },
    {
      id: 'auditoria',
      label: 'Auditoría y Respaldo',
      icon: Database,
      adminOnly: true,
    },
  ];

  const visibleItems = items.filter((item) => {
    if (item.adminOnly && currentUser.role !== 'admin_principal') return false;
    if (item.module && item.action && !can(item.module, item.action)) return false;
    return true;
  });

  const handleSelect = (id: WorkspaceTabId) => {
    onSelectTab(id);
    if (mobileOpen) onToggleMobile();
  };

  return (
    <>
      {/* Mobile Toggle Button (Visible only on small screens) */}
      <div className="lg:hidden flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs mb-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleMobile}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200"
            aria-label="Abrir menú del portal"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#8c162a] dark:text-[#f2c94c] tracking-wider">
              Portal del Consejero
            </span>
            <p className="font-bold text-xs text-stone-900 dark:text-stone-100 capitalize">
              {items.find((i) => i.id === currentTab)?.label || 'Mi Espacio'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[#8c162a] text-white text-[10px] font-bold">
            {unreadCount} nuevo(s)
          </span>
        )}
      </div>

      {/* Overlay backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-20 left-0 bottom-0 z-50 lg:z-10 w-72 lg:w-64 bg-white dark:bg-[#161920] border-r lg:border border-stone-200 dark:border-stone-800 lg:rounded-3xl shadow-xl lg:shadow-xs flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ maxHeight: 'calc(100vh - 6rem)' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#003893] dark:text-[#f2c94c]">
              CMJ Flandes · Trabajo
            </span>
            <h2 className="text-sm font-display font-bold text-stone-900 dark:text-stone-100 truncate">
              Módulos del Consejo
            </h2>
          </div>
          <button
            type="button"
            onClick={onToggleMobile}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#003893] to-[#8c162a] text-white shadow-md font-bold'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-yellow-300' : 'text-stone-500 dark:text-stone-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      active
                        ? 'bg-yellow-300 text-stone-950'
                        : 'bg-[#8c162a] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Logged user badge */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 lg:rounded-b-3xl">
          <div className="flex items-center gap-2.5">
            {currentUser.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-xl object-cover shrink-0 border border-stone-300 dark:border-stone-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#003893] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {currentUser.fullName}
              </p>
              <p className="text-[10px] text-stone-500 truncate">
                {currentUser.cargoTitle}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
