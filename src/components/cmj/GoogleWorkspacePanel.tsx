import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileText,
  MessageSquare,
  Plus,
  Send,
  RefreshCw,
  ExternalLink,
  LogOut,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  GoogleChatMessage,
  GoogleChatSpace,
  GoogleDocSummary,
  appendTextToGoogleDoc,
  createChatSpace,
  createGoogleDoc,
  initWorkspaceAuth,
  listChatMessages,
  listChatSpaces,
  listGoogleDocs,
  readGoogleDoc,
  sendChatMessage,
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
} from '../../services/googleWorkspace';

interface PendingConfirmation {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}

export const GoogleWorkspacePanel: React.FC = () => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [subTab, setSubTab] = useState<'docs' | 'chat'>('docs');
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<PendingConfirmation | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Google Docs state
  const [docs, setDocs] = useState<GoogleDocSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{
    documentId: string;
    title: string;
    bodyText: string;
  } | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [appendText, setAppendText] = useState('');

  // Google Chat state
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [newSpaceName, setNewSpaceName] = useState('');

  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (u) => {
        setGoogleUser(u);
        setNeedsAuth(false);
      },
      () => {
        setGoogleUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  const loadDocs = async () => {
    setLoadingDocs(true);
    setError(null);
    try {
      const list = await listGoogleDocs();
      setDocs(list);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los documentos de Google Docs.');
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadSpaces = async () => {
    setLoadingSpaces(true);
    setError(null);
    try {
      const list = await listChatSpaces();
      setSpaces(list);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los espacios de Google Chat.');
    } finally {
      setLoadingSpaces(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await signInWithGoogleWorkspace();
      setGoogleUser(res.user);
      setNeedsAuth(false);
      await Promise.all([loadDocs(), loadSpaces()]);
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con Google Workspace.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOpenDoc = async (docId: string) => {
    setError(null);
    try {
      const full = await readGoogleDoc(docId);
      setSelectedDoc(full);
    } catch (err: any) {
      setError(err?.message || 'Error al leer el documento.');
    }
  };

  const handleSelectSpace = async (space: GoogleChatSpace) => {
    setSelectedSpace(space);
    setError(null);
    try {
      const msgs = await listChatMessages(space.name);
      setMessages(msgs);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar mensajes del espacio.');
    }
  };

  if (needsAuth) {
    return (
      <div className="rounded-2xl p-8 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-center space-y-5">
        <div className="max-w-lg mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
            Integración Oficial Google Workspace
          </span>
          <h2 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">
            Conectar Google Docs y Google Chat
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Inicia sesión con tu cuenta de Google para redactar y consultar actas en <strong>Google Docs</strong> y coordinar espacios de trabajo en <strong>Google Chat</strong>.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <button
            type="button"
            disabled={isLoggingIn}
            onClick={handleGoogleLogin}
            className="gsi-material-button"
          >
            <div className="gsi-material-button-state" />
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span className="gsi-material-button-contents">
                {isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Header */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Conectado a Google Workspace: {googleUser?.displayName || googleUser?.email}
            </p>
            <p className="text-xs text-stone-500">{googleUser?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('docs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase ${
              subTab === 'docs'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Google Docs</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase ${
              subTab === 'chat'
                ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Google Chat</span>
          </button>
          <button
            type="button"
            onClick={() => signOutGoogleWorkspace()}
            className="btn-dulima-secondary py-2 px-3 text-xs"
            title="Desconectar Google Workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Desconectar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
          {statusMsg}
        </div>
      )}

      {/* GOOGLE DOCS TAB */}
      {subTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl p-5 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-bold">Mis Documentos (Google Docs)</h3>
                <button
                  type="button"
                  onClick={loadDocs}
                  disabled={loadingDocs}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDocs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {docs.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4">
                    Haz clic en actualizar o crea un nuevo documento en Google Docs.
                  </p>
                ) : (
                  docs.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleOpenDoc(d.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleOpenDoc(d.id);
                      }}
                      className="cursor-pointer p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {d.name}
                        </p>
                        {d.modifiedTime && (
                          <p className="text-[10px] text-stone-500">
                            {new Date(d.modifiedTime).toLocaleString('es-CO')}
                          </p>
                        )}
                      </div>
                      {d.webViewLink && (
                        <a
                          href={d.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-stone-400 hover:text-[#8c162a]"
                          title="Abrir en Google Docs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Create New Google Doc */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDocTitle.trim()) return;
                setConfirmDialog({
                  title: 'Confirmar creación en Google Docs',
                  description: `Se creará un nuevo documento en tu cuenta de Google Drive titulado "${newDocTitle}".`,
                  onConfirm: async () => {
                    const created = await createGoogleDoc(newDocTitle, newDocContent);
                    setNewDocTitle('');
                    setNewDocContent('');
                    setStatusMsg(`Documento "${created.title}" creado en Google Docs.`);
                    await loadDocs();
                    await handleOpenDoc(created.documentId);
                  },
                });
              }}
              className="rounded-2xl p-5 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3"
            >
              <h3 className="text-sm font-display font-bold">Crear Nuevo Google Doc</h3>
              <input
                type="text"
                required
                placeholder="Título del documento (ej. Acta Sesión Ordinaria)"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
              />
              <textarea
                rows={3}
                placeholder="Contenido inicial (opcional)"
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
              />
              <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Crear en Google Docs</span>
              </button>
            </form>
          </div>

          {/* Document Viewer & Append */}
          <div className="lg:col-span-7 rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-4">
            {selectedDoc ? (
              <>
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                  <h3 className="text-lg font-display font-bold">{selectedDoc.title}</h3>
                  <a
                    href={`https://docs.google.com/document/d/${selectedDoc.documentId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-dulima-secondary py-1.5 px-3 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Editar en Google Docs</span>
                  </a>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 max-h-72 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-stone-700 dark:text-stone-200">
                  {selectedDoc.bodyText || '(Documento vacío)'}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!appendText.trim()) return;
                    setConfirmDialog({
                      title: 'Confirmar edición en Google Docs',
                      description: `Se agregará el texto ingresado al final del documento "${selectedDoc.title}".`,
                      onConfirm: async () => {
                        await appendTextToGoogleDoc(selectedDoc.documentId, appendText);
                        setAppendText('');
                        setStatusMsg('Texto agregado al documento en Google Docs.');
                        await handleOpenDoc(selectedDoc.documentId);
                      },
                    });
                  }}
                  className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800"
                >
                  <label className="block text-xs font-bold uppercase text-stone-500">
                    Agregar párrafo al documento
                  </label>
                  <textarea
                    rows={2}
                    value={appendText}
                    onChange={(e) => setAppendText(e.target.value)}
                    placeholder="Escribe el texto que deseas añadir al final del documento..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs">
                    Agregar Texto
                  </button>
                </form>
              </>
            ) : (
              <div className="py-16 text-center text-sm text-stone-500">
                Selecciona un documento de la lista para visualizar su contenido o añadir notas.
              </div>
            )}
          </div>
        </div>
      )}

      {/* GOOGLE CHAT TAB */}
      {subTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl p-5 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-bold">Espacios de Google Chat</h3>
                <button
                  type="button"
                  onClick={loadSpaces}
                  disabled={loadingSpaces}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSpaces ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {spaces.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4">
                    No se encontraron espacios o haz clic en actualizar.
                  </p>
                ) : (
                  spaces.map((sp) => (
                    <button
                      key={sp.name}
                      type="button"
                      onClick={() => handleSelectSpace(sp)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-colors ${
                        selectedSpace?.name === sp.name
                          ? 'bg-[#8c162a] text-white dark:bg-[#f2c94c] dark:text-stone-950 border-transparent'
                          : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      {sp.displayName || sp.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSpaceName.trim()) return;
                setConfirmDialog({
                  title: 'Confirmar creación de espacio en Google Chat',
                  description: `Se creará el espacio "${newSpaceName}" en tu cuenta de Google Chat.`,
                  onConfirm: async () => {
                    await createChatSpace(newSpaceName);
                    setNewSpaceName('');
                    setStatusMsg('Espacio creado en Google Chat.');
                    await loadSpaces();
                  },
                });
              }}
              className="rounded-2xl p-5 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 space-y-3"
            >
              <h3 className="text-sm font-display font-bold">Crear Espacio de Chat</h3>
              <input
                type="text"
                required
                placeholder="Nombre del espacio (ej. Comisión Educación CMJ)"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
              />
              <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Espacio</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 rounded-2xl p-6 bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex flex-col justify-between min-h-[380px]">
            {selectedSpace ? (
              <>
                <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-display font-bold">
                    {selectedSpace.displayName || selectedSpace.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleSelectSpace(selectedSpace)}
                    className="text-xs font-bold text-[#8c162a] dark:text-[#f2c94c] hover:underline"
                  >
                    Actualizar mensajes
                  </button>
                </div>

                <div className="flex-1 py-4 space-y-2.5 max-h-72 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-8">
                      No hay mensajes recientes en este espacio.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.name}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                          <span className="font-bold text-stone-800 dark:text-stone-200">
                            {m.sender?.displayName || m.sender?.name || 'Usuario'}
                          </span>
                          {m.createTime && (
                            <span>{new Date(m.createTime).toLocaleTimeString('es-CO')}</span>
                          )}
                        </div>
                        <p className="text-stone-700 dark:text-stone-200">{m.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newMessageText.trim()) return;
                    const space = selectedSpace;
                    const text = newMessageText;
                    setConfirmDialog({
                      title: 'Confirmar envío de mensaje en Google Chat',
                      description: `¿Deseas enviar este mensaje al espacio "${space.displayName || space.name}"?`,
                      onConfirm: async () => {
                        await sendChatMessage(space.name, text);
                        setNewMessageText('');
                        setStatusMsg('Mensaje enviado a Google Chat.');
                        await handleSelectSpace(space);
                      },
                    });
                  }}
                  className="pt-3 border-t border-stone-200 dark:border-stone-800 flex gap-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="Escribe un mensaje para el espacio..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                  <button type="submit" className="btn-dulima-primary py-2 px-4 text-xs">
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="py-20 text-center text-sm text-stone-500">
                Selecciona un espacio de Google Chat para leer y enviar mensajes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Modal for Mutating Workspace Operations */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => !confirmBusy && setConfirmDialog(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-display font-bold text-stone-900 dark:text-stone-100">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmDialog(null)}
                className="btn-dulima-secondary py-2 px-4 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  setError(null);
                  try {
                    await confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  } catch (err: any) {
                    setError(err?.message || 'Error ejecutando la acción en Google Workspace.');
                    setConfirmDialog(null);
                  } finally {
                    setConfirmBusy(false);
                  }
                }}
                className="btn-dulima-primary py-2 px-4 text-xs"
              >
                {confirmBusy ? 'Procesando...' : 'Confirmar y Ejecutar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
