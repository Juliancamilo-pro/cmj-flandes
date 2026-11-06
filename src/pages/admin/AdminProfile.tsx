import React, { useState } from 'react';
import { 
  User, 
  Upload, 
  Save, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Briefcase, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Twitter,
  Linkedin,
  BookMarked,
  Globe,
  MapPin,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  MessageSquare,
  Send as TelegramIcon,
  Headphones,
  AtSign,
  Video,
  Camera,
  Check,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Crop,
  ArrowUpDown,
  Building2,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { Profile, EducationItem, TrajectoryItem, CustomSocialLink } from '../../types';
import { updateProfile, uploadImageFile, OFFICIAL_AUTHOR_PORTRAIT } from '../../services/db';
import { ImageEditorModal } from '../../components/common/ImageEditorModal';
import { BankAccountsManager } from '../../components/admin/BankAccountsManager';
import { PoliticalIdentitySection } from '../../components/common/PoliticalIdentitySection';

interface AdminProfileProps {
  initialProfile: Profile;
  onRefresh: () => Promise<void>;
}

export const AdminProfile: React.FC<AdminProfileProps> = ({ initialProfile, onRefresh }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [profileSection, setProfileSection] = useState<'profile' | 'financial'>('profile');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Drag and drop state
  const [draggedEduIndex, setDraggedEduIndex] = useState<number | null>(null);
  const [draggedTrajIndex, setDraggedTrajIndex] = useState<number | null>(null);

  // Image Editor Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null);

  // Temporary input for new interest tag
  const [newInterest, setNewInterest] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);
    try {
      const url = await uploadImageFile(file, 'profile');
      setProfile(prev => ({ ...prev, photoUrl: url }));
      setSuccessMsg('Fotografía procesada y optimizada. Recuerda hacer clic en "Guardar Todo el Perfil" para guardar los cambios.');
    } catch (err: any) {
      console.error('Profile photo upload failed:', err);
      setErrorMsg('No fue posible procesar la fotografía: ' + (err.message || ''));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleOpenPhotoEditor = () => {
    setEditorImageSrc(profile.photoUrl || OFFICIAL_AUTHOR_PORTRAIT);
    setEditorOpen(true);
  };

  const handleEditorConfirm = (editedDataUrl: string) => {
    setProfile(prev => ({ ...prev, photoUrl: editedDataUrl }));
    setEditorOpen(false);
    setSuccessMsg('Encuadre de fotografía aplicado. Haz clic en "Guardar Todo el Perfil" para persistir.');
  };

  const handleApplyOfficialPortrait = () => {
    setProfile(prev => ({ ...prev, photoUrl: OFFICIAL_AUTHOR_PORTRAIT }));
    setSuccessMsg('Se ha seleccionado tu foto oficial original. Haz clic en "Guardar Todo el Perfil" para confirmar.');
  };

  /* =========================================================================
     REORDER CONTROLS: EDUCATION (Drag & Drop + Buttons)
     ========================================================================= */

  const handleMoveEducation = (index: number, direction: 'up' | 'down') => {
    const currentList = [...(profile.education || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    // Swap items safely without losing data
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    // Update order property
    const reordered = currentList.map((item, i) => ({ ...item, order: i + 1 }));
    setProfile(prev => ({ ...prev, education: reordered }));
    setSuccessMsg('Orden de formación académica actualizado. Haz clic en "Guardar Todo el Perfil" para persistir.');
  };

  const handleEduDragStart = (e: React.DragEvent, index: number) => {
    setDraggedEduIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEduDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleEduDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedEduIndex === null || draggedEduIndex === targetIndex) return;

    const currentList = [...(profile.education || [])];
    const [draggedItem] = currentList.splice(draggedEduIndex, 1);
    currentList.splice(targetIndex, 0, draggedItem);

    const reordered = currentList.map((item, i) => ({ ...item, order: i + 1 }));
    setProfile(prev => ({ ...prev, education: reordered }));
    setDraggedEduIndex(null);
    setSuccessMsg('Nuevo orden de estudios posicionado correctamente.');
  };

  const handleAddEducation = () => {
    const currentList = profile.education || [];
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      year: '',
      description: '',
      order: currentList.length + 1
    };
    setProfile(prev => ({ ...prev, education: [...currentList, newItem] }));
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setProfile(prev => ({
      ...prev,
      education: (prev.education || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleDeleteEducation = (id: string) => {
    setProfile(prev => ({
      ...prev,
      education: (prev.education || []).filter(item => item.id !== id)
    }));
  };

  /* =========================================================================
     REORDER CONTROLS: TRAJECTORY (Drag & Drop + Buttons)
     ========================================================================= */

  const handleMoveTrajectory = (index: number, direction: 'up' | 'down') => {
    const currentList = [...(profile.trajectory || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    const reordered = currentList.map((item, i) => ({ ...item, order: i + 1 }));
    setProfile(prev => ({ ...prev, trajectory: reordered }));
    setSuccessMsg('Orden de trayectoria actualizado.');
  };

  const handleTrajDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTrajIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTrajDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTrajDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTrajIndex === null || draggedTrajIndex === targetIndex) return;

    const currentList = [...(profile.trajectory || [])];
    const [draggedItem] = currentList.splice(draggedTrajIndex, 1);
    currentList.splice(targetIndex, 0, draggedItem);

    const reordered = currentList.map((item, i) => ({ ...item, order: i + 1 }));
    setProfile(prev => ({ ...prev, trajectory: reordered }));
    setDraggedTrajIndex(null);
    setSuccessMsg('Nuevo orden de trayectoria guardado.');
  };

  const handleAddTrajectory = () => {
    const currentList = profile.trajectory || [];
    const newItem: TrajectoryItem = {
      id: `traj-${Date.now()}`,
      role: '',
      organization: '',
      period: '',
      description: '',
      order: currentList.length + 1
    };
    setProfile(prev => ({ ...prev, trajectory: [...currentList, newItem] }));
  };

  const handleUpdateTrajectory = (id: string, field: keyof TrajectoryItem, value: string) => {
    setProfile(prev => ({
      ...prev,
      trajectory: (prev.trajectory || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleDeleteTrajectory = (id: string) => {
    setProfile(prev => ({
      ...prev,
      trajectory: (prev.trajectory || []).filter(item => item.id !== id)
    }));
  };

  /* =========================================================================
     CUSTOM LINKS & INTERESTS
     ========================================================================= */

  const handleAddCustomLink = () => {
    const newLink: CustomSocialLink = {
      id: `custom-${Date.now()}`,
      label: '',
      url: ''
    };
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        customLinks: [...(prev.socialLinks?.customLinks || []), newLink]
      }
    }));
  };

  const handleUpdateCustomLink = (id: string, field: 'label' | 'url', value: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        customLinks: (prev.socialLinks?.customLinks || []).map(link => 
          link.id === id ? { ...link, [field]: value } : link
        )
      }
    }));
  };

  const handleDeleteCustomLink = (id: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        customLinks: (prev.socialLinks?.customLinks || []).filter(link => link.id !== id)
      }
    }));
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    if (profile.interests?.includes(newInterest.trim())) return;

    setProfile(prev => ({
      ...prev,
      interests: [...(prev.interests || []), newInterest.trim()]
    }));
    setNewInterest('');
  };

  const handleDeleteInterest = (tag: string) => {
    setProfile(prev => ({
      ...prev,
      interests: (prev.interests || []).filter(t => t !== tag)
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateProfile(profile);
      setSuccessMsg('¡Perfil biográfico y orden de elementos guardados exitosamente!');
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg('No fue posible guardar los cambios del perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header and save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
            Información del Autor
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] dark:text-white mt-1">
            Perfil & "Sobre Mí"
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Configura tus datos reales, organiza libremente tu formación académica y gestiona tus redes sociales.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#121212] hover:bg-gold-700 dark:bg-gold-600 dark:hover:bg-gold-500 text-white dark:text-stone-950 font-sans text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4 text-gold-400 dark:text-stone-950" />
          <span>{saving ? 'Guardando...' : 'Guardar Todo el Perfil'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 space-x-2">
        <button
          type="button"
          onClick={() => setProfileSection('profile')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            profileSection === 'profile'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Perfil Biográfico & Académico</span>
        </button>

        <button
          type="button"
          onClick={() => setProfileSection('financial')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            profileSection === 'financial'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Mis cuentas y configuración financiera</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
            PRIVADO
          </span>
        </button>
      </div>

      {profileSection === 'financial' ? (
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <BankAccountsManager onAccountChanged={onRefresh} />
        </div>
      ) : (
        <>
          {/* 1. Identity & Photo */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center space-x-2">
              <User className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <span>Identidad Principal & Fotografía</span>
            </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Photo Column */}
          <div className="md:col-span-4 space-y-4">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider font-sans">
              Fotografía de Perfil
            </label>

            <div className="w-48 h-60 rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 mx-auto md:mx-0 relative shadow-sm group">
              <img
                src={profile.photoUrl || OFFICIAL_AUTHOR_PORTRAIT}
                alt={profile.name}
                className="w-full h-full object-cover object-top"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center">
                  <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs font-medium">Optimizando imagen...</span>
                </div>
              )}
            </div>

            {/* Quick action: Edit / Crop photo with Instagram-style modal */}
            <button
              type="button"
              onClick={handleOpenPhotoEditor}
              className="w-full py-2 px-3 rounded-xl bg-gold-50 dark:bg-gold-950/50 hover:bg-gold-100 text-gold-800 dark:text-gold-300 border border-gold-300 dark:border-gold-800 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Crop className="w-3.5 h-3.5 text-gold-600" />
              <span>Ajustar Encuadre & Recortar Foto</span>
            </button>

            {/* Quick action: Apply official portrait */}
            <button
              type="button"
              onClick={handleApplyOfficialPortrait}
              className="w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-gold-400"
            >
              <div className="flex items-center space-x-2">
                <img
                  src={OFFICIAL_AUTHOR_PORTRAIT}
                  alt="Foto Oficial"
                  className="w-7 h-7 rounded-lg object-cover border border-gold-400"
                />
                <div className="text-left">
                  <span className="block font-semibold">Foto oficial enviada</span>
                  <span className="text-[10px] text-stone-400 font-normal">Retrato original</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 bg-gold-100 dark:bg-gold-950/80 px-2 py-0.5 rounded-full flex items-center">
                <Check className="w-3 h-3 mr-0.5" /> Activa
              </span>
            </button>

            {/* Upload from device with auto compression */}
            <div className="space-y-2">
              <label className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                <Camera className="w-3.5 h-3.5 text-gold-400" />
                <span>{uploading ? 'Procesando...' : 'Subir otra foto desde dispositivo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-stone-500">
                  O pegar URL directa:
                </label>
                <input
                  type="url"
                  value={profile.photoUrl}
                  onChange={(e) => setProfile({ ...profile, photoUrl: e.target.value })}
                  placeholder="https://ejemplo.com/mifoto.jpg"
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Texts Column */}
          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="JULIAN CAMILO"
                  className="w-full p-2.5 text-sm font-semibold border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Título Profesional / Vocación
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  placeholder="Analista Político & Columnista Editorial"
                  className="w-full p-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                Lema Personal Editorial
              </label>
              <input
                type="text"
                value={profile.motto}
                onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                placeholder="Ideas que merecen ser leídas"
                className="w-full p-2.5 text-sm font-serif italic border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                Biografía y Presentación Principal
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={5}
                placeholder="Escribe tu trayectoria, propósito editorial y visión..."
                className="w-full p-3 text-sm font-sans text-stone-800 dark:text-stone-200 leading-relaxed border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Ciudad / Ubicación
                </label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Bogotá, Colombia"
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Correo Público de Contacto
                </label>
                <input
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                  placeholder="contacto@juliancamilo.com"
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Formación Académica (with Drag & Drop + Move Up/Down Controls) */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 gap-2">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <span>Formación Académica & Reorganización</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Arrastra los elementos por el icono de agarre o utiliza los botones de subir/bajar para cambiar su orden sin borrarlos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddEducation}
            className="px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center space-x-1.5 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Título</span>
          </button>
        </div>

        <div className="space-y-4">
          {profile.education?.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleEduDragStart(e, index)}
              onDragOver={(e) => handleEduDragOver(e, index)}
              onDrop={(e) => handleEduDrop(e, index)}
              className={`p-4 bg-[#faf9f6] dark:bg-stone-900 border rounded-xl space-y-3 relative group transition-all ${
                draggedEduIndex === index 
                  ? 'opacity-40 border-gold-500 border-dashed' 
                  : 'border-stone-200 dark:border-stone-700 hover:border-gold-400/50'
              }`}
            >
              {/* Top toolbar: Drag Handle + Move Up/Down + Position Badge + Delete */}
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span 
                    className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-grab active:cursor-grabbing"
                    title="Arrastra para mover la posición"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gold-100 dark:bg-gold-950/80 text-gold-800 dark:text-gold-300">
                    Posición #{index + 1}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveEducation(index, 'up')}
                    className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Subir de posición"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={index === (profile.education?.length || 1) - 1}
                    onClick={() => handleMoveEducation(index, 'down')}
                    className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Bajar de posición"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(item.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors ml-2"
                    title="Eliminar este título"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Título / Grado Académico
                  </label>
                  <input
                    type="text"
                    value={item.degree}
                    onChange={(e) => handleUpdateEducation(item.id, 'degree', e.target.value)}
                    placeholder="Ej. Pregrado en Ciencia Política"
                    className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Año / Período
                  </label>
                  <input
                    type="text"
                    value={item.year || ''}
                    onChange={(e) => handleUpdateEducation(item.id, 'year', e.target.value)}
                    placeholder="Ej. 2018 - 2022"
                    className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Institución Educativa
                </label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => handleUpdateEducation(item.id, 'institution', e.target.value)}
                  placeholder="Ej. Universidad Nacional de Colombia"
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Descripción / Énfasis
                </label>
                <input
                  type="text"
                  value={item.description || ''}
                  onChange={(e) => handleUpdateEducation(item.id, 'description', e.target.value)}
                  placeholder="Énfasis en políticas públicas, teoría democrática..."
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Trayectoria Profesional (with Drag & Drop + Move Up/Down Controls) */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 gap-2">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <span>Trayectoria Profesional & Experiencia</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Reorganiza tus hitos profesionales arrastrándolos o con los controles arriba/abajo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddTrajectory}
            className="px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center space-x-1.5 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Hito</span>
          </button>
        </div>

        <div className="space-y-4">
          {profile.trajectory?.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleTrajDragStart(e, index)}
              onDragOver={handleTrajDragOver}
              onDrop={(e) => handleTrajDrop(e, index)}
              className={`p-4 bg-[#faf9f6] dark:bg-stone-900 border rounded-xl space-y-3 relative group transition-all ${
                draggedTrajIndex === index 
                  ? 'opacity-40 border-gold-500 border-dashed' 
                  : 'border-stone-200 dark:border-stone-700 hover:border-gold-400/50'
              }`}
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gold-100 dark:bg-gold-950/80 text-gold-800 dark:text-gold-300">
                    Hito #{index + 1}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveTrajectory(index, 'up')}
                    className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Subir posición"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === (profile.trajectory?.length || 1) - 1}
                    onClick={() => handleMoveTrajectory(index, 'down')}
                    className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Bajar posición"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTrajectory(item.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors ml-2"
                    title="Eliminar este hito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    value={item.role}
                    onChange={(e) => handleUpdateTrajectory(item.id, 'role', e.target.value)}
                    placeholder="Ej. Columnista de Opinión / Asesor"
                    className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Período
                  </label>
                  <input
                    type="text"
                    value={item.period}
                    onChange={(e) => handleUpdateTrajectory(item.id, 'period', e.target.value)}
                    placeholder="Ej. 2021 - Presente"
                    className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Entidad u Organización
                </label>
                <input
                  type="text"
                  value={item.organization}
                  onChange={(e) => handleUpdateTrajectory(item.id, 'organization', e.target.value)}
                  placeholder="Ej. Revista Editorial / Sector Público"
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Descripción de Labores
                </label>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => handleUpdateTrajectory(item.id, 'description', e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre las responsabilidades y aportes..."
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Interests Tags */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center space-x-2">
          <Tag className="w-5 h-5 text-gold-600 dark:text-gold-400" />
          <span>Líneas de Interés & Especialidad</span>
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
            placeholder="Añadir tema (ej. Filosofía Política, Gobernanza, Ética Digital)..."
            className="flex-1 p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAddInterest}
            className="px-4 py-2 rounded-lg bg-[#121212] dark:bg-stone-800 text-white text-xs font-semibold hover:bg-gold-700 transition-colors cursor-pointer"
          >
            Añadir
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {profile.interests?.map((interest, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-full text-xs font-medium flex items-center space-x-1.5"
            >
              <span>{interest}</span>
              <button
                type="button"
                onClick={() => handleDeleteInterest(interest)}
                className="text-stone-400 hover:text-rose-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 5. Redes Sociales */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 gap-2">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <span>Redes Sociales y Canales de Comunicación</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Conecta todas tus plataformas públicas para que tus lectores y la ciudadanía te encuentren y sigan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCustomLink}
            className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-gold-50 dark:hover:bg-gold-950/40 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-gold-600" />
            <span>Añadir Enlace Adicional</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
          {/* Instagram */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Instagram className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
              Instagram
            </label>
            <input
              type="url"
              value={profile.socialLinks?.instagram || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, instagram: e.target.value }
              })}
              placeholder="https://instagram.com/usuario"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* X / Twitter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Twitter className="w-3.5 h-3.5 mr-1.5 text-stone-900 dark:text-stone-100" />
              X (Twitter)
            </label>
            <input
              type="url"
              value={profile.socialLinks?.twitter || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, twitter: e.target.value }
              })}
              placeholder="https://x.com/usuario"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* Facebook */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Facebook className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Facebook
            </label>
            <input
              type="url"
              value={profile.socialLinks?.facebook || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, facebook: e.target.value }
              })}
              placeholder="https://facebook.com/usuario"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Linkedin className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
              LinkedIn
            </label>
            <input
              type="url"
              value={profile.socialLinks?.linkedin || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, linkedin: e.target.value }
              })}
              placeholder="https://linkedin.com/in/usuario"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* YouTube */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Youtube className="w-3.5 h-3.5 mr-1.5 text-red-600" />
              YouTube
            </label>
            <input
              type="url"
              value={profile.socialLinks?.youtube || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, youtube: e.target.value }
              })}
              placeholder="https://youtube.com/@canal"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* TikTok */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Video className="w-3.5 h-3.5 mr-1.5 text-stone-900 dark:text-stone-100" />
              TikTok
            </label>
            <input
              type="url"
              value={profile.socialLinks?.tiktok || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, tiktok: e.target.value }
              })}
              placeholder="https://tiktok.com/@usuario"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* Threads */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <AtSign className="w-3.5 h-3.5 mr-1.5 text-stone-900 dark:text-stone-100" />
              Threads
            </label>
            <input
              type="url"
              value={profile.socialLinks?.threads || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, threads: e.target.value }
              })}
              placeholder="https://threads.net/@usuario"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              WhatsApp
            </label>
            <input
              type="url"
              value={profile.socialLinks?.whatsapp || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, whatsapp: e.target.value }
              })}
              placeholder="https://wa.me/573000000000"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* Telegram */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <TelegramIcon className="w-3.5 h-3.5 mr-1.5 text-sky-500" />
              Telegram
            </label>
            <input
              type="url"
              value={profile.socialLinks?.telegram || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, telegram: e.target.value }
              })}
              placeholder="https://t.me/canal"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* Substack */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <BookMarked className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Substack / Boletín
            </label>
            <input
              type="url"
              value={profile.socialLinks?.substack || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, substack: e.target.value }
              })}
              placeholder="https://usuario.substack.com"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* Spotify */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Headphones className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Spotify / Podcast
            </label>
            <input
              type="url"
              value={profile.socialLinks?.podcast || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, podcast: e.target.value }
              })}
              placeholder="https://open.spotify.com/show/..."
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>

          {/* Sitio Web */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center">
              <Globe className="w-3.5 h-3.5 mr-1.5 text-stone-700 dark:text-stone-300" />
              Sitio Web Externo
            </label>
            <input
              type="url"
              value={profile.socialLinks?.website || ''}
              onChange={(e) => setProfile({
                ...profile,
                socialLinks: { ...profile.socialLinks, website: e.target.value }
              })}
              placeholder="https://juliancamilo.com"
              className="w-full p-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
            />
          </div>
        </div>

        {/* Custom links */}
        {profile.socialLinks?.customLinks && profile.socialLinks.customLinks.length > 0 && (
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider block font-sans">
              Enlaces y Plataformas Personalizadas
            </span>
            <div className="space-y-2">
              {profile.socialLinks.customLinks.map((link) => (
                <div key={link.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl">
                  <div className="sm:w-1/3">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => handleUpdateCustomLink(link.id, 'label', e.target.value)}
                      placeholder="Nombre (ej. Bluesky, Twitch, Medium)"
                      className="w-full p-2 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleUpdateCustomLink(link.id, 'url', e.target.value)}
                      placeholder="https://enlace.com/tu-usuario"
                      className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomLink(link.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar este enlace"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Identidad Política Oficial del Propietario */}
      <PoliticalIdentitySection
        role="owner"
        userEmail={profile.contactEmail || 'trujillogordilooo@gmail.com'}
        userName={profile.name || 'Julian Camilo Trujillo Gordillo'}
        initialIdentity={profile.politicalIdentity}
        onIdentityUpdated={(updatedIdentity) => {
          setProfile((prev) => ({
            ...prev,
            politicalIdentity: updatedIdentity || undefined
          }));
          onRefresh();
        }}
      />
      </>
      )}

      {/* Instagram-Style Image Cropper Modal */}
      <ImageEditorModal
        isOpen={editorOpen}
        imageSrc={editorImageSrc}
        initialAspectRatio={1}
        title="Ajustar y Encuadrar Fotografía de Perfil"
        onConfirm={handleEditorConfirm}
        onCancel={() => setEditorOpen(false)}
      />
    </div>
  );
};
