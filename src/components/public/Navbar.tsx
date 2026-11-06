import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  Search, 
  Lock, 
  BookOpen, 
  User, 
  Tag, 
  Mail, 
  Home, 
  ShieldCheck, 
  Sun, 
  Moon,
  Users,
  PenTool,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  Zap,
  ZapOff,
  History,
  Megaphone,
  Eye,
  Crown,
  Heart,
  ChevronDown,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLightReading } from '../../context/LightReadingContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DataSaverUpgradeModal } from '../common/DataSaverUpgradeModal';
import { DulimaLogo } from '../common/DulimaLogo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenWelcomeIntro?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenWelcomeIntro }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [articlesMenuOpen, setArticlesMenuOpen] = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const [mobileArticlesOpen, setMobileArticlesOpen] = useState(true);
  const [mobileSupportOpen, setMobileSupportOpen] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const articlesMenuRef = useRef<HTMLDivElement>(null);
  const supportMenuRef = useRef<HTMLDivElement>(null);

  const { isAdmin, isCollaborator, isSubscriber, subscriber } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { isLightReading, toggleLightReading } = useLightReading();
  const { setIsModalOpen: setAccessibilityModalOpen } = useAccessibility();

  // Close desktop dropdowns on outside click or Escape key
  useEffect(() => {
    if (!supportMenuOpen && !articlesMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (supportMenuRef.current && !supportMenuRef.current.contains(event.target as Node)) {
        setSupportMenuOpen(false);
      }
      if (articlesMenuRef.current && !articlesMenuRef.current.contains(event.target as Node)) {
        setArticlesMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSupportMenuOpen(false);
        setArticlesMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [supportMenuOpen, articlesMenuOpen]);

  // Premium Data Saver mode is exclusive to Monthly ($50K) and Annual ($100K) subscribers, and Owner/Admin
  const hasDataSaverAccess = isAdmin || (isSubscriber && (subscriber?.period === 'mensual' || subscriber?.period === 'anual'));

  const handleDataSaverClick = () => {
    if (hasDataSaverAccess) {
      toggleLightReading();
    } else {
      setUpgradeModalOpen(true);
    }
  };

  const todayStr = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'actualizaciones', label: 'Actualizaciones', icon: History },
    { id: 'about', label: 'Sobre DULIMA', icon: User },
  ];

  const articlesItems = [
    {
      id: 'articles',
      label: 'Artículos y Publicaciones',
      description: 'Ensayos, crónicas, análisis político y archivo editorial completo.',
      icon: BookOpen,
      accentClass: 'text-amber-700 dark:text-gold-400 bg-amber-500/10 dark:bg-gold-500/15'
    },
    {
      id: 'live',
      label: 'LIVE · Transmisiones en Directo',
      description: 'Estudio LIVE de DULIMA, debates en tiempo real, entrevistas y eventos.',
      icon: Radio,
      accentClass: 'text-[#ce1126] dark:text-rose-400 bg-[#ce1126]/10 dark:bg-rose-500/15'
    },
    {
      id: 'encuestas',
      label: 'Encuestas Ciudadanas',
      description: 'Participa en consultas abiertas y consulta resultados en tiempo real.',
      icon: MessageSquare,
      accentClass: 'text-[#166534] dark:text-emerald-400 bg-[#166534]/10 dark:bg-emerald-500/15'
    }
  ];

  const supportItems = [
    {
      id: 'premium',
      label: 'Planes Premium',
      description: '4 planes de suscripción con precios, duración, beneficios y acceso exclusivo.',
      icon: Crown,
      accentClass: 'text-amber-600 dark:text-gold-400 bg-amber-500/10 dark:bg-gold-500/15'
    },
    {
      id: 'donations',
      label: 'Donaciones',
      description: 'Aportes sugeridos o personalizados con métodos de pago disponibles.',
      icon: Heart,
      accentClass: 'text-[#9B1B30] dark:text-rose-400 bg-[#9B1B30]/10 dark:bg-rose-500/15'
    },
    {
      id: 'publicidad',
      label: 'Publicidad',
      description: 'Espacios publicitarios, formatos interactivos, tarifas y propuestas.',
      icon: Megaphone,
      accentClass: 'text-sky-700 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/15'
    },
    {
      id: 'collaboration',
      label: 'Colaboración',
      description: 'Únete al equipo editorial de DULIMA, consulta requisitos y estado.',
      icon: Users,
      accentClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15'
    },
    {
      id: 'contact',
      label: 'Contacto',
      description: 'Escríbenos directamente para consultas editoriales, prensa o alianzas.',
      icon: Mail,
      accentClass: 'text-stone-700 dark:text-stone-300 bg-stone-500/10 dark:bg-stone-500/20'
    }
  ];

  const isArticlesActive = ['articles', 'posts', 'live', 'encuestas'].includes(currentView);
  const isSupportActive = ['premium', 'donations', 'publicidad', 'collaboration', 'contact'].includes(currentView);

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setArticlesMenuOpen(false);
    setSupportMenuOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fcfbf9]/95 dark:bg-[#121214]/95 backdrop-blur-md border-b border-[#e7e4dc] dark:border-stone-800 transition-colors">
      {/* Tolima & Colombian Identity Micro-Ribbons at Top */}
      <div className="tolima-ribbon">
        <span className="tolima-vinotinto"></span>
        <span className="tolima-gold"></span>
      </div>
      <div className="colombia-ribbon">
        <span className="colombia-yellow"></span>
        <span className="colombia-blue"></span>
        <span className="colombia-red"></span>
      </div>

      {/* Top micro-bar: Date, Colombian identity note, theme toggle, and access */}
      <div className="bg-[#121212] dark:bg-[#0c0c0e] text-[#e0ded9] text-xs py-1.5 px-4 sm:px-8 border-b border-[#262626]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 capitalize tracking-wide font-sans text-stone-400 text-[11px] sm:text-xs">
            {/* Subtle Colombian Flag Pin */}
            <span className="inline-flex flex-col w-3.5 h-2.5 rounded-xs overflow-hidden shrink-0 shadow-xs border border-white/20">
              <span className="bg-[#fcd116] h-[50%] w-full"></span>
              <span className="bg-[#003893] h-[25%] w-full"></span>
              <span className="bg-[#ce1126] h-[25%] w-full"></span>
            </span>
            <span>{todayStr}</span>
            <span className="hidden md:inline text-stone-600 dark:text-stone-500">• Tolima · Colombia</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline text-[#F2C94C] italic text-[11px] tracking-wider">
              "La voz del territorio. El poder de las ideas."
            </span>

            {/* Welcome Intro trigger button */}
            {onOpenWelcomeIntro && (
              <button
                onClick={onOpenWelcomeIntro}
                className="hidden md:inline-flex items-center space-x-1 text-[11px] py-0.5 px-2 rounded-md text-stone-300 hover:text-gold-400 hover:bg-white/10 transition-colors cursor-pointer"
                title="Ver presentación de bienvenida e innovaciones"
              >
                <Sparkles className="w-3 h-3 text-gold-400" />
                <span>Presentación</span>
              </button>
            )}

            {/* Visual Accessibility Trigger */}
            <button
              onClick={() => setAccessibilityModalOpen(true)}
              className="inline-flex items-center space-x-1 text-[11px] py-0.5 px-2 rounded-md text-stone-300 hover:text-gold-400 hover:bg-white/10 transition-colors cursor-pointer"
              title="Configurar accesibilidad visual (daltonismo, contraste, texto)"
              aria-label="Abrir accesibilidad visual"
            >
              <Eye className="w-3.5 h-3.5 text-gold-400" />
              <span className="hidden sm:inline">Accesibilidad</span>
            </button>

            {/* Light Reading / Data Saver Mode Toggle Button */}
            <button
              onClick={handleDataSaverClick}
              className={`flex items-center space-x-1 text-xs py-0.5 px-2 rounded-md transition-colors cursor-pointer ${
                isLightReading
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-300 hover:text-amber-400 hover:bg-white/10'
              }`}
              title={
                hasDataSaverAccess
                  ? isLightReading
                    ? 'Modo Ahorro de Datos activo (-90% consumo)'
                    : 'Activar Modo Ahorro de Datos Premium'
                  : 'Modo Ahorro de Datos (Exclusivo Plan Mensual y Anual)'
              }
              aria-label="Alternar modo ahorro de datos"
            >
              {isLightReading ? (
                <Zap className="w-3.5 h-3.5 fill-current text-stone-950" />
              ) : (
                <ZapOff className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span className="hidden sm:inline font-sans text-[11px]">
                {isLightReading ? 'Ahorro de Datos' : 'Lectura Ligera'}
              </span>
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1 rounded-md text-stone-300 hover:text-gold-400 transition-colors"
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Alternar tema"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-stone-300 hover:text-gold-400" />
              )}
            </button>

            {/* Access Status: Owner, Collaborator, or Subscriber */}
            {isAdmin ? (
              <button
                onClick={() => handleNavClick('admin')}
                className="flex items-center space-x-1.5 text-xs py-0.5 px-2 rounded bg-gold-500/20 text-gold-300 border border-gold-500/40 hover:bg-gold-500/30 transition-colors font-medium"
                title="Panel de Administración"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                <span>Escritorio Propietario</span>
              </button>
            ) : isCollaborator ? (
              <button
                onClick={() => handleNavClick('collaborator-panel')}
                className="flex items-center space-x-1.5 text-xs py-0.5 px-2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-colors font-medium"
                title="Panel de Colaborador"
              >
                <PenTool className="w-3.5 h-3.5 text-sky-400" />
                <span>Panel Colaborador</span>
              </button>
            ) : isSubscriber ? (
              <button
                onClick={() => handleNavClick('subscriber-panel')}
                className="flex items-center space-x-1.5 text-xs py-0.5 px-2 rounded bg-gold-400/20 text-gold-300 border border-gold-400/40 hover:bg-gold-400/30 transition-colors font-medium"
                title="Panel de Suscriptor Premium"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Mi Panel Premium</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('admin')}
                className="flex items-center space-x-1 text-stone-400 hover:text-gold-400 transition-colors text-xs py-0.5 px-2 rounded hover:bg-white/10"
                title="Acceso Propietario"
              >
                <Lock className="w-3 h-3 text-stone-400" />
                <span>Acceso</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5">
        <div className="flex flex-col items-center justify-center text-center">
          <button
            onClick={() => handleNavClick('home')}
            className="group cursor-pointer focus:outline-none transition-transform hover:scale-[1.01]"
            aria-label="Ir a la portada de DULIMA"
          >
            <DulimaLogo variant="horizontal" showSlogan={true} />
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="border-t border-[#eeeae1] dark:border-stone-800 bg-white/70 dark:bg-[#161619]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-12">
          {/* Desktop Links + Single "Apoyar a DULIMA" Dropdown */}
          <div className="hidden md:flex items-center space-x-5 lg:space-x-6">
            <nav className="flex items-center space-x-5 lg:space-x-6" aria-label="Navegación principal">
              <button
                onClick={() => handleNavClick('home')}
                className={`relative text-xs uppercase tracking-[0.11em] font-semibold transition-colors py-3 inline-flex items-center whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-xs ${
                  currentView === 'home'
                    ? 'text-[#121212] dark:text-white font-bold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-[#121212] dark:hover:text-white'
                }`}
              >
                <span>Inicio</span>
                {currentView === 'home' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gold-500" />
                )}
              </button>

              {/* "Artículos y Publicaciones" + "LIVE" Dropdown */}
              <div className="relative" ref={articlesMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setArticlesMenuOpen((prev) => !prev);
                    setSupportMenuOpen(false);
                  }}
                  aria-expanded={articlesMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="articles-dulima-menu"
                  className={`relative text-xs uppercase tracking-[0.11em] font-semibold transition-colors py-3 inline-flex items-center space-x-1 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-xs ${
                    isArticlesActive || articlesMenuOpen
                      ? 'text-[#121212] dark:text-white font-bold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-[#121212] dark:hover:text-white'
                  }`}
                >
                  <span>Artículos y Publicaciones</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                      articlesMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                  {isArticlesActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gold-500" />
                  )}
                </button>

                {articlesMenuOpen && (
                  <div
                    id="articles-dulima-menu"
                    role="menu"
                    aria-label="Opciones de Artículos, Publicaciones y LIVE"
                    className="absolute left-0 mt-1.5 w-[330px] rounded-xl bg-[#fcfbf9] dark:bg-[#18181c] border border-[#e7e4dc] dark:border-stone-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-2 pb-2 mb-2 border-b border-[#eeeae1] dark:border-stone-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                        Contenido Editorial y Directos
                      </span>
                    </div>

                    <div className="space-y-2">
                      {articlesItems.map((option) => {
                        const Icon = option.icon;
                        const isOptionActive = currentView === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="menuitem"
                            onClick={() => handleNavClick(option.id)}
                            className={`w-full text-left flex items-start space-x-3 p-3 rounded-lg transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                              isOptionActive
                                ? 'bg-stone-100/90 dark:bg-stone-800/80 border-[#9B1B30]/30 dark:border-gold-500/40'
                                : 'bg-white/70 dark:bg-stone-900/40 border-transparent hover:bg-stone-100/70 dark:hover:bg-stone-800/60 hover:border-[#e7e4dc] dark:hover:border-stone-700'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${option.accentClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-serif font-bold text-[#121212] dark:text-white">
                                  {option.label}
                                </span>
                                {isOptionActive && (
                                  <span className="w-2 h-2 rounded-full bg-[#9B1B30] dark:bg-gold-400 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mt-0.5">
                                {option.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {navItems
                .filter((i) => i.id !== 'home')
                .map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative text-xs uppercase tracking-[0.11em] font-semibold transition-colors py-3 inline-flex items-center whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-xs ${
                        isActive
                          ? 'text-[#121212] dark:text-white font-bold'
                          : 'text-stone-500 dark:text-stone-400 hover:text-[#121212] dark:hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gold-500" />
                      )}
                    </button>
                  );
                })}
            </nav>

            {/* Divider */}
            <span className="h-4 w-px bg-[#e7e4dc] dark:bg-stone-800" aria-hidden="true" />

            {/* Single "Apoyar a DULIMA" Button + Floating Dropdown */}
            <div className="relative" ref={supportMenuRef}>
              <button
                type="button"
                onClick={() => setSupportMenuOpen((prev) => !prev)}
                aria-expanded={supportMenuOpen}
                aria-haspopup="menu"
                aria-controls="support-dulima-menu"
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  isSupportActive || supportMenuOpen
                    ? 'bg-[#9B1B30] text-white border-[#9B1B30] dark:bg-gold-500 dark:text-stone-950 dark:border-gold-500 shadow-xs'
                    : 'bg-[#9B1B30]/8 dark:bg-gold-500/10 text-[#9B1B30] dark:text-gold-300 border-[#9B1B30]/25 dark:border-gold-500/30 hover:bg-[#9B1B30]/15 dark:hover:bg-gold-500/20'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                <span>Apoyar a DULIMA</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                    supportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Compact Floating Dropdown Menu */}
              {supportMenuOpen && (
                <div
                  id="support-dulima-menu"
                  role="menu"
                  aria-label="Opciones para apoyar a DULIMA"
                  className="absolute right-0 mt-2.5 w-[340px] rounded-xl bg-[#fcfbf9] dark:bg-[#18181c] border border-[#e7e4dc] dark:border-stone-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2 pb-2 mb-2 border-b border-[#eeeae1] dark:border-stone-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Respalda el periodismo independiente
                    </span>
                  </div>

                  <div className="space-y-2">
                    {supportItems.map((option) => {
                      const Icon = option.icon;
                      const isOptionActive = currentView === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="menuitem"
                          onClick={() => handleNavClick(option.id)}
                          className={`w-full text-left flex items-start space-x-3 p-3 rounded-lg transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                            isOptionActive
                              ? 'bg-stone-100/90 dark:bg-stone-800/80 border-[#9B1B30]/30 dark:border-gold-500/40'
                              : 'bg-white/70 dark:bg-stone-900/40 border-transparent hover:bg-stone-100/70 dark:hover:bg-stone-800/60 hover:border-[#e7e4dc] dark:hover:border-stone-700'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${option.accentClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-serif font-bold text-[#121212] dark:text-white">
                                {option.label}
                              </span>
                              {isOptionActive && (
                                <span className="w-2 h-2 rounded-full bg-[#9B1B30] dark:bg-gold-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mt-0.5">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Search Button on Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => handleNavClick('articles')}
              className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400 hover:text-[#121212] dark:hover:text-white transition-colors py-1.5 px-3.5 rounded-full bg-[#f4f2ec] dark:bg-stone-800 hover:bg-[#ece8df] cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-sans">Buscar ensayos...</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Bar */}
          <div className="flex items-center justify-between w-full md:hidden">
            <span className="text-xs font-serif italic text-stone-600 dark:text-stone-300 truncate">
              {currentView === 'home'
                ? 'Portada'
                : currentView === 'collaboration'
                ? 'Colaboración'
                : supportItems.find((s) => s.id === currentView)?.label ||
                  navItems.find((i) => i.id === currentView)?.label ||
                  'Lectura'}
            </span>
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={toggleTheme}
                className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900"
                aria-label="Alternar tema"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleNavClick('articles')}
                className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900"
                aria-label="Buscar"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-stone-700 dark:text-stone-200 hover:text-stone-950 focus:outline-none"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e7e4dc] dark:border-stone-800 bg-[#fcfbf9] dark:bg-[#18181c] px-4 sm:px-6 py-5 shadow-xl max-h-[82vh] overflow-y-auto overflow-x-hidden animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-1.5" aria-label="Menú móvil">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-3.5 min-h-[44px] py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#121212] dark:bg-stone-800 text-white font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold-400' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0"></span>}
                </button>
              );
            })}

            {/* Mobile "Artículos y Publicaciones" + "LIVE" Section */}
            <div className="pt-2 mt-2 border-t border-[#e7e4dc] dark:border-stone-800">
              <button
                type="button"
                onClick={() => setMobileArticlesOpen((prev) => !prev)}
                aria-expanded={mobileArticlesOpen}
                className={`w-full flex items-center justify-between px-3.5 min-h-[44px] py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isArticlesActive
                    ? 'bg-[#121212] text-white dark:bg-stone-800 dark:text-gold-300'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Artículos y Publicaciones</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                    mobileArticlesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileArticlesOpen && (
                <div className="mt-2 space-y-2 pl-1">
                  {articlesItems.map((option) => {
                    const Icon = option.icon;
                    const isOptionActive = currentView === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleNavClick(option.id)}
                        className={`w-full text-left flex items-start space-x-3 p-3 min-h-[44px] rounded-xl border transition-colors ${
                          isOptionActive
                            ? 'bg-stone-100 dark:bg-stone-800 border-[#9B1B30]/40 dark:border-gold-500/40'
                            : 'bg-white dark:bg-stone-900/60 border-[#e7e4dc] dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${option.accentClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-serif font-bold text-[#121212] dark:text-white">
                              {option.label}
                            </span>
                            {isOptionActive && (
                              <span className="w-2 h-2 rounded-full bg-[#9B1B30] dark:bg-gold-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile "Apoyar a DULIMA" Section */}
            <div className="pt-2 mt-2 border-t border-[#e7e4dc] dark:border-stone-800">
              <button
                type="button"
                onClick={() => setMobileSupportOpen((prev) => !prev)}
                aria-expanded={mobileSupportOpen}
                className={`w-full flex items-center justify-between px-3.5 min-h-[44px] py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isSupportActive
                    ? 'bg-[#9B1B30] text-white dark:bg-gold-500 dark:text-stone-950'
                    : 'bg-[#9B1B30]/10 dark:bg-gold-500/15 text-[#9B1B30] dark:text-gold-300'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <HeartHandshake className="w-4 h-4 shrink-0" />
                  <span>Apoyar a DULIMA</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                    mobileSupportOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileSupportOpen && (
                <div className="mt-2 space-y-2 pl-1">
                  {supportItems.map((option) => {
                    const Icon = option.icon;
                    const isOptionActive = currentView === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleNavClick(option.id)}
                        className={`w-full text-left flex items-start space-x-3 p-3 min-h-[44px] rounded-xl border transition-colors ${
                          isOptionActive
                            ? 'bg-stone-100 dark:bg-stone-800 border-[#9B1B30]/40 dark:border-gold-500/40'
                            : 'bg-white dark:bg-stone-900/60 border-[#e7e4dc] dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${option.accentClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-serif font-bold text-[#121212] dark:text-white">
                              {option.label}
                            </span>
                            {isOptionActive && (
                              <span className="w-2 h-2 rounded-full bg-[#9B1B30] dark:bg-gold-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 mt-2 border-t border-stone-200 dark:border-stone-800 space-y-1">
              {/* Light Reading Mobile Toggle */}
              <button
                onClick={handleDataSaverClick}
                className="flex items-center justify-between w-full px-3 min-h-[44px] py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900"
              >
                <span className="flex items-center space-x-2">
                  <Zap className={`w-3.5 h-3.5 ${isLightReading ? 'text-amber-500 fill-current' : 'text-stone-400'}`} />
                  <span>Modo Ahorro de Datos (Lectura Ligera)</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isLightReading ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-600'
                }`}>
                  {isLightReading ? 'Activo' : 'Inactivo'}
                </span>
              </button>

              {/* Welcome Intro Mobile Link */}
              {onOpenWelcomeIntro && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWelcomeIntro();
                  }}
                  className="flex items-center justify-between w-full px-3 min-h-[44px] py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                    <span>Ver Introducción y Novedades</span>
                  </span>
                </button>
              )}

              {/* Subscriber Panel Link */}
              {isSubscriber && (
                <button
                  onClick={() => handleNavClick('subscriber-panel')}
                  className="flex items-center justify-between w-full px-3 min-h-[44px] py-2 text-xs uppercase tracking-wider text-gold-600 font-bold hover:bg-gold-50 dark:hover:bg-stone-900 rounded-lg"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mi Panel Suscriptor</span>
                  </span>
                  <span className="text-[10px] bg-gold-100 text-gold-900 px-1.5 py-0.5 rounded">Premium</span>
                </button>
              )}

              <button
                onClick={() => handleNavClick('admin')}
                className="flex items-center justify-between w-full px-3 min-h-[44px] py-2 text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-900"
              >
                <span className="flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-gold-600" />
                  <span>Panel Propietario</span>
                </span>
                {isAdmin && <span className="text-xs text-gold-600 font-bold">Activo</span>}
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Data Saver Paywall / Upgrade Modal */}
      <DataSaverUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onGoToPremium={() => handleNavClick('premium')}
        currentPlanPeriod={subscriber?.period}
        isSubscriber={isSubscriber}
      />
    </header>
  );
};
