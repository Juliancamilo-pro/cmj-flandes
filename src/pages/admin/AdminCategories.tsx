import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { Category, Article } from '../../types';
import { createCategory, updateCategory, deleteCategory } from '../../services/db';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface AdminCategoriesProps {
  categories: Category[];
  articles: Article[];
  onRefresh: () => Promise<void>;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  articles,
  onRefresh
}) => {
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#c59b27');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCreate = () => {
    setIsCreating(true);
    setEditingCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('#c59b27');
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setIsCreating(false);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setColor(cat.color || '#c59b27');
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingCat(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (isCreating || !slug) {
      setSlug(
        val.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (isCreating) {
        await createCategory({
          name: name.trim(),
          slug: slug.trim() || `cat-${Date.now()}`,
          description: description.trim(),
          color,
          order: categories.length + 1
        });
        setSuccessMsg('¡Categoría creada exitosamente!');
      } else if (editingCat) {
        await updateCategory(editingCat.id, {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          color
        });
        setSuccessMsg('¡Categoría actualizada exitosamente!');
      }

      await onRefresh();
      cancelForm();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setErrorMsg('No fue posible guardar la categoría.');
    } finally {
      setSaving(false);
    }
  };

  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const { id, name: catName } = categoryToDelete;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteCategory(id);
      await onRefresh();
      setSuccessMsg(`Categoría "${catName}" eliminada.`);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setErrorMsg('No fue posible eliminar la categoría.');
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 font-bold font-sans">
            Líneas Editoriales
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] mt-1">
            Gestión de Categorías
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-sans mt-0.5">
            Organiza los ejes temáticos y secciones de tu plataforma editorial.
          </p>
        </div>

        {!isCreating && !editingCat && (
          <button
            onClick={startCreate}
            className="px-5 py-2.5 rounded-xl bg-[#121212] hover:bg-gold-700 text-white font-sans text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Creation / Edit Form Modal or Box */}
      {(isCreating || editingCat) && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-gold-500 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in">
          <h2 className="font-serif font-bold text-lg text-[#121212]">
            {isCreating ? 'Crear Nueva Categoría' : `Editar Categoría: ${editingCat?.name}`}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Política Internacional"
                required
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-[#faf9f6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Slug (identificador web)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="politica-internacional"
                required
                className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-[#faf9f6] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Descripción editorial</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Breve explicación de las temáticas abordadas en esta línea..."
              className="w-full p-2.5 text-xs border border-stone-200 rounded-lg bg-[#faf9f6]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#121212] hover:bg-gold-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5 text-gold-400" />
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="bg-white border border-[#e8e5dc] rounded-2xl shadow-xs overflow-hidden">
        <div className="divide-y divide-stone-100">
          {categories.map((cat) => {
            const articleCount = articles.filter(
              a => a.categoryId === cat.slug || a.categoryName === cat.name
            ).length;

            return (
              <div key={cat.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f6] transition-colors">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold-500"></span>
                    <h3 className="font-serif font-bold text-base text-[#121212]">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                      /{cat.slug}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-stone-500 font-sans pl-5">
                      {cat.description}
                    </p>
                  )}
                  <span className="text-[11px] text-gold-700 font-semibold font-sans pl-5 block">
                    {articleCount} {articleCount === 1 ? 'artículo vinculado' : 'artículos vinculados'}
                  </span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 rounded-lg text-gold-700 hover:bg-gold-50 transition-colors"
                    title="Editar categoría"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={categoryToDelete !== null}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete?.name}"?`}
        confirmText="Sí, Eliminar Categoría"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};
