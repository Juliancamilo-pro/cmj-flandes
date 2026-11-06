import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  Headphones,
  Music
} from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  author?: string;
  coverUrl?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = 'Declaración y análisis en audio',
  author = 'Julian Camilo',
  coverUrl,
  className = ''
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio play error:', e);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    audio.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1a1917] to-[#121214] text-stone-100 border border-gold-500/30 shadow-lg ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header Info with Colombian/Tolima gold accent */}
      <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-stone-800">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={title} 
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gold-500/40 shadow-xs"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gold-900/40 border border-gold-500/40 flex items-center justify-center shrink-0 text-gold-400">
            <Headphones className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-wider text-gold-400 font-semibold font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
            <span>Edición Sonora & Columna de Voz</span>
          </div>
          <h4 className="font-serif font-bold text-sm sm:text-base text-white truncate">
            {title}
          </h4>
          <p className="text-xs text-stone-400 font-sans truncate">
            {author}
          </p>
        </div>
      </div>

      {/* Progress & Duration */}
      <div className="space-y-1.5 mb-3">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-gold-400 focus:outline-none"
            aria-label="Posición de audio"
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono text-stone-400">
          <span>{formatTime(currentTime)}</span>
          <span className="text-stone-500">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Skip -15s */}
          <button
            type="button"
            onClick={() => handleSkip(-15)}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Retroceder 15 segundos"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-gold-600 to-amber-400 text-stone-950 font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            title={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip +15s */}
          <button
            type="button"
            onClick={() => handleSkip(15)}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Adelantar 15 segundos"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed & Volume controls */}
        <div className="flex items-center space-x-2">
          {/* Speed badge button */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] font-mono text-stone-300 font-semibold transition-colors"
            title="Velocidad de reproducción"
          >
            {playbackRate}x
          </button>

          {/* Volume toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
