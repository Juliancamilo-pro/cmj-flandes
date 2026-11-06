import React, { useEffect, useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { SystemBackup } from '../../types';
import {
  createSystemBackup,
  getSystemBackups,
  deleteSystemBackup,
  restoreFromBackupJson
} from '../../services/securityService';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

const BACKUP_SCHEDULE_KEY = 'dulima_backup_schedule_v1';

export const AdminBackups: React.FC = () => {
  const { user, ownerEmail } = useAuth();
  const actorEmail = user?.email || ownerEmail;

  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Schedule & retention config
  const [frequency, setFrequency] = useState<'diaria' | 'semanal' | 'mensual'>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BACKUP_SCHEDULE_KEY) || '{}');
      return saved.frequency || 'semanal';
    } catch {
      return 'semanal';
    }
  });
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BACKUP_SCHEDULE_KEY) || '{}');
      return Number(saved.retentionDays) || 30;
    } catch {
      return 30;
    }
  });

  // Restore & Delete confirmation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestoreJson, setPendingRestoreJson] = useState<string | null>(null);
  const [backupToDelete, setBackupToDelete] = useState<SystemBackup | null>(null);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const list = await getSystemBackups();
      setBackups(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleSaveSchedule = () => {
    localStorage.setItem(
      BACKUP_SCHEDULE_KEY,
      JSON.stringify({ frequency, retentionDays, updatedAt: new Date().toISOString() })
    );
    setFeedback({
      type: 'ok',
      msg: `Política de respaldo programado (${frequency}, retención ${retentionDays} días) guardada.`
    });
  };

  const handleCreateBackup = async (downloadImmediately = true) => {
    setCreating(true);
    setFeedback(null);
    try {
      const { backup, snapshotJson } = await createSystemBackup(
        labelInput || `Respaldo Completo DULIMA ${new Date().toLocaleDateString('es-CO')}`,
        'manual',
        actorEmail
      );
      setLabelInput('');
      await loadBackups();

      if (downloadImmediately) {
        const blob = new Blob([snapshotJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DULIMA-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setFeedback({
        type: 'ok',
        msg: `Copia de seguridad "${backup.label}" creada (${backup.totalRecords} registros · SHA-256 verificado).`
      });
    } catch (err: any) {
      setFeedback({
        type: 'err',
        msg: err?.message || 'No se pudo generar la copia de seguridad.'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setFeedback({ type: 'err', msg: 'Solo se aceptan archivos de respaldo en formato .json.' });
      return;
    }
    const text = await file.text();
    setPendingRestoreJson(text);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreJson) return;
    setRestoring(true);
    setFeedback(null);
    try {
      const result = await restoreFromBackupJson(pendingRestoreJson, actorEmail);
      setPendingRestoreJson(null);
      setFeedback({
        type: 'ok',
        msg: `Restauración completada: ${result.restoredCollections} colecciones y ${result.restoredRecords} registros recuperados.`
      });
    } catch (err: any) {
      setFeedback({
        type: 'err',
        msg: err?.message || 'Error al restaurar la copia de seguridad.'
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!backupToDelete) return;
    await deleteSystemBackup(backupToDelete.id);
    setBackupToDelete(null);
    await loadBackups();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#9B1B30] dark:text-[#F2C94C]">
            Continuidad & Recuperación · DULIMA
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white mt-0.5">
            Copias de Seguridad
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Respaldos completos de artículos, usuarios, configuraciones, verificación de integridad SHA-256 y exportación externa.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBackups}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center space-x-2 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Create & Export Backup */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#9B1B30]/10 text-[#9B1B30] dark:bg-[#F2C94C]/10 dark:text-[#F2C94C]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#121212] dark:text-white">
              Generar Copia de Seguridad y Exportación Externa
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Crea un punto de restauración verificado y descarga una copia cifrada/verificada para almacenamiento externo.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Etiqueta opcional (ej. Antes de actualización editorial)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
          />
          <button
            type="button"
            disabled={creating}
            onClick={() => handleCreateBackup(true)}
            className="px-5 py-2.5 rounded-xl bg-[#9B1B30] hover:bg-[#7d1526] text-white text-xs font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{creating ? 'Generando respaldo...' : 'Crear y Descargar Respaldo (.json)'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            type="button"
            disabled={restoring}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Restaurar desde archivo</span>
          </button>
        </div>
      </section>

      {/* Retention & Schedule Policy */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-[#9B1B30] dark:text-[#F2C94C]" />
          <h2 className="text-base font-serif font-bold text-[#121212] dark:text-white">
            Programación y Retención de Respaldos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
              Frecuencia Programada
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
            >
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal (Recomendada)</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
              Retención de Historial
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
              <option value={365}>1 año</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSaveSchedule}
            className="px-4 py-2.5 rounded-xl bg-[#121212] dark:bg-[#F2C94C] text-white dark:text-stone-950 text-xs font-bold cursor-pointer"
          >
            Guardar Política
          </button>
        </div>
      </section>

      {/* Backups History */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-serif font-bold text-[#121212] dark:text-white">
          Historial de Copias de Seguridad ({backups.length})
        </h2>

        {backups.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-6 text-center">
            Aún no se han generado copias de seguridad. Crea tu primer respaldo arriba.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {backups.map((b) => (
              <div
                key={b.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-serif font-bold text-sm text-[#121212] dark:text-white">
                      {b.label}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {b.type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                    {b.totalRecords} registros · {(b.sizeBytes / 1024).toFixed(1)} KB · SHA-256:{' '}
                    {b.checksumSha256.slice(0, 16)}...
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Creado por {b.createdBy} el {new Date(b.createdAt).toLocaleString('es-CO')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setBackupToDelete(b)}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer self-start"
                  title="Eliminar registro de respaldo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={!!pendingRestoreJson}
        title="¿Restaurar base de datos desde copia de seguridad?"
        message="Se combinarán y restaurarán los registros del archivo seleccionado en la base de datos de DULIMA. Esta acción quedará registrada en el Centro de Seguridad."
        confirmText="Sí, restaurar datos"
        onConfirm={handleConfirmRestore}
        onCancel={() => setPendingRestoreJson(null)}
      />

      <ConfirmModal
        isOpen={!!backupToDelete}
        title="¿Eliminar registro de copia de seguridad?"
        message={`Se eliminará el registro "${backupToDelete?.label || ''}" del historial.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteBackup}
        onCancel={() => setBackupToDelete(null)}
      />
    </div>
  );
};
