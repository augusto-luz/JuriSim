
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole, UserPerformance, SocialMessage } from '../types';
import { 
  Search, BookOpen, Play, FileText, PlusCircle, Users,
  Trophy, Send, Scale, UserPlus, MessageCircle, Radar, Activity, Clock, ShieldCheck, CheckCircle
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
  const [selectedFriend, setSelectedFriend] = useState<UserPerformance | null>(null);
  const [socialChat, setSocialChat] = useState<SocialMessage[]>([]);
  const [socialInput, setSocialInput] = useState('');
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
      setAllPerformances(persistenceService.getGlobalRankings(user));
    }
  };

  const handleSendSocial = () => {
    if (!socialInput.trim() || !selectedFriend) return;
    const msg: SocialMessage = { id: Date.now().toString(), fromId: user.id, toId: selectedFriend.userId, text: socialInput, timestamp: Date.now() };
    persistenceService.saveSocialMessage(msg);
    setSocialChat(prev => [...prev, msg]);
    setSocialInput('');
  };

  const friendsIds = useMemo(() => persistenceService.getFriends(user.id), [user.id]);
  
  const filteredSocial = allPerformances.filter(p => 
    p.userId !== user.id && p.userName.toLowerCase().includes(socialSearch.toLowerCase())
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
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 <input value={socialSearch} onChange={e=>setSocialSearch(e.target.value)} placeholder="Buscar advogados..." className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl text-sm" />
              </div>
              
              <div className="bg-white rounded-3xl border p-6 space-y-4 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advogados na Rede</h4>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {filteredSocial.map(p => (
                       <div key={p.userId} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition group">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-legal-900 text-white flex items-center justify-center font-bold text-xs">{p.userName.charAt(0)}</div>
                             <div>
                                <p className="text-xs font-bold text-legal-900">{p.userName}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-bold">{p.totalSimulations} Simulações</p>
                             </div>
                          </div>
                          <div className="flex gap-1">
                             <button onClick={() => setSelectedFriend(p)} className="p-2 text-legal-400 hover:text-legal-900 transition"><MessageCircle size={16}/></button>
                             {!friendsIds.includes(p.userId) && (
                                <button onClick={() => { persistenceService.addFriend(user.id, p.userId); loadData(); }} className="p-2 text-accent-gold hover:text-yellow-600 transition"><UserPlus size={16}/></button>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Perfil e Chat do Amigo Selecionado */}
           <div className="lg:col-span-2 space-y-6">
              {selectedFriend ? (
                 <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row gap-8 items-center">
                       <div className="w-32 h-32 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { s: 'O', v: selectedFriend.avgOratory },
                                { s: 'P', v: selectedFriend.avgProcedural },
                                { s: 'E', v: selectedFriend.avgEvidence },
                             ]}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="s" tick={false} />
                                <RadarArea dataKey="v" stroke="#102a43" fill="#102a43" fillOpacity={0.6} />
                             </RadarChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="text-center md:text-left flex-1">
                          <h3 className="text-2xl font-serif font-bold text-legal-900">{selectedFriend.userName}</h3>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                             <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Oratória</p><p className="font-bold">{selectedFriend.avgOratory}%</p></div>
                             <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Processual</p><p className="font-bold">{selectedFriend.avgProcedural}%</p></div>
                             <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Provas</p><p className="font-bold">{selectedFriend.avgEvidence}%</p></div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border shadow-sm h-[400px] flex flex-col overflow-hidden">
                       <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                          <span className="text-xs font-bold text-legal-900">Mensagens Privadas</span>
                          <button onClick={() => setSelectedFriend(null)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase">Fechar</button>
                       </div>
                       <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                          {socialChat.map(m => (
                             <div key={m.id} className={`flex ${m.fromId === user.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-2xl text-xs max-w-[70%] ${m.fromId === user.id ? 'bg-legal-900 text-white rounded-tr-none' : 'bg-slate-100 text-legal-900 rounded-tl-none'}`}>
                                   {m.text}
                                </div>
                             </div>
                          ))}
                          <div ref={chatEndRef}/>
                       </div>
                       <div className="p-4 border-t bg-slate-50 flex gap-2">
                          <input value={socialInput} onChange={e=>setSocialInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleSendSocial()} placeholder="Escreva uma mensagem..." className="flex-1 px-4 py-2 border rounded-xl text-xs" />
                          <button onClick={handleSendSocial} className="p-2 bg-legal-900 text-white rounded-xl"><Send size={16}/></button>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 p-12 border-2 border-dashed rounded-[2.5rem]">
                    <Users size={64} className="mb-4"/>
                    <p className="font-bold">Selecione um colega para ver o radar de performance e iniciar um chat.</p>
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
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Oratória</p><p className="font-bold">{p.avgOratory}%</p></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Processual</p><p className="font-bold">{p.avgProcedural}%</p></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Score Geral</p><p className="font-bold text-legal-900">{Math.round((p.avgOratory + p.avgProcedural + p.avgEvidence)/3)}%</p></div>
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
