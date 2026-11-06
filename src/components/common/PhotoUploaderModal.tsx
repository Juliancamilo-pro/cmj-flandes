import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Image as ImageIcon,
  Camera,
  Play,
  Check
} from 'lucide-react';
import { 
  validateImageFile, 
  uploadImageWithProgress, 
  formatBytes,
  cancelActiveUpload,
  ALLOWED_EXTENSIONS
} from '../../services/imageUpload';
import { UploadProgressItem } from '../../types';

interface PhotoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (items: { url: string; fileName: string; fileSize: number; title: string }[]) => void;
  folder?: string;
  allowMultiple?: boolean;
  title?: string;
  subtitle?: string;
}

export const PhotoUploaderModal: React.FC<PhotoUploaderModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  folder = 'articles',
  allowMultiple = true,
  title = 'Carga Profesional de Fotografías',
  subtitle = 'Sube, comprime y optimiza imágenes automáticamente en formato WebP con CDN.'
}) => {
  const [queue, setQueue] = useState<UploadProgressItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [overallUploading, setOverallUploading] = useState(false);
  const [abortControllers, setAbortControllers] = useState<Map<string, AbortController>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadProgressItem[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateImageFile(file);
      const itemId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      newItems.push({
        id: itemId,
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: validation.valid ? 'queued' : 'error',
        error: validation.valid ? undefined : validation.error
      });
    });

    setQueue((prev) => (allowMultiple ? [...prev, ...newItems] : newItems));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const uploadSingleItem = async (item: UploadProgressItem): Promise<UploadProgressItem> => {
    const controller = new AbortController();
    setAbortControllers((prev) => new Map(prev).set(item.id, controller));

    // Update status to processing/uploading
    setQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 5, error: undefined } : i))
    );

    try {
      const result = await uploadImageWithProgress(item.file, item.id, {
        folder,
        signal: controller.signal,
        onProgress: (percent) => {
          setQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
          );
        }
      });

      const updatedItem: UploadProgressItem = {
        ...item,
        status: 'completed',
        progress: 100,
        uploadedUrl: result.url,
        optimizedSize: result.optimized.optimizedSize
      };

      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i))
      );

      return updatedItem;
    } catch (err: any) {
      const isCancelled = controller.signal.aborted || err.message?.includes('cancelada');
      const updatedItem: UploadProgressItem = {
        ...item,
        status: isCancelled ? 'cancelled' : 'error',
        error: isCancelled ? 'Subida cancelada' : err.message || 'Error en la subida'
      };

      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i))
      );

      return updatedItem;
    } finally {
      setAbortControllers((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleStartAll = async () => {
    const pending = queue.filter((i) => i.status === 'queued' || i.status === 'error' || i.status === 'cancelled');
    if (pending.length === 0) return;

    setOverallUploading(true);

    // Concurrently upload up to 3 items at a time
    const completedItems: { url: string; fileName: string; fileSize: number; title: string }[] = [];

    for (const item of pending) {
      const res = await uploadSingleItem(item);
      if (res.status === 'completed' && res.uploadedUrl) {
        completedItems.push({
          url: res.uploadedUrl,
          fileName: res.name,
          fileSize: res.optimizedSize || res.size,
          title: res.name.replace(/\.[^/.]+$/, '')
        });
      }
    }

    setOverallUploading(false);

    if (completedItems.length > 0) {
      onUploadSuccess(completedItems);
    }
  };

  const handleCancelItem = (id: string) => {
    cancelActiveUpload(id);
    const controller = abortControllers.get(id);
    if (controller) {
      controller.abort();
    }
    setQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'cancelled', error: 'Cancelado por el usuario' } : i))
    );
  };

  const handleRetryItem = (item: UploadProgressItem) => {
    uploadSingleItem(item).then((res) => {
      if (res.status === 'completed' && res.uploadedUrl) {
        onUploadSuccess([
          {
            url: res.uploadedUrl,
            fileName: res.name,
            fileSize: res.optimizedSize || res.size,
            title: res.name.replace(/\.[^/.]+$/, '')
          }
        ]);
      }
    });
  };

  const handleRemoveItem = (id: string) => {
    handleCancelItem(id);
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const pendingCount = queue.filter((i) => i.status === 'queued' || i.status === 'error' || i.status === 'cancelled').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Colombian gold accent */}
        <div className="p-6 border-b border-[#eeeae1] dark:border-stone-800 flex items-center justify-between bg-[#faf8f4] dark:bg-[#141416]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
              <h3 className="font-serif font-bold text-xl text-[#121212] dark:text-[#f3ede2]">
                {title}
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              {subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-gold-500 bg-gold-50/50 dark:bg-gold-950/20 scale-[0.99]'
                : 'border-stone-300 dark:border-stone-700 hover:border-gold-400 bg-stone-50/50 dark:bg-stone-900/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={allowMultiple}
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-sans font-semibold text-sm text-stone-800 dark:text-stone-200">
                  Arrastra tus fotografías aquí o{' '}
                  <span className="text-gold-600 dark:text-gold-400 underline underline-offset-2">
                    explora tus archivos
                  </span>
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Admite JPG, PNG, WebP y AVIF (hasta 30 MB). Compresión WebP automática.
                </p>
              </div>

              {/* Mobile Quick Action Buttons */}
              <div className="pt-2 flex items-center gap-3 sm:hidden" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-gold-50 dark:bg-stone-800 text-gold-700 dark:text-gold-300 border border-gold-300 dark:border-stone-700 text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tomar Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center space-x-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Galería</span>
                </button>
              </div>
            </div>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-sans text-stone-500 dark:text-stone-400 pb-1 border-b border-[#eeeae1] dark:border-stone-800">
                <span>Cola de subida ({queue.length} archivos)</span>
                {completedCount > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                  >
                    Limpiar completadas ({completedCount})
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-[#141416] border border-[#eeeae1] dark:border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    {/* Thumbnail preview */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-700">
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info & Progress */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-stone-400 shrink-0">
                          {item.optimizedSize
                            ? `${formatBytes(item.size)} → ${formatBytes(item.optimizedSize)}`
                            : formatBytes(item.size)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            item.status === 'completed'
                              ? 'bg-emerald-500'
                              : item.status === 'error'
                              ? 'bg-rose-500'
                              : item.status === 'cancelled'
                              ? 'bg-stone-400'
                              : 'bg-gold-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center space-x-1 text-stone-500 dark:text-stone-400">
                          {item.status === 'completed' && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              100% Almacenado
                            </span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="text-gold-600 dark:text-gold-400 font-semibold flex items-center">
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              {item.progress < 25 ? 'Optimizando WebP...' : `Subiendo (${item.progress}%)`}
                            </span>
                          )}
                          {item.status === 'queued' && <span>En espera para subir</span>}
                          {item.status === 'error' && (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {item.error || 'Error'}
                            </span>
                          )}
                          {item.status === 'cancelled' && (
                            <span className="text-stone-400">Cancelado</span>
                          )}
                        </span>

                        <span className="font-mono text-stone-400">{item.progress}%</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {item.status === 'uploading' && (
                        <button
                          type="button"
                          onClick={() => handleCancelItem(item.id)}
                          title="Cancelar subida"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {(item.status === 'error' || item.status === 'cancelled') && (
                        <button
                          type="button"
                          onClick={() => handleRetryItem(item)}
                          title="Reintentar subida"
                          className="p-1.5 rounded-lg text-gold-600 hover:bg-gold-50 dark:hover:bg-stone-800 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Quitar de la lista"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-[#eeeae1] dark:border-stone-800 bg-[#faf8f4] dark:bg-[#141416] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {completedCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ {completedCount} fotografía(s) lista(s)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>

            {pendingCount > 0 && (
              <button
                type="button"
                disabled={overallUploading}
                onClick={handleStartAll}
                className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {overallUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Subiendo ({pendingCount})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Subir {pendingCount} {pendingCount === 1 ? 'Foto' : 'Fotos'}</span>
                  </>
                )}
              </button>
            )}

            {pendingCount === 0 && completedCount > 0 && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Listo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
