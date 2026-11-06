import React, { useState } from 'react';
import { GalleryImage } from '../../types';
import { Maximize2, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryViewerProps {
  images: GalleryImage[];
  title?: string;
  className?: string;
}

export const PhotoGalleryViewer: React.FC<PhotoGalleryViewerProps> = ({
  images,
  title = 'Galería Fotográfica',
  className = ''
}) => {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setModalIndex(index);
  };

  const closeLightbox = () => {
    setModalIndex(null);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (modalIndex !== null) {
      setModalIndex((modalIndex + 1) % images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (modalIndex !== null) {
      setModalIndex((modalIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <section className={`my-8 space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
        <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-gold-600 dark:text-gold-400" />
          <span>{title}</span>
        </h4>
        <span className="text-xs font-sans text-stone-500 dark:text-stone-400">
          {images.length} {images.length === 1 ? 'fotografía' : 'fotografías'}
        </span>
      </div>

      {/* Grid Layout */}
      <div className={`grid gap-3 ${
        images.length === 1 
          ? 'grid-cols-1' 
          : images.length === 2 
          ? 'grid-cols-1 sm:grid-cols-2' 
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
      }`}>
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => openLightbox(idx)}
            className="group relative rounded-xl overflow-hidden cursor-pointer bg-stone-900 border border-stone-200 dark:border-stone-800 aspect-4/3 shadow-xs"
          >
            <img
              src={img.url}
              alt={img.caption || `Fotografía ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs truncate font-sans text-stone-200">
                  {img.caption || `Foto ${idx + 1}`}
                </p>
                <Maximize2 className="w-4 h-4 text-gold-400 shrink-0 ml-2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Lightbox */}
      {modalIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-stone-800/80 text-white hover:bg-stone-700 transition-colors z-50 cursor-pointer"
            title="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation controls */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-stone-800/80 text-white hover:bg-gold-500 hover:text-stone-950 transition-colors z-50 cursor-pointer"
                title="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-stone-800/80 text-white hover:bg-gold-500 hover:text-stone-950 transition-colors z-50 cursor-pointer"
                title="Siguiente foto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Active Image and Caption */}
          <div 
            className="max-w-4xl max-h-[90vh] flex flex-col items-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[modalIndex].url}
              alt=""
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="text-center text-stone-200 space-y-1">
              {images[modalIndex].caption && (
                <p className="font-serif italic text-sm text-stone-300">
                  {images[modalIndex].caption}
                </p>
              )}
              {images[modalIndex].credit && (
                <p className="font-sans text-xs text-stone-400">
                  Crédito: {images[modalIndex].credit}
                </p>
              )}
              <p className="text-[11px] font-mono text-gold-400">
                {modalIndex + 1} de {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
