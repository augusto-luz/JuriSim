
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole, UserPerformance, SocialMessage } from '../types';
import { 
  Search, BookOpen, Play, FileText, PlusCircle, Users,
  Trophy, Send, Scale, UserPlus, MessageCircle, Radar, Activity, Clock, ShieldCheck, CheckCircle, Fingerprint, UserCheck, AlertCircle
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarArea, ResponsiveContainer, Tooltip
} from 'recharts';

interface ScenariosViewProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onStartScenario, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'my_cases' | 'social' | 'ranking'>('library');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [socialSearch, setSocialSearch] = useState('');
  const [allPerformances, setAllPerformances] = useState<UserPerformance[]>([]);
  const [friendsIds, setFriendsIds] = useState<string[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserPerformance | null>(null);
  const [socialChat, setSocialChat] = useState<SocialMessage[]>([]);
  const [socialInput, setSocialInput] = useState('');
  const [socialStatus, setSocialStatus] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, [user.id, activeTab]);

  useEffect(() => {
    if (selectedFriend) {
      setSocialChat(persistenceService.getSocialMessages(user.id, selectedFriend.userId));
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedFriend]);

  const loadData = () => {
    if (activeTab === 'library') {
      setScenarios(SCENARIOS.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })));
    } else if (activeTab === 'my_cases') {
      const custom = persistenceService.getCustomScenarios(user.id);
      const nativeProgress = SCENARIOS.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })).filter(s => s.progress > 0);
      setScenarios([...nativeProgress, ...custom].sort((a,b) => b.progress - a.progress));
    } else if (activeTab === 'social' || activeTab === 'ranking') {
      const global = persistenceService.getGlobalRankings(user);
      setAllPerformances(global);
      setFriendsIds(persistenceService.getFriends(user.id));
    }
  };

  const handleAddFriend = (friendId: string) => {
    if (friendId === user.id) {
        setSocialStatus({msg: "Você não pode adicionar a si mesmo.", type: 'error'});
        return;
    }
    persistenceService.addFriend(user.id, friendId);
    setFriendsIds(persistenceService.getFriends(user.id));
    setSocialStatus({msg: "Colega adicionado com sucesso!", type: 'success'});
    setTimeout(() => setSocialStatus(null), 3000);
  };

  const handleQuickAdd = () => {
    const target = allPerformances.find(p => p.userId === socialSearch || p.userName.toLowerCase() === socialSearch.toLowerCase());
    if (target) {
        handleAddFriend(target.userId);
        setSocialSearch('');
    } else {
        setSocialStatus({msg: "Usuário não encontrado. Verifique o ID exato.", type: 'error'});
        setTimeout(() => setSocialStatus(null), 3000);
    }
  };

  const handleSendSocial = () => {
    if (!socialInput.trim() || !selectedFriend) return;
    const msg: SocialMessage = { id: Date.now().toString(), fromId: user.id, toId: selectedFriend.userId, text: socialInput, timestamp: Date.now() };
    persistenceService.saveSocialMessage(msg);
    setSocialChat(prev => [...prev, msg]);
    setSocialInput('');
  };

  const filteredSocial = allPerformances.filter(p => 
    p.userId !== user.id && (
      p.userName.toLowerCase().includes(socialSearch.toLowerCase()) || 
      p.userId.toLowerCase().includes(socialSearch.toLowerCase())
    )
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-3xl font-serif font-bold text-legal-900">Hub Jurídico Digital</h1>
           <p className="text-sm text-slate-500">Biblioteca, Networking e Analytics de Performance.</p>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 w-fit overflow-x-auto custom-scrollbar">
          <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} label="Biblioteca Global" icon={BookOpen} />
          <TabButton active={activeTab === 'my_cases'} onClick={() => setActiveTab('my_cases')} label="Meus Estudos" icon={FileText} />
          <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} label="Advocacia Digital" icon={Users} />
          <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} label="Elite Rankings" icon={Trophy} />
      </div>

      {/* VIEW: BIBLIOTECA / MEUS ESTUDOS */}
      {(activeTab === 'library' || activeTab === 'my_cases') && (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar autos e teses..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {scenarios.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map(scenario => (
              <CaseCard key={scenario.id} scenario={scenario} onStart={onStartScenario} />
            ))}
          </div>
        </>
      )}

      {/* VIEW: SOCIAL (ADVOCACIA DIGITAL) */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
           {/* Pesquisa e Amigos */}
           <div className="lg:col-span-1 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesquisar ou Adicionar por ID</label>
                 <div className="relative flex gap-2">
                    <div className="relative flex-1">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                       <input 
                          value={socialSearch} 
                          onChange={e=>setSocialSearch(e.target.value)} 
                          placeholder="Nome ou ID do colega..." 
                          className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-accent-gold outline-none transition" 
                       />
                    </div>
                    <button 
                       onClick={handleQuickAdd}
                       className="px-4 bg-legal-900 text-white rounded-xl hover:bg-accent-gold hover:text-legal-900 transition flex items-center justify-center shadow-md active:scale-95"
                       title="Adicionar Amigo Direto"
                    >
                       <UserPlus size={18}/>
                    </button>
                 </div>
                 {socialStatus && (
                    <div className={`mt-2 p-2 rounded-lg text-[10px] font-bold flex items-center gap-2 animate-in slide-in-from-top-1 ${socialStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                       {socialStatus.type === 'error' ? <AlertCircle size={12}/> : <CheckCircle size={12}/>}
                       {socialStatus.msg}
                    </div>
                 )}
              </div>
              
              <div className="bg-white rounded-3xl border p-6 space-y-4 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Advogados na Rede</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{filteredSocial.length}</span>
                 </h4>
                 <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                    {filteredSocial.length > 0 ? filteredSocial.map(p => (
                       <div key={p.userId} className={`flex items-center justify-between p-3 rounded-xl transition-all border ${selectedFriend?.userId === p.userId ? 'bg-slate-50 border-slate-200' : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className="w-10 h-10 rounded-full bg-legal-900 text-white flex items-center justify-center font-bold text-xs shrink-0">{p.userName.charAt(0)}</div>
                             <div className="overflow-hidden">
                                <p className="text-xs font-bold text-legal-900 truncate">{p.userName}</p>
                                <p className="text-[9px] text-slate-400 font-mono truncate">ID: {p.userId}</p>
                             </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                             <button onClick={() => setSelectedFriend(p)} className="p-2 text-legal-400 hover:text-legal-900 transition" title="Ver Perfil/Chat"><MessageCircle size={16}/></button>
                             {friendsIds.includes(p.userId) ? (
                                <div className="p-2 text-green-500" title="Já é seu amigo"><UserCheck size={16}/></div>
                             ) : (
                                <button onClick={() => handleAddFriend(p.userId)} className="p-2 text-accent-gold hover:text-yellow-600 transition" title="Adicionar Amigo"><UserPlus size={16}/></button>
                             )}
                          </div>
                       </div>
                    )) : (
                       <div className="py-8 text-center text-slate-400 text-xs italic">Nenhum colega encontrado com este critério.</div>
                    )}
                 </div>
              </div>
           </div>

           {/* Perfil e Chat do Amigo Selecionado */}
           <div className="lg:col-span-2 space-y-6">
              {selectedFriend ? (
                 <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4">
                          {friendsIds.includes(selectedFriend.userId) ? (
                             <span className="text-[9px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-widest">Conectado</span>
                          ) : (
                             <button onClick={() => handleAddFriend(selectedFriend.userId)} className="text-[9px] font-black text-accent-gold bg-accent-gold/5 px-3 py-1 rounded-full border border-accent-gold/20 hover:bg-accent-gold hover:text-white transition uppercase tracking-widest">Conectar</button>
                          )}
                       </div>
                       <div className="w-32 h-32 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { s: 'O', v: selectedFriend.avgOratory },
                                { s: 'P', v: selectedFriend.avgProcedural },
                                { s: 'E', v: selectedFriend.avgEvidence },
                             ]}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="s" tick={false} />
                                <RadarArea dataKey="v" stroke="#c5a065" fill="#c5a065" fillOpacity={0.6} />
                             </RadarChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="text-center md:text-left flex-1">
                          <h3 className="text-2xl font-serif font-bold text-legal-900">{selectedFriend.userName}</h3>
                          <p className="text-[10px] font-mono text-slate-400 flex items-center justify-center md:justify-start gap-1 mt-1"><Fingerprint size={12}/> ID: {selectedFriend.userId}</p>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                             <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase">Oratória</p><p className="font-bold text-legal-900">{selectedFriend.avgOratory}%</p></div>
                             <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase">Processual</p><p className="font-bold text-legal-900">{selectedFriend.avgProcedural}%</p></div>
                             <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase">Provas</p><p className="font-bold text-legal-900">{selectedFriend.avgEvidence}%</p></div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border shadow-sm h-[400px] flex flex-col overflow-hidden">
                       <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-xs font-bold text-legal-900">Mensagens Privadas</span>
                          </div>
                          <button onClick={() => setSelectedFriend(null)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase transition">Fechar Chat</button>
                       </div>
                       <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
                          {socialChat.length > 0 ? socialChat.map(m => (
                             <div key={m.id} className={`flex ${m.fromId === user.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-4 rounded-2xl text-xs max-w-[70%] shadow-sm ${m.fromId === user.id ? 'bg-legal-900 text-white rounded-tr-none' : 'bg-white text-legal-900 border border-slate-100 rounded-tl-none'}`}>
                                   {m.text}
                                   <p className="text-[8px] mt-1 opacity-50 text-right">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                             </div>
                          )) : (
                             <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-xs">
                                <MessageCircle size={32} className="mb-2 opacity-20"/>
                                Inicie uma conversa com este colega.
                             </div>
                          )}
                          <div ref={chatEndRef}/>
                       </div>
                       <div className="p-4 border-t bg-white flex gap-2">
                          <input 
                             value={socialInput} 
                             onChange={e=>setSocialInput(e.target.value)} 
                             onKeyDown={e=>e.key==='Enter' && handleSendSocial()} 
                             placeholder="Escreva sua mensagem jurídica..." 
                             className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-accent-gold transition" 
                          />
                          <button onClick={handleSendSocial} className="w-12 h-12 bg-legal-900 text-white rounded-xl flex items-center justify-center hover:bg-accent-gold hover:text-legal-900 transition-all shadow-lg active:scale-95">
                             <Send size={18}/>
                          </button>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 p-12 border-2 border-dashed rounded-[2.5rem] bg-white">
                    <Users size={64} className="mb-4 text-slate-200"/>
                    <h3 className="text-xl font-serif font-bold text-slate-400">Networking Ativo</h3>
                    <p className="text-sm max-w-xs text-center mt-2">Selecione um colega da rede ou pesquise pelo ID para ver sua performance e iniciar uma troca de conhecimento.</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* VIEW: RANKING */}
      {activeTab === 'ranking' && (
         <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-serif font-bold text-legal-900">Elite do Tribunal Virtual</h3>
            <div className="grid grid-cols-1 gap-4">
               {allPerformances.map((p, idx) => (
                  <div key={p.userId} className={`p-6 bg-white rounded-2xl border flex items-center justify-between transition-all ${p.userId === user.id ? 'border-accent-gold shadow-lg ring-1 ring-accent-gold' : 'border-slate-100'}`}>
                     <div className="flex items-center gap-6">
                        <span className="text-2xl font-black text-slate-200 w-8">#{idx+1}</span>
                        <div className="w-12 h-12 rounded-xl bg-legal-900 text-white flex items-center justify-center font-bold">{p.userName.charAt(0)}</div>
                        <div>
                           <p className="font-bold text-legal-900">{p.userName}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{p.totalSimulations} CASOS PROTOCOLADOS</p>
                        </div>
                     </div>
                     <div className="flex gap-8 text-right hidden md:flex">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Oratória</p><p className="font-bold text-legal-900">{p.avgOratory}%</p></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Processual</p><p className="font-bold text-legal-900">{p.avgProcedural}%</p></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Score Geral</p><p className="font-bold text-accent-gold">{Math.round((p.avgOratory + p.avgProcedural + p.avgEvidence)/3)}%</p></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

const CaseCard = ({ scenario, onStart }: any) => {
  const isCompleted = scenario.progress === 100;
  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row ${isCompleted ? 'border-green-100' : ''}`}>
       <div className="p-8 flex-1">
          <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-black px-3 py-1 bg-legal-900 text-white rounded-full uppercase tracking-widest">{scenario.area}</span>
             {isCompleted && <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase bg-green-50 px-3 py-1 rounded-full"><CheckCircle size={12}/> Estudo Disponível</span>}
          </div>
          <h3 className="text-xl font-serif font-bold text-legal-900 mb-2">{scenario.title}</h3>
          <p className="text-slate-500 text-sm line-clamp-2 italic mb-6">"{scenario.facts}"</p>
          <div className="flex items-center gap-4">
             <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-accent-gold'}`} style={{width: `${scenario.progress}%`}}/>
             </div>
             <span className="text-xs font-bold text-slate-400">{scenario.progress}%</span>
          </div>
       </div>
       <div className="p-8 bg-slate-50 flex items-center justify-center border-l border-slate-100">
          <button onClick={() => onStart(scenario.id)} className={`px-8 py-4 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 ${isCompleted ? 'bg-white text-legal-900 border border-slate-200 hover:bg-slate-100' : 'bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900'}`}>
             <Play size={16} fill="currentColor"/> {isCompleted ? 'Rever Transcrição' : 'Iniciar Audiência'}
          </button>
       </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-white text-legal-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
    <Icon size={16}/> {label}
  </button>
);
