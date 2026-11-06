import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  PenTool, 
  User, 
  Tag, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Globe, 
  Menu, 
  X, 
  ShieldCheck, 
  Mail,
  ChevronRight,
  Users,
  Image as ImageIcon,
  UserPlus,
  Clock,
  Sun,
  Moon,
  HeartHandshake,
  Sparkles,
  Building2,
  HardDrive,
  History,
  Megaphone,
  Wrench,
  ShieldAlert,
  Flag,
  Database,
  Radio,
  Landmark
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DulimaLogo } from '../../components/common/DulimaLogo';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onGoToPublic: () => void;
  unreadMessagesCount?: number;
  pendingCommentsCount?: number;
  pendingRequestsCount?: number;
  pendingArticlesCount?: number;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onGoToPublic,
  unreadMessagesCount = 0,
  pendingCommentsCount = 0,
  pendingRequestsCount = 0,
  pendingArticlesCount = 0,
  children
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuGroups = [
    {
      title: 'Editorial y Contenidos',
      items: [
        { id: 'dashboard', label: 'Estadísticas & Resumen', icon: BarChart3 },
        { 
          id: 'articles', 
          label: 'Gestión de Artículos', 
          icon: FileText,
          badge: pendingArticlesCount > 0 ? pendingArticlesCount : undefined,
          badgeColor: 'bg-sky-500'
        },
        { id: 'editor', label: 'Redactar Nuevo Artículo', icon: PenTool },
        { id: 'posts', label: 'Publicaciones Breves', icon: MessageSquare },
        { id: 'categories', label: 'Categorías Editoriales', icon: Tag },
        { id: 'editorial-tools', label: 'Herramientas Editoriales', icon: Wrench },
        { id: 'media', label: 'Biblioteca Multimedia', icon: ImageIcon },
        { id: 'drive', label: 'Google Drive', icon: HardDrive },
        { id: 'live', label: 'Administración LIVE', icon: Radio },
      ]
    },
    {
      title: 'Comunidad y Verificaciones',
      items: [
        { 
          id: 'collaborators', 
          label: 'Colaboración y Verificaciones', 
          icon: Users,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          badgeColor: 'bg-amber-500'
        },
        { id: 'political', label: 'Administración Política (CNE)', icon: Landmark },
        { 
          id: 'comments', 
          label: 'Comentarios', 
          icon: MessageSquare,
          badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined,
          badgeColor: 'bg-rose-500'
        },
        { 
          id: 'messages', 
          label: 'Mensajes de Contacto', 
          icon: Mail,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
          badgeColor: 'bg-rose-500'
        },
        { id: 'subscribers', label: 'Suscriptores Boletín', icon: Users },
      ]
    },
    {
      title: 'Publicidad y Finanzas',
      items: [
        { id: 'advertising', label: 'Administrar Publicidad', icon: Megaphone },
        { id: 'subscriptions', label: 'Suscripciones & Planes', icon: Sparkles },
        { id: 'donations', label: 'Donaciones & Balance', icon: HeartHandshake },
        { id: 'financial', label: 'Centro Financiero', icon: Building2 },
      ]
    },
    {
      title: 'Seguridad y Moderación',
      items: [
        { id: 'security', label: 'Centro de Seguridad', icon: ShieldAlert },
        { id: 'moderation', label: 'Moderación', icon: Flag },
        { id: 'backups', label: 'Copias de Seguridad', icon: Database },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'updates', label: 'Actualizaciones de Plataforma', icon: History },
        { id: 'profile', label: 'Perfil & Sobre DULIMA', icon: User },
        { id: 'settings', label: 'Configuración General', icon: Settings },
      ]
    }
  ];

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] dark:bg-[#121214] flex flex-col md:flex-row text-[#121212] dark:text-stone-100 transition-colors">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#121212] dark:bg-[#0c0c0e] text-white shrink-0 border-r border-[#262626] dark:border-stone-800 justify-between h-screen sticky top-0 overflow-y-auto">
        <div>
          {/* Masthead in sidebar with Colombian Ribbon */}
          <div className="p-6 border-b border-[#262626] space-y-2">
            <div className="colombia-ribbon rounded-full overflow-hidden h-1">
              <span className="colombia-yellow"></span>
              <span className="colombia-blue"></span>
              <span className="colombia-red"></span>
            </div>
            <DulimaLogo variant="compact" tone="light" />
            <div className="flex items-center justify-between text-xs text-gold-400 font-sans">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panel Administrativo</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1 rounded-md text-stone-400 hover:text-gold-400 transition-colors"
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-5">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gold-500 text-stone-950 shadow-md font-bold'
                          : 'text-stone-300 hover:bg-[#1f1f1f] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-950' : 'text-gold-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white shrink-0 ${item.badgeColor || 'bg-rose-500'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Profile and Public Link */}
        <div className="p-4 border-t border-[#262626] space-y-3 bg-[#0d0d0d]">
          <button
            onClick={onGoToPublic}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-stone-300 hover:text-gold-400 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gold-400" />
              <span>Ver Portal Público</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center justify-between pt-2 border-t border-[#222]">
            <div className="flex flex-col truncate pr-2">
              <span className="text-xs font-bold text-white truncate">
                Julian Camilo (Propietario)
              </span>
              <span className="text-[10px] text-stone-400 truncate">
                {user?.email || 'Acceso por credencial'}
              </span>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top Mobile Bar */}
      <div className="md:hidden bg-[#121212] text-white p-4 flex items-center justify-between sticky top-0 z-30 border-b border-[#262626]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg bg-white/10 text-white"
            aria-label="Abrir menú"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-display font-black text-sm uppercase tracking-wider">
            DULIMA • Admin
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-stone-400 hover:text-gold-400"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onGoToPublic}
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center space-x-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ver web</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 bg-[#121212] text-white p-5 flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <span className="font-serif font-black text-lg text-gold-400">
                  ESCRITORIO
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-stone-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-4 overflow-y-auto max-h-[65vh]">
                {menuGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                            isActive
                              ? 'bg-gold-500 text-stone-950 font-bold'
                              : 'text-stone-300 hover:bg-[#1f1f1f]'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${item.badgeColor || 'bg-rose-500'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#262626] space-y-3">
              <button
                onClick={onGoToPublic}
                className="w-full flex items-center space-x-2 text-xs font-semibold text-stone-300 py-2"
              >
                <Globe className="w-4 h-4 text-gold-400" />
                <span>Ir al sitio público</span>
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-2 text-xs font-semibold text-rose-400 py-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Administrative Work Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
