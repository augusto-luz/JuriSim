
import React, { useEffect, useState } from 'react';
import { Video, Keyboard, Users, Shield, Globe, Clock, Calendar, History, ArrowRight, Gavel, Scale, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { User, CourtRole } from '../types';
import { persistenceService, RoomHistoryEntry } from '../services/persistence';
import { roomSignaling } from '../services/roomSignaling';

interface MultiplayerLobbyProps {
  onStartNewMeeting: () => void;
  onJoinMeeting: (role?: CourtRole) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  user: User;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ 
  onStartNewMeeting, 
  onJoinMeeting, 
  joinCode, 
  setJoinCode,
  user
}) => {
  const [history, setHistory] = useState<RoomHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setHistory(persistenceService.getRoomHistory(user.id));
    
    // Escuta erros globais de sinalização
    const unsub = roomSignaling.subscribe((event) => {
      if (event.type === 'ERROR') {
        setError(event.payload);
        setIsConnecting(false);
      }
    });
    
    return unsub;
  }, [user.id]);

  const handleReconnect = (entry: RoomHistoryEntry) => {
    setError(null);
    setJoinCode(entry.roomId);
    onJoinMeeting(entry.role);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    setError(null);
    setIsConnecting(true);
    // Timeout de segurança para a conexão
    setTimeout(() => {
      if (isConnecting) setIsConnecting(false);
    }, 10000);
    onJoinMeeting();
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 animate-in fade-in">
      
      {/* Left Column: Actions */}
      <div className="flex-1 p-8 md:p-12 flex flex-col justify-center max-w-2xl overflow-y-auto custom-scrollbar">
         <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-legal-900 mb-6 leading-tight">
               Audiências Simuladas <br/> em <span className="text-accent-gold">Tempo Real</span>.
            </h1>
            <p className="text-lg text-legal-600 mb-8 leading-relaxed">
               Conecte-se com colegas e professores para praticar o rito processual em um tribunal virtual seguro.
            </p>
         </div>

         {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
               <AlertCircle size={20} className="shrink-0" />
               <p className="text-sm font-bold">{error}</p>
            </div>
         )}

         <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <button 
               onClick={onStartNewMeeting}
               disabled={isConnecting}
               className="flex items-center justify-center gap-3 bg-legal-900 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-legal-800 transition shadow-xl disabled:opacity-50"
            >
               <Video size={24}/>
               Nova Audiência
            </button>
            
            <div className={`flex items-center bg-white border ${error ? 'border-red-300' : 'border-gray-300'} rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-legal-500 transition`}>
               <Keyboard className="text-gray-400 mr-3" size={24}/>
               <input 
                  type="text" 
                  placeholder="Código da sala" 
                  value={joinCode}
                  disabled={isConnecting}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    if (error) setError(null);
                  }}
                  className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 w-full font-mono"
               />
               <button 
                  onClick={handleJoin}
                  disabled={!joinCode || isConnecting}
                  className="ml-2 text-legal-900 font-bold hover:text-accent-gold disabled:opacity-30 uppercase text-sm flex items-center gap-2"
               >
                  {isConnecting ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
               </button>
            </div>
         </div>

         {/* Salas Recentes Section */}
         {history.length > 0 && (
           <div className="space-y-4 mb-12 animate-in slide-in-from-left-4">
              <div className="flex items-center gap-2 text-legal-400 font-bold text-xs uppercase tracking-widest mb-2">
                 <History size={14}/>
                 Histórico de Audiências
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {history.map((entry) => (
                   <button 
                     key={entry.roomId} 
                     onClick={() => handleReconnect(entry)}
                     disabled={isConnecting}
                     className="bg-white border border-slate-200 p-4 rounded-2xl text-left hover:border-accent-gold hover:shadow-md transition-all group disabled:opacity-50"
                   >
                      <div className="flex justify-between items-start mb-2">
                         <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-accent-gold/10 transition-colors">
                            {entry.role === CourtRole.JUDGE ? <Gavel size={16} className="text-legal-700"/> : <UserIcon size={16} className="text-legal-700"/>}
                         </div>
                         <span className="text-[10px] font-mono text-slate-400">#{entry.roomId.split('-').pop()}</span>
                      </div>
                      <p className="text-sm font-bold text-legal-900 truncate mb-1">{entry.title || "Audiência sem título"}</p>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-accent-gold uppercase tracking-tighter">{entry.role}</span>
                         <ArrowRight size={12} className="text-slate-300 group-hover:text-accent-gold transform group-hover:translate-x-1 transition-all"/>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
         )}

         <div className="border-t border-gray-200 pt-8">
            <div className="flex gap-8 text-sm text-gray-500">
               <div className="flex items-center gap-2"><Shield size={16}/> <span>Seguro</span></div>
               <div className="flex items-center gap-2"><Users size={16}/> <span>Multi-papeis</span></div>
            </div>
         </div>
      </div>

      {/* Right Column: Visual/Hero */}
      <div className="hidden md:flex flex-1 bg-legal-900 relative overflow-hidden items-center justify-center text-white p-12">
         <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
         
         <div className="relative z-10 text-center space-y-2">
            <div className="text-7xl font-serif font-thin tracking-wider">
               {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="flex items-center justify-center gap-2 text-legal-300 uppercase tracking-widest text-sm font-medium">
               <Calendar size={14}/>
               {new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})}
            </div>
         </div>
      </div>
    </div>
  );
};
