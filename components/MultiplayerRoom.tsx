
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
  Share2, ArrowLeftCircle, AlertCircle
} from 'lucide-react';
import { persistenceService } from '../services/persistence';

interface MultiplayerRoomProps {
  onExit: () => void;
  currentUserRole: CourtRole;
  roomId?: string;
  user: User;
  isHost?: boolean;
}

const RemoteVideo = React.memo(({ stream, isVideoOff, name, isLocal = false }: { stream?: MediaStream, isVideoOff: boolean, name?: string, isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
     if (videoRef.current && stream) {
         videoRef.current.srcObject = stream;
         videoRef.current.play().catch(() => {});
     }
  }, [stream, isVideoOff]); 

  if (!stream || isVideoOff) {
      return (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <UserIcon size={40} className="text-slate-600"/>
        </div>
      );
  }

  return <video ref={videoRef} autoPlay playsInline muted={isLocal} className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} />;
});

const ParticipantCard = ({ participant, isLocal, stream, onPin, onKick, isPinned, hasJudgePower }: any) => (
  <div className={`relative bg-slate-900 rounded-xl overflow-hidden border transition-all duration-300 group
    ${participant.isHandRaised ? 'border-amber-500 shadow-lg' : 'border-slate-800'}
    ${isPinned ? 'ring-2 ring-accent-gold' : ''}
  `}>
    <RemoteVideo stream={stream} isVideoOff={participant.isVideoOff} name={participant.name} isLocal={isLocal} />
    
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition pointer-events-none">
       <div className="pointer-events-auto flex gap-2">
          {hasJudgePower && !isLocal && (
            <button onClick={() => onKick(participant.id)} className="p-2 bg-red-600 rounded-full text-white hover:scale-110 transition">
              <LogOut size={16}/>
            </button>
          )}
          <button onClick={() => onPin(participant.id)} className={`p-2 rounded-full ${isPinned ? 'bg-accent-gold text-white' : 'bg-white text-slate-900'} hover:scale-110 transition`}>
            <Pin size={16}/>
          </button>
       </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
        <div className="flex flex-col">
           <span className="text-white text-xs font-bold truncate flex items-center gap-1">
             {participant.name} {participant.isHandRaised && <Hand size={12} className="text-amber-500 animate-bounce"/>}
           </span>
           <span className="text-[10px] text-slate-400">{participant.role}</span>
        </div>
        {!participant.isMuted && (
          <div className="h-3 w-1 bg-green-500 rounded-full animate-pulse" style={{ opacity: (participant.audioLevel || 0) / 100 }} />
        )}
    </div>
  </div>
);

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({ onExit, currentUserRole, roomId = 'abc', user, isHost = false }) => {
  const hasJudgePower = currentUserRole === CourtRole.JUDGE || user.role === UserRole.ADMIN;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(currentUserRole === CourtRole.WITNESS);
  const [hearingStatus, setHearingStatus] = useState<'waiting' | 'running' | 'ended'>('waiting');
  const [error, setError] = useState<string | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  const localUser = useMemo<Participant>(() => ({
    id: 'local',
    name: user.name,
    role: currentUserRole,
    isMuted,
    isVideoOff,
    isHandRaised,
    status: isInWaitingRoom ? 'waiting' : 'active'
  }), [user.name, currentUserRole, isMuted, isVideoOff, isHandRaised, isInWaitingRoom]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!roomId) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (mounted) {
          setLocalStream(stream);
          roomSignaling.connect(roomId, localUser, isHost, stream);
        }
      } catch (e) {
        if (mounted) roomSignaling.connect(roomId, localUser, isHost, null);
      }
    }
    init();
    return () => { 
      mounted = false; 
      // Gravar tempo de exercício ao sair
      const diff = Math.floor((Date.now() - sessionStartRef.current) / 60000);
      if (diff >= 1) persistenceService.trackExerciseTime(user.id, diff);
      roomSignaling.disconnect(); 
    };
  }, []);

  useEffect(() => {
    const unsub = roomSignaling.subscribe((event: SignalingEvent) => {
      if (event.type === 'ERROR') {
        setError(event.payload);
        return;
      }
      
      if (event.type === 'UPDATE' && event.payload.id === roomSignaling.getPeerId() && event.payload.status === 'active') {
        setIsInWaitingRoom(false);
      }
      if (event.type === 'HEARING_STATUS') setHearingStatus(event.payload.status);
      
      setParticipants(prev => {
        if (event.type === 'JOIN' || event.type === 'SYNC_USERS') {
          const incoming = event.type === 'JOIN' ? [event.payload] : event.payload;
          const filtered = incoming.filter(p => p.id !== roomSignaling.getPeerId());
          const map = new Map<string, Participant>(prev.map(p => [p.id, p]));
          filtered.forEach(p => {
            const existing = map.get(p.id);
            map.set(p.id, existing ? ({ ...existing as object, ...p as object } as Participant) : p);
          });
          return Array.from(map.values());
        }
        if (event.type === 'UPDATE') {
          return prev.map(p => p.id === event.payload.id ? { ...p, ...event.payload } : p);
        }
        if (event.type === 'LEAVE') return prev.filter(p => p.id !== event.payload.id);
        return prev;
      });
    });
    return unsub;
  }, [localUser]);

  const toggleMute = () => {
    if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = isMuted);
    setIsMuted(!isMuted);
    roomSignaling.sendUpdate({ ...localUser, isMuted: !isMuted });
  };

  const toggleVideo = () => {
    if (localStream) localStream.getVideoTracks().forEach(t => t.enabled = isVideoOff);
    setIsVideoOff(!isVideoOff);
    roomSignaling.sendUpdate({ ...localUser, isVideoOff: !isVideoOff });
  };

  const allActive = useMemo(() => {
    const list = participants.filter(p => p.status === 'active');
    if (!isInWaitingRoom) list.unshift({ ...localUser, stream: localStream || undefined, isLocal: true } as any);
    return list;
  }, [participants, localUser, isInWaitingRoom, localStream]);

  if (error) return (
    <div className="h-full bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
       <AlertOctagon size={64} className="text-red-500 mb-4 animate-bounce" />
       <h2 className="text-2xl font-serif font-bold mb-4">Falha Crítica na Conexão</h2>
       <p className="text-slate-400 max-w-md mb-8">{error}</p>
       <button onClick={onExit} className="px-10 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition">
          Retornar ao Lobby
       </button>
    </div>
  );

  if (hearingStatus === 'ended') return (
    <div className="h-full bg-slate-950 flex flex-col items-center justify-center text-white">
      <Gavel size={64} className="text-accent-gold mb-4"/>
      <h2 className="text-3xl font-serif font-bold">Audiência Encerrada</h2>
      <button onClick={onExit} className="mt-8 px-10 py-3 bg-white text-slate-900 rounded-xl font-bold">Sair do Tribunal</button>
    </div>
  );

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden text-white">
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sessão {roomId}</span>
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${hearingStatus === 'running' ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}>
            {hearingStatus === 'running' ? 'AO VIVO' : 'AGUARDANDO'}
          </div>
        </div>
        <div className="flex items-center gap-4">
           {hasJudgePower && <span className="text-[10px] font-bold text-accent-gold border border-accent-gold/30 px-2 py-1 rounded">MAGISTRADO</span>}
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs">
             <Users size={12}/> {allActive.length}
           </div>
        </div>
      </div>

      <div className="flex-1 p-4 relative overflow-y-auto custom-scrollbar">
        {isInWaitingRoom && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
             <div className="max-w-md bg-slate-800 p-10 rounded-[2rem] border border-white/5 shadow-2xl">
                <Shield size={64} className="text-amber-500 mx-auto mb-6"/>
                <h3 className="text-2xl font-serif font-bold mb-4">Sala de Espera Ativa</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Você está seguro na ante-sala. O Juiz será notificado da sua presença e autorizará seu ingresso em breve.</p>
                <button onClick={onExit} className="text-red-400 text-xs font-bold uppercase hover:underline">Abandonar Sessão</button>
             </div>
          </div>
        )}

        <div className={`grid gap-4 h-full content-start ${pinnedId ? 'grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
           {allActive.map(p => (
             <div key={p.id} className={pinnedId === p.id ? 'col-span-4 row-span-3 aspect-video' : 'aspect-video'}>
               <ParticipantCard 
                  participant={p} 
                  isLocal={(p as any).isLocal} 
                  stream={(p as any).stream} 
                  isPinned={pinnedId === p.id}
                  hasJudgePower={hasJudgePower}
                  onPin={(id: any) => setPinnedId(current => current === id ? null : id)}
                  onKick={(id: any) => roomSignaling.broadcast({ type: 'LEAVE', payload: { id } })}
               />
             </div>
           ))}
        </div>
      </div>

      {hasJudgePower && participants.some(p => p.status === 'waiting') && (
        <div className="bg-slate-900 border-t border-slate-800 p-4">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Aguardando na Porta ({participants.filter(p => p.status === 'waiting').length})</h4>
           <div className="flex gap-3 overflow-x-auto pb-2">
              {participants.filter(p => p.status === 'waiting').map(w => (
                <div key={w.id} className="bg-slate-800 p-3 rounded-xl border border-white/5 flex items-center gap-4 shrink-0">
                   <div>
                      <p className="text-xs font-bold text-white">{w.name}</p>
                      <p className="text-[10px] text-slate-500">{w.role}</p>
                   </div>
                   <button onClick={() => roomSignaling.broadcast({ type: 'UPDATE', payload: { id: w.id, status: 'active' } as any })} className="bg-green-600 p-2 rounded-lg hover:bg-green-500 transition">
                      <UserPlus size={16}/>
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 shrink-0">
        <button onClick={toggleMute} className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
          {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
          {isVideoOff ? <VideoOff size={24}/> : <VideoIcon size={24}/>}
        </button>
        <button onClick={() => { setIsHandRaised(!isHandRaised); roomSignaling.sendUpdate({ ...localUser, isHandRaised: !isHandRaised }); }} className={`p-4 rounded-full transition ${isHandRaised ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
          <Hand size={24}/>
        </button>
        <div className="w-px h-8 bg-slate-800 mx-2"/>
        {hasJudgePower && hearingStatus === 'waiting' && (
          <button onClick={() => roomSignaling.sendHearingStatus('running', Date.now())} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold flex items-center gap-2">
            <Play size={18}/> Iniciar Rito
          </button>
        )}
        <button onClick={onExit} className="p-4 bg-red-600 hover:bg-red-500 rounded-xl transition">
          <PhoneOff size={24}/>
        </button>
      </div>
    </div>
  );
};
