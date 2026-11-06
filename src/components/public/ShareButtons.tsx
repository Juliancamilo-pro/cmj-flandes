import React, { useState } from 'react';
import { Twitter, Facebook, Linkedin, Share2, Copy, Check, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  title,
  description = '',
  url,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  // If no URL passed, use window.location.href
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20-%20${encodedUrl}`
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled share
      }
    }
  };

  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 mr-2 flex items-center">
        <Share2 className="w-3.5 h-3.5 mr-1.5 text-gold-600" />
        Compartir:
      </span>

      {/* Twitter / X */}
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en X (Twitter)"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#111] text-white hover:bg-gold-600 hover:text-white transition-all shadow-sm"
      >
        <Twitter className="w-3.5 h-3.5" />
        <span className="font-sans">X</span>
      </a>

      {/* Facebook */}
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en Facebook"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1877f2] text-white hover:bg-[#166fe5] transition-all shadow-sm"
      >
        <Facebook className="w-3.5 h-3.5" />
        <span className="font-sans">Facebook</span>
      </a>

      {/* LinkedIn */}
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en LinkedIn"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#0a66c2] text-white hover:bg-[#095196] transition-all shadow-sm"
      >
        <Linkedin className="w-3.5 h-3.5" />
        <span className="font-sans">LinkedIn</span>
      </a>

      {/* WhatsApp */}
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en WhatsApp"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#25d366] text-white hover:bg-[#20ba59] transition-all shadow-sm"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span className="font-sans">WhatsApp</span>
      </a>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        aria-label="Copiar enlace del artículo"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 transition-all"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">¡Enlace copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-stone-500" />
            <span>Copiar enlace</span>
          </>
        )}
      </button>

      {/* Mobile Native Share if supported */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={handleNativeShare}
          className="inline-flex md:hidden items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gold-50 text-gold-800 border border-gold-300"
          aria-label="Más opciones para compartir"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Más</span>
        </button>
      )}
    </div>
  );
};
