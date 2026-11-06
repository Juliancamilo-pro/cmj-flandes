import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Eye,
  EyeOff,
  Trash2,
  Save,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Upload,
  ExternalLink,
  X,
  Info
} from 'lucide-react';
import {
  PoliticalAffiliationType,
  PoliticalOrgCategory,
  PoliticalOrganization,
  UserPoliticalIdentity,
  UserPoliticalSelection
} from '../../types';
import {
  POLITICAL_AFFILIATION_OPTIONS,
  POLITICAL_CATEGORY_LABELS,
  POLITICAL_LEGAL_STATUS_LABELS,
  OWNER_DEFAULT_POLITICAL_IDENTITY
} from '../../data/colombianPoliticalOrgs';
import {
  getPoliticalOrganizations,
  submitPendingPoliticalOrg,
  saveUserPoliticalIdentity,
  uploadImageFile
} from '../../services/db';
import { PoliticalIdentityBadges } from './PoliticalOrgLogo';
import { validateImageFile, isValidOptionalUrl } from '../../utils/security';

interface PoliticalIdentitySectionProps {
  role: 'owner' | 'collaborator' | 'subscriber';
  userEmail: string;
  userName: string;
  initialIdentity?: UserPoliticalIdentity | null;
  onIdentityUpdated?: (identity: UserPoliticalIdentity | null) => void;
}

export const PoliticalIdentitySection: React.FC<PoliticalIdentitySectionProps> = ({
  role,
  userEmail,
  userName,
  initialIdentity,
  onIdentityUpdated
}) => {
  const [catalog, setCatalog] = useState<PoliticalOrganization[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const defaultSeed =
    role === 'owner' && !initialIdentity ? OWNER_DEFAULT_POLITICAL_IDENTITY : initialIdentity || null;

  const [affiliationType, setAffiliationType] = useState<PoliticalAffiliationType>(
    defaultSeed?.affiliationType || 'prefiero_no_responder'
  );
  const [selectedOrgs, setSelectedOrgs] = useState<UserPoliticalSelection[]>(
    defaultSeed?.organizations || []
  );
  const [isPublic, setIsPublic] = useState<boolean>(defaultSeed?.isPublic ?? false);
  const [explicitConsent, setExplicitConsent] = useState<boolean>(defaultSeed?.isPublic ?? false);

  // Search & category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PoliticalOrgCategory | 'ALL'>('ALL');

  // Propose new organization modal/panel
  const [proposeOpen, setProposeOpen] = useState(false);
  const [propName, setPropName] = useState('');
  const [propAcronym, setPropAcronym] = useState('');
  const [propType, setPropType] = useState('Movimiento ciudadano o agrupación independiente');
  const [propLegalStatus, setPropLegalStatus] = useState('');
  const [propWebsite, setPropWebsite] = useState('');
  const [propDescription, setPropDescription] = useState('');
  const [propLogoUrl, setPropLogoUrl] = useState('');
  const [propSource, setPropSource] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submittingProp, setSubmittingProp] = useState(false);
  const [propFeedback, setPropFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (initialIdentity) {
      setAffiliationType(initialIdentity.affiliationType);
      setSelectedOrgs(initialIdentity.organizations || []);
      setIsPublic(Boolean(initialIdentity.isPublic));
      setExplicitConsent(Boolean(initialIdentity.isPublic));
    }
  }, [initialIdentity]);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const orgs = await getPoliticalOrganizations();
      setCatalog(orgs);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const requiresOrgSelection = useMemo(() => {
    const opt = POLITICAL_AFFILIATION_OPTIONS.find((o) => o.value === affiliationType);
    return Boolean(opt?.requiresOrganization);
  }, [affiliationType]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((org) => {
      if (activeCategory !== 'ALL' && org.category !== activeCategory) return false;
      if (!q) return true;
      return (
        org.officialName.toLowerCase().includes(q) ||
        org.shortName.toLowerCase().includes(q) ||
        org.acronym.toLowerCase().includes(q) ||
        org.description.toLowerCase().includes(q)
      );
    });
  }, [catalog, searchQuery, activeCategory]);

  const groupedCatalog = useMemo(() => {
    const groups: Record<PoliticalOrgCategory, PoliticalOrganization[]> = {
      A: [],
      B: [],
      C: [],
      D: []
    };
    filteredCatalog.forEach((org) => {
      if (groups[org.category]) {
        groups[org.category].push(org);
      }
    });
    return groups;
  }, [filteredCatalog]);

  const toggleOrgSelection = (org: PoliticalOrganization) => {
    setFeedback(null);
    setSelectedOrgs((prev) => {
      const exists = prev.some((s) => s.organizationId === org.id);
      if (exists) {
        return prev.filter((s) => s.organizationId !== org.id);
      }
      return [
        ...prev,
        {
          organizationId: org.id,
          organizationName: org.officialName,
          acronym: org.acronym,
          logoUrl: org.logoUrl,
          primaryColor: org.primaryColor,
          secondaryColor: org.secondaryColor,
          legalStatus: org.legalStatus,
          legalStatusDetail: org.legalStatusDetail,
          website: org.website,
          isCoalition: org.isCoalition
        }
      ];
    });
  };

  const handleTogglePublic = (nextPublic: boolean) => {
    if (nextPublic && !explicitConsent) {
      setFeedback({
        type: 'error',
        text: 'Debes marcar la casilla de consentimiento explícito antes de hacer pública tu identidad política.'
      });
      return;
    }
    setIsPublic(nextPublic);
    setFeedback(null);
  };

  const handleSavePoliticalIdentity = async () => {
    setFeedback(null);
    if (isPublic && !explicitConsent) {
      setFeedback({
        type: 'error',
        text: 'Se requiere tu consentimiento explícito para mostrar esta información públicamente.'
      });
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const identity: UserPoliticalIdentity = {
        affiliationType,
        organizations: requiresOrgSelection ? selectedOrgs : [],
        isPublic: requiresOrgSelection && selectedOrgs.length > 0 ? isPublic : false,
        consentGivenAt: isPublic && explicitConsent ? now : undefined,
        updatedAt: now,
        declaredByOwner: role === 'owner'
      };
      await saveUserPoliticalIdentity(role, userEmail, userName, identity, userEmail);
      onIdentityUpdated?.(identity);
      setFeedback({
        type: 'success',
        text: identity.isPublic
          ? 'Identidad política guardada y visible públicamente en tu perfil.'
          : 'Identidad política guardada de forma privada (solo visible para ti).'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'No se pudo guardar la configuración política. Intenta nuevamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleHidePoliticalIdentity = async () => {
    setIsPublic(false);
    setExplicitConsent(false);
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const identity: UserPoliticalIdentity = {
        affiliationType,
        organizations: requiresOrgSelection ? selectedOrgs : [],
        isPublic: false,
        updatedAt: now,
        declaredByOwner: role === 'owner'
      };
      await saveUserPoliticalIdentity(role, userEmail, userName, identity, userEmail);
      onIdentityUpdated?.(identity);
      setFeedback({
        type: 'success',
        text: 'Tu información política ha sido ocultada del público.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePoliticalIdentity = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await saveUserPoliticalIdentity(role, userEmail, userName, null, userEmail);
      setAffiliationType('prefiero_no_responder');
      setSelectedOrgs([]);
      setIsPublic(false);
      setExplicitConsent(false);
      onIdentityUpdated?.(null);
      setFeedback({
        type: 'success',
        text: 'Tu información política ha sido eliminada de tu perfil.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file, 3);
    if (!val.valid) {
      setPropFeedback({ type: 'error', text: val.error || 'Archivo de logotipo inválido.' });
      return;
    }
    setUploadingLogo(true);
    setPropFeedback(null);
    try {
      const url = await uploadImageFile(file);
      setPropLogoUrl(url);
    } catch {
      setPropFeedback({ type: 'error', text: 'No se pudo subir el logotipo. Puedes ingresar una URL válida.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropFeedback(null);

    if (!propName.trim() || !propDescription.trim() || !propSource.trim()) {
      setPropFeedback({
        type: 'error',
        text: 'Completa el nombre completo, la descripción y la fuente o documento de identificación.'
      });
      return;
    }
    if (propWebsite.trim() && !isValidOptionalUrl(propWebsite.trim())) {
      setPropFeedback({ type: 'error', text: 'La página web debe iniciar con https:// o http://.' });
      return;
    }

    setSubmittingProp(true);
    try {
      await submitPendingPoliticalOrg({
        officialName: propName.trim(),
        acronym: propAcronym.trim().toUpperCase(),
        orgType: propType,
        legalStatusKnown: propLegalStatus.trim() || 'Por verificar por el propietario',
        website: propWebsite.trim(),
        description: propDescription.trim(),
        logoUrl: propLogoUrl.trim() || undefined,
        verificationSource: propSource.trim(),
        submittedByEmail: userEmail || 'usuario@dulima.co',
        submittedByName: userName || 'Usuario DULIMA'
      });
      setPropFeedback({
        type: 'success',
        text: 'Solicitud enviada. Quedará pendiente de revisión por el propietario de DULIMA antes de aparecer en el directorio.'
      });
      setPropName('');
      setPropAcronym('');
      setPropLegalStatus('');
      setPropWebsite('');
      setPropDescription('');
      setPropLogoUrl('');
      setPropSource('');
    } catch {
      setPropFeedback({
        type: 'error',
        text: 'No se pudo enviar la propuesta. Intenta nuevamente.'
      });
    } finally {
      setSubmittingProp(false);
    }
  };

  const previewIdentity: UserPoliticalIdentity = {
    affiliationType,
    organizations: selectedOrgs,
    isPublic: true,
    updatedAt: new Date().toISOString(),
    declaredByOwner: role === 'owner'
  };

  return (
    <div className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9B1B30] dark:text-gold-400">
              Participación y Transparencia Voluntaria
            </span>
          </div>
          <h3 className="font-serif font-bold text-xl text-[#121212] dark:text-white">
            Identidad y Afinidad Política (Opcional)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
            Esta sección es <strong>100% voluntaria</strong> y privada por defecto. No es obligatoria para contratar Premium,
            colaborar o utilizar DULIMA. Nunca utilizamos esta información para publicidad segmentada ni perfilamiento ideológico.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
              isPublic
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
            }`}
          >
            {isPublic ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isPublic ? 'Visible en perfil público' : 'Privado (solo tú)'}</span>
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="space-y-3">
        <label className="block font-serif font-bold text-base text-[#121212] dark:text-white">
          ¿Perteneces, estás afiliado o te identificas con algún partido, movimiento u organización política?
        </label>

        <div className="grid grid-cols-1 gap-2.5">
          {POLITICAL_AFFILIATION_OPTIONS.map((opt) => {
            const selected = affiliationType === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selected
                    ? 'border-[#9B1B30] dark:border-gold-500 bg-[#9B1B30]/5 dark:bg-gold-500/10'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <input
                  type="radio"
                  name="politicalAffiliation"
                  value={opt.value}
                  checked={selected}
                  onChange={() => {
                    setAffiliationType(opt.value);
                    setFeedback(null);
                  }}
                  className="accent-[#9B1B30] w-4 h-4 shrink-0"
                />
                <span className="text-sm text-stone-800 dark:text-stone-200 font-medium">
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Organization Selector (CNE RUPYM) */}
      {requiresOrgSelection && (
        <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                Selecciona tu(s) organización(es) política(s) de Colombia
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Catálogo basado en el Registro Único de Partidos y Movimientos Políticos (RUPYM) del Consejo Nacional Electoral (CNE).
              </p>
            </div>
            <a
              href="https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline shrink-0"
            >
              <span>Fuente oficial CNE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Selected Organizations Summary & Preview */}
          {selectedOrgs.length > 0 && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Organizaciones seleccionadas ({selectedOrgs.length})
                </span>
                <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                  <span>Vista previa junto a tu nombre:</span>
                  <span className="font-bold text-[#121212] dark:text-white">{userName || 'Tu Perfil'}</span>
                  <PoliticalIdentityBadges identity={previewIdentity} size="md" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedOrgs.map((org) => (
                  <div
                    key={org.organizationId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-700 text-xs"
                  >
                    <span
                      className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[8px] font-black text-white shrink-0"
                      style={{ backgroundColor: org.primaryColor }}
                    >
                      {org.acronym.slice(0, 3)}
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {org.organizationName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOrgs((prev) =>
                          prev.filter((s) => s.organizationId !== org.organizationId)
                        )
                      }
                      className="text-stone-400 hover:text-rose-600 cursor-pointer"
                      aria-label={`Quitar ${org.organizationName}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Category Tabs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar partido, movimiento, sigla (ej. Pacto Histórico, Polo, Liberal, Verde...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9B1B30]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl overflow-x-auto">
              {(['ALL', 'A', 'B', 'C', 'D'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeCategory === cat
                      ? 'bg-white dark:bg-[#18181c] text-[#9B1B30] dark:text-gold-400 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  {cat === 'ALL' ? 'Todas' : `Cat. ${cat}`}
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Organizations List */}
          {loadingCatalog ? (
            <div className="py-8 text-center text-sm text-stone-500">
              Cargando registro oficial de organizaciones políticas...
            </div>
          ) : (
            <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
              {(['A', 'B', 'C', 'D'] as PoliticalOrgCategory[]).map((catKey) => {
                const items = groupedCatalog[catKey];
                if (!items || items.length === 0) return null;
                return (
                  <div key={catKey} className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 sticky top-0 bg-white dark:bg-[#18181c] py-1 z-10">
                      {POLITICAL_CATEGORY_LABELS[catKey]}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {items.map((org) => {
                        const isSelected = selectedOrgs.some((s) => s.organizationId === org.id);
                        return (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => toggleOrgSelection(org)}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#9B1B30] dark:border-gold-500 bg-[#9B1B30]/5 dark:bg-gold-500/10'
                                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 flex items-center justify-center font-black text-[10px] text-white shrink-0 mt-0.5"
                              style={{
                                background: org.logoUrl
                                  ? '#ffffff'
                                  : `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.secondaryColor} 100%)`
                              }}
                            >
                              {org.logoUrl ? (
                                <img
                                  src={org.logoUrl}
                                  alt={org.officialName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{org.acronym}</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-serif font-bold text-sm text-[#121212] dark:text-white truncate">
                                  {org.officialName}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-[#9B1B30] dark:text-gold-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                                {POLITICAL_LEGAL_STATUS_LABELS[org.legalStatus]}
                              </div>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                                {org.legalStatusDetail}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div className="py-6 text-center text-sm text-stone-500">
                  No se encontraron organizaciones con ese criterio de búsqueda.
                </div>
              )}
            </div>
          )}

          {/* Missing organization trigger */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setProposeOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#9B1B30] dark:text-gold-400 hover:underline cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>¿No encuentras tu organización política? Agrégala aquí.</span>
            </button>
          </div>

          {/* Propose New Organization Form */}
          {proposeOpen && (
            <form
              onSubmit={handleSubmitProposal}
              className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                    Proponer nueva organización política
                  </h5>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Tu solicitud quedará pendiente de revisión del propietario. No otorga reconocimiento jurídico estatal automático.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProposeOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nombre completo de la organización *
                  </label>
                  <input
                    type="text"
                    required
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    placeholder="Ej. Movimiento Cívico del Tolima"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Sigla
                  </label>
                  <input
                    type="text"
                    value={propAcronym}
                    onChange={(e) => setPropAcronym(e.target.value)}
                    placeholder="Ej. MCT"
                    maxLength={15}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tipo de organización
                  </label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                  >
                    <option value="Partido político">Partido político</option>
                    <option value="Movimiento político">Movimiento político</option>
                    <option value="Grupo Significativo de Ciudadanos">Grupo Significativo de Ciudadanos</option>
                    <option value="Movimiento ciudadano o agrupación independiente">
                      Movimiento ciudadano o agrupación independiente
                    </option>
                    <option value="Coalición electoral">Coalición electoral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Estado de personería jurídica (si lo conoce)
                  </label>
                  <input
                    type="text"
                    value={propLegalStatus}
                    onChange={(e) => setPropLegalStatus(e.target.value)}
                    placeholder="Ej. En trámite ante CNE / Sin personería"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Página web oficial
                  </label>
                  <input
                    type="url"
                    value={propWebsite}
                    onChange={(e) => setPropWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Logotipo (subir imagen o URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={propLogoUrl}
                      onChange={(e) => setPropLogoUrl(e.target.value)}
                      placeholder="URL del logotipo..."
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                    />
                    <label className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs font-semibold cursor-pointer hover:bg-stone-300 shrink-0 inline-flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingLogo ? '...' : 'Subir'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={2}
                  value={propDescription}
                  onChange={(e) => setPropDescription(e.target.value)}
                  placeholder="Describe brevemente la organización política o ciudadana..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Fuente o documento que permita identificarla *
                </label>
                <input
                  type="text"
                  required
                  value={propSource}
                  onChange={(e) => setPropSource(e.target.value)}
                  placeholder="Ej. Resolución CNE No. ..., enlace RUPYM, acta de constitución o sitio oficial"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-sm"
                />
              </div>

              {propFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    propFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {propFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{propFeedback.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingProp}
                  className="px-4 py-2 rounded-xl bg-[#9B1B30] text-white text-xs font-bold hover:bg-[#7d1526] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingProp ? 'Enviando solicitud...' : 'Enviar para revisión del propietario'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Privacy & Explicit Consent Controls */}
      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#9B1B30] dark:text-gold-400 shrink-0 mt-0.5" />
          <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
            <div className="font-bold text-[#121212] dark:text-white">
              Control de Privacidad y Consentimiento Explícito
            </div>
            <p>
              Tu afinidad política es <strong>privada por defecto</strong>. Solo aparecerá en tu perfil público si otorgas
              consentimiento explícito y activas la visibilidad pública. La insignia de verificación de DULIMA y el logotipo
              político son independientes.
            </p>
          </div>
        </div>

        {requiresOrgSelection && selectedOrgs.length > 0 && (
          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={explicitConsent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setExplicitConsent(checked);
                  if (!checked) setIsPublic(false);
                }}
                className="accent-[#9B1B30] w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-xs text-stone-700 dark:text-stone-300">
                Otorgo mi consentimiento explícito para mostrar públicamente los logotipos de las organizaciones políticas
                seleccionadas junto a mi perfil en DULIMA.
              </span>
            </label>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleTogglePublic(!isPublic)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isPublic
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-[#18181c] text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700'
                }`}
              >
                {isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isPublic ? 'Visibilidad Pública Activada' : 'Activar Visibilidad Pública'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {isPublic && (
            <button
              type="button"
              onClick={handleHidePoliticalIdentity}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ocultar del público</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDeletePoliticalIdentity}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar información política</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSavePoliticalIdentity}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9B1B30] text-white text-xs font-bold hover:bg-[#7d1526] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Guardar identidad política'}</span>
        </button>
      </div>
    </div>
  );
};
