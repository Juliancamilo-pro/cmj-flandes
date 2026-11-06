import React, { useState } from 'react';
import {
  FolderKanban,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { CmjWorkPlan, CmjCommission, CmjMember } from '../../../types/cmj.ts';
import { cmjApi } from '../../../services/cmjApi.ts';

interface PlanTrabajoTabProps {
  workPlans: CmjWorkPlan[];
  commissions: CmjCommission[];
  currentUser: CmjMember;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  notify: (type: 'ok' | 'err', text: string) => void;
}

export const PlanTrabajoTab: React.FC<PlanTrabajoTabProps> = ({
  workPlans,
  commissions,
  currentUser,
  canCreate,
  canEdit,
  canDelete,
  onRefresh,
  notify,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [strategicAxis, setStrategicAxis] = useState('Participación Democrática y Liderazgo');
  const [commissionId, setCommissionId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [objectivesText, setObjectivesText] = useState('');
  const [activitiesList, setActivitiesList] = useState<
    { id: string; name: string; responsible: string; targetDate: string; progress: number; status: 'planeada' | 'en_curso' | 'completada' }[]
  >([]);

  // Activity input state
  const [actName, setActName] = useState('');
  const [actResp, setActResp] = useState(currentUser.fullName);
  const [actDate, setActDate] = useState(new Date().toISOString().slice(0, 10));

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setStrategicAxis('Participación Democrática y Liderazgo');
    setCommissionId('');
    setYear(new Date().getFullYear());
    setObjectivesText('');
    setActivitiesList([]);
    setShowModal(true);
  };

  const handleOpenEdit = (plan: CmjWorkPlan) => {
    setEditingId(plan.id);
    setTitle(plan.title);
    setStrategicAxis(plan.strategicAxis);
    setCommissionId(plan.commissionId || '');
    setYear(plan.year);
    setObjectivesText(plan.objectives.join('\n'));
    setActivitiesList(plan.activities || []);
    setShowModal(true);
  };

  const handleAddActivity = () => {
    if (!actName.trim()) return;
    setActivitiesList([
      ...activitiesList,
      {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: actName.trim(),
        responsible: actResp.trim() || currentUser.fullName,
        targetDate: actDate,
        progress: 0,
        status: 'planeada',
      },
    ]);
    setActName('');
  };

  const handleRemoveActivity = (id: string) => {
    setActivitiesList(activitiesList.filter((a) => a.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !strategicAxis.trim()) {
      notify('err', 'El título y el eje estratégico son obligatorios.');
      return;
    }

    const selectedCom = commissions.find((c) => c.id === commissionId);
    const parsedObjectives = objectivesText
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean);

    try {
      if (editingId) {
        await cmjApi.updateWorkPlan(editingId, {
          title,
          strategicAxis,
          commissionId: commissionId || undefined,
          commissionName: selectedCom ? selectedCom.name : undefined,
          year,
          objectives: parsedObjectives,
          activities: activitiesList,
        });
        notify('ok', 'Plan de trabajo institucional actualizado.');
      } else {
        await cmjApi.createWorkPlan({
          title,
          strategicAxis,
          commissionId: commissionId || undefined,
          commissionName: selectedCom ? selectedCom.name : undefined,
          year,
          objectives: parsedObjectives,
          activities: activitiesList,
        });
        notify('ok', 'Nuevo plan de trabajo institucional registrado.');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error guardando plan de trabajo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este plan de trabajo?')) return;
    try {
      await cmjApi.deleteWorkPlan(id);
      notify('ok', 'Plan de trabajo eliminado.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error eliminando plan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Agenda y Plan de Trabajo Institucional
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Líneas estratégicas, metas anuales y cronograma de actividades por comisiones del CMJ Flandes.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Plan Estratégico</span>
          </button>
        )}
      </div>

      {/* Plans List */}
      {workPlans.length > 0 ? (
        <div className="space-y-6">
          {workPlans.map((plan) => {
            const totalActs = plan.activities?.length || 0;
            const completedActs = plan.activities?.filter((a) => a.status === 'completada').length || 0;
            const avgProgress =
              totalActs > 0
                ? Math.round(
                    plan.activities.reduce((acc, a) => acc + (a.progress || 0), 0) / totalActs
                  )
                : 0;

            return (
              <div
                key={plan.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-5 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        Periodo {plan.year}
                      </span>
                      {plan.commissionName && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-[#003893]/10 text-[#003893] dark:bg-blue-950/60 dark:text-blue-300">
                          {plan.commissionName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      Eje Estratégico: <strong>{plan.strategicAxis}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(plan)}
                        className="btn-dulima-secondary py-1.5 px-3 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id)}
                        className="p-1.5 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                    <span>Avance General de Metas</span>
                    <span>{avgProgress}% ({completedActs} de {totalActs} actividades completadas)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#003893] to-[#8c162a] transition-all duration-500"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>

                {/* Objectives */}
                {plan.objectives && plan.objectives.length > 0 && (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#003893] dark:text-blue-400">
                      Objetivos Institucionales
                    </span>
                    <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside">
                      {plan.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Activities table */}
                {plan.activities && plan.activities.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase text-stone-700 dark:text-stone-300">
                      Cronograma de Actividades
                    </span>
                    <div className="space-y-2">
                      {plan.activities.map((act) => (
                        <div
                          key={act.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 dark:text-stone-100">
                              {act.name}
                            </span>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Responsable: <strong>{act.responsible}</strong> · Fecha meta: {act.targetDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                act.status === 'completada'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : act.status === 'en_curso'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                              }`}
                            >
                              {act.status}
                            </span>
                            <span className="font-mono font-bold text-xs">{act.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
          <FolderKanban className="w-10 h-10 mx-auto text-stone-400 opacity-60" />
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            No se han formulado planes de trabajo estratégicos aún
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Estructura los ejes de acción, líneas estratégicas y cronograma de metas que el Consejo y sus comisiones desarrollarán durante el periodo.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-dulima-primary py-2 px-4 text-xs font-bold mt-2"
            >
              Crear Primer Plan Estratégico
            </button>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-4 shadow-2xl my-8">
            <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              {editingId ? 'Editar Plan de Trabajo' : 'Formular Plan de Trabajo Institucional'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Título del Plan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Plan Anual de Gestión Juvenil Flandes 2024"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Año / Vigencia
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Eje Estratégico *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Empleo, Cultura, Deporte, Educación..."
                    value={strategicAxis}
                    onChange={(e) => setStrategicAxis(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Comisión Responsable (Opcional)
                  </label>
                  <select
                    value={commissionId}
                    onChange={(e) => setCommissionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  >
                    <option value="">Plenaria General del Consejo</option>
                    {commissions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Objetivos Estratégicos (uno por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Articular con el SENA y colegios para ferias vocacionales&#10;Promover foros de derechos humanos estudiantiles"
                  value={objectivesText}
                  onChange={(e) => setObjectivesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              {/* Add Activities */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
                <span className="font-bold uppercase text-[11px] text-stone-700 dark:text-stone-300">
                  Agregar Actividades al Cronograma
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la actividad"
                    value={actName}
                    onChange={(e) => setActName(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Responsable"
                    value={actResp}
                    onChange={(e) => setActResp(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddActivity}
                    className="btn-dulima-secondary py-1.5 px-3 text-xs"
                  >
                    + Agregar Actividad
                  </button>
                </div>

                {activitiesList.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {activitiesList.map((a, i) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-[11px]"
                      >
                        <div className="min-w-0">
                          <span className="font-bold">{a.name}</span>
                          <span className="text-stone-500 ml-2">({a.responsible} · {a.targetDate})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={a.status}
                            onChange={(e) => {
                              const updated = [...activitiesList];
                              const newStatus = e.target.value as any;
                              updated[i] = {
                                ...updated[i],
                                status: newStatus,
                                progress: newStatus === 'completada' ? 100 : newStatus === 'planeada' ? 0 : 50,
                              };
                              setActivitiesList(updated);
                            }}
                            className="px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 text-[10px]"
                          >
                            <option value="planeada">Planeada</option>
                            <option value="en_curso">En curso</option>
                            <option value="completada">Completada</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveActivity(a.id)}
                            className="text-red-500 font-bold px-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-dulima-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs font-bold">
                  {editingId ? 'Guardar Cambios' : 'Registrar Plan Estratégico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
