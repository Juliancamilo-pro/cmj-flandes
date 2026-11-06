import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Search, 
  Upload, 
  RefreshCw, 
  Download, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { 
  signInGoogleDrive, 
  listDriveFiles, 
  uploadFileToDrive, 
  createDriveEditorialBackup, 
  deleteDriveFile, 
  getDriveAccessToken, 
  disconnectDrive, 
  DriveFileItem 
} from '../../services/googleDrive';
import { Article, PlatformSettings } from '../../types';
import { addMediaItem } from '../../services/db';
import { ConfirmModal } from '../common/ConfirmModal';

interface GoogleDriveManagerProps {
  articles?: Article[];
  settings?: PlatformSettings | null;
  onImportImageToMedia?: (url: string, name: string) => void;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  articles = [],
  settings = null,
  onImportImageToMedia
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'images' | 'documents'>('all');
  const [uploading, setUploading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete confirmation modal state (strictly required by Workspace skill)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getDriveAccessToken().then((token) => {
      if (token) {
        setIsConnected(true);
        loadFiles(token);
      }
    });
  }, []);

  const handleSignIn = async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      const res = await signInGoogleDrive();
      if (res) {
        setIsConnected(true);
        setSuccessMsg(`Conectado a Google Drive como ${res.user.displayName || res.user.email}`);
        setTimeout(() => setSuccessMsg(null), 3500);
        await loadFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMsg(err.message || 'No fue posible conectar con Google Drive.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectDrive();
    setIsConnected(false);
    setFiles([]);
    setSuccessMsg('Sesión de Google Drive desconectada.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const loadFiles = async (tokenOverride?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const driveFiles = await listDriveFiles({
        query: searchQuery,
        mimeTypeFilter: typeFilter
      });
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Error listing files:', err);
      setErrorMsg(err.message || 'Error al listar archivos de Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);
    try {
      const uploaded = await uploadFileToDrive(file);
      setSuccessMsg(`Archivo "${uploaded.name}" subido a Google Drive.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      await loadFiles();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'No fue posible subir el archivo a Google Drive.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    setErrorMsg(null);
    try {
      const backupFile = await createDriveEditorialBackup(articles, settings);
      setSuccessMsg(`¡Copia de respaldo editorial guardada en Google Drive! Archivo: ${backupFile.name}`);
      setTimeout(() => setSuccessMsg(null), 4500);
      await loadFiles();
    } catch (err: any) {
      console.error('Backup error:', err);
      setErrorMsg(err.message || 'Error al generar la copia de respaldo en Google Drive.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleImportToMediaLibrary = async (file: DriveFileItem) => {
    // If the file has a webViewLink or thumbnailLink
    const imageUrl = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s1200') : file.webContentLink;
    if (!imageUrl) {
      setErrorMsg('Este archivo no cuenta con enlace público de imagen.');
      return;
    }

    try {
      await addMediaItem({
        title: file.name,
        fileName: file.name,
        url: imageUrl,
        fileSize: file.size ? parseInt(file.size, 10) : 0,
        mimeType: file.mimeType
      });

      if (onImportImageToMedia) {
        onImportImageToMedia(imageUrl, file.name);
      }

      setSuccessMsg(`"${file.name}" importada exitosamente a la Biblioteca Multimedia.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg('No fue posible importar la imagen a la biblioteca.');
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setSuccessMsg(`Archivo "${fileToDelete.name}" eliminado de Google Drive.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setFileToDelete(null);
      await loadFiles();
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMsg(err.message || 'Error al eliminar el archivo.');
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
              Integración con Google Drive
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Explora tus archivos de Drive, importa fotografías a tus artículos y genera copias de respaldo editoriales en la nube.
          </p>
        </div>

        {/* Auth Status & Sign-in */}
        {isConnected ? (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Drive Conectado</span>
            </span>
            <button
              onClick={handleDisconnect}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              title="Desconectar Google Drive"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {/* Official Material Google Sign-In Button */}
            <button
              onClick={handleSignIn}
              disabled={connecting}
              className="inline-flex items-center space-x-3 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#18181b] hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-sans text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>{connecting ? 'Conectando con Google...' : 'Conectar Google Drive'}</span>
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!isConnected ? (
        <div className="p-10 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-gold-500/30 text-gold-600 mx-auto flex items-center justify-center">
            <HardDrive className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-serif font-bold text-stone-900 dark:text-white">
              Vincula tu cuenta de Google Drive
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Permite a la plataforma acceder con tu autorización a tus carpetas y archivos en Google Drive para importar fotografías, documentos y respaldar tu producción editorial.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={connecting}
            className="px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 text-xs font-bold font-sans uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50"
          >
            {connecting ? 'Conectando...' : 'Iniciar Sesión con Google'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Action Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadFiles()}
                  placeholder="Buscar archivos en Drive..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any);
                }}
                className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
              >
                <option value="all">Todos los archivos</option>
                <option value="images">Solo Imágenes (Fotos)</option>
                <option value="documents">Documentos / PDFs</option>
              </select>

              <button
                onClick={() => loadFiles()}
                disabled={loading}
                className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer"
                title="Actualizar lista de Drive"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Actions: Upload to Drive & Editorial Backup */}
            <div className="flex items-center space-x-2">
              <label className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold cursor-pointer inline-flex items-center space-x-1.5 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Subiendo...' : 'Subir a Drive'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleCreateBackup}
                disabled={backingUp || articles.length === 0}
                className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>{backingUp ? 'Respaldando...' : 'Crear Respaldo en Drive'}</span>
              </button>
            </div>
          </div>

          {/* Files Grid / List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-gold-500" />
              <span>Consultando archivos en Google Drive...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-2">
              <HardDrive className="w-6 h-6 mx-auto text-stone-400" />
              <p className="text-xs text-stone-500">No se encontraron archivos en Google Drive con este criterio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => {
                const isImage = file.mimeType.includes('image/');
                return (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#18181b] hover:border-gold-500/50 transition-all flex flex-col justify-between shadow-xs group"
                  >
                    <div>
                      {/* Thumbnail or File Icon */}
                      <div className="w-full h-32 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 overflow-hidden flex items-center justify-center relative mb-2.5">
                        {isImage && file.thumbnailLink ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-center p-3 text-stone-400">
                            <FileText className="w-10 h-10 mx-auto text-stone-400 mb-1" />
                            <span className="text-[10px] font-mono uppercase block truncate max-w-[120px]">
                              {file.mimeType.split('/').pop()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <p className="text-xs font-serif font-bold text-stone-900 dark:text-white truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-sans mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span>
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                      {isImage ? (
                        <button
                          onClick={() => handleImportToMediaLibrary(file)}
                          className="text-[11px] font-bold text-gold-600 dark:text-gold-400 hover:underline cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Importar al Sitio</span>
                        </button>
                      ) : (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 inline-flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver en Drive</span>
                        </a>
                      )}

                      <div className="flex items-center space-x-1">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                            title="Abrir en Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 cursor-pointer"
                          title="Eliminar de Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mandatory Explicit Confirmation Dialog for Delete */}
      {fileToDelete && (
        <ConfirmModal
          isOpen={true}
          title="¿Eliminar archivo de Google Drive?"
          message={`¿Estás seguro de que deseas eliminar permanentemente el archivo "${fileToDelete.name}" de tu cuenta de Google Drive? Esta acción no se puede deshacer.`}
          confirmText={deleting ? 'Eliminando...' : 'Sí, Eliminar de Drive'}
          isDanger={true}
          isLoading={deleting}
          onConfirm={confirmDeleteFile}
          onCancel={() => setFileToDelete(null)}
        />
      )}
    </div>
  );
};
