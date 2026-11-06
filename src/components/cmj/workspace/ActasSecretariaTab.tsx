import React, { useState } from 'react';
import {
  FileText,
  Plus,
  History,
  CheckCircle2,
  Clock,
  Printer,
  Upload,
  Download,
  Trash2,
  Edit2,
  FileCheck,
} from 'lucide-react';
import { CmjDocument, DocumentType, CmjMember, ApprovalStatus } from '../../../types/cmj.ts';
import { DOCUMENT_TYPE_LABELS } from '../../../constants/cmj.ts';
import { cmjApi } from '../../../services/cmjApi.ts';

interface ActasSecretariaTabProps {
  documents: CmjDocument[];
  currentUser: CmjMember;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  onRefresh: () => void;
  notify: (type: 'ok' | 'err', text: string) => void;
}

export const ActasSecretariaTab: React.FC<ActasSecretariaTabProps> = ({
  documents,
  currentUser,
  canCreate,
  canEdit,
  canDelete,
  canApprove,
  onRefresh,
  notify,
}) => {
  const [filterType, setFilterType] = useState<string>('todas');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [template, setTemplate] = useState<'ordinaria' | 'extraordinaria' | 'comision'>('ordinaria');

  // Form state
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [docType, setDocType] = useState<DocumentType>('acta_ordinaria');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [interventions, setInterventions] = useState('');
  const [propositions, setPropositions] = useState('');
  const [decisions, setDecisions] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Version modal state
  const [versionDocId, setVersionDocId] = useState<string | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');

  // Reader / Printable state
  const [viewingActa, setViewingActa] = useState<CmjDocument | null>(null);

  const actasOnly = documents.filter(
    (d) =>
      d.type === 'acta_ordinaria' ||
      d.type === 'acta_extraordinaria' ||
      d.type === 'proposicion' ||
      d.type === 'convocatoria'
  );

  const handleApplyTemplate = (type: 'ordinaria' | 'extraordinaria' | 'comision') => {
    setTemplate(type);
    if (type === 'ordinaria') {
      setDocType('acta_ordinaria');
      setTitle(`Acta de Sesión Plenaria Ordinaria N° ${String(actasOnly.length + 1).padStart(3, '0')}`);
      setCode(`ACTA-ORD-${new Date().getFullYear()}-${String(actasOnly.length + 1).padStart(3, '0')}`);
      setDescription('Acta oficial de sesión plenaria ordinaria correspondiente a los debates y proposiciones juveniles.');
      setInterventions('1. Verificación del cuórum y apertura de sesión por la Presidencia.\n2. Lectura y aprobación del orden del día.\n3. Intervención de los consejeros sobre problemáticas del territorio.\n4. Proposiciones y varios.');
      setDecisions('Se aprueban por unanimidad los puntos del orden del día y se fijan los compromisos de las comisiones.');
    } else if (type === 'extraordinaria') {
      setDocType('acta_extraordinaria');
      setTitle(`Acta de Sesión Extraordinaria N° ${String(actasOnly.length + 1).padStart(3, '0')}`);
      setCode(`ACTA-EXT-${new Date().getFullYear()}-${String(actasOnly.length + 1).padStart(3, '0')}`);
      setDescription('Acta de sesión extraordinaria convocada para atender asuntos de urgencia institucional.');
      setInterventions('1. Apertura de sesión con verificación de cuórum reglamentario.\n2. Discusión de los temas prioritarios citados en la convocatoria.');
      setDecisions('Decisiones adoptadas con registro formal de votación nominal.');
    } else {
      setDocType('acta_ordinaria');
      setTitle(`Acta de Reunión de Comisión N° ${String(actasOnly.length + 1).padStart(3, '0')}`);
      setCode(`ACTA-COM-${new Date().getFullYear()}-${String(actasOnly.length + 1).padStart(3, '0')}`);
      setDescription('Acta de trabajo interno de la comisión asignada.');
      setInterventions('1. Instalación de la mesa de trabajo de la comisión.\n2. Revisión de metas del plan de trabajo anual.');
      setDecisions('Acuerdos internos y asignación de tareas a los integrantes de la comisión.');
    }
  };

  const handleCreateActa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      notify('err', 'El título y el código del acta son obligatorios.');
      return;
    }

    try {
      let fileUrl = 'https://cmj-flandes.gov.co/documentos/acta-oficial.pdf';
      let fileName = `${code}.pdf`;
      let fileSize = 150000;

      if (selectedFile) {
        const up = await cmjApi.uploadFile(selectedFile);
        fileUrl = up.fileUrl;
        fileName = up.fileName;
        fileSize = up.fileSize;
      }

      const fullDesc = [
        description,
        interventions ? `\n\n--- INTERVENCIONES Y DESARROLLO ---\n${interventions}` : '',
        propositions ? `\n\n--- PROPOSICIONES REGISTRADAS ---\n${propositions}` : '',
        decisions ? `\n\n--- DECISIONES Y COMPROMISOS ---\n${decisions}` : '',
      ].join('');

      await cmjApi.createDocument({
        title,
        code,
        type: docType,
        documentDate,
        description: fullDesc,
        fileUrl,
        fileName,
        fileSize,
        publishNow: false, // Starts as draft / pending approval
      });

      setShowCreateModal(false);
      setSelectedFile(null);
      notify('ok', `Acta ${code} elaborada y registrada en Secretaría. Estado: Borrador / Pendiente de Aprobación.`);
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error registrando acta.');
    }
  };

  const handleApproveActa = async (docId: string) => {
    try {
      await cmjApi.updateDocumentStatus(docId, 'publicado');
      notify('ok', 'Acta formalmente aprobada y publicada con validez institucional.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error aprobando acta.');
    }
  };

  const handleUploadVersion = async (docId: string) => {
    if (!versionFile) {
      notify('err', 'Selecciona el documento corregido de la nueva versión.');
      return;
    }
    try {
      const up = await cmjApi.uploadFile(versionFile);
      await cmjApi.addDocumentVersion(docId, {
        fileUrl: up.fileUrl,
        fileName: up.fileName,
        fileSize: up.fileSize,
        notes: versionNotes.trim() || 'Corrección de acta aprobada con registro de trazabilidad',
      });
      setVersionDocId(null);
      setVersionFile(null);
      setVersionNotes('');
      notify('ok', 'Nueva versión del acta registrada conservando la trazabilidad de versiones anteriores.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error guardando versión.');
    }
  };

  const filteredActas = actasOnly.filter((d) => {
    if (filterType !== 'todas' && d.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Secretaría Digital y Gestión de Actas
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Elaboración formal de actas desde plantillas, control de borradores, aprobación, trazabilidad de versiones y expedientes.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              handleApplyTemplate('ordinaria');
              setShowCreateModal(true);
            }}
            className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Elaborar Nueva Acta</span>
          </button>
        )}
      </div>

      {/* Actas List */}
      <div className="space-y-3.5">
        {filteredActas.map((d) => {
          const isApproved = d.approvalStatus === 'publicado';
          return (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs hover:border-stone-400 dark:hover:border-stone-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[#003893] dark:text-[#f2c94c]">
                    {d.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {isApproved ? 'Aprobada Oficialmente' : 'Borrador / En Revisión'}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    v{d.currentVersion} ({d.documentDate})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingActa(d)}
                    className="btn-dulima-secondary py-1 px-3 text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Contenido</span>
                  </button>

                  {!isApproved && canApprove && (
                    <button
                      type="button"
                      onClick={() => handleApproveActa(d.id)}
                      className="btn-dulima-primary py-1 px-3 text-xs font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar Acta</span>
                    </button>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setVersionDocId(versionDocId === d.id ? null : d.id)}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Nueva Versión (v{d.currentVersion + 1})</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {d.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                  {d.description}
                </p>
              </div>

              {/* Version History summary if > 1 */}
              {d.versions && d.versions.length > 1 && (
                <div className="pt-2 text-[11px] text-stone-500 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  <span>
                    Historial: {d.versions.length} versiones registradas. Última modificación por {d.versions[d.versions.length - 1].uploadedBy}.
                  </span>
                </div>
              )}

              {/* Inline Upload New Version Box */}
              {versionDocId === d.id && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
                  <span className="font-bold uppercase text-[10px] text-stone-700 dark:text-stone-300">
                    Cargar Versión {d.currentVersion + 1} de {d.code}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Motivo de la corrección o nota de versión..."
                      value={versionNotes}
                      onChange={(e) => setVersionNotes(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setVersionDocId(null)}
                      className="btn-dulima-secondary py-1 px-3 text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUploadVersion(d.id)}
                      className="btn-dulima-primary py-1 px-3 text-xs font-bold"
                    >
                      Guardar v{d.currentVersion + 1} con Trazabilidad
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredActas.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 space-y-2">
          <FileText className="w-10 h-10 mx-auto text-stone-400 opacity-60" />
          <h3 className="font-bold text-base">No hay actas registradas en la secretaría aún</h3>
        </div>
      )}

      {/* Modal View / Print Acta */}
      {viewingActa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#003893] dark:text-[#f2c94c]">
                  {viewingActa.code} · Versión {viewingActa.currentVersion}
                </span>
                <h3 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {viewingActa.title}
                </h3>
                <p className="text-xs text-stone-500">
                  Fecha del acta: {viewingActa.documentDate} · Responsable: {viewingActa.responsibleName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingActa(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 whitespace-pre-wrap leading-relaxed font-sans text-stone-800 dark:text-stone-200">
                {viewingActa.description}
              </div>

              {viewingActa.fileUrl && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                  <span>Archivo digital oficial adjunto ({viewingActa.fileName})</span>
                  <a
                    href={viewingActa.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-dulima-primary py-1 px-3 text-xs inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-dulima-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Acta</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingActa(null)}
                className="btn-dulima-primary py-1.5 px-4 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Elaborar Acta */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
                  Elaborar Acta Institucional — Secretaría Digital
                </h3>
                <p className="text-xs text-stone-500">
                  Selecciona una plantilla oficial para agilizar la redacción del acta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Plantillas Selector */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyTemplate('ordinaria')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  template === 'ordinaria'
                    ? 'bg-[#003893] text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                Plantilla Sesión Ordinaria
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('extraordinaria')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  template === 'extraordinaria'
                    ? 'bg-[#003893] text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                Plantilla Sesión Extraordinaria
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('comision')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  template === 'comision'
                    ? 'bg-[#003893] text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                Plantilla Reunión de Comisión
              </button>
            </div>

            <form onSubmit={handleCreateActa} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Título del Acta *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Código Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Fecha de la Sesión / Acta
                  </label>
                  <input
                    type="date"
                    required
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold"
                  >
                    <option value="acta_ordinaria">Acta Ordinaria</option>
                    <option value="acta_extraordinaria">Acta Extraordinaria</option>
                    <option value="convocatoria">Convocatoria Oficial</option>
                    <option value="proposicion">Proposición Registrada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Resumen y Objeto de la Sesión
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Desarrollo de la Sesión e Intervenciones
                </label>
                <textarea
                  rows={3}
                  value={interventions}
                  onChange={(e) => setInterventions(e.target.value)}
                  placeholder="Registro de puntos debatidos y constancias de los consejeros..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Decisiones, Votaciones y Compromisos Pactados
                </label>
                <textarea
                  rows={2}
                  value={decisions}
                  onChange={(e) => setDecisions(e.target.value)}
                  placeholder="Decisiones adoptadas y compromisos asignados..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Adjuntar Documento Firmado / PDF Oficial (Opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-dulima-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs font-bold">
                  Guardar Acta en Secretaría (Borrador)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
