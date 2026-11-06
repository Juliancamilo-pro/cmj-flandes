import React, { useState } from 'react';
import {
  Users,
  Send,
  Key,
  CheckCircle,
  AlertCircle,
  Shield,
  LogIn,
  Search,
  Clock,
  XCircle,
  BookOpen,
  Feather,
  Award
} from 'lucide-react';
import {
  submitCollaboratorRequest,
  checkCollaboratorRequestStatus
} from '../../services/db';
import { CollaboratorRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { HumanVerificationWidget } from '../../components/common/HumanVerificationWidget';
import { sanitizePlainText } from '../../utils/security';

interface CollaborationPageProps {
  onNavigateToCollaboratorPanel: () => void;
}

const EDITORIAL_AREAS = [
  'Noticias y Actualidad Regional',
  'Opinión y Columnas Editoriales',
  'Análisis Político y Democracia',
  'Investigación y Datos',
  'Crónicas y Reportajes',
  'Entrevistas',
  'Fotoreportaje y Contenido Audiovisual',
  'Artículos Académicos y Cultura'
];

export const CollaborationPage: React.FC<CollaborationPageProps> = ({
  onNavigateToCollaboratorPanel
}) => {
  const { loginCollaborator } = useAuth();

  const [mode, setMode] = useState<'request' | 'status' | 'login'>('request');

  // Request form state (ONLY fullName is required; all other fields are optional)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [editorialArea, setEditorialArea] = useState('');
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [humanVerified, setHumanVerified] = useState(false);

  // Status check state
  const [statusQuery, setStatusQuery] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResults, setStatusResults] = useState<CollaboratorRequest[] | null>(null);

  // Login form state for approved collaborators
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMsg(null);

    if (!humanVerified) {
      setResultMsg({
        type: 'error',
        text: 'Por favor completa la verificación humana antes de enviar tu solicitud.'
      });
      return;
    }

    if (!fullName.trim()) {
      setResultMsg({
        type: 'error',
        text: 'El nombre completo es el único campo obligatorio para enviar tu solicitud.'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCollaboratorRequest({
        fullName: sanitizePlainText(fullName, 120),
        phone: phone.trim() ? sanitizePlainText(phone, 40) : undefined,
        email: email.trim() ? sanitizePlainText(email, 150) : undefined,
        invitationCode: invitationCode.trim() ? sanitizePlainText(invitationCode, 60) : undefined,
        editorialArea: editorialArea.trim() ? sanitizePlainText(editorialArea, 100) : undefined,
        motivation: motivation.trim() ? sanitizePlainText(motivation, 600) : undefined
      });

      if (res.success) {
        setResultMsg({ type: 'success', text: res.message });
        setFullName('');
        setPhone('');
        setEmail('');
        setInvitationCode('');
        setEditorialArea('');
        setMotivation('');
      } else {
        setResultMsg({ type: 'error', text: res.message });
      }
    } catch {
      setResultMsg({ type: 'error', text: 'Ocurrió un error al procesar tu solicitud.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusQuery.trim()) return;
    setCheckingStatus(true);
    try {
      const found = await checkCollaboratorRequestStatus(statusQuery);
      setStatusResults(found);
    } catch {
      setStatusResults([]);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCollaboratorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginCode.trim()) {
      setLoginError('Ingresa tu correo registrado y el código de acceso.');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await loginCollaborator(loginEmail, loginCode);
      if (res.success) {
        onNavigateToCollaboratorPanel();
      } else {
        setLoginError(res.message);
      }
    } catch {
      setLoginError('Error al iniciar sesión de colaborador.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      {/* Editorial Colombian Accent Top */}
      <div className="colombia-ribbon rounded-full overflow-hidden shadow-xs mb-2">
        <span className="colombia-yellow"></span>
        <span className="colombia-blue"></span>
        <span className="colombia-red"></span>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-100 dark:bg-gold-950/60 text-gold-800 dark:text-gold-300 text-xs font-semibold uppercase tracking-widest">
          <Users className="w-3.5 h-3.5" />
          <span>Red Editorial de Pensamiento · DULIMA</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#121212] dark:text-white tracking-tight">
          Colaboración Editorial
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
          Forma parte del equipo de DULIMA. Un espacio plural para periodistas, investigadores, analistas, cronistas y plumas independientes comprometidas con el Tolima, Colombia y el debate cívico.
        </p>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex justify-center">
        <div className="bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl inline-flex flex-wrap justify-center gap-1 border border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setMode('request')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'request'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs font-bold'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Solicitar Colaboración
          </button>
          <button
            type="button"
            onClick={() => setMode('status')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              mode === 'status'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs font-bold'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Consultar Estado</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs font-bold'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Acceso Colaborador Aprobado</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Request Registration */}
      {mode === 'request' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Requirements, Functions & Editorial Participation Card */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                <span>Requisitos y Proceso</span>
              </h3>

              <div className="space-y-4 text-xs text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-gold-100 dark:bg-gold-950/80 text-gold-800 dark:text-gold-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <p>
                    <strong>Postulación sencilla:</strong> Solo tu nombre completo es obligatorio. Puedes añadir correo, teléfono, área temática o código de invitación de forma opcional.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-gold-100 dark:bg-gold-950/80 text-gold-800 dark:text-gold-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <p>
                    <strong>Aprobación del propietario:</strong> Todas las solicitudes quedan en estado <em>Pendiente</em> hasta ser evaluadas y aprobadas por Julian Camilo Trujillo Gordillo.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-gold-100 dark:bg-gold-950/80 text-gold-800 dark:text-gold-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <p>
                    <strong>Permisos individualizados:</strong> Al ser aprobado, recibirás tu código de acceso al Panel de Colaborador con permisos asignados por el propietario.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white flex items-center space-x-2">
                <Feather className="w-4 h-4 text-[#9B1B30] dark:text-gold-400" />
                <span>Participación Editorial Disponible</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300 font-sans">
                <li className="flex items-start space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                  <span>Redacción de noticias, crónicas, reportajes, entrevistas y columnas de opinión.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Award className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                  <span>Firma de autor verificada y perfil público en el archivo de DULIMA.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Users className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                  <span>Creación de encuestas ciudadanas y propuestas publicitarias (según permisos habilitados).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form Card (Only fullName is required; all other fields optional) */}
          <div className="md:col-span-7 bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif font-bold text-xl text-[#121212] dark:text-white mb-2">
              Formulario de Solicitud
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Únicamente el <strong>Nombre Completo</strong> es obligatorio. Los demás campos son opcionales.
            </p>

            {resultMsg && (
              <div
                className={`p-4 rounded-xl text-xs mb-6 flex items-start space-x-2.5 ${
                  resultMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {resultMsg.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{resultMsg.text}</div>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* 1. Nombre completo (OBLIGATORIO) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                  Nombre Completo <span className="text-[#9B1B30] dark:text-rose-400">* (Obligatorio)</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. María Fernanda Gómez"
                  className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              {/* 2. Correo electrónico (OPCIONAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                    Correo Electrónico <span className="text-[10px] font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                {/* 3. Teléfono (OPCIONAL) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                    Teléfono / WhatsApp <span className="text-[10px] font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 310 555 1234"
                    className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              {/* 4. Área editorial de interés & Código de invitación (OPCIONALES) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                    Área Editorial <span className="text-[10px] font-normal">(Opcional)</span>
                  </label>
                  <select
                    value={editorialArea}
                    onChange={(e) => setEditorialArea(e.target.value)}
                    className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  >
                    <option value="">Seleccionar área...</option>
                    {EDITORIAL_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                    Código de Invitación <span className="text-[10px] font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      placeholder="Si cuentas con uno"
                      className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Breve presentación (OPCIONAL) */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                  Trayectoria o Temas a Tratar <span className="text-[10px] font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Cuéntanos brevemente sobre tu experiencia o los temas sobre los que te gustaría escribir en DULIMA..."
                  className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <HumanVerificationWidget
                formName="collaboration_request"
                onVerifiedChange={(ok) => setHumanVerified(ok)}
              />

              <button
                type="submit"
                disabled={submitting || !humanVerified}
                className="w-full py-3.5 px-6 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-gold-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Enviando solicitud...' : 'Enviar Solicitud de Colaboración'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mode 2: Check Request Status */}
      {mode === 'status' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif font-bold text-xl text-[#121212] dark:text-white">
              Consultar Estado de Solicitud
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Ingresa tu nombre completo, correo electrónico o código de seguimiento para verificar el estado de tu postulación.
            </p>
          </div>

          <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={statusQuery}
              onChange={(e) => setStatusQuery(e.target.value)}
              placeholder="Nombre, correo o código de seguimiento..."
              className="flex-1 p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
            <button
              type="submit"
              disabled={checkingStatus}
              className="px-5 py-3 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-gold-600 transition-colors cursor-pointer shrink-0"
            >
              {checkingStatus ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          {statusResults !== null && (
            <div className="space-y-3 pt-2">
              {statusResults.length === 0 ? (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                  No se encontraron solicitudes que coincidan con «{statusQuery}».
                </div>
              ) : (
                statusResults.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-[#faf9f6] dark:bg-stone-900 border border-[#e8e5dc] dark:border-stone-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif font-bold text-sm text-[#121212] dark:text-white">
                        {req.fullName}
                      </span>
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          req.status === 'aprobada'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : req.status === 'rechazada'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {req.status === 'aprobada' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : req.status === 'rechazada' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>
                          {req.status === 'aprobada'
                            ? 'Aprobada'
                            : req.status === 'rechazada'
                            ? 'No aprobada'
                            : 'Pendiente de aprobación'}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Enviada el {new Date(req.createdAt).toLocaleDateString('es-CO')} · Seguimiento:{' '}
                      <span className="font-mono">{req.id.slice(0, 8).toUpperCase()}</span>
                    </p>
                    {req.notes && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 p-2.5 rounded-lg border border-stone-200/70 dark:border-stone-700">
                        <strong>Nota editorial:</strong> {req.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Approved Collaborator Login */}
      {mode === 'login' && (
        <div className="max-w-md mx-auto bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif font-bold text-xl text-[#121212] dark:text-white">
              Ingreso de Colaborador
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Si tu solicitud ya fue aprobada por el propietario, ingresa con tu correo y código de acceso.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleCollaboratorLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                Código de Acceso
              </label>
              <input
                type="text"
                required
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="Ej. COL-1234"
                className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 px-6 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-gold-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? 'Verificando...' : 'Ingresar al Panel Editorial'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
