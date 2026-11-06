import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilitySettings, ColorBlindnessMode } from '../types';

export const ACCESSIBILITY_STORAGE_KEY = 'jc_accessibility_settings';

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  colorBlindness: 'normal',
  highContrast: false,
  softContrast: false,
  textSize: 'normal',
  shapeIndicators: true,
  reduceMotion: false,
  underlineLinks: false
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (patch: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  settings: DEFAULT_ACCESSIBILITY_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  isModalOpen: false,
  setIsModalOpen: () => {}
});

const COLOR_BLINDNESS_MATRICES: Record<ColorBlindnessMode, string> = {
  normal: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0',
  // Daltonization / high-separation matrices for Protanopia, Deuteranopia, and Tritanopia
  protanopia: '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
  deuteranopia: '0.625 0.375 0 0 0  0.700 0.300 0 0 0  0 0.300 0.700 0 0  0 0 0 1 0',
  tritanopia: '0.950 0.050 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0'
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
        if (raw) {
          return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...JSON.parse(raw) };
        }
      } catch (e) {}
    }
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}

    const root = document.documentElement;
    root.setAttribute('data-color-blindness', settings.colorBlindness);
    root.setAttribute('data-text-size', settings.textSize);
    root.classList.toggle('a11y-high-contrast', settings.highContrast);
    root.classList.toggle('a11y-soft-contrast', settings.softContrast && !settings.highContrast);
    root.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
    root.classList.toggle('a11y-underline-links', settings.underlineLinks);
    root.classList.toggle('a11y-shape-indicators', settings.shapeIndicators);
  }, [settings]);

  const updateSettings = (patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Ensure highContrast and softContrast are mutually exclusive
      if (patch.highContrast === true) next.softContrast = false;
      if (patch.softContrast === true) next.highContrast = false;
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    try {
      localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY);
    } catch (e) {}
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isModalOpen,
        setIsModalOpen
      }}
    >
      {/* Hidden SVG Color-Blindness Filter Definition */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter id="jc-colorblind-filter">
            <feColorMatrix
              type="matrix"
              values={COLOR_BLINDNESS_MATRICES[settings.colorBlindness]}
            />
          </filter>
        </defs>
      </svg>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
