
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole, UserPerformance, SocialMessage } from '../types';
import { 
  Search, BookOpen, Play, FileText, PlusCircle, Users,
  Trophy, Send, Scale, UserPlus, MessageCircle, Radar, Activity, Clock, ShieldCheck, CheckCircle, Fingerprint, UserCheck, AlertCircle, Plus, Trash2
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friendsIds, setFriendsIds] = useState<string[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserPerformance | null>(null);
  const [socialChat, setSocialChat] = useState<SocialMessage[]>([]);
  const [socialInput, setSocialInput] = useState('');
  const [socialStatus, setSocialStatus] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canCreateCase = user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN;

  useEffect(() => { loadData(); }, [user.id, activeTab]);

  useEffect(() => {
    if (selectedFriend) {
      setSocialChat(persistenceService.getSocialMessages(user.id, selectedFriend.userId));
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedFriend]);

  const loadData = () => {
    if (activeTab === 'library') {
      const custom = persistenceService.getCustomScenarios();
      const all = [...SCENARIOS, ...custom];
      setScenarios(all.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })));
    } else if (activeTab === 'my_cases') {
      const all = [...SCENARIOS, ...persistenceService.getCustomScenarios()];
      const nativeProgress = all.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })).filter(s => s.progress > 0);
      setScenarios(nativeProgress.sort((a,b) => b.progress - a.progress));
    } else if (activeTab === 'social' || activeTab === 'ranking') {
      setAllPerformances(persistenceService.getGlobalRankings(user));
      setAllUsers(persistenceService.getAllUsers());
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
    const searchLow = socialSearch.trim().toLowerCase();
    const target = allUsers.find(u => 
      u.id.toLowerCase() === searchLow || 
      u.email.toLowerCase() === searchLow
    );

    if (target) {
        handleAddFriend(target.id);
        setSocialSearch('');
    } else {
        setSocialStatus({msg: "Usuário não encontrado. Verifique o ID exato.", type: 'error'});
        setTimeout(() => setSocialStatus(null), 4000);
    }
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("ATENÇÃO: Deseja excluir permanentemente este caso? Esta ação não pode ser desfeita e removerá o acesso de todos os seus alunos a este material.")) {
      persistenceService.deleteCustomScenario(id);
      loadData();
    }
  };

  const filteredSocial = allUsers.filter(u => 
    u.id !== user.id && u.status === 'active' && (
      u.name.toLowerCase().includes(socialSearch.toLowerCase()) || 
      u.id.toLowerCase().includes(socialSearch.toLowerCase())
    )
  ).map(u => persistenceService.getUserPerformance(u.id, u.name));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-3xl font-serif font-bold text-legal-900">Acervo Jurisprudencial</h1>
           <p className="text-sm text-slate-500">Biblioteca, Networking e Analytics de Performance.</p>
        </div>
        {canCreateCase && (
           <button 
             onClick={() => window.dispatchEvent(new CustomEvent('OPEN_CASE_MODAL'))}
             className="bg-legal-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-lg active:scale-95"
           >
              <Plus size={18}/> Novo Caso
           </button>
        )}
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 w-fit overflow-x-auto custom-scrollbar">
          <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} label="Biblioteca Global" icon={BookOpen} />
          <TabButton active={activeTab === 'my_cases'} onClick={() => setActiveTab('my_cases')} label="Meus Estudos" icon={FileText} />
          <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} label="Advocacia Digital" icon={Users} />
          <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} label="Elite Rankings" icon={Trophy} />
      </div>

      {(activeTab === 'library' || activeTab === 'my_cases') && (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar autos e teses..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-sm" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {scenarios.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map(scenario => (
              <CaseCard key={scenario.id} scenario={scenario} onStart={onStartScenario} currentUserId={user.id} onDelete={handleDeleteScenario} />
            ))}
            {scenarios.length === 0 && <p className="text-center py-20 text-slate-400 italic">Nenhum caso disponível nesta categoria.</p>}
          </div>
        </>
      )}

      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
           <div className="lg:col-span-1 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesquisar ou Adicionar por ID</label>
                 <div className="relative flex gap-2">
                    <div className="relative flex-1">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                       <input 
                          value={socialSearch} 
                          onChange={e=>setSocialSearch(e.target.value)} 
                          placeholder="Ex: ID-colega" 
                          className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-accent-gold outline-none transition shadow-sm" 
                       />
                    </div>
                    <button onClick={handleQuickAdd} className="px-4 bg-legal-900 text-white rounded-xl hover:bg-accent-gold hover:text-legal-900 transition flex items-center justify-center shadow-md active:scale-95">
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
              <div className="bg-white rounded-3xl border p-6 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between mb-4">
                    <span>Advogados na Rede</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-black">{filteredSocial.length}</span>
                 </h4>
                 <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                    {filteredSocial.map(p => (
                       <div key={p.userId} className={`flex items-center justify-between p-3 rounded-xl transition-all border ${selectedFriend?.userId === p.userId ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 shadow-sm mb-1'}`}>
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className="w-10 h-10 rounded-full bg-legal-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">{p.userName.charAt(0)}</div>
                             <div className="overflow-hidden">
                                <p className="text-xs font-bold text-legal-900 truncate">{p.userName}</p>
                                <p className="text-[9px] text-slate-400 font-mono truncate">ID: {p.userId}</p>
                             </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                             <button onClick={() => setSelectedFriend(p)} className="p-2 text-legal-400 hover:text-legal-900 transition" title="Ver Perfil"><MessageCircle size={16}/></button>
                             {friendsIds.includes(p.userId) ? <div className="p-2 text-green-500"><UserCheck size={16}/></div> : <button onClick={() => handleAddFriend(p.userId)} className="p-2 text-accent-gold hover:text-yellow-600 transition" title="Adicionar"><UserPlus size={16}/></button>}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
           <div className="lg:col-span-2">
              {selectedFriend ? (
                 <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                       <div className="w-32 h-32 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[{ s: 'O', v: selectedFriend.avgOratory }, { s: 'P', v: selectedFriend.avgProcedural }, { s: 'E', v: selectedFriend.avgEvidence }]}>
                                <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="s" tick={false} /><RadarArea dataKey="v" stroke="#c5a065" fill="#c5a065" fillOpacity={0.6} />
                             </RadarChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="text-center md:text-left flex-1">
                          <h3 className="text-2xl font-serif font-bold text-legal-900">{selectedFriend.userName}</h3>
                          <p className="text-[10px] font-mono text-slate-400 flex items-center justify-center md:justify-start gap-1 mt-1"><Fingerprint size={12}/> ID de Rede: {selectedFriend.userId}</p>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                             <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-inner min-w-[100px]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Oratória</p><p className="font-bold text-legal-900">{selectedFriend.avgOratory}%</p></div>
                             <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-inner min-w-[100px]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Processual</p><p className="font-bold text-legal-900">{selectedFriend.avgProcedural}%</p></div>
                          </div>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 p-12 border-2 border-dashed rounded-[2.5rem] bg-white shadow-inner"><Users size={64} className="mb-4 text-slate-200"/><h3 className="text-xl font-serif font-bold text-slate-400">Networking Acadêmico</h3><p className="text-sm max-w-xs text-center mt-2 leading-relaxed">Selecione um colega da lista ao lado para visualizar seu scorecard de performance jurídica.</p></div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const CaseCard = ({ scenario, onStart, currentUserId, onDelete }: any) => {
  const isCompleted = scenario.progress === 100;
  const isOwner = scenario.createdBy === currentUserId;
  const isNative = scenario.id === '1' || scenario.id === '2' || scenario.id === '3';

  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row group ${isCompleted ? 'border-green-100 bg-green-50/5' : ''}`}>
       <div className="p-8 flex-1">
          <div className="flex justify-between items-start mb-4">
             <div className="flex gap-2">
                <span className="text-[10px] font-black px-3 py-1 bg-legal-900 text-white rounded-full uppercase tracking-widest">{scenario.area}</span>
                {isOwner && <span className="text-[10px] font-black px-3 py-1 bg-accent-gold/10 text-accent-gold rounded-full uppercase tracking-widest border border-accent-gold/20 shadow-sm">Meu Caso Autoral</span>}
             </div>
             <div className="flex items-center gap-2">
                {isOwner && !isNative && (
                   <button 
                      onClick={(e) => onDelete(scenario.id, e)} 
                      className="p-2 text-slate-300 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                      title="Excluir Caso Permanentemente"
                   >
                      <Trash2 size={16}/>
                   </button>
                )}
                {isCompleted && <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-sm"><CheckCircle size={12}/> Revisão Disponível</span>}
          </div>
          </div>
          <h3 className="text-xl font-serif font-bold text-legal-900 mb-2">{scenario.title}</h3>
          <p className="text-slate-500 text-sm line-clamp-2 italic mb-6 leading-relaxed">"{scenario.facts}"</p>
          <div className="flex items-center gap-4">
             <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-accent-gold'}`} style={{width: `${scenario.progress}%`}}/>
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase">{scenario.progress}%</span>
          </div>
       </div>
       <div className="p-8 bg-slate-50 flex items-center justify-center border-l border-slate-100">
          <button onClick={() => onStart(scenario.id)} className={`px-8 py-4 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 active:scale-95 ${isCompleted ? 'bg-white text-legal-900 border border-slate-200 hover:bg-slate-100 hover:border-slate-300' : 'bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900'}`}>
             <Play size={16} fill="currentColor"/> {isCompleted ? 'Revisar Autos' : 'Iniciar Sessão'}
          </button>
       </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${active ? 'bg-white text-legal-900 border-slate-200' : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100'}`}>
    <Icon size={16}/> {label}
  </button>
);
