import React, { useState, useEffect, useRef } from 'react';
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

// Fixed RemoteVideo to be more robust with stream updates
const RemoteVideo = React.memo(({ stream, isVideoOff, name, isLocal = false }: { stream?: MediaStream, isVideoOff: boolean, name?: string, isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
     if (videoRef.current && stream) {
         videoRef.current.srcObject = stream;
         // Explicitly call play to avoid black screens on some browsers
         videoRef.current.play().catch(e => {
             console.warn("Auto-play prevented", e);
             // If autoplay blocked, try muting (though remote streams should generally play)
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

  return <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover"/>;
});

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({ onExit, currentUserRole, roomId = 'abc-def-ghi', user, isHost = false }) => {
  const hasJudgePower = currentUserRole === CourtRole.JUDGE || user.role === UserRole.ADMIN;

  const [localUser] = useState<Participant>(() => ({
    id: `user-${Date.now()}`, 
    name: `${user.name} (${currentUserRole})`,
    role: currentUserRole,
    isMuted: false,
    isVideoOff: false,
    status: currentUserRole === CourtRole.WITNESS ? 'waiting' : 'active',
    audioLevel: 0
  }));

  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  const [caseTitle, setCaseTitle] = useState("001/2024 - Ação Cível (Ao Vivo)");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempTitle, setTempTitle] = useState(caseTitle);
  
  const [showMeetingInfo, setShowMeetingInfo] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isJudgeDrawerOpen, setIsJudgeDrawerOpen] = useState(false);
  
  const [hearingStatus, setHearingStatus] = useState<'waiting' | 'running' | 'ended'>('waiting');
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<string>('00:00');
  const timerIntervalRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const broadcastIntervalRef = useRef<number | null>(null);

  const [isInWaitingRoom, setIsInWaitingRoom] = useState(currentUserRole === CourtRole.WITNESS);
  const waitingRoomVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (waitingRoomVideoRef.current && localStream) {
      waitingRoomVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isInWaitingRoom]);

  const stopLocalMedia = () => {
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
            track.stop();
        });
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
        setMediaError(null);
        // Request media before connecting signaling
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
        
        // Connect Signaling AFTER stream is ready
        roomSignaling.connect(roomId, { ...localUser, isMuted: false, isVideoOff: false }, isHost, stream);

        // Audio Visualizer Setup
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
          analyserRef.current = analyser;
          
          const updateAudioLevel = () => {
            if (!analyser || !audioContext) return;
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {}); 
            }

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const average = sum / dataArray.length;
            const level = Math.min(100, Math.max(0, average * 3)); 
            
            setLocalAudioLevel(level);
            
            if (mounted) animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }

      } catch (err: any) {
        console.error("Media Error:", err);
        if (mounted) setMediaError("Câmera/Microfone indisponível.");
        // Connect without media if error
        roomSignaling.connect(roomId, { ...localUser, isMuted: true, isVideoOff: true }, isHost, null);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      stopLocalMedia();
      roomSignaling.disconnect(); 
    };
  }, []); 


  // --- SIGNALING LISTENERS ---
  useEffect(() => {
    const unsubscribe = roomSignaling.subscribe((event: SignalingEvent) => {
      
      // Handle My Status Update (e.g., Witness Admitted)
      if (event.type === 'UPDATE' && event.payload.id === roomSignaling.getPeerId()) {
          if (event.payload.status === 'active') {
              setIsInWaitingRoom(false);
              // Force rebroadcast to ensure Mesh network knows we are ready
              setTimeout(() => {
                   roomSignaling.sendUpdate({ ...localUser, status: 'active' });
              }, 500);
          }
      }

      if (event.type === 'HEARING_STATUS') {
         setHearingStatus(event.payload.status);
         if (event.payload.status === 'running') {
             const startTime = event.payload.startTime || Date.now();
             setSessionStartTime(startTime);
         }
         if (event.payload.status === 'ended' && timerIntervalRef.current) {
             clearInterval(timerIntervalRef.current);
         }
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
                // Add if not exists and not me
                if (!updated.find(p => p.id === newP.id) && newP.id !== roomSignaling.getPeerId()) {
                    updated.push(newP);
                }
            });
        } 
        else if (event.type === 'UPDATE') {
           const existingIndex = updated.findIndex(p => p.id === event.payload.id);
           if (existingIndex !== -1) {
               // CRITICAL: Merge stream carefully. If payload has no stream, keep existing stream.
               const existing = updated[existingIndex];
               updated[existingIndex] = {
                   ...existing,
                   ...event.payload,
                   stream: event.payload.stream || existing.stream // Preserve stream if not provided in update
               };
           } else if (event.payload.name && event.payload.id !== roomSignaling.getPeerId()) {
               // If we don't know this person but got an update, add them (edge case)
               updated.push(event.payload as Participant);
           }
        }
        else if (event.type === 'AUDIO_LEVEL') {
           updated = updated.map(p => 
             p.id === event.payload.id ? { ...p, audioLevel: event.payload.level } : p
           );
        }
        else if (event.type === 'LEAVE') {
           if (event.payload.id === roomSignaling.getPeerId()) { 
              alert("Você foi removido da sala.");
              handleExit();
              return prev; 
           }
           updated = updated.filter(p => p.id !== event.payload.id);
        }

        return updated;
      });
    });

    broadcastIntervalRef.current = window.setInterval(() => {
      if (!isMuted && !isInWaitingRoom) {
        roomSignaling.sendAudioLevel(localUser.id, localAudioLevel);
      }
    }, 200);

    return () => {
      unsubscribe();
      if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current);
    };
  }, [localUser, isMuted, localAudioLevel, isInWaitingRoom]);

  // Timer Logic
  useEffect(() => {
      if (hearingStatus === 'running' && sessionStartTime) {
          timerIntervalRef.current = window.setInterval(() => {
              const diff = Date.now() - sessionStartTime;
              const minutes = Math.floor(diff / 60000);
              const seconds = Math.floor((diff % 60000) / 1000);
              setSessionDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }, 1000);
      } else if (hearingStatus === 'waiting') {
        setSessionDuration('00:00');
      }
      return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [hearingStatus, sessionStartTime]);

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

  const admitWitness = (participantId: string) => {
    roomSignaling.broadcast({ 
        type: 'UPDATE', 
        payload: { id: participantId, status: 'active' } as any 
    });
  };

  const kickParticipant = (id: string) => {
    if(confirm("Remover participante?")) {
      roomSignaling.broadcast({ type: 'LEAVE', payload: { id } }); 
      setParticipants(prev => prev.filter(p => p.id !== id));
    }
  };

  const muteAll = () => {
      if(confirm("Deseja silenciar todos os microfones?")) {
          roomSignaling.forceMuteAll();
      }
  };

  const togglePinParticipant = (id: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : { ...p, isPinned: false }));
  };

  const startHearing = () => {
    if (confirm("Iniciar gravação da audiência?")) {
      const startTime = Date.now();
      setHearingStatus('running');
      setSessionStartTime(startTime);
      roomSignaling.sendHearingStatus('running', startTime);
    }
  };

  const endHearing = () => {
    if (confirm("Encerrar sessão?")) {
      setHearingStatus('ended');
      roomSignaling.sendHearingStatus('ended');
    }
  };

  const pinnedParticipant = participants.find(p => p.isPinned);
  const activeParticipants = participants.filter(p => p.status === 'active');
  const waitingParticipants = participants.filter(p => p.status === 'waiting');

  if (hearingStatus === 'ended') return <div className="h-full bg-slate-950 flex items-center justify-center text-white"><div className="text-center"><h2 className="text-4xl font-bold">Audiência Encerrada</h2><button onClick={handleExit} className="mt-8 px-8 py-3 bg-white text-slate-900 rounded font-bold">Sair</button></div></div>;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative">
      
      {isInWaitingRoom && (
         <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white">
             <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 text-center max-w-md shadow-2xl">
                 <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                     <Shield size={40} className="text-amber-500" />
                 </div>
                 <h2 className="text-3xl font-serif font-bold mb-2">Sala de Espera</h2>
                 <p className="text-gray-300 mb-6">Olá, <strong>{user.name}</strong>.</p>
                 <div className="bg-black/40 p-4 rounded-lg text-sm text-amber-200 border border-amber-900/50 flex items-center gap-3">
                     <AlertOctagon size={20} className="shrink-0"/>
                     <span className="text-left">Aguarde o Juiz autorizar sua entrada.</span>
                 </div>
                 <div className="mt-6 w-32 h-24 bg-black rounded-lg overflow-hidden mx-auto border border-slate-600 relative">
                     <video ref={waitingRoomVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"/>
                     <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-center py-0.5">Sua Câmera</div>
                 </div>
             </div>
         </div>
      )}

      {showMeetingInfo && !isInWaitingRoom && (
        <div className="absolute bottom-24 left-4 z-40 bg-white text-slate-900 p-6 rounded-xl shadow-2xl w-80 animate-in slide-in-from-bottom-5">
           <div className="flex justify-between mb-4">
              <h3 className="font-bold">Sala: {roomId}</h3>
              <button onClick={() => setShowMeetingInfo(false)}><X size={18} /></button>
           </div>
           <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
              <span className="font-mono text-xs truncate max-w-[180px]">{`${window.location.protocol}//${window.location.host}?room=${roomId}`}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}?room=${roomId}`); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000); }}>
                 {isCopied ? <CheckCircle size={16} className="text-green-600"/> : <Copy size={16}/>}
              </button>
           </div>
        </div>
      )}

      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0 z-20">
         <div className="flex items-center gap-4">
            {hearingStatus === 'running' ? (
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase border border-red-900/50 bg-red-950/30 px-2 py-1 rounded"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Gravando • {sessionDuration}</div>
            ) : (
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase border border-amber-900/50 bg-amber-950/30 px-2 py-1 rounded"><AlertOctagon size={12}/> Aguardando Início</div>
            )}
            {isEditingInfo ? (
               <div className="flex items-center gap-2"><input value={tempTitle} onChange={e=>setTempTitle(e.target.value)} className="bg-slate-800 px-2 py-1 rounded text-sm"/><button onClick={() => {setCaseTitle(tempTitle); setIsEditingInfo(false);}} className="text-green-500"><Check size={16}/></button></div>
            ) : (
               <div className="flex items-center gap-2 group cursor-pointer" onClick={() => hasJudgePower && setIsEditingInfo(true)}><span className="font-semibold text-sm md:text-base">{caseTitle}</span>{hasJudgePower && <Edit3 size={12} className="opacity-0 group-hover:opacity-100"/>}</div>
            )}
         </div>
         <div className="flex items-center gap-4">
            {hasJudgePower && <button onClick={() => setIsJudgeDrawerOpen(!isJudgeDrawerOpen)} className="md:hidden p-2 text-amber-400"><Gavel size={20} /></button>}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs"><Users size={12} /> {activeParticipants.length + 1}</div>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-950">
           {activeParticipants.length === 0 && !isInWaitingRoom && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="text-center opacity-30">
                      <Users size={64} className="mx-auto mb-4"/>
                      <h2 className="text-2xl font-bold mb-2">A sala está vazia</h2>
                      <p>Compartilhe o link para outros participantes entrarem.</p>
                  </div>
              </div>
           )}

           <div className={`grid gap-4 transition-all ${pinnedParticipant ? 'grid-cols-4 grid-rows-4 h-full' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              
              {!isInWaitingRoom && (
                  <div className={`relative bg-slate-900 rounded-xl overflow-hidden border-2 ${isHandRaised ? 'border-amber-500' : 'border-slate-800'} ${pinnedParticipant ? 'col-span-1 row-span-1 h-32' : 'aspect-video'}`}>
                     <RemoteVideo stream={localStream || undefined} isVideoOff={isVideoOff} name="Você" isLocal={true} />
                     <div className={`absolute inset-0 flex flex-col items-center justify-center ${isVideoOff ? 'opacity-100' : 'opacity-0'} transition bg-slate-800 pointer-events-none`}><div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">EU</div></div>
                     {isHandRaised && <div className="absolute top-2 right-2 text-amber-500 animate-bounce"><Hand size={20}/></div>}
                     <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end"><span className="bg-black/60 px-2 py-1 rounded text-xs font-bold truncate max-w-[80%]">Você ({currentUserRole})</span>{!isMuted && <div className="h-6 w-1.5 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end"><div style={{height: `${localAudioLevel}%`}} className="w-full bg-green-500 transition-all"/></div>}</div>
                  </div>
              )}

              {activeParticipants.filter(p => !pinnedParticipant || p.id !== pinnedParticipant.id).map(p => (
                 <div key={p.id} className={`relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group ${pinnedParticipant ? 'col-span-1 row-span-1 h-32' : 'aspect-video'}`}>
                    <RemoteVideo stream={p.stream} isVideoOff={p.isVideoOff} name={p.name} />
                    
                    {hasJudgePower && (
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition z-20">
                          <button onClick={() => kickParticipant(p.id)} className="p-2 bg-red-600 rounded-full hover:bg-red-500"><LogOut size={16}/></button>
                          <button onClick={() => togglePinParticipant(p.id)} className="p-2 bg-slate-200 text-slate-900 rounded-full hover:bg-white"><Pin size={16}/></button>
                       </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                       <div className="flex flex-col gap-1 max-w-[80%]"><span className="bg-black/60 px-2 py-1 rounded text-xs font-bold truncate flex items-center gap-1">{p.name} {p.isHandRaised && <Hand size={12} className="text-amber-500"/>}</span></div>
                       {p.isMuted ? <MicOff size={14} className="text-red-400 mb-1 mr-1"/> : <div className="h-6 w-1.5 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end"><div style={{height: `${Math.min(p.audioLevel || 0, 100)}%`}} className="w-full bg-green-500 transition-all duration-100"/></div>}
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {(hasJudgePower && (isJudgeDrawerOpen || window.innerWidth >= 768)) && (
           <div className={`fixed inset-y-0 right-0 w-72 bg-slate-900 border-l border-slate-800 z-40 transform transition-transform duration-300 md:static md:translate-x-0 ${isJudgeDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="text-amber-500 font-serif font-bold flex items-center gap-2"><Gavel size={18}/> Mesa do Juiz</h3><button className="md:hidden" onClick={() => setIsJudgeDrawerOpen(false)}><X/></button></div>
              <div className="p-4 space-y-6">
                 <div className="bg-slate-800 rounded-lg p-3 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Controle da Sessão</h4>
                    {hearingStatus === 'waiting' && <button onClick={startHearing} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition"><Play size={18} fill="currentColor"/> Iniciar Audiência</button>}
                    {hearingStatus === 'running' && <button onClick={endHearing} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition animate-in pulse"><Square size={18} fill="currentColor"/> Encerrar Sessão</button>}
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}?room=${roomId}`); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000); }} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition text-xs">
                        {isCopied ? <CheckCircle size={14} className="text-green-500"/> : <Share2 size={14}/>} {isCopied ? 'Link Copiado' : 'Copiar Link da Sala'}
                    </button>
                 </div>
                 
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">Sala de Espera <span className="bg-slate-800 px-1.5 rounded text-white">{waitingParticipants.length}</span></h4>
                    {waitingParticipants.length === 0 ? (
                        <div className="text-xs text-slate-600 italic text-center py-2">Ninguém aguardando.</div>
                    ) : (
                        waitingParticipants.map(w => (
                            <div key={w.id} className="flex justify-between items-center bg-slate-800 p-2 rounded mb-2 text-xs border border-slate-700">
                                <div className="flex flex-col overflow-hidden mr-2">
                                    <span className="truncate font-bold text-slate-200">{w.name}</span>
                                    <span className="text-[10px] text-slate-500">{w.role}</span>
                                </div>
                                <button onClick={() => admitWitness(w.id)} className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded transition" title="Admitir">
                                    <UserPlus size={14}/>
                                </button>
                            </div>
                        ))
                    )}
                 </div>
                 
                 <div className="grid grid-cols-1 gap-2 border-t border-slate-800 pt-4">
                    <button onClick={muteAll} className="bg-slate-800 p-3 rounded flex items-center justify-center gap-2 hover:bg-slate-700 transition"><MicOff size={18} className="text-red-500"/><span className="text-xs font-bold">Silenciar Todos</span></button>
                 </div>
              </div>
           </div>
        )}
      </div>

      <div className="h-20 bg-slate-900 border-t border-slate-800 shrink-0 flex items-center justify-center gap-4 relative z-30">
          <button onClick={() => setShowMeetingInfo(!showMeetingInfo)} className="absolute left-6 text-slate-500 hover:text-white md:flex hidden flex-col items-center"><Info size={20} /><span className="text-[10px] mt-1">Info</span></button>
          
          <button onClick={toggleMute} className={`p-4 rounded-full transition ${!isMuted ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>{!isMuted ? <Mic size={24}/> : <MicOff size={24}/>}</button>
          <button onClick={toggleVideo} className={`p-4 rounded-full transition ${!isVideoOff ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>{!isVideoOff ? <VideoIcon size={24}/> : <VideoOff size={24}/>}</button>
          <button onClick={toggleHand} className={`p-4 rounded-full transition ${isHandRaised ? 'bg-amber-900/50 text-amber-500 border border-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}><Hand size={24}/></button>
          
          <div className="w-px h-10 bg-slate-700 mx-2"/>
          <button onClick={handleExit} className="p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20"><PhoneOff size={24}/></button>
      </div>
    </div>
  );
};