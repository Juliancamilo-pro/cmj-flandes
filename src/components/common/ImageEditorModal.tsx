import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  Crop, 
  Sliders, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { compressImageFile } from '../../services/db';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  initialAspectRatio?: number; // e.g. 1 (1:1), 16/9, 4/5
  title?: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

type AspectRatioPreset = '1:1' | '16:9' | '4:5' | 'original';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  imageSrc,
  initialAspectRatio = 1,
  title = 'Editor Visual de Fotografía',
  onConfirm,
  onCancel
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>(
    initialAspectRatio === 16/9 ? '16:9' : initialAspectRatio === 4/5 ? '4:5' : '1:1'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (imageSrc && isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        drawCanvas();
      };
      img.src = imageSrc;
    }
  }, [imageSrc, isOpen]);

  useEffect(() => {
    drawCanvas();
  }, [zoom, rotation, position, aspectPreset]);

  const getAspectDimensions = () => {
    switch (aspectPreset) {
      case '1:1':
        return { width: 500, height: 500, ratio: 1 };
      case '16:9':
        return { width: 640, height: 360, ratio: 16 / 9 };
      case '4:5':
        return { width: 440, height: 550, ratio: 4 / 5 };
      case 'original':
      default:
        if (imgRef.current) {
          const r = imgRef.current.width / (imgRef.current.height || 1);
          return { width: 500, height: Math.round(500 / r), ratio: r };
        }
        return { width: 500, height: 500, ratio: 1 };
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const { width, height } = getAspectDimensions();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = '#0f0f11';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center transformation
    ctx.translate(width / 2 + position.x, height / 2 + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate scale to fit canvas
    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;

    let drawWidth = width;
    let drawHeight = height;

    if (imgAspect > canvasAspect) {
      drawHeight = height;
      drawWidth = height * imgAspect;
    } else {
      drawWidth = width;
      drawHeight = width / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Draw subtle grid guides like Instagram
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // vertical grid
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo((2 * width) / 3, 0);
    ctx.lineTo((2 * width) / 3, height);
    // horizontal grid
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, (2 * height) / 3);
    ctx.lineTo(width, (2 * height) / 3);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setProcessing(true);
    try {
      // Create clean high-resolution canvas without grid lines
      const { width, height } = getAspectDimensions();
      const exportCanvas = document.createElement('canvas');
      // Export at 2x resolution for retina sharpness
      exportCanvas.width = width * 2;
      exportCanvas.height = height * 2;

      const ctx = exportCanvas.getContext('2d');
      const img = imgRef.current;
      if (ctx && img) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        ctx.save();
        ctx.scale(2, 2);
        ctx.translate(width / 2 + position.x, height / 2 + position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;

        let drawWidth = width;
        let drawHeight = height;

        if (imgAspect > canvasAspect) {
          drawHeight = height;
          drawWidth = height * imgAspect;
        } else {
          drawWidth = width;
          drawHeight = width / imgAspect;
        }

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);
        onConfirm(dataUrl);
      }
    } catch (e) {
      console.error('Error exporting cropped image:', e);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181c] border border-stone-800 text-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">{title}</h3>
              <p className="text-[11px] text-stone-400">Ajusta el encuadre, zoom y proporción</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area (Instagram style) */}
        <div className="flex-1 bg-[#0d0d10] p-6 flex flex-col items-center justify-center relative overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-move rounded-xl shadow-lg border border-stone-800 max-h-[46vh] max-w-full object-contain"
          />
          <p className="text-[10px] text-stone-500 mt-2 font-sans tracking-wide">
            Arrastra la imagen con el ratón para encuadrarla
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="p-5 border-t border-stone-800 bg-[#16161a] space-y-4">
          {/* Aspect Ratio Presets */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
              Encuadre:
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setAspectPreset('1:1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  aspectPreset === '1:1'
                    ? 'bg-gold-500 text-stone-950 shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                1:1 Cuadrado
              </button>
              <button
                type="button"
                onClick={() => setAspectPreset('16:9')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  aspectPreset === '16:9'
                    ? 'bg-gold-500 text-stone-950 shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                16:9 Panorámico
              </button>
              <button
                type="button"
                onClick={() => setAspectPreset('4:5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  aspectPreset === '4:5'
                    ? 'bg-gold-500 text-stone-950 shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                4:5 Retrato
              </button>
              <button
                type="button"
                onClick={() => setAspectPreset('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  aspectPreset === 'original'
                    ? 'bg-gold-500 text-stone-950 shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Original
              </button>
            </div>
          </div>

          {/* Zoom Slider and Rotation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="flex items-center space-x-3">
              <ZoomOut className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
              <ZoomIn className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="text-xs text-stone-400 font-mono w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 inline-flex items-center space-x-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-gold-400" />
                <span>Rotar 90°</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setPosition({ x: 0, y: 0 });
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-800 bg-[#121215] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={processing}
            className="px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold text-xs inline-flex items-center space-x-2 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{processing ? 'Procesando...' : 'Aplicar Fotografía'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
