import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Users,
  Download,
  Printer,
  HelpCircle,
  Send,
  Building2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { CmjDocument, CmjSession, CmjProject, PublicPageId } from '../../types/cmj.ts';

interface RendicionCuentasPageProps {
  documents: CmjDocument[];
  sessions: CmjSession[];
  projects: CmjProject[];
  onNavigate?: (page: PublicPageId) => void;
}

interface AudienciaPublica {
  id: string;
  periodo: string;
  fecha: string;
  lugar: string;
  hora: string;
  estado: 'programada' | 'concluida';
  asistentesEstimados?: number;
  compromisosGenerados: number;
  resumen: string;
  actaUrl?: string;
}

const AUDIENCIAS_DEFAULT: AudienciaPublica[] = [
  {
    id: 'aud-2025-2',
    periodo: 'Segundo Semestre 2025 / Balance Anual',
    fecha: '12 de Diciembre de 2025',
    lugar: 'Auditorio Casa de la Juventud de Flandes',
    hora: '09:00 AM',
    estado: 'concluida',
    asistentesEstimados: 85,
    compromisosGenerados: 8,
    resumen:
      'Audiencia pública abierta a la comunidad juvenil, plataformas de juventudes y veedurías ciudadanas con presencia de la Personería Municipal de Flandes.',
  },
  {
    id: 'aud-2026-1',
    periodo: 'Primer Semestre 2026 (Gestión en Curso)',
    fecha: '20 de Junio de 2026',
    lugar: 'Salón del Concejo Municipal de Flandes / Transmisión Oficial',
    hora: '10:00 AM',
    estado: 'programada',
    asistentesEstimados: 120,
    compromisosGenerados: 0,
    resumen:
      'Convocatoria formal a todas las organizaciones juveniles, personeros estudiantiles y jóvenes no organizados de Flandes para evaluar la interlocución con la Alcaldía.',
  },
];

export const RendicionCuentasPage: React.FC<RendicionCuentasPageProps> = ({
  documents,
  sessions,
  projects,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'audiencias' | 'informes' | 'participacion'>('audiencias');
  const [questionSender, setQuestionSender] = useState('');
  const [questionEmail, setQuestionEmail] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // Filter actual management reports from documents repository
  const formalReports = documents.filter(
    (d) => d.type === 'informe_gestion' || d.title.toLowerCase().includes('rendici') || d.title.toLowerCase().includes('gestion')
  );

  const realizedSessionsCount = sessions.filter((s) => s.status === 'realizada').length;
  const approvedProjectsCount = projects.filter(
    (p) => p.status === 'aprobada' || p.status === 'en_ejecucion' || p.status === 'finalizada'
  ).length;

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionSender || !questionEmail || !questionText) return;
    setQuestionSuccess(true);
    setTimeout(() => {
      setQuestionSender('');
      setQuestionEmail('');
      setQuestionText('');
      setQuestionSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-stone-900 via-[#161920] to-[#003893]/90 text-white relative overflow-hidden shadow-xl border border-stone-800">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-yellow-300 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Transparencia y Participación Ciudadana</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Rendición Pública de Cuentas
          </h1>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            El Consejo Municipal de Juventud de Flandes rinde cuentas periódicas ante los jóvenes, la ciudadanía
            en general y los organismos de control del Estado, presentando los avances, decisiones, debates de control
            político y gestión documental desarrollados en cumplimiento del Estatuto de Ciudadanía Juvenil.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-stone-400">
            <span className="font-semibold text-stone-200">Marco Legal:</span>
            <span>Ley 1757 de 2015 (Rendición Democrática de Cuentas)</span>
            <span>·</span>
            <span>Ley 1622 de 2013</span>
            <span>·</span>
            <span>Vigilancia Personería Municipal de Flandes</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Sesiones Cumplidas</span>
          <p className="text-2xl font-display font-bold text-[#8c162a] dark:text-[#f2c94c] mt-1">
            {realizedSessionsCount} / {sessions.length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Plenarias y comisiones de trabajo</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Proyectos e Iniciativas</span>
          <p className="text-2xl font-display font-bold text-[#003893] dark:text-blue-400 mt-1">
            {approvedProjectsCount} / {projects.length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Formulados y respaldados</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Documentos Públicos</span>
          <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {documents.length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Actas y convocatorias disponibles</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Audiencias Públicas</span>
          <p className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
            {AUDIENCIAS_DEFAULT.length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Espacios de diálogo presencial</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('audiencias')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'audiencias'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Audiencias Públicas ({AUDIENCIAS_DEFAULT.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('informes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'informes'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Informes Oficiales de Gestión
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('participacion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'participacion'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Enviar Pregunta para la Audiencia
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-dulima-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Expediente</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AUDIENCIAS PÚBLICAS */}
      {activeTab === 'audiencias' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            {AUDIENCIAS_DEFAULT.map((aud) => (
              <div
                key={aud.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
                      {aud.periodo}
                    </span>
                    <h3 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
                      Audiencia Pública de Rendición de Cuentas
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                      <span>Lugar: <strong>{aud.lugar}</strong></span>
                      <span>·</span>
                      <span>Hora: <strong>{aud.hora}</strong></span>
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start ${
                      aud.estado === 'concluida'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {aud.estado === 'concluida' ? 'Audiencia Realizada' : 'Convocatoria Abierta'}
                  </span>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {aud.resumen}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#003893] dark:text-[#f2c94c] shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-stone-400">Participación</span>
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {aud.asistentesEstimados} Jóvenes y Ciudadanos
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-stone-400">Compromisos</span>
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {aud.compromisosGenerados} Acuerdos Registrados
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INFORMES OFICIALES DE GESTIÓN */}
      {activeTab === 'informes' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                  Expedientes e Informes Radicados
                </h3>
                <p className="text-xs text-stone-500">
                  Informes oficiales de gestión y rendición de cuentas presentados formalmente ante las autoridades de control.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('documentos')}
                  className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:underline"
                >
                  Ver Todos los Documentos →
                </button>
              )}
            </div>

            {formalReports.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <FileText className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  Informes Oficiales en Preparación
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  La Secretaría General y las comisiones de trabajo del CMJ Flandes publicarán aquí los informes
                  consolidados una vez sean radicados formalmente ante la Personería Municipal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {formalReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {rep.title}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Código: {rep.code} · Fecha: {rep.documentDate} · Responsable: {rep.responsibleName}
                      </p>
                    </div>
                    {rep.fileUrl && (
                      <a
                        href={rep.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-dulima-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PARTICIPACIÓN CIUDADANA / PREGUNTAS PARA LA AUDIENCIA */}
      {activeTab === 'participacion' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
          <div className="text-center space-y-1 border-b border-stone-200 dark:border-stone-800 pb-4">
            <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              Formula tu Pregunta para la Próxima Audiencia Pública
            </h3>
            <p className="text-xs text-stone-500">
              Los consejeros responderán tus dudas e inquietudes de manera pública en la sesión plenaria de rendición de cuentas.
            </p>
          </div>

          {questionSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 text-emerald-900 dark:text-emerald-200 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">¡Pregunta Radicada Exitosamente!</p>
              <p>
                Tu inquietud ha sido incorporada en el orden del día de la próxima audiencia pública del CMJ Flandes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Tu Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={questionSender}
                  onChange={(e) => setQuestionSender(e.target.value)}
                  placeholder="Ej. Valentina Morales"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={questionEmail}
                  onChange={(e) => setQuestionEmail(e.target.value)}
                  placeholder="valentina@ejemplo.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Pregunta o Inquietud sobre la Gestión del CMJ *
                </label>
                <textarea
                  rows={4}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Escribe aquí tu pregunta sobre proyectos, uso de recursos, control político o actividades del Consejo..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <button type="submit" className="btn-dulima-primary w-full justify-center text-xs py-2.5">
                <Send className="w-3.5 h-3.5" />
                <span>Radicar Pregunta para la Audiencia</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
