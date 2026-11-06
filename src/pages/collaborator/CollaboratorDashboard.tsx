import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  PenTool, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  LogOut, 
  Plus, 
  ArrowLeft, 
  MessageSquare,
  Save,
  Globe,
  Upload,
  BarChart2,
  Shield,
  Sparkles
} from 'lucide-react';
import { Article, ArticleStatus, Category, CitizenPoll } from '../../types';
import { 
  getArticles, 
  createArticle, 
  updateArticle, 
  getCategories,
  uploadImageFile,
  getCitizenPolls,
  saveCitizenPoll
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { AuthorProfileForm } from '../../components/common/AuthorProfileForm';
import {
  hasCollaboratorPermission,
  COLLABORATOR_PERMISSIONS_CATALOG
} from '../../utils/permissions';

interface CollaboratorDashboardProps {
  onBackToPublic: () => void;
  onPreviewArticle?: (slug: string) => void;
}

export const CollaboratorDashboard: React.FC<CollaboratorDashboardProps> = ({
  onBackToPublic,
  onPreviewArticle
}) => {
  const { collaborator, logout } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'list' | 'edit' | 'polls' | 'permissions' | 'profile'
  const [view, setView] = useState<'list' | 'edit' | 'polls' | 'permissions' | 'profile'>('list');
  const [currentArticle, setCurrentArticle] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Polls state (only when polls_create permission is granted)
  const [myPolls, setMyPolls] = useState<CitizenPoll[]>([]);
  const [pollTitle, setPollTitle] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsText, setPollOptionsText] = useState('Sí, estoy de acuerdo\nNo estoy de acuerdo');
  const [savingPoll, setSavingPoll] = useState(false);

  const canCreateArticles = hasCollaboratorPermission(collaborator, 'articles_create');
  const canCreatePolls = hasCollaboratorPermission(collaborator, 'polls_create');
  const canPublishPollsDirectly = hasCollaboratorPermission(collaborator, 'polls_publish');

  useEffect(() => {
    loadCollaboratorArticles();
  }, [collaborator]);

  const loadCollaboratorArticles = async () => {
    if (!collaborator) return;
    setLoading(true);
    try {
      const [allArticles, cats] = await Promise.all([
        getArticles({ includeAllStatus: true, authorEmail: collaborator.email }),
        getCategories()
      ]);
      setArticles(allArticles);
      setCategories(cats);
    } catch (e) {
      console.error('Error loading collaborator articles:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewArticle = () => {
    setCurrentArticle({
      title: '',
      subtitle: '',
      slug: '',
      content: '',
      coverImageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
      coverImageCaption: '',
      categoryId: categories[0]?.slug || 'opinion',
      categoryName: categories[0]?.name || 'Opinión',
      status: 'borrador',
      allowComments: true,
      views: 0,
      readingMinutes: 4,
      featured: false,
      authorName: collaborator?.fullName || 'Colaborador Editorial',
      authorEmail: collaborator?.email,
      authorRole: 'collaborator'
    });
    setFeedbackMsg(null);
    setView('edit');
  };

  const handleEditArticle = (art: Article) => {
    // Collaborator can edit if draft, revision, or changes requested
    setCurrentArticle({ ...art });
    setFeedbackMsg(null);
    setView('edit');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSaveDraft = async () => {
    if (!currentArticle?.title?.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Por favor ingresa al menos un título para el artículo.' });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      const slug = currentArticle.slug || generateSlug(currentArticle.title);
      const payload: Partial<Article> = {
        ...currentArticle,
        slug,
        status: currentArticle.status === 'cambios' ? 'cambios' : 'borrador',
        authorName: collaborator?.fullName || 'Colaborador',
        authorEmail: collaborator?.email,
        authorRole: 'collaborator'
      };

      if (currentArticle.id) {
        await updateArticle(currentArticle.id, payload);
      } else {
        const id = await createArticle(payload as Omit<Article, 'id'>);
        setCurrentArticle(prev => ({ ...prev, id }));
      }

      setFeedbackMsg({ type: 'success', text: 'Borrador guardado exitosamente.' });
      await loadCollaboratorArticles();
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: 'Error al guardar el borrador.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!currentArticle?.title?.trim() || !currentArticle?.content?.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Completa el título y el contenido antes de enviar a revisión.' });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      const slug = currentArticle.slug || generateSlug(currentArticle.title);
      const payload: Partial<Article> = {
        ...currentArticle,
        slug,
        status: 'revision' as ArticleStatus,
        submittedAt: new Date().toISOString(),
        authorName: collaborator?.fullName || 'Colaborador',
        authorEmail: collaborator?.email,
        authorRole: 'collaborator'
      };

      if (currentArticle.id) {
        await updateArticle(currentArticle.id, payload);
      } else {
        const id = await createArticle(payload as Omit<Article, 'id'>);
        setCurrentArticle(prev => ({ ...prev, id, status: 'revision' }));
      }

      setFeedbackMsg({ 
        type: 'success', 
        text: '¡Artículo enviado para revisión! Julian Camilo lo revisará en su panel administrativo para su aprobación final.' 
      });
      await loadCollaboratorArticles();
      setView('list');
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: 'Error al enviar para aprobación.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImageFile(file, 'articles');
      setCurrentArticle(prev => ({ ...prev, coverImageUrl: url }));
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case 'published':
      case 'publicado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 inline-flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Publicado</span>
          </span>
        );
      case 'revision':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 inline-flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>En Revisión</span>
          </span>
        );
      case 'cambios':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 inline-flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Requiere Modificaciones</span>
          </span>
        );
      case 'aprobado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 inline-flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Aprobado</span>
          </span>
        );
      case 'rechazado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 inline-flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>Rechazado</span>
          </span>
        );
      case 'draft':
      case 'borrador':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 inline-flex items-center space-x-1">
            <PenTool className="w-3 h-3" />
            <span>Borrador</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] dark:bg-[#121214] text-[#121212] dark:text-white flex flex-col justify-between">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#18181c] border-b border-[#e7e4dc] dark:border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToPublic}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Volver al portal público"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif font-black text-base uppercase tracking-tight text-[#121212] dark:text-white">
              Escritorio de Colaborador
            </h1>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-sans">
              Articulista: <strong className="text-stone-800 dark:text-stone-200">{collaborator?.fullName}</strong> ({collaborator?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToPublic}
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-stone-600 dark:text-stone-300 hover:text-gold-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ver Portal Público</span>
          </button>
          <button
            onClick={logout}
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Notice Card */}
        <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-stone-600 dark:text-stone-300 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
            <span>
              Tienes permisos editoriales para redactar borradores y enviarlos al comité de publicación de Julian Camilo.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                view === 'list' || view === 'edit'
                  ? 'bg-gold-500 text-stone-950 border-gold-500'
                  : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Mis Artículos
            </button>

            {canCreatePolls && (
              <button
                type="button"
                onClick={async () => {
                  setView('polls');
                  if (collaborator?.email) {
                    const all = await getCitizenPolls();
                    setMyPolls(
                      all.filter(
                        (p) => p.creatorEmail?.toLowerCase() === collaborator.email.toLowerCase()
                      )
                    );
                  }
                }}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center space-x-1.5 ${
                  view === 'polls'
                    ? 'bg-gold-500 text-stone-950 border-gold-500'
                    : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Encuestas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setView('permissions')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center space-x-1.5 ${
                view === 'permissions'
                  ? 'bg-gold-500 text-stone-950 border-gold-500'
                  : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Permisos y Beneficios</span>
            </button>

            <button
              type="button"
              onClick={() => setView('profile')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                view === 'profile'
                  ? 'bg-gold-500 text-stone-950 border-gold-500'
                  : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Mi Perfil
            </button>

            {view === 'list' && canCreateArticles && (
              <button
                onClick={handleStartNewArticle}
                className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-gold-700 dark:bg-gold-600 dark:hover:bg-gold-500 text-white dark:text-stone-950 font-bold text-xs uppercase tracking-wider inline-flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Artículo</span>
              </button>
            )}
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start space-x-2.5 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>{feedbackMsg.text}</div>
          </div>
        )}

        {/* VIEW 1: Articles List */}
        {view === 'list' && (
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                <span>Mis Publicaciones y Borradores ({articles.length})</span>
              </h2>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-stone-500 font-serif italic">Cargando tus artículos...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <FileText className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto" />
                <h3 className="font-serif font-bold text-base text-stone-700 dark:text-stone-300">
                  Aún no tienes artículos creados
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Comienza a redactar tu primera columna de opinión o ensayo editorial para revisión.
                </p>
                <button
                  onClick={handleStartNewArticle}
                  className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold text-xs uppercase tracking-wider inline-flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Redactar primer borrador</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {articles.map((art) => (
                  <div key={art.id} className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(art.status)}
                        <span className="text-[10px] text-stone-400 font-sans">
                          {new Date(art.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white line-clamp-1">
                        {art.title}
                      </h3>
                      {art.subtitle && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                          {art.subtitle}
                        </p>
                      )}

                      {/* Editorial notes if changes requested */}
                      {art.reviewNotes && (
                        <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 space-y-1">
                          <span className="font-bold flex items-center space-x-1 text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Observaciones de Julian Camilo:
                          </span>
                          <p className="italic font-serif leading-relaxed">{art.reviewNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {art.status !== 'publicado' && art.status !== 'published' && (
                        <button
                          onClick={() => handleEditArticle(art)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-gold-50 dark:hover:bg-gold-950/50 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
                        >
                          <PenTool className="w-3.5 h-3.5 text-gold-600" />
                          <span>Editar</span>
                        </button>
                      )}
                      {(art.status === 'publicado' || art.status === 'published') && onPreviewArticle && (
                        <button
                          onClick={() => onPreviewArticle(art.slug || art.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver en web</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Article Editor */}
        {view === 'edit' && currentArticle && (
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <button
                onClick={() => setView('list')}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la lista</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Guardando...' : 'Guardar Borrador'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold text-xs uppercase tracking-wider inline-flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar para Aprobación</span>
                </button>
              </div>
            </div>

            {/* Editor Form */}
            <div className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Título del Artículo *
                </label>
                <input
                  type="text"
                  value={currentArticle.title || ''}
                  onChange={(e) => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                  placeholder="Ej. El Dilema de la Representación Política en Colombia"
                  className="w-full p-3 font-serif font-bold text-xl border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Subtítulo / Bajada Editorial
                </label>
                <input
                  type="text"
                  value={currentArticle.subtitle || ''}
                  onChange={(e) => setCurrentArticle({ ...currentArticle, subtitle: e.target.value })}
                  placeholder="Una lectura sobre los consensos sociales y el fortalecimiento institucional..."
                  className="w-full p-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Categoría Editorial
                  </label>
                  <select
                    value={currentArticle.categoryId}
                    onChange={(e) => {
                      const cat = categories.find(c => c.slug === e.target.value);
                      setCurrentArticle({
                        ...currentArticle,
                        categoryId: e.target.value,
                        categoryName: cat?.name || 'Opinión'
                      });
                    }}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Tiempo Estimado de Lectura (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={currentArticle.readingMinutes || 4}
                    onChange={(e) => setCurrentArticle({ ...currentArticle, readingMinutes: parseInt(e.target.value) || 4 })}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Fotografía de Portada
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {currentArticle.coverImageUrl && (
                    <img
                      src={currentArticle.coverImageUrl}
                      alt=""
                      className="w-32 h-20 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2 w-full">
                    <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-gold-600" />
                      <span>{uploadingImage ? 'Subiendo imagen...' : 'Subir foto desde dispositivo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={currentArticle.coverImageUrl || ''}
                      onChange={(e) => setCurrentArticle({ ...currentArticle, coverImageUrl: e.target.value })}
                      placeholder="O pegar URL de imagen: https://..."
                      className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Cuerpo del Ensayo / Columna *
                </label>
                <textarea
                  rows={14}
                  value={currentArticle.content || ''}
                  onChange={(e) => setCurrentArticle({ ...currentArticle, content: e.target.value })}
                  placeholder="Escribe el cuerpo de tu artículo. Puedes utilizar párrafos separados, subtítulos y reflexiones..."
                  className="w-full p-4 font-serif text-base leading-relaxed border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {view === 'polls' && canCreatePolls && collaborator && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const lines = pollOptionsText
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean);
                if (!pollQuestion.trim() || lines.length < 2) {
                  setFeedbackMsg({
                    type: 'error',
                    text: 'Ingresa una pregunta y al menos 2 opciones.'
                  });
                  return;
                }
                setSavingPoll(true);
                setFeedbackMsg(null);
                try {
                  const resp = await fetch('/api/polls/validate-create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'collaborator', collaborator })
                  });
                  const data = await resp.json().catch(() => ({}));
                  if (!resp.ok || data.allowed === false) {
                    setFeedbackMsg({
                      type: 'error',
                      text: data.error || 'No tienes permiso para crear encuestas.'
                    });
                    setSavingPoll(false);
                    return;
                  }

                  await saveCitizenPoll({
                    title: pollTitle.trim() || undefined,
                    question: pollQuestion.trim(),
                    options: lines.map((text, idx) => ({
                      id: `opt_${Date.now()}_${idx}`,
                      text,
                      votes: 0
                    })),
                    totalVotes: 0,
                    status: canPublishPollsDirectly ? 'activa' : 'pendiente',
                    creatorName: collaborator.fullName,
                    creatorEmail: collaborator.email,
                    creatorPhotoUrl: collaborator.photoUrl,
                    creatorRole: 'collaborator',
                    publishedAt: canPublishPollsDirectly ? new Date().toISOString() : undefined
                  });

                  setPollTitle('');
                  setPollQuestion('');
                  setFeedbackMsg({
                    type: 'success',
                    text: canPublishPollsDirectly
                      ? 'Encuesta publicada en la plataforma.'
                      : 'Encuesta enviada a revisión del propietario.'
                  });
                  const all = await getCitizenPolls();
                  setMyPolls(
                    all.filter(
                      (p) => p.creatorEmail?.toLowerCase() === collaborator.email.toLowerCase()
                    )
                  );
                } catch {
                  setFeedbackMsg({ type: 'error', text: 'Error al guardar la encuesta.' });
                } finally {
                  setSavingPoll(false);
                }
              }}
              className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs h-fit"
            >
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                Crear Encuesta Ciudadana
              </h3>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título (Opcional)
                </label>
                <input
                  type="text"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Pregunta *
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Opciones (una por línea) *
                </label>
                <textarea
                  rows={4}
                  value={pollOptionsText}
                  onChange={(e) => setPollOptionsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={savingPoll}
                className="w-full py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {savingPoll ? 'Guardando...' : canPublishPollsDirectly ? 'Publicar Encuesta' : 'Enviar a Revisión'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                Mis Encuestas ({myPolls.length})
              </h3>
              {myPolls.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#18181c] border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl text-xs text-stone-500">
                  Aún no has creado encuestas.
                </div>
              ) : (
                myPolls.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gold-600">{p.title || 'Encuesta'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800">
                        {p.status}
                      </span>
                    </div>
                    <div className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                      {p.question}
                    </div>
                    <div className="text-[11px] text-stone-500">Participantes: {p.totalVotes || 0}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'permissions' && collaborator && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-gold-600" />
                <span>Permisos Activos Asignados</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Estos son los permisos individuales habilitados actualmente para tu cuenta por el propietario:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COLLABORATOR_PERMISSIONS_CATALOG.filter(
                  (p) => !p.ownerOnly && hasCollaboratorPermission(collaborator, p.key)
                ).map((perm) => (
                  <div
                    key={perm.key}
                    className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60"
                  >
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      ✓ {perm.label}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {perm.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 h-fit">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-gold-600" />
                <span>Beneficios Especiales</span>
              </h3>
              {!collaborator.customBenefits || collaborator.customBenefits.length === 0 ? (
                <p className="text-xs text-stone-500 italic">
                  No tienes beneficios especiales adicionales asignados en este momento.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {collaborator.customBenefits.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-gold-50/70 dark:bg-gold-950/25 border border-gold-200 dark:border-gold-800/60"
                    >
                      <div className="text-xs font-bold text-stone-900 dark:text-white">★ {b.name}</div>
                      <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                        {b.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'profile' && collaborator && (
          <AuthorProfileForm
            role="collaborator"
            initialEmail={collaborator.email}
            initialName={collaborator.fullName}
            collaborator={collaborator}
          />
        )}
      </main>
    </div>
  );
};
