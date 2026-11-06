import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cmjApi } from '../../services/cmjApi';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  helperText?: string;
  aspectClass?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  helperText = 'Arrastra una imagen aquí o haz clic para seleccionar (JPG, PNG, WebP · máx. 15 MB)',
  aspectClass = 'h-36',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await cmjApi.uploadFile(file);
      onChange(res.fileUrl);
    } catch (err: any) {
      setError(err?.message || 'Error al subir el archivo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
        {label}
      </label>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900">
          <img
            src={value}
            alt={label}
            className={`w-full ${aspectClass} object-cover`}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-black/70 text-white text-[11px] font-bold hover:bg-black"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Quitar imagen"
              className="p-1 rounded-lg bg-red-600/90 text-white hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragging
              ? 'border-[#8c162a] bg-[#8c162a]/5 dark:border-[#f2c94c] dark:bg-[#f2c94c]/10'
              : 'border-stone-300 dark:border-stone-700 hover:border-[#8c162a] dark:hover:border-[#f2c94c] bg-stone-50/70 dark:bg-stone-900/40'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-xs text-stone-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#8c162a] dark:text-[#f2c94c]" />
              <span>Subiendo archivo al servidor...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-[#8c162a]/10 dark:bg-[#f2c94c]/15 flex items-center justify-center text-[#8c162a] dark:text-[#f2c94c]">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                {helperText}
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
