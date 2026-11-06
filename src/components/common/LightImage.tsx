import React, { useState } from 'react';
import { Eye, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useLightReading } from '../../context/LightReadingContext';

interface LightImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
}

export const LightImage: React.FC<LightImageProps> = ({
  src,
  alt,
  caption,
  className = 'w-full h-auto object-cover',
  priority = false,
  aspectRatio
}) => {
  const { isLightReading } = useLightReading();
  const [userLoaded, setUserLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // If normal mode or user explicitly requested to view this picture
  if (!isLightReading || userLoaded) {
    return (
      <figure className="space-y-2">
        <div className={`overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800 ${aspectRatio || ''}`}>
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={className}
            onError={() => setImageError(true)}
          />
        </div>
        {caption && (
          <figcaption className="text-xs text-stone-500 dark:text-stone-400 font-sans italic text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Light Reading Placeholder (Data Saver)
  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl border border-dashed border-gold-300 dark:border-stone-700 bg-gold-50/40 dark:bg-stone-900/40 text-center space-y-3">
      <div className="flex items-center justify-center space-x-2 text-gold-700 dark:text-gold-400">
        <ImageIcon className="w-5 h-5 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider font-sans">
          Fotografía en pausa (Modo Ligero / Ahorro de Datos)
        </span>
      </div>

      <p className="text-xs text-stone-600 dark:text-stone-300 font-sans max-w-md mx-auto">
        {caption || alt || 'Imagen editorial de acompañamiento.'}
      </p>

      <div className="pt-1 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setUserLoaded(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-900 dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold hover:bg-gold-600 dark:hover:bg-gold-400 transition-colors shadow-xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-gold-400 dark:text-stone-950" />
          <span>Cargar fotografía</span>
          <span className="text-[10px] opacity-75 font-mono">(~45 KB)</span>
        </button>
      </div>
    </div>
  );
};
