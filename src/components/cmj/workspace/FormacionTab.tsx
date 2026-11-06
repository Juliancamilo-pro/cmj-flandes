import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Scale,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Tag,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { CmjKnowledgeItem, KnowledgeCategory, CmjMember } from '../../../types/cmj.ts';
import { cmjApi } from '../../../services/cmjApi.ts';

interface FormacionTabProps {
  items: CmjKnowledgeItem[];
  currentUser: CmjMember;
  canManage: boolean;
  onRefresh: () => void;
  notify: (type: 'ok' | 'err', text: string) => void;
}

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  estatuto_1622_1885: 'Estatuto de Juventud (Ley 1622 / 1885)',
  reglamento_interno: 'Reglamento Interno CMJ Flandes',
  participacion_democratica: 'Participación Democrática',
  formulacion_proyectos: 'Formulación de Proyectos',
  control_social: 'Control Social y Veeduría',
  politicas_publicas: 'Políticas Públicas de Juventud',
  liderazgo: 'Liderazgo y Habilidades de Vocería',
  comunicacion: 'Comunicación Institucional',
  gestion_documental: 'Gestión Documental y Archivo',
};

export const FormacionTab: React.FC<FormacionTabProps> = ({
  items,
  currentUser,
  canManage,
  onRefresh,
  notify,
}) => {
  const [filterCat, setFilterCat] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<CmjKnowledgeItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<KnowledgeCategory>('estatuto_1622_1885');
  const [description, setDescription] = useState('');
  const [lawReference, setLawReference] = useState('');
  const [isOfficialDocument, setIsOfficialDocument] = useState(true);
  const [externalLink, setExternalLink] = useState('');
  const [contentText, setContentText] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      notify('err', 'El título y la descripción son obligatorios.');
      return;
    }
    try {
      await cmjApi.createKnowledgeItem({
        title,
        category,
        description,
        lawReference: lawReference.trim() || undefined,
        isOfficialDocument,
        externalLink: externalLink.trim() || undefined,
        contentText: contentText.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setLawReference('');
      setExternalLink('');
      setContentText('');
      setShowModal(false);
      notify('ok', 'Recurso pedagógico / normativo añadido a la biblioteca de formación.');
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error guardando recurso.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este recurso pedagógico?')) return;
    try {
      await cmjApi.deleteKnowledgeItem(id);
      notify('ok', 'Recurso eliminado.');
      if (selectedItem?.id === id) setSelectedItem(null);
      onRefresh();
    } catch (err: any) {
      notify('err', err?.message || 'Error eliminando recurso.');
    }
  };

  const filtered = items.filter((k) => {
    if (filterCat !== 'todos' && k.category !== filterCat) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = k.title.toLowerCase().includes(q);
      const matchDesc = k.description.toLowerCase().includes(q);
      const matchLaw = k.lawReference?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLaw) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100">
            Formación y Biblioteca de Conocimiento para Consejeros
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Marco normativo nacional, reglamento interno y metodologías prácticas para el ejercicio del liderazgo institucional en Flandes.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-dulima-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cargar Recurso o Guía</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-[#161920] border border-stone-200 dark:border-stone-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por ley, norma o palabra clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold"
        >
          <option value="todos">Todas las Categorías Normativas</option>
          {(Object.keys(CATEGORY_LABELS) as KnowledgeCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Knowledge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#161920] border border-stone-200 dark:border-stone-800 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#003893] dark:hover:border-blue-500 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.isOfficialDocument
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {item.isOfficialDocument ? 'Documento Oficial' : 'Material Pedagógico'}
                </span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug">
                {item.title}
              </h3>

              {item.lawReference && (
                <p className="text-[11px] font-semibold text-[#8c162a] dark:text-[#f2c94c]">
                  {item.lawReference}
                </p>
              )}

              <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase">
                {CATEGORY_LABELS[item.category] || item.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedItem(item)}
                className="btn-dulima-secondary py-1 px-3 text-[11px] font-bold"
              >
                Consultar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#161920] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-stone-400 opacity-60" />
          <h3 className="font-bold text-base">No se encontraron recursos normativos con ese criterio</h3>
        </div>
      )}

      {/* Item Detail Reader Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8c162a] dark:text-[#f2c94c]">
                  {CATEGORY_LABELS[selectedItem.category]} · {selectedItem.isOfficialDocument ? 'Norma Oficial' : 'Guía Pedagógica'}
                </span>
                <h3 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {selectedItem.title}
                </h3>
                {selectedItem.lawReference && (
                  <p className="text-xs font-semibold text-[#003893] dark:text-blue-400 mt-0.5">
                    {selectedItem.lawReference}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                <span className="font-bold uppercase text-[10px] text-stone-500">Resumen y Alcance:</span>
                <p className="text-stone-700 dark:text-stone-200 leading-relaxed mt-1">
                  {selectedItem.description}
                </p>
              </div>

              {selectedItem.contentText && (
                <div className="space-y-2">
                  <span className="font-bold uppercase text-[10px] text-stone-500">Contenido Detallado:</span>
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 whitespace-pre-wrap leading-relaxed text-stone-800 dark:text-stone-200">
                    {selectedItem.contentText}
                  </div>
                </div>
              )}

              {selectedItem.externalLink && (
                <div className="pt-2">
                  <a
                    href={selectedItem.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver documento externo o publicación oficial</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-dulima-secondary py-1.5 px-4 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cargar Recurso */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-lg font-display font-bold text-stone-900 dark:text-stone-100">
              Cargar Recurso Pedagógico o Normativo
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Título del Recurso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Guía para la preparación del informe de gestión juvenil"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Categoría Temática
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  >
                    {(Object.keys(CATEGORY_LABELS) as KnowledgeCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Referencia Legal (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ley 1622 de 2013, Art. 45"
                    value={lawReference}
                    onChange={(e) => setLawReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={isOfficialDocument}
                    onChange={(e) => setIsOfficialDocument(e.target.checked)}
                  />
                  <span>Es documento normativo oficial (desmarcar si es guía pedagógica de apoyo)</span>
                </label>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Descripción Corta *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Resumen del contenido y propósito para los consejeros..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Texto Completo / Guía Detallada
                </label>
                <textarea
                  rows={4}
                  placeholder="Instrucciones paso a paso, articulado o contenido pedagógico..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Enlace Externo (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                />
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
                  Guardar en Formación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
