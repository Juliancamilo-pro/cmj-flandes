import React, { useEffect, useState, useRef } from 'react';
import {
  ExternalLink,
  Megaphone,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Copy,
  Check,
  ChevronDown,
  MessageCircle,
  Clock,
  Send,
  Sparkles,
  Calendar,
  Tag
} from 'lucide-react';
import { AdCtaType, AdFormatType, AdPlacement, AdProposal } from '../../types';
import {
  getPublicActiveAds,
  recordAdImpression,
  recordAdClick,
  createAdLeadInquiry
} from '../../services/db';
import { sanitizeSafeUrl, sanitizePlainText } from '../../utils/security';
import { useLightReading } from '../../context/LightReadingContext';

interface AdSlotBannerProps {
  placement: AdPlacement;
  className?: string;
  variant?: 'banner' | 'card' | 'sidebar' | 'sponsors';
  previewAd?: AdProposal;
}

const CTA_LABELS: Record<AdCtaType, string> = {
  conocer_mas: 'Conocer más',
  visitar_sitio: 'Visitar sitio web',
  ver_productos: 'Ver productos',
  solicitar_info: 'Solicitar información',
  contactar_anunciante: 'Contactar al anunciante',
  ver_promocion: 'Ver promoción'
};

const FORMAT_BADGES: Partial<Record<AdFormatType, string>> = {
  publicacion_patrocinada: 'Publicación Patrocinada',
  promocion_temporal: 'Promoción Temporal',
  evento: 'Evento Patrocinado',
  lanzamiento_producto: 'Lanzamiento',
  campana_institucional: 'Campaña Institucional',
  campana_comercial: 'Campaña Comercial',
  directorio_anunciantes: 'Aliado Comercial',
  video_publicitario: 'Vídeo Publicitario',
  clip_promocional: 'Clip Promocional',
  audio_opcional: 'Audiovisual'
};

const CountdownBadge: React.FC<{ endDate: string; endTime?: string }> = ({ endDate, endTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const targetMs = new Date(`${endDate.slice(0, 10)}T${endTime || '23:59'}:00`).getTime();
    if (isNaN(targetMs)) return;

    const update = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setTimeLeft('Finalizada');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${mins}m`);
      } else {
        setTimeLeft(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endDate, endTime]);

  if (!timeLeft) return null;

  return (
    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-gold-300 border border-amber-500/30 text-[10px] font-mono font-bold">
      <Clock className="w-3 h-3 shrink-0" />
      <span>Termina en: {timeLeft}</span>
    </span>
  );
};

export const AdSlotBanner: React.FC<AdSlotBannerProps> = ({
  placement,
  className = '',
  variant = 'banner',
  previewAd
}) => {
  const [ads, setAds] = useState<AdProposal[]>(previewAd ? [previewAd] : []);
  const { isLightReading } = useLightReading();

  // Interactive states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // NEVER autoplay sound
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState<Record<string, number>>({});
  const [lightboxAd, setLightboxAd] = useState<AdProposal | null>(null);

  // Inline inquiry form state ("Solicitar información")
  const [inquiryAdId, setInquiryAdId] = useState<string | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquirySentId, setInquirySentId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (previewAd) {
      setAds([previewAd]);
      return;
    }

    let mounted = true;
    getPublicActiveAds(placement)
      .then((activeAds) => {
        const now = Date.now();
        const validAds = activeAds.filter((ad) => {
          if (ad.scheduledStart) {
            const startMs = new Date(`${ad.scheduledStart.slice(0, 10)}T${ad.startTime || '00:00'}`).getTime();
            if (!isNaN(startMs) && now < startMs) return false;
          }
          if (ad.scheduledEnd) {
            const endMs = new Date(`${ad.scheduledEnd.slice(0, 10)}T${ad.endTime || '23:59'}`).getTime();
            if (!isNaN(endMs) && now > endMs) return false;
          }
          return true;
        });
        if (mounted && validAds.length > 0) {
          setAds(validAds);
          if (variant === 'sponsors') {
            validAds.slice(0, 6).forEach((ad) => recordAdImpression(ad.id));
          } else {
            recordAdImpression(validAds[0].id);
          }
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [placement, variant, previewAd]);

  const handleTrackClick = (adId: string) => {
    if (!previewAd) {
      recordAdClick(adId);
    }
  };

  const handleCopyPromo = (ad: AdProposal) => {
    if (!ad.promoCode) return;
    navigator.clipboard.writeText(ad.promoCode).catch(() => {});
    setCopiedPromoId(ad.id);
    handleTrackClick(ad.id);
    setTimeout(() => setCopiedPromoId(null), 2500);
  };

  const handleTogglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    const vid = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (vid) {
      vid.muted = nextMuted;
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent, ad: AdProposal) => {
    e.preventDefault();
    if (!senderName.trim() || !senderMessage.trim()) return;
    setSendingInquiry(true);
    try {
      if (!previewAd) {
        await createAdLeadInquiry({
          adId: ad.id,
          businessName: ad.businessName,
          senderName: sanitizePlainText(senderName, 100),
          senderEmail: senderEmail.trim() ? sanitizePlainText(senderEmail, 150) : undefined,
          senderPhone: senderPhone.trim() ? sanitizePlainText(senderPhone, 40) : undefined,
          message: sanitizePlainText(senderMessage, 1500)
        });
        recordAdClick(ad.id);
      }
      setInquirySentId(ad.id);
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setSenderMessage('');
      setTimeout(() => {
        setInquiryAdId(null);
        setInquirySentId(null);
      }, 2500);
    } finally {
      setSendingInquiry(false);
    }
  };

  const getWhatsAppUrl = (phone?: string): string | null => {
    if (!phone) return null;
    const digits = phone.replace(/[^\d]/g, '');
    if (digits.length < 7) return null;
    return `https://wa.me/${digits}`;
  };

  const renderAdMedia = (ad: AdProposal, containerClass: string) => {
    if (isLightReading) return null;

    const isVideo =
      ad.mediaType === 'video' ||
      ad.adFormat === 'video_publicitario' ||
      ad.adFormat === 'clip_promocional' ||
      ad.adFormat === 'audio_opcional';

    if (isVideo && ad.videoUrl) {
      const safeVideo = sanitizeSafeUrl(ad.videoUrl);
      if (!safeVideo) return null;
      return (
        <div className={`relative group overflow-hidden bg-stone-950 border border-stone-200 dark:border-stone-700 ${containerClass}`}>
          <video
            ref={videoRef}
            src={safeVideo}
            muted={isMuted}
            loop
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
          />
          {/* Custom Accessible Video Controls (Never autoplay sound) */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1.5 bg-black/70 backdrop-blur-xs px-2.5 py-1.5 rounded-lg text-white">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pausar vídeo' : 'Reproducir vídeo'}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              {ad.videoDurationSeconds && (
                <span className="text-[10px] font-mono text-stone-300 pl-1">
                  {ad.videoDurationSeconds}s
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLightboxAd(ad)}
              className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Vista ampliada"
              title="Vista ampliada"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    const allImages = [
      ...(ad.bannerUrl ? [ad.bannerUrl] : []),
      ...(ad.galleryUrls || []).filter((u) => u && u !== ad.bannerUrl)
    ];

    if (allImages.length > 0) {
      const idx = activeGalleryIdx[ad.id] || 0;
      const currentImg = allImages[idx] || allImages[0];
      return (
        <div className={`relative group overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 ${containerClass}`}>
          <img
            src={currentImg}
            alt={ad.businessName}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <button
            type="button"
            onClick={() => setLightboxAd(ad)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Ampliar imagen"
            title="Vista ampliada"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/60 px-2 py-1 rounded-full">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveGalleryIdx((prev) => ({ ...prev, [ad.id]: i }))}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                    i === idx ? 'bg-gold-400' : 'bg-white/50 hover:bg-white'
                  }`}
                  aria-label={`Imagen ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderInteractiveActions = (ad: AdProposal, compact = false) => {
    const safeUrl = sanitizeSafeUrl(ad.targetUrl);
    const waUrl = getWhatsAppUrl(ad.whatsappNumber);
    const ctaText = ad.ctaLabel?.trim() || (ad.ctaType ? CTA_LABELS[ad.ctaType] : 'Conocer más');
    const isInquiryOpen = inquiryAdId === ad.id;
    const isExpanded = expandedAdId === ad.id;

    return (
      <div className="space-y-2.5 pt-1">
        {/* Promo Code Pill */}
        {ad.promoCode && (
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-gold-950/40 border border-dashed border-amber-400 dark:border-gold-600 text-xs">
            <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-gold-400 shrink-0" />
            <span className="font-mono font-bold text-amber-900 dark:text-gold-300">
              {ad.promoCode}
            </span>
            <button
              type="button"
              onClick={() => handleCopyPromo(ad)}
              className="text-[11px] font-semibold text-amber-700 dark:text-gold-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              {copiedPromoId === ad.id ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'justify-center sm:justify-start'}`}>
          {ad.ctaType === 'solicitar_info' ? (
            <button
              type="button"
              onClick={() => setInquiryAdId(isInquiryOpen ? null : ad.id)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold hover:bg-[#9B1B30] dark:hover:bg-gold-400 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{ctaText}</span>
            </button>
          ) : safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => handleTrackClick(ad.id)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold hover:bg-[#9B1B30] dark:hover:bg-gold-400 transition-colors"
            >
              <span>{ctaText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => handleTrackClick(ad.id)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          {ad.expandableDetails && (
            <button
              type="button"
              onClick={() => setExpandedAdId(isExpanded ? null : ad.id)}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:border-gold-400 transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Ocultar detalles' : 'Más información'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Expandable Details Card */}
        {isExpanded && ad.expandableDetails && (
          <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-[#e7e4dc] dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150">
            {ad.expandableDetails}
          </div>
        )}

        {/* Inline Lead Inquiry Form */}
        {isInquiryOpen && (
          <form
            onSubmit={(e) => handleSubmitInquiry(e, ad)}
            className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-[#e7e4dc] dark:border-stone-800 space-y-3 text-left animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#121212] dark:text-white">
                Solicitar información a {ad.businessName}
              </span>
              <button
                type="button"
                onClick={() => setInquiryAdId(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {inquirySentId === ad.id ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                ¡Solicitud enviada! El anunciante recibirá tus datos de contacto.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Tu nombre *"
                    className="p-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={senderPhone || senderEmail}
                    onChange={(e) => {
                      if (e.target.value.includes('@')) {
                        setSenderEmail(e.target.value);
                      } else {
                        setSenderPhone(e.target.value);
                      }
                    }}
                    placeholder="Teléfono o correo"
                    className="p-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={senderMessage}
                  onChange={(e) => setSenderMessage(e.target.value)}
                  placeholder="¿Qué información deseas recibir? *"
                  className="w-full p-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={sendingInquiry}
                  className="px-4 py-1.5 rounded-lg bg-[#9B1B30] text-white text-xs font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  {sendingInquiry ? 'Enviando...' : 'Enviar consulta'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    );
  };

  if (ads.length === 0) return null;

  // Sponsors / Advertiser Directory Grid Variant
  if (variant === 'sponsors') {
    return (
      <section
        aria-label="Directorio de anunciantes y patrocinadores"
        className={`bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-4 h-4 text-[#9B1B30] dark:text-gold-400" />
            <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
              Patrocinadores y Directorio de Anunciantes
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 self-start sm:self-auto">
            Contenido Patrocinado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.slice(0, 6).map((ad) => (
            <div
              key={ad.id}
              className="p-4 rounded-xl bg-[#faf9f6] dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between space-y-3 hover:border-gold-400 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  <span>{(ad.adFormat && FORMAT_BADGES[ad.adFormat]) || 'Patrocinado'}</span>
                  <span className="text-[#9B1B30] dark:text-gold-400 truncate max-w-[150px]">
                    {ad.businessName}
                  </span>
                </div>

                {renderAdMedia(ad, 'w-full h-36 rounded-lg')}

                {ad.scheduledEnd && (
                  <CountdownBadge endDate={ad.scheduledEnd} endTime={ad.endTime} />
                )}

                <h4 className="font-serif font-bold text-sm text-[#121212] dark:text-white line-clamp-2">
                  {ad.headline}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed line-clamp-3">
                  {ad.bodyCopy}
                </p>
              </div>

              {renderInteractiveActions(ad, true)}
            </div>
          ))}
        </div>
      </section>
    );
  }

  const ad = ads[0];
  const badgeLabel = (ad.adFormat && FORMAT_BADGES[ad.adFormat]) || 'Publicidad • Patrocinado';

  // Sidebar / Vertical Variant
  if (variant === 'sidebar' || ad.adFormat === 'banner_vertical') {
    return (
      <>
        <aside
          aria-label="Espacio publicitario"
          className={`p-5 rounded-2xl bg-[#faf9f6] dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 shadow-xs space-y-3.5 transition-all hover:border-gold-400/70 ${className}`}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans">
            <span className="px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              {badgeLabel}
            </span>
            <span className="text-[#9B1B30] dark:text-gold-400 truncate max-w-[140px]">
              {ad.businessName}
            </span>
          </div>

          {renderAdMedia(ad, 'w-full h-44 rounded-xl')}

          {ad.scheduledEnd && (
            <CountdownBadge endDate={ad.scheduledEnd} endTime={ad.endTime} />
          )}

          <div className="space-y-1.5">
            <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white leading-snug">
              {ad.headline}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
              {ad.bodyCopy}
            </p>
          </div>

          {renderInteractiveActions(ad, true)}
        </aside>
        {renderLightbox()}
      </>
    );
  }

  // Standard Non-Intrusive Horizontal / Card / In-Article Banner
  const isSquare = ad.adFormat === 'anuncio_cuadrado';

  return (
    <>
      <div
        role="region"
        aria-label="Espacio publicitario"
        className={`p-5 sm:p-6 rounded-2xl bg-[#faf9f6] dark:bg-[#18181c] border border-gold-300/70 dark:border-stone-800 shadow-xs space-y-3.5 transition-all hover:border-gold-400 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              {badgeLabel}
            </span>
            {ad.scheduledEnd && (
              <CountdownBadge endDate={ad.scheduledEnd} endTime={ad.endTime} />
            )}
          </div>
          <span className="text-[#9B1B30] dark:text-gold-400 font-bold">
            {ad.businessName}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
          {renderAdMedia(
            ad,
            isSquare
              ? 'w-full sm:w-40 h-40 rounded-xl shrink-0'
              : 'w-full sm:w-56 h-32 rounded-xl shrink-0'
          )}

          <div className="space-y-1.5 flex-1 text-center sm:text-left w-full">
            <h4 className="font-serif font-bold text-base sm:text-lg text-[#121212] dark:text-white">
              {ad.headline}
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
              {ad.bodyCopy}
            </p>

            {renderInteractiveActions(ad, false)}
          </div>
        </div>
      </div>
      {renderLightbox()}
    </>
  );

  function renderLightbox() {
    if (!lightboxAd) return null;
    const safeVideo = sanitizeSafeUrl(lightboxAd.videoUrl);
    return (
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={() => setLightboxAd(null)}
      >
        <div
          className="max-w-2xl w-full bg-[#fcfbf9] dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9B1B30] dark:text-gold-400">
                Publicidad · {lightboxAd.businessName}
              </span>
              <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                {lightboxAd.headline}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setLightboxAd(null)}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              aria-label="Cerrar vista ampliada"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {lightboxAd.mediaType === 'video' && safeVideo ? (
            <video
              src={safeVideo}
              controls
              muted={isMuted}
              playsInline
              className="w-full max-h-[60vh] rounded-xl bg-black"
            />
          ) : lightboxAd.bannerUrl ? (
            <img
              src={lightboxAd.bannerUrl}
              alt={lightboxAd.businessName}
              className="w-full max-h-[60vh] object-contain rounded-xl bg-stone-100 dark:bg-stone-900"
            />
          ) : null}

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {lightboxAd.bodyCopy}
          </p>
        </div>
      </div>
    );
  }
};
