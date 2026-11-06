import React, { useEffect, useState } from 'react';
import {
  Flag,
  MessageSquareWarning,
  Trash2,
  EyeOff,
  CheckCircle2,
  UserX,
  RefreshCw,
  ShieldAlert,
  History
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ContentReport, Comment, ModerationLog } from '../../types';
import { recordModerationDecision, getModerationLogs } from '../../services/securityService';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /(.)\1{6,}/,
  /\b(casino|cripto|gana dinero|viagra|telegram\.me|wa\.me|clic aquí|oferta gratis)\b/i
];

function isLikelySpam(text: string): boolean {
  return SPAM_PATTERNS.some((rx) => rx.test(text));
}

export const AdminModeration: React.FC = () => {
  const { user, ownerEmail } = useAuth();
  const moderatorEmail = user?.email || ownerEmail;

  const [reports, setReports] = useState<ContentReport[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'comments' | 'logs'>('reports');

  const [confirmDeleteComment, setConfirmDeleteComment] = useState<Comment | null>(null);
  const [suspendEmailInput, setSuspendEmailInput] = useState('');
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [repSnap, comSnap, modLogs] = await Promise.all([
        getDocs(query(collection(db, 'content_reports'), orderBy('createdAt', 'desc'))).catch(() => null),
        getDocs(query(collection(db, 'comments'), orderBy('createdAt', 'desc'))).catch(() => null),
        getModerationLogs()
      ]);

      if (repSnap) {
        setReports(repSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContentReport, 'id'>) })));
      }
      if (comSnap) {
        setComments(comSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) })));
      }
      setLogs(modLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateReportStatus = async (
    report: ContentReport,
    status: 'revisado' | 'descartado'
  ) => {
    await updateDoc(doc(db, 'content_reports', report.id), {
      status,
      reviewedAt: new Date().toISOString()
    });
    await recordModerationDecision({
      targetType: 'article',
      targetId: report.articleId,
      targetSummary: `${report.articleTitle} (Motivo: ${report.reason})`,
      action: status === 'revisado' ? 'aprobar' : 'descartar_reporte',
      reason: `Reporte marcado como ${status}`,
      moderatorEmail
    });
    setFeedback(`Reporte sobre "${report.articleTitle}" marcado como ${status}.`);
    await loadData();
  };

  const handleCommentAction = async (comment: Comment, newStatus: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'comments', comment.id), { status: newStatus });
    await recordModerationDecision({
      targetType: 'comment',
      targetId: comment.id,
      targetSummary: `${comment.authorName}: "${comment.content.slice(0, 60)}..."`,
      action: newStatus === 'approved' ? 'aprobar' : 'ocultar',
      reason: newStatus === 'approved' ? 'Comentario aprobado en moderación' : 'Comentario ocultado por infringir normas',
      moderatorEmail
    });
    setFeedback(
      newStatus === 'approved'
        ? 'Comentario aprobado y visible.'
        : 'Comentario ocultado del portal público.'
    );
    await loadData();
  };

  const handleDeleteComment = async () => {
    if (!confirmDeleteComment) return;
    await deleteDoc(doc(db, 'comments', confirmDeleteComment.id));
    await recordModerationDecision({
      targetType: 'comment',
      targetId: confirmDeleteComment.id,
      targetSummary: `${confirmDeleteComment.authorName}: "${confirmDeleteComment.content.slice(0, 60)}..."`,
      action: 'eliminar',
      reason: 'Eliminado permanentemente por moderación',
      moderatorEmail
    });
    setConfirmDeleteComment(null);
    setFeedback('Comentario eliminado permanentemente.');
    await loadData();
  };

  const handleSuspendAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = suspendEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    let suspendedCount = 0;
    try {
      const colSnap = await getDocs(collection(db, 'collaborators'));
      for (const d of colSnap.docs) {
        if (String(d.data().email || '').toLowerCase() === cleanEmail) {
          await updateDoc(doc(db, 'collaborators', d.id), { status: 'suspendido' });
          suspendedCount++;
        }
      }
      const subSnap = await getDocs(collection(db, 'subscribers_premium'));
      for (const d of subSnap.docs) {
        if (String(d.data().email || '').toLowerCase() === cleanEmail) {
          await updateDoc(doc(db, 'subscribers_premium', d.id), { status: 'suspendida' });
          suspendedCount++;
        }
      }
    } catch {}

    await recordModerationDecision({
      targetType: 'user',
      targetId: cleanEmail,
      targetSummary: cleanEmail,
      action: 'suspender_cuenta',
      reason: suspendReasonInput.trim() || 'Suspensión temporal por incumplimiento de normas editoriales',
      moderatorEmail
    });

    setFeedback(
      suspendedCount > 0
        ? `Cuenta ${cleanEmail} suspendida temporalmente (${suspendedCount} perfil(es) actualizado(s)).`
        : `Se registró la suspensión preventiva para ${cleanEmail} en el historial de moderación.`
    );
    setSuspendEmailInput('');
    setSuspendReasonInput('');
    await loadData();
  };

  const spamComments = comments.filter((c) => isLikelySpam(c.content));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#9B1B30] dark:text-[#F2C94C]">
            Control Editorial · DULIMA
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#121212] dark:text-white mt-0.5">
            Panel de Moderación
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Revisión de contenido denunciado, detección de spam, suspensión temporal de cuentas y registro auditable.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#9B1B30] text-white'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Publicaciones Denunciadas ({reports.filter((r) => r.status === 'pendiente').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer ${
            activeTab === 'comments'
              ? 'bg-[#9B1B30] text-white'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <MessageSquareWarning className="w-3.5 h-3.5" />
          <span>Comentarios & Spam ({spamComments.length} sospechosos)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-[#9B1B30] text-white'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historial Auditable ({logs.length})</span>
        </button>
      </div>

      {/* Tab 1: Reported Content */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
              No hay reportes de contenido en este momento.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rep.status === 'pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : rep.status === 'revisado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {rep.status}
                    </span>
                    <span className="text-xs font-mono text-[#9B1B30] dark:text-[#F2C94C] font-bold">
                      Motivo: {rep.reason}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                    {rep.articleTitle}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300">{rep.details}</p>
                  <p className="text-[11px] text-stone-400">
                    Reportado el {new Date(rep.createdAt).toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateReportStatus(rep, 'revisado')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Marcar revisado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateReportStatus(rep, 'descartado')}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Comments & Spam */}
      {activeTab === 'comments' && (
        <div className="space-y-3">
          {comments.slice(0, 40).map((com) => {
            const spam = isLikelySpam(com.content);
            return (
              <div
                key={com.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  spam
                    ? 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900'
                    : 'bg-white dark:bg-[#18181c] border-[#e8e5dc] dark:border-stone-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-[#121212] dark:text-white">
                      {com.authorName}
                    </span>
                    <span className="text-[11px] text-stone-400">en «{com.articleTitle}»</span>
                    {spam && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                        Posible Spam
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {com.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300">{com.content}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {com.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleCommentAction(com, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Aprobar
                    </button>
                  )}
                  {com.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleCommentAction(com, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ocultar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteComment(com)}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="Eliminar comentario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Auditable Moderation Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 space-y-3">
          {logs.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">
              Aún no hay decisiones registradas en el historial de moderación.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="py-3 border-b last:border-b-0 border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold uppercase text-[#9B1B30] dark:text-[#F2C94C] mr-2">
                    [{log.action}]
                  </span>
                  <span className="font-semibold text-[#121212] dark:text-white">
                    {log.targetSummary}
                  </span>
                  <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                    Motivo: {log.reason} · Moderador: {log.moderatorEmail}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-stone-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString('es-CO')}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Suspend Account Box */}
      <section className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <UserX className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-serif font-bold text-[#121212] dark:text-white">
            Suspensión Temporal de Cuenta por Infracción
          </h2>
        </div>
        <form onSubmit={handleSuspendAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            required
            value={suspendEmailInput}
            onChange={(e) => setSuspendEmailInput(e.target.value)}
            placeholder="Correo del colaborador o suscriptor"
            className="px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
          />
          <input
            type="text"
            required
            value={suspendReasonInput}
            onChange={(e) => setSuspendReasonInput(e.target.value)}
            placeholder="Motivo de la suspensión..."
            className="px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
          >
            Suspender cuenta temporalmente
          </button>
        </form>
      </section>

      <ConfirmModal
        isOpen={!!confirmDeleteComment}
        title="¿Eliminar comentario permanentemente?"
        message="Esta acción eliminará el comentario de la base de datos y quedará registrada en el historial de moderación."
        confirmText="Eliminar comentario"
        onConfirm={handleDeleteComment}
        onCancel={() => setConfirmDeleteComment(null)}
      />
    </div>
  );
};
