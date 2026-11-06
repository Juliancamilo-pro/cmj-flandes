import React, { useState } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, ShieldCheck, Database, Key } from 'lucide-react';
import { PlatformSettings } from '../../types';
import { updateSettings } from '../../services/db';

interface AdminSettingsProps {
  initialSettings: PlatformSettings;
  onRefresh: () => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ initialSettings, onRefresh }) => {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateSettings(settings);
      setSuccessMsg('¡Configuración guardada exitosamente!');
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMsg('No fue posible guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-[#e5e1d5] pb-6">
        <span className="text-xs uppercase tracking-widest text-gold-600 font-bold font-sans">
          Preferencias de la Plataforma
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] mt-1">
          Configuración General
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-sans mt-0.5">
          Parámetros editoriales globales, políticas de moderación y reglas de publicación.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Editorial Branding */}
        <div className="bg-white border border-[#e8e5dc] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-lg text-[#121212] border-b border-stone-100 pb-3 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gold-600" />
            <span>Identidad & Marca Editorial</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Nombre de la Plataforma
              </label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                required
                className="w-full p-2.5 text-xs font-bold border border-stone-200 rounded-lg bg-[#faf9f6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Lema Oficial
              </label>
              <input
                type="text"
                value={settings.siteMotto}
                onChange={(e) => setSettings({ ...settings, siteMotto: e.target.value })}
                required
                className="w-full p-2.5 text-xs font-serif italic border border-stone-200 rounded-lg bg-[#faf9f6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 font-sans">
              Correo Electrónico de Contacto
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-[#faf9f6]"
            />
          </div>
        </div>

        {/* Comment policy */}
        <div className="bg-white border border-[#e8e5dc] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-lg text-[#121212] border-b border-stone-100 pb-3">
            Políticas de Comentarios y Debate
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-[#faf9f6] rounded-xl border border-stone-200">
              <div className="pr-4">
                <span className="block text-xs font-semibold text-stone-900 font-sans">
                  Moderación Previa Obligatoria
                </span>
                <span className="text-[11px] text-stone-500 font-sans">
                  Cuando está activo, los comentarios de los visitantes requieren aprobación del autor antes de ser visibles en el artículo.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.moderationEnabled}
                onChange={(e) => setSettings({ ...settings, moderationEnabled: e.target.checked })}
                className="w-5 h-5 text-gold-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#faf9f6] rounded-xl border border-stone-200">
              <div className="pr-4">
                <span className="block text-xs font-semibold text-stone-900 font-sans">
                  Habilitar Comentarios en la Plataforma
                </span>
                <span className="text-[11px] text-stone-500 font-sans">
                  Permite o desactiva de forma global el formulario de discusión al final de cada publicación.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowCommentsGlobally}
                onChange={(e) => setSettings({ ...settings, allowCommentsGlobally: e.target.checked })}
                className="w-5 h-5 text-gold-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Security & Architecture Audit */}
        <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center space-x-2 text-gold-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-serif font-bold text-base text-white">
              Estado de Seguridad y Base de Datos
            </h3>
          </div>
          <p className="text-xs text-stone-300 font-sans leading-relaxed">
            • Base de datos: Cloud Firestore provisionado activamente.
            <br />
            • Reglas de seguridad: `firestore.rules` desplegadas bajo arquitectura Zero-Trust.
            <br />
            • Autenticación: Firebase Authentication restringido al propietario autorizado (`trujillogordilooo@gmail.com`).
            <br />
            • Registro público desactivado.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#121212] hover:bg-gold-700 text-white font-sans text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4 text-gold-400" />
            <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
