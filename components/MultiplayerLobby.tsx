import React from 'react';
import { Video, Keyboard, Users, Shield, Globe, Clock, Calendar } from 'lucide-react';
import { User } from '../types';

interface MultiplayerLobbyProps {
  onStartNewMeeting: () => void;
  onJoinMeeting: () => void;
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
  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 animate-in fade-in">
      
      {/* Left Column: Actions */}
      <div className="flex-1 p-8 md:p-12 flex flex-col justify-center max-w-2xl">
         <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-legal-900 mb-6 leading-tight">
               Audiências Simuladas <br/> em <span className="text-accent-gold">Tempo Real</span>.
            </h1>
            <p className="text-lg text-legal-600 mb-8 leading-relaxed">
               Conecte-se com colegas, professores ou advogados para praticar a oratória e o procedimento em um tribunal virtual seguro e interativo.
            </p>
         </div>

         <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button 
               onClick={onStartNewMeeting}
               className="flex items-center justify-center gap-3 bg-legal-900 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-legal-800 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 transform"
            >
               <Video size={24}/>
               Nova Audiência
            </button>
            
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-legal-500 focus-within:border-transparent transition">
               <Keyboard className="text-gray-400 mr-3" size={24}/>
               <input 
                  type="text" 
                  placeholder="Código da sala" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 w-full font-mono"
               />
               <button 
                  onClick={onJoinMeeting}
                  disabled={!joinCode}
                  className="ml-2 text-legal-900 font-bold hover:text-accent-gold disabled:opacity-30 disabled:cursor-not-allowed uppercase text-sm"
               >
                  Entrar
               </button>
            </div>
         </div>

         <div className="border-t border-gray-200 pt-8">
            <div className="flex gap-8 text-sm text-gray-500">
               <div className="flex items-center gap-2">
                  <Shield size={16}/> <span>Ambiente Seguro</span>
               </div>
               <div className="flex items-center gap-2">
                  <Users size={16}/> <span>Multi-papéis</span>
               </div>
               <div className="flex items-center gap-2">
                  <Globe size={16}/> <span>Via WebRTC (P2P)</span>
               </div>
            </div>
         </div>
      </div>

      {/* Right Column: Visual/Hero */}
      <div className="hidden md:flex flex-1 bg-legal-900 relative overflow-hidden items-center justify-center text-white p-12">
         {/* Background Effects */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
         
         {/* Date/Time Widget */}
         <div className="relative z-10 text-center space-y-2">
            <div className="text-7xl font-serif font-thin tracking-wider">
               {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="flex items-center justify-center gap-2 text-legal-300 uppercase tracking-widest text-sm font-medium">
               <Calendar size={14}/>
               {new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})}
            </div>
         </div>

         {/* Carousel / Tips (Static for now) */}
         <div className="absolute bottom-12 left-12 right-12 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
             <div className="flex items-start gap-4">
                 <div className="bg-accent-gold p-2 rounded-lg text-legal-900">
                    <Clock size={20}/>
                 </div>
                 <div>
                    <h4 className="font-bold text-white mb-1">Próxima Sessão Recomendada</h4>
                    <p className="text-legal-200 text-sm">Simulação de Instrução - Caso 042 (Roubo). <span className="text-white underline cursor-pointer">Agendar</span></p>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};