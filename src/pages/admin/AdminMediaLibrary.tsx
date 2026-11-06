import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  Crop, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { MediaItem, Article } from '../../types';
import { getMediaItems, addMediaItem, deleteMediaItem, updateMediaItem, updateArticle } from '../../services/db';
import { formatBytes, uploadImageWithProgress } from '../../services/imageUpload';
import { ImageEditorModal } from '../../components/common/ImageEditorModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PhotoUploaderModal } from '../../components/common/PhotoUploaderModal';
import { GoogleDriveManager } from '../../components/admin/GoogleDriveManager';

interface AdminMediaLibraryProps {
  articles: Article[];
  onSelectImageForUse?: (url: string) => void;
}

export const AdminMediaLibrary: React.FC<AdminMediaLibraryProps> = ({
  articles,
  onSelectImageForUse
}) => {
  const [mediaTab, setMediaTab] = useState<'library' | 'drive'>('library');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'articles' | 'ads' | 'profiles' | 'general'>('all');
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload Modal State
  const [uploaderModalOpen, setUploaderModalOpen] = useState(false);

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSourceImage, setEditorSourceImage] = useState<string | null>(null);
  const [editingTargetName, setEditingTargetName] = useState<string>('fotografia');

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const items = await getMediaItems();
      setMediaItems(items);
    } catch (e) {
      console.error('Error loading media items:', e);
    } finally {
      setLoading(false);
    }
  };

  // Multiple File Selection & Professional Upload
  const handleBatchUploadSuccess = async (items: { url: string; fileName: string; fileSize: number; title: string }[]) => {
    try {
      let addedCount = 0;
      let skippedDuplicates = 0;
      for (const item of items) {
        const isDuplicate = mediaItems.some(
          (existing) =>
            existing.fileName.toLowerCase() === item.fileName.toLowerCase() &&
            existing.fileSize === item.fileSize
        );
        if (isDuplicate) {
          skippedDuplicates++;
          continue;
        }
        await addMediaItem({
          title: item.title,
          url: item.url,
          fileName: item.fileName,
          fileSize: item.fileSize,
          category: categoryFilter === 'all' ? 'general' : categoryFilter,
          mimeType: item.url.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/webp'
        });
        addedCount++;
      }
      if (addedCount > 0) {
        setSuccessMsg(
          `Se subieron y optimizaron ${addedCount} fotografía(s) con éxito.${
            skippedDuplicates > 0 ? ` (${skippedDuplicates} duplicada(s) omitida(s))` : ''
          }`
        );
      } else if (skippedDuplicates > 0) {
        setErrorMsg('Las fotografías seleccionadas ya existen en la biblioteca multimedia.');
      }
      await loadLibrary();
    } catch (e: any) {
      console.error('Error saving uploaded media items:', e);
      setErrorMsg('Error al registrar las imágenes en la biblioteca.');
    }
  };

  const handleReplaceImageFile = async (item: MediaItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setReplacingId(item.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const oldUrl = item.url;
      const res = await uploadImageWithProgress(file, `replace_${item.id}`, {
        folder: item.category || 'media_library'
      });

      await updateMediaItem(item.id, {
        url: res.url,
        fileName: file.name,
        fileSize: res.optimized.optimizedSize,
        mimeType: res.optimized.format === 'webp' ? 'image/webp' : 'image/jpeg'
      });

      // Update any articles referencing oldUrl without deleting the publication
      const linkedArticles = articles.filter((a) => a.coverImageUrl === oldUrl);
      for (const art of linkedArticles) {
        await updateArticle(art.id, { coverImageUrl: res.url });
      }

      setSuccessMsg(
        `Fotografía "${item.title}" reemplazada correctamente.${
          linkedArticles.length > 0 ? ` Se actualizaron ${linkedArticles.length} artículo(s) vinculados.` : ''
        }`
      );
      await loadLibrary();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo reemplazar la fotografía.');
    } finally {
      setReplacingId(null);
    }
  };

  const handleOpenEditorForFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditorSourceImage(reader.result as string);
      setEditingTargetName(file.name.replace(/\.[^/.]+$/, ''));
      setEditorOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEditorConfirm = async (editedDataUrl: string) => {
    setEditorOpen(false);
    setUploading(true);
    try {
      // Save directly to library
      await addMediaItem({
        title: editingTargetName || 'Fotografía Editada',
        url: editedDataUrl,
        fileName: `${editingTargetName || 'imagen'}_recortada.jpg`,
        mimeType: 'image/jpeg'
      });
      setSuccessMsg('Fotografía recortada y guardada en la biblioteca multimedia.');
      await loadLibrary();
    } catch (e: any) {
      setErrorMsg('No se pudo guardar la fotografía editada.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const usedInActive = getArticlesUsingImage(itemToDelete.url);
    if (usedInActive.length > 0) {
      setErrorMsg(
        `No se puede eliminar "${itemToDelete.title}" porque está en uso en ${usedInActive.length} publicación(es). Usa "Reemplazar" si deseas cambiar la imagen.`
      );
      setItemToDelete(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteMediaItem(itemToDelete.id);
      setSuccessMsg(`Fotografía "${itemToDelete.title}" eliminada de la biblioteca.`);
      await loadLibrary();
    } catch (e: any) {
      setErrorMsg('Error al eliminar la fotografía.');
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  // Check if an image is currently in use across articles
  const getArticlesUsingImage = (url: string) => {
    return articles.filter(a => a.coverImageUrl === url);
  };

  const filteredMedia = mediaItems.filter(item => {
    if (categoryFilter !== 'all' && (item.category || 'general') !== categoryFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.fileName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
            Gestor Multimedia Visual
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] dark:text-white mt-1">
            Biblioteca Multimedia
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Administra, recorta y reutiliza fotografías estilo Instagram para toda tu plataforma editorial.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Crop & Upload */}
          <label className="px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold text-xs inline-flex items-center space-x-2 shadow-xs cursor-pointer transition-all">
            <Crop className="w-4 h-4" />
            <span>Recortar & Subir</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleOpenEditorForFile}
              className="hidden"
            />
          </label>

          {/* Multiple Upload with Professional Progress Queue */}
          <button
            type="button"
            onClick={() => setUploaderModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#121212] hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center space-x-2 shadow-xs cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4 text-gold-400" />
            <span>Subir Varias Fotos</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 space-x-2">
        <button
          type="button"
          onClick={() => setMediaTab('library')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            mediaTab === 'library'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Biblioteca Multimedia ({mediaItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMediaTab('drive')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            mediaTab === 'drive'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50">
            NUEVO
          </span>
        </button>
      </div>

      {mediaTab === 'drive' ? (
        <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <GoogleDriveManager articles={articles} onImportImageToMedia={loadLibrary} />
        </div>
      ) : (
        <>
          {/* Search Bar, Category Filter & Stats */}
          <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o archivo..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white font-semibold"
              >
                <option value="all">Todas las categorías</option>
                <option value="articles">Artículos</option>
                <option value="ads">Publicidad</option>
                <option value="profiles">Perfiles</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Total: <strong className="text-stone-900 dark:text-white">{filteredMedia.length}</strong> fotografías guardadas
            </div>
          </div>

      {/* Grid of Images (Instagram Style) */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif italic text-stone-500 text-sm">Cargando fotografías de la biblioteca...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
                Biblioteca vacía
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Sube tus fotos para organizarlas, recortarlas y utilizarlas en tus artículos, perfil o redes sociales.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((item) => {
              const usedArticles = getArticlesUsingImage(item.url);
              const isUsed = usedArticles.length > 0;

              return (
                <div
                  key={item.id}
                  className="group relative bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all"
                >
                  {/* Image square container */}
                  <div className="aspect-square w-full bg-stone-100 dark:bg-stone-800 relative overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay Action Buttons on Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 p-2">
                      <button
                        onClick={() => {
                          setEditorSourceImage(item.url);
                          setEditingTargetName(item.title);
                          setEditorOpen(true);
                        }}
                        title="Recortar y ajustar encuadre"
                        className="p-2 rounded-lg bg-white/20 hover:bg-gold-500 hover:text-stone-950 text-white backdrop-blur-xs transition-colors"
                      >
                        <Crop className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item.id, item.url)}
                        title="Copiar URL de la imagen"
                        className="p-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-stone-950 backdrop-blur-xs transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <label
                        title="Reemplazar fotografía sin eliminar publicaciones"
                        className="p-2 rounded-lg bg-white/20 hover:bg-sky-500 text-white backdrop-blur-xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 ${replacingId === item.id ? 'animate-spin' : ''}`} />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={(e) => handleReplaceImageFile(item, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          if (isUsed) {
                            setErrorMsg(
                              `No se puede eliminar "${item.title}" porque está en uso en ${usedArticles.length} publicación(es). Usa el botón de reemplazar para actualizarla.`
                            );
                            return;
                          }
                          setItemToDelete(item);
                        }}
                        title={isUsed ? 'En uso en publicaciones (no se puede eliminar)' : 'Eliminar de la biblioteca'}
                        className={`p-2 rounded-lg backdrop-blur-xs transition-colors cursor-pointer ${
                          isUsed
                            ? 'bg-white/10 text-stone-400 cursor-not-allowed'
                            : 'bg-white/20 hover:bg-rose-600 text-white'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isUsed && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                        En uso ({usedArticles.length})
                      </span>
                    )}
                  </div>

                  {/* Metadata footer */}
                  <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">
                      {item.fileName}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                      <span>{item.fileSize ? formatBytes(item.fileSize) : 'WebP'}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* Instagram-Style Image Editor Modal */}
      <ImageEditorModal
        isOpen={editorOpen}
        imageSrc={editorSourceImage}
        title="Recortar Fotografía para Plataforma Editorial"
        onConfirm={handleEditorConfirm}
        onCancel={() => setEditorOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Eliminar Fotografía de la Biblioteca"
        message={
          itemToDelete && getArticlesUsingImage(itemToDelete.url).length > 0
            ? `¡Atención! La fotografía "${itemToDelete.title}" se encuentra actualmente asignada como portada en ${getArticlesUsingImage(itemToDelete.url).length} artículo(s) publicado(s). ¿Estás seguro de que deseas eliminarla?`
            : `¿Estás seguro de que deseas eliminar permanentemente la fotografía "${itemToDelete?.title}" de la biblioteca?`
        }
        confirmText="Sí, Eliminar Fotografía"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Modern Multi-photo Upload Modal with Progress Queue */}
      <PhotoUploaderModal
        isOpen={uploaderModalOpen}
        onClose={() => setUploaderModalOpen(false)}
        onUploadSuccess={handleBatchUploadSuccess}
        folder="media_library"
        allowMultiple={true}
        title="Subir Fotografías a la Biblioteca Multimedia"
        subtitle="Optimización WebP automática, compresión inteligente y distribución CDN rápida."
      />
    </div>
  );
};
