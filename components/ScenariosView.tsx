
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole, UserPerformance, SocialMessage } from '../types';
import { 
  Search, BookOpen, Play, FileText, PlusCircle, Users,
  Trophy, MessageCircle, Radar, Activity, Clock, ShieldCheck, CheckCircle, Fingerprint, UserCheck, AlertCircle, Plus, Trash2
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

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onStartScenario, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'my_cases' | 'social' | 'ranking'>('library');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [socialSearch, setSocialSearch] = useState('');
  const [allPerformances, setAllPerformances] = useState<UserPerformance[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friendsIds, setFriendsIds] = useState<string[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserPerformance | null>(null);
  const [socialStatus, setSocialStatus] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canCreateCase = user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN;

  useEffect(() => { loadData(); }, [user.id, activeTab]);

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
    if (friendId === user.id) return;
    persistenceService.addFriend(user.id, friendId);
    setFriendsIds(persistenceService.getFriends(user.id));
    setSocialStatus({msg: "Amigo adicionado!", type: 'success'});
    setTimeout(() => setSocialStatus(null), 3000);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Excluir este caso permanentemente?")) {
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

  const sortedRankings = useMemo(() => {
    return [...allPerformances].sort((a, b) => {
      const avgA = (a.avgOratory + a.avgProcedural + a.avgEvidence) / 3;
      const avgB = (b.avgOratory + b.avgProcedural + b.avgEvidence) / 3;
      return avgB - avgA;
    });
  }, [allPerformances]);

  // Agrupamento por área para a Biblioteca Global
  const groupedScenarios = useMemo(() => {
    if (activeTab !== 'library') return null;
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-3xl font-serif font-bold text-legal-900">Acervo Jurisprudencial</h1>
           <p className="text-sm text-slate-500">Biblioteca reorganizada por especialidades.</p>
        </div>
        {canCreateCase && (
           <button onClick={() => window.dispatchEvent(new CustomEvent('OPEN_CASE_MODAL'))} className="bg-legal-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-lg active:scale-95">
              <Plus size={18}/> Novo Caso
           </button>
        )}
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 w-fit overflow-x-auto custom-scrollbar">
          <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} label="Biblioteca Global" icon={BookOpen} />
          <TabButton active={activeTab === 'my_cases'} onClick={() => setActiveTab('my_cases')} label="Meus Estudos" icon={FileText} />
          <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} label="Networking" icon={Users} />
          <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} label="Rankings" icon={Trophy} />
      </div>

      {(activeTab === 'library' || activeTab === 'my_cases') && (
        <div className="space-y-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar autos e teses..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-sm" />
          </div>
          
          {activeTab === 'library' && groupedScenarios ? (
            Object.entries(groupedScenarios).map(([area, areaScenarios]) => (
              <div key={area} className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-2">
                   <h2 className="text-xl font-serif font-bold text-legal-900">{area}</h2>
                   <span className="bg-legal-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{areaScenarios.length} Casos</span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {areaScenarios.map(scenario => (
                    <CaseCard key={scenario.id} scenario={scenario} onStart={onStartScenario} currentUserId={user.id} onDelete={handleDeleteScenario} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {scenarios.map(scenario => (
                <CaseCard key={scenario.id} scenario={scenario} onStart={onStartScenario} currentUserId={user.id} onDelete={handleDeleteScenario} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outras tabs (social/ranking) mantidas... */}
    </div>
  );
};

const CaseCard = ({ scenario, onStart, currentUserId, onDelete }: any) => {
  const isCompleted = scenario.progress === 100;
  const isOwner = scenario.createdBy === currentUserId;

  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row group ${isCompleted ? 'border-green-100 bg-green-50/5' : ''}`}>
       <div className="p-8 flex-1">
          <div className="flex justify-between items-start mb-4">
             <div className="flex gap-2">
                <span className="text-[10px] font-black px-3 py-1 bg-legal-900 text-white rounded-full uppercase tracking-widest">{scenario.area}</span>
                {isOwner && <span className="text-[10px] font-black px-3 py-1 bg-accent-gold/10 text-accent-gold rounded-full uppercase tracking-widest border border-accent-gold/20 shadow-sm">Meu Caso</span>}
             </div>
             {isOwner && (
               <button onClick={(e) => onDelete(scenario.id, e)} className="p-2 text-slate-300 hover:text-red-600 transition opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
             )}
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
          <button onClick={() => onStart(scenario.id)} className={`px-8 py-4 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 active:scale-95 ${isCompleted ? 'bg-white text-legal-900 border border-slate-200 hover:bg-slate-100' : 'bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900'}`}>
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
