import React from 'react';
import { 
  Lock, 
  ArrowUp, 
  Twitter, 
  Linkedin, 
  BookMarked, 
  Mail, 
  ShieldCheck,
  Instagram,
  Facebook,
  Youtube,
  MessageSquare,
  Headphones,
  AtSign,
  Video,
  Globe,
  Send as TelegramIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Newsletter } from './Newsletter';
import { Profile } from '../../types';
import { TolimaColombianBadge } from '../common/TolimaColombianBadge';
import { DulimaLogo } from '../common/DulimaLogo';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  categories: { id: string; name: string; slug: string }[];
  profile?: Profile | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, categories, profile }) => {
  const { isAdmin } = useAuth();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socials = profile?.socialLinks;

  return (
    <footer className="bg-[#111111] text-[#e5e5e3] border-t border-[#262626] mt-24">
      {/* Decorative top gold line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent w-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Brand & Motto */}
          <div className="md:col-span-4 space-y-4">
            <DulimaLogo variant="horizontal" tone="light" showSlogan={true} />
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
              Medio digital independiente con identidad tolimense y vocación nacional e internacional. Fundado y dirigido por {profile?.name || 'Julian Camilo Trujillo Gordillo'}.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {socials?.instagram && (
                <a 
                  href={socials.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-rose-400 hover:border-rose-500 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.twitter && (
                <a 
                  href={socials.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-gold-400 hover:border-gold-500 transition-colors"
                  aria-label="X / Twitter"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.facebook && (
                <a 
                  href={socials.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-blue-400 hover:border-blue-500 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.linkedin && (
                <a 
                  href={socials.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-blue-400 hover:border-blue-500 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.youtube && (
                <a 
                  href={socials.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-red-400 hover:border-red-500 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.tiktok && (
                <a 
                  href={socials.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-stone-100 hover:border-stone-400 transition-colors"
                  aria-label="TikTok"
                >
                  <Video className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.threads && (
                <a 
                  href={socials.threads} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-stone-100 hover:border-stone-400 transition-colors"
                  aria-label="Threads"
                >
                  <AtSign className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.whatsapp && (
                <a 
                  href={socials.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-emerald-400 hover:border-emerald-500 transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.telegram && (
                <a 
                  href={socials.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-sky-400 hover:border-sky-500 transition-colors"
                  aria-label="Telegram"
                >
                  <TelegramIcon className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.substack && (
                <a 
                  href={socials.substack} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-amber-400 hover:border-amber-500 transition-colors"
                  aria-label="Substack"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.podcast && (
                <a 
                  href={socials.podcast} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-emerald-400 hover:border-emerald-500 transition-colors"
                  aria-label="Podcast"
                >
                  <Headphones className="w-3.5 h-3.5" />
                </a>
              )}
              {socials?.website && (
                <a 
                  href={socials.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-gold-400 hover:border-gold-500 transition-colors"
                  aria-label="Sitio Web"
                >
                  <Globe className="w-3.5 h-3.5" />
                </a>
              )}
              <button 
                onClick={() => onNavigate('contact')}
                className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-stone-300 hover:text-gold-400 hover:border-gold-500 transition-colors"
                aria-label="Contacto por Correo"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Newsletter Column in Footer */}
          <div className="md:col-span-4 bg-[#181818] border border-[#292929] rounded-2xl p-5">
            <Newsletter variant="footer" />
          </div>

          {/* Editorial Pillars */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-sans font-semibold text-stone-300">
              Líneas
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-400 font-serif">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onNavigate('articles', cat.slug);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-gold-400 transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Navigation & Back to Top */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-sans font-semibold text-stone-300">
              Navegación
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-400 font-sans">
              <li>
                <button onClick={() => { onNavigate('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-gold-400 transition-colors">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-gold-400 transition-colors">
                  Sobre DULIMA
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('articles'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#f2c94c] transition-colors cursor-pointer">
                  Artículos y Publicaciones
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('encuestas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#f2c94c] transition-colors cursor-pointer">
                  Encuestas Ciudadanas
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('live'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#f2c94c] transition-colors cursor-pointer">
                  DULIMA LIVE
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('donations'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[#f2c94c] font-semibold hover:underline transition-colors flex items-center space-x-1 cursor-pointer">
                  <span>Apoyar (Donaciones)</span>
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('collaboration'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-gold-400 transition-colors">
                  Colaboración
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-gold-400 transition-colors">
                  Contacto
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => { onNavigate('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex items-center space-x-1 text-[11px] text-stone-400 hover:text-gold-400 transition-colors"
                >
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-gold-400" />
                      <span className="text-gold-400 font-medium">Escritorio</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-stone-500" />
                      <span>Acceso Autor</span>
                    </>
                  )}
                </button>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={scrollToTop}
                className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider text-stone-400 hover:text-white transition-colors bg-[#1a1a1a] hover:bg-[#222] py-1.5 px-2.5 rounded border border-[#333]"
              >
                <span>Arriba</span>
                <ArrowUp className="w-3 h-3 text-gold-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <TolimaColombianBadge variant="banner" />
        </div>

        {/* Bottom copyright & attribution */}
        <div className="border-t border-[#222222] mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} DULIMA — Plataforma Editorial. Todos los derechos reservados.
          </div>
          <div className="text-stone-400 text-center sm:text-right">
            Medio digital independiente • Tolima · Colombia
          </div>
        </div>
      </div>
    </footer>
  );
};
