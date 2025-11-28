import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CourtRole, Participant, User, UserRole } from '../types';
import { roomSignaling, SignalingEvent } from '../services/roomSignaling';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, Users, Shield, 
  Gavel, UserPlus,
  Pin, LogOut, Hand, X,
  Edit3, Check, Info, Copy, CheckCircle,
  Play, Square, AlertOctagon,
  User as UserIcon,
  Share2
} from 'lucide-react';

interface MultiplayerRoomProps {
  onExit: () => void;
  currentUserRole: CourtRole;
  roomId?: string;
  user: User;
  isHost?: boolean;
}

// Separate component to prevent re-renders of the video element
// Added playsInline for iOS support
const RemoteVideo = React.memo(({ stream, isVideoOff, name, isLocal = false }: { stream?: MediaStream, isVideoOff: boolean, name?: string, isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
     if (videoRef.current && stream) {
         videoRef.current.srcObject = stream;
         // iOS requires explicit play() after srcObject assignment
         videoRef.current.play().catch(e => {
             console.warn("Auto-play prevented", e);
             // If auto-play blocked, try muting
             if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(console.error);
             }
         });
     } else if (videoRef.current) {
         videoRef.current.srcObject = null;
     }
  }, [stream, stream?.id]); 

  if (!stream || isVideoOff) {
      return (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <div className="flex flex-col items-center opacity-50">
                <UserIcon size={40} className="text-slate-400 mb-2"/>
                {name && <span className="text-xs text-slate-500 font-mono">Vídeo Desligado</span>}
            </div>
        </div>
      );
  }

  // playsInline is crucial for iOS Safari to play video inline instead of fullscreen
  return <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover"/>;
});

const ParticipantCard = ({ 
  participant, 
  isLocal, 
  stream, 
  onPin, 
  onKick, 
  isPinned, 
  hasJudgePower 
}: { 
  participant: Participant, 
  isLocal: boolean, 
  stream?: MediaStream, 
  onPin: (id: string) => void, 
  onKick: (id: string) => void, 
  isPinned: boolean, 
  hasJudgePower: boolean 
}) => {
  return (
    <div className={`relative bg-slate-900 rounded-xl overflow-hidden border transition-all duration-300 group
      ${participant.isHandRaised ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-slate-800'}
      ${isPinned ? 'z-10' : 'z-0'}
    `}>
      <RemoteVideo stream={stream} isVideoOff={participant.isVideoOff} name={participant.name} isLocal={isLocal} />
      
      {/* Overlays */}
      {isLocal && participant.isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">EU</div>
        </div>
      )}

      {/* Controls Overlay (Judge) */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition z-20 pointer-events-none">
         <div className="pointer-events-auto flex gap-2">
            {hasJudgePower && !isLocal && (
              <button onClick={() => onKick(participant.id)} className="p-2 bg-red-600 rounded-full hover:bg-red-500 text-white shadow-lg transform hover:scale-110 transition" title="Remover da Sala">
                <LogOut size={18}/>
              </button>
            )}
            <button onClick={() => onPin(participant.id)} className={`p-2 rounded-full shadow-lg transform hover:scale-110 transition ${isPinned ? 'bg-amber-500 text-white' : 'bg-white text-slate-900'}`} title={isPinned ? "Desfixar" : "Fixar em Destaque"}>
              <Pin size={18}/>
            </button>
         </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 flex justify-between items-end">
          <div className="flex flex-col gap-0.5 max-w-[80%]">
             <span className="text-white text-xs font-bold truncate flex items-center gap-1">
               {participant.name}
               {participant.isHandRaised && <Hand size={14} className="text-amber-500 animate-bounce"/>}
             </span>
             <span className="text-[10px] text-slate-400 truncate">{participant.role}</span>
          </div>
          <div className="flex items-center gap-2">
            {participant.isMuted ? (
              <div className="bg-red-500/20 p-1 rounded"><MicOff size={14} className="text-red-500"/></div>
            ) : (
              <div className="h-4 w-1.5 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end">
                <div style={{height: `${Math.min(participant.audioLevel || 0, 100)}%`}} className="w-full bg-green-500 transition-all duration-75"/>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({ onExit, currentUserRole, roomId = 'abc-def-ghi', user, isHost = false }) => {
  const hasJudgePower = currentUserRole === CourtRole.JUDGE || user.role === UserRole.ADMIN;

  const [localUser] = useState<Participant>(() => ({
    id: `user-${Date.now()}`, 
    name: `${user.name}`,
    role: currentUserRole,
    isMuted: false,
    isVideoOff: false,
    status: currentUserRole === CourtRole.WITNESS ? 'waiting' : 'active',
    audioLevel: 0
  }));

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  
  // Room Info
  const [caseTitle, setCaseTitle] = useState("001/2024 - Ação Cível");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempTitle, setTempTitle] = useState(caseTitle);
  const [showMeetingInfo, setShowMeetingInfo] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isJudgeDrawerOpen, setIsJudgeDrawerOpen] = useState(false);
  
  const [hearingStatus, setHearingStatus] = useState<'waiting' | 'running' | 'ended'>('waiting');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<string>('00:00');
  const timerIntervalRef = useRef<number | null>(null);

  const [isInWaitingRoom, setIsInWaitingRoom] = useState(currentUserRole === CourtRole.WITNESS);
  const waitingRoomVideoRef = useRef<HTMLVideoElement>(null);

  // Refs for cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const broadcastIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (waitingRoomVideoRef.current && localStream) {
      waitingRoomVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isInWaitingRoom]);

  const stopLocalMedia = () => {
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
    }
  };

  const handleExit = () => {
      stopLocalMedia();
      roomSignaling.disconnect();
      onExit();
  };

  // --- MEDIA INITIALIZATION ---
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        // Safe check for mediaDevices (may be undefined in non-secure context)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Media devices not supported");
        }

        const constraints = { 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } }, 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // Connect Signaling
        roomSignaling.connect(roomId, { ...localUser, isMuted: false, isVideoOff: false }, isHost, stream);

        // Audio Visualizer setup
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const analyser = audioContext.createAnalyser();
          if (stream.getAudioTracks().length > 0) {
             const source = audioContext.createMediaStreamSource(stream);
             source.connect(analyser);
          }
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.5;
          audioContextRef.current = audioContext;
          
          const updateAudioLevel = () => {
            if (!analyser || !audioContext) return;
            if (audioContext.state === 'suspended') audioContext.resume().catch(() => {}); 
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const level = Math.min(100, Math.max(0, (dataArray.reduce((a,b)=>a+b,0) / dataArray.length) * 3)); 
            setLocalAudioLevel(level);
            if (mounted) animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (err: any) {
        console.error("Media Error:", err);
        // Fallback connection without media
        roomSignaling.connect(roomId, { ...localUser, isMuted: true, isVideoOff: true }, isHost, null);
      }
    };
    startCamera();
    return () => { mounted = false; stopLocalMedia(); roomSignaling.disconnect(); };
  }, []); 

  // --- SIGNALING LISTENERS ---
  useEffect(() => {
    const unsubscribe = roomSignaling.subscribe((event: SignalingEvent) => {
      if (event.type === 'UPDATE' && event.payload.id === roomSignaling.getPeerId()) {
          if (event.payload.status === 'active') {
              setIsInWaitingRoom(false);
              setTimeout(() => roomSignaling.sendUpdate({ ...localUser, status: 'active' }), 500);
          }
      }
      if (event.type === 'HEARING_STATUS') {
         setHearingStatus(event.payload.status);
         if (event.payload.status === 'running') setSessionStartTime(event.payload.startTime || Date.now());
         if (event.payload.status === 'ended' && timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
      if (event.type === 'MUTE_FORCE') {
        if (!event.payload.targetId || event.payload.targetId === localUser.id) {
           if (!isMuted) {
             setIsMuted(true);
             if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
             setTimeout(() => roomSignaling.sendUpdate({ ...localUser, isMuted: true, isVideoOff, isHandRaised }), 100);
           }
        }
      }
      setParticipants(prev => {
        let updated = [...prev];
        if (event.type === 'JOIN' || event.type === 'SYNC_USERS') {
            const incoming = event.type === 'JOIN' ? [event.payload] : event.payload;
            incoming.forEach(newP => {
                if (!updated.find(p => p.id === newP.id) && newP.id !== roomSignaling.getPeerId()) updated.push(newP);
            });
        } 
        else if (event.type === 'UPDATE') {
           const idx = updated.findIndex(p => p.id === event.payload.id);
           if (idx !== -1) updated[idx] = { ...updated[idx], ...event.payload, stream: event.payload.stream || updated[idx].stream };
           else if (event.payload.name && event.payload.id !== roomSignaling.getPeerId()) updated.push(event.payload as Participant);
        }
        else if (event.type === 'AUDIO_LEVEL') {
           updated = updated.map(p => p.id === event.payload.id ? { ...p, audioLevel: event.payload.level } : p);
        }
        else if (event.type === 'LEAVE') {
           if (event.payload.id === roomSignaling.getPeerId()) { handleExit(); return prev; }
           updated = updated.filter(p => p.id !== event.payload.id);
        }
        return updated;
      });
    });

    broadcastIntervalRef.current = window.setInterval(() => {
      if (!isMuted && !isInWaitingRoom) roomSignaling.sendAudioLevel(localUser.id, localAudioLevel);
    }, 200);

    return () => { unsubscribe(); if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current); };
  }, [localUser, isMuted, localAudioLevel, isInWaitingRoom]);

  // Timer
  useEffect(() => {
      if (hearingStatus === 'running' && sessionStartTime) {
          timerIntervalRef.current = window.setInterval(() => {
              const diff = Date.now() - sessionStartTime;
              setSessionDuration(`${Math.floor(diff/60000).toString().padStart(2,'0')}:${Math.floor((diff%60000)/1000).toString().padStart(2,'0')}`);
          }, 1000);
      }
      return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [hearingStatus, sessionStartTime]);

  // Local Controls
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMuted(!isMuted);
      roomSignaling.sendUpdate({ ...localUser, isMuted: !isMuted, isVideoOff, isHandRaised, status: isInWaitingRoom ? 'waiting' : 'active' });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoOff(!isVideoOff);
      roomSignaling.sendUpdate({ ...localUser, isMuted, isVideoOff: !isVideoOff, isHandRaised, status: isInWaitingRoom ? 'waiting' : 'active' });
    }
  };

  const toggleHand = () => {
     setIsHandRaised(!isHandRaised);
     roomSignaling.sendUpdate({ ...localUser, isMuted, isVideoOff, isHandRaised: !isHandRaised, status: isInWaitingRoom ? 'waiting' : 'active' });
  };

  // --- UNIFIED PARTICIPANT LIST FOR GRID ---
  const allActiveParticipants = useMemo(() => {
    const list: (Participant & { stream?: MediaStream, isLocal: boolean })[] = [];
    
    // 1. Add Local User (if active)
    if (!isInWaitingRoom) {
      list.push({
        ...localUser,
        isMuted,
        isVideoOff,
        isHandRaised,
        audioLevel: localAudioLevel,
        stream: localStream || undefined,
        isLocal: true
      });
    }

    // 2. Add Remote Participants (if active)
    const activeRemotes = participants.filter(p => p.status === 'active');
    return [...list, ...activeRemotes];
  }, [localUser, participants, isInWaitingRoom, isMuted, isVideoOff, isHandRaised, localAudioLevel, localStream]);

  // --- RENDER ---
  if (hearingStatus === 'ended') return <div className="h-full bg-slate-950 flex items-center justify-center text-white"><div className="text-center"><h2 className="text-4xl font-bold">Audiência Encerrada</h2><button onClick={handleExit} className="mt-8 px-8 py-3 bg-white text-slate-900 rounded font-bold">Sair</button></div></div>;

  const waitingParticipants = participants.filter(p => p.status === 'waiting');

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative">
      
      {/* WAITING ROOM OVERLAY */}
      {isInWaitingRoom && (
         <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white px-4">
             <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 text-center max-w-md shadow-2xl w-full">
                 <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Shield size={40} className="text-amber-500" /></div>
                 <h2 className="text-3xl font-serif font-bold mb-2">Sala de Espera</h2>
                 <p className="text-gray-300 mb-6">Olá, <strong>{user.name}</strong>.</p>
                 <div className="bg-black/40 p-4 rounded-lg text-sm text-amber-200 border border-amber-900/50 flex items-center gap-3"><AlertOctagon size={20} className="shrink-0"/><span className="text-left">Aguarde o Juiz autorizar sua entrada.</span></div>
                 <div className="mt-6 w-32 h-24 bg-black rounded-lg overflow-hidden mx-auto border border-slate-600 relative">
                     <video ref={waitingRoomVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]"/>
                     <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-center py-0.5">Sua Câmera</div>
                 </div>
             </div>
         </div>
      )}

      {/* MEETING INFO POPUP */}
      {showMeetingInfo && !isInWaitingRoom && (
        <div className="absolute bottom-24 left-4 z-40 bg-white text-slate-900 p-6 rounded-xl shadow-2xl w-80 animate-in slide-in-from-bottom-5">
           <div className="flex justify-between mb-4"><h3 className="font-bold">Sala: {roomId}</h3><button onClick={() => setShowMeetingInfo(false)}><X size={18} /></button></div>
           <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
              <span className="font-mono text-xs truncate max-w-[180px]">{`${window.location.protocol}//${window.location.host}?room=${roomId}`}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}?room=${roomId}`); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000); }}>{isCopied ? <CheckCircle size={16} className="text-green-600"/> : <Copy size={16}/>}</button>
           </div>
        </div>
      )}

      {/* HEADER */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0 z-20">
         <div className="flex items-center gap-4">
            {hearingStatus === 'running' ? <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase border border-red-900/50 bg-red-950/30 px-2 py-1 rounded"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Gravando • {sessionDuration}</div> : <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase border border-amber-900/50 bg-amber-950/30 px-2 py-1 rounded"><AlertOctagon size={12}/> Aguardando Início</div>}
            {isEditingInfo ? (
               <div className="flex items-center gap-2"><input value={tempTitle} onChange={e=>setTempTitle(e.target.value)} className="bg-slate-800 px-2 py-1 rounded text-sm"/><button onClick={() => {setCaseTitle(tempTitle); setIsEditingInfo(false);}} className="text-green-500"><Check size={16}/></button></div>
            ) : (
               <div className="flex items-center gap-2 group cursor-pointer" onClick={() => hasJudgePower && setIsEditingInfo(true)}><span className="font-semibold text-sm md:text-base">{caseTitle}</span>{hasJudgePower && <Edit3 size={12} className="opacity-0 group-hover:opacity-100"/>}</div>
            )}
         </div>
         <div className="flex items-center gap-4">
            {hasJudgePower && <button onClick={() => setIsJudgeDrawerOpen(!isJudgeDrawerOpen)} className="md:hidden p-2 text-amber-400"><Gavel size={20} /></button>}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs"><Users size={12} /> {allActiveParticipants.length}</div>
         </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-950">
           {allActiveParticipants.length === 0 && !isInWaitingRoom && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"><div className="text-center opacity-30"><Users size={64} className="mx-auto mb-4"/><h2 className="text-2xl font-bold mb-2">A sala está vazia</h2><p>Compartilhe o link.</p></div></div>
           )}

           <div className={`grid gap-4 transition-all h-full content-start
              ${pinnedId ? 'grid-cols-4 grid-rows-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}
           `}>
              {allActiveParticipants.map(p => {
                const isPinned = pinnedId === p.id;
                // If pinned, span mostly, else span 1
                const gridClass = isPinned 
                  ? 'col-span-4 row-span-3 md:col-span-3 md:row-span-3 order-first' 
                  : 'col-span-1 row-span-1 aspect-video';

                return (
                  <div key={p.id} className={`${gridClass}`}>
                     <ParticipantCard 
                        participant={p} 
                        isLocal={!!(p as any).isLocal}
                        stream={(p as any).stream}
                        isPinned={isPinned}
                        hasJudgePower={hasJudgePower}
                        onPin={(id) => setPinnedId(current => current === id ? null : id)}
                        onKick={(id) => { if(confirm("Remover?")) { roomSignaling.broadcast({ type: 'LEAVE', payload: { id } }); setParticipants(prev => prev.filter(x => x.id !== id)); }}}
                     />
                  </div>
                );
              })}
           </div>
        </div>

        {/* JUDGE CONTROLS DRAWER */}
        {(hasJudgePower && (isJudgeDrawerOpen || window.innerWidth >= 1200)) && (
           <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 z-40 transform transition-transform duration-300 xl:static xl:translate-x-0 ${isJudgeDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="text-amber-500 font-serif font-bold flex items-center gap-2"><Gavel size={18}/> Mesa do Juiz</h3><button className="xl:hidden" onClick={() => setIsJudgeDrawerOpen(false)}><X/></button></div>
              <div className="p-4 space-y-6">
                 <div className="bg-slate-800 rounded-lg p-3 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Sessão</h4>
                    {hearingStatus === 'waiting' && <button onClick={() => { if(confirm("Iniciar?")) { setHearingStatus('running'); setSessionStartTime(Date.now()); roomSignaling.sendHearingStatus('running', Date.now()); }}} className="w-full flex gap-2 justify-center bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg"><Play size={18}/> Iniciar</button>}
                    {hearingStatus === 'running' && <button onClick={() => { if(confirm("Encerrar?")) { setHearingStatus('ended'); roomSignaling.sendHearingStatus('ended'); }}} className="w-full flex gap-2 justify-center bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg"><Square size={18}/> Encerrar</button>}
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}?room=${roomId}`); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000); }} className="w-full flex gap-2 justify-center bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-xs font-bold">{isCopied ? <CheckCircle size={14}/> : <Share2 size={14}/>} {isCopied ? 'Copiado' : 'Link da Sala'}</button>
                 </div>
                 
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">Sala de Espera <span className="bg-slate-800 px-1.5 rounded text-white">{waitingParticipants.length}</span></h4>
                    {waitingParticipants.length === 0 ? <div className="text-xs text-slate-600 italic text-center py-2">Vazia</div> : waitingParticipants.map(w => (
                        <div key={w.id} className="flex justify-between items-center bg-slate-800 p-2 rounded mb-2 text-xs border border-slate-700">
                            <div className="flex flex-col mr-2"><span className="font-bold text-slate-200">{w.name}</span><span className="text-[10px] text-slate-500">{w.role}</span></div>
                            <button onClick={() => roomSignaling.broadcast({ type: 'UPDATE', payload: { id: w.id, status: 'active' } as any })} className="bg-green-600 text-white p-1.5 rounded"><UserPlus size={14}/></button>
                        </div>
                    ))}
                 </div>
                 
                 <div className="pt-4 border-t border-slate-800">
                    <button onClick={() => { if(confirm("Silenciar Todos?")) roomSignaling.forceMuteAll(); }} className="w-full bg-slate-800 p-3 rounded flex gap-2 justify-center hover:bg-slate-700 transition"><MicOff size={18} className="text-red-500"/><span className="text-xs font-bold">Silenciar Todos</span></button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 shrink-0 flex items-center justify-center gap-4 relative z-30 safe-area-bottom">
          <button onClick={() => setShowMeetingInfo(!showMeetingInfo)} className="absolute left-6 text-slate-500 hover:text-white md:flex hidden flex-col items-center"><Info size={20} /><span className="text-[10px] mt-1">Info</span></button>
          
          <button onClick={toggleMute} className={`p-4 rounded-full transition ${!isMuted ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>{!isMuted ? <Mic size={24}/> : <MicOff size={24}/>}</button>
          <button onClick={toggleVideo} className={`p-4 rounded-full transition ${!isVideoOff ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>{!isVideoOff ? <VideoIcon size={24}/> : <VideoOff size={24}/>}</button>
          <button onClick={toggleHand} className={`p-4 rounded-full transition ${isHandRaised ? 'bg-amber-900/50 text-amber-500 border border-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}><Hand size={24}/></button>
          
          <div className="w-px h-10 bg-slate-700 mx-2"/>
          <button onClick={handleExit} className="p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg"><PhoneOff size={24}/></button>
      </div>
    </div>
  );
};