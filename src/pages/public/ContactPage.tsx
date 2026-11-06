import React, { useState } from 'react';
import { 
  Mail, 
  MapPin, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Twitter, 
  Linkedin, 
  BookMarked, 
  Globe,
  Instagram,
  Facebook,
  Youtube,
  MessageSquare,
  Headphones,
  AtSign,
  Video,
  ExternalLink
} from 'lucide-react';
import { Profile } from '../../types';
import { sendContactMessage } from '../../services/db';
import { HumanVerificationWidget } from '../../components/common/HumanVerificationWidget';
import { sanitizePlainText, checkFormRateLimit } from '../../utils/security';

interface ContactPageProps {
  profile: Profile;
}

export const ContactPage: React.FC<ContactPageProps> = ({ profile }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanVerified, setHumanVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!humanVerified) {
      setError('Por favor completa la verificación humana antes de enviar tu mensaje.');
      return;
    }

    const rate = checkFormRateLimit('contact_form', 8000);
    if (!rate.allowed) {
      setError(`Por favor espera ${rate.waitSeconds} segundos antes de enviar otro mensaje.`);
      return;
    }

    const cleanName = sanitizePlainText(name, 100);
    const cleanEmail = sanitizePlainText(email, 150);
    const cleanSubject = sanitizePlainText(subject, 160);
    const cleanMessage = sanitizePlainText(message, 4000);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setSubmitting(true);
    try {
      await sendContactMessage({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject || 'Consulta desde DULIMA',
        message: cleanMessage
      });

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('No fue posible enviar tu mensaje en este momento. Por favor intenta más tarde o escribe directamente al correo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-[#e5e1d5] dark:border-stone-800 pb-8 space-y-3">
        <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-semibold font-sans">
          <Mail className="w-4 h-4" />
          <span>Canal de Comunicación</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
          Contacto & Colaboraciones
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base font-sans max-w-2xl leading-relaxed">
          Para propuestas de debate, conferencias, invitaciones a medios o intercambio de ideas, utiliza el formulario directo o los canales institucionales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Contact Info & Socials */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
              Información de Contacto
            </h2>

            <div className="space-y-4 text-sm font-sans">
              {profile.contactEmail && (
                <div className="flex items-start space-x-3 text-stone-700 dark:text-stone-300">
                  <div className="w-8 h-8 rounded-lg bg-gold-50 dark:bg-stone-800 border border-gold-200 dark:border-stone-700 flex items-center justify-center text-gold-700 dark:text-gold-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-stone-400 dark:text-stone-500 font-semibold">Correo Electrónico</span>
                    <a href={`mailto:${profile.contactEmail}`} className="text-stone-900 dark:text-white font-medium hover:text-gold-700 dark:hover:text-gold-400">
                      {profile.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {profile.location && (
                <div className="flex items-start space-x-3 text-stone-700 dark:text-stone-300">
                  <div className="w-8 h-8 rounded-lg bg-gold-50 dark:bg-stone-800 border border-gold-200 dark:border-stone-700 flex items-center justify-center text-gold-700 dark:text-gold-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-stone-400 dark:text-stone-500 font-semibold">Ubicación</span>
                    <span className="text-stone-900 dark:text-white font-medium">{profile.location}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 font-sans block">
                Redes y Canales Oficiales
              </span>
              <div className="flex flex-col space-y-2 text-xs font-semibold">
                {profile.socialLinks?.instagram && (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-rose-700 transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-rose-600" />
                    <span>Instagram</span>
                  </a>
                )}
                {profile.socialLinks?.twitter && (
                  <a
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-gold-700 transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-stone-800" />
                    <span>X (Twitter)</span>
                  </a>
                )}
                {profile.socialLinks?.facebook && (
                  <a
                    href={profile.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-blue-700 transition-colors"
                  >
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span>Facebook</span>
                  </a>
                )}
                {profile.socialLinks?.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-blue-800 transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-blue-700" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.socialLinks?.youtube && (
                  <a
                    href={profile.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-red-700 transition-colors"
                  >
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>YouTube</span>
                  </a>
                )}
                {profile.socialLinks?.tiktok && (
                  <a
                    href={profile.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <Video className="w-4 h-4 text-stone-900" />
                    <span>TikTok</span>
                  </a>
                )}
                {profile.socialLinks?.threads && (
                  <a
                    href={profile.socialLinks.threads}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <AtSign className="w-4 h-4 text-stone-900" />
                    <span>Threads</span>
                  </a>
                )}
                {profile.socialLinks?.whatsapp && (
                  <a
                    href={profile.socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {profile.socialLinks?.telegram && (
                  <a
                    href={profile.socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                  >
                    <Send className="w-4 h-4 text-sky-500" />
                    <span>Telegram</span>
                  </a>
                )}
                {profile.socialLinks?.substack && (
                  <a
                    href={profile.socialLinks.substack}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-amber-700 transition-colors"
                  >
                    <BookMarked className="w-4 h-4 text-amber-600" />
                    <span>Boletín Substack</span>
                  </a>
                )}
                {profile.socialLinks?.podcast && (
                  <a
                    href={profile.socialLinks.podcast}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <Headphones className="w-4 h-4 text-emerald-600" />
                    <span>Podcast / Spotify</span>
                  </a>
                )}
                {profile.socialLinks?.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-gold-700 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-gold-600" />
                    <span>Portal Oficial</span>
                  </a>
                )}
                {profile.socialLinks?.customLinks?.map((custom) => (
                  custom.url && (
                    <a
                      key={custom.id}
                      href={custom.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2.5 p-2 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-gold-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gold-600" />
                      <span>{custom.label || 'Enlace'}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
            <h2 className="text-xl font-bold font-serif text-[#121212] dark:text-[#f3ede2]">
              Enviar Mensaje Directo
            </h2>

            {success && (
              <div className="flex items-start space-x-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm p-4 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">¡Mensaje enviado exitosamente!</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    Julian Camilo ha recibido tu comunicación y te responderá a la brevedad.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start space-x-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm p-4 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Asunto del mensaje
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Invitación a foro / Comentario sobre columna"
                className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Mensaje *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Escribe tu mensaje aquí..."
                required
                className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-[#faf9f6] dark:bg-[#252422] text-stone-900 dark:text-white placeholder-stone-400 resize-y"
              />
            </div>

            <HumanVerificationWidget
              formName="contacto_dulima"
              onVerifiedChange={setHumanVerified}
            />

            <button
              type="submit"
              disabled={submitting || !humanVerified}
              className="w-full py-3 rounded-xl bg-[#121212] dark:bg-gold-500 dark:text-stone-950 text-white hover:bg-gold-700 dark:hover:bg-gold-600 font-sans text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50 inline-flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4 text-gold-400 dark:text-stone-950" />
              <span>{submitting ? 'Enviando mensaje...' : 'Enviar Mensaje Directo'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
