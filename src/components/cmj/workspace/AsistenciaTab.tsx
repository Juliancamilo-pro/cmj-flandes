import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  FileQuestion,
  CalendarDays,
  Printer,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { CmjMember, CmjSession, SessionAttendanceRecord } from '../../../types/cmj.ts';
import { cmjApi } from '../../../services/cmjApi.ts';

interface AsistenciaTabProps {
  sessions: CmjSession[];
  members: CmjMember[];
  canEdit: boolean;
  onRefresh: () => void;
  notify: (type: 'ok' | 'err', text: string) => void;
}

export const AsistenciaTab: React.FC<AsistenciaTabProps> = ({
  sessions,
  members,
  canEdit,
  onRefresh,
  notify,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[0]?.id || ''
  );
  const [draftAttendance, setDraftAttendance] = useState<SessionAttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [showCertificateModal, setShowCertificateModal] = useState<CmjMember | null>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Initialize draft attendance whenever selected session changes
  React.useEffect(() => {
    if (!selectedSession) return;
    const existing = selectedSession.attendance || [];
    const populated: SessionAttendanceRecord[] = members
      .filter((m) => m.isActive)
      .map((m) => {
        const found = existing.find((e) => e.memberId === m.id);
        return {
          memberId: m.id,
          memberName: m.fullName,
          cargoTitle: m.cargoTitle,
          status: found?.status || 'presente',
          notes: found?.notes || '',
        };
      });
    setDraftAttendance(populated);
  }, [selectedSessionId, selectedSession, members]);

  const handleStatusChange = (
    memberId: string,
    status: 'presente' | 'ausente' | 'excusa'
  ) => {
    setDraftAttendance((prev) =>
      prev.map((item) => (item.memberId === memberId ? { ...item, status } : item))
    );
  };

  const handleNotesChange = (memberId: string, notes: string) => {
    setDraftAttendance((prev) =>
      prev.map((item) => (item.memberId === memberId ? { ...item, notes } : item))
    );
  };

  const saveAttendance = async () => {
    if (!selectedSession) return;
    setIsSaving(true);
    try {
      await cmjApi.updateSession(selectedSession.id, {
        attendance: draftAttendance,
        status: 'realizada',
      });
      notify('ok', 'Registro de asistencia guardado exitosamente.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error guardando asistencia.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations for general attendance statistics
  const completedSessions = sessions.filter(
    (s) => s.status === 'realizada' || (s.attendance && s.attendance.length > 0)
  );
  const totalSessionsCount = completedSessions.length;

  const memberStats = members
    .filter((m) => m.isActive)
    .map((member) => {
      let attended = 0;
      let excused = 0;
      let absent = 0;

      completedSessions.forEach((sess) => {
        const record = sess.attendance?.find((a) => a.memberId === member.id);
        if (record) {
          if (record.status === 'presente') attended++;
          else if (record.status === 'excusa') excused++;
          else absent++;
        }
      });

      const percentage =
        totalSessionsCount > 0 ? Math.round((attended / totalSessionsCount) * 100) : 100;

      return {
        member,
        attended,
        excused,
        absent,
        percentage,
      };
    });

  const overallAvg =
    memberStats.length > 0
      ? Math.round(
          memberStats.reduce((acc, curr) => acc + curr.percentage, 0) / memberStats.length
        )
      : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl p-6 lg:p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#003893] dark:text-[#f2c94c]">
              Control Institucional de Quórum
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
            Registro Nominal de Asistencia a Sesiones
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
            Trazabilidad rigurosa de quórum deliberatorio y decisorio en sesiones plenarias y comisiones
            del Consejo Municipal de Juventud de Flandes (Leyes Estatutarias 1622 de 2013 y 1885 de 2018).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-dulima-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Planilla Oficial</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Sesiones Totales</span>
          <p className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
            {sessions.length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">{totalSessionsCount} realizadas con lista</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Asistencia Global</span>
          <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {overallAvg}%
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Promedio de quórum del consejo</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Consejeros Activos</span>
          <p className="text-2xl font-display font-bold text-[#003893] dark:text-[#f2c94c] mt-1">
            {members.filter((m) => m.isActive).length}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Habilitados para votar</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500">Rendición Personería</span>
          <p className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
            Al Día
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Expediente verificado</p>
        </div>
      </div>

      {/* Main Grid: Active Session Attendance & Historical Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Taking Attendance for a Specific Session */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                  Llamado a Lista por Sesión
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Selecciona la sesión plenaria o de comisión para registrar la presencia nominal.
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={saveAttendance}
                  disabled={isSaving || !selectedSession}
                  className="btn-dulima-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Asistencia'}</span>
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-10 text-stone-500 text-sm">
                No hay sesiones creadas aún en el sistema. Registra una sesión primero en la pestaña "Sesiones".
              </div>
            ) : (
              <>
                {/* Session Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                      Sesión a Gestionar
                    </label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sessionNumber} · {s.title} ({s.date})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSession && (
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                      <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                        {selectedSession.title}
                      </p>
                      <p className="text-stone-500 text-[11px] flex items-center gap-2">
                        <span>Fecha: {selectedSession.date}</span>
                        <span>·</span>
                        <span>Hora: {selectedSession.startTime}</span>
                      </p>
                      <p className="text-stone-500 text-[11px] truncate">
                        Lugar: {selectedSession.location}
                      </p>
                    </div>
                  )}
                </div>

                {/* Roll Call Members List */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
                    <span>Consejero / Cargo</span>
                    <span>Estado de Asistencia</span>
                  </div>

                  {draftAttendance.map((rec) => {
                    return (
                      <div
                        key={rec.memberId}
                        className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                            {rec.memberName}
                          </p>
                          <p className="text-xs text-stone-500 truncate">{rec.cargoTitle}</p>
                          {canEdit && (
                            <input
                              type="text"
                              value={rec.notes || ''}
                              onChange={(e) => handleNotesChange(rec.memberId, e.target.value)}
                              placeholder="Observación o radicado de excusa..."
                              className="mt-1 w-full text-[11px] px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
                            />
                          )}
                          {!canEdit && rec.notes && (
                            <p className="text-[11px] text-stone-500 italic mt-0.5">
                              Nota: {rec.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleStatusChange(rec.memberId, 'presente')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all ${
                              rec.status === 'presente'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Presente</span>
                          </button>

                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleStatusChange(rec.memberId, 'excusa')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all ${
                              rec.status === 'excusa'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                          >
                            <FileQuestion className="w-3.5 h-3.5" />
                            <span>Excusa</span>
                          </button>

                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleStatusChange(rec.memberId, 'ausente')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all ${
                              rec.status === 'ausente'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-red-100 hover:text-red-800'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Ausente</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Cumulative Member Attendance & Personería Reports */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-display font-bold text-stone-900 dark:text-stone-100">
                Historial Acumulado por Consejero
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Trazabilidad oficial de sesiones ordinarias y extraordinarias para el periodo constitucional.
              </p>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {memberStats.map(({ member, attended, excused, absent, percentage }) => {
                const isWarning = percentage < 75 && totalSessionsCount >= 3;
                return (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {member.fullName}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">{member.cargoTitle}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            percentage >= 80
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : percentage >= 60
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          percentage >= 80
                            ? 'bg-emerald-500'
                            : percentage >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                      <span className="text-emerald-600 font-semibold">{attended} Asistencias</span>
                      <span className="text-amber-600 font-semibold">{excused} Excusas</span>
                      <span className="text-red-600 font-semibold">{absent} Faltas</span>
                      <button
                        type="button"
                        onClick={() => setShowCertificateModal(member)}
                        className="text-[#003893] dark:text-[#f2c94c] font-bold hover:underline ml-1"
                      >
                        Certificado
                      </button>
                    </div>

                    {isWarning && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Alerta: porcentaje inferior al 75% reglamentario. Notificar mesa directiva.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161920] rounded-3xl max-w-lg w-full p-6 lg:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 print:shadow-none print:border-none">
            <div className="text-center border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="w-12 h-1.5 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-full mx-auto mb-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                República de Colombia · Flandes, Tolima
              </span>
              <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                Constancia Oficial de Asistencia
              </h3>
              <p className="text-xs text-stone-500">Consejo Municipal de Juventud de Flandes</p>
            </div>

            <div className="space-y-3 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              <p>
                La <strong>Secretaría General del Consejo Municipal de Juventud de Flandes, Tolima</strong>,
                en uso de sus facultades legales otorgadas por la Ley 1622 de 2013 y la Ley 1885 de 2018:
              </p>
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-1">
                <p className="text-xs uppercase font-bold text-stone-500">Hace constar que:</p>
                <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {showCertificateModal.fullName}
                </p>
                <p className="text-xs text-[#003893] dark:text-[#f2c94c] font-semibold">
                  {showCertificateModal.cargoTitle}
                </p>
              </div>
              <p>
                Se encuentra al día con los registros de asistencia y participación deliberativa en el
                seno del Consejo Municipal de Juventud de Flandes para los efectos institucionales pertinentes
                ante la Alcaldía Municipal y la Personería Municipal.
              </p>
              <p className="text-[11px] text-stone-500">
                Expedido en Flandes, Tolima, a los {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowCertificateModal(null)}
                className="btn-dulima-secondary text-xs py-2 px-4"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-dulima-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimir / Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
