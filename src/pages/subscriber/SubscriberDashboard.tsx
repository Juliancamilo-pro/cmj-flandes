import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  Megaphone, 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Send, 
  Save, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  LogOut, 
  ExternalLink, 
  Image as ImageIcon,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  MousePointerClick,
  Printer,
  ShieldCheck,
  RefreshCw,
  Lock,
  BarChart2
} from 'lucide-react';
import { 
  Article, 
  Category, 
  SubscriberUser, 
  AdProposal, 
  AdPlacement,
  AdProposalStatus,
  ArticleStatus,
  ArticleFormat,
  SubscriptionPlan,
  SubscriptionPaymentRecord,
  FinancialSettings,
  CitizenPoll
} from '../../types';
import { 
  getArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle, 
  getCategories, 
  getAdProposals, 
  createAdProposal, 
  updateAdProposal, 
  deleteAdProposal,
  updateSubscriber,
  getSubscriptionPayments,
  getSubscriptionPlans,
  recordSubscriptionPayment,
  getFinancialSettings,
  getCitizenPolls,
  saveCitizenPoll
} from '../../services/db';
import { canSubscriberCreatePolls } from '../../utils/permissions';
import { openWompiCheckout } from '../../services/wompi';
import { useAuth } from '../../context/AuthContext';
import { PhotoUploaderModal } from '../../components/common/PhotoUploaderModal';
import { AuthorProfileForm } from '../../components/common/AuthorProfileForm';

interface SubscriberDashboardProps {
  onBackToSite: () => void;
}

export const SubscriberDashboard: React.FC<SubscriberDashboardProps> = ({ onBackToSite }) => {
  const { subscriber, logout, setSubscriberSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'articles' | 'ads' | 'polls' | 'subscription' | 'profile'>('articles');

  // Polls state (exclusive to Mensual & Anual)
  const [myPolls, setMyPolls] = useState<CitizenPoll[]>([]);
  const [pollTitle, setPollTitle] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsText, setPollOptionsText] = useState('Sí, estoy de acuerdo\nNo estoy de acuerdo');
  const [pollClosesAt, setPollClosesAt] = useState('');
  const [savingPoll, setSavingPoll] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // Article Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [format, setFormat] = useState<ArticleFormat>('opinion');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageCaption, setCoverImageCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [savingArticle, setSavingArticle] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  // Ad Proposals State
  const [ads, setAds] = useState<AdProposal[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdProposal | null>(null);

  // Ad Form Fields
  const [businessName, setBusinessName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bodyCopy, setBodyCopy] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [requestedPlacement, setRequestedPlacement] = useState<AdPlacement>('sidebar');
  const [savingAd, setSavingAd] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // Photo Uploader Modal for articles and ads
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'article' | 'ad'>('article');

  // Payments & Plans State
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>([]);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedPlanForRenew, setSelectedPlanForRenew] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<SubscriptionPaymentRecord | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);

  // Notification state
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (subscriber) {
      loadData();
    }
  }, [subscriber]);

  const loadData = async () => {
    if (!subscriber) return;
    setLoadingArticles(true);
    setLoadingAds(true);

    try {
      const [allArticles, cats, myAds, myPayments, availablePlans, finSettings] = await Promise.all([
        getArticles({ includeAllStatus: true }),
        getCategories(),
        getAdProposals({ subscriberEmail: subscriber.email }),
        getSubscriptionPayments({ subscriberEmail: subscriber.email }),
        getSubscriptionPlans(),
        getFinancialSettings()
      ]);

      // Filter articles created by this subscriber
      const myArticles = allArticles.filter(
        (a) => a.authorEmail?.toLowerCase() === subscriber.email.toLowerCase() ||
               (a.authorRole === 'subscriber' && a.authorName === subscriber.fullName)
      );

      setArticles(myArticles);
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].slug);
      }
      setAds(myAds);
      setPayments(myPayments);
      setPlans(availablePlans);
      setFinancialSettings(finSettings);
      if (availablePlans.length > 0) {
        const matching = availablePlans.find(p => p.id === subscriber.planId) || availablePlans[0];
        setSelectedPlanForRenew(matching);
      }
    } catch (e) {
      console.error('Error loading subscriber data:', e);
    } finally {
      setLoadingArticles(false);
      setLoadingAds(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  /* =========================================================================
     ARTICLE HANDLERS
     ========================================================================= */
  const handleOpenNewArticle = () => {
    setEditingArticle(null);
    setTitle('');
    setSubtitle('');
    setFormat('opinion');
    setContent('');
    setCoverImageUrl('');
    setCoverImageCaption('');
    setVideoUrl('');
    setAudioUrl('');
    setCategoryId(categories[0]?.slug || 'opinion');
    setArticleError(null);
    setEditorOpen(true);
  };

  const handleEditArticle = (art: Article) => {
    setEditingArticle(art);
    setTitle(art.title);
    setSubtitle(art.subtitle || '');
    setFormat(art.format || 'opinion');
    setContent(art.content);
    setCoverImageUrl(art.coverImageUrl || '');
    setCoverImageCaption(art.coverImageCaption || '');
    setVideoUrl(art.videoUrl || '');
    setAudioUrl(art.audioUrl || '');
    setCategoryId(art.categoryId || categories[0]?.slug || 'opinion');
    setArticleError(null);
    setEditorOpen(true);
  };

  const handleSaveArticle = async (intendedStatus: 'borrador' | 'revision') => {
    if (!subscriber) return;
    setArticleError(null);

    if (!title.trim()) {
      setArticleError('El título del artículo es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setArticleError('El contenido del artículo no puede estar vacío.');
      return;
    }

    setSavingArticle(true);
    const selectedCat = categories.find((c) => c.slug === categoryId) || categories[0];
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

    const readingMinutes = Math.max(1, Math.round((content.trim().split(/\s+/).length || 1) / 200));

    try {
      const payload: Partial<Article> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        format,
        content: content.trim(),
        categoryId: selectedCat?.slug || 'opinion',
        categoryName: selectedCat?.name || 'Opinión',
        coverImageUrl: coverImageUrl.trim(),
        coverImageCaption: coverImageCaption.trim(),
        videoUrl: videoUrl.trim() || undefined,
        audioUrl: audioUrl.trim() || undefined,
        status: intendedStatus as ArticleStatus,
        authorName: subscriber.fullName,
        authorEmail: subscriber.email,
        authorRole: 'subscriber',
        readingMinutes,
        allowComments: true,
        updatedAt: new Date().toISOString()
      };

      if (intendedStatus === 'revision') {
        payload.submittedAt = new Date().toISOString();
      }

      if (editingArticle) {
        await updateArticle(editingArticle.id, payload);
        showToast(
          intendedStatus === 'revision'
            ? 'Artículo enviado a revisión editorial de Julian Camilo.'
            : 'Borrador guardado exitosamente.'
        );
      } else {
        await createArticle({
          ...payload,
          slug,
          views: 0,
          featured: false,
          createdAt: new Date().toISOString()
        } as any);
        showToast(
          intendedStatus === 'revision'
            ? 'Artículo creado y enviado a revisión editorial.'
            : 'Borrador creado exitosamente.'
        );
      }

      setEditorOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error saving article:', e);
      setArticleError('Ocurrió un error al guardar el artículo.');
    } finally {
      setSavingArticle(false);
    }
  };

  /* =========================================================================
     AD PROPOSAL HANDLERS
     ========================================================================= */
  const handleOpenNewAd = () => {
    setEditingAd(null);
    setBusinessName('');
    setHeadline('');
    setBodyCopy('');
    setBannerUrl('');
    setTargetUrl('');
    setRequestedPlacement('sidebar');
    setAdError(null);
    setAdModalOpen(true);
  };

  const handleEditAd = (ad: AdProposal) => {
    setEditingAd(ad);
    setBusinessName(ad.businessName);
    setHeadline(ad.headline);
    setBodyCopy(ad.bodyCopy);
    setBannerUrl(ad.bannerUrl);
    setTargetUrl(ad.targetUrl || '');
    setRequestedPlacement(ad.requestedPlacement);
    setAdError(null);
    setAdModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriber) return;
    setAdError(null);

    if (!businessName.trim() || !headline.trim() || !targetUrl.trim()) {
      setAdError('Ingresa el nombre del negocio, título del anuncio y enlace web de destino.');
      return;
    }

    setSavingAd(true);
    try {
      if (!editingAd && subscriber.period === 'anual') {
        const recentDates = ads
          .filter((a) => a.status !== 'borrador' && a.status !== 'rechazado')
          .map((a) => a.createdAt);
        const checkResp = await fetch('/api/ads/check-weekly-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriberEmail: subscriber.email,
            planPeriod: subscriber.period,
            weeklyLimit: 1,
            existingProposalDates: recentDates,
            recordSubmission: true
          })
        });
        const checkData = await checkResp.json().catch(() => ({}));
        if (!checkResp.ok || checkData.allowed === false) {
          setAdError(
            checkData.error ||
              'Ya utilizaste tu beneficio semanal de publicidad (1 propuesta cada 7 días).'
          );
          setSavingAd(false);
          return;
        }
      }

      if (editingAd) {
        await updateAdProposal(editingAd.id, {
          businessName: businessName.trim(),
          headline: headline.trim(),
          bodyCopy: bodyCopy.trim(),
          bannerUrl: bannerUrl.trim(),
          targetUrl: targetUrl.trim(),
          requestedPlacement,
          status: 'pendiente' // Resets to pending review when modified
        });
        showToast('Propuesta publicitaria actualizada y enviada a revisión.');
      } else {
        await createAdProposal({
          subscriberId: subscriber.id,
          subscriberEmail: subscriber.email,
          subscriberName: subscriber.fullName,
          businessName: businessName.trim(),
          headline: headline.trim(),
          bodyCopy: bodyCopy.trim(),
          bannerUrl: bannerUrl.trim(),
          targetUrl: targetUrl.trim(),
          requestedPlacement,
          status: 'pendiente',
          impressions: 0,
          clicks: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        showToast('Propuesta publicitaria creada y enviada a revisión de Julian Camilo.');
      }

      setAdModalOpen(false);
      await loadData();
    } catch (e) {
      console.error('Error saving ad:', e);
      setAdError('Error al guardar la propuesta de anuncio.');
    } finally {
      setSavingAd(false);
    }
  };

  const loadSubscriberPolls = async () => {
    if (!subscriber) return;
    try {
      const all = await getCitizenPolls();
      setMyPolls(
        all.filter(
          (p) => p.creatorEmail?.toLowerCase() === subscriber.email.toLowerCase()
        )
      );
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'polls') {
      loadSubscriberPolls();
    }
  }, [activeTab, subscriber?.email]);

  const handleCreateSubscriberPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriber) return;
    setPollError(null);

    const lines = pollOptionsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!pollQuestion.trim() || lines.length < 2) {
      setPollError('Ingresa una pregunta y al menos 2 opciones (una por línea).');
      return;
    }

    setSavingPoll(true);
    try {
      const valResp = await fetch('/api/polls/validate-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'subscriber',
          subscriber: {
            status: subscriber.status,
            endDate: subscriber.endDate,
            planPeriod: subscriber.period
          }
        })
      });
      const valData = await valResp.json().catch(() => ({}));
      if (!valResp.ok || valData.allowed === false) {
        setPollError(
          valData.error ||
            'La creación de encuestas es exclusiva de los planes Mensual y Anual activos.'
        );
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
        status: 'pendiente',
        creatorName: subscriber.fullName,
        creatorEmail: subscriber.email,
        creatorRole: 'subscriber',
        creatorPlanPeriod: subscriber.period as any,
        closesAt: pollClosesAt ? new Date(pollClosesAt).toISOString() : undefined
      });

      setPollTitle('');
      setPollQuestion('');
      setPollClosesAt('');
      setPollOptionsText('Sí, estoy de acuerdo\nNo estoy de acuerdo');
      showToast('Encuesta enviada a revisión del propietario.');
      await loadSubscriberPolls();
    } catch (err) {
      setPollError('No se pudo enviar la encuesta.');
    } finally {
      setSavingPoll(false);
    }
  };

  /* =========================================================================
     SUBSCRIPTION RENEWAL TOGGLE
     ========================================================================= */
  const handleToggleAutoRenew = async () => {
    if (!subscriber) return;
    try {
      const nextVal = !subscriber.autoRenew;
      await updateSubscriber(subscriber.id, { autoRenew: nextVal });
      const updated = { ...subscriber, autoRenew: nextVal };
      setSubscriberSession(updated);
      showToast(nextVal ? 'Renovación automática activada.' : 'Renovación automática cancelada.');
    } catch (e) {
      console.error('Error toggling auto renew:', e);
    }
  };

  if (!subscriber) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
          Sesión de Suscriptor no encontrada
        </h2>
        <p className="text-xs text-stone-500 font-sans">
          Por favor inicia sesión con el correo electrónico de tu suscripción Premium.
        </p>
        <button
          onClick={onBackToSite}
          className="px-5 py-2.5 rounded-xl bg-[#121212] text-white text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors"
        >
          Volver a la portada
        </button>
      </div>
    );
  }

  const renderStatusBadge = (status: ArticleStatus | AdProposalStatus) => {
    switch (status) {
      case 'borrador':
      case 'draft':
        return (
          <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold uppercase tracking-wider font-sans">
            Borrador
          </span>
        );
      case 'revision':
      case 'pendiente':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center space-x-1">
            <Clock className="w-3 h-3 mr-1" />
            <span>Pendiente de Aprobación</span>
          </span>
        );
      case 'en_revision':
        return (
          <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center space-x-1">
            <Clock className="w-3 h-3 mr-1" />
            <span>En Revisión Editorial</span>
          </span>
        );
      case 'cambios':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
            <span>Requiere Modificaciones</span>
          </span>
        );
      case 'aprobado':
        return (
          <span className="px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 mr-1 text-teal-600" />
            <span>Aprobado (Programando)</span>
          </span>
        );
      case 'publicado':
      case 'published':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            <span>Publicado en el Portal</span>
          </span>
        );
      case 'rechazado':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center space-x-1">
            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
            <span>Rechazado</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#121212] text-white text-xs font-sans p-4 rounded-2xl shadow-xl flex items-center space-x-2 border border-gold-500/40 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header & Subscriber Identity */}
      <header className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/60 text-gold-900 dark:text-gold-300 text-[11px] font-bold uppercase tracking-wider font-sans">
            <Sparkles className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
            <span>Panel de Suscriptor Premium</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white">
            {subscriber.fullName}
          </h1>

          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            {subscriber.email} • Suscripción vigente hasta el{' '}
            <strong className="text-stone-800 dark:text-stone-200">
              {new Date(subscriber.endDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBackToSite}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Ver Sitio Web
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 space-x-4">
        <button
          onClick={() => setActiveTab('articles')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider font-sans flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'articles'
              ? 'border-gold-500 text-stone-900 dark:text-white font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <FileText className="w-4 h-4 text-gold-600 dark:text-gold-400" />
          <span>Mis Artículos ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider font-sans flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'ads'
              ? 'border-gold-500 text-stone-900 dark:text-white font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Megaphone className="w-4 h-4 text-gold-600 dark:text-gold-400" />
          <span>Publicidad & Anuncios ({ads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('polls')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider font-sans flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'polls'
              ? 'border-gold-500 text-stone-900 dark:text-white font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-gold-600 dark:text-gold-400" />
          <span>Encuestas</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider font-sans flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'subscription'
              ? 'border-gold-500 text-stone-900 dark:text-white font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <CreditCard className="w-4 h-4 text-gold-600 dark:text-gold-400" />
          <span>Mi Plan & Pagos</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider font-sans flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-gold-500 text-stone-900 dark:text-white font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-gold-600 dark:text-gold-400" />
          <span>Mi Perfil de Autor y Verificación</span>
        </button>
      </div>

      {/* =========================================================================
         TAB 1: ARTICLES
         ========================================================================= */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
                Artículos Editoriales Escritos por Ti
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Guarda borradores y envíalos cuando estén listos para la revisión editorial de Julian Camilo.
              </p>
            </div>

            <button
              onClick={handleOpenNewArticle}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Redactar Nuevo Artículo</span>
            </button>
          </div>

          {loadingArticles ? (
            <div className="p-12 text-center text-xs text-stone-500 font-sans">
              Cargando tus artículos...
            </div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#18181c] rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
              <FileText className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="text-base font-serif font-bold text-stone-800 dark:text-stone-200">
                Aún no has creado artículos
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto font-sans">
                Empieza hoy mismo a compartir tus reflexiones y columnas de opinión con la comunidad.
              </p>
              <button
                onClick={handleOpenNewArticle}
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gold-600 text-stone-950 font-semibold text-xs cursor-pointer hover:bg-gold-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Escribir primer borrador</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-5 sm:p-6 bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400 font-sans">
                        {art.categoryName}
                      </span>
                      <span>•</span>
                      {renderStatusBadge(art.status)}
                    </div>

                    <span className="text-[11px] text-stone-400 font-sans">
                      Actualizado: {new Date(art.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    {art.coverImageUrl && (
                      <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                        <img src={art.coverImageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white leading-snug">
                        {art.title}
                      </h3>
                      {art.subtitle && (
                        <p className="text-xs font-serif italic text-stone-600 dark:text-stone-400 line-clamp-2">
                          {art.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Observations from Julian Camilo */}
                  {art.reviewNotes && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-sans text-amber-900 dark:text-amber-200 space-y-1">
                      <strong className="block font-semibold">Observaciones del Editor (Julian Camilo):</strong>
                      <p className="leading-relaxed">{art.reviewNotes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-stone-400 font-sans">
                      {art.readingMinutes} min de lectura • {art.content.split(/\s+/).filter(Boolean).length} palabras
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditArticle(art)}
                        className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         TAB 2: ADVERTISING & PROPOSALS
         ========================================================================= */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
                Tus Propuestas Publicitarias
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Postula anuncios para tu marca o proyecto. Ningún anuncio aparece automáticamente sin aprobación de Julian Camilo.
              </p>
            </div>

            <button
              onClick={handleOpenNewAd}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Propuesta de Anuncio</span>
            </button>
          </div>

          {loadingAds ? (
            <div className="p-12 text-center text-xs text-stone-500 font-sans">
              Cargando tus anuncios...
            </div>
          ) : ads.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#18181c] rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
              <Megaphone className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="text-base font-serif font-bold text-stone-800 dark:text-stone-200">
                No tienes propuestas publicitarias
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto font-sans">
                Aprovecha tu Suscripción Premium para dar a conocer tu emprendimiento, libro o iniciativa a los lectores.
              </p>
              <button
                onClick={handleOpenNewAd}
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gold-600 text-stone-950 font-semibold text-xs cursor-pointer hover:bg-gold-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear propuesta</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="p-5 sm:p-6 bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
                      {ad.businessName}
                    </span>
                    {renderStatusBadge(ad.status)}
                  </div>

                  {ad.bannerUrl && (
                    <div className="h-36 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800">
                      <img src={ad.bannerUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                      {ad.headline}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
                      {ad.bodyCopy}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-sans">
                    <a
                      href={ad.targetUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-600 dark:text-gold-400 font-semibold inline-flex items-center space-x-1 hover:underline"
                    >
                      <span>{(ad.targetUrl || '').replace(/^https?:\/\//, '').slice(0, 24)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center space-x-3 text-stone-400 text-[11px]">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {ad.impressions || 0} vistas
                      </span>
                      <span className="flex items-center">
                        <MousePointerClick className="w-3 h-3 mr-1" />
                        {ad.clicks || 0} clics
                      </span>
                    </div>
                  </div>

                  {ad.editorNotes && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-sans text-amber-900 dark:text-amber-200 space-y-1">
                      <strong className="block font-semibold">Observaciones de Julian Camilo:</strong>
                      <p>{ad.editorNotes}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleEditAd(ad)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                      Editar propuesta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         TAB: POLLS (EXCLUSIVE TO MENSUAL & ANUAL)
         ========================================================================= */}
      {activeTab === 'polls' && (
        <div className="space-y-6">
          {!canSubscriberCreatePolls(subscriber) ? (
            <div className="p-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
              <h3 className="text-base font-serif font-bold text-amber-900 dark:text-amber-200">
                Beneficio exclusivo de los planes Mensual y Anual
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-sans leading-relaxed">
                Tu plan actual (<strong>{subscriber.period || 'individual'}</strong>) no incluye la creación de encuestas ciudadanas. Actualiza a <strong>Plan Mensual</strong> o <strong>Plan Anual</strong> para proponer encuestas en la plataforma.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleCreateSubscriberPoll}
                className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs h-fit"
              >
                <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                  Proponer Nueva Encuesta
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Las encuestas propuestas pasan por revisión del propietario antes de publicarse.
                </p>

                {pollError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                    {pollError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Título (Opcional)
                  </label>
                  <input
                    type="text"
                    value={pollTitle}
                    onChange={(e) => setPollTitle(e.target.value)}
                    placeholder="Ej. Consulta de Opinión"
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
                    placeholder="¿Cuál es tu opinión sobre...?"
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Fecha de cierre sugerida (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={pollClosesAt}
                    onChange={(e) => setPollClosesAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPoll}
                  className="w-full py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {savingPoll ? 'Enviando...' : 'Enviar Encuesta a Revisión'}
                </button>
              </form>

              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                  Tus Encuestas ({myPolls.length})
                </h3>
                {myPolls.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#18181c] border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl text-xs text-stone-500">
                    Aún no has propuesto encuestas.
                  </div>
                ) : (
                  myPolls.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-gold-600">
                          {p.title || 'Encuesta'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {p.status}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                        {p.question}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Participantes: {p.totalVotes || 0}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         TAB 4: AUTHOR PROFILE & VERIFICATION
         ========================================================================= */}
      {activeTab === 'profile' && subscriber && (
        <AuthorProfileForm
          role="subscriber"
          initialEmail={subscriber.email}
          initialName={subscriber.fullName}
          subscriber={subscriber}
        />
      )}

      {/* =========================================================================
         TAB 3: SUBSCRIPTION & PAYMENTS
         ========================================================================= */}
      {activeTab === 'subscription' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1 border-b border-stone-100 dark:border-stone-800 pb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-600 dark:text-gold-400 font-sans">
                Información de Membresía
              </span>
              <h2 className="text-2xl font-serif font-black text-stone-900 dark:text-white">
                Suscripción Premium
              </h2>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Estado actual:</span>
                <span className="font-bold text-emerald-600 uppercase tracking-wide">
                  {subscriber.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Tarifa configurada:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  ${(subscriber.amountCOP || 20000).toLocaleString('es-CO')} COP / mes
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Fecha de inicio:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {new Date(subscriber.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Próximo vencimiento:</span>
                <span className="font-bold text-gold-700 dark:text-gold-400">
                  {new Date(subscriber.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500">Última referencia de transacción:</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">
                  {subscriber.lastPaymentRef || 'N/A'}
                </span>
              </div>
            </div>

            {/* Auto-renew toggle */}
            <div className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-stone-900 dark:text-white font-sans">
                  Renovación Automática
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                  {subscriber.autoRenew
                    ? 'Tu suscripción se renovará mensualmente sin interrupciones.'
                    : 'La renovación automática está desactivada. Tu acceso finalizará al cumplirse la fecha de vencimiento.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoRenew}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  subscriber.autoRenew
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {subscriber.autoRenew ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         ARTICLE EDITOR MODAL
         ========================================================================= */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-xl font-serif font-black text-stone-900 dark:text-white">
                  {editingArticle ? 'Editar Artículo' : 'Redactar Nuevo Artículo'}
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Será enviado para aprobación editorial de Julian Camilo.
                </p>
              </div>

              <button
                onClick={() => setEditorOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>

            {articleError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">
                {articleError}
              </div>
            )}

            <div className="space-y-4">
              {/* Format & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                    Línea Editorial / Categoría *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                    Formato de Publicación (11 Formatos) *
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ArticleFormat)}
                    className="w-full p-2.5 text-xs font-semibold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  >
                    <option value="opinion">Opinión (Columna y debate crítico)</option>
                    <option value="noticia">Noticia (Hecho de actualidad)</option>
                    <option value="reportaje">Reportaje (Investigación)</option>
                    <option value="entrevista">Entrevista (Diálogo y preguntas)</option>
                    <option value="analisis">Análisis (Políticas y datos)</option>
                    <option value="columna">Columna (Reflexión periódica)</option>
                    <option value="comunicado">Comunicado (Declaración formal)</option>
                    <option value="multimedia">Multimedia (Video, audio y texto)</option>
                    <option value="galeria">Galería (Ensayo visual)</option>
                    <option value="video">Video Especial</option>
                    <option value="audio">Columna Sonora</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Título del Artículo *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título reflexivo o tesis principal..."
                  className="w-full p-3 text-lg font-serif font-bold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Subtítulo o Resumen Editorial
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Síntesis breve de tu análisis..."
                  className="w-full p-2.5 text-xs font-serif italic border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white resize-none"
                />
              </div>

              {/* Cover Image */}
              <div className="p-4 rounded-xl bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider font-sans">
                    Fotografía de Portada
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadTarget('article');
                      setUploaderOpen(true);
                    }}
                    className="text-xs text-gold-600 dark:text-gold-400 font-semibold hover:underline"
                  >
                    Subir fotografía desde tu equipo
                  </button>
                </div>

                {coverImageUrl && (
                  <div className="h-32 rounded-lg overflow-hidden border border-stone-200">
                    <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="O pega la URL de la imagen (https://...)"
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
                />
              </div>

              {/* Optional Multimedia (Video and Audio) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                    Video Opcional (YouTube / Vimeo)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                    Audio Opcional (MP3 / Podcast / Entrevista)
                  </label>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://ejemplo.com/audio.mp3"
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Cuerpo del Ensayo o Análisis *
                </label>
                <textarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe tu columna aquí... Separa los párrafos con un salto de línea."
                  className="w-full p-4 text-sm font-serif leading-relaxed border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white resize-y"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => handleSaveArticle('borrador')}
                disabled={savingArticle}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 transition-colors inline-flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Borrador</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveArticle('revision')}
                disabled={savingArticle}
                className="px-6 py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all shadow-md inline-flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingArticle ? 'Enviando...' : 'Enviar para Aprobación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         AD PROPOSAL MODAL
         ========================================================================= */}
      {adModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-xl font-serif font-black text-stone-900 dark:text-white">
                  {editingAd ? 'Editar Propuesta Publicitaria' : 'Nueva Propuesta Publicitaria'}
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Sujeto a revisión y asignación de pauta por Julian Camilo.
                </p>
              </div>

              <button
                onClick={() => setAdModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>

            {adError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">
                {adError}
              </div>
            )}

            <form onSubmit={handleSaveAd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Nombre de tu Negocio / Proyecto *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Café Cultural de los Andes"
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Titular del Anuncio *
                </label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ej. Suscríbete a nuestro boletín de literatura..."
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Texto Publicitario
                </label>
                <textarea
                  rows={3}
                  value={bodyCopy}
                  onChange={(e) => setBodyCopy(e.target.value)}
                  placeholder="Describe la propuesta de valor de tu marca..."
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Enlace Web de Destino (URL) *
                </label>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://tutienda.com"
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              {/* Banner image */}
              <div className="p-3.5 rounded-xl bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider font-sans">
                    Creativo / Banner
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadTarget('ad');
                      setUploaderOpen(true);
                    }}
                    className="text-xs text-gold-600 dark:text-gold-400 font-semibold hover:underline"
                  >
                    Cargar imagen
                  </button>
                </div>
                {bannerUrl && (
                  <div className="h-24 rounded-lg overflow-hidden border border-stone-200">
                    <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="O URL directa de imagen"
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
                />
              </div>

              {/* Placement preference */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Espacio Solicitado
                </label>
                <select
                  value={requestedPlacement}
                  onChange={(e) => setRequestedPlacement(e.target.value as AdPlacement)}
                  className="w-full p-2.5 text-xs font-semibold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  <option value="sidebar">Barra Lateral (Desktop)</option>
                  <option value="article_banner">Dentro de Artículos</option>
                  <option value="feed_sponsor">Feed Principal de Publicaciones</option>
                  <option value="footer">Pie de Página</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingAd}
                className="w-full py-3 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 pt-3"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingAd ? 'Enviando...' : 'Enviar Anuncio para Revisión'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Photo Uploader Modal */}
      <PhotoUploaderModal
        isOpen={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        onUploadSuccess={(items) => {
          if (items.length > 0) {
            if (uploadTarget === 'article') {
              setCoverImageUrl(items[0].url);
            } else {
              setBannerUrl(items[0].url);
            }
            setUploaderOpen(false);
          }
        }}
        folder={uploadTarget === 'article' ? 'articles' : 'ads'}
        allowMultiple={false}
        title={uploadTarget === 'article' ? 'Subir Portada de Artículo' : 'Subir Creativo de Anuncio'}
        subtitle="Optimización WebP y compresión inteligente en CDN."
      />
    </div>
  );
};
