import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Clock, 
  Image as ImageIcon, 
  Upload, 
  Eye, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1, 
  Heading2, 
  Heading3,
  Quote, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Minus, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  Trash2,
  Video,
  Headphones,
  Undo2,
  Redo2,
  Smartphone,
  Monitor,
  Info,
  Tag,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Plus,
  Layers,
  HelpCircle,
  Mic,
  Square,
  FileAudio,
  Loader2
} from 'lucide-react';
import { Article, ArticleStatus, ArticleFormat, Category, GalleryImage, ArticleSource, ArticleRectification } from '../../types';
import { createArticle, updateArticle, uploadImageFile } from '../../services/db';
import { PhotoUploaderModal } from '../../components/common/PhotoUploaderModal';
import { AudioPlayer } from '../../components/common/AudioPlayer';
import { VideoEmbed } from '../../components/common/VideoEmbed';
import { PhotoGalleryViewer } from '../../components/common/PhotoGalleryViewer';

interface AdminArticleEditorProps {
  initialArticle?: Article | null;
  categories: Category[];
  onBack: () => void;
  onSaved: () => Promise<void>;
}

export const ARTICLE_FORMATS: { id: ArticleFormat; label: string; description: string; badgeColor: string }[] = [
  { id: 'noticias', label: 'Noticias', description: 'Hecho informativo de actualidad objetiva', badgeColor: 'bg-red-800 text-white' },
  { id: 'opinion', label: 'Opinión', description: 'Columna de postura editorial y debate crítico', badgeColor: 'bg-stone-800 text-stone-100' },
  { id: 'analisis_politico', label: 'Análisis político', description: 'Examen de políticas públicas, instituciones y coyuntura', badgeColor: 'bg-indigo-800 text-white' },
  { id: 'investigacion', label: 'Investigación', description: 'Investigación periodística y documental en profundidad', badgeColor: 'bg-[#9B1B30] text-white' },
  { id: 'entrevistas', label: 'Entrevistas', description: 'Diálogo y preguntas con protagonistas públicos', badgeColor: 'bg-emerald-800 text-white' },
  { id: 'reportajes', label: 'Reportajes', description: 'Narrativa periodística de largo aliento en territorio', badgeColor: 'bg-amber-700 text-white' },
  { id: 'columnas_editoriales', label: 'Columnas editoriales', description: 'Espacio de autor de periodicidad fija', badgeColor: 'bg-stone-900 text-gold-300' },
  { id: 'comunicados', label: 'Comunicados', description: 'Pronunciamiento o declaración formal', badgeColor: 'bg-blue-800 text-white' },
  { id: 'cronicas', label: 'Crónicas', description: 'Relato literario y testimonial de hechos reales', badgeColor: 'bg-orange-800 text-white' },
  { id: 'fotoreportajes', label: 'Fotoreportajes', description: 'Ensayo fotográfico con narrativa visual', badgeColor: 'bg-teal-800 text-white' },
  { id: 'publicaciones_audiovisuales', label: 'Publicaciones audiovisuales', description: 'Pieza multimedia con video, audio e infografía', badgeColor: 'bg-purple-800 text-white' },
  { id: 'editoriales', label: 'Editoriales', description: 'Postura institucional oficial de DULIMA', badgeColor: 'bg-[#70132b] text-[#F2C94C]' },
  { id: 'articulos_academicos', label: 'Artículos académicos', description: 'Ensayo rigoroso con aparato crítico y fuentes', badgeColor: 'bg-slate-800 text-white' },
];

export const AdminArticleEditor: React.FC<AdminArticleEditorProps> = ({
  initialArticle,
  categories,
  onBack,
  onSaved
}) => {
  const isEditing = Boolean(initialArticle?.id);

  // Core Form Fields
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle || '');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || '');
  const [format, setFormat] = useState<ArticleFormat>(initialArticle?.format || 'opinion');
  const [categoryId, setCategoryId] = useState(initialArticle?.categoryId || categories[0]?.slug || 'politica');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.coverImageUrl || '');
  const [coverImageCaption, setCoverImageCaption] = useState(initialArticle?.coverImageCaption || '');
  const [status, setStatus] = useState<ArticleStatus>(initialArticle?.status || 'draft');
  const [scheduledFor, setScheduledFor] = useState(initialArticle?.scheduledFor || '');
  const [featured, setFeatured] = useState(initialArticle?.featured || false);
  const [allowComments, setAllowComments] = useState(initialArticle?.allowComments ?? true);
  const [tagsInput, setTagsInput] = useState(initialArticle?.tags ? initialArticle.tags.join(', ') : '');

  // Multimedia Fields
  const [videoUrl, setVideoUrl] = useState(initialArticle?.videoUrl || '');
  const [videoTitle, setVideoTitle] = useState(initialArticle?.videoTitle || '');
  const [videoDescription, setVideoDescription] = useState(initialArticle?.videoDescription || '');
  const [audioUrl, setAudioUrl] = useState(initialArticle?.audioUrl || '');
  const [audioTitle, setAudioTitle] = useState(initialArticle?.audioTitle || '');
  const [audioCoverUrl, setAudioCoverUrl] = useState(initialArticle?.audioCoverUrl || '');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialArticle?.galleryImages || []);

  // Sources & Editorial Rectifications
  const [sources, setSources] = useState<ArticleSource[]>(initialArticle?.sources || []);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourcePublisher, setNewSourcePublisher] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  const [rectifications, setRectifications] = useState<ArticleRectification[]>(initialArticle?.rectifications || []);
  const [newRectType, setNewRectType] = useState<'aclaracion' | 'rectificacion' | 'fe_de_erratas'>('aclaracion');
  const [newRectSummary, setNewRectSummary] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMediaSection, setShowMediaSection] = useState<'video' | 'audio' | 'gallery' | null>(
    initialArticle?.videoUrl ? 'video' : initialArticle?.audioUrl ? 'audio' : null
  );

  // Gallery item temp form
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');

  // Undo / Redo history stack
  const [history, setHistory] = useState<string[]>([initialArticle?.content || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploaderModalOpen, setUploaderModalOpen] = useState(false);
  const [uploaderTarget, setUploaderTarget] = useState<'cover' | 'inline' | 'gallery' | 'audioCover'>('cover');

  // Audio Transcription State (gemini-3.5-transcribe)
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setTranscribing(true);
    setErrorMsg(null);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const res = String(reader.result || '');
          const commaIdx = res.indexOf(',');
          resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType })
      });
      const data = await res.json();
      if (!res.ok || !data.transcript) {
        setErrorMsg(data.error || 'No se pudo transcribir el audio.');
        return;
      }

      const separator = content.trim() ? '\n\n' : '';
      updateContentWithHistory(`${content}${separator}${data.transcript}`);
      setSuccessMsg('Audio transcrito e insertado en el artículo.');
    } catch {
      setErrorMsg('Error al procesar la transcripción de audio.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await transcribeAudioBlob(blob, recorder.mimeType || 'audio/webm');
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setErrorMsg('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await transcribeAudioBlob(file, file.type || 'audio/mpeg');
    e.target.value = '';
  };

  // Push new state to history stack (debounced slightly or on user action)
  const updateContentWithHistory = (newVal: string) => {
    setContent(newVal);
    // Prune forward history and push
    const nextHistory = history.slice(0, historyIndex + 1);
    if (nextHistory[nextHistory.length - 1] !== newVal) {
      if (nextHistory.length > 50) nextHistory.shift();
      setHistory([...nextHistory, newVal]);
      setHistoryIndex(nextHistory.length);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setContent(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setContent(next);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing || !slug) {
      const generated = newTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  // Auto-save local draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title.trim() || content.trim()) {
        try {
          const draftSnapshot = {
            title,
            subtitle,
            content,
            format,
            categoryId,
            videoUrl,
            audioUrl,
            savedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          };
          localStorage.setItem('jc_article_draft_autosave', JSON.stringify(draftSnapshot));
          setLastSavedTime(draftSnapshot.savedAt);
        } catch (e) {}
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [title, subtitle, content, format, categoryId, videoUrl, audioUrl]);

  // Estimated reading time
  const readingMinutes = Math.max(1, Math.round((content.trim().split(/\s+/).length || 1) / 200));

  // Formatting helpers
  const insertFormatting = (prefix: string, suffix = '', defaultPlaceholder = 'texto') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    updateContentWithHistory(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const insertBlock = (blockText: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prefix = start > 0 && !content.substring(0, start).endsWith('\n\n') ? '\n\n' : '';
    const suffix = '\n\n';
    const replacement = `${prefix}${blockText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    updateContentWithHistory(newContent);

    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  const handleUploadSuccess = (items: { url: string; fileName: string; fileSize: number; title: string }[]) => {
    if (items.length === 0) return;
    const first = items[0];

    if (uploaderTarget === 'cover') {
      setCoverImageUrl(first.url);
      setSuccessMsg('Fotografía de portada cargada exitosamente.');
    } else if (uploaderTarget === 'audioCover') {
      setAudioCoverUrl(first.url);
      setSuccessMsg('Portada de audio cargada exitosamente.');
    } else if (uploaderTarget === 'inline') {
      insertBlock(`![${first.title || 'Fotografía de archivo'}](${first.url})\n*Crédito: Archivo Editorial*`);
      setSuccessMsg('Fotografía insertada en el cuerpo del artículo.');
    } else if (uploaderTarget === 'gallery') {
      const newItems = items.map((it) => ({
        url: it.url,
        caption: it.title || 'Fotografía',
        credit: 'Redacción'
      }));
      setGalleryImages((prev) => [...prev, ...newItems]);
      setSuccessMsg(`${items.length} fotografía(s) agregada(s) a la galería.`);
    }

    setUploaderModalOpen(false);
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages((prev) => [
      ...prev,
      {
        url: newGalleryUrl.trim(),
        caption: newGalleryCaption.trim() || undefined,
        credit: 'Archivo Editorial'
      }
    ]);
    setNewGalleryUrl('');
    setNewGalleryCaption('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (intendedStatus: ArticleStatus) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('El título del artículo es obligatorio.');
      return;
    }

    if (!content.trim()) {
      setErrorMsg('El contenido del artículo no puede estar vacío.');
      return;
    }

    const currentCat = categories.find((c) => c.slug === categoryId || c.id === categoryId);
    const categoryName = currentCat ? currentCat.name : 'Opinión';

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSaving(true);
    try {
      const articlePayload: Record<string, any> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim() || `articulo-${Date.now()}`,
        excerpt: excerpt.trim() || subtitle.trim() || content.slice(0, 150).trim(),
        format,
        categoryId,
        categoryName,
        content: content.trim(),
        coverImageUrl: coverImageUrl.trim(),
        coverImageCaption: coverImageCaption.trim(),
        status: intendedStatus,
        readingMinutes,
        featured,
        allowComments,
        tags: cleanTags,
        videoUrl: videoUrl.trim() || undefined,
        videoTitle: videoTitle.trim() || undefined,
        videoDescription: videoDescription.trim() || undefined,
        audioUrl: audioUrl.trim() || undefined,
        audioTitle: audioTitle.trim() || undefined,
        audioCoverUrl: audioCoverUrl.trim() || undefined,
        galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
        sources: sources.length > 0 ? sources : undefined,
        rectifications: rectifications.length > 0 ? rectifications : undefined
      };

      if (scheduledFor) {
        articlePayload.scheduledFor = scheduledFor;
      }

      if (intendedStatus === 'published' || intendedStatus === 'publicado') {
        articlePayload.publishedAt = initialArticle?.publishedAt || new Date().toISOString();
      }

      if (isEditing && initialArticle?.id) {
        await updateArticle(initialArticle.id, articlePayload);
        setSuccessMsg('Artículo actualizado exitosamente con todos los formatos multimedia.');
      } else {
        await createArticle({
          ...articlePayload,
          views: 0,
          reactions: { yellow: 0, blue: 0, red: 0 },
          authorName: 'Julian Camilo',
          authorRole: 'owner',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
        setSuccessMsg('Artículo creado y registrado exitosamente en la plataforma.');
      }

      setStatus(intendedStatus);
      setTimeout(async () => {
        await onSaved();
      }, 700);
    } catch (err: any) {
      console.error('Error saving article:', err);
      setErrorMsg(err.message || 'Ocurrió un error al guardar el artículo.');
    } finally {
      setSaving(false);
    }
  };

  // Render content in preview mode
  const renderPreviewContent = (rawText: string) => {
    const blocks = rawText.split('\n\n');
    return blocks.map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H1
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={i} className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100 pt-6 pb-2 border-b border-stone-200 dark:border-stone-800">
            {trimmed.replace(/^#\s+/, '')}
          </h1>
        );
      }
      // H2
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={i} className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 pt-5 pb-1">
            {trimmed.replace(/^##\s+/, '')}
          </h2>
        );
      }
      // H3
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={i} className="text-lg sm:text-xl font-serif font-bold text-stone-800 dark:text-stone-200 pt-4 pb-1">
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }
      // Pullquote with author
      if (trimmed.startsWith('> ')) {
        const lines = trimmed.split('\n');
        const quoteText = lines[0].replace(/^>\s+/, '').replace(/^"/, '').replace(/"$/, '');
        const authorLine = lines.find((l) => l.trim().startsWith('> —') || l.trim().startsWith('> -'));
        const authorClean = authorLine ? authorLine.replace(/^>[—\-]\s*/, '') : null;

        return (
          <blockquote key={i} className="my-6 pl-5 sm:pl-6 py-3 border-l-4 border-gold-500 font-serif italic text-lg sm:text-xl text-stone-800 dark:text-stone-200 bg-[#fbf9f4] dark:bg-[#1f1e1c] rounded-r-xl space-y-1">
            <p>"{quoteText}"</p>
            {authorClean && (
              <cite className="block text-xs font-sans font-semibold text-stone-500 dark:text-stone-400 not-italic uppercase tracking-wider">
                — {authorClean}
              </cite>
            )}
          </blockquote>
        );
      }
      // Callout Info Box
      if (trimmed.startsWith(':::info') || trimmed.startsWith(':::alerta')) {
        const body = trimmed.replace(/^:::[a-z]+\n?/, '').replace(/\n?:::$/, '');
        return (
          <div key={i} className="my-6 p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-amber-500 text-stone-800 dark:text-amber-100 text-sm font-sans space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Info className="w-4 h-4" />
              <span>Contexto & Información Clave</span>
            </div>
            <p className="leading-relaxed">{body}</p>
          </div>
        );
      }
      // Divider with subtle Colombian flag accent
      if (trimmed === '---') {
        return (
          <div key={i} className="my-8 flex items-center justify-center space-x-2">
            <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1"></div>
            <div className="flex space-x-1">
              <span className="w-2 h-2 rounded-full bg-gold-400"></span>
              <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            </div>
            <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1"></div>
          </div>
        );
      }
      // Inline image markdown: ![caption](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        const caption = imgMatch[1];
        const url = imgMatch[2];
        return (
          <figure key={i} className="my-6 space-y-2">
            <img src={url} alt={caption} className="w-full rounded-2xl object-cover max-h-[480px] border border-stone-200 dark:border-stone-800" />
            {caption && (
              <figcaption className="text-center font-sans text-xs text-stone-500 italic">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      }
      // List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').filter((l) => l.trim());
        return (
          <ul key={i} className="my-4 space-y-2 list-disc list-inside text-stone-700 dark:text-stone-300 font-sans leading-relaxed pl-2">
            {items.map((it, idx) => (
              <li key={idx}>{it.replace(/^[-*]\s+/, '')}</li>
            ))}
          </ul>
        );
      }
      // Standard paragraph
      return (
        <p key={i} className="text-stone-800 dark:text-stone-200 text-base sm:text-lg leading-relaxed font-serif tracking-normal my-4">
          {trimmed}
        </p>
      );
    });
  };

  const activeFormatObj = ARTICLE_FORMATS.find((f) => f.id === format) || ARTICLE_FORMATS[0];

  return (
    <div className="space-y-6">
      {/* Top Bar with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e5dc] dark:border-stone-800">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Volver al listado"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#121212] dark:text-[#f3ede2]">
                {isEditing ? 'Editar Artículo' : 'Redactar Nuevo Artículo'}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeFormatObj.badgeColor}`}>
                {activeFormatObj.label}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              {lastSavedTime ? `Autoguardado local: ${lastSavedTime}` : 'Editor profesional con soporte multimedia y espaciado periodístico'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Mode Switcher: Edit vs Preview */}
          <div className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Edición
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Vista Previa</span>
            </button>
          </div>

          {/* Save Draft */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Borrador</span>
          </button>

          {/* Publish or Schedule */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-gold-600 dark:hover:bg-gold-400 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{scheduledFor ? 'Programar' : 'Aprobar & Publicar'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Format Selector Bar */}
      <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-sans flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-[#9B1B30] dark:text-[#F2C94C]" />
            <span>1. Selecciona el Formato de Publicación (13 Formatos Editoriales)</span>
          </label>
          <span className="text-[11px] font-sans text-stone-400">
            {activeFormatObj.description}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {ARTICLE_FORMATS.map((fmt) => {
            const isSelected = format === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setFormat(fmt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer border ${
                  isSelected
                    ? `${fmt.badgeColor} border-transparent shadow-xs scale-102`
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                }`}
                title={fmt.description}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>

        {/* Dictado y Transcripción de Audio a Texto */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            Dictado y Transcripción de Audio a Artículo:
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={transcribing}
              onClick={handleToggleRecording}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer transition-colors ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-[#9B1B30]/10 text-[#9B1B30] dark:bg-[#F2C94C]/15 dark:text-[#F2C94C] hover:bg-[#9B1B30]/20'
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Detener y Transcribir' : 'Grabar Voz'}</span>
            </button>

            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={transcribing || isRecording}
              onClick={() => audioFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold inline-flex items-center space-x-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer disabled:opacity-50"
            >
              {transcribing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileAudio className="w-3.5 h-3.5" />
              )}
              <span>{transcribing ? 'Transcribiendo...' : 'Subir Audio'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW: EDIT OR PREVIEW */}
      {activeTab === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editing Column (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title & Subtitle */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-sans">
                  Título Principal del Artículo *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Escribe un titular contundente e informativo..."
                  className="w-full p-3 font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-sans">
                  Subtítulo / Bajada Editorial
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Síntesis que orienta al lector y complementa el titular..."
                  className="w-full p-3 font-serif italic text-sm text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] focus:outline-none focus:ring-2 focus:ring-gold-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-sans">
                  Resumen o Extracto para Redes y Portada
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Breve extracto de 1 o 2 frases para vistas de lista..."
                  className="w-full p-2.5 text-xs text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>
            </div>

            {/* Rich Content Editor */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden">
              {/* Toolbar */}
              <div className="p-3 bg-[#f5f4ef] dark:bg-[#141416] border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-1.5 select-none">
                {/* Undo / Redo */}
                <div className="flex items-center space-x-0.5 pr-2 border-r border-stone-300 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex === 0}
                    className="p-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    title="Deshacer (Undo)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    title="Rehacer (Redo)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Headings */}
                <div className="flex items-center space-x-0.5 pr-2 border-r border-stone-300 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => insertFormatting('# ', '', 'Encabezado Principal')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer text-xs font-bold"
                    title="Título H1 (#)"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('## ', '', 'Subtítulo de Sección')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer text-xs font-bold"
                    title="Subtítulo H2 (##)"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('### ', '', 'Encabezado Menor')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer text-xs font-bold"
                    title="Encabezado H3 (###)"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline formatting */}
                <div className="flex items-center space-x-0.5 pr-2 border-r border-stone-300 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'negrita')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Negrita (**)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'cursiva')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Cursiva (*)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<u>', '</u>', 'texto subrayado')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Subrayado"
                  >
                    <UnderlineIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('~~', '~~', 'texto tachado')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Tachado (~~)"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                </div>

                {/* Editorial Blocks */}
                <div className="flex items-center space-x-0.5 pr-2 border-r border-stone-300 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => insertBlock('> "Cita destacada relevante o frase contundente"\n> — Nombre del personaje o autor')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Cita destacada con autor (>)"
                  >
                    <Quote className="w-4 h-4 text-gold-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock(':::info\nBloque de información o contexto clave que complementa el análisis.\n:::')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Bloque de Información / Callout"
                  >
                    <Info className="w-4 h-4 text-amber-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock('---')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Separador de sección con toque tricolor (---)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* Lists */}
                <div className="flex items-center space-x-0.5 pr-2 border-r border-stone-300 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => insertFormatting('- ', '', 'Elemento de lista')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Lista con viñetas (-)"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('1. ', '', 'Elemento numerado')}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Lista numerada (1.)"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Ingresa la URL del enlace:', 'https://');
                      if (url) insertFormatting('[', `](${url})`, 'texto del enlace');
                    }}
                    className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                    title="Insertar enlace web"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Media Inserts */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUploaderTarget('inline');
                      setUploaderModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-gold-50 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                    title="Insertar imagen entre párrafos"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-gold-600" />
                    <span className="hidden sm:inline">Foto Entre Párrafos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMediaSection(showMediaSection === 'video' ? null : 'video')}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      videoUrl || showMediaSection === 'video'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-700 dark:text-rose-300'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-rose-600" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMediaSection(showMediaSection === 'audio' ? null : 'audio')}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      audioUrl || showMediaSection === 'audio'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-800 dark:text-gold-300'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5 text-gold-600" />
                    <span>Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMediaSection(showMediaSection === 'gallery' ? null : 'gallery')}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      galleryImages.length > 0 || showMediaSection === 'gallery'
                        ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 text-teal-800 dark:text-teal-300'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Galería ({galleryImages.length})</span>
                  </button>
                </div>
              </div>

              {/* Multimedia Expandable Forms */}
              {showMediaSection === 'video' && (
                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border-b border-rose-200 dark:border-rose-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
                      <Video className="w-4 h-4" />
                      <span>Configuración de Video (YouTube, Vimeo o MP4)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMediaSection(null)}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        URL del Video (YouTube o Vimeo)
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full p-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Título del Video
                      </label>
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="Ej. Transmisión especial del debate o entrevista"
                        className="w-full p-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  {videoUrl && (
                    <div className="pt-2">
                      <VideoEmbed url={videoUrl} title={videoTitle} caption={videoDescription} />
                    </div>
                  )}
                </div>
              )}

              {showMediaSection === 'audio' && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border-b border-amber-200 dark:border-amber-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-gold-300 flex items-center space-x-1.5">
                      <Headphones className="w-4 h-4" />
                      <span>Configuración de Audio (Columna de voz / Podcast / Alocución)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMediaSection(null)}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        URL del Archivo de Audio (MP3, WAV, M4A o Cloud)
                      </label>
                      <input
                        type="url"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="https://ejemplo.com/archivo.mp3"
                        className="w-full p-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Título de la Pista o Declaración
                      </label>
                      <input
                        type="text"
                        value={audioTitle}
                        onChange={(e) => setAudioTitle(e.target.value)}
                        placeholder="Ej. Palabras de Julian Camilo sobre la reforma"
                        className="w-full p-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  {audioUrl && (
                    <div className="pt-2">
                      <AudioPlayer src={audioUrl} title={audioTitle || title} author="Julian Camilo" coverUrl={coverImageUrl} />
                    </div>
                  )}
                </div>
              )}

              {showMediaSection === 'gallery' && (
                <div className="p-4 bg-teal-50/50 dark:bg-teal-950/10 border-b border-teal-200 dark:border-teal-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>Galería Fotográfica Editorial ({galleryImages.length} fotos)</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUploaderTarget('gallery');
                          setUploaderModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
                      >
                        Subir Varias Fotos
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMediaSection(null)}
                        className="text-xs text-stone-400 hover:text-stone-600"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>

                  {/* Add single image by URL */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="URL de foto para la galería..."
                      className="flex-1 p-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900"
                    />
                    <input
                      type="text"
                      value={newGalleryCaption}
                      onChange={(e) => setNewGalleryCaption(e.target.value)}
                      placeholder="Leyenda o pie de foto..."
                      className="flex-1 p-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryImage}
                      className="px-3 py-2 rounded-lg bg-[#121212] text-white text-xs font-semibold hover:bg-stone-800"
                    >
                      Agregar
                    </button>
                  </div>

                  {/* Thumbnails list */}
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-video">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1 text-[10px] text-white truncate">
                            {img.caption || `Foto ${idx + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Textarea with editorial typography spacing */}
              <div className="p-5 sm:p-6">
                <textarea
                  ref={contentTextareaRef}
                  value={content}
                  onChange={(e) => updateContentWithHistory(e.target.value)}
                  rows={20}
                  placeholder="Comienza a redactar tu artículo aquí. 

Presiona Enter dos veces para crear párrafos independientes.
Utiliza las herramientas superiores para insertar citas destacadas, bloques de contexto, encabezados H2/H3 y fotos entre párrafos."
                  className="w-full font-serif text-base sm:text-lg leading-relaxed text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none resize-y min-h-[420px]"
                />
              </div>

              {/* Status and count footer */}
              <div className="px-5 py-3 bg-[#fbf9f4] dark:bg-[#151518] border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-sans">
                <div className="flex items-center space-x-3">
                  <span>{content.trim().split(/\s+/).filter(Boolean).length} palabras</span>
                  <span>•</span>
                  <span>{readingMinutes} min de lectura aprox.</span>
                </div>
                <div className="flex items-center space-x-1.5 text-stone-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Espaciado editorial activo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Settings Column (1 col) */}
          <div className="space-y-5">
            {/* Editorial Metadata Card */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2] border-b border-stone-100 dark:border-stone-800 pb-2">
                Metadatos Editoriales
              </h3>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                  Categoría Temática *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 font-sans focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slug URL */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                  URL Amigable (Slug)
                </label>
                <div className="flex items-center text-xs text-stone-400 font-mono bg-[#faf9f6] dark:bg-[#202024] border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden p-2">
                  <span className="text-stone-400 shrink-0">/articulo/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-gold-600" />
                  <span>Etiquetas (separadas por comas)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Ej. Congreso, Tolima, Reforma, Democracia"
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {/* Schedule publication date */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-sans">
                  Programar Publicación (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-[#202024] text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-sans">
                  Destacar en portada principal
                </span>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500 cursor-pointer accent-gold-500"
                />
              </div>

              {/* Allow Comments toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-sans">
                  Permitir comentarios
                </span>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500 cursor-pointer accent-gold-500"
                />
              </div>
            </div>

            {/* Cover Image Card */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2] border-b border-stone-100 dark:border-stone-800 pb-2">
                Fotografía de Portada
              </h3>

              {coverImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 group">
                  <img src={coverImageUrl} alt="" className="w-full h-44 object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl p-6 text-center space-y-2 bg-[#faf9f6] dark:bg-[#202024]">
                  <ImageIcon className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs text-stone-500 font-sans">
                    Sube una fotografía de portada optimizada
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUploaderTarget('cover');
                      setUploaderModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#121212] text-white text-xs font-semibold hover:bg-gold-600 hover:text-stone-950 transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold-400" />
                    <span>Subir Portada Profesional</span>
                  </button>
                </div>
              )}

              {/* Direct URL input */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1 font-sans">
                  O ingresa URL directa de portada
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-[#202024] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1 font-sans">
                  Pie de foto o crédito editorial
                </label>
                <input
                  type="text"
                  value={coverImageCaption}
                  onChange={(e) => setCoverImageCaption(e.target.value)}
                  placeholder="Ej. Fotografía: Reuters / Archivo"
                  className="w-full p-2 text-xs border border-stone-200 dark:border-stone-700 rounded-lg bg-[#faf9f6] dark:bg-[#202024] focus:outline-none"
                />
              </div>
            </div>
            {/* Fuentes y Referencias Card */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2] border-b border-stone-100 dark:border-stone-800 pb-2">
                Fuentes y Referencias ({sources.length})
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="Título del documento o fuente *"
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
                <input
                  type="text"
                  value={newSourcePublisher}
                  onChange={(e) => setNewSourcePublisher(e.target.value)}
                  placeholder="Medio, entidad o autor (Opcional)"
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
                <input
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://... (Enlace opcional)"
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSourceTitle.trim()) return;
                    setSources((prev) => [
                      ...prev,
                      {
                        id: `src_${Date.now()}`,
                        title: newSourceTitle.trim(),
                        authorOrMedia: newSourcePublisher.trim() || undefined,
                        url: newSourceUrl.trim() || undefined
                      }
                    ]);
                    setNewSourceTitle('');
                    setNewSourcePublisher('');
                    setNewSourceUrl('');
                  }}
                  className="w-full py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  + Agregar Fuente
                </button>
              </div>
              {sources.length > 0 && (
                <ul className="space-y-1.5 text-xs">
                  {sources.map((s, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-[#faf9f6] dark:bg-stone-900 px-3 py-1.5 rounded-lg">
                      <span className="truncate">{s.title}</span>
                      <button
                        type="button"
                        onClick={() => setSources((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 ml-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Aclaraciones y Rectificaciones Editoriales Card */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2] border-b border-stone-100 dark:border-stone-800 pb-2">
                Aclaraciones y Rectificaciones ({rectifications.length})
              </h3>
              <div className="space-y-2">
                <select
                  value={newRectType}
                  onChange={(e) => setNewRectType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                >
                  <option value="aclaracion">Aclaración Editorial</option>
                  <option value="rectificacion">Rectificación</option>
                  <option value="fe_de_erratas">Fe de Erratas</option>
                </select>
                <textarea
                  rows={2}
                  value={newRectSummary}
                  onChange={(e) => setNewRectSummary(e.target.value)}
                  placeholder="Texto de la aclaración o rectificación..."
                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newRectSummary.trim()) return;
                    setRectifications((prev) => [
                      ...prev,
                      {
                        id: `rect_${Date.now()}`,
                        type: newRectType,
                        content: newRectSummary.trim(),
                        publishedAt: new Date().toISOString(),
                        publishedBy: 'Julian Camilo'
                      }
                    ]);
                    setNewRectSummary('');
                  }}
                  className="w-full py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold cursor-pointer"
                >
                  + Añadir Nota Editorial
                </button>
              </div>
              {rectifications.length > 0 && (
                <ul className="space-y-1.5 text-xs">
                  {rectifications.map((r, idx) => (
                    <li key={r.id || idx} className="flex items-center justify-between bg-[#faf9f6] dark:bg-stone-900 px-3 py-1.5 rounded-lg">
                      <span className="truncate">[{r.type}] {r.content}</span>
                      <button
                        type="button"
                        onClick={() => setRectifications((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 ml-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DUAL PREVIEW MODE: DESKTOP VS MOBILE */
        <div className="space-y-4">
          {/* Device Selector */}
          <div className="flex items-center justify-center space-x-2 pb-2">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-[#121212] text-white shadow-md'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Vista de Escritorio (Desktop)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-[#121212] text-white shadow-md'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Simulador Móvil (375px)</span>
            </button>
          </div>

          {/* Preview Container */}
          <div className="flex justify-center">
            {previewDevice === 'desktop' ? (
              /* Desktop Layout */
              <div className="w-full max-w-4xl bg-white dark:bg-[#161618] border border-[#e8e5dc] dark:border-stone-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-8 animate-in fade-in">
                {/* Format and category */}
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${activeFormatObj.badgeColor}`}>
                    {activeFormatObj.label}
                  </span>
                  <span className="text-xs uppercase font-sans tracking-wider text-stone-500 font-bold">
                    {categories.find((c) => c.slug === categoryId)?.name || 'Opinión'}
                  </span>
                </div>

                <header className="space-y-4">
                  <h1 className="text-3xl sm:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 leading-[1.15]">
                    {title || 'Título del artículo en vista previa'}
                  </h1>
                  {subtitle && (
                    <p className="text-xl sm:text-2xl font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                  <div className="text-xs text-stone-500 flex items-center space-x-3 pt-2 border-y border-stone-200 dark:border-stone-800 py-3">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">Por Julian Camilo</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>{readingMinutes} min de lectura</span>
                  </div>
                </header>

                {coverImageUrl && (
                  <figure className="space-y-2">
                    <img src={coverImageUrl} alt="" className="w-full rounded-2xl max-h-[500px] object-cover shadow-md" />
                    {coverImageCaption && (
                      <figcaption className="text-center text-xs font-sans text-stone-500 italic">
                        {coverImageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* Video if active */}
                {videoUrl && (
                  <VideoEmbed url={videoUrl} title={videoTitle} caption={videoDescription} />
                )}

                {/* Audio if active */}
                {audioUrl && (
                  <AudioPlayer src={audioUrl} title={audioTitle || title} author="Julian Camilo" coverUrl={coverImageUrl} />
                )}

                {/* Body Content */}
                <div className="prose prose-lg max-w-none space-y-4">
                  {renderPreviewContent(content || 'El contenido del artículo se mostrará aquí con la debida separación tipográfica de párrafos.')}
                </div>

                {/* Gallery if active */}
                {galleryImages.length > 0 && (
                  <PhotoGalleryViewer images={galleryImages} title="Galería Adjunta al Artículo" />
                )}
              </div>
            ) : (
              /* Mobile Smartphone Frame (375px) */
              <div className="w-[375px] bg-[#121212] rounded-[48px] p-4 shadow-2xl border-4 border-stone-800 animate-in zoom-in-95 duration-200">
                {/* Phone Speaker & Camera Notch */}
                <div className="w-32 h-4 bg-stone-900 rounded-full mx-auto mb-3 flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-stone-700"></span>
                  <span className="w-10 h-1 rounded-full bg-stone-800"></span>
                </div>

                {/* Screen content */}
                <div className="bg-[#fcfbf9] dark:bg-[#18181c] rounded-[36px] p-5 h-[680px] overflow-y-auto space-y-5 scrollbar-thin">
                  <div className="flex items-center space-x-2 pt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeFormatObj.badgeColor}`}>
                      {activeFormatObj.label}
                    </span>
                    <span className="text-[10px] uppercase font-sans tracking-wider text-stone-500 font-bold">
                      {categories.find((c) => c.slug === categoryId)?.name || 'Opinión'}
                    </span>
                  </div>

                  <h1 className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100 leading-tight">
                    {title || 'Título del artículo'}
                  </h1>

                  {subtitle && (
                    <p className="text-sm font-serif italic text-stone-600 dark:text-stone-300 leading-snug">
                      {subtitle}
                    </p>
                  )}

                  <div className="text-[11px] text-stone-500 border-y border-stone-200 dark:border-stone-800 py-2">
                    <span>Por Julian Camilo • {readingMinutes} min</span>
                  </div>

                  {coverImageUrl && (
                    <img src={coverImageUrl} alt="" className="w-full rounded-xl h-44 object-cover" />
                  )}

                  {videoUrl && (
                    <VideoEmbed url={videoUrl} title={videoTitle} />
                  )}

                  {audioUrl && (
                    <AudioPlayer src={audioUrl} title={audioTitle || title} author="Julian Camilo" />
                  )}

                  <div className="space-y-3 text-sm">
                    {renderPreviewContent(content || 'Contenido en dispositivo móvil.')}
                  </div>

                  {galleryImages.length > 0 && (
                    <PhotoGalleryViewer images={galleryImages} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Uploader Modal with Progress */}
      <PhotoUploaderModal
        isOpen={uploaderModalOpen}
        onClose={() => setUploaderModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        folder="articles"
        allowMultiple={uploaderTarget === 'gallery'}
        title={
          uploaderTarget === 'cover'
            ? 'Subir Portada del Artículo'
            : uploaderTarget === 'gallery'
            ? 'Subir Fotografías para la Galería'
            : 'Subir Fotografía para Insertar en el Artículo'
        }
        subtitle="Optimización WebP automática y entrega rápida vía CDN."
      />
    </div>
  );
};
