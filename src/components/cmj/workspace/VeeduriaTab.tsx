import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  FileCheck2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';
import { CmjVeeduriaCase, VeeduriaStatus, CmjMember } from '../../../types/cmj.ts';
import { cmjApi } from '../../../services/cmjApi.ts';

interface VeeduriaTabProps {
  cases: CmjVeeduriaCase[];
  currentUser: CmjMember;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  notify: (type: 'ok' | 'err', text: string) => void;
}

const VEEDURIA_STATUS_LABELS: Record<VeeduriaStatus, string> = {
  radicado: 'Radicado / En Espera Legal',
  en_espera: 'En Trámite Institucional',
  respondido: 'Respuesta Recibida',
  compromiso_pactado: 'Compromiso Pactado con Entidad',
  seguimiento_cerrado: 'Seguimiento Concluido',
};

const STATUS_COLORS: Record<VeeduriaStatus, string> = {
  radicado: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
  en_espera: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
  respondido: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
  compromiso_pactado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
  seguimiento_cerrado: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-400',
};

export const VeeduriaTab: React.FC<VeeduriaTabProps> = ({
  cases,
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
  const [targetEntity, setTargetEntity] = useState('Alcaldía Municipal de Flandes');
  const [issueDescription, setIssueDescription] = useState('');
  const [filedRadicadoNumber, setFiledRadicadoNumber] = useState('');
  const [filingDate, setFilingDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedResponseDate, setExpectedResponseDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<VeeduriaStatus>('radicado');
  const [officialResponse, setOfficialResponse] = useState('');
  const [responseDate, setResponseDate] = useState('');
  const [commitmentsGiven, setCommitmentsGiven] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setTargetEntity('Alcaldía Municipal de Flandes');
    setIssueDescription('');
    setFiledRadicadoNumber('');
    setFilingDate(new Date().toISOString().slice(0, 10));
    setExpectedResponseDate(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
    setStatus('radicado');
    setOfficialResponse('');
    setResponseDate('');
    setCommitmentsGiven('');
    setEvidenceUrls([]);
    setShowModal(true);
  };

  const handleOpenEdit = (v: CmjVeeduriaCase) => {
    setEditingId(v.id);
    setTitle(v.title);
    setTargetEntity(v.targetEntity);
    setIssueDescription(v.issueDescription);
    setFiledRadicadoNumber(v.filedRadicadoNumber || '');
    setFilingDate(v.filingDate);
    setExpectedResponseDate(v.expectedResponseDate || '');
    setStatus(v.status);
    setOfficialResponse(v.officialResponse || '');
    setResponseDate(v.responseDate || '');
    setCommitmentsGiven(v.commitmentsGiven || '');
    setEvidenceUrls(v.evidenceUrls || []);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetEntity.trim() || !issueDescription.trim()) {
      notify('err', 'El título, la entidad destinataria y la descripción son obligatorios.');
      return;
    }

    try {
      if (editingId) {
        await cmjApi.updateVeeduriaCase(editingId, {
          title,
          targetEntity,
          issueDescription,
          filedRadicadoNumber: filedRadicadoNumber.trim() || undefined,
          filingDate,
          expectedResponseDate: expectedResponseDate || undefined,
          status,
          officialResponse: officialResponse.trim() || undefined,
          responseDate: responseDate || undefined,
          commitmentsGiven: commitmentsGiven.trim() || undefined,
          evidenceUrls,
        });
        notify('ok', 'Caso de veeduría y control social actualizado.');
      } else {
        await cmjApi.createVeeduriaCase({
          title,
          targetEntity,
          issueDescription,
          filedRadicadoNumber: filedRadicadoNumber.trim() || undefined,
          filingDate,
          expectedResponseDate: expectedResponseDate || undefined,
          status,
          officialResponse: officialResponse.trim() || undefined,
          responseDate: responseDate || undefined,
          commitmentsGiven: commitmentsGiven.trim() || undefined,
          evidenceUrls,
        });
        notify('ok', 'Caso de vigilancia y control social radicado.');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error guardando caso de veeduría.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de veeduría ciudadana?')) return;
    try {
      await cmjApi.deleteVeeduriaCase(id);
      notify('ok', 'Registro de veeduría eliminado.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error eliminando registro.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Veeduría y Control Social a la Gestión Pública
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Seguimiento a derechos de petición, problemáticas juveniles radicadas y compromisos de entidades territoriales.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Radicar Solicitud / Caso</span>
          </button>
        )}
      </div>

      {/* Cases List */}
      {cases.length > 0 ? (
        <div className="space-y-4">
          {cases.map((v) => (
            <div
              key={v.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase border ${STATUS_COLORS[v.status]}`}>
                    {VEEDURIA_STATUS_LABELS[v.status]}
                  </span>
                  {v.filedRadicadoNumber && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      Radicado N° {v.filedRadicadoNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(v)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  {v.title}
                </h3>
                <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400" />
                  <span>Entidad destinataria: <strong>{v.targetEntity}</strong> · Radicado el: {v.filingDate}</span>
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                  {v.issueDescription}
                </p>
              </div>

              {/* Official Response block if present */}
              {v.officialResponse && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1 text-xs">
                  <span className="font-bold uppercase text-[10px] text-purple-900 dark:text-purple-300">
                    Respuesta Oficial de la Entidad ({v.responseDate || 'Sin fecha registrada'})
                  </span>
                  <p className="text-stone-700 dark:text-stone-200 leading-relaxed">
                    {v.officialResponse}
                  </p>
                </div>
              )}

              {/* Commitments given by entity */}
              {v.commitmentsGiven && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1 text-xs">
                  <span className="font-bold uppercase text-[10px] text-emerald-900 dark:text-emerald-300">
                    Compromisos Asumidos por la Administración
                  </span>
                  <p className="text-stone-700 dark:text-stone-200 leading-relaxed">
                    {v.commitmentsGiven}
                  </p>
                </div>
              )}

              {/* Evidences */}
              {v.evidenceUrls && v.evidenceUrls.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  {v.evidenceUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-[#8c162a] hover:text-white dark:hover:bg-[#f2c94c] dark:hover:text-stone-950 text-stone-700 dark:text-stone-300 font-semibold transition-colors"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>Evidencia / Copia del Radicado #{i + 1}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-stone-400 opacity-60" />
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            No hay casos de veeduría o peticiones radicadas actualmente
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Registra los derechos de petición o solicitudes de información enviados a la Alcaldía de Flandes, Concejo Municipal u otras entidades públicas para su vigilancia rigurosa.
          </p>
        </div>
      )}

      {/* Modal Radicar / Editar Caso */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              {editingId ? 'Editar Caso de Veeduría' : 'Radicar Caso de Veeduría y Control Social'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Asunto / Problemática Identificada *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Solicitud de informe sobre estado de escenarios deportivos juveniles"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Entidad Destinataria *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Alcaldía de Flandes - Secretaría de Desarrollo Social"
                    value={targetEntity}
                    onChange={(e) => setTargetEntity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Número de Radicado Oficial (Si aplica)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. RAD-2024-00123"
                    value={filedRadicadoNumber}
                    onChange={(e) => setFiledRadicadoNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Fecha de Radicación
                  </label>
                  <input
                    type="date"
                    required
                    value={filingDate}
                    onChange={(e) => setFilingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Fecha Límite Legal
                  </label>
                  <input
                    type="date"
                    value={expectedResponseDate}
                    onChange={(e) => setExpectedResponseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VeeduriaStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold"
                  >
                    <option value="radicado">Radicado / En Espera</option>
                    <option value="en_espera">En Trámite</option>
                    <option value="respondido">Respuesta Recibida</option>
                    <option value="compromiso_pactado">Compromiso Pactado</option>
                    <option value="seguimiento_cerrado">Seguimiento Concluido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Descripción de la Problemática y Petición Concreta *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalla qué se solicita, antecedentes y fundamentos para la vigilancia ciudadana..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2">
                <span className="font-bold uppercase text-[11px] text-stone-700 dark:text-stone-300">
                  Respuesta y Conclusiones de la Entidad (Opcional)
                </span>
                <textarea
                  rows={2}
                  placeholder="Resumen de la contestación formal de la entidad..."
                  value={officialResponse}
                  onChange={(e) => setOfficialResponse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
                <input
                  type="text"
                  placeholder="Compromisos o fechas de cumplimiento acordadas..."
                  value={commitmentsGiven}
                  onChange={(e) => setCommitmentsGiven(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Enlaces a Documentos de Evidencia / Soporte
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (evidenceUrl.trim()) {
                        setEvidenceUrls([...evidenceUrls, evidenceUrl.trim()]);
                        setEvidenceUrl('');
                      }
                    }}
                    className="btn-dulima-secondary py-1.5 px-3 text-xs"
                  >
                    Agregar
                  </button>
                </div>
                {evidenceUrls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {evidenceUrls.map((url, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] p-1.5 bg-stone-100 dark:bg-stone-800 rounded">
                        <span className="truncate max-w-xs">{url}</span>
                        <button
                          type="button"
                          onClick={() => setEvidenceUrls(evidenceUrls.filter((_, idx) => idx !== i))}
                          className="text-red-500 font-bold ml-2"
                        >
                          ×
                        </button>
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
                  {editingId ? 'Guardar Cambios' : 'Registrar Veeduría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
