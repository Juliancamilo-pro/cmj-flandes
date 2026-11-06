import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Share2, 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Star,
  RefreshCw
} from 'lucide-react';
import { EditorialPost, Profile } from '../../types';
import { getPosts, createPost, updatePost, deletePost, OFFICIAL_AUTHOR_PORTRAIT } from '../../services/db';
import { PhotoUploaderModal } from '../../components/common/PhotoUploaderModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface AdminPostsProps {
  profile: Profile | null;
}

export const AdminPosts: React.FC<AdminPostsProps> = ({ profile }) => {
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post Form State
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Photo Uploader Modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Edit / Delete State
  const [editingPost, setEditingPost] = useState<EditorialPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<EditorialPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (e) {
      console.error('Error loading posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!content.trim()) {
      setErrorMsg('El contenido de la publicación no puede estar vacío.');
      return;
    }

    setPublishing(true);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, {
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
          imageCaption: imageCaption.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined
        });
        setSuccessMsg('¡Publicación actualizada exitosamente!');
        setEditingPost(null);
      } else {
        await createPost({
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
          imageCaption: imageCaption.trim() || undefined,
          authorName: profile?.name || 'Julian Camilo',
          authorPhoto: profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT,
          tags: tags.length > 0 ? tags : undefined,
          likes: 0,
          reactions: { yellow: 0, blue: 0, red: 0 },
          status: 'published'
        });
        setSuccessMsg('¡Publicación compartida con tus lectores!');
      }

      // Reset form
      setContent('');
      setImageUrl('');
      setImageCaption('');
      setTags([]);
      await loadPosts();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Error creating post:', err);
      setErrorMsg('No fue posible guardar la publicación: ' + (err.message || ''));
    } finally {
      setPublishing(false);
    }
  };

  const handleStartEdit = (post: EditorialPost) => {
    setEditingPost(post);
    setContent(post.content);
    setImageUrl(post.imageUrl || '');
    setImageCaption(post.imageCaption || '');
    setTags(post.tags || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setContent('');
    setImageUrl('');
    setImageCaption('');
    setTags([]);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await deletePost(postToDelete.id);
      setSuccessMsg('Publicación eliminada correctamente.');
      setPostToDelete(null);
      await loadPosts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg('Error al eliminar la publicación.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#eeeae1] dark:border-stone-800 pb-5">
        <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
          Micro-Columnas & Actualizaciones Rápidas
        </span>
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#121212] dark:text-[#f3ede2] mt-1">
          Gestión de Publicaciones
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
          Crea publicaciones y notas rápidas con fotografías y opiniones inmediatas, sin la estructura pesada de un artículo largo.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Composer Card */}
      <div className="bg-white dark:bg-[#1b1a18] border border-[#e8e5dc] dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#eeeae1] dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold-500 shrink-0 bg-stone-100">
              <img
                src={profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT}
                alt={profile?.name || 'Julian Camilo'}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 block">
                {editingPost ? 'Editando Publicación' : 'Crear Nueva Publicación'}
              </span>
              <span className="text-[11px] text-stone-400 font-sans">
                Visible para todos los lectores de la plataforma
              </span>
            </div>
          </div>

          {editingPost && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              Cancelar Edición
            </button>
          )}
        </div>

        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="¿Qué pensamiento, primicia, análisis rápido o reflexión deseas publicar hoy?"
            className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 font-serif text-base placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40 resize-y"
          />

          {/* Attached Photo Preview */}
          {imageUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 max-w-md bg-stone-100 dark:bg-stone-800 group">
              <img
                src={imageUrl}
                alt="Foto adjunta"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors shadow-md"
                title="Quitar fotografía"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-2 bg-white/90 dark:bg-stone-900/90 text-xs">
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Pie de foto o crédito opcional..."
                  className="w-full bg-transparent border-none text-[11px] text-stone-600 dark:text-stone-300 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Tags list & Tag input */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gold-50 dark:bg-gold-950/40 text-gold-800 dark:text-gold-300 border border-gold-200 dark:border-gold-800 text-xs font-semibold"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="+ Etiqueta (Enter)"
                className="px-3 py-1 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:border-gold-500 w-32"
              />
            </div>
          </div>

          {/* Toolbar and Submit */}
          <div className="flex items-center justify-between pt-3 border-t border-[#eeeae1] dark:border-stone-800">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPhotoModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-gold-500" />
                <span>{imageUrl ? 'Cambiar Fotografía' : 'Adjuntar Fotografía'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={publishing || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {publishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{editingPost ? 'Guardar Cambios' : 'Publicar Ahora'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Publications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-xl text-[#121212] dark:text-[#f3ede2]">
            Historial de Publicaciones ({posts.length})
          </h2>
          <button
            type="button"
            onClick={loadPosts}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-[#1b1a18] rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-400 font-sans">Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-[#1b1a18] rounded-2xl border border-stone-200 dark:border-stone-800 p-6">
            <MessageSquare className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 font-serif">
              Aún no has creado publicaciones rápidas
            </p>
            <p className="text-xs text-stone-400 font-sans max-w-sm mx-auto">
              Utiliza el compositor superior para compartir notas breves, reflexiones o primicias con tus lectores.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 shadow-sm space-y-4 hover:border-gold-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.authorPhoto || profile?.photoUrl || OFFICIAL_AUTHOR_PORTRAIT}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-gold-400"
                    />
                    <div>
                      <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 block">
                        {post.authorName}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {new Date(post.createdAt).toLocaleString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(post)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-gold-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                      title="Editar publicación"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostToDelete(post)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm font-serif text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Attached Image */}
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 max-h-96 bg-stone-100 dark:bg-stone-800">
                    <img
                      src={post.imageUrl}
                      alt="Adjunto"
                      loading="lazy"
                      className="w-full h-auto object-cover max-h-96"
                    />
                    {post.imageCaption && (
                      <div className="p-2 bg-stone-50 dark:bg-stone-900 text-[11px] text-stone-500 italic text-center font-sans">
                        {post.imageCaption}
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] text-gold-700 dark:text-gold-400 font-semibold bg-gold-50 dark:bg-gold-950/40 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Colombian Reactions Display */}
                <div className="flex items-center space-x-4 pt-3 border-t border-[#eeeae1] dark:border-stone-800 text-xs text-stone-500 font-mono">
                  <span className="flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{post.reactions?.yellow || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                    <span>{post.reactions?.blue || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                    <span>{post.reactions?.red || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Uploader Modal */}
      <PhotoUploaderModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onUploadSuccess={(items) => {
          if (items.length > 0) {
            setImageUrl(items[0].url);
            setPhotoModalOpen(false);
          }
        }}
        folder="posts"
        allowMultiple={false}
        title="Adjuntar Fotografía a la Publicación"
        subtitle="Optimización WebP automática, compresión inteligente y carga rápida."
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={postToDelete !== null}
        title="Eliminar Publicación"
        message="¿Estás seguro de que deseas eliminar permanentemente esta publicación rápida? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar Publicación"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={deleting}
        onConfirm={confirmDeletePost}
        onCancel={() => setPostToDelete(null)}
      />
    </div>
  );
};
