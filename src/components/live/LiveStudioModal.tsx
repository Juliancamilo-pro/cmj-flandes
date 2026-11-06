import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Volume2,
  Sliders,
  Radio,
  Square,
  Calendar,
  Lock,
  Globe,
  EyeOff,
  Users,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Upload,
  Smartphone,
  Maximize2,
  Wifi,
  Share2,
  Disc,
  Settings,
  X,
  UserCheck,
  UserX,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  Category,
  LiveDestinationStatus,
  LiveGuestRequest,
  LiveOrientation,
  LivePlatformDestination,
  LivePrivacy,
  LiveQuality,
  LiveStream,
  LiveStreamFormat,
  PlatformConnection,
  UserPoliticalIdentity
} from '../../types';
import {
  createLiveStream,
  updateLiveStream,
  getLiveGuestRequests,
  updateLiveGuestRequest,
  getPlatformConnections,
  savePlatformConnection,
  uploadImageFile
} from '../../services/db';
import { validateImageFile } from '../../utils/security';

interface LiveStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostName: string;
  hostEmail: string;
  hostRole: 'owner' | 'collaborator' | 'subscriber';
  hostPhotoUrl?: string;
  hostPoliticalIdentity?: UserPoliticalIdentity;
  categories: Category[];
  collaboratorStatus?: string;
  collaboratorPermissions?: Record<string, boolean>;
  subscriberStatus?: string;
  subscriberPeriod?: string;
  subscriberEndDate?: string;
  embedded?: boolean;
  onStreamCreatedOrUpdated: (stream: LiveStream) => void;
}

const FORMAT_OPTIONS: { value: LiveStreamFormat; label: string; desc: string }[] = [
  { value: 'webcam', label: 'A. Cámara web', desc: 'Transmisión directa desde la cámara del computador.' },
  { value: 'mobile_camera', label: 'B. Cámara del celular', desc: 'Optimizada para cámara frontal o trasera móvil.' },
  { value: 'audio_only', label: 'C. Solo micrófono / Audio', desc: 'Emisión radial o pódcast en directo.' },
  { value: 'screen_share', label: 'D. Compartir pantalla', desc: 'Presentación de pantalla completa del computador.' },
  { value: 'window_share', label: 'E. Compartir ventana o app', desc: 'Selección de una ventana o aplicación específica.' },
  { value: 'camera_and_screen', label: 'F. Cámara + Pantalla simultánea', desc: 'Composición Picture-in-Picture en tiempo real.' },
  { value: 'interview', label: 'G. Entrevista con invitado', desc: 'Conversación 1 a 1 mediante enlace seguro de invitación.' },
  { value: 'multi_guest', label: 'H. Conversación con varios participantes', desc: 'Mesa redonda en directo con múltiples invitados.' },
  { value: 'obs_studio', label: 'I. Transmisión desde OBS Studio', desc: 'Ingesta RTMP/RTMPS para producción avanzada en OBS.' },
  { value: 'rtmp_custom', label: 'J. Servidor y clave RTMP/RTMPS', desc: 'Conexión desde encoders externos compatibles con RTMP.' }
];

const QUALITY_CONSTRAINTS: Record<LiveQuality, { width: number; height: number; bitrate: number; label: string }> = {
  auto: { width: 1280, height: 720, bitrate: 2500_000, label: 'Automática (Adaptativa)' },
  '1080p': { width: 1920, height: 1080, bitrate: 4500_000, label: '1080p Full HD' },
  '720p': { width: 1280, height: 720, bitrate: 2500_000, label: '720p HD' },
  '480p': { width: 854, height: 480, bitrate: 1200_000, label: '480p SD' },
  '360p': { width: 640, height: 360, bitrate: 700_000, label: '360p Ahorro de datos' }
};

export const LiveStudioModal: React.FC<LiveStudioModalProps> = ({
  isOpen,
  onClose,
  hostName,
  hostEmail,
  hostRole,
  hostPhotoUrl,
  hostPoliticalIdentity,
  categories,
  collaboratorStatus,
  collaboratorPermissions,
  subscriberStatus,
  subscriberPeriod,
  subscriberEndDate,
  embedded = false,
  onStreamCreatedOrUpdated
}) => {
  // Backend authorization check
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null);

  // Studio tabs
  const [studioTab, setStudioTab] = useState<'studio' | 'schedule' | 'platforms' | 'guests'>('studio');

  // Stream metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.slug || 'actualidad');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Format, orientation, quality, privacy
  const [format, setFormat] = useState<LiveStreamFormat>('webcam');
  const [orientation, setOrientation] = useState<LiveOrientation>('horizontal');
  const [quality, setQuality] = useState<LiveQuality>('auto');
  const [privacy, setPrivacy] = useState<LivePrivacy>('publico');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Scheduling
  const [isScheduledMode, setIsScheduledMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState('America/Bogota');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState(60);

  // Recording & Consent
  const [recordEnabled, setRecordEnabled] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  // Media Devices & Controls
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioInId, setSelectedAudioInId] = useState('');
  const [selectedAudioOutId, setSelectedAudioOutId] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [micVolume, setMicVolume] = useState(100);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excelente' | 'estable' | 'limitada'>('estable');
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // OBS / RTMP Credentials
  const [rtmpCreds, setRtmpCreds] = useState<{ serverUrl: string; streamKey: string; maskedKey: string } | null>(null);
  const [showRawRtmpKey, setShowRawRtmpKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // External Platforms & Multistream
  const [platformStatusInfo, setPlatformStatusInfo] = useState<Record<string, any>>({});
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<Record<LivePlatformDestination, boolean>>({
    dulima: true,
    youtube: false,
    facebook: false,
    instagram: false,
    tiktok: false
  });
  const [rtmpModalPlatform, setRtmpModalPlatform] = useState<'youtube' | 'facebook' | 'instagram' | 'tiktok' | null>(null);
  const [extAccountName, setExtAccountName] = useState('');
  const [extRtmpServer, setExtRtmpServer] = useState('');
  const [extRtmpKey, setExtRtmpKey] = useState('');

  // Active Live Session State
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [guestRequests, setGuestRequests] = useState<LiveGuestRequest[]>([]);
  const [maxGuests, setMaxGuests] = useState(4);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Refs for media streams, canvas, recorder, websocket
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const outputPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    verifyHostAuthorization();
    loadPlatformConnectionsAndStatus();
    detectNetworkQuality();

    const handleOAuthMsg = (event: MessageEvent) => {
      if (event.data?.type === 'DULIMA_LIVE_OAUTH_CALLBACK') {
        const { platform, success, error } = event.data;
        if (success) {
          const updated: PlatformConnection = {
            id: `conn_${platform}`,
            platform,
            ownerEmail: hostEmail,
            connected: true,
            connectionMethod: 'oauth',
            accountName: `Cuenta ${platform.toUpperCase()} autorizada`,
            lastCheckedAt: new Date().toISOString()
          };
          savePlatformConnection(updated).then(() => loadPlatformConnectionsAndStatus());
          setFeedback({ type: 'success', text: `Cuenta de ${platform.toUpperCase()} conectada correctamente.` });
        } else {
          setFeedback({ type: 'error', text: error || `No se completó la autorización con ${platform}.` });
        }
      }
    };

    window.addEventListener('message', handleOAuthMsg);
    return () => {
      window.removeEventListener('message', handleOAuthMsg);
      cleanupAllMedia();
    };
  }, [isOpen]);

  // Timer when LIVE is active
  useEffect(() => {
    if (!activeStream || activeStream.status !== 'en_directo') return;
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStream?.status]);

  // Poll guest requests when active
  useEffect(() => {
    if (!activeStream) return;
    const loadGuests = async () => {
      const reqs = await getLiveGuestRequests(activeStream.id);
      setGuestRequests(reqs);
    };
    loadGuests();
    const timer = setInterval(loadGuests, 4000);
    return () => clearInterval(timer);
  }, [activeStream?.id]);

  const verifyHostAuthorization = async () => {
    setAuthChecking(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/live/authorize-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: hostRole,
          email: hostEmail,
          collaboratorStatus,
          collaboratorPermissions,
          subscriberStatus,
          subscriberPeriod,
          subscriberEndDate
        })
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setAuthError(data.error || 'No tienes permisos para crear transmisiones LIVE.');
      } else {
        setStreamToken(data.streamToken);
        await enumerateAndStartDevices();
      }
    } catch {
      setAuthError('No se pudo validar tu permiso de transmisión con el servidor.');
    } finally {
      setAuthChecking(false);
    }
  };

  const detectNetworkQuality = () => {
    const conn = (navigator as any).connection;
    if (conn) {
      const downlink = conn.downlink || 5;
      if (downlink >= 5) setConnectionQuality('excelente');
      else if (downlink >= 2) setConnectionQuality('estable');
      else setConnectionQuality('limitada');
    }
  };

  const loadPlatformConnectionsAndStatus = async () => {
    try {
      const [statusRes, conns] = await Promise.all([
        fetch('/api/live/platforms/status').then((r) => r.json()).catch(() => ({})),
        getPlatformConnections(hostEmail)
      ]);
      setPlatformStatusInfo(statusRes || {});
      setConnections(conns);
    } catch {}
  };

  const enumerateAndStartDevices = async () => {
    setDeviceError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setDeviceError('Tu navegador no soporta captura de cámara/micrófono WebRTC.');
        return;
      }
      const qCfg = QUALITY_CONSTRAINTS[quality];
      const stream = await navigator.mediaDevices.getUserMedia({
        video:
          format === 'audio_only'
            ? false
            : {
                deviceId: selectedVideoId ? { exact: selectedVideoId } : undefined,
                facingMode: format === 'mobile_camera' ? facingMode : undefined,
                width: { ideal: orientation === 'horizontal' ? qCfg.width : qCfg.height },
                height: { ideal: orientation === 'horizontal' ? qCfg.height : qCfg.width }
              },
        audio: {
          deviceId: selectedAudioInId ? { exact: selectedAudioInId } : undefined,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      cameraStreamRef.current = stream;
      attachPreviewStreams(stream);
      setupAudioMeter(stream);

      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      setAudioInputDevices(devices.filter((d) => d.kind === 'audioinput'));
      setAudioOutputDevices(devices.filter((d) => d.kind === 'audiooutput'));
    } catch (err: any) {
      setDeviceError(
        'No se pudo acceder a la cámara o micrófono. Verifica los permisos del navegador o usa el modo OBS Studio / RTMP.'
      );
    }
  };

  const attachPreviewStreams = (stream: MediaStream) => {
    if (cameraPreviewRef.current) {
      cameraPreviewRef.current.srcObject = stream;
      cameraPreviewRef.current.muted = true;
      cameraPreviewRef.current.play().catch(() => {});
    }
    if (outputPreviewRef.current) {
      outputPreviewRef.current.srcObject = stream;
      outputPreviewRef.current.muted = true;
      outputPreviewRef.current.play().catch(() => {});
    }
  };

  const setupAudioMeter = (stream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100 * (micVolume / 100))));
        requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch {}
  };

  const handlePlayTestTone = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.12 * (micVolume / 100), ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close().catch(() => {});
      }, 450);
    } catch {}
  };

  // Toggle Camera without consuming unnecessary resources when disabled
  const handleToggleCamera = async () => {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    if (!cameraStreamRef.current) return;
    cameraStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
  };

  // Toggle Microphone without consuming unnecessary resources when disabled
  const handleToggleMic = async () => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (!cameraStreamRef.current) return;
    cameraStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    if (!next) setAudioLevel(0);
  };

  const handleToggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
      if (cameraStreamRef.current) {
        attachPreviewStreams(cameraStreamRef.current);
      }
      return;
    }

    try {
      const dispStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      screenStreamRef.current = dispStream;
      setScreenSharing(true);

      dispStream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        if (cameraStreamRef.current) attachPreviewStreams(cameraStreamRef.current);
      };

      if (outputPreviewRef.current) {
        outputPreviewRef.current.srcObject = dispStream;
        outputPreviewRef.current.muted = true;
        outputPreviewRef.current.play().catch(() => {});
      }
    } catch {
      setDeviceError('Se canceló la selección de pantalla o ventana.');
    }
  };

  const handleAudioOutputChange = async (deviceId: string) => {
    setSelectedAudioOutId(deviceId);
    const el = outputPreviewRef.current as any;
    if (el && typeof el.setSinkId === 'function') {
      try {
        await el.setSinkId(deviceId);
      } catch {}
    }
  };

  const handleGenerateRtmp = async (targetStreamId?: string) => {
    const sid = targetStreamId || activeStream?.id || `draft_${Date.now()}`;
    try {
      const res = await fetch('/api/live/rtmp-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: sid, authorized: Boolean(streamToken) })
      });
      if (res.ok) {
        const data = await res.json();
        setRtmpCreds(data);
      }
    } catch {}
  };

  useEffect(() => {
    if ((format === 'obs_studio' || format === 'rtmp_custom') && streamToken && !rtmpCreds) {
      handleGenerateRtmp();
    }
  }, [format, streamToken]);

  const DEFAULT_RTMP_URLS: Record<'youtube' | 'facebook' | 'instagram' | 'tiktok', string> = {
    youtube: 'rtmp://a.rtmp.youtube.com/live2',
    facebook: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    instagram: 'rtmps://live-upload.instagram.com:443/rtmp/',
    tiktok: 'rtmp://push.tiktokv.com/live/'
  };

  const openDirectPlatformForm = (platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok') => {
    const existing = connections.find((c) => c.platform === platform);
    setRtmpModalPlatform(platform);
    setExtAccountName(existing?.accountName || '');
    setExtRtmpServer(existing?.rtmpServerUrl || platformStatusInfo[platform]?.defaultRtmpUrl || DEFAULT_RTMP_URLS[platform]);
    setExtRtmpKey('');
  };

  const handleConnectOAuth = async (platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok') => {
    setFeedback(null);
    const info = platformStatusInfo[platform];
    if (!info?.oauthConfigured) {
      openDirectPlatformForm(platform);
      setFeedback({
        type: 'success',
        text: `Completa tu nombre de cuenta/canal y clave RTMP de ${platform.toUpperCase()} abajo para vincularla de inmediato.`
      });
      return;
    }
    try {
      const res = await fetch(`/api/live/oauth/${platform}/url`);
      const data = await res.json();
      if (!res.ok || !data.configured) {
        openDirectPlatformForm(platform);
        setFeedback({
          type: 'error',
          text:
            data.error ||
            `Las credenciales OAuth de ${platform.toUpperCase()} aún no están configuradas en el servidor. Conéctala mediante RTMP/RTMPS abajo.`
        });
        return;
      }
      window.open(data.url, `dulima_oauth_${platform}`, 'width=600,height=700,noopener,noreferrer');
    } catch {
      openDirectPlatformForm(platform);
      setFeedback({ type: 'error', text: `No se pudo abrir OAuth; puedes conectar ${platform.toUpperCase()} mediante RTMP/RTMPS abajo.` });
    }
  };

  const handleSaveExternalRtmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rtmpModalPlatform) return;
    setFeedback(null);
    try {
      const res = await fetch('/api/live/rtmp-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: rtmpModalPlatform,
          ownerEmail: hostEmail,
          serverUrl: extRtmpServer,
          streamKey: extRtmpKey
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'No se pudo guardar el destino RTMP.' });
        return;
      }
      const label = extAccountName.trim() || `Cuenta ${rtmpModalPlatform.toUpperCase()}`;
      await savePlatformConnection({
        id: `conn_${rtmpModalPlatform}`,
        platform: rtmpModalPlatform,
        ownerEmail: hostEmail,
        connected: true,
        connectionMethod: 'rtmp_manual',
        accountName: label,
        rtmpServerUrl: extRtmpServer,
        hasStreamKey: true,
        lastCheckedAt: new Date().toISOString()
      });
      setSelectedDestinations((prev) => ({ ...prev, [rtmpModalPlatform]: true }));
      const savedPlat = rtmpModalPlatform;
      setRtmpModalPlatform(null);
      setExtAccountName('');
      setExtRtmpServer('');
      setExtRtmpKey('');
      await loadPlatformConnectionsAndStatus();
      setFeedback({ type: 'success', text: `Cuenta ${label} (${savedPlat.toUpperCase()}) conectada y lista para Multistream.` });
    } catch {
      setFeedback({ type: 'error', text: 'Error de red guardando destino RTMP.' });
    }
  };

  const handleDisconnectPlatform = async (platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok') => {
    await savePlatformConnection({
      id: `conn_${platform}`,
      platform,
      ownerEmail: hostEmail,
      connected: false,
      connectionMethod: 'none',
      lastCheckedAt: new Date().toISOString()
    });
    setSelectedDestinations((prev) => ({ ...prev, [platform]: false }));
    await loadPlatformConnectionsAndStatus();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file, 5);
    if (!val.valid) {
      setFeedback({ type: 'error', text: val.error || 'Imagen inválida.' });
      return;
    }
    setUploadingCover(true);
    try {
      const url = await uploadImageFile(file);
      setCoverImageUrl(url);
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo subir la imagen de portada.' });
    } finally {
      setUploadingCover(false);
    }
  };

  const startLocalRecording = () => {
    if (!recordEnabled || !recordingConsent) return;
    const streamToRecord = screenStreamRef.current || cameraStreamRef.current;
    if (!streamToRecord) return;
    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(streamToRecord, { mimeType: 'video/webm' });
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecordingActive(true);
    } catch {
      // Fallback if webm mimeType not supported
      try {
        const recorder = new MediaRecorder(streamToRecord);
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecordingActive(true);
      } catch {}
    }
  };

  const stopLocalRecordingAndGetUrl = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecordingActive(false);
        resolve(undefined);
        return;
      }
      recorder.onstop = () => {
        setIsRecordingActive(false);
        if (recordedChunksRef.current.length === 0) {
          resolve(undefined);
          return;
        }
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };
      recorder.stop();
    });
  };

  const connectStudioWebSocket = (streamId: string) => {
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws/live`);
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'room:join',
            streamId,
            peerId: `host_${Date.now()}`,
            role: 'host',
            displayName: hostName
          })
        );
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'room:presence' && typeof msg.concurrentViewers === 'number') {
            setActiveStream((prev) =>
              prev
                ? {
                    ...prev,
                    concurrentViewers: msg.concurrentViewers,
                    peakViewers: Math.max(prev.peakViewers || 1, msg.concurrentViewers)
                  }
                : null
            );
          }
        } catch {}
      };
    } catch {}
  };

  const handleStartOrScheduleLive = async (mode: 'live_now' | 'schedule') => {
    setFeedback(null);
    if (!title.trim()) {
      setFeedback({ type: 'error', text: 'Ingresa un título para la transmisión LIVE.' });
      return;
    }
    if (recordEnabled && !recordingConsent) {
      setFeedback({
        type: 'error',
        text: 'Debes confirmar el consentimiento de los participantes antes de habilitar la grabación.'
      });
      return;
    }
    if (mode === 'schedule' && (!scheduledDate || !scheduledTime)) {
      setFeedback({ type: 'error', text: 'Selecciona la fecha y hora para programar el evento LIVE.' });
      return;
    }

    setSaving(true);
    try {
      const cat = categories.find((c) => c.slug === categoryId);
      const destinations: LiveDestinationStatus[] = (['dulima', 'youtube', 'facebook', 'instagram', 'tiktok'] as LivePlatformDestination[]).map(
        (plat) => {
          if (plat === 'dulima') {
            return {
              platform: 'dulima',
              enabled: true,
              status: mode === 'live_now' ? 'transmitiendo' : 'conectado'
            };
          }
          const conn = connections.find((c) => c.platform === plat);
          const isEnabled = Boolean(selectedDestinations[plat] && conn?.connected);
          return {
            platform: plat,
            enabled: isEnabled,
            status: isEnabled ? (mode === 'live_now' ? 'transmitiendo' : 'conectado') : 'desconectado'
          };
        }
      );

      const inviteToken = Math.random().toString(36).slice(2, 10);
      const now = new Date().toISOString();

      const created = await createLiveStream({
        title: title.trim(),
        description: description.trim() || 'Transmisión en directo desde DULIMA.',
        coverImageUrl: coverImageUrl.trim() || undefined,
        categoryId: cat?.slug || 'actualidad',
        categoryName: cat?.name || 'Actualidad',
        hostName,
        hostEmail,
        hostRole,
        hostPhotoUrl,
        hostPoliticalIdentity,
        format,
        orientation,
        quality,
        privacy,
        status: mode === 'live_now' ? 'en_directo' : 'programado',
        scheduledAt: mode === 'schedule' ? `${scheduledDate}T${scheduledTime}:00` : undefined,
        timezone: mode === 'schedule' ? timezone : undefined,
        estimatedDurationMin: mode === 'schedule' ? estimatedDurationMin : undefined,
        startedAt: mode === 'live_now' ? now : undefined,
        inviteToken,
        maxGuests,
        recordEnabled,
        recordingAuthorized: Boolean(recordEnabled && recordingConsent),
        allowDownload: false,
        destinations,
        concurrentViewers: mode === 'live_now' ? 1 : 0,
        peakViewers: mode === 'live_now' ? 1 : 0,
        totalViews: mode === 'live_now' ? 1 : 0,
        likesCount: 0,
        reactions: { like: 0, applause: 0, fire: 0, support: 0, insightful: 0 },
        commentsCount: 0
      });

      onStreamCreatedOrUpdated(created);

      if (mode === 'live_now') {
        setActiveStream(created);
        setElapsedSec(0);
        startLocalRecording();
        connectStudioWebSocket(created.id);
        await handleGenerateRtmp(created.id);
        setFeedback({ type: 'success', text: '¡Transmisión EN DIRECTO iniciada en DULIMA!' });
      } else {
        setFeedback({ type: 'success', text: 'Evento LIVE programado correctamente.' });
        setTimeout(() => onClose(), 1200);
      }
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo iniciar o programar la transmisión.' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmEndLive = async () => {
    if (!activeStream) return;
    setSaving(true);
    try {
      const recordingUrl = await stopLocalRecordingAndGetUrl();
      const endedAt = new Date().toISOString();
      const finishedDestinations = activeStream.destinations.map((d) => ({
        ...d,
        status: d.enabled ? ('finalizado' as const) : ('desconectado' as const)
      }));

      const updates: Partial<LiveStream> = {
        status: 'finalizado',
        endedAt,
        durationSec: elapsedSec,
        recordingUrl: activeStream.recordingAuthorized ? recordingUrl : undefined,
        destinations: finishedDestinations
      };

      await updateLiveStream(activeStream.id, updates);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stream:status', status: 'finalizado' }));
        wsRef.current.close();
      }
      const updatedStream: LiveStream = { ...activeStream, ...updates };
      onStreamCreatedOrUpdated(updatedStream);
      setActiveStream(null);
      setConfirmEndOpen(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleGuestDecision = async (req: LiveGuestRequest, decision: 'aceptado' | 'rechazado' | 'retirado') => {
    if (!activeStream) return;
    await updateLiveGuestRequest(activeStream.id, req.id, { status: decision });
    setGuestRequests((prev) => prev.map((g) => (g.id === req.id ? { ...g, status: decision } : g)));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'guest:decision',
          guestId: req.id,
          guestName: req.guestName,
          decision
        })
      );
    }
  };

  const cleanupAllMedia = () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close().catch(() => {});
    wsRef.current?.close();
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        embedded
          ? 'w-full'
          : 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto'
      }
    >
      <div
        className={`bg-[#121214] text-stone-100 w-full rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col ${
          embedded ? '' : 'max-w-6xl my-auto max-h-[94vh]'
        }`}
      >
        {/* Top Studio Header */}
        <div className="px-5 py-4 bg-[#18181c] border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ce1126] flex items-center justify-center text-white shadow-md">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-black text-lg sm:text-xl text-white tracking-tight">
                  ESTUDIO LIVE DE DULIMA
                </h2>
                {activeStream?.status === 'en_directo' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#ce1126] text-white text-[11px] font-black uppercase tracking-wider animate-pulse">
                    <span>LIVE</span>
                    <span>· {formatTimer(elapsedSec)}</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-stone-400">Preparación</span>
                )}
                {isRecordingActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950 border border-rose-700 text-rose-300 text-[11px] font-bold">
                    <Disc className="w-3 h-3 animate-spin" />
                    <span>GRABANDO</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Presentador: <strong className="text-stone-200">{hostName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs">
              <Wifi
                className={`w-3.5 h-3.5 ${
                  connectionQuality === 'excelente'
                    ? 'text-emerald-400'
                    : connectionQuality === 'estable'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              />
              <span className="text-stone-300 capitalize">Conexión: {connectionQuality}</span>
            </div>

            {activeStream?.status === 'en_directo' ? (
              <button
                type="button"
                onClick={() => setConfirmEndOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ce1126] hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Finalizar LIVE</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  cleanupAllMedia();
                  onClose();
                }}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
                aria-label="Cerrar estudio LIVE"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Authorization Gate */}
        {authChecking ? (
          <div className="p-12 text-center text-sm text-stone-400">
            Verificando permisos de transmisión en directo...
          </div>
        ) : authError ? (
          <div className="p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-white">Acceso restringido a Estudio LIVE</h3>
            <p className="text-sm text-stone-300 leading-relaxed">{authError}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white cursor-pointer"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Studio Sub-Navigation */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3 overflow-x-auto">
              {[
                { id: 'studio', label: 'Estudio y Cámaras', icon: Video },
                { id: 'schedule', label: 'Programación y Portada', icon: Calendar },
                { id: 'platforms', label: 'Conectar Plataformas & Multistream', icon: Share2 },
                { id: 'guests', label: `Invitados (${guestRequests.length})`, icon: Users }
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStudioTab(t.id as any)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      studioTab === t.id
                        ? 'bg-[#ce1126] text-white'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {deviceError && (
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deviceError}</span>
              </div>
            )}

            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* TAB 1: STUDIO & CAMERAS */}
            {studioTab === 'studio' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Dual Preview (Camera + Output) & Hardware Controls */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Camera Preview */}
                    <div className="bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden">
                      <div className="px-3 py-2 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between text-[11px] font-bold text-stone-400">
                        <span>VISTA PREVIA DE CÁMARA</span>
                        <span>{cameraEnabled ? 'Activa' : 'Desactivada'}</span>
                      </div>
                      <div className="aspect-video bg-black relative flex items-center justify-center">
                        <video
                          ref={cameraPreviewRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${!cameraEnabled ? 'hidden' : ''}`}
                        />
                        {!cameraEnabled && (
                          <div className="text-center text-stone-500 text-xs space-y-1">
                            <VideoOff className="w-7 h-7 mx-auto" />
                            <p>Cámara apagada (ahorro de recursos)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Output Preview */}
                    <div className="bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden">
                      <div className="px-3 py-2 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between text-[11px] font-bold text-stone-400">
                        <span>VISTA PREVIA DEL RESULTADO</span>
                        <span>{orientation === 'horizontal' ? '16:9 Horizontal' : '9:16 Vertical'}</span>
                      </div>
                      <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                        <div
                          className={`relative bg-stone-900 overflow-hidden flex items-center justify-center ${
                            orientation === 'vertical' ? 'h-full aspect-[9/16]' : 'w-full h-full'
                          }`}
                        >
                          <video
                            ref={outputPreviewRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          {activeStream?.status === 'en_directo' && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#ce1126] text-white text-[10px] font-black">
                              LIVE
                            </span>
                          )}
                          {title && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent p-2 text-[11px] font-bold text-white truncate">
                              {title}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Hardware Action Bar */}
                  <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-2xl bg-[#18181c] border border-stone-800">
                    <button
                      type="button"
                      onClick={handleToggleMic}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        micEnabled ? 'bg-stone-800 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                      <span>{micEnabled ? 'Silenciar micrófono' : 'Activar micrófono'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        cameraEnabled ? 'bg-stone-800 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {cameraEnabled ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4" />}
                      <span>{cameraEnabled ? 'Desactivar cámara' : 'Activar cámara'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleScreenShare}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        screenSharing ? 'bg-sky-600 text-white' : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>{screenSharing ? 'Dejar de compartir' : 'Compartir pantalla / ventana'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePlayTestTone}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 cursor-pointer ml-auto"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-gold-400" />
                      <span>Prueba de sonido</span>
                    </button>
                  </div>

                  {/* Audio Level Meter & Volume */}
                  <div className="p-4 rounded-2xl bg-[#18181c] border border-stone-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                          <span>Nivel de entrada de micrófono</span>
                          <span>{micEnabled ? `${audioLevel}%` : 'Silenciado'}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-stone-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                            style={{ width: `${micEnabled ? audioLevel : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                          <span>Control de volumen</span>
                          <span>{micVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={micVolume}
                          onChange={(e) => setMicVolume(Number(e.target.value))}
                          className="w-full accent-[#ce1126]"
                        />
                      </div>
                    </div>

                    {/* Device Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 mb-1">Cámara</label>
                        <select
                          value={selectedVideoId}
                          onChange={(e) => {
                            setSelectedVideoId(e.target.value);
                            enumerateAndStartDevices();
                          }}
                          className="w-full px-2.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200"
                        >
                          {videoDevices.map((d, i) => (
                            <option key={d.deviceId || i} value={d.deviceId}>
                              {d.label || `Cámara ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 mb-1">Micrófono</label>
                        <select
                          value={selectedAudioInId}
                          onChange={(e) => {
                            setSelectedAudioInId(e.target.value);
                            enumerateAndStartDevices();
                          }}
                          className="w-full px-2.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200"
                        >
                          {audioInputDevices.map((d, i) => (
                            <option key={d.deviceId || i} value={d.deviceId}>
                              {d.label || `Micrófono ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 mb-1">Salida de audio</label>
                        <select
                          value={selectedAudioOutId}
                          onChange={(e) => handleAudioOutputChange(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200"
                        >
                          {audioOutputDevices.length === 0 ? (
                            <option value="">Predeterminada del sistema</option>
                          ) : (
                            audioOutputDevices.map((d, i) => (
                              <option key={d.deviceId || i} value={d.deviceId}>
                                {d.label || `Salida ${i + 1}`}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* OBS Studio / RTMP Credentials Box */}
                  {(format === 'obs_studio' || format === 'rtmp_custom') && rtmpCreds && (
                    <div className="p-4 rounded-2xl bg-stone-900 border border-stone-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                          Configuración RTMP/RTMPS para OBS Studio
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowRawRtmpKey((p) => !p)}
                          className="text-xs text-sky-400 hover:underline cursor-pointer"
                        >
                          {showRawRtmpKey ? 'Ocultar clave' : 'Mostrar clave'}
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2 bg-black/50 p-2.5 rounded-xl">
                          <span className="text-stone-400">Servidor:</span>
                          <code className="text-emerald-300 truncate">{rtmpCreds.serverUrl}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(rtmpCreds.serverUrl, 'rtmp_url')}
                            className="text-stone-300 hover:text-white cursor-pointer"
                          >
                            {copiedField === 'rtmp_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-black/50 p-2.5 rounded-xl">
                          <span className="text-stone-400">Clave de transmisión:</span>
                          <code className="text-amber-300 truncate">
                            {showRawRtmpKey ? rtmpCreds.streamKey : rtmpCreds.maskedKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(rtmpCreds.streamKey, 'rtmp_key')}
                            className="text-stone-300 hover:text-white cursor-pointer"
                          >
                            {copiedField === 'rtmp_key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Stream Details, Format, Orientation, Quality, Recording */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#18181c] border border-stone-800 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Título de la transmisión *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej. Análisis político: retos del Tolima en 2026"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">Descripción previa</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tema, invitados y contexto de la emisión..."
                        className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 mb-1">Categoría</label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 mb-1">Privacidad</label>
                        <select
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value as LivePrivacy)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                        >
                          <option value="publico">Pública</option>
                          <option value="no_listado">No listada (solo con enlace)</option>
                          <option value="privado">Privada</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                        Modalidad de transmisión
                      </label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as LiveStreamFormat)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                      >
                        {FORMAT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 mb-1">Orientación</label>
                        <select
                          value={orientation}
                          onChange={(e) => setOrientation(e.target.value as LiveOrientation)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                        >
                          <option value="horizontal">Horizontal (16:9)</option>
                          <option value="vertical">Vertical (9:16 Móvil)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 mb-1">Calidad de vídeo</label>
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value as LiveQuality)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                        >
                          {Object.entries(QUALITY_CONSTRAINTS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Recording & Explicit Consent */}
                  <div className="p-4 rounded-2xl bg-[#18181c] border border-stone-800 space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-stone-200 flex items-center gap-2">
                        <Disc className="w-4 h-4 text-rose-400" />
                        <span>Grabar transmisión al finalizar</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={recordEnabled}
                        onChange={(e) => {
                          setRecordEnabled(e.target.checked);
                          if (!e.target.checked) setRecordingConsent(false);
                        }}
                        className="accent-[#ce1126] w-4 h-4"
                      />
                    </label>

                    {recordEnabled && (
                      <label className="flex items-start gap-2 text-[11px] text-stone-300 bg-stone-900 p-2.5 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={recordingConsent}
                          onChange={(e) => setRecordingConsent(e.target.checked)}
                          className="accent-[#ce1126] w-4 h-4 mt-0.5 shrink-0"
                        />
                        <span>
                          Confirmo el consentimiento de los participantes para grabar esta transmisión. Se mostrará un aviso
                          visible de grabación en directo.
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Start LIVE Button */}
                  {!activeStream && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleStartOrScheduleLive('live_now')}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ce1126] hover:bg-rose-700 text-white text-sm font-black shadow-lg cursor-pointer disabled:opacity-50"
                      >
                        <Radio className="w-4 h-4" />
                        <span>{saving ? 'Iniciando...' : 'Iniciar LIVE ahora'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SCHEDULE & COVER IMAGE */}
            {studioTab === 'schedule' && (
              <div className="max-w-2xl space-y-4 bg-[#18181c] p-5 rounded-2xl border border-stone-800">
                <h3 className="font-serif font-bold text-lg text-white">
                  Programar Evento LIVE y Portada
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Imagen de portada previa
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="URL de imagen de portada..."
                      className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                    />
                    <label className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingCover ? 'Subiendo...' : 'Subir portada'}</span>
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">Fecha *</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">Hora *</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">Zona horaria</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                    >
                      <option value="America/Bogota">Colombia (America/Bogota)</option>
                      <option value="America/Mexico_City">México (America/Mexico_City)</option>
                      <option value="America/New_York">EST (America/New_York)</option>
                      <option value="Europe/Madrid">España (Europe/Madrid)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Duración estimada (minutos)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={480}
                    value={estimatedDurationMin}
                    onChange={(e) => setEstimatedDurationMin(Number(e.target.value))}
                    className="w-40 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleStartOrScheduleLive('schedule')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 text-stone-950 text-xs font-black hover:bg-gold-400 cursor-pointer disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{saving ? 'Programando...' : 'Publicar Evento Programado'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CONECTAR PLATAFORMAS & MULTISTREAM */}
            {studioTab === 'platforms' && (
              <div className="space-y-6">
                <div className="bg-[#18181c] p-5 rounded-2xl border border-stone-800 space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      CONECTAR PLATAFORMAS & MULTISTREAM
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Conecta cuentas mediante OAuth oficial cuando las credenciales de API estén configuradas, o utiliza
                      ingesta RTMP/RTMPS autorizada. Nunca solicitamos ni almacenamos contraseñas de redes sociales.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['youtube', 'facebook', 'instagram', 'tiktok'] as const).map((plat) => {
                      const conn = connections.find((c) => c.platform === plat);
                      const info = platformStatusInfo[plat] || {};
                      const isConnected = Boolean(conn?.connected);
                      const isMultistreamChecked = Boolean(selectedDestinations[plat] && isConnected);
                      const platTitle =
                        plat === 'youtube'
                          ? 'YouTube'
                          : plat === 'facebook'
                          ? 'Facebook'
                          : plat === 'instagram'
                          ? 'Instagram'
                          : 'TikTok';

                      return (
                        <div
                          key={plat}
                          className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-bold text-base text-white">{platTitle}</span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isConnected
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-stone-800 text-stone-400'
                                }`}
                              >
                                {isConnected ? 'Conectado' : 'No conectado'}
                              </span>
                            </div>

                            {isConnected && conn?.accountName && (
                              <p className="text-xs text-emerald-300 font-medium">
                                {conn.accountName} ({conn.connectionMethod === 'oauth' ? 'OAuth' : 'RTMP'})
                              </p>
                            )}

                            <p className="text-[11px] text-stone-400 leading-relaxed">
                              {info.note || 'Conecta tu cuenta mediante OAuth 2.0 o servidor y clave RTMP/RTMPS.'}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-stone-800">
                            {isConnected ? (
                              <>
                                <label className="flex items-center justify-between text-xs font-bold text-stone-200 cursor-pointer">
                                  <span>Incluir en Multistream</span>
                                  <input
                                    type="checkbox"
                                    checked={isMultistreamChecked}
                                    onChange={(e) =>
                                      setSelectedDestinations((prev) => ({
                                        ...prev,
                                        [plat]: e.target.checked
                                      }))
                                    }
                                    className="accent-[#ce1126] w-4 h-4"
                                  />
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openDirectPlatformForm(plat)}
                                    className="flex-1 py-1.5 rounded-xl bg-stone-800 text-xs text-stone-200 hover:bg-stone-700 cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDisconnectPlatform(plat)}
                                    className="flex-1 py-1.5 rounded-xl border border-stone-700 text-xs text-stone-300 hover:bg-stone-800 cursor-pointer"
                                  >
                                    Desconectar
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleConnectOAuth(plat)}
                                  className="w-full py-2 rounded-xl bg-white text-stone-950 text-xs font-bold hover:bg-stone-200 cursor-pointer"
                                >
                                  {info.oauthConfigured ? 'Conectar con OAuth' : `Conectar ${platTitle}`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDirectPlatformForm(plat)}
                                  className="w-full py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 cursor-pointer"
                                >
                                  Configurar RTMP/RTMPS
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* External RTMP / Account Connection Form */}
                {rtmpModalPlatform && (
                  <form
                    onSubmit={handleSaveExternalRtmp}
                    className="p-5 rounded-2xl bg-stone-900 border border-stone-700 space-y-3 max-w-xl"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-base text-white">
                        Conectar cuenta de {rtmpModalPlatform.toUpperCase()} (RTMP/RTMPS)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setRtmpModalPlatform(null)}
                        className="text-xs text-stone-400 hover:text-white cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">
                          Nombre de cuenta, página o @usuario
                        </label>
                        <input
                          type="text"
                          value={extAccountName}
                          onChange={(e) => setExtAccountName(e.target.value)}
                          placeholder={`Ej. @dulima_${rtmpModalPlatform}`}
                          className="w-full px-3 py-2 rounded-xl bg-black border border-stone-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">URL del Servidor RTMP/RTMPS</label>
                        <input
                          type="text"
                          required
                          value={extRtmpServer}
                          onChange={(e) => setExtRtmpServer(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black border border-stone-800 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">
                        Clave de transmisión / Stream Key (se almacena oculta en el servidor)
                      </label>
                      <input
                        type="password"
                        required
                        value={extRtmpKey}
                        onChange={(e) => setExtRtmpKey(e.target.value)}
                        placeholder="Pega aquí tu clave de transmisión..."
                        className="w-full px-3 py-2 rounded-xl bg-black border border-stone-800 text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRtmpModalPlatform(null)}
                        className="px-3.5 py-1.5 rounded-xl bg-stone-800 text-xs text-stone-300 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-[#ce1126] text-xs font-bold text-white cursor-pointer"
                      >
                        Guardar y conectar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 4: GUESTS & INTERVIEWS */}
            {studioTab === 'guests' && (
              <div className="bg-[#18181c] p-5 rounded-2xl border border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      Entrevistas e Invitados en Directo
                    </h3>
                    <p className="text-xs text-stone-400">
                      Comparte el enlace seguro de invitación. Los enlaces de invitado nunca otorgan permisos administrativos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-400">Límite de invitados:</label>
                    <select
                      value={maxGuests}
                      onChange={(e) => setMaxGuests(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white"
                    >
                      {[1, 2, 3, 4, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'invitado' : 'invitados'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeStream ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                      <span className="text-stone-400 shrink-0">Enlace de invitación:</span>
                      <code className="text-sky-300 truncate">
                        {`${window.location.origin}/#/live?join=${activeStream.id}&invite=${activeStream.inviteToken}`}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/#/live?join=${activeStream.id}&invite=${activeStream.inviteToken}`,
                            'guest_link'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold cursor-pointer shrink-0"
                      >
                        {copiedField === 'guest_link' ? 'Copiado' : 'Copiar enlace'}
                      </button>
                    </div>

                    {guestRequests.length === 0 ? (
                      <p className="text-xs text-stone-500 py-4 text-center">
                        Aún no hay solicitudes de ingreso de invitados para esta transmisión.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {guestRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs"
                          >
                            <div>
                              <span className="font-bold text-white">{req.guestName}</span>
                              <span className="ml-2 text-stone-400">({req.status})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {req.status === 'pendiente' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleGuestDecision(req, 'aceptado')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Aceptar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGuestDecision(req, 'rechazado')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold cursor-pointer"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Rechazar</span>
                                  </button>
                                </>
                              )}
                              {req.status === 'aceptado' && (
                                <button
                                  type="button"
                                  onClick={() => handleGuestDecision(req, 'retirado')}
                                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-rose-300 font-bold cursor-pointer"
                                >
                                  Retirar participante
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400">
                    Inicia la transmisión LIVE para generar el enlace de invitación y gestionar las solicitudes de ingreso en tiempo real.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal before Ending LIVE */}
        {confirmEndOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#18181c] border border-stone-700 rounded-2xl max-w-md w-full p-6 space-y-4">
              <h4 className="font-serif font-bold text-lg text-white">¿Finalizar transmisión LIVE?</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Se cerrará la emisión en directo para todos los espectadores.
                {activeStream?.recordingAuthorized
                  ? ' La grabación autorizada se guardará en el archivo de DULIMA LIVE.'
                  : ' No se guardará grabación porque no fue habilitada.'}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmEndOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-xs font-bold text-stone-200 cursor-pointer"
                >
                  Continuar transmitiendo
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleConfirmEndLive}
                  className="px-4 py-2 rounded-xl bg-[#ce1126] text-xs font-bold text-white cursor-pointer"
                >
                  {saving ? 'Finalizando...' : 'Sí, finalizar LIVE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
