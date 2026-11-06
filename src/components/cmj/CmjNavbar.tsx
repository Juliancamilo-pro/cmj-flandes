import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Shield,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { PublicPageId } from '../../types/cmj';
import { CmjLogo } from './CmjLogo';
import { useCmjAuth } from '../../context/CmjAuthContext';

interface CmjNavbarProps {
  activePage: PublicPageId;
  onNavigate: (page: PublicPageId) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuth: () => void;
  officialLogoUrl?: string;
}

export const CmjNavbar: React.FC<CmjNavbarProps> = ({
  activePage,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onOpenAuth,
  officialLogoUrl,
}) => {
  const { user, logout } = useCmjAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'institucional' | 'gestion' | 'participacion' | null>(null);

  const handleNav = (page: PublicPageId) => {
    onNavigate(page);
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs">
      {/* Top Colombia + Tolima Institutional Ribbon */}
      <div className="grid grid-cols-2 h-1.5 w-full">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            handleNav('inicio');
          }}
          className="shrink-0 focus:outline-none"
        >
          <CmjLogo size="sm" officialLogoUrl={officialLogoUrl} />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
          <button
            type="button"
            onClick={() => handleNav('inicio')}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              activePage === 'inicio'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Inicio
          </button>

          {/* Dropdown: Institucional */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('institucional')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === 'institucional' ? null : 'institucional')
              }
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                ['quienes-somos', 'integrantes', 'transparencia'].includes(activePage)
                  ? 'bg-[#8c162a]/10 text-[#8c162a] dark:bg-[#f2c94c]/15 dark:text-[#f2c94c]'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span>Institucional</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {openDropdown === 'institucional' && (
              <div className="absolute left-0 top-full pt-1 w-52 z-50">
                <div className="bg-white dark:bg-[#181b22] rounded-xl border border-stone-200 dark:border-stone-800 shadow-xl py-1.5">
                  <button
                    type="button"
                    onClick={() => handleNav('quienes-somos')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Quiénes somos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('integrantes')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Integrantes del CMJ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('transparencia')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Transparencia
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown: Gestión */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('gestion')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'gestion' ? null : 'gestion')}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                ['gestion', 'control-politico', 'rendicion-cuentas', 'sesiones', 'documentos', 'proyectos', 'comisiones'].includes(activePage)
                  ? 'bg-[#8c162a]/10 text-[#8c162a] dark:bg-[#f2c94c]/15 dark:text-[#f2c94c]'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span>Gestión</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {openDropdown === 'gestion' && (
              <div className="absolute left-0 top-full pt-1 w-64 z-50">
                <div className="bg-white dark:bg-[#181b22] rounded-xl border border-stone-200 dark:border-stone-800 shadow-xl py-1.5">
                  <button
                    type="button"
                    onClick={() => handleNav('gestion')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Gestión institucional
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('control-politico')}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between"
                  >
                    <span>Control Político a la Alcaldía</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8c162a] dark:bg-[#f2c94c]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('rendicion-cuentas')}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#003893] dark:text-blue-400 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between"
                  >
                    <span>Rendición de Cuentas</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#003893] dark:bg-blue-400" />
                  </button>
                  <div className="my-1 border-t border-stone-100 dark:border-stone-800" />
                  <button
                    type="button"
                    onClick={() => handleNav('sesiones')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Sesiones
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('documentos')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Actas y documentos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('proyectos')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Proyectos e iniciativas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('comisiones')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Comisiones de trabajo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown: Participación */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('participacion')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === 'participacion' ? null : 'participacion')
              }
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                ['noticias', 'actividades', 'participacion', 'encuestas', 'galeria'].includes(activePage)
                  ? 'bg-[#8c162a]/10 text-[#8c162a] dark:bg-[#f2c94c]/15 dark:text-[#f2c94c]'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span>Participación</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {openDropdown === 'participacion' && (
              <div className="absolute left-0 top-full pt-1 w-56 z-50">
                <div className="bg-white dark:bg-[#181b22] rounded-xl border border-stone-200 dark:border-stone-800 shadow-xl py-1.5">
                  <button
                    type="button"
                    onClick={() => handleNav('noticias')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Noticias y comunicados
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('actividades')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Actividades
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('participacion')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Participación juvenil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('encuestas')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Encuestas y votaciones
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('galeria')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Galería multimedia
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNav('documentos')}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              activePage === 'documentos'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Actas
          </button>

          <button
            type="button"
            onClick={() => handleNav('contacto')}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              activePage === 'contacto'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Contacto
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#f2c94c]" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleNav('panel-admin')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs hover:opacity-95 transition-opacity"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panel CMJ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  if (activePage === 'panel-admin') handleNav('inicio');
                }}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#8c162a]/30 dark:border-[#f2c94c]/40 text-[#8c162a] dark:text-[#f2c94c] hover:bg-[#8c162a]/5 dark:hover:bg-[#f2c94c]/10 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ingreso</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú móvil"
            className="lg:hidden p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14171f] px-4 py-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'inicio', label: 'Inicio' },
              { id: 'quienes-somos', label: 'Quiénes somos' },
              { id: 'integrantes', label: 'Integrantes' },
              { id: 'gestion', label: 'Gestión' },
              { id: 'control-politico', label: 'Control Político' },
              { id: 'rendicion-cuentas', label: 'Rendición de Cuentas' },
              { id: 'sesiones', label: 'Sesiones' },
              { id: 'documentos', label: 'Actas y documentos' },
              { id: 'proyectos', label: 'Proyectos' },
              { id: 'noticias', label: 'Noticias' },
              { id: 'actividades', label: 'Actividades' },
              { id: 'comisiones', label: 'Comisiones' },
              { id: 'participacion', label: 'Participación' },
              { id: 'encuestas', label: 'Encuestas' },
              { id: 'transparencia', label: 'Transparencia' },
              { id: 'galeria', label: 'Galería' },
              { id: 'contacto', label: 'Contacto' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id as PublicPageId)}
                className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider ${
                  activePage === item.id
                    ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                    : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
