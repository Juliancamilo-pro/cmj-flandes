import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  MousePointerClick,
  Lock,
  Sparkles,
  Users,
  Edit3,
  Trash2,
  Video,
  Image as ImageIcon,
  MousePointer,
  Star,
  MapPin,
  Maximize2,
  Clock
} from 'lucide-react';
import {
  AdCtaType,
  AdFormatCategory,
  AdFormatType,
  AdPlacement,
  AdPricingConfig,
  AdProposal,
  AdProposalStatus
} from '../../types';
import {
  getAdPricingConfig,
  getAdProposals,
  createAdProposal,
  updateAdProposal,
  deleteAdProposal,
  uploadImageFile
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  checkFormRateLimit,
  isValidOptionalUrl,
  sanitizePlainText,
  validateImageFile
} from '../../utils/security';
import { AdSlotBanner } from '../../components/public/AdSlotBanner';
import { HumanVerificationWidget } from '../../components/common/HumanVerificationWidget';

interface AdvertisingPageProps {
  onNavigate: (view: string) => void;
}

const AD_CATEGORIES = [
  'Servicios Profesionales',
  'Comercio y Emprendimiento',
  'Cultura, Libros y Eventos',
  'Educación y Formación',
  'Tecnología e Innovación',
  'Gastronomía y Turismo',
  'Organizaciones y Causas Sociales',
  'Otro'
];

const FORMAT_OPTIONS: Record<
  AdFormatCategory,
  { label: string; description: string; formats: { id: AdFormatType; label: string }[] }
> = {
  grafico: {
    label: 'Anuncios Gráficos',
    description: 'Banners horizontales, verticales, tarjetas promocionales, cuadrados e integración en artículos.',
    formats: [
      { id: 'imagen_publicitaria', label: 'Imagen publicitaria' },
      { id: 'banner_horizontal', label: 'Banner horizontal' },
      { id: 'banner_vertical', label: 'Banner vertical' },
      { id: 'tarjeta_promocional', label: 'Tarjeta promocional' },
      { id: 'anuncio_cuadrado', label: 'Anuncio cuadrado' },
      { id: 'en_articulo', label: 'Anuncio dentro de artículos' }
    ]
  },
  audiovisual: {
    label: 'Anuncios Audiovisuales',
    description: 'Vídeos publicitarios y clips promocionales con control manual de reproducción y sonido.',
    formats: [
      { id: 'video_publicitario', label: 'Vídeo publicitario' },
      { id: 'clip_promocional', label: 'Clip promocional' },
      { id: 'audio_opcional', label: 'Anuncio con audio opcional' }
    ]
  },
  interactivo: {
    label: 'Anuncios Interactivos',
    description: 'Botones de acción, códigos promocionales, tarjetas desplegables, formularios y WhatsApp.',
    formats: [
      { id: 'anuncio_interactivo', label: 'Anuncio interactivo completo' }
    ]
  },
  especial: {
    label: 'Anuncios Especiales',
    description: 'Publicaciones patrocinadas, promociones con temporizador, eventos, lanzamientos y directorio.',
    formats: [
      { id: 'publicacion_patrocinada', label: 'Publicación patrocinada' },
      { id: 'promocion_temporal', label: 'Promoción temporal (con temporizador)' },
      { id: 'evento', label: 'Evento' },
      { id: 'lanzamiento_producto', label: 'Lanzamiento de producto' },
      { id: 'campana_institucional', label: 'Campaña institucional' },
      { id: 'campana_comercial', label: 'Campaña comercial' },
      { id: 'directorio_anunciantes', label: 'Directorio de anunciantes' }
    ]
  }
};

const CTA_OPTIONS: { id: AdCtaType; label: string }[] = [
  { id: 'conocer_mas', label: 'Conocer más' },
  { id: 'visitar_sitio', label: 'Visitar sitio web' },
  { id: 'ver_productos', label: 'Ver productos' },
  { id: 'solicitar_info', label: 'Solicitar información (Formulario integrado)' },
  { id: 'contactar_anunciante', label: 'Contactar al anunciante' },
  { id: 'ver_promocion', label: 'Ver promoción' }
];

export const AdvertisingPage: React.FC<AdvertisingPageProps> = ({ onNavigate }) => {
  const { isAdmin, isCollaborator, isSubscriber, collaborator, subscriber } = useAuth();

  const [pricingConfigs, setPricingConfigs] = useState<AdPricingConfig[]>([]);
  const [myAds, setMyAds] = useState<AdProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showcaseCategory, setShowcaseCategory] = useState<AdFormatCategory>('grafico');

  // Eligibility: Authorized collaborator OR active Premium subscriber OR owner
  const isSubscriberEligible = Boolean(
    isSubscriber &&
      subscriber &&
      subscriber.status === 'activa' &&
      (subscriber.period !== 'pago_unico' ||
        (subscriber.articlesAllowed || 1) > (subscriber.articlesSubmittedCount || 0) ||
        !subscriber.endDate ||
        new Date(subscriber.endDate).getTime() > Date.now())
  );
  const canSubmitProposals = Boolean(isAdmin || isCollaborator || isSubscriberEligible);

  const userEmail =
    collaborator?.email || subscriber?.email || (isAdmin ? 'trujillogordilooo@gmail.com' : '');
  const userName =
    collaborator?.fullName || subscriber?.fullName || (isAdmin ? 'Julian Camilo' : '');
  const userRole: 'collaborator' | 'subscriber' = isCollaborator ? 'collaborator' : 'subscriber';

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<AdProposal | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [advertiserName, setAdvertiserName] = useState(userName);
  const [headline, setHeadline] = useState('');
  const [bodyCopy, setBodyCopy] = useState('');
  const [formatCategory, setFormatCategory] = useState<AdFormatCategory>('grafico');
  const [adFormat, setAdFormat] = useState<AdFormatType>('banner_horizontal');
  const [mediaType, setMediaType] = useState<'imagen' | 'video'>('imagen');
  const [bannerUrl, setBannerUrl] = useState('');
  const [galleryUrlsText, setGalleryUrlsText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number>(15);
  const [ctaType, setCtaType] = useState<AdCtaType>('conocer_mas');
  const [targetUrl, setTargetUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [expandableDetails, setExpandableDetails] = useState('');
  const [adCategory, setAdCategory] = useState(AD_CATEGORIES[0]);
  const [requestedPlacement, setRequestedPlacement] = useState<AdPlacement>('banner_secundario');
  const [campaignDurationDays, setCampaignDurationDays] = useState<number>(30);
  const [requestedStartDate, setRequestedStartDate] = useState('');
  const [requestedEndDate, setRequestedEndDate] = useState('');
  const [contactEmail, setContactEmail] = useState(userEmail);
  const [contactPhone, setContactPhone] = useState('');
  const [humanVerified, setHumanVerified] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [userEmail]);

  useEffect(() => {
    if (userName && !advertiserName) setAdvertiserName(userName);
    if (userEmail && !contactEmail) setContactEmail(userEmail);
  }, [userName, userEmail]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const configs = await getAdPricingConfig();
      setPricingConfigs(configs);

      if (userEmail) {
        const proposals = await getAdProposals({ subscriberEmail: userEmail });
        setMyAds(proposals);
      }
    } catch (e) {
      console.error('Error loading advertising data:', e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingAd(null);
    setBusinessName('');
    setAdvertiserName(userName || '');
    setHeadline('');
    setBodyCopy('');
    setFormatCategory('grafico');
    setAdFormat('banner_horizontal');
    setMediaType('imagen');
    setBannerUrl('');
    setGalleryUrlsText('');
    setVideoUrl('');
    setVideoDurationSeconds(15);
    setCtaType('conocer_mas');
    setTargetUrl('');
    setWhatsappNumber('');
    setPromoCode('');
    setExpandableDetails('');
    setAdCategory(AD_CATEGORIES[0]);
    setRequestedPlacement('banner_secundario');
    setCampaignDurationDays(30);
    setRequestedStartDate('');
    setRequestedEndDate('');
    setContactEmail(userEmail || '');
    setContactPhone('');
    setErrorMsg(null);
  };

  const handleOpenNew = (placement?: AdPlacement) => {
    resetForm();
    if (placement) {
      setRequestedPlacement(placement);
      const cfg = pricingConfigs.find((c) => c.placement === placement);
      if (cfg?.defaultFormat) setAdFormat(cfg.defaultFormat);
      if (cfg?.durationDays) setCampaignDurationDays(cfg.durationDays);
    }
    setShowForm(true);
  };

  const handleEditProposal = (ad: AdProposal) => {
    setEditingAd(ad);
    setBusinessName(ad.businessName || '');
    setAdvertiserName(ad.advertiserName || userName || '');
    setHeadline(ad.headline || '');
    setBodyCopy(ad.bodyCopy || '');
    setFormatCategory(ad.formatCategory || 'grafico');
    setAdFormat(ad.adFormat || 'banner_horizontal');
    setMediaType(ad.mediaType || 'imagen');
    setBannerUrl(ad.bannerUrl || '');
    setGalleryUrlsText((ad.galleryUrls || []).join('\n'));
    setVideoUrl(ad.videoUrl || '');
    setVideoDurationSeconds(ad.videoDurationSeconds || 15);
    setCtaType(ad.ctaType || 'conocer_mas');
    setTargetUrl(ad.targetUrl || '');
    setWhatsappNumber(ad.whatsappNumber || '');
    setPromoCode(ad.promoCode || '');
    setExpandableDetails(ad.expandableDetails || '');
    setAdCategory(ad.category || AD_CATEGORIES[0]);
    setRequestedPlacement(ad.requestedPlacement || 'banner_secundario');
    setCampaignDurationDays(ad.durationDays || 30);
    setRequestedStartDate(ad.scheduledStart || '');
    setRequestedEndDate(ad.scheduledEnd || '');
    setContactEmail(userEmail || '');
    setContactPhone(ad.contactInfo || '');
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 6);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Archivo de imagen no válido.');
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const url = await uploadImageFile(file, 'ads');
      setBannerUrl(url);
    } catch {
      setErrorMsg('No se pudo subir la imagen. Intenta nuevamente o usa un enlace.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveProposal = async (targetStatus: 'borrador' | 'pendiente') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (targetStatus === 'pendiente' && !humanVerified) {
      setErrorMsg('Por favor completa la verificación humana antes de enviar tu propuesta.');
      return;
    }

    const rateCheck = checkFormRateLimit('ad_proposal_submit', 5000);
    if (!rateCheck.allowed) {
      setErrorMsg(
        `Por seguridad, espera ${rateCheck.waitSeconds} segundos antes de enviar otra solicitud.`
      );
      return;
    }

    if (!businessName.trim() || !advertiserName.trim() || !bodyCopy.trim()) {
      setErrorMsg(
        'Por favor completa el nombre del negocio/proyecto, el nombre del anunciante y la descripción del anuncio.'
      );
      return;
    }

    if (targetUrl.trim() && !isValidOptionalUrl(targetUrl)) {
      setErrorMsg('El enlace externo debe comenzar con https:// o http:// y ser válido.');
      return;
    }

    if (requestedStartDate && requestedEndDate && requestedEndDate < requestedStartDate) {
      setErrorMsg('La fecha de finalización no puede ser anterior a la fecha de inicio.');
      return;
    }

    setSaving(true);
    try {
      // Server-side validation (prevents self-approval & validates URLs/WhatsApp)
      const valResp = await fetch('/api/ads/validate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: userEmail,
          requestedStatus: targetStatus,
          targetUrl: targetUrl.trim(),
          whatsappNumber: whatsappNumber.trim()
        })
      });
      const valData = await valResp.json().catch(() => ({ valid: true }));
      if (!valResp.ok || valData.valid === false) {
        setErrorMsg(valData.error || 'Error de validación en el servidor.');
        setSaving(false);
        return;
      }

      // Server-side 7-day rolling window validation for Annual Plan subscribers
      if (targetStatus === 'pendiente' && !editingAd && subscriber?.period === 'anual') {
        const recentDates = myAds
          .filter((a) => a.status !== 'borrador' && a.status !== 'rechazado')
          .map((a) => a.createdAt);
        const checkResp = await fetch('/api/ads/check-weekly-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriberEmail: userEmail,
            planPeriod: subscriber.period,
            weeklyLimit: 1,
            existingProposalDates: recentDates,
            recordSubmission: true
          })
        });
        const checkData = await checkResp.json().catch(() => ({}));
        if (!checkResp.ok || checkData.allowed === false) {
          setErrorMsg(
            checkData.error ||
              'Ya utilizaste tu beneficio semanal de publicidad (1 propuesta cada 7 días). Podrás enviar otra la próxima semana.'
          );
          setSaving(false);
          return;
        }
      }

      const selectedConfig = pricingConfigs.find((c) => c.placement === requestedPlacement);
      let computedPriceCOP =
        selectedConfig?.specialPriceCOP && selectedConfig.specialPriceCOP > 0
          ? selectedConfig.specialPriceCOP
          : selectedConfig?.priceCOP || 0;

      if (selectedConfig && campaignDurationDays > 0) {
        const dayRate =
          selectedConfig.pricePerDayCOP ||
          Math.round(selectedConfig.priceCOP / Math.max(1, selectedConfig.durationDays || 30));
        computedPriceCOP = campaignDurationDays * dayRate;
      }

      const parsedGallery = galleryUrlsText
        .split('\n')
        .map((u) => u.trim())
        .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

      const combinedContact = [
        contactEmail ? `Email: ${sanitizePlainText(contactEmail, 120)}` : '',
        contactPhone ? `Tel: ${sanitizePlainText(contactPhone, 40)}` : ''
      ]
        .filter(Boolean)
        .join(' | ');

      const payload: Partial<AdProposal> = {
        subscriberId: subscriber?.id || collaborator?.id || 'owner',
        subscriberName: userName || advertiserName.trim(),
        subscriberEmail: userEmail,
        authorRole: userRole,
        businessName: sanitizePlainText(businessName, 120),
        advertiserName: sanitizePlainText(advertiserName, 120),
        headline: sanitizePlainText(headline || businessName, 140),
        bodyCopy: sanitizePlainText(bodyCopy, 600),
        formatCategory,
        adFormat,
        mediaType,
        bannerUrl: mediaType === 'imagen' ? bannerUrl.trim() || '' : '',
        galleryUrls: parsedGallery.length > 0 ? parsedGallery : undefined,
        videoUrl: mediaType === 'video' ? videoUrl.trim() || undefined : undefined,
        videoDurationSeconds: mediaType === 'video' ? videoDurationSeconds : undefined,
        ctaType,
        targetUrl: targetUrl.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() ? sanitizePlainText(whatsappNumber, 30) : undefined,
        promoCode: promoCode.trim() ? sanitizePlainText(promoCode, 40).toUpperCase() : undefined,
        expandableDetails: expandableDetails.trim()
          ? sanitizePlainText(expandableDetails, 800)
          : undefined,
        category: adCategory,
        requestedPlacement,
        durationDays: campaignDurationDays,
        scheduledStart: requestedStartDate || undefined,
        scheduledEnd: requestedEndDate || undefined,
        contactInfo: combinedContact || undefined,
        priceCOP: computedPriceCOP,
        status: targetStatus
      };

      if (editingAd?.id) {
        await updateAdProposal(editingAd.id, payload);
        setSuccessMsg(
          targetStatus === 'pendiente'
            ? 'Propuesta actualizada y enviada a revisión del propietario.'
            : 'Borrador de anuncio guardado correctamente.'
        );
      } else {
        await createAdProposal({
          ...payload,
          impressions: 0,
          clicks: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Omit<AdProposal, 'id'>);
        setSuccessMsg(
          targetStatus === 'pendiente'
            ? '¡Propuesta publicitaria enviada! El propietario la revisará antes de su publicación.'
            : 'Borrador guardado. Podrás enviarlo a revisión cuando esté listo.'
        );
      }

      setShowForm(false);
      resetForm();
      await loadInitialData();
    } catch (e: any) {
      setErrorMsg(e.message || 'Ocurrió un error al guardar la propuesta publicitaria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDraft = async (adId: string) => {
    try {
      await deleteAdProposal(adId);
      setSuccessMsg('Propuesta eliminada.');
      await loadInitialData();
    } catch {
      setErrorMsg('No se pudo eliminar la propuesta.');
    }
  };

  const getStatusBadge = (status: AdProposalStatus) => {
    switch (status) {
      case 'activo':
      case 'publicado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            Activo
          </span>
        );
      case 'aprobado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
            Aprobado
          </span>
        );
      case 'programado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
            Programado
          </span>
        );
      case 'pendiente_pago':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300">
            Pendiente de Pago
          </span>
        );
      case 'pendiente':
      case 'en_revision':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
            Pendiente de Revisión
          </span>
        );
      case 'rechazado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
            Rechazado
          </span>
        );
      case 'suspendido':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300">
            Suspendido
          </span>
        );
      case 'finalizado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            Finalizado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            Borrador
          </span>
        );
    }
  };

  const previewAdObj: AdProposal = {
    id: 'preview',
    subscriberId: 'preview',
    subscriberEmail: userEmail || 'anunciante@dulima.co',
    subscriberName: advertiserName || 'Anunciante',
    businessName: businessName || 'Tu Marca o Proyecto',
    headline: headline || 'Titular atractivo de tu campaña en DULIMA',
    bodyCopy:
      bodyCopy ||
      'Describe aquí tu producto, servicio, evento o lanzamiento para los lectores de DULIMA.',
    formatCategory,
    adFormat,
    mediaType,
    bannerUrl,
    videoUrl,
    videoDurationSeconds,
    ctaType,
    targetUrl: targetUrl || 'https://dulima.co',
    whatsappNumber,
    promoCode: promoCode ? promoCode.toUpperCase() : undefined,
    expandableDetails,
    requestedPlacement,
    scheduledEnd: requestedEndDate || undefined,
    status: 'activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-gold-100/80 dark:bg-stone-800 text-gold-900 dark:text-gold-300 text-xs font-bold uppercase tracking-widest">
          <Megaphone className="w-3.5 h-3.5 text-[#9B1B30] dark:text-gold-400" />
          <span>Espacios Editoriales & Campañas Interactivas · DULIMA</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#121212] dark:text-white tracking-tight">
          Publicidad en DULIMA
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
          Conecta tu proyecto, empresa o iniciativa cultural con la audiencia de DULIMA mediante formatos gráficos, audiovisuales, interactivos y especiales. Cada campaña es revisada y aprobada por el propietario antes de su publicación.
        </p>
      </header>

      {/* Interactive Formats Showcase */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h2 className="font-serif font-bold text-xl text-[#121212] dark:text-white">
              Formatos Publicitarios Disponibles
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Experiencias no invasivas, claramente identificadas como publicidad y adaptadas a móviles.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'grafico', label: 'Gráficos', icon: ImageIcon },
                { id: 'audiovisual', label: 'Audiovisuales', icon: Video },
                { id: 'interactivo', label: 'Interactivos', icon: MousePointer },
                { id: 'especial', label: 'Especiales', icon: Star }
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setShowcaseCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    showcaseCategory === tab.id
                      ? 'bg-[#9B1B30] text-white dark:bg-gold-500 dark:text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            {FORMAT_OPTIONS[showcaseCategory].description}
          </p>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS[showcaseCategory].formats.map((f) => (
              <span
                key={f.id}
                className="px-3 py-1.5 rounded-lg bg-[#faf9f6] dark:bg-stone-900 border border-[#e7e4dc] dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200"
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Available Placements & Pricing */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#e8e5dc] dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#121212] dark:text-white">
              Espacios y Tarifas Publicitarias
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Explora las ubicaciones disponibles, dimensiones recomendadas, disponibilidad y tarifas vigentes.
            </p>
          </div>
          {canSubmitProposals && !showForm && (
            <button
              onClick={() => handleOpenNew()}
              className="px-5 py-2.5 rounded-xl bg-[#121212] hover:bg-[#9B1B30] dark:bg-gold-500 dark:hover:bg-gold-400 text-white dark:text-stone-950 font-bold text-xs uppercase tracking-wider inline-flex items-center space-x-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Propuesta Publicitaria</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pricingConfigs
            .filter((c) => c.active)
            .map((cfg) => (
              <div
                key={cfg.placement}
                className="p-6 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-gold-400 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {cfg.availability === 'ocupado'
                        ? 'Ocupado'
                        : cfg.availability === 'reservado'
                        ? 'Reservado'
                        : 'Disponible'}
                    </span>
                    {cfg.recommendedDimensions && (
                      <span className="text-[11px] font-mono text-stone-400 flex items-center space-x-1">
                        <Maximize2 className="w-3 h-3" />
                        <span>{cfg.recommendedDimensions}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                    {cfg.label}
                  </h3>

                  {cfg.locationDescription && (
                    <p className="text-xs text-[#9B1B30] dark:text-gold-400 font-medium flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{cfg.locationDescription}</span>
                    </p>
                  )}

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {cfg.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black font-serif text-[#121212] dark:text-white">
                        ${cfg.priceCOP.toLocaleString('es-CO')}
                      </span>
                      <span className="text-xs text-stone-400 ml-1">COP</span>
                    </div>
                    <span className="text-xs text-stone-500 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{cfg.durationDays} días</span>
                    </span>
                  </div>

                  {canSubmitProposals && (
                    <button
                      type="button"
                      onClick={() => handleOpenNew(cfg.placement)}
                      className="w-full py-2 px-4 rounded-xl bg-[#faf9f6] dark:bg-stone-900 border border-[#e7e4dc] dark:border-stone-700 hover:border-[#9B1B30] dark:hover:border-gold-400 text-xs font-semibold text-[#121212] dark:text-white transition-colors cursor-pointer"
                    >
                      Elegir esta ubicación
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Eligibility Notice for Non-Authenticated Visitors */}
      {!canSubmitProposals && (
        <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#9B1B30] dark:text-gold-400">
              <Lock className="w-4 h-4" />
              <span>Envío de Propuestas Publicitarias</span>
            </div>
            <h3 className="font-serif font-bold text-xl text-[#121212] dark:text-white">
              ¿Deseas anunciar tu marca o proyecto en DULIMA?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-2xl">
              Los suscriptores de Planes Premium (el Plan Anual incluye 1 propuesta semanal sujeta a aprobación) y los colaboradores autorizados pueden enviar propuestas directamente desde aquí.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('premium')}
              className="px-5 py-2.5 rounded-xl bg-[#9B1B30] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver Planes Premium</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('collaboration')}
              className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Acceso Colaborador</span>
            </button>
          </div>
        </section>
      )}

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Proposal Creation / Edit Form + Live Preview */}
      {canSubmitProposals && showForm && (
        <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#121212] dark:text-white">
                {editingAd ? 'Editar Propuesta Publicitaria' : 'Configurar Nueva Campaña Publicitaria'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                Toda propuesta queda sujeta a revisión y aprobación del propietario antes de publicarse.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {/* Step 1: Advertiser Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9B1B30] dark:text-gold-400">
              1. Información del Anunciante
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Negocio, Marca o Proyecto *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Café del Tolima"
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Nombre del Anunciante *
                </label>
                <input
                  type="text"
                  value={advertiserName}
                  onChange={(e) => setAdvertiserName(e.target.value)}
                  placeholder="Nombre o razón social"
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Categoría Comercial
                </label>
                <select
                  value={adCategory}
                  onChange={(e) => setAdCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  {AD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Format & Creative */}
          <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9B1B30] dark:text-gold-400">
              2. Formato, Creatividad y Contenido
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Familia de Formato
                </label>
                <select
                  value={formatCategory}
                  onChange={(e) => {
                    const nextCat = e.target.value as AdFormatCategory;
                    setFormatCategory(nextCat);
                    setAdFormat(FORMAT_OPTIONS[nextCat].formats[0].id);
                    if (nextCat === 'audiovisual') setMediaType('video');
                    else setMediaType('imagen');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  <option value="grafico">Anuncio Gráfico</option>
                  <option value="audiovisual">Anuncio Audiovisual</option>
                  <option value="interactivo">Anuncio Interactivo</option>
                  <option value="especial">Anuncio Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Formato Específico
                </label>
                <select
                  value={adFormat}
                  onChange={(e) => setAdFormat(e.target.value as AdFormatType)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  {FORMAT_OPTIONS[formatCategory].formats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Tipo de Medio Principal
                </label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as 'imagen' | 'video')}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  <option value="imagen">Imagen / Galería</option>
                  <option value="video">Vídeo Publicitario</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Titular del Anuncio
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ej. Festival Cultural del Tolima 2026"
                  maxLength={140}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Botón de Acción (CTA)
                </label>
                <select
                  value={ctaType}
                  onChange={(e) => setCtaType(e.target.value as AdCtaType)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  {CTA_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Descripción del Anuncio *
              </label>
              <textarea
                rows={3}
                value={bodyCopy}
                onChange={(e) => setBodyCopy(e.target.value)}
                placeholder="Describe tu producto, servicio, promoción o evento..."
                maxLength={600}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>

            {mediaType === 'imagen' ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Imagen Principal (Sube desde tu dispositivo o pega URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center justify-center space-x-2 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4 text-gold-600" />
                    <span>{uploadingImage ? 'Subiendo...' : 'Subir Imagen'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... (URL de imagen principal)"
                    className="flex-1 px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                    Galería adicional (Opcional, una URL por línea)
                  </label>
                  <textarea
                    rows={2}
                    value={galleryUrlsText}
                    onChange={(e) => setGalleryUrlsText(e.target.value)}
                    placeholder="https://ejemplo.com/foto2.jpg"
                    className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    URL del Vídeo Publicitario (MP4 / WebM)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://.../video.mp4"
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Duración del Vídeo (segundos)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={videoDurationSeconds}
                    onChange={(e) => setVideoDurationSeconds(Number(e.target.value) || 15)}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Interactive & Special Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Enlace de Destino (URL)
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://tusitio.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  WhatsApp Directo (Opcional)
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="573001234567"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Código Promocional (Opcional)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Ej. DULIMA20"
                  maxLength={30}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Información Adicional Desplegable (Opcional)
              </label>
              <textarea
                rows={2}
                value={expandableDetails}
                onChange={(e) => setExpandableDetails(e.target.value)}
                placeholder="Detalles extra, horarios, condiciones de la promoción o catálogo..."
                maxLength={800}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
              />
            </div>
          </div>

          {/* Step 3: Placement & Campaign Duration */}
          <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9B1B30] dark:text-gold-400">
              3. Ubicación y Duración de la Campaña Comercial
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Espacio Publicitario
                </label>
                <select
                  value={requestedPlacement}
                  onChange={(e) => setRequestedPlacement(e.target.value as AdPlacement)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  {pricingConfigs.map((cfg) => (
                    <option key={cfg.placement} value={cfg.placement}>
                      {cfg.label} (${cfg.priceCOP.toLocaleString('es-CO')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Duración Campaña (Días)
                </label>
                <select
                  value={campaignDurationDays}
                  onChange={(e) => setCampaignDurationDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  <option value={7}>7 días (1 semana)</option>
                  <option value={15}>15 días (Quincena)</option>
                  <option value={30}>30 días (1 mes)</option>
                  <option value={60}>60 días (2 meses)</option>
                  <option value={90}>90 días (Trimestre)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={requestedStartDate}
                  onChange={(e) => setRequestedStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Fecha de Finalización
                </label>
                <input
                  type="date"
                  value={requestedEndDate}
                  onChange={(e) => setRequestedEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Vista Previa Interactiva del Anuncio
            </span>
            <AdSlotBanner placement={requestedPlacement} previewAd={previewAdObj} />
          </div>

          <HumanVerificationWidget
            formName="ad_proposal"
            onVerifiedChange={(ok) => setHumanVerified(ok)}
          />

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveProposal('borrador')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold inline-flex items-center justify-center space-x-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Borrador</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveProposal('pendiente')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center space-x-2 hover:bg-[#9B1B30] dark:hover:bg-gold-400 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'Enviando...' : 'Enviar a Revisión del Propietario'}</span>
            </button>
          </div>
        </section>
      )}

      {/* My Proposals & Active Campaigns */}
      {canSubmitProposals && (
        <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
            <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
              Mis Propuestas y Campañas ({myAds.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-stone-400">Cargando tus propuestas...</div>
          ) : myAds.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Megaphone className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
              <p className="font-serif italic text-sm text-stone-500 dark:text-stone-400">
                Aún no has enviado propuestas publicitarias.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {myAds.map((ad) => {
                const imp = ad.impressions || 0;
                const clk = ad.clicks || 0;
                const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00';
                return (
                  <div
                    key={ad.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                          {ad.businessName}
                        </h4>
                        {getStatusBadge(ad.status)}
                        <span className="text-[11px] text-stone-400">
                          •{' '}
                          {pricingConfigs.find((c) => c.placement === ad.requestedPlacement)?.label ||
                            ad.requestedPlacement}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                        {ad.headline ? `${ad.headline}: ` : ''}
                        {ad.bodyCopy}
                      </p>
                      {ad.editorNotes && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg">
                          <strong>Nota del propietario:</strong> {ad.editorNotes}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-[11px] text-stone-400">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{imp} impresiones</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          <span>{clk} clics</span>
                        </span>
                        <span>CTR: {ctr}%</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {(ad.status === 'borrador' ||
                        ad.status === 'pendiente' ||
                        ad.status === 'rechazado') && (
                        <button
                          onClick={() => handleEditProposal(ad)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-xs font-semibold text-stone-700 dark:text-stone-200 inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}
                      {ad.status === 'borrador' && (
                        <button
                          onClick={() => handleDeleteDraft(ad.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Eliminar borrador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Official Advertiser & Sponsor Directory */}
      <AdSlotBanner placement="seccion_patrocinadores" variant="sponsors" />
    </div>
  );
};
