import React, { useState } from 'react';
import {
  BarChart3,
  Printer,
  Download,
  CalendarDays,
  FileText,
  FolderKanban,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import { AdminWorkspaceResponse } from '../../../services/cmjApi.ts';
import { CmjMember } from '../../../types/cmj.ts';

interface InformesTabProps {
  workspace: AdminWorkspaceResponse;
  currentUser: CmjMember;
}

export const InformesTab: React.FC<InformesTabProps> = ({ workspace, currentUser }) => {
  const [reportPeriod, setReportPeriod] = useState(new Date().getFullYear().toString());

  // Real statistics
  const totalSessions = workspace.sessions?.length || 0;
  const heldSessions = workspace.sessions?.filter((s) => s.status === 'realizada').length || 0;
  const pendingSessions = workspace.sessions?.filter((s) => s.status === 'programada').length || 0;

  const totalDocs = workspace.documents?.length || 0;
  const approvedDocs = workspace.documents?.filter((d) => d.approvalStatus === 'publicado').length || 0;
  const draftDocs = totalDocs - approvedDocs;

  const totalProjects = workspace.projects?.length || 0;
  const activeProjects = workspace.projects?.filter((p) => p.status === 'en_ejecucion' || p.status === 'aprobada').length || 0;

  const totalCommitments = workspace.commitments?.length || 0;
  const completedCommitments = workspace.commitments?.filter((c) => c.status === 'cumplido').length || 0;
  const pendingCommitments = workspace.commitments?.filter((c) => c.status === 'pendiente' || c.status === 'en_proceso').length || 0;

  const totalVeeduria = workspace.veeduriaCases?.length || 0;
  const answeredVeeduria = workspace.veeduriaCases?.filter((v) => v.status === 'respondido' || v.status === 'compromiso_pactado').length || 0;

  const totalMembers = workspace.members?.length || 0;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Tablero de Gestión e Informes Institucionales
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Métricas 100% reales calculadas a partir de las sesiones, actas, compromisos y proyectos registrados en la plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintReport}
            className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Exportar Informe PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block p-6 border-b-2 border-stone-900 text-center space-y-1">
        <h1 className="text-2xl font-bold font-serif uppercase tracking-wider">
          Consejo Municipal de Juventud Flandes — Tolima
        </h1>
        <p className="text-sm font-semibold text-stone-700">
          Informe Oficial de Gestión y Seguimiento Institucional · Periodo {reportPeriod}
        </p>
        <p className="text-xs text-stone-500">
          Generado el {new Date().toLocaleDateString('es-CO')} por {currentUser.fullName} ({currentUser.cargoTitle})
        </p>
      </div>

      {/* Real KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sessions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase tracking-wider">Sesiones Plenarias</span>
            <CalendarDays className="w-4 h-4 text-[#003893] dark:text-blue-400" />
          </div>
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100">
            {heldSessions}
          </p>
          <p className="text-[11px] text-stone-500">
            {heldSessions} realizadas · {pendingSessions} programadas (Total: {totalSessions})
          </p>
        </div>

        {/* Documents & Actas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase tracking-wider">Actas y Documentos</span>
            <FileText className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
          </div>
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100">
            {approvedDocs}
          </p>
          <p className="text-[11px] text-stone-500">
            {approvedDocs} aprobados/publicados · {draftDocs} en borrador
          </p>
        </div>

        {/* Commitments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase tracking-wider">Compromisos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100">
            {completedCommitments}
          </p>
          <p className="text-[11px] text-stone-500">
            {completedCommitments} cumplidos · {pendingCommitments} en proceso (Total: {totalCommitments})
          </p>
        </div>

        {/* Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase tracking-wider">Iniciativas Juveniles</span>
            <FolderKanban className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100">
            {activeProjects}
          </p>
          <p className="text-[11px] text-stone-500">
            {activeProjects} activas · {totalProjects} formuladas
          </p>
        </div>
      </div>

      {/* Comprehensive Report Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Veeduría e Incidencia en la Administración */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <Building2 className="w-4 h-4 text-[#003893] dark:text-blue-400" />
            <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
              Control Social y Veeduría ante Entidades
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 text-[10px] uppercase font-bold">Total Casos Radicados</span>
              <p className="text-xl font-bold mt-1 text-stone-900 dark:text-stone-100">{totalVeeduria}</p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 text-[10px] uppercase font-bold">Respuestas Recibidas</span>
              <p className="text-xl font-bold mt-1 text-purple-700 dark:text-purple-300">{answeredVeeduria}</p>
            </div>
          </div>
          {workspace.veeduriaCases && workspace.veeduriaCases.length > 0 ? (
            <div className="space-y-2 text-xs">
              <span className="font-bold uppercase text-[10px] text-stone-500">Últimos casos seguidos:</span>
              {workspace.veeduriaCases.slice(0, 3).map((v) => (
                <div key={v.id} className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800">
                  <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{v.title}</p>
                  <p className="text-[11px] text-stone-500">Entidad: {v.targetEntity} · Estado: {v.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic">No hay casos de veeduría registrados en el periodo.</p>
          )}
        </div>

        {/* Comisiones y Representación Juvenil */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <Users className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c]" />
            <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
              Integrantes y Comisiones Constituidas
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 text-[10px] uppercase font-bold">Consejeros Activos</span>
              <p className="text-xl font-bold mt-1 text-stone-900 dark:text-stone-100">{totalMembers}</p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 text-[10px] uppercase font-bold">Comisiones de Trabajo</span>
              <p className="text-xl font-bold mt-1 text-[#8c162a] dark:text-[#f2c94c]">{workspace.commissions.length}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <span className="font-bold uppercase text-[10px] text-stone-500">Comisiones institucionales activas:</span>
            {workspace.commissions.slice(0, 4).map((com) => (
              <div key={com.id} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-900/40 text-[11px]">
                <span className="font-semibold text-stone-800 dark:text-stone-200">{com.name}</span>
                <span className="text-stone-500">{com.memberIds?.length || 0} integrantes</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
