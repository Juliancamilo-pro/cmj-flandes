import React from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  Tag, 
  Mail, 
  MapPin, 
  Twitter, 
  Linkedin, 
  BookMarked, 
  Globe, 
  Compass, 
  Send,
  Calendar,
  Instagram,
  Facebook,
  Youtube,
  MessageSquare,
  Headphones,
  AtSign,
  Video,
  Link2,
  ExternalLink
} from 'lucide-react';
import { Profile } from '../../types';
import { DulimaLogo } from '../../components/common/DulimaLogo';
import { OwnerVerifiedBadge } from '../../components/common/OwnerVerifiedBadge';
import { PoliticalIdentityBadges } from '../../components/common/PoliticalOrgLogo';

const EDITORIAL_PRINCIPLES = [
  {
    number: '01',
    title: 'Independencia',
    description: 'Criterio editorial autónomo frente a poderes políticos, económicos o partidistas.'
  },
  {
    number: '02',
    title: 'Veracidad',
    description: 'Contraste riguroso de hechos, datos y fuentes documentales antes de cada publicación.'
  },
  {
    number: '03',
    title: 'Responsabilidad',
    description: 'Compromiso ético con el impacto público de cada información, análisis o columna.'
  },
  {
    number: '04',
    title: 'Pluralismo',
    description: 'Apertura democrática a diversas voces, regiones y perspectivas del debate ciudadano.'
  },
  {
    number: '05',
    title: 'Transparencia',
    description: 'Claridad en las fuentes, rectificaciones oportunas y separación entre información y opinión.'
  },
  {
    number: '06',
    title: 'Libertad de expresión',
    description: 'Defensa firme del pensamiento crítico y la deliberación pública sin censura.'
  },
  {
    number: '07',
    title: 'Derecho a la información',
    description: 'Servicio a la ciudadanía del Tolima, Colombia y el mundo con información accesible y oportuna.'
  }
];

interface AboutPageProps {
  profile: Profile;
  onNavigate: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ profile, onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Sección Institucional: Sobre DULIMA */}
      <section className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eeeae1] dark:border-stone-800 pb-6">
          <DulimaLogo variant="horizontal" showSlogan={true} />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9B1B30] dark:text-[#F2C94C] font-sans">
            Identidad Editorial · Tolima & Colombia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-7 space-y-4 font-sans text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white">
              Sobre DULIMA
            </h2>
            <p>
              <strong>DULIMA</strong> es un medio digital independiente nacido en el departamento del Tolima con vocación nacional e internacional. Su nombre rinde homenaje respetuoso a la memoria histórica de la Cacica Dulima y a la herencia cultural pijao, símbolo de dignidad, territorio y palabra libre.
            </p>
            <p>
              Combinamos la sobriedad del periodismo de análisis con una identidad regional viva —inspirada en los colores vinotinto y oro del Tolima y el Nevado del Tolima— para ofrecer noticias, investigación, opinión, crónica y debate público de alta calidad.
            </p>
          </div>

          <div className="md:col-span-5 p-5 rounded-2xl bg-[#fbf9f4] dark:bg-[#23211f] border border-[#e8e5dc] dark:border-stone-800 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9B1B30] dark:text-[#F2C94C]">
              Dirección & Fundación
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                Julian Camilo Trujillo Gordillo
              </h3>
              <OwnerVerifiedBadge size="md" />
              <PoliticalIdentityBadges identity={profile.politicalIdentity} size="sm" />
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Fundador, propietario y director editorial de DULIMA. Responsable de la línea editorial, la curaduría de investigaciones y la independencia del medio.
            </p>
          </div>
        </div>

        {/* 7 Principios Editoriales */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 font-sans">
            Nuestros 7 Principios Editoriales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EDITORIAL_PRINCIPLES.map((p) => (
              <div
                key={p.number}
                className="p-4 rounded-xl bg-[#fcfbf9] dark:bg-[#151517] border border-[#e8e5dc] dark:border-stone-800 space-y-1.5"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-[#9B1B30] dark:text-[#F2C94C]">
                    {p.number}
                  </span>
                  <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                    {p.title}
                  </h4>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Header & Portrait del Fundador */}
      <section className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-12 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Portrait Photo */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-2xl overflow-hidden border-4 border-white dark:border-stone-800 shadow-xl bg-stone-100 dark:bg-stone-800">
              <img
                src={profile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'}
                alt={profile.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            {profile.location && (
              <div className="flex items-center space-x-1.5 text-xs text-stone-500 dark:text-stone-400 font-sans mt-4">
                <MapPin className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Identity & Presentation */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9B1B30] dark:text-[#F2C94C] font-sans">
                Fundador & Director Editorial
              </span>
              <div className="flex flex-wrap items-center gap-2.5 mt-1">
                <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
                  {profile.name || 'Julian Camilo Trujillo Gordillo'}
                </h1>
                <OwnerVerifiedBadge size="lg" />
                <PoliticalIdentityBadges identity={profile.politicalIdentity} size="md" />
              </div>
              <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base font-sans font-medium mt-1">
                {profile.title}
              </p>
            </div>

            <div className="p-4 bg-[#fbf9f4] dark:bg-[#252422] border-l-4 border-gold-500 rounded-r-lg">
              <p className="font-serif italic text-base sm:text-lg text-stone-900 dark:text-gold-200 leading-snug">
                "{profile.motto || 'Ideas que merecen ser leídas'}"
              </p>
            </div>

            <div className="prose prose-stone text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed space-y-3 font-sans">
              <p className="whitespace-pre-line">
                {profile.bio}
              </p>
            </div>

            {/* Social / Contact Links */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-2.5">
              {profile.contactEmail && (
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-gold-50 hover:text-gold-800 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-gold-600" />
                  <span>{profile.contactEmail}</span>
                </a>
              )}

              {profile.socialLinks?.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-rose-600" />
                  <span>Instagram</span>
                </a>
              )}

              {profile.socialLinks?.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-gold-50 hover:text-gold-800 transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5 text-stone-800" />
                  <span>X / Twitter</span>
                </a>
              )}

              {profile.socialLinks?.facebook && (
                <a
                  href={profile.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  <span>Facebook</span>
                </a>
              )}

              {profile.socialLinks?.linkedin && (
                <a
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-700" />
                  <span>LinkedIn</span>
                </a>
              )}

              {profile.socialLinks?.youtube && (
                <a
                  href={profile.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  <span>YouTube</span>
                </a>
              )}

              {profile.socialLinks?.tiktok && (
                <a
                  href={profile.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-stone-900" />
                  <span>TikTok</span>
                </a>
              )}

              {profile.socialLinks?.threads && (
                <a
                  href={profile.socialLinks.threads}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors"
                >
                  <AtSign className="w-3.5 h-3.5 text-stone-900" />
                  <span>Threads</span>
                </a>
              )}

              {profile.socialLinks?.whatsapp && (
                <a
                  href={profile.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              )}

              {profile.socialLinks?.telegram && (
                <a
                  href={profile.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  <span>Telegram</span>
                </a>
              )}

              {profile.socialLinks?.substack && (
                <a
                  href={profile.socialLinks.substack}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                >
                  <BookMarked className="w-3.5 h-3.5 text-amber-600" />
                  <span>Substack</span>
                </a>
              )}

              {profile.socialLinks?.podcast && (
                <a
                  href={profile.socialLinks.podcast}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Podcast</span>
                </a>
              )}

              {profile.socialLinks?.website && (
                <a
                  href={profile.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-gold-50 hover:text-gold-800 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-gold-600" />
                  <span>Sitio Web</span>
                </a>
              )}

              {profile.socialLinks?.customLinks?.map((custom) => (
                custom.url && (
                  <a
                    key={custom.id}
                    href={custom.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-gold-50 hover:text-gold-800 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-gold-600" />
                    <span>{custom.label || 'Enlace'}</span>
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Formación Académica */}
      <section className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-[#eeeae1] dark:border-stone-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-stone-800 border border-gold-200 dark:border-stone-700 flex items-center justify-center text-gold-700 dark:text-gold-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
              Formación Académica
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Estudios universitarios y especializaciones
            </p>
          </div>
        </div>

        {profile.education && profile.education.length > 0 ? (
          <div className="space-y-6">
            {profile.education.map((item) => (
              <div key={item.id} className="relative pl-6 border-l-2 border-gold-400 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                    {item.degree}
                  </h3>
                  {item.year && (
                    <span className="text-xs font-semibold text-gold-700 dark:text-gold-400 font-sans bg-gold-50 dark:bg-stone-800 px-2.5 py-0.5 rounded-full border border-gold-200 dark:border-stone-700 w-fit">
                      {item.year}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 font-sans">
                  {item.institution}
                </p>
                {item.description && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans leading-relaxed pt-1">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 dark:text-stone-400 text-sm font-sans italic">
            Información académica pendiente de configuración por el autor.
          </p>
        )}
      </section>

      {/* Trayectoria Profesional y Opinión */}
      <section className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-[#eeeae1] dark:border-stone-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-stone-800 border border-gold-200 dark:border-stone-700 flex items-center justify-center text-gold-700 dark:text-gold-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
              Trayectoria & Experiencia
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Hitos profesionales, análisis y participación pública
            </p>
          </div>
        </div>

        {profile.trajectory && profile.trajectory.length > 0 ? (
          <div className="space-y-6">
            {profile.trajectory.map((item) => (
              <div key={item.id} className="relative pl-6 border-l-2 border-stone-800 dark:border-gold-500 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                    {item.role}
                  </h3>
                  {item.period && (
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300 font-sans bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 w-fit flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-gold-600 dark:text-gold-400" />
                      {item.period}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 font-sans">
                  {item.organization}
                </p>
                {item.description && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans leading-relaxed pt-1">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 dark:text-stone-400 text-sm font-sans italic">
            Trayectoria pendiente de configuración por el autor.
          </p>
        )}
      </section>

      {/* Áreas de Interés y Enfoque */}
      {profile.interests && profile.interests.length > 0 && (
        <section className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-[#eeeae1] dark:border-stone-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-stone-800 border border-gold-200 dark:border-stone-700 flex items-center justify-center text-gold-700 dark:text-gold-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
                Líneas de Investigación e Intereses
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Temas centrales de estudio, debate e impacto social
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {profile.interests.map((interest, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-[#f6f4ee] dark:bg-stone-800 border border-[#e2ded2] dark:border-stone-700 text-stone-800 dark:text-stone-200 font-sans text-xs font-medium rounded-full flex items-center space-x-1.5 shadow-xs"
              >
                <Tag className="w-3 h-3 text-gold-600 dark:text-gold-400" />
                <span>{interest}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Contact Call to Action */}
      <section className="bg-[#121212] dark:bg-[#191816] text-white border border-stone-800 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-2xl font-serif font-bold text-white">
            ¿Deseas proponer un debate o contactar a Julian Camilo?
          </h3>
          <p className="text-stone-400 text-sm font-sans max-w-xl">
            Disponible para columnas invitadas, paneles de discusión, consultoría y comentarios sobre política pública.
          </p>
        </div>
        <button
          onClick={() => onNavigate('contact')}
          className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 font-sans text-xs uppercase tracking-wider font-bold transition-all shrink-0 inline-flex items-center space-x-2 shadow-lg"
        >
          <Send className="w-4 h-4" />
          <span>Enviar Mensaje</span>
        </button>
      </section>
    </div>
  );
};
