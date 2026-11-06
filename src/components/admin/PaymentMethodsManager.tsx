import React, { useState } from 'react';
import { 
  Smartphone, 
  Building2, 
  CreditCard, 
  Coins, 
  QrCode, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  Trash2, 
  HelpCircle, 
  ZoomIn, 
  X,
  ExternalLink,
  ShieldCheck,
  Save,
  RefreshCw
} from 'lucide-react';
import { FinancialSettings, PaymentMethod, PaymentMethodConfig } from '../../types';
import { PhotoUploaderModal } from '../common/PhotoUploaderModal';

interface PaymentMethodsManagerProps {
  settings: FinancialSettings;
  onUpdateSettings: (newSettings: FinancialSettings) => Promise<void>;
}

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [methods, setMethods] = useState<Record<string, PaymentMethodConfig>>(
    (settings.paymentMethodsConfig as Record<string, PaymentMethodConfig>) || {}
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // QR Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Photo Uploader Modal
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [activeMethodKeyForUpload, setActiveMethodKeyForUpload] = useState<string | null>(null);

  // New Custom Method Modal
  const [addCustomModalOpen, setAddCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEntity, setCustomEntity] = useState('');
  const [customHolder, setCustomHolder] = useState('Julian Camilo');
  const [customKey, setCustomKey] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const handleToggleMethod = (key: string) => {
    setMethods(prev => {
      const current = prev[key];
      if (!current) return prev;
      return {
        ...prev,
        [key]: {
          ...current,
          enabled: !current.enabled
        }
      };
    });
  };

  const handleChangeField = (key: string, field: keyof PaymentMethodConfig, value: any) => {
    setMethods(prev => {
      const current = prev[key];
      if (!current) return prev;
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updatedSettings: FinancialSettings = {
        ...settings,
        paymentMethodsConfig: methods
      };
      await onUpdateSettings(updatedSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e) {
      console.error('Error saving payment methods:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenUploader = (methodKey: string) => {
    setActiveMethodKeyForUpload(methodKey);
    setUploaderOpen(true);
  };

  const handleUploadSuccess = (items: { url: string }[]) => {
    if (items.length > 0 && activeMethodKeyForUpload) {
      handleChangeField(activeMethodKeyForUpload, 'qrImageUrl', items[0].url);
      setUploaderOpen(false);
      setActiveMethodKeyForUpload(null);
    }
  };

  const handleAddCustomMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEntity.trim()) return;

    const key = `custom_${Date.now()}`;
    const newConfig: PaymentMethodConfig = {
      id: 'bancolombia_transfer' as any,
      name: customName.trim(),
      enabled: true,
      accountHolder: customHolder.trim() || 'Julian Camilo',
      breBKey: customKey.trim() || undefined,
      bankEntity: customEntity.trim(),
      instructions: customInstructions.trim() || `Transfiere directamente a ${customEntity.trim()}.`,
      badge: 'Personalizado',
      allowManualReference: true
    };

    setMethods(prev => ({
      ...prev,
      [key]: newConfig
    }));

    setAddCustomModalOpen(false);
    setCustomName('');
    setCustomEntity('');
    setCustomKey('');
    setCustomInstructions('');
  };

  const activeCount = Object.values(methods).filter(m => m.enabled).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Notice */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/60 text-gold-900 dark:text-gold-300 text-[11px] font-bold uppercase tracking-wider font-sans">
              Control de Recepción de Dinero
            </span>
            <span className="text-xs text-stone-400 font-sans">•</span>
            <span className={`text-xs font-bold font-sans ${activeCount > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {activeCount} {activeCount === 1 ? 'método activo' : 'métodos activos'} para el público
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 dark:text-white">
            Gestión de Métodos de Pago & Códigos QR
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans max-w-2xl">
            Activa o desactiva qué opciones de pago ven tus lectores en las páginas de Donaciones y Suscripciones. Puedes cargar y actualizar las fotografías de los códigos QR de tus billeteras (Nequi, Daviplata, Bancolombia, etc.) y configurar sus llaves Bre-B.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setAddCustomModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gold-600" />
            <span>Agregar Otro Método</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Configuración de métodos de pago guardada! Los cambios ya se reflejan en las páginas públicas de Donaciones y Suscripciones.</span>
        </div>
      )}

      {/* Grid of Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(methods).map(([key, method]) => {
          const isNequi = key === 'nequi';
          const isDaviplata = key === 'daviplata';
          const isBancolombia = key === 'bancolombia_qr';
          const isPSE = key === 'pse';
          const isCard = key === 'card';

          return (
            <div
              key={key}
              className={`rounded-3xl p-6 border transition-all relative flex flex-col justify-between ${
                method.enabled
                  ? 'bg-white dark:bg-[#18181c] border-emerald-400 dark:border-emerald-700/80 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-[#faf9f6] dark:bg-[#121214] border-stone-200 dark:border-stone-800 opacity-90'
              }`}
            >
              {/* Header: Name, entity, and Toggle Switch */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {isNequi && <span className="w-3 h-3 rounded-full bg-[#1e0034]"></span>}
                      {isDaviplata && <span className="w-3 h-3 rounded-full bg-[#e31c23]"></span>}
                      {isBancolombia && <span className="w-3 h-3 rounded-full bg-[#fdcb02]"></span>}
                      {isPSE && <Building2 className="w-4 h-4 text-blue-600" />}
                      {isCard && <CreditCard className="w-4 h-4 text-stone-600" />}

                      <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white">
                        {method.name}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                      Entidad: <strong className="text-stone-700 dark:text-stone-300">{method.bankEntity}</strong>
                      {method.badge && ` • ${method.badge}`}
                    </p>
                  </div>

                  {/* Big Toggle Switch (Active vs Inactive) */}
                  <div className="flex flex-col items-end shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleMethod(key)}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        method.enabled ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                      role="switch"
                      aria-checked={method.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          method.enabled ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-bold uppercase tracking-wider font-sans mt-1 ${
                      method.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'
                    }`}>
                      {method.enabled ? 'Habilitado' : 'Desactivado'}
                    </span>
                  </div>
                </div>

                {/* QR Visualizer & Photo Upload Slot (for Nequi, Daviplata, Bancolombia and custom) */}
                {!isPSE && !isCard && (
                  <div className="p-4 rounded-2xl bg-[#f5f3ec] dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans flex items-center space-x-1.5">
                        <QrCode className="w-3.5 h-3.5 text-gold-600" />
                        <span>Código QR de Pago</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenUploader(key)}
                        className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{method.qrImageUrl ? 'Cambiar Foto' : 'Subir Foto de QR'}</span>
                      </button>
                    </div>

                    {method.qrImageUrl ? (
                      <div className="flex items-center space-x-4">
                        <div 
                          onClick={() => setZoomedImage({ url: method.qrImageUrl!, title: method.name, subtitle: `Titular: ${method.accountHolder}` })}
                          className="w-24 h-24 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 shrink-0 cursor-pointer group relative shadow-xs"
                          title="Clic para ampliar código QR"
                        >
                          <img 
                            src={method.qrImageUrl} 
                            alt={`QR ${method.name}`} 
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="space-y-1 text-xs font-sans text-stone-600 dark:text-stone-300 flex-1">
                          <p className="font-semibold text-stone-800 dark:text-white">
                            Código QR activo
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Visible para los donantes al seleccionar {method.name}.
                          </p>
                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setZoomedImage({ url: method.qrImageUrl!, title: method.name, subtitle: `Titular: ${method.accountHolder}` })}
                              className="text-[11px] text-gold-700 dark:text-gold-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver Grande</span>
                            </button>
                            <span className="text-stone-300 dark:text-stone-700">•</span>
                            <button
                              type="button"
                              onClick={() => handleChangeField(key, 'qrImageUrl', '')}
                              className="text-[11px] text-rose-600 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Quitar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2">
                        <QrCode className="w-8 h-8 text-stone-400 mx-auto" />
                        <p className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                          Espacio disponible para colocar el código QR de {method.name}.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenUploader(key)}
                          className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-gold-500 hover:text-stone-950 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Cargar Imagen de QR</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Editable Fields for Account Data */}
                <div className="space-y-3 pt-1 text-xs font-sans">
                  {/* Titular */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      value={method.accountHolder || ''}
                      onChange={(e) => handleChangeField(key, 'accountHolder', e.target.value)}
                      placeholder="Ej. Julian Trujillo"
                      className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                    />
                  </div>

                  {/* Llave Bre-B / Número de cuenta o celular */}
                  {(isNequi || isDaviplata || method.breBKey !== undefined) && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                          Llave Bre-B (Celular o Identificador)
                        </label>
                        {method.breBKey && (
                          <button
                            type="button"
                            onClick={() => handleCopy(method.breBKey || '', key)}
                            className="text-[10px] text-gold-600 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedKey === key ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar Llave</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={method.breBKey || ''}
                        onChange={(e) => handleChangeField(key, 'breBKey', e.target.value)}
                        placeholder="Ej. 1072101045 o @PLATA3332306889"
                        className="w-full p-2.5 text-xs font-mono font-bold border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Número de cuenta (si aplica) */}
                  {isBancolombia && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                        Número de Cuenta Bancaria
                      </label>
                      <input
                        type="text"
                        value={method.accountNumber || ''}
                        onChange={(e) => handleChangeField(key, 'accountNumber', e.target.value)}
                        placeholder="Número de cuenta de ahorros o corriente"
                        className="w-full p-2.5 text-xs font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Instrucciones personalizadas */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                      Instrucciones de Transferencia para el Lector
                    </label>
                    <textarea
                      rows={2}
                      value={method.instructions || ''}
                      onChange={(e) => handleChangeField(key, 'instructions', e.target.value)}
                      placeholder="Instrucciones para transferir..."
                      className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status footer pill */}
              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] font-sans">
                <span className="text-stone-500">
                  {method.enabled ? 'Aparece en donaciones y membresías' : 'Oculto al público actualmente'}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                  method.enabled 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                }`}>
                  {method.enabled ? '✓ Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white">
            Confirmar Configuración de Pagos
          </h4>
          <p className="text-xs text-stone-500 font-sans">
            Recuerda hacer clic en guardar para aplicar los métodos activos y las fotos de los códigos QR.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Configuración de Pagos</span>
            </>
          )}
        </button>
      </div>

      {/* Full Screen QR Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-stone-200 dark:border-stone-800 relative animate-fadeIn">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pt-2">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                {zoomedImage.title}
              </h3>
              {zoomedImage.subtitle && (
                <p className="text-xs text-stone-500 font-sans">
                  {zoomedImage.subtitle}
                </p>
              )}
            </div>

            <div className="w-64 h-64 mx-auto rounded-2xl bg-white p-2 border border-stone-200 dark:border-stone-700 shadow-md">
              <img 
                src={zoomedImage.url} 
                alt="QR Ampliado" 
                className="w-full h-full object-contain" 
              />
            </div>

            <a
              href={zoomedImage.url}
              download={`${zoomedImage.title.toLowerCase().replace(/\s+/g, '_')}_qr.jpg`}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Imagen</span>
            </a>
          </div>
        </div>
      )}

      {/* Photo Uploader Modal for QR Codes */}
      <PhotoUploaderModal
        isOpen={uploaderOpen}
        onClose={() => {
          setUploaderOpen(false);
          setActiveMethodKeyForUpload(null);
        }}
        onUploadSuccess={handleUploadSuccess}
        folder="qr_codes"
        allowMultiple={false}
        title="Subir Código QR de Pago"
        subtitle="Sube la fotografía o captura del código QR de tu billetera digital (Nequi, Daviplata, Bancolombia, etc.)."
      />

      {/* Add Custom Method Modal */}
      {addCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white">
                Agregar Medio de Pago Personalizado
              </h3>
              <button
                onClick={() => setAddCustomModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomMethod} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                  Nombre del Método *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej. Dale!, Movii, Nu Colombia, Lulo Bank"
                  className="w-full p-2.5 border rounded-xl bg-[#faf9f6] dark:bg-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                  Entidad Financiera *
                </label>
                <input
                  type="text"
                  required
                  value={customEntity}
                  onChange={(e) => setCustomEntity(e.target.value)}
                  placeholder="Ej. Banco Nu, Grupo Aval, Movii"
                  className="w-full p-2.5 border rounded-xl bg-[#faf9f6] dark:bg-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={customHolder}
                  onChange={(e) => setCustomHolder(e.target.value)}
                  placeholder="Julian Camilo"
                  className="w-full p-2.5 border rounded-xl bg-[#faf9f6] dark:bg-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                  Llave Bre-B o Celular (Opcional)
                </label>
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="300 123 4567"
                  className="w-full p-2.5 border rounded-xl bg-[#faf9f6] dark:bg-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                  Instrucciones Breves
                </label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Indica cómo realizar la transferencia..."
                  className="w-full p-2.5 border rounded-xl bg-[#faf9f6] dark:bg-stone-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setAddCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 font-bold uppercase tracking-wider"
                >
                  Crear y Habilitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
