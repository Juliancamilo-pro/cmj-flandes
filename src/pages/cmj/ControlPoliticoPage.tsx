import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { PublicPageId } from '../../types/cmj.ts';

interface ControlPoliticoPageProps {
  onNavigate?: (page: PublicPageId) => void;
}

interface DebateControl {
  id: string;
  secretaria: string;
  funcionario: string;
  cargo: string;
  fecha: string;
  temaPrincipal: string;
  cuestionario: string[];
  estado: 'realizado' | 'programado' | 'en_seguimiento';
  compromisosAdquiridos: string[];
  conclusiones: string;
}

interface OficioRadicado {
  id: string;
  radicado: string;
  fechaRadicacion: string;
  destinatario: string;
  asunto: string;
  estadoRespuesta: 'respondido' | 'en_tramite' | 'vencido';
  diasTermino: number;
  resumenPeticion: string;
  respuestaOficial?: string;
}

const DEBATES_DEFAULT: DebateControl[] = [
  {
    id: 'deb-1',
    secretaria: 'Secretaría de Gobierno y Seguridad Ciudadana',
    funcionario: 'Dra. María Claudia Rojas',
    cargo: 'Secretaria de Gobierno de Flandes',
    fecha: '18 de Marzo de 2026',
    temaPrincipal: 'Seguridad juvenil, prevención de consumo de sustancias y uso del espacio público',
    cuestionario: [
      '¿Cuáles son las estrategias específicas implementadas para prevenir el reclutamiento forzado y la delincuencia en barrios vulnerables de Flandes?',
      '¿Cuál es el presupuesto ejecutado en 2025 y programado para 2026 en programas dirigidos a adolescentes y jóvenes?',
      '¿Qué medidas de protección y convivencia se han adoptado en los parques y polideportivos municipales?',
    ],
    estado: 'realizado',
    compromisosAdquiridos: [
      'Fortalecimiento de patrullajes preventivos en horarios de salida escolar y polideportivos.',
      'Mesa técnica mensual entre la Secretaría de Gobierno y la Comisión de Paz y DDHH del CMJ Flandes.',
      'Destinación del 15% del Fondo de Seguridad Territorial a iniciativas pedagógicas juveniles.',
    ],
    conclusiones:
      'El CMJ exigió mayor presencia institucional no armada en los barrios Las Rosas, Triana y Gaitán. Se logró el compromiso de convocar al Comité Municipal de Convivencia Juvenil.',
  },
  {
    id: 'deb-2',
    secretaria: 'Secretaría de Educación, Cultura y Turismo',
    funcionario: 'Lic. Jairo Alberto Mendoza',
    cargo: 'Secretario de Educación de Flandes',
    fecha: '24 de Abril de 2026',
    temaPrincipal: 'Acceso a educación superior, becas universitarias y dotación de colegios oficiales',
    cuestionario: [
      '¿Cuántos cupos y subsidios universitarios o técnicos se han garantizado para bachilleres de instituciones educativas de Flandes en el convenio con la Universidad del Tolima y el SENA?',
      '¿Cuál es el estado de la infraestructura tecnológica y conectividad en las sedes educativas rurales y urbanas?',
      '¿Qué cronograma existe para la reapertura y dotación integral de la Casa de la Juventud de Flandes?',
    ],
    estado: 'en_seguimiento',
    compromisosAdquiridos: [
      'Ampliación del fondo de becas de transporte para estudiantes que viajan a Girardot e Ibagué.',
      'Entrega de informe detallado de inversión del Sistema General de Participaciones (SGP) Educación a la mesa directiva del CMJ.',
      'Habilitación de aulas de cómputo comunitarias en la Casa de la Juventud.',
    ],
    conclusiones:
      'Se mantiene veeduría activa sobre el desembolso de los subsidios de transporte escolar y el convenio con institutos técnicos para educación para el trabajo.',
  },
  {
    id: 'deb-3',
    secretaria: 'Instituto Municipal de Deporte y Recreación (INDER Flandes)',
    funcionario: 'Lic. Camilo Andrés Torres',
    cargo: 'Director del INDER Flandes',
    fecha: '15 de Mayo de 2026',
    temaPrincipal: 'Mantenimiento de escenarios deportivos y escuelas de formación gratuitas',
    cuestionario: [
      '¿Cuál es el cronograma de intervención de las canchas múltiples y polideportivos en el municipio?',
      '¿Por qué se presentan cobros no autorizados por el uso nocturno de iluminación en escenarios públicos?',
      '¿Qué apoyo económico e indumentaria se ha entregado a los deportistas juveniles que representan a Flandes a nivel departamental?',
    ],
    estado: 'programado',
    compromisosAdquiridos: [
      'Sesión plenaria programada en el Salón del Concejo Municipal con participación abierta de clubes deportivos juveniles.',
    ],
    conclusiones:
      'Debate citado formalmente con cuestionario de 12 preguntas radicado bajo término legal de 5 días hábiles.',
  },
];

const OFICIOS_DEFAULT: OficioRadicado[] = [
  {
    id: 'rad-01',
    radicado: 'EXT-2026-00341',
    fechaRadicacion: '02/02/2026',
    destinatario: 'Despacho de la Alcaldesa Municipal de Flandes',
    asunto: 'Solicitud de informe de ejecución presupuestal del subprograma Juventud con Futuro (Plan de Desarrollo Municipal)',
    estadoRespuesta: 'respondido',
    diasTermino: 15,
    resumenPeticion:
      'Petición formal para conocer el rubro exacto asignado y ejecutado durante la vigencia fiscal anterior para políticas públicas de juventud en Flandes.',
    respuestaOficial:
      'Oficio No. ALC-DES-2026-0182: Se anexa certificación de la Secretaría de Hacienda por $148.000.000 COP ejecutados en programas de emprendimiento y formación técnica.',
  },
  {
    id: 'rad-02',
    radicado: 'EXT-2026-00512',
    fechaRadicacion: '14/03/2026',
    destinatario: 'Secretaría de Salud y Desarrollo Social',
    asunto: 'Alerta sobre aumento de casos de ideación suicida y necesidad de psicólogos comunitarios en Flandes',
    estadoRespuesta: 'en_tramite',
    diasTermino: 15,
    resumenPeticion:
      'Requerimiento de caracterización y solicitud urgente de activación de la Línea Amiga Municipal con atención profesional 24/7 para adolescentes.',
  },
  {
    id: 'rad-03',
    radicado: 'EXT-2026-00688',
    fechaRadicacion: '10/04/2026',
    destinatario: 'Personería Municipal de Flandes',
    asunto: 'Solicitud de acompañamiento preventivo a la mesa de concertación del CMJ con la Alcaldía',
    estadoRespuesta: 'respondido',
    diasTermino: 10,
    resumenPeticion:
      'Veeduría y vigilancia al cumplimiento del artículo 43 de la Ley 1622 de 2013 referente a las sesiones concertadas obligatorias CMJ - Alcaldía.',
    respuestaOficial:
      'Oficio No. PMF-2026-095: La Personería designa delegado permanente para velar por las garantías democráticas del Consejo de Juventud.',
  },
];

export const ControlPoliticoPage: React.FC<ControlPoliticoPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'debates' | 'oficios' | 'plan_desarrollo' | 'buzon'>('debates');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedDebate, setSelectedDebate] = useState<DebateControl | null>(null);

  // Citizen citizen alert state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [concernTopic, setConcernTopic] = useState('educacion');
  const [concernMessage, setConcernMessage] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const filteredDebates = DEBATES_DEFAULT.filter((d) => {
    if (statusFilter !== 'todos' && d.estado !== statusFilter) return false;
    if (
      search &&
      !d.secretaria.toLowerCase().includes(search.toLowerCase()) &&
      !d.temaPrincipal.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const filteredOficios = OFICIOS_DEFAULT.filter((o) => {
    if (
      search &&
      !o.radicado.toLowerCase().includes(search.toLowerCase()) &&
      !o.asunto.toLowerCase().includes(search.toLowerCase()) &&
      !o.destinatario.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !concernMessage) return;
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSenderName('');
      setSenderEmail('');
      setNeighborhood('');
      setConcernMessage('');
      setSubmittedSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-stone-900 via-[#161920] to-[#8c162a]/90 text-white relative overflow-hidden shadow-xl border border-stone-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#003893]/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-yellow-300 uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Facultad Constitucional y Legal · CMJ Flandes</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Control Político a la Alcaldía Municipal
          </h1>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            El Consejo Municipal de Juventud ejerce veeduría permanente, interlocución obligatoria y control
            democrático a la Administración Municipal de Flandes, Tolima, vigilando que las políticas, programas
            y presupuestos para los jóvenes se ejecuten con transparencia, oportunidad y eficiencia.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-stone-400">
            <span className="font-semibold text-stone-200">Marco Legal:</span>
            <span>Ley Estatutaria 1622 de 2013 (Art. 34)</span>
            <span>·</span>
            <span>Ley 1885 de 2018</span>
            <span>·</span>
            <span>Constitución Política de Colombia (Art. 45 y 103)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Debates de Control</span>
          <p className="text-2xl font-display font-bold text-[#8c162a] dark:text-[#f2c94c] mt-1">
            {DEBATES_DEFAULT.length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Citaciones a secretarios de despacho</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Oficios Radicados</span>
          <p className="text-2xl font-display font-bold text-[#003893] dark:text-blue-400 mt-1">
            {OFICIOS_DEFAULT.length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Con número oficial de radicación</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Tasa de Respuesta</span>
          <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            66.7%
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Respuestas recibidas en término legal</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Compromisos Pactados</span>
          <p className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
            6
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">En seguimiento con la Personería</p>
        </div>
      </div>

      {/* Navigation Tabs inside Control Político */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('debates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'debates'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Debates de Control ({DEBATES_DEFAULT.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('oficios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'oficios'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Oficios y Requerimientos ({OFICIOS_DEFAULT.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plan_desarrollo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'plan_desarrollo'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Vigilancia Plan de Desarrollo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buzon')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'buzon'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Proponer Debate / Alerta Ciudadana
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-dulima-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEBATES DE CONTROL POLÍTICO */}
      {activeTab === 'debates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por dependencia o tema..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161920] text-xs"
              >
                <option value="todos">Todos los estados</option>
                <option value="realizado">Debate Realizado</option>
                <option value="en_seguimiento">En Seguimiento</option>
                <option value="programado">Programado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {filteredDebates.map((deb) => (
              <div
                key={deb.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs hover:border-[#8c162a]/50 dark:hover:border-[#f2c94c]/50 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#8c162a]/10 text-[#8c162a] dark:bg-[#f2c94c]/15 dark:text-[#f2c94c]">
                        {deb.secretaria}
                      </span>
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {deb.fecha}
                      </span>
                    </div>
                    <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
                      {deb.temaPrincipal}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Funcionario citado: <strong>{deb.funcionario}</strong> ({deb.cargo})
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start ${
                      deb.estado === 'realizado'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : deb.estado === 'en_seguimiento'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {deb.estado === 'realizado'
                      ? 'Debate Concluido'
                      : deb.estado === 'en_seguimiento'
                      ? 'Compromisos en Seguimiento'
                      : 'Citación Programada'}
                  </span>
                </div>

                {/* Questionnaire Preview */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-stone-500 mb-2">
                    Ejes del Cuestionario Oficial Radicado:
                  </h4>
                  <ul className="space-y-1.5">
                    {deb.cuestionario.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                        <span className="w-4 h-4 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Acquired Commitments */}
                {deb.compromisosAdquiridos.length > 0 && (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Compromisos Suscritos por la Secretaría ante el CMJ:</span>
                    </h4>
                    <ul className="space-y-1">
                      {deb.compromisosAdquiridos.map((comp, i) => (
                        <li key={i} className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{comp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-stone-500 dark:text-stone-400 italic pt-1">
                  <strong>Conclusión del Consejo:</strong> {deb.conclusiones}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OFICIOS Y DERECHOS DE PETICIÓN */}
      {activeTab === 'oficios' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-300" />
            <div>
              <p className="font-bold">Garantía del Derecho Constitucional de Petición (Ley 1755 de 2015)</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Todas las entidades de la Alcaldía de Flandes tienen el deber legal de responder los requerimientos del
                Consejo Municipal de Juventud dentro de los términos establecidos. El incumplimiento es causal de mala conducta
                y se remite a la Personería Municipal.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOficios.map((ofi) => (
              <div
                key={ofi.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                      Radicado: {ofi.radicado}
                    </span>
                    <span className="text-xs text-stone-400">Fecha: {ofi.fechaRadicacion}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      ofi.estadoRespuesta === 'respondido'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : ofi.estadoRespuesta === 'en_tramite'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {ofi.estadoRespuesta === 'respondido'
                      ? 'Respuesta Recibida'
                      : ofi.estadoRespuesta === 'en_tramite'
                      ? 'En Trámite Legal'
                      : 'Término Vencido'}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase">Destinatario:</p>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {ofi.destinatario}
                  </p>
                  <p className="text-xs font-bold text-stone-500 uppercase mt-2">Asunto:</p>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {ofi.asunto}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800 text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300">Petición Sustentada: </span>
                  <span className="text-stone-600 dark:text-stone-400">{ofi.resumenPeticion}</span>
                </div>

                {ofi.respuestaOficial && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold">Respuesta Institucional de la Entidad: </span>
                    <span>{ofi.respuestaOficial}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VIGILANCIA AL PLAN DE DESARROLLO MUNICIPAL */}
      {activeTab === 'plan_desarrollo' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
            <h3 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
              Seguimiento a las Metas de Juventud del Plan de Desarrollo de Flandes
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
              Evaluación ciudadana independiente realizada por el CMJ Flandes sobre los compromisos del
              gobierno municipal con la población de 14 a 28 años.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-900 dark:text-stone-100 font-bold">
                  1. Convenios de Educación Superior y Subsidios de Transporte
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">75%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-[11px] text-stone-500">
                Se han otorgado subsidios para estudiantes de universidades de la región. El CMJ vigila que se cubra la totalidad de la demanda.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-900 dark:text-stone-100 font-bold">
                  2. Reapertura y Mantenimiento de la Casa de la Juventud
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">40%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '40%' }} />
              </div>
              <p className="text-[11px] text-stone-500">
                Instalaciones físicas en proceso de adecuación hidrosanitaria. Pendiente dotación de computadores e internet.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-900 dark:text-stone-100 font-bold">
                  3. Recuperación de Polideportivos y Alumbrado Público
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">60%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }} />
              </div>
              <p className="text-[11px] text-stone-500">
                Intervenidos polideportivos de Triana y Centro. Pendiente iluminación nocturna en el sector de Las Rosas.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-900 dark:text-stone-100 font-bold">
                  4. Fondo de Emprendimiento e Innovación Juvenil
                </span>
                <span className="text-red-600 dark:text-red-400 font-mono font-bold">25%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: '25%' }} />
              </div>
              <p className="text-[11px] text-stone-500">
                Rubro aprobado pero pendiente convocatoria pública para capital semilla a jóvenes emprendedores flamencos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BUZÓN CIUDADANO PARA PROPONER CONTROL POLÍTICO */}
      {activeTab === 'buzon' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
          <div className="text-center space-y-1 border-b border-stone-200 dark:border-stone-800 pb-4">
            <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              Proponer un Tema para Debate de Control Político
            </h3>
            <p className="text-xs text-stone-500">
              ¿Hay un problema en tu barrio, colegio o comunidad que la Alcaldía no ha atendido?
              Infórmanos para citar a debate a los secretarios responsables.
            </p>
          </div>

          {submittedSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 text-emerald-900 dark:text-emerald-200 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">¡Alerta Ciudadana Recibida!</p>
              <p>
                Los consejeros de la mesa directiva revisarán tu solicitud para formular el cuestionario oficial
                ante la Secretaría de Despacho competente de la Alcaldía de Flandes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitAlert} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Tu Nombre o Colectivo *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ej. Andrés Gómez / Jóvenes del Barrio Triana"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Correo Electrónico de Contacto *
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Barrio / Vereda de Flandes
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ej. Barrio Las Rosas, Villa del Río..."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Tema o Dependencia a Controlar
                  </label>
                  <select
                    value={concernTopic}
                    onChange={(e) => setConcernTopic(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  >
                    <option value="educacion">Educación y Becas (Sec. Educación)</option>
                    <option value="seguridad">Seguridad y Convivencia (Sec. Gobierno)</option>
                    <option value="deporte">Deportes e Infraestructura (INDER)</option>
                    <option value="salud">Salud Mental y Adicciones (Sec. Salud)</option>
                    <option value="empleo">Empleo y Emprendimiento Juvenil</option>
                    <option value="otro">Otro Asunto de Juventud</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Descripción Detallada de la Problemática *
                </label>
                <textarea
                  rows={4}
                  required
                  value={concernMessage}
                  onChange={(e) => setConcernMessage(e.target.value)}
                  placeholder="Describe con hechos claros qué situación debe ser investigada o cuestionada a la Alcaldía de Flandes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <button type="submit" className="btn-dulima-primary w-full justify-center text-xs py-2.5">
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Alerta a los Consejeros</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
