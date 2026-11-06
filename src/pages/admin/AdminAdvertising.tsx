import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Check,
  X,
  Pause,
  Play,
  Trash2,
  Edit3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Upload,
  BarChart3,
  DollarSign,
  Eye,
  MousePointerClick,
  MessageSquare
} from 'lucide-react';
import {
  AdCtaType,
  AdFormatCategory,
  AdFormatType,
  AdLeadInquiry,
  AdPlacement,
  AdPricingConfig,
  AdProposal,
  AdProposalStatus
} from '../../types';
import {
  getAdProposals,
  createAdProposal,
  updateAdProposal,
  deleteAdProposal,
  getAdPricingConfig,
  saveAdPricingConfig,
  getAdLeadInquiries,
  uploadImageFile
} from '../../services/db';
import { validateImageFile } from '../../utils/security';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { AdSlotBanner } from '../../components/public/AdSlotBanner';

const ALL_AD_FORMATS: { id: AdFormatType; label: string; category: AdFormatCategory }[] = [
  { id: 'imagen_publicitaria', label: 'Imagen publicitaria', category: 'grafico' },
  { id: 'banner_horizontal', label: 'Banner horizontal', category: 'grafico' },
  { id: 'banner_vertical', label: 'Banner vertical', category: 'grafico' },
  { id: 'tarjeta_promocional', label: 'Tarjeta promocional', category: 'grafico' },
  { id: 'anuncio_cuadrado', label: 'Anuncio cuadrado', category: 'grafico' },
  { id: 'en_articulo', label: 'Anuncio dentro de artículos', category: 'grafico' },
  { id: 'video_publicitario', label: 'Vídeo publicitario', category: 'audiovisual' },
  { id: 'clip_promocional', label: 'Clip promocional', category: 'audiovisual' },
  { id: 'audio_opcional', label: 'Anuncio con audio opcional', category: 'audiovisual' },
  { id: 'anuncio_interactivo', label: 'Anuncio interactivo completo', category: 'interactivo' },
  { id: 'publicacion_patrocinada', label: 'Publicación patrocinada', category: 'especial' },
  { id: 'promocion_temporal', label: 'Promoción temporal (Temporizador)', category: 'especial' },
  { id: 'evento', label: 'Evento', category: 'especial' },
  { id: 'lanzamiento_producto', label: 'Lanzamiento de producto', category: 'especial' },
  { id: 'campana_institucional', label: 'Campaña institucional', category: 'especial' },
  { id: 'campana_comercial', label: 'Campaña comercial', category: 'especial' },
  { id: 'directorio_anunciantes', label: 'Directorio de anunciantes', category: 'especial' }
];

const CTA_OPTIONS: { id: AdCtaType; label: string }[] = [
  { id: 'conocer_mas', label: 'Conocer más' },
  { id: 'visitar_sitio', label: 'Visitar sitio web' },
  { id: 'ver_productos', label: 'Ver productos' },
  { id: 'solicitar_info', label: 'Solicitar información' },
  { id: 'contactar_anunciante', label: 'Contactar al anunciante' },
  { id: 'ver_promocion', label: 'Ver promoción' }
];

export const AdminAdvertising: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'placements' | 'stats' | 'leads'>('proposals');
  const [ads, setAds] = useState<AdProposal[]>([]);
  const [pricingConfigs, setPricingConfigs] = useState<AdPricingConfig[]>([]);
  const [leads, setLeads] = useState<AdLeadInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statsPeriod, setStatsPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit / Review Modal
  const [editingAd, setEditingAd] = useState<AdProposal | null>(null);
  const [editStatus, setEditStatus] = useState<AdProposalStatus>('pendiente');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'no_aplica' | 'pendiente' | 'pagado'>('no_aplica');
  const [editPlacement, setEditPlacement] = useState<AdPlacement>('banner_secundario');
  const [editFormat, setEditFormat] = useState<AdFormatType>('banner_horizontal');
  const [editCtaType, setEditCtaType] = useState<AdCtaType>('conocer_mas');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('08:00');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndTime, setEditEndTime] = useState('23:59');
  const [editDurationDays, setEditDurationDays] = useState<number>(30);
  const [editPriceCOP, setEditPriceCOP] = useState<number>(0);
  const [editBudgetCOP, setEditBudgetCOP] = useState<number>(0);
  const [editEditorNotes, setEditEditorNotes] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBodyCopy, setEditBodyCopy] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editVideoDuration, setEditVideoDuration] = useState<number>(15);
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editPromoCode, setEditPromoCode] = useState('');
  const [editExpandableDetails, setEditExpandableDetails] = useState('');
  const [savingAd, setSavingAd] = useState(false);

  // Delete confirmation
  const [adToDelete, setAdToDelete] = useState<AdProposal | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pricing save state
  const [savingPricing, setSavingPricing] = useState(false);

  // New custom placement state
  const [newPlacementId, setNewPlacementId] = useState('');
  const [newPlacementLabel, setNewPlacementLabel] = useState('');
  const [newPlacementLocation, setNewPlacementLocation] = useState('');
  const [newPlacementDimensions, setNewPlacementDimensions] = useState('1200x250 px');
  const [newPlacementPrice, setNewPlacementPrice] = useState(120000);
  const [newPlacementDays, setNewPlacementDays] = useState(30);

  // Owner Self-Service Ad Creation Modal
  const [showOwnerAdModal, setShowOwnerAdModal] = useState(false);
  const [ownerBusinessName, setOwnerBusinessName] = useState('');
  const [ownerHeadline, setOwnerHeadline] = useState('');
  const [ownerBodyCopy, setOwnerBodyCopy] = useState('');
  const [ownerFormat, setOwnerFormat] = useState<AdFormatType>('banner_horizontal');
  const [ownerCtaType, setOwnerCtaType] = useState<AdCtaType>('conocer_mas');
  const [ownerMediaType, setOwnerMediaType] = useState<'imagen' | 'video'>('imagen');
  const [ownerBannerUrl, setOwnerBannerUrl] = useState('');
  const [ownerVideoUrl, setOwnerVideoUrl] = useState('');
  const [ownerVideoDuration, setOwnerVideoDuration] = useState<number>(15);
  const [ownerTargetUrl, setOwnerTargetUrl] = useState('');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('');
  const [ownerPromoCode, setOwnerPromoCode] = useState('');
  const [ownerExpandableDetails, setOwnerExpandableDetails] = useState('');
  const [ownerPlacement, setOwnerPlacement] = useState<AdPlacement>('banner_principal');
  const [ownerDurationDays, setOwnerDurationDays] = useState<number>(30);
  const [ownerPriceCOP, setOwnerPriceCOP] = useState<number>(0);
  const [ownerBudgetCOP, setOwnerBudgetCOP] = useState<number>(0);
  const [ownerPaymentStatus, setOwnerPaymentStatus] = useState<'no_aplica' | 'pendiente' | 'pagado'>('no_aplica');
  const [ownerStartDate, setOwnerStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [ownerStartTime, setOwnerStartTime] = useState('08:00');
  const [ownerEndDate, setOwnerEndDate] = useState('');
  const [ownerEndTime, setOwnerEndTime] = useState('23:59');
  const [ownerStatus, setOwnerStatus] = useState<AdProposalStatus>('activo');
  const [uploadingOwnerImg, setUploadingOwnerImg] = useState(false);
  const [creatingOwnerAd, setCreatingOwnerAd] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allAds, configs, allLeads] = await Promise.all([
        getAdProposals(),
        getAdPricingConfig(),
        getAdLeadInquiries()
      ]);
      setAds(allAds);
      setPricingConfigs(configs);
      setLeads(allLeads);
    } catch {
      setErrorMsg('Error al cargar los datos de publicidad.');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (ad: AdProposal) => {
    setEditingAd(ad);
    setEditStatus(ad.status);
    setEditPaymentStatus(ad.paymentStatus || 'no_aplica');
    setEditPlacement(ad.activePlacement || ad.requestedPlacement || 'banner_secundario');
    setEditFormat(ad.adFormat || 'banner_horizontal');
    setEditCtaType(ad.ctaType || 'conocer_mas');
    setEditStartDate(ad.scheduledStart || '');
    setEditStartTime(ad.startTime || '08:00');
    setEditEndDate(ad.scheduledEnd || '');
    setEditEndTime(ad.endTime || '23:59');
    setEditDurationDays(ad.durationDays || 30);
    setEditPriceCOP(ad.priceCOP || 0);
    setEditBudgetCOP(ad.budgetCOP || ad.priceCOP || 0);
    setEditEditorNotes(ad.editorNotes || '');
    setEditHeadline(ad.headline || '');
    setEditBodyCopy(ad.bodyCopy || '');
    setEditBannerUrl(ad.bannerUrl || '');
    setEditVideoUrl(ad.videoUrl || '');
    setEditVideoDuration(ad.videoDurationSeconds || 15);
    setEditTargetUrl(ad.targetUrl || '');
    setEditWhatsapp(ad.whatsappNumber || '');
    setEditPromoCode(ad.promoCode || '');
    setEditExpandableDetails(ad.expandableDetails || '');
    setErrorMsg(null);
  };

  const handleSaveAdReview = async (overrideStatus?: AdProposalStatus) => {
    if (!editingAd) return;
    const finalStatus = overrideStatus || editStatus;
    setSavingAd(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateAdProposal(editingAd.id, {
        status: finalStatus,
        paymentStatus: editPaymentStatus,
        requestedPlacement: editPlacement,
        activePlacement: editPlacement,
        adFormat: editFormat,
        ctaType: editCtaType,
        scheduledStart: editStartDate || undefined,
        startTime: editStartTime || undefined,
        scheduledEnd: editEndDate || undefined,
        endTime: editEndTime || undefined,
        durationDays: Number(editDurationDays) || 30,
        priceCOP: Number(editPriceCOP) || 0,
        budgetCOP: Number(editBudgetCOP) || 0,
        editorNotes: editEditorNotes.trim() || undefined,
        headline: editHeadline.trim(),
        bodyCopy: editBodyCopy.trim(),
        bannerUrl: editBannerUrl.trim(),
        videoUrl: editVideoUrl.trim() || undefined,
        videoDurationSeconds: editVideoUrl.trim() ? Number(editVideoDuration) || 15 : undefined,
        targetUrl: editTargetUrl.trim() || undefined,
        whatsappNumber: editWhatsapp.trim() || undefined,
        promoCode: editPromoCode.trim().toUpperCase() || undefined,
        expandableDetails: editExpandableDetails.trim() || undefined,
        reviewedAt: new Date().toISOString()
      });
      setSuccessMsg(`Campaña "${editingAd.businessName}" actualizada a estado: ${finalStatus}.`);
      setEditingAd(null);
      await loadAll();
    } catch {
      setErrorMsg('No se pudo actualizar la campaña.');
    } finally {
      setSavingAd(false);
    }
  };

  const handleQuickStatusChange = async (ad: AdProposal, nextStatus: AdProposalStatus) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateAdProposal(ad.id, {
        status: nextStatus,
        reviewedAt: new Date().toISOString()
      });
      setSuccessMsg(`Estado de "${ad.businessName}" cambiado a ${nextStatus}.`);
      await loadAll();
    } catch {
      setErrorMsg('Error al cambiar el estado del anuncio.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;
    setDeleting(true);
    try {
      await deleteAdProposal(adToDelete.id);
      setSuccessMsg(`Anuncio "${adToDelete.businessName}" eliminado.`);
      setAdToDelete(null);
      await loadAll();
    } catch {
      setErrorMsg('Error al eliminar el anuncio.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePricingChange = (
    placement: AdPlacement,
    field: keyof AdPricingConfig,
    value: any
  ) => {
    setPricingConfigs((prev) =>
      prev.map((cfg) => (cfg.placement === placement ? { ...cfg, [field]: value } : cfg))
    );
  };

  const handleSavePricing = async () => {
    setSavingPricing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await saveAdPricingConfig(pricingConfigs);
      setSuccessMsg('Espacios y tarifas publicitarias guardados correctamente.');
    } catch {
      setErrorMsg('Error al guardar la configuración de espacios publicitarios.');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleAddCustomPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newPlacementId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!slug || !newPlacementLabel.trim()) {
      setErrorMsg('Ingresa un identificador y nombre para el nuevo espacio publicitario.');
      return;
    }
    if (pricingConfigs.some((c) => c.placement === slug)) {
      setErrorMsg('Ya existe un espacio publicitario con ese identificador.');
      return;
    }
    const newCfg: AdPricingConfig = {
      placement: slug,
      label: newPlacementLabel.trim(),
      locationDescription: newPlacementLocation.trim() || `Ubicación: ${newPlacementLabel.trim()}`,
      defaultFormat: 'banner_horizontal',
      priceCOP: Number(newPlacementPrice) || 100000,
      pricePerDayCOP: Math.round((Number(newPlacementPrice) || 100000) / Math.max(1, Number(newPlacementDays) || 30)),
      pricePerWeekCOP: Math.round(((Number(newPlacementPrice) || 100000) / Math.max(1, Number(newPlacementDays) || 30)) * 7),
      pricePerMonthCOP: Number(newPlacementPrice) || 100000,
      durationDays: Number(newPlacementDays) || 30,
      description: `Espacio configurado desde administración: ${newPlacementLabel.trim()}`,
      recommendedDimensions: newPlacementDimensions.trim() || '1200x250 px',
      allowedTypes: ['imagen', 'video', 'interactivo', 'especial'],
      availability: 'disponible',
      active: true
    };
    const updated = [...pricingConfigs, newCfg];
    setPricingConfigs(updated);
    await saveAdPricingConfig(updated);
    setNewPlacementId('');
    setNewPlacementLabel('');
    setNewPlacementLocation('');
    setSuccessMsg(`Espacio "${newCfg.label}" creado y guardado.`);
  };

  const handleOwnerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file, 8);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Imagen no válida.');
      return;
    }
    setUploadingOwnerImg(true);
    try {
      const url = await uploadImageFile(file, 'ads');
      setOwnerBannerUrl(url);
    } catch {
      setErrorMsg('No se pudo subir la imagen.');
    } finally {
      setUploadingOwnerImg(false);
    }
  };

  const handleCreateOwnerAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerBusinessName.trim() || !ownerHeadline.trim() || !ownerBodyCopy.trim()) {
      setErrorMsg('Completa el nombre del anunciante, titular y descripción.');
      return;
    }
    setCreatingOwnerAd(true);
    setErrorMsg(null);
    try {
      const fmtMeta = ALL_AD_FORMATS.find((f) => f.id === ownerFormat);
      await createAdProposal({
        subscriberId: 'owner_julian',
        subscriberEmail: 'trujillogordilooo@gmail.com',
        subscriberName: 'Julian Camilo Trujillo Gordillo',
        authorRole: 'owner',
        isOwnerAd: true,
        businessName: ownerBusinessName.trim(),
        advertiserName: ownerBusinessName.trim(),
        headline: ownerHeadline.trim(),
        bodyCopy: ownerBodyCopy.trim(),
        formatCategory: fmtMeta?.category || 'grafico',
        adFormat: ownerFormat,
        ctaType: ownerCtaType,
        mediaType: ownerMediaType,
        bannerUrl: ownerMediaType === 'imagen' ? ownerBannerUrl.trim() : '',
        videoUrl: ownerMediaType === 'video' ? ownerVideoUrl.trim() : undefined,
        videoDurationSeconds: ownerMediaType === 'video' ? ownerVideoDuration : undefined,
        targetUrl: ownerTargetUrl.trim() || undefined,
        whatsappNumber: ownerWhatsapp.trim() || undefined,
        promoCode: ownerPromoCode.trim().toUpperCase() || undefined,
        expandableDetails: ownerExpandableDetails.trim() || undefined,
        requestedPlacement: ownerPlacement,
        activePlacement: ownerPlacement,
        durationDays: ownerDurationDays,
        priceCOP: ownerPriceCOP,
        budgetCOP: ownerBudgetCOP || ownerPriceCOP,
        paymentStatus: ownerPaymentStatus,
        scheduledStart: ownerStartDate || undefined,
        startTime: ownerStartTime || undefined,
        scheduledEnd: ownerEndDate || undefined,
        endTime: ownerEndTime || undefined,
        status: ownerStatus,
        impressions: 0,
        clicks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setSuccessMsg(`Campaña "${ownerBusinessName.trim()}" creada correctamente.`);
      setShowOwnerAdModal(false);
      setOwnerBusinessName('');
      setOwnerHeadline('');
      setOwnerBodyCopy('');
      setOwnerBannerUrl('');
      setOwnerVideoUrl('');
      setOwnerTargetUrl('');
      setOwnerWhatsapp('');
      setOwnerPromoCode('');
      setOwnerExpandableDetails('');
      await loadAll();
    } catch {
      setErrorMsg('No se pudo crear la campaña.');
    } finally {
      setCreatingOwnerAd(false);
    }
  };

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (statusFilter !== 'all' && ad.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ad.businessName.toLowerCase().includes(q) ||
          ad.headline.toLowerCase().includes(q) ||
          (ad.subscriberEmail || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ads, statusFilter, searchQuery]);

  // Real Statistics filtered by period
  const statsData = useMemo(() => {
    const now = Date.now();
    const cutoffMs =
      statsPeriod === '7d'
        ? now - 7 * 86400000
        : statsPeriod === '30d'
        ? now - 30 * 86400000
        : statsPeriod === '90d'
        ? now - 90 * 86400000
        : 0;

    const scoped = ads.filter((a) => {
      if (!cutoffMs) return true;
      return new Date(a.createdAt).getTime() >= cutoffMs;
    });

    const totalImpressions = scoped.reduce((acc, a) => acc + (a.impressions || 0), 0);
    const totalClicks = scoped.reduce((acc, a) => acc + (a.clicks || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    const activeCount = scoped.filter((a) => ['activo', 'publicado', 'aprobado'].includes(a.status)).length;
    const pendingCount = scoped.filter((a) => ['pendiente', 'en_revision', 'pendiente_pago'].includes(a.status)).length;
    const finishedCount = scoped.filter((a) => a.status === 'finalizado').length;
    const totalRevenue = scoped
      .filter((a) => a.paymentStatus === 'pagado')
      .reduce((acc, a) => acc + (a.priceCOP || 0), 0);

    // By placement
    const byPlacement: Record<string, { label: string; impressions: number; clicks: number; count: number }> = {};
    scoped.forEach((a) => {
      const p = a.activePlacement || a.requestedPlacement || 'otro';
      const label = pricingConfigs.find((c) => c.placement === p)?.label || p;
      if (!byPlacement[p]) byPlacement[p] = { label, impressions: 0, clicks: 0, count: 0 };
      byPlacement[p].impressions += a.impressions || 0;
      byPlacement[p].clicks += a.clicks || 0;
      byPlacement[p].count += 1;
    });

    // By advertiser
    const byAdvertiser: Record<string, { impressions: number; clicks: number; revenue: number; count: number }> = {};
    scoped.forEach((a) => {
      const name = a.businessName || 'Anunciante';
      if (!byAdvertiser[name]) byAdvertiser[name] = { impressions: 0, clicks: 0, revenue: 0, count: 0 };
      byAdvertiser[name].impressions += a.impressions || 0;
      byAdvertiser[name].clicks += a.clicks || 0;
      byAdvertiser[name].revenue += a.paymentStatus === 'pagado' ? a.priceCOP || 0 : 0;
      byAdvertiser[name].count += 1;
    });

    return {
      totalImpressions,
      totalClicks,
      ctr,
      activeCount,
      pendingCount,
      finishedCount,
      totalRevenue,
      byPlacement: Object.values(byPlacement),
      byAdvertiser: Object.entries(byAdvertiser).map(([name, d]) => ({ name, ...d }))
    };
  }, [ads, statsPeriod, pricingConfigs]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white flex items-center space-x-2.5">
            <Megaphone className="w-6 h-6 text-[#9B1B30] dark:text-gold-400" />
            <span>Administración Publicitaria</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Gestiona campañas, formatos interactivos, espacios publicitarios, estadísticas reales y consultas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowOwnerAdModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#9B1B30] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 hover:opacity-90 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Campaña Directa</span>
          </button>
        </div>
      </div>

      {/* Feedback */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        {[
          { id: 'proposals', label: `Campañas y Propuestas (${ads.length})` },
          { id: 'placements', label: `Espacios Publicitarios (${pricingConfigs.length})` },
          { id: 'stats', label: 'Estadísticas Reales' },
          { id: 'leads', label: `Consultas de Anunciantes (${leads.length})` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PROPOSALS & CAMPAIGNS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por marca, titular o correo..."
              className="sm:w-80 px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente de revisión</option>
              <option value="activo">Activo</option>
              <option value="aprobado">Aprobado</option>
              <option value="programado">Programado</option>
              <option value="suspendido">Pausado / Suspendido</option>
              <option value="finalizado">Finalizado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">Cargando campañas...</div>
          ) : filteredAds.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
              No hay campañas que coincidan con el filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAds.map((ad) => {
                const imp = ad.impressions || 0;
                const clk = ad.clicks || 0;
                const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00';
                return (
                  <div
                    key={ad.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif font-bold text-base text-[#121212] dark:text-white">
                          {ad.businessName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {ad.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                          Pago: {ad.paymentStatus || 'no_aplica'}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          • {pricingConfigs.find((c) => c.placement === (ad.activePlacement || ad.requestedPlacement))?.label || ad.requestedPlacement}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                        {ad.headline}
                      </p>
                      <p className="text-xs text-stone-500 line-clamp-1">{ad.bodyCopy}</p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-400 pt-1">
                        <span>{imp} vistas · {clk} clics · CTR {ctr}%</span>
                        {ad.priceCOP ? <span>Tarifa: ${ad.priceCOP.toLocaleString('es-CO')} COP</span> : null}
                        {ad.durationDays ? <span>Campaña: {ad.durationDays} días</span> : null}
                        {ad.videoDurationSeconds ? <span>Vídeo: {ad.videoDurationSeconds}s</span> : null}
                        {ad.scheduledStart && <span>Inicio: {ad.scheduledStart}</span>}
                        {ad.scheduledEnd && <span>Fin: {ad.scheduledEnd}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {ad.status !== 'activo' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(ad, 'activo')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                          title="Aprobar y activar"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Activar</span>
                        </button>
                      )}
                      {ad.status === 'activo' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(ad, 'suspendido')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                          title="Pausar campaña"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pausar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openReviewModal(ad)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-xs font-semibold text-stone-700 dark:text-stone-200 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Configurar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdToDelete(ad)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLACEMENTS CONFIGURATION */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Configura nombre, ubicación, formato, dimensiones, precio, duración, disponibilidad y campaña asociada de cada espacio.
            </p>
            <button
              type="button"
              disabled={savingPricing}
              onClick={handleSavePricing}
              className="px-5 py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingPricing ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pricingConfigs.map((cfg) => (
              <div
                key={cfg.placement}
                className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 space-y-4"
              >
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-400">{cfg.placement}</span>
                    <input
                      type="text"
                      value={cfg.label}
                      onChange={(e) => handlePricingChange(cfg.placement, 'label', e.target.value)}
                      className="block font-serif font-bold text-base text-[#121212] dark:text-white bg-transparent border-b border-transparent focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  <label className="inline-flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.active}
                      onChange={(e) => handlePricingChange(cfg.placement, 'active', e.target.checked)}
                      className="rounded"
                    />
                    <span>{cfg.active ? 'Activo' : 'Inactivo'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">Ubicación</label>
                    <input
                      type="text"
                      value={cfg.locationDescription || ''}
                      onChange={(e) => handlePricingChange(cfg.placement, 'locationDescription', e.target.value)}
                      placeholder="Ej. Cabecera superior"
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">Dimensiones</label>
                    <input
                      type="text"
                      value={cfg.recommendedDimensions || ''}
                      onChange={(e) => handlePricingChange(cfg.placement, 'recommendedDimensions', e.target.value)}
                      placeholder="1200x250 px"
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">Precio (COP)</label>
                    <input
                      type="number"
                      value={cfg.priceCOP}
                      onChange={(e) => handlePricingChange(cfg.placement, 'priceCOP', Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">Duración base (días)</label>
                    <input
                      type="number"
                      value={cfg.durationDays}
                      onChange={(e) => handlePricingChange(cfg.placement, 'durationDays', Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">Disponibilidad</label>
                    <select
                      value={cfg.availability || 'disponible'}
                      onChange={(e) => handlePricingChange(cfg.placement, 'availability', e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="ocupado">Ocupado</option>
                      <option value="reservado">Reservado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">Campaña Asociada</label>
                    <select
                      value={cfg.associatedCampaignId || ''}
                      onChange={(e) => handlePricingChange(cfg.placement, 'associatedCampaignId', e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-900"
                    >
                      <option value="">Ninguna</option>
                      {ads.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.businessName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Custom Placement */}
          <form
            onSubmit={handleAddCustomPlacement}
            className="p-6 rounded-2xl bg-[#faf9f6] dark:bg-stone-900 border border-[#e8e5dc] dark:border-stone-800 space-y-4"
          >
            <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white">
              Crear Nuevo Espacio Publicitario
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <input
                type="text"
                required
                value={newPlacementId}
                onChange={(e) => setNewPlacementId(e.target.value)}
                placeholder="ID (ej. banner_podcast)"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
              <input
                type="text"
                required
                value={newPlacementLabel}
                onChange={(e) => setNewPlacementLabel(e.target.value)}
                placeholder="Nombre visible"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
              <input
                type="text"
                value={newPlacementLocation}
                onChange={(e) => setNewPlacementLocation(e.target.value)}
                placeholder="Ubicación en el sitio"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
              <input
                type="number"
                value={newPlacementPrice}
                onChange={(e) => setNewPlacementPrice(Number(e.target.value))}
                placeholder="Precio COP"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#9B1B30] text-white font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
              >
                + Añadir Espacio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: REAL STATISTICS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              <span>Rendimiento Publicitario Real</span>
            </h2>
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs">
              {(
                [
                  { id: '7d', label: '7 días' },
                  { id: '30d', label: '30 días' },
                  { id: '90d', label: '90 días' },
                  { id: 'all', label: 'Todo' }
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStatsPeriod(p.id)}
                  className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                    statsPeriod === p.id
                      ? 'bg-white dark:bg-stone-700 text-stone-950 dark:text-white shadow-xs'
                      : 'text-stone-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800">
              <span className="text-xs text-stone-400 flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Impresiones</span>
              </span>
              <p className="text-2xl font-black font-serif mt-1">{statsData.totalImpressions.toLocaleString('es-CO')}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800">
              <span className="text-xs text-stone-400 flex items-center space-x-1">
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Clics</span>
              </span>
              <p className="text-2xl font-black font-serif mt-1">{statsData.totalClicks.toLocaleString('es-CO')}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800">
              <span className="text-xs text-stone-400">CTR Promedio</span>
              <p className="text-2xl font-black font-serif mt-1">{statsData.ctr}%</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800">
              <span className="text-xs text-stone-400 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Ingresos Pagados</span>
              </span>
              <p className="text-2xl font-black font-serif mt-1 text-emerald-600">
                ${statsData.totalRevenue.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 space-y-3">
              <h3 className="font-serif font-bold text-sm">Rendimiento por Espacio</h3>
              {statsData.byPlacement.length === 0 ? (
                <p className="text-xs text-stone-400">Sin datos en este periodo.</p>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                  {statsData.byPlacement.map((row) => (
                    <div key={row.label} className="py-2.5 flex items-center justify-between">
                      <span className="font-semibold">{row.label} ({row.count})</span>
                      <span className="text-stone-500">
                        {row.impressions} vistas · {row.clicks} clics
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 space-y-3">
              <h3 className="font-serif font-bold text-sm">Rendimiento por Anunciante</h3>
              {statsData.byAdvertiser.length === 0 ? (
                <p className="text-xs text-stone-400">Sin datos en este periodo.</p>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                  {statsData.byAdvertiser.map((row) => (
                    <div key={row.name} className="py-2.5 flex items-center justify-between">
                      <span className="font-semibold">{row.name}</span>
                      <span className="text-stone-500">
                        {row.impressions} vistas · {row.clicks} clics · ${row.revenue.toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADVERTISER LEADS */}
      {activeTab === 'leads' && (
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-serif font-bold text-lg flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[#9B1B30] dark:text-gold-400" />
            <span>Consultas Recibidas desde Anuncios Interactivos</span>
          </h3>
          {leads.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">
              Aún no se han recibido consultas desde los formularios de anuncios.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {leads.map((lead) => (
                <div key={lead.id} className="py-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#121212] dark:text-white">
                      {lead.senderName} → {lead.businessName}
                    </span>
                    <span className="text-stone-400">
                      {new Date(lead.createdAt).toLocaleString('es-CO')}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300">{lead.message}</p>
                  <p className="text-stone-400">
                    {lead.senderEmail && `Correo: ${lead.senderEmail} `}
                    {lead.senderPhone && `· Tel: ${lead.senderPhone}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEW / EDIT CAMPAIGN MODAL */}
      {editingAd && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-[#fcfbf9] dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <h3 className="font-serif font-bold text-xl text-[#121212] dark:text-white">
                Gestionar Campaña: {editingAd.businessName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingAd(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Estado de Aprobación</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdProposalStatus)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_revision">En revisión</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="programado">Programado</option>
                  <option value="activo">Activo (Publicado)</option>
                  <option value="suspendido">Pausado / Suspendido</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Estado del Pago</label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                >
                  <option value="no_aplica">No aplica / Cortesía</option>
                  <option value="pendiente">Pendiente de pago</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Espacio Asignado</label>
                <select
                  value={editPlacement}
                  onChange={(e) => setEditPlacement(e.target.value as AdPlacement)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                >
                  {pricingConfigs.map((c) => (
                    <option key={c.placement} value={c.placement}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Formato del Anuncio</label>
                <select
                  value={editFormat}
                  onChange={(e) => setEditFormat(e.target.value as AdFormatType)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                >
                  {ALL_AD_FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Botón de Acción (CTA)</label>
                <select
                  value={editCtaType}
                  onChange={(e) => setEditCtaType(e.target.value as AdCtaType)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                >
                  {CTA_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Hora Activación</label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Duración Campaña (días)</label>
                <input
                  type="number"
                  value={editDurationDays}
                  onChange={(e) => setEditDurationDays(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Precio (COP)</label>
                <input
                  type="number"
                  value={editPriceCOP}
                  onChange={(e) => setEditPriceCOP(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Presupuesto (COP)</label>
                <input
                  type="number"
                  value={editBudgetCOP}
                  onChange={(e) => setEditBudgetCOP(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Duración Vídeo (seg)</label>
                <input
                  type="number"
                  value={editVideoDuration}
                  onChange={(e) => setEditVideoDuration(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <input
                type="text"
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                placeholder="Titular"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-semibold"
              />
              <textarea
                rows={2}
                value={editBodyCopy}
                onChange={(e) => setEditBodyCopy(e.target.value)}
                placeholder="Descripción"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="url"
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  placeholder="URL destino"
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
                <input
                  type="tel"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  placeholder="WhatsApp (57300...)"
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
                <input
                  type="text"
                  value={editPromoCode}
                  onChange={(e) => setEditPromoCode(e.target.value)}
                  placeholder="Código promocional"
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono uppercase"
                />
              </div>
              <textarea
                rows={2}
                value={editEditorNotes}
                onChange={(e) => setEditEditorNotes(e.target.value)}
                placeholder="Notas editoriales para el anunciante..."
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase text-stone-400 block mb-2">
                Vista Previa en Vivo
              </span>
              <AdSlotBanner
                placement={editPlacement}
                previewAd={{
                  ...editingAd,
                  headline: editHeadline,
                  bodyCopy: editBodyCopy,
                  bannerUrl: editBannerUrl,
                  videoUrl: editVideoUrl,
                  videoDurationSeconds: editVideoDuration,
                  adFormat: editFormat,
                  ctaType: editCtaType,
                  targetUrl: editTargetUrl,
                  whatsappNumber: editWhatsapp,
                  promoCode: editPromoCode,
                  expandableDetails: editExpandableDetails,
                  scheduledEnd: editEndDate
                }}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                disabled={savingAd}
                onClick={() => handleSaveAdReview('rechazado')}
                className="px-4 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold cursor-pointer"
              >
                Rechazar
              </button>
              <button
                type="button"
                disabled={savingAd}
                onClick={() => handleSaveAdReview('activo')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Aprobar y Activar</span>
              </button>
              <button
                type="button"
                disabled={savingAd}
                onClick={() => handleSaveAdReview()}
                className="px-5 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold cursor-pointer"
              >
                {savingAd ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER DIRECT CAMPAIGN CREATION MODAL */}
      {showOwnerAdModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateOwnerAd}
            className="max-w-2xl w-full bg-[#fcfbf9] dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                Crear Campaña Publicitaria Directa
              </h3>
              <button
                type="button"
                onClick={() => setShowOwnerAdModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={ownerBusinessName}
                onChange={(e) => setOwnerBusinessName(e.target.value)}
                placeholder="Nombre del anunciante / marca *"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
              <select
                value={ownerPlacement}
                onChange={(e) => setOwnerPlacement(e.target.value as AdPlacement)}
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              >
                {pricingConfigs.map((c) => (
                  <option key={c.placement} value={c.placement}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={ownerFormat}
                onChange={(e) => setOwnerFormat(e.target.value as AdFormatType)}
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              >
                {ALL_AD_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={ownerCtaType}
                onChange={(e) => setOwnerCtaType(e.target.value as AdCtaType)}
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              >
                {CTA_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              required
              value={ownerHeadline}
              onChange={(e) => setOwnerHeadline(e.target.value)}
              placeholder="Titular del anuncio *"
              className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
            />
            <textarea
              rows={2}
              required
              value={ownerBodyCopy}
              onChange={(e) => setOwnerBodyCopy(e.target.value)}
              placeholder="Descripción del anuncio *"
              className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
            />

            <div className="flex gap-3 items-center">
              <select
                value={ownerMediaType}
                onChange={(e) => setOwnerMediaType(e.target.value as 'imagen' | 'video')}
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              >
                <option value="imagen">Imagen</option>
                <option value="video">Vídeo</option>
              </select>
              {ownerMediaType === 'imagen' ? (
                <>
                  <label className="px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold cursor-pointer inline-flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingOwnerImg ? 'Subiendo...' : 'Subir'}</span>
                    <input type="file" accept="image/*" onChange={handleOwnerImageUpload} className="hidden" />
                  </label>
                  <input
                    type="url"
                    value={ownerBannerUrl}
                    onChange={(e) => setOwnerBannerUrl(e.target.value)}
                    placeholder="URL de imagen"
                    className="flex-1 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                  />
                </>
              ) : (
                <>
                  <input
                    type="url"
                    value={ownerVideoUrl}
                    onChange={(e) => setOwnerVideoUrl(e.target.value)}
                    placeholder="URL del vídeo"
                    className="flex-1 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                  />
                  <input
                    type="number"
                    value={ownerVideoDuration}
                    onChange={(e) => setOwnerVideoDuration(Number(e.target.value))}
                    placeholder="Segundos"
                    className="w-24 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="url"
                value={ownerTargetUrl}
                onChange={(e) => setOwnerTargetUrl(e.target.value)}
                placeholder="URL destino"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
              <input
                type="tel"
                value={ownerWhatsapp}
                onChange={(e) => setOwnerWhatsapp(e.target.value)}
                placeholder="WhatsApp (57300...)"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
              <input
                type="text"
                value={ownerPromoCode}
                onChange={(e) => setOwnerPromoCode(e.target.value)}
                placeholder="Código promo"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Inicio</label>
                <input
                  type="date"
                  value={ownerStartDate}
                  onChange={(e) => setOwnerStartDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Fin</label>
                <input
                  type="date"
                  value={ownerEndDate}
                  onChange={(e) => setOwnerEndDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Precio (COP)</label>
                <input
                  type="number"
                  value={ownerPriceCOP}
                  onChange={(e) => setOwnerPriceCOP(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Estado</label>
                <select
                  value={ownerStatus}
                  onChange={(e) => setOwnerStatus(e.target.value as AdProposalStatus)}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                >
                  <option value="activo">Activo</option>
                  <option value="programado">Programado</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowOwnerAdModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingOwnerAd}
                className="px-5 py-2 rounded-xl bg-[#9B1B30] text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {creatingOwnerAd ? 'Guardando...' : 'Publicar Campaña'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(adToDelete)}
        title="Eliminar Campaña Publicitaria"
        message={`¿Estás seguro de eliminar la campaña de "${adToDelete?.businessName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setAdToDelete(null)}
        isLoading={deleting}
      />
    </div>
  );
};
