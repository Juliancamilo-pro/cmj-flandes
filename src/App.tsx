import React, { useEffect, useState, useCallback } from 'react';
import { CmjAuthProvider, useCmjAuth } from './context/CmjAuthContext';
import { CmjMember, CmjPoll, PublicPageId } from './types/cmj';
import { DEFAULT_COMMISSIONS_SEED, DEFAULT_INSTITUTIONAL_CONFIG } from './constants/cmj';
import { cmjApi, PublicOverviewResponse } from './services/cmjApi';
import { CmjNavbar } from './components/cmj/CmjNavbar';
import { CmjFooter } from './components/cmj/CmjFooter';
import { CmjAuthModal } from './components/cmj/CmjAuthModal';
import { CouncilorProfileModal } from './components/cmj/CouncilorProfileModal';
import { InicioPage } from './pages/cmj/InicioPage';
import {
  QuienesSomosPage,
  IntegrantesPage,
  GestionPage,
  TransparenciaPage,
} from './pages/cmj/InstitucionalPages';
import {
  SesionesPage,
  DocumentosPage,
  ProyectosPage,
  ComisionesPage,
} from './pages/cmj/GestionDocumentalPages';
import {
  NoticiasPage,
  ActividadesPage,
  ParticipacionPage,
  EncuestasPage,
  GaleriaPage,
  ContactoPage,
} from './pages/cmj/ParticipacionComunidadPages';
import { CmjAdminDashboard } from './pages/cmj/admin/CmjAdminDashboard';
import { ControlPoliticoPage } from './pages/cmj/ControlPoliticoPage';
import { RendicionCuentasPage } from './pages/cmj/RendicionCuentasPage';

const VALID_PAGES: PublicPageId[] = [
  'inicio',
  'quienes-somos',
  'integrantes',
  'gestion',
  'control-politico',
  'rendicion-cuentas',
  'sesiones',
  'documentos',
  'proyectos',
  'noticias',
  'actividades',
  'comisiones',
  'participacion',
  'encuestas',
  'transparencia',
  'galeria',
  'contacto',
  'panel-admin',
];

const parseCurrentPageFromUrl = (): PublicPageId => {
  try {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (VALID_PAGES.includes(path as PublicPageId)) {
      return path as PublicPageId;
    }
  } catch {}
  return 'inicio';
};

const MainPlatform: React.FC = () => {
  const { user } = useCmjAuth();
  const [activePage, setActivePage] = useState<PublicPageId>(parseCurrentPageFromUrl);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cmj_dark_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CmjMember | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(parseCurrentPageFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [overview, setOverview] = useState<PublicOverviewResponse>({
    config: DEFAULT_INSTITUTIONAL_CONFIG,
    members: [],
    commissions: DEFAULT_COMMISSIONS_SEED.map((c) => ({
      ...c,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    sessions: [],
    documents: [],
    projects: [],
    articles: [],
    activities: [],
    polls: [],
    media: [],
  });

  const loadPublicOverview = useCallback(async () => {
    try {
      const data = await cmjApi.getPublicOverview();
      setOverview(data);
    } catch {
      // Keep default empty institutional state if backend is momentarily unavailable
    }
  }, []);

  useEffect(() => {
    loadPublicOverview();
  }, [loadPublicOverview]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('cmj_dark_mode', String(darkMode));
    } catch {
      // Ignore storage error
    }
  }, [darkMode]);

  const handleNavigate = (page: PublicPageId) => {
    setActivePage(page);
    try {
      const url = page === 'inicio' ? '/' : `/${page}`;
      if (window.location.pathname !== url) {
        window.history.pushState({}, '', url);
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePollUpdated = (updated: CmjPoll) => {
    setOverview((prev) => ({
      ...prev,
      polls: prev.polls.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  return (
    <div id="jc-app-shell" className="min-h-screen flex flex-col">
      <CmjNavbar
        activePage={activePage}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAuth={() => setAuthModalOpen(true)}
        officialLogoUrl={overview.config.officialLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {activePage === 'inicio' && (
          <InicioPage
            config={overview.config}
            members={overview.members}
            sessions={overview.sessions}
            documents={overview.documents}
            projects={overview.projects}
            articles={overview.articles}
            activities={overview.activities}
            polls={overview.polls}
            onNavigate={handleNavigate}
            onSelectMember={setSelectedMember}
          />
        )}

        {activePage === 'quienes-somos' && <QuienesSomosPage config={overview.config} />}

        {activePage === 'integrantes' && (
          <IntegrantesPage
            members={overview.members}
            commissions={overview.commissions}
            onSelectMember={setSelectedMember}
          />
        )}

        {activePage === 'gestion' && (
          <GestionPage
            sessions={overview.sessions}
            documents={overview.documents}
            projects={overview.projects}
            activities={overview.activities}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'control-politico' && (
          <ControlPoliticoPage onNavigate={handleNavigate} />
        )}

        {activePage === 'rendicion-cuentas' && (
          <RendicionCuentasPage
            documents={overview.documents}
            sessions={overview.sessions}
            projects={overview.projects}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'sesiones' && <SesionesPage sessions={overview.sessions} />}

        {activePage === 'documentos' && <DocumentosPage documents={overview.documents} />}

        {activePage === 'proyectos' && <ProyectosPage projects={overview.projects} />}

        {activePage === 'noticias' && <NoticiasPage articles={overview.articles} />}

        {activePage === 'actividades' && <ActividadesPage activities={overview.activities} />}

        {activePage === 'comisiones' && (
          <ComisionesPage
            commissions={overview.commissions}
            members={overview.members}
            projects={overview.projects}
          />
        )}

        {activePage === 'participacion' && <ParticipacionPage />}

        {activePage === 'encuestas' && (
          <EncuestasPage polls={overview.polls} onPollUpdated={handlePollUpdated} />
        )}

        {activePage === 'transparencia' && (
          <TransparenciaPage
            config={overview.config}
            documents={overview.documents}
            members={overview.members}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'galeria' && <GaleriaPage media={overview.media} />}

        {activePage === 'contacto' && <ContactoPage config={overview.config} />}

        {activePage === 'panel-admin' &&
          (user ? (
            <CmjAdminDashboard onDataChanged={loadPublicOverview} />
          ) : (
            <div className="rounded-2xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center space-y-4">
              <h2 className="text-xl font-display font-bold">Acceso Restringido</h2>
              <p className="text-sm text-stone-500">
                Debes iniciar sesión con tu cuenta institucional para acceder al Panel de Gestión.
              </p>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="btn-dulima-primary"
              >
                Iniciar Sesión Institucional
              </button>
            </div>
          ))}

        {!VALID_PAGES.includes(activePage) && (
          <div className="rounded-3xl p-12 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center space-y-4 max-w-xl mx-auto my-12">
            <div className="w-12 h-1.5 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-full mx-auto" />
            <h2 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">
              Página No Encontrada (404)
            </h2>
            <p className="text-sm text-stone-500">
              La sección que buscas no existe o ha sido reubicada dentro del portal institucional del CMJ Flandes.
            </p>
            <button
              type="button"
              onClick={() => handleNavigate('inicio')}
              className="btn-dulima-primary inline-flex"
            >
              Volver al Inicio
            </button>
          </div>
        )}
      </main>

      <CmjFooter config={overview.config} onNavigate={handleNavigate} />

      <CmjAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          loadPublicOverview();
          setActivePage('panel-admin');
        }}
      />

      <CouncilorProfileModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        projects={overview.projects}
        activities={overview.activities}
        documents={overview.documents}
        articles={overview.articles}
      />
    </div>
  );
};

export function App() {
  return (
    <CmjAuthProvider>
      <MainPlatform />
    </CmjAuthProvider>
  );
}

export default App;
