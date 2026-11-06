import React, { createContext, useContext, useEffect, useState } from 'react';

interface LightReadingContextType {
  isLightReading: boolean;
  toggleLightReading: () => void;
  setLightReading: (val: boolean) => void;
}

const LightReadingContext = createContext<LightReadingContextType>({
  isLightReading: false,
  toggleLightReading: () => {},
  setLightReading: () => {}
});

export const LightReadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLightReading, setIsLightReading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jc_light_reading_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      // Check if user has Save-Data header or slow connection
      const nav = navigator as any;
      if (nav.connection && (nav.connection.saveData || ['slow-2g', '2g'].includes(nav.connection.effectiveType))) {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isLightReading) {
      root.classList.add('light-reading');
      root.setAttribute('data-light-reading', 'true');
    } else {
      root.classList.remove('light-reading');
      root.removeAttribute('data-light-reading');
    }
    localStorage.setItem('jc_light_reading_mode', String(isLightReading));
  }, [isLightReading]);

  const toggleLightReading = () => {
    setIsLightReading((prev) => !prev);
  };

  const setLightReading = (val: boolean) => {
    setIsLightReading(val);
  };

  return (
    <LightReadingContext.Provider value={{ isLightReading, toggleLightReading, setLightReading }}>
      {children}
    </LightReadingContext.Provider>
  );
};

export const useLightReading = () => useContext(LightReadingContext);
