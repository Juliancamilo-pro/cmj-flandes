import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Globe,
  Save,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Sparkles,
  Clock,
  XCircle,
  Info
} from 'lucide-react';
import {
  AuthorProfile,
  Collaborator,
  SubscriberUser
} from '../../types';
import {
  getAuthorProfileByEmailOrName,
  saveAuthorProfile,
  requestAuthorVerification,
  checkVerificationEligibility,
  uploadImageFile
} from '../../services/db';
import { validateImageFile, isValidOptionalUrl } from '../../utils/security';
import { ColombianVerifiedBadge, isAuthorVerificationActive } from './ColombianVerifiedBadge';
import { PoliticalIdentitySection } from './PoliticalIdentitySection';

interface AuthorProfileFormProps {
  role: 'owner' | 'collaborator' | 'subscriber';
  initialEmail?: string;
  initialName?: string;
  subscriber?: SubscriberUser | null;
  collaborator?: Collaborator | null;
  onProfileSaved?: (profile: AuthorProfile) => void;
  onPreviewPublicProfile?: (profile: AuthorProfile) => void;
}

export const AuthorProfileForm: React.FC<AuthorProfileFormProps> = ({
  role,
  initialEmail,
  initialName,
  subscriber,
  collaborator,
  onProfileSaved,
  onPreviewPublicProfile
}) => {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields (ONLY fullName is required; all others are strictly optional and never auto-fabricated)
  const [fullName, setFullName] = useState(initialName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [occupation, setOccupation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  // Explicit Public Visibility Toggles (Privacy by default for contact info)
  const [showPhonePublic, setShowPhonePublic] = useState(false);
  const [showEmailPublic, setShowEmailPublic] = useState(false);
  const [showOccupationPublic, setShowOccupationPublic] = useState(true);
  const [showLocationPublic, setShowLocationPublic] = useState(true);
  const [showSocialsPublic, setShowSocialsPublic] = useState(true);

  // Security / Recovery Contact (Requested separately with clear explanation)
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoverySavedMsg, setRecoverySavedMsg] = useState<string | null>(null);

  // UI states
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [initialEmail, initialName]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const found = await getAuthorProfileByEmailOrName(initialEmail, initialName);
      if (found) {
        setProfile(found);
        setFullName(found.fullName || initialName || '');
        setPhone(found.phone || '');
        setEmail(found.email || initialEmail || '');
        setOccupation(found.occupation || '');
        setPhotoUrl(found.photoUrl || '');
        setBio(found.bio || '');
        setCity(found.city || '');
        setCountry(found.country || '');
        setTwitter(found.socialLinks?.twitter || '');
        setInstagram(found.socialLinks?.instagram || '');
        setLinkedin(found.socialLinks?.linkedin || '');
        setWebsite(found.socialLinks?.website || '');
        setShowPhonePublic(found.showPhonePublic ?? false);
        setShowEmailPublic(found.showEmailPublic ?? false);
        setShowOccupationPublic(found.showOccupationPublic ?? true);
        setShowLocationPublic(found.showLocationPublic ?? true);
        setShowSocialsPublic(found.showSocialsPublic ?? true);
      } else {
        // Keep fields blank except known account name/email if provided
        setFullName(initialName || '');
        setEmail(initialEmail || '');
      }
    } catch (e) {
      console.error('Error loading author profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Archivo inválido.');
      return;
    }

    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const url = await uploadImageFile(file);
      setPhotoUrl(url);
      setSuccessMsg('Fotografía de perfil cargada. Recuerda guardar los cambios.');
    } catch (err: any) {
      setErrorMsg('No se pudo subir la fotografía. Puedes intentar con otra imagen o ingresar una URL.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // ONLY fullName is mandatory
    if (!fullName.trim()) {
      setErrorMsg('El nombre completo es el único campo obligatorio para tu perfil de autor.');
      return;
    }

    // Validate optional URLs against dangerous schemes
    if (
      !isValidOptionalUrl(photoUrl) ||
      !isValidOptionalUrl(twitter) ||
      !isValidOptionalUrl(instagram) ||
      !isValidOptionalUrl(linkedin) ||
      !isValidOptionalUrl(website)
    ) {
      setErrorMsg('Uno de los enlaces ingresados contiene un formato no permitido. Usa enlaces http:// o https://.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveAuthorProfile(
        {
          role,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          occupation: occupation.trim() || undefined,
          photoUrl: photoUrl.trim() || undefined,
          bio: bio.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          socialLinks: {
            twitter: twitter.trim() || undefined,
            instagram: instagram.trim() || undefined,
            linkedin: linkedin.trim() || undefined,
            website: website.trim() || undefined
          },
          showPhonePublic,
          showEmailPublic,
          showOccupationPublic,
          showLocationPublic,
          showSocialsPublic
        },
        profile?.id
      );

      setProfile(saved);
      setSuccessMsg('Tu perfil de autor y preferencias de privacidad se han guardado correctamente.');
      if (onProfileSaved) onProfileSaved(saved);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!profile) {
      setErrorMsg('Primero guarda tu perfil de autor con tu nombre completo antes de solicitar la verificación.');
      return;
    }

    setRequestingVerification(true);
    try {
      const updated = await requestAuthorVerification({
        profileId: profile.id,
        role,
        subscriber,
        collaborator
      });
      setProfile(updated);
      setSuccessMsg('Solicitud de verificación enviada. El propietario revisará tu perfil y plan activo.');
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo enviar la solicitud de verificación.');
    } finally {
      setRequestingVerification(false);
    }
  };

  const eligibility = checkVerificationEligibility({ role, subscriber, collaborator });
  const isVerifiedActive = isAuthorVerificationActive(profile, subscriber);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-stone-500 font-sans">
        Cargando formulario de perfil de autor...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Feedback Banners */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Author Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-[#18181c] rounded-3xl p-6 sm:p-8 border border-[#e8e5dc] dark:border-stone-800 shadow-xs space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#121212] dark:text-white">
                Perfil Editorial del Autor
              </h3>
              {isVerifiedActive && (
                <ColombianVerifiedBadge size="md" authorName={fullName} showLabel />
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
              El <strong>nombre completo</strong> es el único campo obligatorio. Todos los demás datos son opcionales y tú decides cuáles se muestran en tu perfil público.
            </p>
          </div>

          {profile && onPreviewPublicProfile && (
            <button
              type="button"
              onClick={() => onPreviewPublicProfile(profile)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-gold-600" />
              <span>Ver mi Perfil Público</span>
            </button>
          )}
        </div>

        {/* Group 1: Identidad Básica */}
        <div className="space-y-5">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 flex items-center space-x-2">
            <User className="w-3.5 h-3.5" />
            <span>1. Identidad del Autor</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nombre Completo (ÚNICO OBLIGATORIO) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5 font-sans">
                Nombre completo <span className="text-rose-600">* (Único campo obligatorio)</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Escribe tu nombre completo o firma editorial"
                className="w-full p-3 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            {/* Ocupación (Opcional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-sans">
                  Ocupación <span className="text-stone-400 font-normal">(Opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowOccupationPublic(!showOccupationPublic)}
                  className={`inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md cursor-pointer ${
                    showOccupationPublic
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {showOccupationPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showOccupationPublic ? 'Público' : 'Privado'}</span>
                </button>
              </div>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Ej. Periodista, Docente, Investigador..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Ciudad y País (Opcional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-sans">
                  Ciudad y país <span className="text-stone-400 font-normal">(Opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLocationPublic(!showLocationPublic)}
                  className={`inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md cursor-pointer ${
                    showLocationPublic
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {showLocationPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showLocationPublic ? 'Público' : 'Privado'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="País"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Biografía (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
              Biografía editorial <span className="text-stone-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Comparte una breve reseña sobre tu trayectoria o temas de interés..."
              className="w-full p-3 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none focus:border-gold-500 resize-y"
            />
          </div>

          {/* Fotografía de Perfil (Opcional) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 font-sans">
              Fotografía de perfil <span className="text-stone-400 font-normal">(Opcional)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={fullName || 'Foto de perfil'}
                  className="w-16 h-16 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-gold-600" />
                    <span>{uploadingPhoto ? 'Subiendo...' : 'Subir desde dispositivo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="O pega la URL de tu fotografía (opcional)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Group 2: Datos de Contacto Opcionales y Privacidad */}
        <div className="space-y-4 pt-6 border-t border-stone-100 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5" />
              <span>2. Contacto Opcional y Control de Privacidad</span>
            </h4>
            <span className="text-[11px] text-stone-500 font-sans">
              Por defecto, tu teléfono y correo permanecen privados.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Correo electrónico (Opcional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-sans">
                  Correo electrónico <span className="text-stone-400 font-normal">(Opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmailPublic(!showEmailPublic)}
                  className={`inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md cursor-pointer ${
                    showEmailPublic
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {showEmailPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showEmailPublic ? 'Visible en perfil público' : 'Solo privado'}</span>
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com (opcional)"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Teléfono (Opcional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-sans">
                  Número de teléfono <span className="text-stone-400 font-normal">(Opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPhonePublic(!showPhonePublic)}
                  className={`inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md cursor-pointer ${
                    showPhonePublic
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {showPhonePublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showPhonePublic ? 'Visible en perfil público' : 'Solo privado'}</span>
                </button>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000 (opcional)"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Group 3: Redes Sociales (Opcional) */}
        <div className="space-y-4 pt-6 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 flex items-center space-x-2">
              <Globe className="w-3.5 h-3.5" />
              <span>3. Redes Sociales y Sitio Web (Opcional)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowSocialsPublic(!showSocialsPublic)}
              className={`inline-flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-md cursor-pointer ${
                showSocialsPublic
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              {showSocialsPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{showSocialsPublic ? 'Mostrar redes en perfil público' : 'Ocultar redes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="url"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="X / Twitter URL (opcional)"
              className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
            />
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="Instagram URL (opcional)"
              className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
            />
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="LinkedIn URL (opcional)"
              className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
            />
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Sitio web o blog personal (opcional)"
              className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-white"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 dark:hover:bg-gold-400 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando perfil...' : 'Guardar Perfil de Autor'}</span>
          </button>
        </div>
      </form>

      {/* Separate Security & Recovery Section (Explains purpose clearly) */}
      <div className="bg-stone-50 dark:bg-[#16161a] rounded-3xl p-6 border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-center space-x-2 text-stone-800 dark:text-stone-200">
          <ShieldCheck className="w-4 h-4 text-gold-600" />
          <h4 className="font-serif font-bold text-sm sm:text-base">
            Seguridad y Recuperación de Acceso (Uso Exclusivo de Seguridad)
          </h4>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
          <strong>Finalidad:</strong> Si deseas recibir alertas de seguridad sobre tu cuenta o recuperar el acceso en caso de pérdida de sesión, puedes registrar aquí un correo o teléfono de respaldo. Este dato <strong>nunca se publica</strong> ni se utiliza para fines comerciales.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <input
            type="text"
            value={recoveryContact}
            onChange={(e) => setRecoveryContact(e.target.value)}
            placeholder="Correo o teléfono exclusivo para recuperación de cuenta (opcional)"
            className="flex-1 p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#202024] text-stone-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => {
              if (!recoveryContact.trim()) return;
              try {
                localStorage.setItem(`jc_recovery_${profile?.id || initialEmail || 'user'}`, recoveryContact.trim());
                setRecoverySavedMsg('Dato de recuperación guardado de forma privada.');
                setTimeout(() => setRecoverySavedMsg(null), 3500);
              } catch {}
            }}
            className="px-4 py-2.5 rounded-xl bg-stone-800 dark:bg-stone-700 text-white text-xs font-semibold hover:bg-stone-900 cursor-pointer shrink-0"
          >
            Guardar Respaldo
          </button>
        </div>
        {recoverySavedMsg && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{recoverySavedMsg}</p>
        )}
      </div>

      {/* Colombian Verification Badge Section */}
      <div className="bg-white dark:bg-[#18181c] rounded-3xl p-6 sm:p-8 border border-[#e8e5dc] dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex flex-col w-4 h-3 rounded-2xs overflow-hidden shrink-0 border border-stone-300">
                <span className="bg-[#fcd116] h-[50%] w-full" />
                <span className="bg-[#003893] h-[25%] w-full" />
                <span className="bg-[#ce1126] h-[25%] w-full" />
              </span>
              <h4 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                Insignia de Verificación Editorial (Identidad Colombiana)
              </h4>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Reconocimiento interno de autenticidad editorial otorgado manualmente por el propietario de Julian Camilo. No constituye una certificación gubernamental.
            </p>
          </div>

          {/* Current Status Pill */}
          <div>
            {isVerifiedActive ? (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <ColombianVerifiedBadge size="sm" />
                <span>Verificación Activa</span>
              </span>
            ) : profile?.verificationStatus === 'pendiente' ? (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Solicitud en Revisión</span>
              </span>
            ) : profile?.verificationStatus === 'rechazado' ? (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-bold">
                <XCircle className="w-3.5 h-3.5" />
                <span>Solicitud Rechazada</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-semibold">
                <span>No Verificado</span>
              </span>
            )}
          </div>
        </div>

        {/* Eligibility & Action */}
        <div className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3 text-xs font-sans">
          <div className="flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-stone-600 dark:text-stone-300">
              <p>
                <strong>Reglas de elegibilidad:</strong> Los planes <em>Individual</em> y <em>Semanal</em> no permiten solicitar verificación. Únicamente los suscriptores con <strong>Plan Mensual</strong> o <strong>Plan Anual</strong> activo (y colaboradores autorizados) pueden solicitarla.
              </p>
              <p className="text-stone-500">
                Tener un plan elegible permite enviar la solicitud, pero la aprobación es manual por parte del propietario. Al vencer la suscripción, la insignia queda suspendida o pendiente de renovación.
              </p>
            </div>
          </div>

          {!isVerifiedActive && profile?.verificationStatus !== 'pendiente' && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800">
              <span className={`font-medium ${eligibility.eligible ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {eligibility.reason}
              </span>

              {eligibility.eligible && (
                <button
                  type="button"
                  disabled={requestingVerification}
                  onClick={handleRequestVerification}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{requestingVerification ? 'Enviando solicitud...' : 'Solicitar Verificación Editorial'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Voluntary Political Identity Section */}
      <PoliticalIdentitySection
        role={role}
        userEmail={email || initialEmail || ''}
        userName={fullName || initialName || ''}
        initialIdentity={profile?.politicalIdentity}
        onIdentityUpdated={(updatedIdentity) => {
          setProfile((prev) =>
            prev
              ? { ...prev, politicalIdentity: updatedIdentity || undefined }
              : null
          );
        }}
      />
    </div>
  );
};
