import React from 'react';
import { Video, ExternalLink } from 'lucide-react';

interface VideoEmbedProps {
  url: string;
  title?: string;
  caption?: string;
  posterUrl?: string;
  className?: string;
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({
  url,
  title,
  caption,
  posterUrl,
  className = ''
}) => {
  if (!url) return null;

  // Transform YouTube / Vimeo URLs to embed format
  const getEmbedInfo = (rawUrl: string) => {
    try {
      const cleanUrl = rawUrl.trim();

      // YouTube
      const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
        };
      }

      // Vimeo
      const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/)(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return {
          type: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0`
        };
      }

      // Direct MP4 / WebM / OGG video file
      if (/\.(mp4|webm|ogg)($|\?)/i.test(cleanUrl)) {
        return {
          type: 'direct',
          embedUrl: cleanUrl
        };
      }

      // If already an embed or iframe URL
      if (cleanUrl.startsWith('http')) {
        return {
          type: 'iframe',
          embedUrl: cleanUrl
        };
      }
    } catch (e) {
      console.warn('Error parsing video URL:', e);
    }

    return null;
  };

  const embedInfo = getEmbedInfo(url);

  if (!embedInfo) {
    return (
      <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between">
        <span className="flex items-center space-x-2">
          <Video className="w-4 h-4 text-stone-400" />
          <span>Enlace a video externo: {title || url}</span>
        </span>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center space-x-1 text-gold-600 font-semibold hover:underline"
        >
          <span>Ver video</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <figure className={`my-8 space-y-2.5 ${className}`}>
      {title && (
        <div className="flex items-center space-x-2 text-xs font-serif font-bold text-stone-800 dark:text-stone-200">
          <span className="w-2 h-2 rounded-full bg-gold-500"></span>
          <span>{title}</span>
        </div>
      )}

      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-stone-800">
        {embedInfo.type === 'direct' ? (
          <video
            src={embedInfo.embedUrl}
            poster={posterUrl}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          >
            Tu navegador no soporta la reproducción de video HTML5.
          </video>
        ) : (
          <iframe
            src={embedInfo.embedUrl}
            title={title || 'Video editorial'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
          />
        )}
      </div>

      {caption && (
        <figcaption className="text-center font-sans text-xs text-stone-500 dark:text-stone-400 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
