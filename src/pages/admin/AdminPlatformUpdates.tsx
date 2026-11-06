import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Calendar, 
  Tag, 
  Image as ImageIcon, 
  Upload, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { PlatformUpdate, PlatformUpdateCategory } from '../../types';
import { getPlatformUpdates, savePlatformUpdate, deletePlatformUpdate } from '../../services/db';
import { CATEGORY_METADATA } from '../public/UpdatesPage';
import { PhotoUploaderModal } from '../../components/common/PhotoUploaderModal';

export const AdminPlatformUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [category, setCategory] = useState<PlatformUpdateCategory>('nuevas_funcionalidades');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'publicado' | 'borrador'>('publicado');
  const [featured, setFeatured] = useState(false);
  const [versionTag, setVersionTag] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploaderOpen, setUploaderOpen] = useState(false);

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const items = await getPlatformUpdates({ includeDrafts: true });
      setUpdates(items);
    } catch (e) {
      console.warn('Error fetching updates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSummary('');
    setContent('');
    setDate(new Date().toISOString().split('T')[0]);
    setImageUrl('');
    setImageCaption('');
    setCategory('nuevas_funcionalidades');
    setTagsInput('');
    setStatus('publicado');
    setFeatured(false);
    setVersionTag('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: PlatformUpdate) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSlug(item.slug);
    setSummary(item.summary);
    setContent(item.content);
    setDate(item.date);
    setImageUrl(item.imageUrl || '');
    setImageCaption(item.imageCaption || '');
    setCategory(item.category);
    setTagsInput(item.tags ? item.tags.join(', ') : '');
    setStatus(item.status);
    setFeatured(item.featured || false);
    setVersionTag(item.versionTag || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, updateTitle: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la actualización "${updateTitle}"?`)) {
      return;
    }
    try {
      await deletePlatformUpdate(id);
      setSuccessMsg('Actualización eliminada correctamente.');
      await loadUpdates();
    } catch (e) {
      setErrorMsg('No se pudo eliminar la actualización.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('El título de la actualización es obligatorio.');
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('El resumen es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('La descripción detallada del cambio es obligatoria.');
      return;
    }

    const cleanSlug = slug.trim() || title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSaving(true);
    try {
      await savePlatformUpdate(
        {
          title: title.trim(),
          slug: cleanSlug,
          summary: summary.trim(),
          content: content.trim(),
          date,
          imageUrl: imageUrl.trim() || undefined,
          imageCaption: imageCaption.trim() || undefined,
          category,
          tags: cleanTags,
          status,
          featured,
          versionTag: versionTag.trim() || undefined,
          authorName: 'Julian Camilo'
        },
        editingId || undefined
      );

      setSuccessMsg(
        editingId
          ? 'Actualización modificada exitosamente.'
          : 'Nueva actualización agregada al historial público.'
      );
      await loadUpdates();
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la actualización.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e5dc] dark:border-stone-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="font-serif font-bold text-2xl text-[#121212] dark:text-[#f3ede2]">
              Historial de Actualizaciones de la Plataforma
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gold-100 dark:bg-stone-800 text-gold-900 dark:text-gold-300 text-xs font-bold font-sans">
              {updates.length} Registradas
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            Comunica a tus lectores y suscriptores todas las innovaciones, mejoras de diseño, seguridad y nuevas funciones de tu portal.
          </p>
        </div>

        {!isFormOpen && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 dark:hover:bg-gold-400 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Nueva Novedad</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Card (Create or Edit) */}
      {isFormOpen ? (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span>{editingId ? 'Editar Novedad de Plataforma' : 'Crear Nueva Novedad de Plataforma'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Título de la Novedad *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingId) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '')
                    );
                  }
                }}
                placeholder="Ej. Nuevo Editor Multimedia y Soporte de Audio"
                className="w-full p-2.5 text-sm font-serif font-bold border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Categoría de Actualización *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlatformUpdateCategory)}
                className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 font-sans focus:outline-none"
              >
                {Object.entries(CATEGORY_METADATA).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Fecha de Publicación *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            {/* Version Tag */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Etiqueta de Versión (Opcional)
              </label>
              <input
                type="text"
                value={versionTag}
                onChange={(e) => setVersionTag(e.target.value)}
                placeholder="Ej. v2.6.0"
                className="w-full p-2.5 text-xs font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Estado de Publicación
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 font-sans focus:outline-none"
              >
                <option value="publicado">Publicado (Visible en el sitio)</option>
                <option value="borrador">Borrador (Privado)</option>
              </select>
            </div>

            {/* Summary */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Resumen Breve para Tarjetas y Portada *
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Explicación concisa de 2 o 3 líneas sobre qué se implementó..."
                className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 font-sans focus:outline-none resize-none"
              />
            </div>

            {/* Detailed Content */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Descripción Detallada (Cómo funciona y beneficios para los usuarios) *
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Explica a fondo los cambios técnicos, ventajas editoriales, pasos de uso y mejoras. Puedes usar subtítulos con ### y listas con guiones (-)."
                className="w-full p-3 text-xs sm:text-sm font-sans border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans">
                Etiquetas (separadas por comas)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ej. Editor, Video, Móvil, Seguridad"
                className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            {/* Image URL & Upload button */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1 font-sans flex items-center justify-between">
                <span>Fotografía Ilustrativa (Opcional)</span>
                <button
                  type="button"
                  onClick={() => setUploaderOpen(true)}
                  className="text-[11px] text-gold-600 hover:underline flex items-center space-x-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Subir Imagen</span>
                </button>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            {/* Featured toggle */}
            <div className="md:col-span-2 flex items-center space-x-3 p-3 rounded-xl bg-[#faf9f6] dark:bg-[#202024] border border-stone-200 dark:border-stone-700">
              <input
                type="checkbox"
                id="featuredCheck"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500 cursor-pointer accent-gold-500"
              />
              <label htmlFor="featuredCheck" className="text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer flex items-center space-x-1.5">
                <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                <span>Marcar como Novedad Destacada (Se exhibirá en el banner principal de la sección y en la portada)</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Publicar Novedad'}</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Table of Updates */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#faf9f6] dark:bg-[#141416] border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          <span>Registro Cronológico de Actualizaciones</span>
          <span>{updates.length} Novedades</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Cargando novedades...
          </div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No hay actualizaciones registradas aún.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {updates.map((item) => {
              const meta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA.nuevas_funcionalidades;
              const Icon = meta.icon;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>
                          {meta.label}
                        </span>
                        {item.versionTag && (
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-600 dark:text-stone-400">
                            {item.versionTag}
                          </span>
                        )}
                        {item.featured && (
                          <span className="px-2 py-0.5 rounded-md bg-gold-100 text-gold-900 text-[10px] font-bold flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Destacada</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.status === 'publicado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {item.status === 'publicado' ? 'Pública' : 'Borrador'}
                        </span>
                        <span className="text-[11px] text-stone-400 font-sans">
                          {item.date}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                        {item.title}
                      </h4>

                      <p className="text-xs text-stone-500 dark:text-stone-400 font-sans line-clamp-1">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Editar novedad"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Eliminar novedad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Uploader Modal */}
      <PhotoUploaderModal
        isOpen={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        onUploadSuccess={(items) => {
          if (items.length > 0) {
            setImageUrl(items[0].url);
            setUploaderOpen(false);
          }
        }}
        folder="updates"
        allowMultiple={false}
        title="Subir Fotografía para la Actualización"
      />
    </div>
  );
};
