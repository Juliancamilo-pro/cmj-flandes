import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Megaphone, 
  Search, 
  Filter, 
  Calendar, 
  ExternalLink, 
  Edit3, 
  Send, 
  Eye, 
  ShieldCheck, 
  PauseCircle, 
  PlayCircle,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  X,
  CreditCard,
  Printer,
  Tag,
  Check,
  Ban,
  Receipt
} from 'lucide-react';
import { 
  SubscriberUser, 
  Article, 
  AdProposal, 
  AdPlacement,
  AdProposalStatus,
  ArticleStatus,
  SubscriptionStatus,
  SubscriptionPlan,
  SubscriptionPlanPeriod,
  SubscriptionPaymentRecord
} from '../../types';
import { 
  getSubscribers, 
  updateSubscriber, 
  getArticles, 
  updateArticle, 
  getAdProposals, 
  updateAdProposal,
  deleteAdProposal,
  getSubscriptionPlans,
  saveSubscriptionPlan,
  deleteSubscriptionPlan,
  toggleSubscriptionPlanStatus,
  getSubscriptionPayments,
  updateSubscriptionPaymentStatus
} from '../../services/db';

export const AdminSubscriptions: React.FC = () => {
  // Main Data States
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberUser[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<AdProposal[]>([]);
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers' | 'payments' | 'articles' | 'ads'>('plans');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Plan Edit / Create Modal State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planSlug, setPlanSlug] = useState('');
  const [planTagline, setPlanTagline] = useState('');
  const [planPriceCOP, setPlanPriceCOP] = useState<number>(20000);
  const [planOriginalPriceCOP, setPlanOriginalPriceCOP] = useState<number | undefined>(undefined);
  const [planDurationDays, setPlanDurationDays] = useState<number>(30);
  const [planPeriod, setPlanPeriod] = useState<SubscriptionPlanPeriod>('mensual');
  const [planDescription, setPlanDescription] = useState('');
  const [planArticleLimit, setPlanArticleLimit] = useState<number>(999);
  const [planAdProposalsLimit, setPlanAdProposalsLimit] = useState<number>(3);
  const [planBenefits, setPlanBenefits] = useState<string[]>([]);
  const [newBenefitInput, setNewBenefitInput] = useState('');
  const [planIsActive, setPlanIsActive] = useState(true);
  const [planIsPopular, setPlanIsPopular] = useState(false);
  const [planBadge, setPlanBadge] = useState('');
  const [planOrder, setPlanOrder] = useState(1);
  const [planAdProposalsWeeklyLimit, setPlanAdProposalsWeeklyLimit] = useState<number>(0);
  const [savingPlan, setSavingPlan] = useState(false);

  // Article Review Modal State
  const [reviewingArticle, setReviewingArticle] = useState<Article | null>(null);
  const [articleNotes, setArticleNotes] = useState('');
  const [submittingArticleReview, setSubmittingArticleReview] = useState(false);

  // Ad Review Modal State
  const [reviewingAd, setReviewingAd] = useState<AdProposal | null>(null);
  const [adNotes, setAdNotes] = useState('');
  const [activePlacement, setActivePlacement] = useState<AdPlacement>('sidebar');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [submittingAdReview, setSubmittingAdReview] = useState(false);

  // Receipt Modal State
  const [viewingPaymentReceipt, setViewingPaymentReceipt] = useState<SubscriptionPaymentRecord | null>(null);

  // Safe confirmation modal states (no window.confirm)
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);
  const [subscriberToCancel, setSubscriberToCancel] = useState<SubscriberUser | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Feedback toast
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getSubscriptionPlans({ includeInactive: true }),
        getSubscribers(),
        getArticles({ includeAllStatus: true }),
        getAdProposals(),
        getSubscriptionPayments()
      ]);

      if (results[0].status === 'fulfilled') {
        setPlans(results[0].value);
      }
      if (results[1].status === 'fulfilled') {
        setSubscribers(results[1].value);
      }
      if (results[2].status === 'fulfilled') {
        setArticles(results[2].value.filter((a) => a.authorRole === 'subscriber'));
      }
      if (results[3].status === 'fulfilled') {
        setAds(results[3].value);
      }
      if (results[4].status === 'fulfilled') {
        setPayments(results[4].value);
      }
    } catch (e) {
      console.error('Error loading admin subscriptions data:', e);
      showError('Ocurrió un problema cargando datos de suscripciones.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  /* =========================================================================
     1. PLAN MANAGEMENT HANDLERS
     ========================================================================= */
  const handleOpenNewPlan = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanSlug('');
    setPlanTagline('');
    setPlanPriceCOP(20000);
    setPlanOriginalPriceCOP(undefined);
    setPlanDurationDays(30);
    setPlanPeriod('mensual');
    setPlanDescription('');
    setPlanArticleLimit(999);
    setPlanAdProposalsLimit(3);
    setPlanBenefits([
      'Envíos ilimitados de artículos a revisión editorial',
      'Acceso al editor enriquecido multimedia',
      'Insignia de autor suscriptor en tus publicaciones'
    ]);
    setNewBenefitInput('');
    setPlanIsActive(true);
    setPlanIsPopular(false);
    setPlanBadge('');
    setPlanOrder(plans.length + 1);
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanSlug(plan.slug || '');
    setPlanTagline(plan.tagline || '');
    setPlanPriceCOP(plan.priceCOP);
    setPlanOriginalPriceCOP(plan.originalPriceCOP);
    setPlanDurationDays(plan.durationDays);
    setPlanPeriod(plan.period);
    setPlanDescription(plan.description);
    setPlanArticleLimit(plan.articleLimit ?? 999);
    setPlanAdProposalsLimit(plan.adProposalsLimit ?? 0);
    setPlanAdProposalsWeeklyLimit(plan.adProposalsWeeklyLimit ?? (plan.period === 'anual' ? 1 : 0));
    setPlanBenefits(plan.benefits || []);
    setNewBenefitInput('');
    setPlanIsActive(plan.isActive);
    setPlanIsPopular(plan.isPopular || false);
    setPlanBadge(plan.badge || '');
    setPlanOrder(plan.order || 1);
    setPlanModalOpen(true);
  };

  const handleAddBenefit = () => {
    if (!newBenefitInput.trim()) return;
    setPlanBenefits([...planBenefits, newBenefitInput.trim()]);
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    setPlanBenefits(planBenefits.filter((_, i) => i !== index));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      showError('El nombre del plan es obligatorio.');
      return;
    }
    if (planPriceCOP < 0) {
      showError('El precio debe ser mayor o igual a 0.');
      return;
    }

    const cleanSlug = planSlug.trim() || planName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const parsedOrig = planOriginalPriceCOP ? Number(planOriginalPriceCOP) : undefined;
    const discount = (parsedOrig && parsedOrig > planPriceCOP)
      ? Math.round(((parsedOrig - planPriceCOP) / parsedOrig) * 100)
      : undefined;

    setSavingPlan(true);
    try {
      const planPayload = {
        name: planName.trim(),
        slug: cleanSlug,
        tagline: planTagline.trim(),
        priceCOP: Number(planPriceCOP),
        originalPriceCOP: parsedOrig,
        discountPercentage: discount,
        durationDays: Number(planDurationDays),
        period: planPeriod,
        description: planDescription.trim(),
        articleLimit: Number(planArticleLimit),
        adProposalsLimit: Number(planAdProposalsLimit),
        adProposalsWeeklyLimit: Number(planAdProposalsWeeklyLimit),
        benefits: planBenefits,
        isActive: planIsActive,
        isPopular: planIsPopular,
        badge: planBadge.trim() || undefined,
        order: Number(planOrder)
      };

      const savedId = await saveSubscriptionPlan(planPayload, editingPlanId || undefined);

      // Instant optimistic UI update
      setPlans((prev) => {
        const idx = prev.findIndex((p) => p.id === (editingPlanId || savedId));
        const updatedItem = {
          id: editingPlanId || savedId,
          ...planPayload,
          createdAt: idx >= 0 ? prev[idx].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = updatedItem;
          return clone.sort((a, b) => a.order - b.order);
        } else {
          return [...prev, updatedItem].sort((a, b) => a.order - b.order);
        }
      });

      showSuccess(editingPlanId ? 'Plan actualizado exitosamente.' : 'Nuevo plan creado exitosamente.');
      setPlanModalOpen(false);
    } catch (err: any) {
      console.error('Error saving plan:', err);
      showError(err.message || 'Error al guardar el plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    const { id, name } = planToDelete;
    setDeletingPlanId(id);
    try {
      await deleteSubscriptionPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      showSuccess(`Plan "${name}" eliminado correctamente.`);
      setPlanToDelete(null);
    } catch (e) {
      console.error('Error deleting plan:', e);
      showError('No se pudo eliminar el plan.');
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleTogglePlan = async (id: string, currentActive: boolean) => {
    // Instant optimistic toggle
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p)));
    try {
      await toggleSubscriptionPlanStatus(id, !currentActive);
      showSuccess(`Plan ${!currentActive ? 'activado' : 'desactivado'} para el público.`);
    } catch (e) {
      // Revert if error
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: currentActive } : p)));
      showError('Error al actualizar estado del plan.');
    }
  };

  /* =========================================================================
     2. SUBSCRIBER MANAGEMENT HANDLERS
     ========================================================================= */
  const handleToggleSubscriberStatus = async (sub: SubscriberUser) => {
    const nextStatus: SubscriptionStatus = sub.status === 'activa' ? 'suspendida' : 'activa';
    setSubscribers((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: nextStatus } : s)));
    try {
      await updateSubscriber(sub.id, { status: nextStatus });
      showSuccess(`Suscripción de ${sub.fullName} cambiada a: ${nextStatus}`);
    } catch (e) {
      setSubscribers((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: sub.status } : s)));
      showError('Error actualizando suscriptor.');
    }
  };

  const handleExtendSubscriber = async (sub: SubscriberUser, days = 30) => {
    try {
      const currentEnd = new Date(sub.endDate);
      const nextEnd = new Date(Math.max(currentEnd.getTime(), Date.now()));
      nextEnd.setDate(nextEnd.getDate() + days);

      await updateSubscriber(sub.id, {
        endDate: nextEnd.toISOString(),
        status: 'activa'
      });
      setSubscribers((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, endDate: nextEnd.toISOString(), status: 'activa' } : s))
      );
      showSuccess(`Suscripción extendida ${days} días para ${sub.fullName}.`);
    } catch (e) {
      showError('Error extendiendo suscripción.');
    }
  };

  const confirmCancelSubscriber = async () => {
    if (!subscriberToCancel) return;
    const sub = subscriberToCancel;
    try {
      await updateSubscriber(sub.id, { status: 'cancelada', autoRenew: false });
      setSubscribers((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'cancelada', autoRenew: false } : s))
      );
      showSuccess(`Suscripción de ${sub.fullName} cancelada.`);
      setSubscriberToCancel(null);
    } catch (e) {
      showError('Error cancelando suscripción.');
    }
  };

  /* =========================================================================
     3. PAYMENT STATUS HANDLERS
     ========================================================================= */
  const handleRefundPayment = async (payment: SubscriptionPaymentRecord) => {
    const reason = prompt('Indica el motivo del reembolso:', 'Solicitud del suscriptor / Error de pago');
    if (!reason) return;

    try {
      await updateSubscriptionPaymentStatus(payment.id, 'reembolsado', reason);
      showSuccess('Pago marcado como reembolsado.');
      await loadAll();
    } catch (e) {
      showError('Error al registrar reembolso.');
    }
  };

  /* =========================================================================
     4. ARTICLE EDITORIAL REVIEW HANDLERS
     ========================================================================= */
  const handleOpenArticleReview = (art: Article) => {
    setReviewingArticle(art);
    setArticleNotes(art.reviewNotes || '');
  };

  const handleResolveArticleReview = async (decision: 'aprobado' | 'cambios' | 'rechazado') => {
    if (!reviewingArticle) return;
    setSubmittingArticleReview(true);

    try {
      const payload: Partial<Article> = {
        status: decision === 'aprobado' ? 'published' : decision,
        reviewNotes: articleNotes.trim() || undefined,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Julian Camilo'
      };

      if (decision === 'aprobado') {
        payload.publishedAt = new Date().toISOString();
      }

      await updateArticle(reviewingArticle.id, payload);
      showSuccess(
        decision === 'aprobado'
          ? `Artículo "${reviewingArticle.title}" aprobado y publicado oficialmente.`
          : decision === 'cambios'
          ? `Observaciones enviadas al autor para corrección.`
          : `Artículo rechazado.`
      );
      setReviewingArticle(null);
      await loadAll();
    } catch (e) {
      showError('Error al guardar la revisión editorial.');
    } finally {
      setSubmittingArticleReview(false);
    }
  };

  /* =========================================================================
     5. AD PROPOSAL REVIEW HANDLERS
     ========================================================================= */
  const handleOpenAdReview = (ad: AdProposal) => {
    setReviewingAd(ad);
    setAdNotes(ad.editorNotes || '');
    setActivePlacement(ad.activePlacement || ad.requestedPlacement || 'sidebar');
    setScheduledStart(ad.scheduledStart || new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setScheduledEnd(ad.scheduledEnd || d.toISOString().split('T')[0]);
  };

  const handleResolveAdReview = async (decision: 'aprobado' | 'cambios' | 'rechazado') => {
    if (!reviewingAd) return;
    setSubmittingAdReview(true);

    try {
      const payload: Partial<AdProposal> = {
        status: decision,
        editorNotes: adNotes.trim() || undefined,
        activePlacement: decision === 'aprobado' ? activePlacement : undefined,
        scheduledStart: decision === 'aprobado' ? scheduledStart : undefined,
        scheduledEnd: decision === 'aprobado' ? scheduledEnd : undefined,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Julian Camilo'
      };

      await updateAdProposal(reviewingAd.id, payload);
      showSuccess(
        decision === 'aprobado'
          ? `Pauta publicitaria aprobada y programada en ${activePlacement}.`
          : decision === 'cambios'
          ? `Observaciones enviadas al suscriptor.`
          : `Propuesta de pauta rechazada.`
      );
      setReviewingAd(null);
      await loadAll();
    } catch (e) {
      showError('Error al revisar propuesta publicitaria.');
    } finally {
      setSubmittingAdReview(false);
    }
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((s) => {
    if (planFilter !== 'all' && s.planId !== planFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.lastPaymentRef && s.lastPaymentRef.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e5dc] dark:border-stone-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="font-serif font-bold text-2xl text-[#121212] dark:text-[#f3ede2]">
              Administrar Suscripciones Premium
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gold-100 dark:bg-stone-800 text-gold-900 dark:text-gold-300 text-xs font-bold font-sans">
              Control Editorial Total
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            Configuración dinámica de planes, tarifas, límites de publicación, usuarios activos, pagos y aprobación estricta de contenidos.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadAll}
            className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'plans' && (
            <button
              type="button"
              onClick={handleOpenNewPlan}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 dark:hover:bg-gold-400 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          <span>1. Planes & Tarifas ({plans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscribers')}
          className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
            activeTab === 'subscribers'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-500" />
          <span>2. Suscriptores Registrados ({subscribers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
          <span>3. Historial de Pagos ({payments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('articles')}
          className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
            activeTab === 'articles'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          <span>4. Artículos a Revisar ({articles.filter((a) => a.status === 'revision' || a.status === 'borrador').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
            activeTab === 'ads'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-purple-500" />
          <span>5. Pauta Publicitaria ({ads.length})</span>
        </button>
      </div>

      {/* =========================================================================
         TAB 1: PLANES & TARIFAS (Configuración Dinámica)
         ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`bg-white dark:bg-[#18181c] rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-xs relative ${
                  p.isActive
                    ? 'border-gold-300/80 dark:border-stone-700'
                    : 'border-stone-200 dark:border-stone-800 opacity-60'
                }`}
              >
                {/* Header with badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                      ORDEN #{p.order}
                    </span>
                    {p.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-gold-100 text-gold-900 text-[10px] font-bold">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-black text-xl text-stone-900 dark:text-white">
                    {p.name}
                  </h3>

                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans line-clamp-2">
                    {p.tagline || p.description}
                  </p>

                  <div className="pt-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
                        ${p.priceCOP.toLocaleString('es-CO')}
                      </span>
                      <span className="text-xs text-stone-500 font-sans">
                        COP / {p.period === 'pago_unico' ? 'pago único' : p.period}
                      </span>
                    </div>

                    {p.originalPriceCOP && (
                      <div className="flex items-center space-x-1.5 text-xs text-stone-400">
                        <span className="line-through">
                          ${p.originalPriceCOP.toLocaleString('es-CO')} COP
                        </span>
                        {p.discountPercentage && (
                          <span className="text-rose-600 font-bold">
                            (-{p.discountPercentage}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quotas */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1 text-xs font-sans">
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Límite artículos:</span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {p.articleLimit === 999 || p.articleLimit === 0 ? 'Ilimitados' : `${p.articleLimit} artículo`}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Vigencia:</span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {p.durationDays} días
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Propuestas de pauta:</span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {p.adProposalsLimit === 0 ? 'Ninguna' : `${p.adProposalsLimit} anuncios`}
                      </span>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Beneficios incluidos:
                    </span>
                    <ul className="space-y-1 text-[11px] font-sans text-stone-600 dark:text-stone-300">
                      {p.benefits?.slice(0, 3).map((b, i) => (
                        <li key={i} className="flex items-start space-x-1">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{b}</span>
                        </li>
                      ))}
                      {p.benefits && p.benefits.length > 3 && (
                        <li className="text-[10px] text-stone-400 italic">
                          +{p.benefits.length - 3} beneficios más
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePlan(p.id, p.isActive)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      p.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {p.isActive ? 'Activo' : 'Pausado'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPlan(p)}
                      className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                      title="Editar plan y tarifas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanToDelete({ id: p.id, name: p.name })}
                      className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Eliminar plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 2: USUARIOS SUSCRITOS
         ========================================================================= */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o referencia..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="p-2 text-xs border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-[#18181c] text-stone-900 dark:text-white"
              >
                <option value="all">Todos los planes</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-xs border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-[#18181c] text-stone-900 dark:text-white"
              >
                <option value="all">Todos los estados</option>
                <option value="activa">Activa</option>
                <option value="vencida">Vencida</option>
                <option value="suspendida">Suspendida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#faf9f6] dark:bg-[#141416] border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="p-4">Suscriptor</th>
                    <th className="p-4">Plan & Valor</th>
                    <th className="p-4">Vigencia & Vencimiento</th>
                    <th className="p-4">Cuota de Artículos</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-stone-400">
                        No hay suscriptores que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub) => {
                      const isExpired = new Date(sub.endDate) < new Date();
                      return (
                        <tr key={sub.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                          <td className="p-4 space-y-0.5">
                            <div className="font-bold text-stone-900 dark:text-white text-sm">
                              {sub.fullName}
                            </div>
                            <div className="text-stone-400">{sub.email}</div>
                            {sub.phone && <div className="text-[11px] text-stone-400">{sub.phone}</div>}
                          </td>
                          <td className="p-4 space-y-0.5">
                            <span className="font-semibold text-stone-900 dark:text-white">
                              {sub.planName}
                            </span>
                            <div className="text-emerald-600 font-bold">
                              ${sub.amountCOP.toLocaleString('es-CO')} COP
                            </div>
                            <div className="text-[10px] text-stone-400 uppercase font-mono">
                              Ref: {sub.lastPaymentRef || 'N/A'}
                            </div>
                          </td>
                          <td className="p-4 space-y-0.5">
                            <div className="text-stone-700 dark:text-stone-300">
                              Vence: {new Date(sub.endDate).toLocaleDateString('es-CO')}
                            </div>
                            <div className="text-[11px] text-stone-400">
                              Inicio: {new Date(sub.startDate).toLocaleDateString('es-CO')}
                            </div>
                          </td>
                          <td className="p-4 space-y-1">
                            <div className="font-bold text-stone-800 dark:text-stone-200">
                              {sub.articlesSubmittedCount || 0} / {sub.articlesAllowed >= 999 ? 'Ilimitados' : sub.articlesAllowed}
                            </div>
                            <div className="w-24 bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gold-500 h-full"
                                style={{
                                  width: `${Math.min(100, ((sub.articlesSubmittedCount || 0) / (sub.articlesAllowed || 1)) * 100)}%`
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                sub.status === 'activa' && !isExpired
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.status === 'suspendida'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isExpired && sub.status === 'activa' ? 'Vencida' : sub.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => handleToggleSubscriberStatus(sub)}
                              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                              title={sub.status === 'activa' ? 'Suspender suscripción' : 'Reactivar suscripción'}
                            >
                              {sub.status === 'activa' ? <PauseCircle className="w-3.5 h-3.5 text-amber-600" /> : <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendSubscriber(sub, 30)}
                              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 text-xs font-semibold"
                              title="Extender 30 días"
                            >
                              +30d
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubscriberToCancel(sub)}
                              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Cancelar suscripción"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 3: HISTORIAL DE PAGOS & COMPROBANTES
         ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#faf9f6] dark:bg-[#141416] border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="p-4">Comprobante #</th>
                    <th className="p-4">Suscriptor</th>
                    <th className="p-4">Plan & Valor</th>
                    <th className="p-4">Método de Pago</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-stone-400">
                        Aún no se han registrado pagos de suscripción.
                      </td>
                    </tr>
                  ) : (
                    payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-stone-900 dark:text-white">
                          {pay.receiptNumber}
                          <div className="text-[10px] text-stone-400 font-normal">
                            Ref: {pay.reference}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-stone-900 dark:text-white">
                            {pay.subscriberName}
                          </div>
                          <div className="text-stone-400">{pay.subscriberEmail}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-stone-900 dark:text-white">
                            {pay.planName}
                          </div>
                          <div className="text-emerald-600 font-bold">
                            ${pay.amountCOP.toLocaleString('es-CO')} COP
                          </div>
                        </td>
                        <td className="p-4 uppercase text-[11px] font-mono text-stone-600 dark:text-stone-300">
                          {pay.paymentMethod}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              pay.status === 'aprobado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pay.status === 'reembolsado'
                                ? 'bg-purple-100 text-purple-800'
                                : pay.status === 'rechazado'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pay.status}
                          </span>
                        </td>
                        <td className="p-4 text-stone-500">
                          {new Date(pay.createdAt).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => setViewingPaymentReceipt(pay)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100"
                            title="Ver e imprimir comprobante oficial"
                          >
                            <Receipt className="w-3.5 h-3.5 text-gold-600" />
                          </button>
                          {pay.status === 'aprobado' && (
                            <button
                              type="button"
                              onClick={() => handleRefundPayment(pay)}
                              className="px-2 py-1 rounded-lg border border-rose-200 text-rose-700 text-[10px] font-semibold hover:bg-rose-50"
                              title="Marcar reembolso"
                            >
                              Reembolsar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 4: ARTÍCULOS DE SUSCRIPTORES (Aprobación Obligatoria)
         ========================================================================= */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
            {articles.length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs">
                No hay artículos enviados por suscriptores actualmente.
              </div>
            ) : (
              articles.map((art) => (
                <div key={art.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-900 text-[10px] font-bold uppercase tracking-wider">
                        {art.categoryName}
                      </span>
                      <span className="text-xs text-stone-400">
                        Por {art.authorName} ({art.authorEmail})
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        art.status === 'published' || art.status === 'publicado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : art.status === 'revision'
                          ? 'bg-amber-100 text-amber-800'
                          : art.status === 'cambios'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {art.status}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                      {art.title}
                    </h4>

                    {art.subtitle && (
                      <p className="text-xs font-serif italic text-stone-500 line-clamp-1">
                        {art.subtitle}
                      </p>
                    )}

                    {art.reviewNotes && (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200">
                        <strong>Tus notas editoriales:</strong> {art.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenArticleReview(art)}
                      className="px-4 py-2 rounded-xl bg-[#121212] text-white text-xs font-bold hover:bg-gold-600 transition-colors"
                    >
                      Revisar & Aprobar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 5: PROPUESTAS DE PAUTA PUBLICITARIA
         ========================================================================= */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
            {ads.length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs">
                No hay propuestas publicitarias pendientes.
              </div>
            ) : (
              ads.map((ad) => (
                <div key={ad.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-stone-900 dark:text-white">
                        {ad.businessName}
                      </span>
                      <span className="text-stone-400">• {ad.subscriberEmail}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ad.status === 'aprobado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ad.status}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                      {ad.headline}
                    </h4>

                    <p className="text-xs text-stone-500 font-sans line-clamp-1">
                      {ad.bodyCopy}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAdReview(ad)}
                    className="px-4 py-2 rounded-xl bg-[#121212] text-white text-xs font-bold hover:bg-gold-600 transition-colors"
                  >
                    Evaluar Pauta
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 1: PLAN CREATION & EDITION
         ========================================================================= */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white">
                {editingPlanId ? 'Editar Plan de Suscripción' : 'Crear Nuevo Plan de Suscripción'}
              </h3>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plan Name */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Nombre del Plan *
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Ej. Plan Semanal"
                    className="w-full p-2.5 text-xs font-semibold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Identificador (Slug)
                  </label>
                  <input
                    type="text"
                    value={planSlug}
                    onChange={(e) => setPlanSlug(e.target.value)}
                    placeholder="Ej. semanal, mensual"
                    className="w-full p-2.5 text-xs font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Price COP */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Precio ($ COP) *
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={planPriceCOP}
                    onChange={(e) => setPlanPriceCOP(Number(e.target.value))}
                    className="w-full p-2.5 text-xs font-bold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Original Price COP (Discount Strike-through) */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Precio Original sin Descuento (Opcional)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={planOriginalPriceCOP || ''}
                    onChange={(e) => setPlanOriginalPriceCOP(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ej. 600000 para Plan Anual"
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Period */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Periodicidad *
                  </label>
                  <select
                    value={planPeriod}
                    onChange={(e) => setPlanPeriod(e.target.value as any)}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  >
                    <option value="pago_unico">Pago único (Por artículo)</option>
                    <option value="semanal">Semanal (7 días)</option>
                    <option value="mensual">Mensual (30 días)</option>
                    <option value="anual">Anual (365 días)</option>
                  </select>
                </div>

                {/* Duration Days */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Vigencia en Días *
                  </label>
                  <input
                    type="number"
                    value={planDurationDays}
                    onChange={(e) => setPlanDurationDays(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                </div>

                {/* Article Limit */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Límite de Envíos de Artículos (999 = Ilimitados) *
                  </label>
                  <input
                    type="number"
                    value={planArticleLimit}
                    onChange={(e) => setPlanArticleLimit(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                </div>

                {/* Ad Proposals Limit */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Límite Total de Propuestas Publicitarias *
                  </label>
                  <input
                    type="number"
                    value={planAdProposalsLimit}
                    onChange={(e) => setPlanAdProposalsLimit(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                </div>

                {/* Weekly Ad Proposals Limit (e.g. 1 per 7 days for Annual Plan) */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Límite Semanal de Publicidad (cada 7 días, 0 = sin límite semanal)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planAdProposalsWeeklyLimit}
                    onChange={(e) => setPlanAdProposalsWeeklyLimit(Number(e.target.value))}
                    placeholder="Ej. 1 para Plan Anual"
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                </div>

                {/* Tagline */}
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Lema o Frase Destacada del Plan
                  </label>
                  <input
                    type="text"
                    value={planTagline}
                    onChange={(e) => setPlanTagline(e.target.value)}
                    placeholder="Ej. Publicación de 1 artículo a revisión editorial"
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Descripción Detallada
                  </label>
                  <textarea
                    rows={2}
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white resize-none"
                  />
                </div>

                {/* Badge text */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Distintivo o Insignia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={planBadge}
                    onChange={(e) => setPlanBadge(e.target.value)}
                    placeholder="Ej. Más Popular, Ahorra 83%"
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={planOrder}
                    onChange={(e) => setPlanOrder(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Benefits Checklist Builder */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <label className="block font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  Lista de Beneficios del Plan
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    placeholder="Escribe un beneficio y presiona agregar..."
                    className="flex-1 p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-3 py-2 rounded-xl bg-[#121212] text-white text-xs font-bold hover:bg-gold-600"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {planBenefits.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-xs text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center space-x-6 pt-3 border-t border-stone-100 dark:border-stone-800">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planIsActive}
                    onChange={(e) => setPlanIsActive(e.target.checked)}
                    className="w-4 h-4 text-gold-600 rounded"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">Plan activo y disponible al público</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planIsPopular}
                    onChange={(e) => setPlanIsPopular(e.target.checked)}
                    className="w-4 h-4 text-gold-600 rounded"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">Destacar como más popular</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2 rounded-xl bg-[#121212] text-white text-xs font-bold hover:bg-gold-600 disabled:opacity-50"
                >
                  {savingPlan ? 'Guardando...' : 'Guardar Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 2: EDITORIAL ARTICLE APPROVAL MODAL
         ========================================================================= */}
      {reviewingArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600">
                  Aprobación Editorial Obligatoria
                </span>
                <h3 className="font-serif font-black text-2xl text-stone-900 dark:text-white">
                  {reviewingArticle.title}
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Autor: {reviewingArticle.authorName} ({reviewingArticle.authorEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingArticle(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Article Content Preview */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#202024] max-h-72 overflow-y-auto border border-stone-200 dark:border-stone-700">
              {reviewingArticle.subtitle && (
                <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300">
                  {reviewingArticle.subtitle}
                </p>
              )}
              <div className="text-xs font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line">
                {reviewingArticle.content}
              </div>
            </div>

            {/* Review Notes Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
                Observaciones Editoriales de Julian Camilo (Visibles para el autor)
              </label>
              <textarea
                rows={3}
                value={articleNotes}
                onChange={(e) => setArticleNotes(e.target.value)}
                placeholder="Escribe comentarios de retroalimentación, cambios necesarios o felicitación..."
                className="w-full p-3 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-sans"
              />
            </div>

            {/* Decision Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                disabled={submittingArticleReview}
                onClick={() => handleResolveArticleReview('rechazado')}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 disabled:opacity-50"
              >
                Rechazar Artículo
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={submittingArticleReview}
                  onClick={() => handleResolveArticleReview('cambios')}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 disabled:opacity-50"
                >
                  Solicitar Modificaciones
                </button>
                <button
                  type="button"
                  disabled={submittingArticleReview}
                  onClick={() => handleResolveArticleReview('aprobado')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-xs"
                >
                  Aprobar & Publicar Oficialmente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 3: AD PROPOSAL REVIEW
         ========================================================================= */}
      {reviewingAd && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  Revisión de Propuesta Publicitaria
                </span>
                <h3 className="font-serif font-black text-xl text-stone-900 dark:text-white">
                  {reviewingAd.headline}
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Marca: {reviewingAd.businessName} ({reviewingAd.subscriberEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingAd(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <p className="text-stone-700 dark:text-stone-300">
                {reviewingAd.bodyCopy}
              </p>
              {reviewingAd.targetUrl && (
                <a
                  href={reviewingAd.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-600 flex items-center space-x-1 hover:underline"
                >
                  <span>{reviewingAd.targetUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Ubicación Autorizada
                </label>
                <select
                  value={activePlacement}
                  onChange={(e) => setActivePlacement(e.target.value as any)}
                  className="w-full p-2 border border-stone-200 rounded-xl bg-[#faf9f6] dark:bg-[#202024]"
                >
                  <option value="sidebar">Barra lateral (Sidebar)</option>
                  <option value="article_banner">Banner en artículos</option>
                  <option value="feed_sponsor">Destacado en feed</option>
                  <option value="footer">Pie de página</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Fecha de Inicio y Fin
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl text-xs"
                  />
                  <input
                    type="date"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Observaciones para el anunciante
              </label>
              <textarea
                rows={2}
                value={adNotes}
                onChange={(e) => setAdNotes(e.target.value)}
                className="w-full p-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            {/* Decision */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => handleResolveAdReview('rechazado')}
                className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100"
              >
                Rechazar Pauta
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleResolveAdReview('cambios')}
                  className="px-4 py-2 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100"
                >
                  Solicitar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveAdReview('aprobado')}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  Aprobar Anuncio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 4: OFFICIAL PAYMENT RECEIPT
         ========================================================================= */}
      {viewingPaymentReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-700">
                  Comprobante Digital Oficial
                </span>
                <h3 className="font-serif font-black text-xl text-stone-900">
                  {viewingPaymentReceipt.receiptNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPaymentReceipt(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Suscriptor:</span>
                <span className="font-bold">{viewingPaymentReceipt.subscriberName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Correo Electrónico:</span>
                <span className="font-mono">{viewingPaymentReceipt.subscriberEmail}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Plan Contratado:</span>
                <span className="font-bold text-gold-700">{viewingPaymentReceipt.planName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Monto Abonado:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  ${viewingPaymentReceipt.amountCOP.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Referencia Bancaria:</span>
                <span className="font-mono">{viewingPaymentReceipt.reference}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Método de Pago:</span>
                <span className="uppercase font-mono">{viewingPaymentReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Estado de Transacción:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                  {viewingPaymentReceipt.status}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-500">Fecha de Emisión:</span>
                <span>{new Date(viewingPaymentReceipt.createdAt).toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingPaymentReceipt(null)}
                className="px-4 py-2 rounded-xl bg-[#121212] text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Plan Deletion Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1c1c20] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                ¿Eliminar plan de suscripción?
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
              Estás a punto de eliminar permanentemente el plan <strong className="text-stone-900 dark:text-white">"{planToDelete.name}"</strong>. Los usuarios que ya lo tengan activo conservarán su vigencia hasta la fecha de expiración, pero ya no estará disponible para nuevas contrataciones.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingPlanId === planToDelete.id}
                onClick={confirmDeletePlan}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingPlanId === planToDelete.id ? 'Eliminando...' : 'Sí, eliminar plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Subscriber Cancel Modal */}
      {subscriberToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1c1c20] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-950/50">
                <Ban className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                ¿Cancelar suscripción de usuario?
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
              ¿Deseas cancelar la suscripción de <strong className="text-stone-900 dark:text-white">{subscriberToCancel.fullName}</strong> ({subscriberToCancel.email})? Su estado pasará a cancelada y se suspenderán sus privilegios editoriales.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSubscriberToCancel(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmCancelSubscriber}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
