import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  Subtitles,
  MessageSquare,
  HelpCircle,
  BarChart2,
  Users,
  Heart,
  Flame,
  Sparkles,
  ThumbsUp,
  Share2,
  Flag,
  Bell,
  BellOff,
  Calendar,
  Clock,
  Download,
  Lock,
  Pin,
  Star,
  Trash2,
  Volume1,
  Ban,
  Send,
  UserPlus,
  Video,
  VideoOff,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Eye,
  Film,
  Sparkle
} from 'lucide-react';
import {
  Category,
  LiveChatMessage,
  LiveGuestRequest,
  LivePoll,
  LiveQuality,
  LiveStream
} from '../../types';
import {
  getLiveStreams,
  updateLiveStream,
  getLiveChatMessages,
  sendLiveChatMessage,
  deleteLiveChatMessage,
  getLivePolls,
  createLivePoll,
  voteLivePoll,
  submitLiveGuestRequest,
  getLiveReminders,
  toggleLiveReminder,
  submitLiveReport
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { canUserHostLive } from '../../utils/permissions';
import { LiveStudioModal } from '../../components/live/LiveStudioModal';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../../components/common/OwnerVerifiedBadge';
import { PoliticalIdentityBadges } from '../../components/common/PoliticalOrgLogo';

interface LivePageProps {
  categories: Category[];
  initialStreamId?: string;
}

export const LivePage: React.FC<LivePageProps> = ({ categories, initialStreamId }) => {
  const { user, isAdmin, collaborator, subscriber, ownerEmail } = useAuth();

  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  // Studio embedded & modal state
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioExpanded, setStudioExpanded] = useState(true);

  // Player controls (NEVER autoplay audio with sound)
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(80);
  const [playerQuality, setPlayerQuality] = useState<LiveQuality>('auto');
  const [theaterMode, setTheaterMode] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interactive side panel tabs
  const [sideTab, setSideTab] = useState<'chat' | 'qa' | 'polls' | 'viewers'>('chat');
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isQuestionInput, setIsQuestionInput] = useState(false);
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [votedPollIds, setVotedPollIds] = useState<Record<string, string>>({});

  // Host Poll Creator
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState('Sí\nNo');

  // Presence & Viewers
  const [concurrentViewers, setConcurrentViewers] = useState(1);
  const [roomParticipants, setRoomParticipants] = useState<{ peerId: string; role: string; displayName: string }[]>([]);

  // Reminders
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());

  // Report Modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Contenido inapropiado o spam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  // Guest Join Modal
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState(user?.displayName || subscriber?.fullName || '');
  const [guestStatusMsg, setGuestStatusMsg] = useState<string | null>(null);

  // Feedback toast
  const [toast, setToast] = useState<string | null>(null);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const currentUserName =
    (isAdmin ? 'Julian Camilo Trujillo Gordillo' : null) ||
    collaborator?.fullName ||
    subscriber?.fullName ||
    user?.displayName ||
    'Lector DULIMA';

  const currentUserEmail =
    (isAdmin ? ownerEmail : null) ||
    collaborator?.email ||
    subscriber?.email ||
    user?.email ||
    '';

  const currentUserRole: 'owner' | 'collaborator' | 'subscriber' | 'public' = isAdmin
    ? 'owner'
    : collaborator?.status === 'activo'
    ? 'collaborator'
    : subscriber?.status === 'activa'
    ? 'subscriber'
    : 'public';

  const hostPermission = useMemo(
    () => canUserHostLive(isAdmin, collaborator, subscriber),
    [isAdmin, collaborator, subscriber]
  );

  useEffect(() => {
    loadAllLiveStreams();
    if (currentUserEmail) {
      getLiveReminders(currentUserEmail).then((rems) => {
        setRemindedIds(new Set(rems.map((r) => r.streamId)));
      });
    }
  }, [currentUserEmail]);

  const loadAllLiveStreams = async () => {
    setLoading(true);
    try {
      const list = await getLiveStreams(isAdmin);
      setStreams(list);

      if (initialStreamId) {
        const found = list.find((s) => s.id === initialStreamId);
        if (found) setSelectedStream(found);
      } else if (!selectedStream) {
        const active = list.find((s) => s.status === 'en_directo') || list[0] || null;
        if (active) setSelectedStream(active);
      }
    } finally {
      setLoading(false);
    }
  };

  // Connect to WebSocket & load chat/polls when selectedStream changes
  useEffect(() => {
    if (!selectedStream) return;

    setConcurrentViewers(selectedStream.concurrentViewers || 1);
    getLiveChatMessages(selectedStream.id).then(setChatMessages);
    getLivePolls(selectedStream.id).then(setPolls);

    // Increment totalViews once
    updateLiveStream(selectedStream.id, {
      totalViews: (selectedStream.totalViews || 0) + 1
    }).catch(() => {});

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'room:join',
          streamId: selectedStream.id,
          peerId: `viewer_${Date.now()}`,
          role: currentUserEmail && currentUserEmail === selectedStream.hostEmail ? 'host' : 'viewer',
          displayName: currentUserName
        })
      );
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'room:presence') {
          setConcurrentViewers(msg.concurrentViewers || 1);
          setRoomParticipants(msg.participants || []);
        } else if (msg.type === 'chat:message' && msg.message) {
          setChatMessages((prev) =>
            prev.some((m) => m.id === msg.message.id) ? prev : [...prev, msg.message]
          );
        } else if (msg.type === 'chat:moderate') {
          if (msg.action === 'delete') {
            setChatMessages((prev) => prev.filter((m) => m.id !== msg.msgId));
          } else if (msg.action === 'toggle_chat') {
            setSelectedStream((prev) => (prev ? { ...prev, chatClosed: msg.chatClosed } : null));
          } else if (msg.action === 'toggle_qa') {
            setSelectedStream((prev) => (prev ? { ...prev, qaMode: msg.qaMode } : null));
          } else if (msg.action === 'pin_question') {
            setSelectedStream((prev) => (prev ? { ...prev, pinnedQuestionId: msg.msgId } : null));
          } else if (msg.action === 'highlight_comment') {
            setSelectedStream((prev) => (prev ? { ...prev, highlightedCommentId: msg.msgId } : null));
          }
        } else if (msg.type === 'reaction:add' && msg.reactionKey) {
          setSelectedStream((prev) => {
            if (!prev) return null;
            const key = msg.reactionKey as keyof LiveStream['reactions'];
            return {
              ...prev,
              reactions: {
                ...prev.reactions,
                [key]: (prev.reactions?.[key] || 0) + 1
              }
            };
          });
        } else if (msg.type === 'poll:update' && msg.poll) {
          setPolls((prev) => {
            const exists = prev.some((p) => p.id === msg.poll.id);
            return exists ? prev.map((p) => (p.id === msg.poll.id ? msg.poll : p)) : [msg.poll, ...prev];
          });
        } else if (msg.type === 'stream:status' && msg.status) {
          setSelectedStream((prev) => (prev ? { ...prev, status: msg.status } : null));
        }
      } catch {}
    };

    return () => {
      ws.close();
    };
  }, [selectedStream?.id]);

  const isHostOrModerator = useMemo(() => {
    if (!selectedStream) return false;
    if (isAdmin) return true;
    if (currentUserEmail && selectedStream.hostEmail?.toLowerCase() === currentUserEmail.toLowerCase()) {
      return true;
    }
    if (
      currentUserEmail &&
      selectedStream.moderatorEmails?.some((e) => e.toLowerCase() === currentUserEmail.toLowerCase())
    ) {
      return true;
    }
    return false;
  }, [selectedStream, isAdmin, currentUserEmail]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream || !chatInput.trim()) return;

    if (selectedStream.chatClosed && !isHostOrModerator) {
      setToast('El chat está cerrado temporalmente por el presentador.');
      return;
    }
    if (
      selectedStream.mutedEmailsOrNames?.includes(currentUserEmail || currentUserName) ||
      selectedStream.blockedEmailsOrNames?.includes(currentUserEmail || currentUserName)
    ) {
      setToast('No puedes enviar mensajes en esta transmisión.');
      return;
    }

    const msg = await sendLiveChatMessage({
      streamId: selectedStream.id,
      senderName: currentUserName,
      senderEmail: currentUserEmail || undefined,
      senderRole: currentUserRole,
      content: chatInput.trim(),
      isQuestion: isQuestionInput || selectedStream.qaMode
    });

    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');
    wsRef.current?.send(JSON.stringify({ type: 'chat:message', message: msg }));
  };

  const handleReaction = async (key: keyof LiveStream['reactions']) => {
    if (!selectedStream) return;
    const nextReactions = {
      ...selectedStream.reactions,
      [key]: (selectedStream.reactions?.[key] || 0) + 1
    };
    setSelectedStream({ ...selectedStream, reactions: nextReactions });
    wsRef.current?.send(JSON.stringify({ type: 'reaction:add', reactionKey: key }));
    await updateLiveStream(selectedStream.id, { reactions: nextReactions });
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream || !newPollQuestion.trim()) return;
    const opts = newPollOptions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (opts.length < 2) return;

    const poll = await createLivePoll(selectedStream.id, newPollQuestion.trim(), opts);
    setPolls((prev) => [poll, ...prev]);
    setNewPollQuestion('');
    wsRef.current?.send(JSON.stringify({ type: 'poll:update', poll }));
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (!selectedStream || votedPollIds[pollId]) return;
    const updated = await voteLivePoll(selectedStream.id, pollId, optionId);
    if (updated) {
      setVotedPollIds((prev) => ({ ...prev, [pollId]: optionId }));
      setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
      wsRef.current?.send(JSON.stringify({ type: 'poll:update', poll: updated }));
    }
  };

  const handleModerateAction = async (
    action: 'delete' | 'mute' | 'block' | 'pin_question' | 'highlight_comment' | 'toggle_chat' | 'toggle_qa',
    targetMsg?: LiveChatMessage
  ) => {
    if (!selectedStream || !isHostOrModerator) return;

    if (action === 'delete' && targetMsg) {
      await deleteLiveChatMessage(selectedStream.id, targetMsg.id);
      setChatMessages((prev) => prev.filter((m) => m.id !== targetMsg.id));
      wsRef.current?.send(JSON.stringify({ type: 'chat:moderate', action: 'delete', msgId: targetMsg.id }));
    } else if (action === 'mute' && targetMsg) {
      const targetKey = targetMsg.senderEmail || targetMsg.senderName;
      const nextMuted = [...(selectedStream.mutedEmailsOrNames || []), targetKey];
      await updateLiveStream(selectedStream.id, { mutedEmailsOrNames: nextMuted });
      setSelectedStream({ ...selectedStream, mutedEmailsOrNames: nextMuted });
      setToast(`Usuario ${targetMsg.senderName} silenciado.`);
    } else if (action === 'block' && targetMsg) {
      const targetKey = targetMsg.senderEmail || targetMsg.senderName;
      const nextBlocked = [...(selectedStream.blockedEmailsOrNames || []), targetKey];
      await updateLiveStream(selectedStream.id, { blockedEmailsOrNames: nextBlocked });
      setSelectedStream({ ...selectedStream, blockedEmailsOrNames: nextBlocked });
      setToast(`Usuario ${targetMsg.senderName} bloqueado.`);
    } else if (action === 'pin_question' && targetMsg) {
      await updateLiveStream(selectedStream.id, { pinnedQuestionId: targetMsg.id });
      setSelectedStream({ ...selectedStream, pinnedQuestionId: targetMsg.id });
      wsRef.current?.send(JSON.stringify({ type: 'chat:moderate', action: 'pin_question', msgId: targetMsg.id }));
    } else if (action === 'highlight_comment' && targetMsg) {
      await updateLiveStream(selectedStream.id, { highlightedCommentId: targetMsg.id });
      setSelectedStream({ ...selectedStream, highlightedCommentId: targetMsg.id });
      wsRef.current?.send(JSON.stringify({ type: 'chat:moderate', action: 'highlight_comment', msgId: targetMsg.id }));
    } else if (action === 'toggle_chat') {
      const next = !selectedStream.chatClosed;
      await updateLiveStream(selectedStream.id, { chatClosed: next });
      setSelectedStream({ ...selectedStream, chatClosed: next });
      wsRef.current?.send(JSON.stringify({ type: 'chat:moderate', action: 'toggle_chat', chatClosed: next }));
    } else if (action === 'toggle_qa') {
      const next = !selectedStream.qaMode;
      await updateLiveStream(selectedStream.id, { qaMode: next });
      setSelectedStream({ ...selectedStream, qaMode: next });
      wsRef.current?.send(JSON.stringify({ type: 'chat:moderate', action: 'toggle_qa', qaMode: next }));
    }
  };

  const handleToggleReminder = async (streamId: string) => {
    const emailToUse = currentUserEmail || 'lector@dulima.co';
    const added = await toggleLiveReminder(streamId, emailToUse, currentUserName);
    setRemindedIds((prev) => {
      const next = new Set(prev);
      if (added) next.add(streamId);
      else next.delete(streamId);
      return next;
    });
    setToast(added ? 'Recordatorio activado para este evento LIVE.' : 'Recordatorio desactivado.');
  };

  const handleSubmitGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream || !guestNameInput.trim()) return;
    await submitLiveGuestRequest({
      streamId: selectedStream.id,
      guestName: guestNameInput.trim(),
      guestEmail: currentUserEmail || undefined,
      audioEnabled: true,
      videoEnabled: true
    });
    setGuestStatusMsg('Solicitud enviada al presentador. Espera su aprobación para ingresar a la sala.');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream) return;
    await submitLiveReport({
      streamId: selectedStream.id,
      streamTitle: selectedStream.title,
      reporterName: currentUserName,
      reason: reportReason,
      details: reportDetails.trim()
    });
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSent(false);
      setReportDetails('');
    }, 1500);
  };

  const togglePlayPause = () => {
    if (!videoElRef.current) {
      setIsPlaying((p) => !p);
      return;
    }
    if (videoElRef.current.paused) {
      videoElRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoElRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoElRef.current) {
      videoElRef.current.muted = next;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeStreams = streams.filter((s) => s.status === 'en_directo');
  const upcomingStreams = streams.filter((s) => s.status === 'programado' || s.status === 'proximamente');
  const archivedStreams = streams.filter((s) => s.status === 'finalizado');

  const pinnedQuestion = chatMessages.find((m) => m.id === selectedStream?.pinnedQuestionId);
  const highlightedComment = chatMessages.find((m) => m.id === selectedStream?.highlightedCommentId);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Top LIVE Masthead */}
      <div className="bg-white dark:bg-[#18181c] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#ce1126] text-white text-xs font-black uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5" />
              <span>DULIMA LIVE</span>
            </span>
            {activeStreams.length > 0 && (
              <span className="text-xs font-bold text-[#ce1126] animate-pulse">
                · {activeStreams.length} {activeStreams.length === 1 ? 'transmisión en directo' : 'transmisiones en directo'}
              </span>
            )}
          </div>
          <h1 className="font-serif font-black text-3xl sm:text-4xl text-[#121212] dark:text-white">
            Transmisiones en Directo y Estudio LIVE
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
            Debates ciudadanos, entrevistas, análisis político en tiempo real y eventos especiales de DULIMA con
            participación interactiva.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {hostPermission.allowed ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStudioExpanded((prev) => !prev);
                  document.getElementById('estudio-live-dulima')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#ce1126] hover:bg-rose-700 text-white text-sm font-black shadow-md transition-colors cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>{studioExpanded ? 'Estudio LIVE Activo' : 'Abrir Estudio LIVE'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold border border-stone-700 transition-colors cursor-pointer"
                title="Abrir Estudio LIVE en ventana completa"
              >
                <Maximize className="w-4 h-4" />
                <span className="hidden sm:inline">Pantalla completa</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 max-w-xs">
              <strong className="text-[#121212] dark:text-white block mb-0.5">¿Quieres transmitir en LIVE?</strong>
              <span>{hostPermission.reason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Estudio LIVE de DULIMA directly in the LIVE section */}
      {hostPermission.allowed && studioExpanded && (
        <section id="estudio-live-dulima" className="scroll-mt-24">
          <LiveStudioModal
            embedded={true}
            isOpen={true}
            onClose={() => setStudioExpanded(false)}
            hostName={currentUserName}
            hostEmail={currentUserEmail}
            hostRole={hostPermission.hostRole || 'subscriber'}
            hostPhotoUrl={user?.photoURL || undefined}
            hostPoliticalIdentity={collaborator?.politicalIdentity || subscriber?.politicalIdentity}
            categories={categories}
            collaboratorStatus={collaborator?.status}
            collaboratorPermissions={collaborator?.permissions}
            subscriberStatus={subscriber?.status}
            subscriberPeriod={subscriber?.period}
            subscriberEndDate={subscriber?.endDate}
            onStreamCreatedOrUpdated={(s) => {
              setStreams((prev) => {
                const exists = prev.some((x) => x.id === s.id);
                return exists ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev];
              });
              setSelectedStream(s);
            }}
          />
        </section>
      )}

      {toast && (
        <div className="p-3.5 rounded-2xl bg-stone-900 text-white text-xs font-semibold flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-stone-400 hover:text-white cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Main Active / Selected Stream Stage + Real-Time Interactive Chat */}
      {selectedStream && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Video Player Column */}
          <div className={theaterMode ? 'lg:col-span-12 space-y-4' : 'lg:col-span-8 space-y-4'}>
            <div
              ref={playerContainerRef}
              className="bg-black rounded-3xl overflow-hidden border border-stone-800 shadow-2xl relative group"
            >
              <div
                className={`relative w-full bg-stone-950 flex items-center justify-center ${
                  selectedStream.orientation === 'vertical' ? 'max-h-[75vh] aspect-[9/16] mx-auto' : 'aspect-video'
                }`}
              >
                {selectedStream.recordingUrl ? (
                  <video
                    ref={videoElRef}
                    src={selectedStream.recordingUrl}
                    poster={selectedStream.coverImageUrl}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-contain"
                  />
                ) : selectedStream.coverImageUrl ? (
                  <img
                    src={selectedStream.coverImageUrl}
                    alt={selectedStream.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-[#ce1126]/20 border border-[#ce1126] text-[#ce1126] flex items-center justify-center mx-auto">
                      <Radio className="w-8 h-8" />
                    </div>
                    <p className="font-serif font-bold text-xl text-white">{selectedStream.title}</p>
                    <p className="text-xs text-stone-400 max-w-md mx-auto">
                      {selectedStream.status === 'en_directo'
                        ? 'Señal en directo activa en la sala de DULIMA LIVE.'
                        : selectedStream.status === 'programado'
                        ? 'Evento programado. Activa el recordatorio para recibir aviso al iniciar.'
                        : 'Transmisión finalizada.'}
                    </p>
                  </div>
                )}

                {/* Top Overlay: Red LIVE Badge + Concurrent Viewers */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    {selectedStream.status === 'en_directo' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ce1126] text-white text-xs font-black uppercase tracking-wider shadow-md">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>LIVE</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-xs font-bold">
                      <Eye className="w-3.5 h-3.5 text-gold-400" />
                      <span>{concurrentViewers} espectadores</span>
                    </span>
                  </div>

                  {selectedStream.recordingAuthorized && selectedStream.status === 'en_directo' && (
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 text-rose-300 text-[11px] font-bold">
                      Grabación autorizada
                    </span>
                  )}
                </div>

                {/* Highlighted Comment or Pinned Question Banner */}
                {(pinnedQuestion || highlightedComment) && (
                  <div className="absolute bottom-16 left-4 right-4 bg-black/80 backdrop-blur-md border border-gold-500/50 rounded-2xl p-3 text-white text-xs space-y-1">
                    {pinnedQuestion && (
                      <div className="flex items-center gap-2">
                        <Pin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span className="font-bold text-gold-300">Pregunta fijada ({pinnedQuestion.senderName}):</span>
                        <span>{pinnedQuestion.content}</span>
                      </div>
                    )}
                    {highlightedComment && (
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="font-bold text-sky-300">Destacado ({highlightedComment.senderName}):</span>
                        <span>{highlightedComment.content}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Captions Overlay */}
                {captionsEnabled && (
                  <div className="absolute bottom-16 inset-x-0 text-center pointer-events-none px-4">
                    <span className="inline-block bg-black/85 text-white text-xs px-3 py-1.5 rounded-lg">
                      [Subtítulos en directo activados — {selectedStream.title}]
                    </span>
                  </div>
                )}

                {/* Bottom Custom Player Controls */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                      aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      <span className="hidden sm:inline">{isMuted ? 'Activar sonido' : `${volume}%`}</span>
                    </button>

                    {!isMuted && (
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={volume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setVolume(v);
                          if (videoElRef.current) videoElRef.current.volume = v / 100;
                        }}
                        className="w-20 accent-[#ce1126] hidden sm:block"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={playerQuality}
                      onChange={(e) => setPlayerQuality(e.target.value as LiveQuality)}
                      className="px-2 py-1 rounded-lg bg-black/70 border border-stone-700 text-[11px] text-white"
                      aria-label="Calidad de reproducción"
                    >
                      <option value="auto">Auto</option>
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                      <option value="360p">360p</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setCaptionsEnabled((c) => !c)}
                      className={`p-2 rounded-xl cursor-pointer ${
                        captionsEnabled ? 'bg-gold-500 text-stone-950' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      title="Subtítulos"
                    >
                      <Subtitles className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheaterMode((t) => !t)}
                      className={`p-2 rounded-xl cursor-pointer hidden md:inline-flex ${
                        theaterMode ? 'bg-gold-500 text-stone-950' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      title="Modo de teatro"
                    >
                      <Tv className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      title="Pantalla completa"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Info, Presenter Profile, Reactions & Actions */}
            <div className="bg-white dark:bg-[#18181c] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <span>{selectedStream.categoryName || 'Actualidad'}</span>
                    <span>·</span>
                    <span>{selectedStream.totalViews || 1} visualizaciones</span>
                    {selectedStream.durationSec ? (
                      <>
                        <span>·</span>
                        <span>{Math.max(1, Math.round(selectedStream.durationSec / 60))} min</span>
                      </>
                    ) : null}
                  </div>

                  <h2 className="font-serif font-black text-2xl text-[#121212] dark:text-white">
                    {selectedStream.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                      {selectedStream.hostName}
                    </span>
                    {isOwnerAuthor(selectedStream.hostEmail, selectedStream.hostRole, selectedStream.hostName) && (
                      <OwnerVerifiedBadge size="sm" />
                    )}
                    <PoliticalIdentityBadges identity={selectedStream.hostPoliticalIdentity} size="sm" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {(selectedStream.format === 'interview' || selectedStream.format === 'multi_guest') &&
                    selectedStream.status === 'en_directo' && (
                      <button
                        type="button"
                        onClick={() => setGuestModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Solicitar unirse</span>
                      </button>
                    )}

                  {selectedStream.status === 'programado' && (
                    <button
                      type="button"
                      onClick={() => handleToggleReminder(selectedStream.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        remindedIds.has(selectedStream.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      {remindedIds.has(selectedStream.id) ? (
                        <BellOff className="w-3.5 h-3.5" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {remindedIds.has(selectedStream.id) ? 'Recordatorio activo' : 'Activar recordatorio'}
                      </span>
                    </button>
                  )}

                  {selectedStream.recordingUrl && selectedStream.allowDownload && (
                    <a
                      href={selectedStream.recordingUrl}
                      download={`${selectedStream.title.slice(0, 30)}.webm`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setToast('Enlace de la transmisión copiado al portapapeles.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Reportar contenido"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {selectedStream.description}
              </p>

              {/* Live Reactions Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-500 mr-1">Reacciones en directo:</span>
                {[
                  { key: 'like' as const, label: 'Me gusta', icon: ThumbsUp, color: 'text-sky-600' },
                  { key: 'applause' as const, label: 'Aplausos', icon: Sparkles, color: 'text-amber-500' },
                  { key: 'fire' as const, label: 'Destacado', icon: Flame, color: 'text-orange-500' },
                  { key: 'support' as const, label: 'Apoyo', icon: Heart, color: 'text-rose-600' },
                  { key: 'insightful' as const, label: 'Análisis', icon: Sparkle, color: 'text-purple-600' }
                ].map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => handleReaction(r.key)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 text-xs font-bold cursor-pointer transition-transform active:scale-95"
                    >
                      <Icon className={`w-3.5 h-3.5 ${r.color}`} />
                      <span>{r.label}</span>
                      <span className="text-stone-500">{selectedStream.reactions?.[r.key] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-Time Chat, Q&A, Polls & Viewers Column */}
          <div className="lg:col-span-4 bg-white dark:bg-[#18181c] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col h-[580px]">
            {/* Tabs */}
            <div className="grid grid-cols-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
              {[
                { id: 'chat', label: 'Chat', icon: MessageSquare },
                { id: 'qa', label: 'Preguntas', icon: HelpCircle },
                { id: 'polls', label: 'Encuestas', icon: BarChart2 },
                { id: 'viewers', label: `Sala (${concurrentViewers})`, icon: Users }
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSideTab(t.id as any)}
                    className={`py-3 px-2 flex flex-col items-center gap-1 text-[11px] font-bold border-b-2 transition-colors cursor-pointer ${
                      sideTab === t.id
                        ? 'border-[#ce1126] text-[#ce1126] dark:text-gold-400 bg-white dark:bg-[#18181c]'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Host Moderation Quick Bar */}
            {isHostOrModerator && (
              <div className="px-3 py-2 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleModerateAction('toggle_chat')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    selectedStream.chatClosed ? 'bg-rose-600 text-white' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  {selectedStream.chatClosed ? 'Reabrir chat' : 'Cerrar chat'}
                </button>
                <button
                  type="button"
                  onClick={() => handleModerateAction('toggle_qa')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    selectedStream.qaMode ? 'bg-gold-500 text-stone-950' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  {selectedStream.qaMode ? 'Modo preguntas activo' : 'Activar modo preguntas'}
                </button>
              </div>
            )}

            {/* TAB: CHAT & Q&A */}
            {(sideTab === 'chat' || sideTab === 'qa') && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages
                    .filter((m) => (sideTab === 'qa' ? m.isQuestion : true))
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 ${
                          msg.id === selectedStream.highlightedCommentId
                            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800'
                            : 'bg-stone-50 dark:bg-stone-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#121212] dark:text-white">{msg.senderName}</span>
                            {msg.senderRole === 'owner' && (
                              <span className="text-[10px] font-black text-[#ce1126] uppercase">Propietario</span>
                            )}
                            {msg.isQuestion && (
                              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">· Pregunta</span>
                            )}
                          </div>

                          {isHostOrModerator && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleModerateAction('highlight_comment', msg)}
                                title="Destacar comentario"
                                className="p-1 text-stone-400 hover:text-amber-500 cursor-pointer"
                              >
                                <Star className="w-3 h-3" />
                              </button>
                              {msg.isQuestion && (
                                <button
                                  type="button"
                                  onClick={() => handleModerateAction('pin_question', msg)}
                                  title="Fijar pregunta"
                                  className="p-1 text-stone-400 hover:text-sky-500 cursor-pointer"
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleModerateAction('mute', msg)}
                                title="Silenciar usuario"
                                className="p-1 text-stone-400 hover:text-amber-600 cursor-pointer"
                              >
                                <Volume1 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModerateAction('block', msg)}
                                title="Bloquear usuario"
                                className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModerateAction('delete', msg)}
                                title="Eliminar comentario"
                                className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 leading-snug">{msg.content}</p>
                      </div>
                    ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isQuestionInput || Boolean(selectedStream.qaMode)}
                        onChange={(e) => setIsQuestionInput(e.target.checked)}
                        className="accent-[#ce1126]"
                      />
                      <span>Enviar como pregunta al presentador</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={Boolean(selectedStream.chatClosed && !isHostOrModerator)}
                      placeholder={
                        selectedStream.chatClosed ? 'Chat cerrado temporalmente' : 'Escribe un mensaje en directo...'
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs"
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-[#ce1126] text-white hover:bg-rose-700 cursor-pointer"
                      aria-label="Enviar mensaje"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* TAB: LIVE POLLS */}
            {sideTab === 'polls' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isHostOrModerator && (
                  <form onSubmit={handleCreatePoll} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="text-xs font-bold text-[#121212] dark:text-white">Crear encuesta en directo</div>
                    <input
                      type="text"
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      placeholder="Pregunta de la encuesta..."
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-xs"
                    />
                    <textarea
                      rows={2}
                      value={newPollOptions}
                      onChange={(e) => setNewPollOptions(e.target.value)}
                      placeholder="Una opción por línea..."
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121214] text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-[#ce1126] text-white text-xs font-bold cursor-pointer"
                    >
                      Lanzar encuesta en vivo
                    </button>
                  </form>
                )}

                {polls.length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-8">No hay encuestas activas en esta transmisión.</p>
                ) : (
                  polls.map((poll) => {
                    const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes || 0), 0);
                    const userChoice = votedPollIds[poll.id];
                    return (
                      <div key={poll.id} className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                        <div className="font-serif font-bold text-sm text-[#121212] dark:text-white">
                          {poll.question}
                        </div>
                        <div className="space-y-1.5">
                          {poll.options.map((opt) => {
                            const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={Boolean(userChoice)}
                                onClick={() => handleVotePoll(poll.id, opt.id)}
                                className="w-full text-left p-2 rounded-lg border border-stone-200 dark:border-stone-700 relative overflow-hidden text-xs cursor-pointer"
                              >
                                <div
                                  className="absolute inset-y-0 left-0 bg-[#ce1126]/15 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative flex items-center justify-between font-semibold">
                                  <span>{opt.text}</span>
                                  <span>{pct}% ({opt.votes || 0})</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[11px] text-stone-500">{totalVotes} votos en tiempo real</div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: VIEWERS LIST */}
            {sideTab === 'viewers' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Espectadores conectados ({concurrentViewers})
                </div>
                {roomParticipants.length === 0 ? (
                  <p className="text-xs text-stone-500">Conectado a la sala en tiempo real.</p>
                ) : (
                  roomParticipants.map((p) => (
                    <div key={p.peerId} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-900 text-xs">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{p.displayName}</span>
                      <span className="text-[10px] uppercase font-bold text-stone-500">{p.role}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Scheduled Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-2xl text-[#121212] dark:text-white">
            Próximos Eventos Programados
          </h2>
        </div>

        {upcomingStreams.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-center text-sm text-stone-500">
            No hay eventos LIVE programados en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {upcomingStreams.map((ev) => (
              <div
                key={ev.id}
                className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {ev.coverImageUrl && (
                    <img src={ev.coverImageUrl} alt={ev.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#ce1126] font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{ev.scheduledAt ? new Date(ev.scheduledAt).toLocaleString('es-CO') : 'Próximamente'}</span>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">{ev.title}</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">{ev.description}</p>
                    <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
                      <span>{ev.hostName}</span>
                      <PoliticalIdentityBadges identity={ev.hostPoliticalIdentity} size="xs" />
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleReminder(ev.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                      remindedIds.has(ev.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {remindedIds.has(ev.id) ? 'Recordatorio activo' : 'Activar recordatorio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStream(ev)}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold cursor-pointer"
                  >
                    Ver sala
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Archive of Authorized Recordings */}
      <section className="space-y-4">
        <h2 className="font-serif font-bold text-2xl text-[#121212] dark:text-white">
          Archivo de Transmisiones Anteriores
        </h2>

        {archivedStreams.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-center text-sm text-stone-500">
            Aún no hay grabaciones publicadas en el archivo de DULIMA LIVE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {archivedStreams.map((arch) => (
              <div
                key={arch.id}
                onClick={() => setSelectedStream(arch)}
                className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden cursor-pointer hover:border-[#ce1126] transition-colors"
              >
                <div className="aspect-video bg-stone-900 relative flex items-center justify-center">
                  {arch.coverImageUrl ? (
                    <img src={arch.coverImageUrl} alt={arch.title} className="w-full h-full object-cover" />
                  ) : (
                    <Film className="w-8 h-8 text-stone-500" />
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                    {arch.durationSec ? `${Math.max(1, Math.round(arch.durationSec / 60))} min` : 'VOD'}
                  </span>
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-serif font-bold text-base text-[#121212] dark:text-white line-clamp-1">
                    {arch.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <span>{arch.hostName}</span>
                    <PoliticalIdentityBadges identity={arch.hostPoliticalIdentity} size="xs" />
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {new Date(arch.createdAt).toLocaleDateString('es-CO')} · {arch.totalViews || 0} visualizaciones
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Studio Modal */}
      {studioOpen && (
        <LiveStudioModal
          isOpen={studioOpen}
          onClose={() => setStudioOpen(false)}
          hostName={currentUserName}
          hostEmail={currentUserEmail}
          hostRole={hostPermission.hostRole || 'subscriber'}
          hostPhotoUrl={user?.photoURL || undefined}
          hostPoliticalIdentity={collaborator?.politicalIdentity || subscriber?.politicalIdentity}
          categories={categories}
          collaboratorStatus={collaborator?.status}
          collaboratorPermissions={collaborator?.permissions}
          subscriberStatus={subscriber?.status}
          subscriberPeriod={subscriber?.period}
          subscriberEndDate={subscriber?.endDate}
          onStreamCreatedOrUpdated={(s) => {
            setStreams((prev) => {
              const exists = prev.some((x) => x.id === s.id);
              return exists ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev];
            });
            setSelectedStream(s);
          }}
        />
      )}

      {/* Guest Join Modal */}
      {guestModalOpen && selectedStream && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitGuestJoin}
            className="bg-white dark:bg-[#18181c] rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800"
          >
            <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
              Solicitar ingreso como invitado
            </h3>
            <p className="text-xs text-stone-500">
              El presentador recibirá tu solicitud para admitirte en la transmisión.
            </p>
            <input
              type="text"
              required
              value={guestNameInput}
              onChange={(e) => setGuestNameInput(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
            />
            {guestStatusMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{guestStatusMsg}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setGuestModalOpen(false);
                  setGuestStatusMsg(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#ce1126] text-white text-xs font-bold cursor-pointer"
              >
                Enviar solicitud
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && selectedStream && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReport}
            className="bg-white dark:bg-[#18181c] rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800"
          >
            <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
              Reportar transmisión
            </h3>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs"
            >
              <option value="Contenido inapropiado o spam">Contenido inapropiado o spam</option>
              <option value="Acoso o discurso de odio">Acoso o discurso de odio</option>
              <option value="Suplantación de identidad">Suplantación de identidad</option>
              <option value="Desinformación grave">Desinformación grave</option>
            </select>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Detalles adicionales (opcional)..."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs"
            />
            {reportSent && (
              <p className="text-xs text-emerald-600 font-semibold">Reporte enviado al equipo de moderación.</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Enviar reporte
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
