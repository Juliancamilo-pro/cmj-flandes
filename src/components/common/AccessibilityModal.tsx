import React from 'react';
import {
  Eye,
  X,
  RotateCcw,
  Type,
  Contrast,
  Shapes,
  Sparkles,
  Underline,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { AccessibilitySettings, ColorBlindnessMode } from '../../types';

const COLOR_BLINDNESS_OPTIONS: {
  id: ColorBlindnessMode;
  label: string;
  desc: string;
}[] = [
  { id: 'normal', label: 'Visión estándar', desc: 'Paleta editorial original sin filtro cromático.' },
  { id: 'protanopia', label: 'Protanopia (rojo-verde)', desc: 'Compensa la baja sensibilidad al espectro rojo.' },
  { id: 'deuteranopia', label: 'Deuteranopia (verde-rojo)', desc: 'Optimiza la distinción entre tonos verdes y cálidos.' },
  { id: 'tritanopia', label: 'Tritanopia (azul-amarillo)', desc: 'Refuerza el contraste entre azules, amarillos y violetas.' }
];

export const AccessibilityModal: React.FC = () => {
  const { settings, updateSettings, resetSettings, isModalOpen, setIsModalOpen } = useAccessibility();

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
    >
      <div className="bg-[#fcfbf9] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#121212] text-white px-6 py-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 id="a11y-modal-title" className="text-lg font-serif font-bold text-white">
                Accesibilidad visual
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                Personaliza el contraste, daltonismo, tipografía y señales visuales de la plataforma
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar panel de accesibilidad visual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          {/* 1. Daltonismo */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gold-600" />
                <span>1. Adaptación para daltonismo</span>
              </h3>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                No altera fotografías editoriales
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COLOR_BLINDNESS_OPTIONS.map((opt) => {
                const active = settings.colorBlindness === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateSettings({ colorBlindness: opt.id })}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-gold-600 bg-gold-50/70 dark:bg-gold-950/30 ring-2 ring-gold-500/30'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {opt.label}
                      </span>
                      {active && <CheckCircle2 className="w-4 h-4 text-gold-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Contraste */}
          <section className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center space-x-2">
              <Contrast className="w-4 h-4 text-gold-600" />
              <span>2. Modo de contraste</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => updateSettings({ highContrast: false, softContrast: false })}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  !settings.highContrast && !settings.softContrast
                    ? 'border-gold-600 bg-gold-50/70 dark:bg-gold-950/30 font-bold'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950'
                }`}
              >
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Estándar</div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Contraste editorial equilibrado</div>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ highContrast: true, softContrast: false })}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  settings.highContrast
                    ? 'border-gold-600 bg-gold-50/70 dark:bg-gold-950/30 font-bold'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950'
                }`}
              >
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Alto contraste</div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Bordes nítidos y máxima legibilidad</div>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ softContrast: true, highContrast: false })}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  settings.softContrast
                    ? 'border-gold-600 bg-gold-50/70 dark:bg-gold-950/30 font-bold'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950'
                }`}
              >
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Contraste suave</div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Reduce el brillo para lectura prolongada</div>
              </button>
            </div>
          </section>

          {/* 3. Tamaño de texto */}
          <section className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center space-x-2">
              <Type className="w-4 h-4 text-gold-600" />
              <span>3. Tamaño de texto</span>
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'normal', label: 'Normal (100%)' },
                { id: 'large', label: 'Grande (115%)' },
                { id: 'xlarge', label: 'Extra grande (130%)' }
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => updateSettings({ textSize: sz.id as AccessibilitySettings['textSize'] })}
                  className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    settings.textSize === sz.id
                      ? 'border-gold-600 bg-gold-600 text-white'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </section>

          {/* 4. Opciones adicionales */}
          <section className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              4. Señales visuales y lectura
            </h3>
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 cursor-pointer">
                <div className="flex items-start space-x-3 pr-4">
                  <Shapes className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Indicadores por forma, ícono y etiqueta
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      Nunca depende únicamente del color en estados de pago, encuestas, insignias o alertas.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shapeIndicators}
                  onChange={(e) => updateSettings({ shapeIndicators: e.target.checked })}
                  className="w-5 h-5 accent-gold-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 cursor-pointer">
                <div className="flex items-start space-x-3 pr-4">
                  <Sparkles className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Reducir animaciones y transiciones
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      Desactiva movimientos continuos para evitar fatiga visual.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
                  className="w-5 h-5 accent-gold-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 cursor-pointer">
                <div className="flex items-start space-x-3 pr-4">
                  <Underline className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Subrayar enlaces y acciones
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      Facilita identificar enlaces dentro de artículos y menús.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.underlineLinks}
                  onChange={(e) => updateSettings({ underlineLinks: e.target.checked })}
                  className="w-5 h-5 accent-gold-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* Colombian identity note */}
          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center space-x-3 text-xs text-stone-600 dark:text-stone-300">
            <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0" />
            <span>
              Los distintivos colombianos y las insignias de verificación mantienen su identidad reconocible con etiquetas textuales e íconos geométricos claros.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-100 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetSettings}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer configuración original</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Guardar y cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
