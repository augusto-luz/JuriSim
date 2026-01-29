
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SCENARIOS } from '../constants.ts';
import { persistenceService } from '../services/persistence.ts';
import { Scenario, User, UserRole, UserPerformance, SocialMessage } from '../types.ts';
import { 
  Search, BookOpen, Play, FileText, Users,
  Trophy, MessageCircle, Activity, Clock, CheckCircle, Fingerprint, AlertCircle, Plus, Trash2,
  TrendingUp, Send, UserPlus, Info
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar as RadarArea, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

interface ScenariosViewProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
}

const COLORS = ['#102a43', '#c5a065', '#486581', '#829ab1', '#627d98'];

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onStartScenario, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'my_cases' | 'social' | 'ranking'>('library');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [socialSearch, setSocialSearch] = useState('');
  const [socialStatus, setSocialStatus] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friendsIds, setFriendsIds] = useState<string[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<SocialMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [allPerformances, setAllPerformances] = useState<UserPerformance[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    loadData(); 
    const handleRefresh = () => loadData();
    window.addEventListener('CASE_CREATED', handleRefresh);
    return () => window.removeEventListener('CASE_CREATED', handleRefresh);
  }, [user.id, activeTab]);

  useEffect(() => {
    if (selectedFriend) {
      const msgs = persistenceService.getSocialMessages(user.id, selectedFriend.id);
      setChatMessages(msgs);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedFriend]);

  const loadData = async () => {
    if (activeTab === 'library') {
      const custom = await persistenceService.getCustomScenarios();
      const all = [...SCENARIOS, ...custom];
      setScenarios(all.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })));
    } else if (activeTab === 'my_cases') {
      const custom = await persistenceService.getCustomScenarios();
      const all = [...SCENARIOS, ...custom];
      const nativeProgress = all.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })).filter(s => s.progress > 0);
      setScenarios(nativeProgress.sort((a,b) => b.progress - a.progress));
    } else if (activeTab === 'social' || activeTab === 'ranking') {
      const globalUsers = await persistenceService.getAllUsers();
      setAllUsers(globalUsers);
      setFriendsIds(persistenceService.getFriends(user.id));
      setAllPerformances(persistenceService.getGlobalRankings());
    }
  };

  const handleAddFriendById = () => {
    const searchId = socialSearch.trim().toUpperCase();
    if (!searchId) return;
    if (searchId === user.id) {
      setSocialStatus({msg: "Você não pode adicionar a si mesmo.", type: 'error'});
      return;
    }

    const target = allUsers.find(u => u.id === searchId);
    if (target) {
      persistenceService.addFriend(user.id, target.id);
      setFriendsIds(persistenceService.getFriends(user.id));
      setSocialStatus({msg: `Doutor(a) ${target.name} adicionado(a)!`, type: 'success'});
      setSocialSearch('');
      setTimeout(() => setSocialStatus(null), 3000);
    } else {
      setSocialStatus({msg: "ID não encontrado no banco de dados.", type: 'error'});
      setTimeout(() => setSocialStatus(null), 3000);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedFriend) return;
    const msg: SocialMessage = {
      id: Date.now().toString(),
      fromId: user.id,
      toId: selectedFriend.id,
      text: chatInput,
      timestamp: Date.now()
    };
    persistenceService.saveSocialMessage(msg);
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Excluir este caso permanentemente?")) {
      persistenceService.deleteCustomScenario(id);
      loadData();
    }
  };

  const sortedRankings = useMemo(() => {
    return [...allPerformances].sort((a, b) => {
      const avgA = (a.avgOratory + a.avgProcedural + a.avgEvidence) / 3;
      const avgB = (b.avgOratory + b.avgProcedural + b.avgEvidence) / 3;
      return avgB - avgA;
    });
  }, [allPerformances]);

  const topChartsData = useMemo(() => {
    return sortedRankings.slice(0, 5).map(r => ({
      name: r.userName.split(' ')[0],
      score: Math.round((r.avgOratory + r.avgProcedural + r.avgEvidence) / 3)
    }));
  }, [sortedRankings]);

  const groupedScenarios = useMemo(() => {
    if (activeTab !== 'library' && activeTab !== 'my_cases') return null;
    const filtered = scenarios.filter(s => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.area.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const groups: Record<string, Scenario[]> = {};
    filtered.forEach(s => {
      if (!groups[s.area]) groups[s.area] = [];
      groups[s.area].push(s);
    });
    return groups;
  }, [scenarios, searchTerm, activeTab]);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-2xl md:text-3xl font-serif font-bold text-legal-900">Acervo Jurisprudencial</h1>
           <p className="text-xs md:text-sm text-slate-500">Biblioteca, Networking e Analytics de Performance.</p>
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent('OPEN_CASE_MODAL'))} className="w-full md:w-auto bg-legal-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-lg active:scale-95">
           <Plus size={18}/> Novo Caso
        </button>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 w-full md:w-fit overflow-x-auto custom-scrollbar">
          <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} label="Biblioteca Global" icon={BookOpen} />
          <TabButton active={activeTab === 'my_cases'} onClick={() => setActiveTab('my_cases')} label="Meus Estudos" icon={FileText} />
          <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} label="Networking" icon={Users} />
          <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} label="Rankings & Elite" icon={Trophy} />
      </div>

      {(activeTab === 'library' || activeTab === 'my_cases') && (
        <div className="space-y-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar autos e teses..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-sm text-sm" />
          </div>
          
          {groupedScenarios ? (
            (Object.entries(groupedScenarios) as [string, Scenario[]][]).map(([area, areaScenarios]) => (
              <div key={area} className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-2">
                   <h2 className="text-lg md:text-xl font-serif font-bold text-legal-900">{area}</h2>
                   <span className="bg-legal-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{areaScenarios.length} Casos</span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {areaScenarios.map(scenario => (
                    <CaseCard key={scenario.id} scenario={scenario} onStart={onStartScenario} currentUserId={user.id} onDelete={handleDeleteScenario} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-slate-400 italic">Nenhum caso encontrado para os critérios de busca.</div>
          )}
        </div>
      )}

      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 min-h-[500px] animate-in slide-in-from-bottom-4">
           <div className="lg:col-span-1 bg-white rounded-[2rem] md:rounded-[2.5rem] border shadow-sm p-6 flex flex-col gap-6 overflow-hidden">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adicionar por ID JURI</label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                       <input 
                         value={socialSearch} 
                         onChange={e=>setSocialSearch(e.target.value)} 
                         placeholder="JURI-XXXX" 
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-accent-gold"
                       />
                    </div>
                    <button onClick={handleAddFriendById} className="p-3 bg-legal-900 text-white rounded-xl hover:bg-accent-gold hover:text-legal-900 transition shadow-md">
                       <UserPlus size={18}/>
                    </button>
                 </div>
                 {socialStatus && (
                    <div className={`text-[10px] font-bold p-2 rounded-lg flex items-center gap-2 animate-pulse ${socialStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                       {socialStatus.type === 'error' ? <AlertCircle size={12}/> : <CheckCircle size={12}/>}
                       {socialStatus.msg}
                    </div>
                 )}
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span>Meus Contatos</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{friendsIds.length}</span>
                 </h4>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {friendsIds.map(fid => {
                       const f = allUsers.find(u => u.id === fid);
                       if (!f) return null;
                       return (
                          <button 
                            key={fid} 
                            onClick={() => setSelectedFriend(f)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedFriend?.id === fid ? 'bg-slate-50 border-accent-gold shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                          >
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-legal-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">{f.name.charAt(0)}</div>
                                <div className="text-left">
                                   <p className="text-xs font-bold text-legal-900 truncate max-w-[100px] md:max-w-[120px]">{f.name}</p>
                                   <p className="text-[10px] text-slate-400 font-mono">{f.id}</p>
                                </div>
                             </div>
                          </button>
                       );
                    })}
                    {friendsIds.length === 0 && <div className="text-center py-12 text-slate-300 italic text-xs">Sua rede está vazia. Adicione colegas pelo ID.</div>}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2 bg-white rounded-[2rem] md:rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col relative min-h-[400px]">
              {selectedFriend ? (
                 <>
                    <div className="p-4 md:p-6 bg-slate-50 border-b flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-legal-900 text-accent-gold flex items-center justify-center font-bold shadow-lg text-sm md:text-lg">{selectedFriend.name.charAt(0)}</div>
                          <div>
                             <h3 className="text-sm md:text-lg font-serif font-bold text-legal-900">{selectedFriend.name}</h3>
                             <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedFriend.role} • {selectedFriend.id}</p>
                          </div>
                       </div>
                       <button className="p-2 text-slate-400 hover:text-legal-900 transition"><Info size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-slate-50/20">
                       {chatMessages.map(msg => (
                          <div key={msg.id} className={`flex flex-col ${msg.fromId === user.id ? 'items-end' : 'items-start'}`}>
                             <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm border break-words overflow-hidden ${msg.fromId === user.id ? 'bg-legal-900 text-white border-legal-800 rounded-tr-none' : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'}`}>
                                <p className="text-xs md:text-sm leading-relaxed">{msg.text}</p>
                             </div>
                             <span className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                       ))}
                       <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 md:p-6 border-t bg-white">
                       <div className="flex gap-2 md:gap-3 max-w-4xl mx-auto">
                          <input 
                            value={chatInput} 
                            onChange={e=>setChatInput(e.target.value)} 
                            onKeyDown={e=>e.key==='Enter' && handleSendMessage()}
                            placeholder="Mensagem profissional..." 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-accent-gold transition text-xs md:text-sm shadow-inner"
                          />
                          <button onClick={handleSendMessage} className="bg-legal-900 text-white w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg hover:bg-accent-gold hover:text-legal-900 transition active:scale-95 shrink-0">
                             <Send size={18}/>
                          </button>
                       </div>
                    </div>
                 </>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                    <MessageCircle size={48} className="mb-4 text-slate-200"/>
                    <h3 className="text-lg font-serif font-bold text-slate-400">Networking Corporativo</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-2">Selecione um colega para iniciar o diálogo.</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'ranking' && (
         <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {sortedRankings.slice(0, 3).map((rank, i) => (
                  <div key={rank.userId} className={`bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border shadow-md relative overflow-hidden flex flex-col items-center text-center ${i === 0 ? 'ring-2 ring-accent-gold md:scale-105' : ''}`}>
                     {i === 0 && <div className="absolute top-0 right-0 bg-accent-gold text-legal-900 px-4 py-1 rounded-bl-xl font-black text-[9px] uppercase tracking-widest">Master Elite</div>}
                     <div className="relative mb-4 md:mb-6">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-bold text-lg md:text-xl border-4 ${i === 0 ? 'bg-legal-900 text-white border-accent-gold shadow-xl' : 'bg-slate-100 text-slate-400 border-white shadow-sm'}`}>
                           {rank.userName.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white flex items-center justify-center text-white font-black shadow-lg text-xs md:text-sm ${i === 0 ? 'bg-accent-gold' : i === 1 ? 'bg-slate-400' : 'bg-amber-600'}`}>
                           {i + 1}
                        </div>
                     </div>
                     <h4 className="text-sm md:text-lg font-serif font-bold text-legal-900 truncate w-full">{rank.userName}</h4>
                     <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 mb-4">{rank.totalSimulations} Audiências</p>
                     <div className="w-full grid grid-cols-3 gap-1 md:gap-2 border-t pt-4">
                        <div className="text-center"><p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">ORA</p><p className="text-[10px] md:text-xs font-black text-legal-900">{rank.avgOratory}%</p></div>
                        <div className="text-center"><p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">PROC</p><p className="text-[10px] md:text-xs font-black text-legal-900">{rank.avgProcedural}%</p></div>
                        <div className="text-center"><p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">PROV</p><p className="text-[10px] md:text-xs font-black text-legal-900">{rank.avgEvidence}%</p></div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border shadow-sm overflow-hidden">
               <div className="p-6 md:p-8 border-b bg-slate-50 flex justify-between items-center">
                  <div>
                     <h3 className="text-lg md:text-xl font-serif font-bold text-legal-900">Elite Leaderboard</h3>
                     <p className="text-[10px] md:text-xs text-slate-500">Métricas oficiais avaliadas por IA.</p>
                  </div>
                  <TrendingUp className="text-accent-gold" size={20}/>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white border-b">
                           <th className="px-4 py-3 md:px-6 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Posição</th>
                           <th className="px-4 py-3 md:px-6 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Profissional</th>
                           <th className="px-4 py-3 md:px-6 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Score Médio</th>
                           <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Estatísticas</th>
                           <th className="px-4 py-3 md:px-6 md:py-4 text-right text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Social</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {sortedRankings.map((rank, i) => (
                           <tr key={rank.userId} className={`hover:bg-slate-50 transition-colors ${rank.userId === user.id ? 'bg-accent-gold/5' : ''}`}>
                              <td className="px-4 py-3 md:px-6 md:py-4">
                                 <span className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black ${i < 3 ? 'bg-legal-900 text-accent-gold' : 'bg-slate-100 text-slate-400'}`}>
                                    {i + 1}
                                 </span>
                              </td>
                              <td className="px-4 py-3 md:px-6 md:py-4">
                                 <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[9px] uppercase shadow-sm">{rank.userName.charAt(0)}</div>
                                    <span className="text-[10px] md:text-xs font-bold text-legal-900 truncate max-w-[80px] md:max-w-none">{rank.userName}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-3 md:px-6 md:py-4">
                                 <div className="flex items-center gap-2 md:gap-4">
                                    <div className="flex-1 min-w-[60px] md:min-w-[100px] h-1 md:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-legal-900 rounded-full" style={{width: `${(rank.avgOratory + rank.avgProcedural + rank.avgEvidence) / 3}%`}}/>
                                    </div>
                                    <span className="text-[10px] md:text-xs font-black text-legal-900">{Math.round((rank.avgOratory + rank.avgProcedural + rank.avgEvidence) / 3)}%</span>
                                 </div>
                              </td>
                              <td className="hidden md:table-cell px-6 py-4">
                                 <div className="flex gap-2">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-tighter">{rank.totalSimulations} Sim.</span>
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase tracking-tighter">{Math.round(rank.totalExerciseTime / 60)}h</span>
                                 </div>
                              </td>
                              <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                                 <button onClick={() => { setSelectedFriend(allUsers.find(u=>u.id===rank.userId) || null); setActiveTab('social'); }} className="p-1.5 md:p-2 text-slate-400 hover:text-legal-900 transition"><MessageCircle size={14}/></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {sortedRankings.length === 0 && <div className="p-12 text-center text-slate-400 italic text-sm">Nenhuma performance registrada ainda.</div>}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const CaseCard = ({ scenario, onStart, currentUserId, onDelete }: any) => {
  const isCompleted = scenario.progress === 100;
  const isOwner = scenario.createdBy === currentUserId;

  return (
    <div className={`bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row group ${isCompleted ? 'border-green-100 bg-green-50/5' : ''}`}>
       <div className="p-6 md:p-8 flex-1">
          <div className="flex justify-between items-start mb-3 md:mb-4">
             <div className="flex gap-2">
                <span className="text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 bg-legal-900 text-white rounded-full uppercase tracking-widest">{scenario.area}</span>
                {isOwner && <span className="text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 bg-accent-gold/10 text-accent-gold rounded-full uppercase tracking-widest border border-accent-gold/20">Meu Caso</span>}
             </div>
             {isOwner && (
               <button onClick={(e) => onDelete(scenario.id, e)} className="p-2 text-slate-300 hover:text-red-600 transition opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
             )}
          </div>
          <h3 className="text-lg md:text-xl font-serif font-bold text-legal-900 mb-2 truncate">{scenario.title}</h3>
          <p className="text-slate-500 text-xs md:text-sm line-clamp-2 italic mb-4 md:mb-6 leading-relaxed">"{scenario.facts}"</p>
          <div className="flex items-center gap-4">
             <div className="flex-1 bg-slate-100 h-1 md:h-1.5 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-accent-gold'}`} style={{width: `${scenario.progress}%`}}/>
             </div>
             <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">{scenario.progress}%</span>
          </div>
       </div>
       <div className="p-6 md:p-8 bg-slate-50 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 shrink-0">
          <button onClick={() => onStart(scenario.id)} className={`w-full md:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${isCompleted ? 'bg-white text-legal-900 border border-slate-200 hover:bg-slate-100' : 'bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900'}`}>
             <Play size={14} fill="currentColor"/> {isCompleted ? 'Revisar Autos' : 'Iniciar Sessão'}
          </button>
       </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${active ? 'bg-white text-legal-900 border-slate-200' : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100'}`}>
    <Icon size={14} className="md:w-4 md:h-4"/> {label}
  </button>
);
