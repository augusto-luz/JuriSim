import React, { useState, useEffect, useRef } from 'react';
import { CourtRole, Participant } from '../types';
import { roomSignaling, SignalingEvent } from '../services/roomSignaling';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, Users, Shield, 
  Gavel, Volume2, VolumeX, UserPlus, Pause,
  Pin, PinOff, LogOut, Hand, AlertCircle, X,
  Edit3, Check, Info, Copy, CheckCircle
} from 'lucide-react';

interface MultiplayerRoomProps {
  onExit: () => void;
  currentUserRole: CourtRole;
  roomId?: string; 
}

const getMockParticipants = (userRole: CourtRole): Participant[] => {
  const allPossible: Participant[] = [
    { id: 'mock-judge', name: 'Dr. Augusto (Juiz - IA)', role: CourtRole.JUDGE, isMuted: false, isVideoOff: false, status: 'active', audioLevel: 10 },
    { id: 'mock-pros', name: 'Dra. Mendes (MP - IA)', role: CourtRole.PROSECUTOR, isMuted: true, isVideoOff: false, status: 'active', audioLevel: 0 },
    { id: 'mock-def', name: 'Dr. Silva (Defesa - IA)', role: CourtRole.DEFENSE, isMuted: true, isVideoOff: false, status: 'active', audioLevel: 0 },
    { id: 'mock-clerk', name: 'João (Escrivão - IA)', role: CourtRole.CLERK, isMuted: true, isVideoOff: true, status: 'active', audioLevel: 0 },
    { id: 'mock-defend', name: 'Sr. Carlos (Réu - IA)', role: CourtRole.DEFENDANT, isMuted: true, isVideoOff: false, status: 'active', audioLevel: 0 },
  ];
  return allPossible.filter(p => p.role !== userRole);
};

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({ onExit, currentUserRole, roomId = 'abc-def-ghi' }) => {
  // Local User Setup
  const [localUser] = useState<Participant>({
    id: `user-${Date.now()}`, // Unique session ID
    name: `Você (${currentUserRole})`,
    role: currentUserRole,
    isMuted: false,
    isVideoOff: false,
    status: 'active',
    audioLevel: 0
  });

  const [participants, setParticipants] = useState<Participant[]>(() => getMockParticipants(currentUserRole));
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  const [caseTitle, setCaseTitle] = useState("001/2024 - Ação Cível (Ao Vivo)");
  const [caseDescription, setCaseDescription] = useState("Caso do Celular com Defeito");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempTitle, setTempTitle] = useState(caseTitle);
  const [tempDesc, setTempDesc] = useState(caseDescription);
  
  const [waitingRoomWitnesses, setWaitingRoomWitnesses] = useState(['Sra. Ana (Testemunha 2)', 'Perito Roberto']);
  const [showMeetingInfo, setShowMeetingInfo] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isJudgeDrawerOpen, setIsJudgeDrawerOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mockAudioIntervalRef = useRef<number | null>(null);
  const broadcastIntervalRef = useRef<number | null>(null);

  const [isInWaitingRoom, setIsInWaitingRoom] = useState(currentUserRole === CourtRole.WITNESS);
  const [ambientSoundPlaying, setAmbientSoundPlaying] = useState(false);
  const [ambientAudio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2517/2517-preview.mp3'));

  // --- SIGNALING & MULTIPLAYER LOGIC ---
  useEffect(() => {
    // 1. Connect to signaling
    roomSignaling.connect(roomId, { ...localUser, isMuted, isVideoOff, isHandRaised });

    // 2. Listen for events
    const unsubscribe = roomSignaling.subscribe((event: SignalingEvent) => {
      setParticipants(prev => {
        let updated = [...prev];

        if (event.type === 'JOIN') {
          // If a real user joins, remove any mock that holds the same role
          updated = updated.filter(p => p.role !== event.payload.role || !p.id.startsWith('mock-'));
          
          // Add new user if not exists
          if (!updated.find(p => p.id === event.payload.id)) {
            // Also reply with my own existence so they know I'm here
            roomSignaling.broadcast({ 
              type: 'UPDATE', 
              payload: { ...localUser, id: localUser.id, isMuted, isVideoOff, isHandRaised } 
            });
            return [...updated, event.payload];
          }
        } 
        else if (event.type === 'UPDATE') {
           updated = updated.map(p => {
             if (p.id === event.payload.id) {
               return { ...p, ...event.payload };
             }
             return p;
           });
           
           // If update comes from a new user we didn't track yet (rare race condition)
           if (!updated.find(p => p.id === event.payload.id)) {
              // It's tricky to reconstruct full participant from partial update, 
              // but usually JOIN happens first. We'll ignore for safety or add placeholder.
           }
        }
        else if (event.type === 'AUDIO_LEVEL') {
           updated = updated.map(p => 
             p.id === event.payload.id ? { ...p, audioLevel: event.payload.level } : p
           );
        }
        else if (event.type === 'LEAVE') {
           updated = updated.filter(p => p.id !== event.payload.id);
        }

        return updated;
      });
    });

    // 3. Broadcast Audio Level Interval
    broadcastIntervalRef.current = window.setInterval(() => {
      if (!isMuted) {
        roomSignaling.sendAudioLevel(localUser.id, localAudioLevel);
      }
    }, 150); // Send every 150ms

    return () => {
      unsubscribe();
      roomSignaling.disconnect();
      if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current);
    };
  }, [roomId, localUser.id, isMuted, isVideoOff, isHandRaised, localAudioLevel]); // Deps for broadcast closures


  // --- MEDIA SETUP ---
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setMediaError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
          audio: { echoCancellation: true, noiseSuppression: true } 
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setLocalStream(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.6;
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          
          const updateAudioLevel = () => {
            if (!analyser || !audioContext) return;
            if (audioContext.state === 'suspended') audioContext.resume();

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const average = sum / dataArray.length;
            const level = Math.min(100, Math.max(0, average * 3)); // Sensitivity boost
            
            setLocalAudioLevel(level);
            
            if (mounted) animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }

      } catch (err: any) {
        console.error("Media Error:", err);
        if (mounted) setMediaError(err.name === 'NotAllowedError' ? "Acesso negado à câmera." : "Câmera não encontrada.");
      }
    };

    const handleUserInteraction = () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };
    window.addEventListener('click', handleUserInteraction);

    if (!isInWaitingRoom) startCamera();
    else if (localStream) {
         localStream.getTracks().forEach(track => track.stop());
         setLocalStream(null);
    }

    return () => {
      mounted = false;
      window.removeEventListener('click', handleUserInteraction);
      if (localStream) localStream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isInWaitingRoom]);

  // Mock Audio Fluctuation (Only for mock participants)
  useEffect(() => {
    mockAudioIntervalRef.current = window.setInterval(() => {
      setParticipants(prev => prev.map(p => {
        // Only simulate for bots
        if (!p.id.startsWith('mock-') || p.isMuted) return p;
        const isActive = Math.random() > 0.6;
        return { ...p, audioLevel: isActive ? Math.random() * 50 + 10 : 0 };
      }));
    }, 200);
    return () => { if (mockAudioIntervalRef.current) clearInterval(mockAudioIntervalRef.current); };
  }, []);

  // Sync state changes to peers
  useEffect(() => {
    roomSignaling.sendUpdate({ ...localUser, isMuted, isVideoOff, isHandRaised, status: 'active' });
  }, [isMuted, isVideoOff, isHandRaised]);


  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleHand = () => setIsHandRaised(!isHandRaised);

  // Judge controls
  const admitWitness = (name: string) => {
    // Logic for admitting (adds a mock witness for demo, real witness would rely on signaling 'status' update)
    const newId = `mock-witness-${Date.now()}`;
    setParticipants(prev => [...prev, { id: newId, name: name, role: CourtRole.WITNESS, isMuted: false, isVideoOff: false, status: 'active', audioLevel: 0 }]);
    setWaitingRoomWitnesses(prev => prev.filter(w => w !== name));
    roomSignaling.broadcast({ type: 'JOIN', payload: { id: newId, name, role: CourtRole.WITNESS, isMuted: false, isVideoOff: false, status: 'active' } as Participant });
  };

  const kickParticipant = (id: string) => {
    if(confirm("Remover participante?")) {
      setParticipants(prev => prev.filter(p => p.id !== id));
      roomSignaling.broadcast({ type: 'LEAVE', payload: { id } }); // Force notify others
    }
  };

  const pinnedParticipant = participants.find(p => p.isPinned);
  const togglePinParticipant = (id: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : { ...p, isPinned: false }));
  };

  if (isInWaitingRoom) {
     return ( /* ... Waiting Room JSX (Unchanged for brevity, but logically same) ... */ 
      <div className="h-full bg-slate-900 flex flex-col items-center justify-center text-white relative">
         <div className="bg-black/50 p-10 rounded-2xl border border-white/10 text-center max-w-md">
            <Shield size={48} className="text-legal-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold mb-2">Sala de Espera</h2>
            <p className="text-gray-300">Aguardando autorização do Juiz...</p>
            <div className="mt-8">
               <button onClick={() => setIsInWaitingRoom(false)} className="px-6 py-3 bg-amber-600 rounded-lg font-bold">Entrar (Simulação)</button>
            </div>
         </div>
      </div>
     );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative">
      {showMeetingInfo && (
        <div className="absolute bottom-24 left-4 z-50 bg-white text-slate-900 p-6 rounded-xl shadow-2xl w-80 animate-in slide-in-from-bottom-5">
           <div className="flex justify-between mb-4">
              <h3 className="font-bold">Sala: {roomId}</h3>
              <button onClick={() => setShowMeetingInfo(false)}><X size={18} /></button>
           </div>
           <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
              <span className="font-mono text-xs">{`jurisim.app/${roomId}`}</span>
              <button onClick={() => { navigator.clipboard.writeText(`jurisim.app/${roomId}`); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000); }}>
                 {isCopied ? <CheckCircle size={16} className="text-green-600"/> : <Copy size={16}/>}
              </button>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0 z-20">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase border border-red-900/50 bg-red-950/30 px-2 py-1 rounded">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Ao Vivo
            </div>
            {isEditingInfo ? (
               <div className="flex items-center gap-2">
                  <input value={tempTitle} onChange={e=>setTempTitle(e.target.value)} className="bg-slate-800 px-2 py-1 rounded text-sm"/>
                  <button onClick={() => {setCaseTitle(tempTitle); setIsEditingInfo(false);}} className="text-green-500"><Check size={16}/></button>
               </div>
            ) : (
               <div className="flex items-center gap-2 group cursor-pointer" onClick={() => currentUserRole === CourtRole.JUDGE && setIsEditingInfo(true)}>
                  <span className="font-semibold text-sm md:text-base">{caseTitle}</span>
                  {currentUserRole === CourtRole.JUDGE && <Edit3 size={12} className="opacity-0 group-hover:opacity-100"/>}
               </div>
            )}
         </div>
         <div className="flex items-center gap-4">
            {currentUserRole === CourtRole.JUDGE && (
              <button onClick={() => setIsJudgeDrawerOpen(!isJudgeDrawerOpen)} className="md:hidden p-2 text-amber-400">
                <Gavel size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs">
               <Users size={12} /> {participants.length + 1}
            </div>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Grid */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-950">
           <div className={`grid gap-4 transition-all ${pinnedParticipant ? 'grid-cols-4 grid-rows-4 h-full' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              
              {/* Pinned View */}
              {pinnedParticipant && (
                 <div className="col-span-3 row-span-4 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden">
                    <img src={`https://picsum.photos/seed/${pinnedParticipant.id}/1280/720`} className="w-full h-full object-cover"/>
                    <button onClick={()=>togglePinParticipant(pinnedParticipant.id)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"><PinOff size={20}/></button>
                    <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded text-white font-bold">{pinnedParticipant.name}</div>
                 </div>
              )}

              {/* Local Video */}
              <div className={`relative bg-slate-900 rounded-xl overflow-hidden border-2 ${isHandRaised ? 'border-amber-500' : 'border-slate-800'} ${pinnedParticipant ? 'col-span-1 row-span-1 h-32' : 'aspect-video'}`}>
                 <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                 <div className={`absolute inset-0 flex flex-col items-center justify-center ${isVideoOff ? 'opacity-100' : 'opacity-0'} transition bg-slate-800`}>
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">EU</div>
                 </div>
                 {isHandRaised && <div className="absolute top-2 right-2 text-amber-500 animate-bounce"><Hand size={20}/></div>}
                 
                 <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <span className="bg-black/60 px-2 py-1 rounded text-xs font-bold truncate max-w-[80%]">Você ({currentUserRole})</span>
                    {!isMuted && <div className="h-6 w-1.5 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end"><div style={{height: `${localAudioLevel}%`}} className="w-full bg-green-500 transition-all"/></div>}
                 </div>
              </div>

              {/* Remote Participants */}
              {participants.filter(p => !pinnedParticipant || p.id !== pinnedParticipant.id).map(p => (
                 <div key={p.id} className={`relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group ${pinnedParticipant ? 'col-span-1 row-span-1 h-32' : 'aspect-video'}`}>
                    <img src={`https://picsum.photos/seed/${p.id}/800/600`} className="w-full h-full object-cover opacity-90"/>
                    
                    {/* Judge Actions Overlay */}
                    {currentUserRole === CourtRole.JUDGE && (
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                          <button onClick={() => kickParticipant(p.id)} className="p-2 bg-red-600 rounded-full hover:bg-red-500"><LogOut size={16}/></button>
                          <button onClick={() => togglePinParticipant(p.id)} className="p-2 bg-slate-200 text-slate-900 rounded-full hover:bg-white"><Pin size={16}/></button>
                       </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                       <div className="flex flex-col gap-1 max-w-[80%]">
                          <span className="bg-black/60 px-2 py-1 rounded text-xs font-bold truncate flex items-center gap-1">
                             {p.name}
                             {p.isHandRaised && <Hand size={12} className="text-amber-500"/>}
                          </span>
                       </div>
                       {p.isMuted ? <MicOff size={14} className="text-red-400 mb-1 mr-1"/> : 
                          <div className="h-6 w-1.5 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end">
                             <div style={{height: `${Math.min(p.audioLevel || 0, 100)}%`}} className="w-full bg-green-500 transition-all duration-100"/>
                          </div>
                       }
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Judge Sidebar (Drawer on Mobile) */}
        {(currentUserRole === CourtRole.JUDGE && (isJudgeDrawerOpen || window.innerWidth >= 768)) && (
           <div className={`fixed inset-y-0 right-0 w-72 bg-slate-900 border-l border-slate-800 z-40 transform transition md:static md:translate-x-0 ${isJudgeDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                 <h3 className="text-amber-500 font-serif font-bold flex items-center gap-2"><Gavel size={18}/> Mesa do Juiz</h3>
                 <button className="md:hidden" onClick={() => setIsJudgeDrawerOpen(false)}><X/></button>
              </div>
              <div className="p-4 space-y-6">
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Sala de Espera</h4>
                    {waitingRoomWitnesses.map(w => (
                       <div key={w} className="flex justify-between items-center bg-slate-800 p-2 rounded mb-2 text-xs">
                          <span className="truncate flex-1">{w}</span>
                          <button onClick={() => admitWitness(w)} className="text-green-500 hover:bg-slate-700 p-1 rounded"><UserPlus size={14}/></button>
                       </div>
                    ))}
                    {waitingRoomWitnesses.length === 0 && <p className="text-xs text-slate-600 italic">Vazia</p>}
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <button className="bg-slate-800 p-3 rounded flex flex-col items-center gap-1 hover:bg-slate-700"><Pause size={20} className="text-amber-500"/><span className="text-[10px]">Pausar</span></button>
                    <button className="bg-slate-800 p-3 rounded flex flex-col items-center gap-1 hover:bg-slate-700"><MicOff size={20} className="text-red-500"/><span className="text-[10px]">Silenciar Todos</span></button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 shrink-0 flex items-center justify-center gap-4 relative z-30">
          <button onClick={() => setShowMeetingInfo(!showMeetingInfo)} className="absolute left-6 text-slate-500 hover:text-white md:flex hidden flex-col items-center">
             <Info size={20} />
             <span className="text-[10px] mt-1">Info</span>
          </button>

          <button onClick={toggleMute} className={`p-4 rounded-full transition ${!isMuted ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
             {!isMuted ? <Mic size={24}/> : <MicOff size={24}/>}
          </button>
          <button onClick={toggleVideo} className={`p-4 rounded-full transition ${!isVideoOff ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
             {!isVideoOff ? <VideoIcon size={24}/> : <VideoOff size={24}/>}
          </button>
          <button onClick={toggleHand} className={`p-4 rounded-full transition ${isHandRaised ? 'bg-amber-900/50 text-amber-500 border border-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
             <Hand size={24}/>
          </button>
          <div className="w-px h-10 bg-slate-700 mx-2"/>
          <button onClick={onExit} className="p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20">
             <PhoneOff size={24}/>
          </button>
      </div>
    </div>
  );
};