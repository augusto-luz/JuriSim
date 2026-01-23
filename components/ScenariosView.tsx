
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole, Classroom, StudentReport, UserPerformance, ClassChatMessage } from '../types';
import { 
  Search, BookOpen, Play, CheckCircle, Lock, Plus, X, 
  Save, Trash2, FileText, PlusCircle, MinusCircle, Users,
  BarChart3, GraduationCap, QrCode, ClipboardList, LogIn, UserCircle,
  TrendingUp, Award, Calendar, Briefcase, Trophy, Clock, Send, ShieldCheck,
  Scale, AlertCircle, Info, Star, Timer, Activity, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const DynamicList = ({ label, list, updateFn, addFn }: { 
  label: string; 
  list: string[]; 
  updateFn: (index: number, value: string) => void; 
  addFn: () => void; 
}) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <button type="button" onClick={addFn} className="text-accent-gold hover:text-yellow-600 transition p-1">
        <Plus size={16} />
      </button>
    </div>
    <div className="space-y-2">
      {list.map((item, idx) => (
        <input
          key={idx}
          value={item}
          onChange={(e) => updateFn(idx, e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent-gold text-sm font-medium text-legal-900"
          placeholder={`Inserir item...`}
        />
      ))}
      {list.length === 0 && (
        <p className="text-[10px] text-slate-400 italic">Nenhum item adicionado.</p>
      )}
    </div>
  </div>
);

interface ScenariosViewProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onStartScenario, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'my_cases' | 'classes' | 'ranking'>('library');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [rankings, setRankings] = useState<UserPerformance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  
  // Chat Turma
  const [chatMessages, setChatMessages] = useState<ClassChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Form de Novo Caso
  const [newCase, setNewCase] = useState<Partial<Scenario>>({
    title: '',
    description: '',
    facts: '',
    difficulty: 'Iniciante',
    area: 'Civil',
    evidence: [''],
    witnesses: [''],
    objectives: ['']
  });

  const [newClassName, setNewClassName] = useState('');
  const [newClassArea, setNewClassArea] = useState<'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial' | 'Multi'>('Civil');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Verificação rigorosa de cargo para exibição de botões administrativos
  const isInstructor = useMemo(() => {
    return user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN;
  }, [user.role]);
  
  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;

  useEffect(() => { loadData(); }, [user.id, activeTab]);

  useEffect(() => {
    if (selectedClass) {
      setChatMessages(persistenceService.getClassChat(selectedClass.id));
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedClass]);

  const loadData = () => {
    if (activeTab === 'library') {
      setScenarios(SCENARIOS.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })));
    } else if (activeTab === 'my_cases') {
      const custom = persistenceService.getCustomScenarios(user.id);
      const startedNative = SCENARIOS.filter(s => persistenceService.getScenarioProgress(user.id, s.id) > 0);
      
      const merged = [...custom, ...startedNative]
        .map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) }))
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        
      setScenarios(merged);
    } else if (activeTab === 'classes') {
      setClassrooms(persistenceService.getClassrooms(user.id));
    } else if (activeTab === 'ranking') {
      // BUG FIX: Agora passamos o objeto user para garantir o nome correto no ranking
      setRankings(persistenceService.getGlobalRankings(user));
    }
  };

  const myPerformance = useMemo(() => persistenceService.getUserPerformance(user.id, user.name), [user.id, user.name]);

  const radarData = useMemo(() => [
    { subject: 'Oratória', A: myPerformance.avgOratory || 70, fullMark: 100 },
    { subject: 'Rito Proc.', A: myPerformance.avgProcedural || 65, fullMark: 100 },
    { subject: 'Provas', A: myPerformance.avgEvidence || 80, fullMark: 100 },
    { subject: 'Combatividade', A: 85, fullMark: 100 },
    { subject: 'Diligência', A: 75, fullMark: 100 },
  ], [myPerformance]);

  const popularScenarios = useMemo(() => {
    const stats = persistenceService.getScenarioStats();
    return SCENARIOS.map(s => ({
      name: s.title,
      activity: stats[s.id] || Math.floor(Math.random() * 50) 
    })).sort((a,b) => b.activity - a.activity).slice(0, 5);
  }, []);

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.title || !newCase.facts) return;
    
    const scenario: Scenario = {
      id: `custom_${Date.now()}`,
      title: newCase.title!,
      description: newCase.description || newCase.facts!.substring(0, 100) + '...',
      facts: newCase.facts!,
      difficulty: newCase.difficulty as any || 'Iniciante',
      area: newCase.area as any || 'Civil',
      progress: 0,
      evidence: (newCase.evidence || []).filter(e => e.trim() !== ''),
      witnesses: (newCase.witnesses || []).filter(w => w.trim() !== ''),
      objectives: (newCase.objectives || []).filter(o => o.trim() !== '')
    };

    const currentCustom = persistenceService.getCustomScenarios(user.id);
    localStorage.setItem(`jurisim_custom_scenarios_${user.id}`, JSON.stringify([...currentCustom, scenario]));
    
    setIsCreatingCase(false);
    setNewCase({ title: '', facts: '', evidence: [''], witnesses: [''], objectives: [''] });
    setActiveTab('my_cases');
    loadData();
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedClass) return;
    const msg: ClassChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: chatInput,
      timestamp: Date.now()
    };
    persistenceService.saveClassMessage(selectedClass.id, msg);
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const classroom: Classroom = {
      id: `class_${Date.now()}`,
      name: newClassName,
      instructorId: user.id,
      area: newClassArea,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      studentIds: [],
      assignedScenarioIds: []
    };
    persistenceService.saveClassroom(classroom);
    setNewClassName('');
    setIsCreatingClass(false);
    loadData();
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (persistenceService.joinClassroom(user.id, inviteCodeInput)) {
      setIsJoiningClass(false);
      setInviteCodeInput('');
      loadData();
    } else { alert("Código de convite inválido ou expirado."); }
  };

  const updateField = (field: string, index: number, value: string, listName: 'evidence' | 'witnesses' | 'objectives') => {
    const list = [...(newCase[listName] || [])];
    list[index] = value;
    setNewCase({ ...newCase, [listName]: list });
  };

  const addField = (listName: 'evidence' | 'witnesses' | 'objectives') => {
    setNewCase({ ...newCase, [listName]: [...(newCase[listName] || []), ''] });
  };

  const filteredScenarios = scenarios.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.facts.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      
      {/* Header Central de Ações */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
           <h1 className="text-3xl font-serif font-bold text-legal-900">Hub de Inteligência Forense</h1>
           <p className="text-sm text-slate-500">Gestão de autos, turmas acadêmicas e analytics de performance.</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
           <button 
             onClick={() => setIsCreatingCase(true)}
             className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-legal-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-accent-gold hover:text-legal-900 transition shadow-lg"
           >
             <PlusCircle size={20}/> Protocolar Novo Caso
           </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 w-fit overflow-x-auto custom-scrollbar">
          <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} label="Biblioteca Global" icon={BookOpen} />
          <TabButton active={activeTab === 'my_cases'} onClick={() => setActiveTab('my_cases')} label="Meus Casos" icon={FileText} />
          <TabButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} label="Portal das Turmas" icon={GraduationCap} />
          <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} label="Elite & Analytics" icon={Trophy} />
      </div>

      {/* VIEW: BIBLIOTECA / MEUS CASOS */}
      {(activeTab === 'library' || activeTab === 'my_cases') && (
        <>
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por fatos narrados, nomes ou teses..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-8 animate-in fade-in">
            {filteredScenarios.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] opacity-50">
                <FileText size={64} className="mx-auto mb-4 text-slate-300"/>
                <p className="font-bold text-slate-400">Nenhum auto processual encontrado.</p>
              </div>
            ) : filteredScenarios.map(scenario => (
              <CaseBriefingCard key={scenario.id} scenario={scenario} onStart={onStartScenario} isPremium={isPremium} onUpgrade={onUpgrade} isCustom={activeTab === 'my_cases'} />
            ))}
          </div>
        </>
      )}

      {/* VIEW: TURMAS */}
      {activeTab === 'classes' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold text-legal-900 flex items-center gap-2"><Users size={24} className="text-accent-gold"/> Minhas Turmas Acadêmicas</h3>
              <div className="flex gap-2">
                 <button onClick={() => setIsJoiningClass(true)} className="px-5 py-3 bg-white text-legal-900 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition">Entrar com Código</button>
                 {isInstructor && (
                    <button onClick={() => setIsCreatingClass(true)} className="px-5 py-3 bg-legal-900 text-white rounded-xl font-bold text-sm hover:bg-legal-800 transition">
                       Criar Nova Turma
                    </button>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl opacity-50">
                   <GraduationCap size={48} className="mx-auto mb-3 text-slate-300"/>
                   <p className="font-bold text-slate-400">Você não participa de nenhuma turma no momento.</p>
                </div>
              ) : classrooms.map(cls => (
                <div key={cls.id} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="bg-legal-900 p-4 rounded-2xl text-white shadow-lg"><GraduationCap size={28}/></div>
                      <span className="text-[10px] font-black px-3 py-1 bg-accent-gold text-legal-900 rounded-full uppercase tracking-tighter">{cls.area}</span>
                   </div>
                   <h3 className="text-2xl font-serif font-bold text-legal-900 mb-2">{cls.name}</h3>
                   <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 mb-6">
                      <QrCode size={14} className="text-slate-400"/> 
                      <span className="text-slate-400">Convite:</span> 
                      <span className="font-bold text-legal-700">{cls.inviteCode}</span>
                   </div>
                   <button onClick={() => setSelectedClass(cls)} className="w-full py-4 bg-legal-900 text-white rounded-2xl font-bold text-sm hover:bg-accent-gold hover:text-legal-900 transition-all flex items-center justify-center gap-3 shadow-lg">
                      <BarChart3 size={18}/> {user.id === cls.instructorId ? 'Painel de Gestão' : 'Mural da Turma'}
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* VIEW: ELITE & ANALYTICS (RANKING) */}
      {activeTab === 'ranking' && (
        <div className="space-y-8 animate-in fade-in">
           {/* Estatísticas Pessoais */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatHubCard icon={Timer} label="Tempo de Bancada" value={`${Math.floor(myPerformance.totalExerciseTime / 60)}h ${myPerformance.totalExerciseTime % 60}m`} trend="+15% total" color="text-blue-600" />
              <StatHubCard icon={Activity} label="Sessões IA" value={myPerformance.totalSimulations} trend="Média 8.2/10" color="text-green-600" />
              <StatHubCard icon={Zap} label="Combatividade" value="Nível 4" trend="Top 10%" color="text-amber-600" />
              <StatHubCard icon={Trophy} label="Rank Elite" value={`#${rankings.findIndex(r => r.userId === user.id) + 1 || rankings.length + 1}`} trend="Subindo" color="text-purple-600" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Radar Chart */}
              <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
                 <h3 className="font-serif font-bold text-xl text-legal-900 mb-2 w-full">Perfil de Operador</h3>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-8 w-full">Competências Técnicas IA</p>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Minhas Skills" dataKey="A" stroke="#102a43" fill="#102a43" fillOpacity={0.5} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                       </RadarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Top Rankings Table */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="font-serif font-bold text-xl text-legal-900">Quadro de Honra</h3>
                    <span className="text-[10px] font-black bg-legal-900 text-white px-3 py-1 rounded-full uppercase">Líderes de Performance</span>
                 </div>
                 <div className="space-y-4">
                    {rankings.map((r, idx) => (
                       <div key={r.userId} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${r.userId === user.id ? 'bg-legal-900 text-white border-legal-900 shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-accent-gold'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-accent-gold text-legal-900' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-400'}`}>
                                {idx + 1}
                             </div>
                             <div>
                                <p className="font-bold text-sm">{r.userName}</p>
                                <p className={`text-[10px] font-bold ${r.userId === user.id ? 'text-accent-gold' : 'text-slate-400'}`}>{r.totalSimulations} SIMULAÇÕES</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="flex items-center gap-2 mb-1 justify-end">
                                <span className="text-[10px] font-black uppercase">Skill Média</span>
                                <span className="text-xs font-bold">{Math.round((r.avgOratory + r.avgProcedural + r.avgEvidence)/3)}%</span>
                             </div>
                             <div className={`w-32 h-1 rounded-full ${r.userId === user.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                                <div className="h-1 rounded-full bg-accent-gold" style={{ width: `${(r.avgOratory + r.avgProcedural + r.avgEvidence)/3}%` }} />
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Gráfico de Casos Disputados */}
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-serif font-bold text-xl text-legal-900 mb-1">Cenários de Maior Litigância</h3>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-10">Frequência de abertura de autos na plataforma</p>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularScenarios}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                       <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                       <Bar dataKey="activity" fill="#102a43" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}
      
      {/* MODAL: CHAT TURMA */}
      {selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/80">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-legal-900 text-white rounded-2xl"><Users size={24}/></div>
                    <div>
                       <h2 className="text-2xl font-serif font-bold text-legal-900">{selectedClass.name}</h2>
                       <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Mural de Colaboração Acadêmica</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedClass(null)} className="p-3 hover:bg-slate-200 rounded-full transition"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 <div className="w-full lg:w-72 border-r border-slate-100 bg-slate-50/30 overflow-y-auto p-4 space-y-2 shrink-0">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-4">Operadores Online ({selectedClass.studentIds?.length || 0})</h4>
                    {(selectedClass.studentIds || []).map((sid, idx) => (
                       <div key={sid} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-legal-100 flex items-center justify-center text-xs font-bold text-legal-900">{sid.charAt(0)}</div>
                             <span className="text-xs font-bold text-legal-800">Membro {sid.substring(0,5)}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${idx % 2 === 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                       </div>
                    ))}
                 </div>

                 <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                       {chatMessages.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 space-y-4">
                            <Send size={48}/>
                            <p className="font-bold text-sm">O mural da turma está vazio. Inicie um debate jurídico!</p>
                         </div>
                       ) : chatMessages.map(msg => (
                         <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-black text-slate-500 uppercase">{msg.senderName}</span>
                               <span className="text-[10px] font-bold text-accent-gold">{msg.senderRole === UserRole.INSTRUCTOR ? 'INSTRUTOR' : 'ALUNO'}</span>
                            </div>
                            <div className={`p-4 rounded-2xl text-sm max-w-[80%] ${msg.senderId === user.id ? 'bg-legal-900 text-white rounded-tr-none shadow-lg' : 'bg-slate-100 text-legal-900 rounded-tl-none'}`}>
                               {msg.text}
                            </div>
                         </div>
                       ))}
                       <div ref={chatEndRef}/>
                    </div>

                    <div className="p-6 border-t bg-slate-50/50">
                       <div className="relative flex items-center">
                          <input 
                            value={chatInput} 
                            onChange={e=>setChatInput(e.target.value)}
                            onKeyDown={e=>e.key === 'Enter' && handleSendMessage()}
                            placeholder="Escreva um comunicado ou dúvida técnica..." 
                            className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-accent-gold transition"
                          />
                          <button onClick={handleSendMessage} className="absolute right-2 p-3 bg-legal-900 text-white rounded-xl hover:bg-accent-gold transition shadow-lg">
                             <Send size={20}/>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* MODAL: CRIAR TURMA */}
      {isCreatingClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-8 bg-legal-900 text-white flex justify-between items-center">
                 <h2 className="font-serif font-bold text-2xl">Nova Unidade Acadêmica</h2>
                 <button onClick={() => setIsCreatingClass(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24}/></button>
              </div>
              <form onSubmit={handleCreateClass} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome da Cadeira / Disciplina</label>
                    <input required value={newClassName} onChange={e=>setNewClassName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-accent-gold text-legal-900 font-bold" placeholder="Ex: Direito Civil II" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Área Processual</label>
                    <select value={newClassArea} onChange={e=>setNewClassArea(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-legal-900 font-bold">
                       <option value="Civil">Civil</option>
                       <option value="Penal">Penal</option>
                       <option value="Trabalhista">Trabalhista</option>
                       <option value="Empresarial">Empresarial</option>
                    </select>
                 </div>
                 <button type="submit" className="w-full py-5 bg-legal-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-accent-gold hover:text-legal-900 transition-all">Ativar Turma</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: PROTOCOLAR NOVO CASO */}
      {isCreatingCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/80 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
              <div className="p-8 bg-legal-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent-gold text-legal-900 rounded-2xl"><Plus size={24}/></div>
                    <div>
                       <h2 className="font-serif font-bold text-2xl">Arrazoado de Novo Caso</h2>
                       <p className="text-[10px] text-accent-gold font-bold uppercase tracking-widest">Configuração para Simulação IA</p>
                    </div>
                 </div>
                 <button onClick={() => setIsCreatingCase(false)} className="p-3 hover:bg-white/10 rounded-full transition"><X size={24}/></button>
              </div>
              
              <form onSubmit={handleCreateCase} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título da Ação</label>
                       <input required value={newCase.title} onChange={e=>setNewCase({...newCase, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-accent-gold font-bold text-legal-900" placeholder="Ex: Revisional de Alimentos" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Área Jurídica</label>
                        <select value={newCase.area} onChange={e=>setNewCase({...newCase, area: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-legal-900 font-bold">
                           <option value="Civil">Civil</option>
                           <option value="Penal">Penal</option>
                           <option value="Trabalhista">Trabalhista</option>
                           <option value="Empresarial">Empresarial</option>
                        </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Narrativa Fática (Essencial para IA)</label>
                    <textarea 
                      required 
                      rows={6}
                      value={newCase.facts} 
                      onChange={e=>setNewCase({...newCase, facts: e.target.value})} 
                      className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-accent-gold text-legal-900 text-sm leading-relaxed" 
                      placeholder="Descreva minuciosamente o ocorrido. Esta narrativa servirá de base para o Juiz IA..."
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <DynamicList label="Provas Documentais" list={newCase.evidence || []} updateFn={(i,v) => updateField('evidence', i, v, 'evidence')} addFn={() => addField('evidence')} />
                    <DynamicList label="Rol de Testemunhas" list={newCase.witnesses || []} updateFn={(i,v) => updateField('witnesses', i, v, 'witnesses')} addFn={() => addField('witnesses')} />
                    <DynamicList label="Objetivos Processuais" list={newCase.objectives || []} updateFn={(i,v) => updateField('objectives', i, v, 'objectives')} addFn={() => addField('objectives')} />
                 </div>
                 
                 <button type="submit" className="w-full py-6 bg-legal-900 text-white rounded-3xl font-bold text-lg shadow-xl hover:bg-accent-gold hover:text-legal-900 transition-all">Protocolar Novo Caso</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: ENTRAR EM TURMA */}
      {isJoiningClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="p-10 bg-legal-900 text-white flex justify-between items-center">
                 <h2 className="font-serif font-bold text-2xl">Acesso por Convite</h2>
                 <button onClick={() => setIsJoiningClass(false)} className="p-3 hover:bg-white/10 rounded-full transition"><X size={24}/></button>
              </div>
              <form onSubmit={handleJoinClass} className="p-10 space-y-8 text-center">
                 <p className="text-sm text-slate-500">Insira o código alfanumérico fornecido pelo instrutor.</p>
                 <input required maxLength={6} value={inviteCodeInput} onChange={e=>setInviteCodeInput(e.target.value.toUpperCase())} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none text-center text-4xl font-mono font-black tracking-widest focus:border-accent-gold text-legal-900" placeholder="ABCDEF" />
                 <button type="submit" className="w-full py-5 bg-legal-900 text-white rounded-3xl font-bold text-lg shadow-xl hover:bg-accent-gold transition-all">Validar Matrícula</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const StatHubCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition group">
     <div className={`p-3 w-fit rounded-xl bg-slate-50 ${color} mb-4 group-hover:scale-110 transition`}>
        <Icon size={24} />
     </div>
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
     <p className="text-2xl font-serif font-bold text-legal-900 mb-2">{value}</p>
     <p className="text-[10px] font-bold text-green-500 flex items-center gap-1">
        <TrendingUp size={10}/> {trend}
     </p>
  </div>
);

const CaseBriefingCard = ({ scenario, onStart, isPremium, onUpgrade, isCustom }: any) => {
  const isLocked = scenario.difficulty === 'Avançado' && !isPremium && !isCustom;
  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative ${isLocked ? 'opacity-75 grayscale' : ''}`}>
       <div className="flex flex-col lg:flex-row h-full">
          <div className="w-full lg:w-72 bg-slate-50 p-10 border-r border-slate-100 flex flex-col justify-between shrink-0">
             <div>
                <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-legal-900 text-white uppercase tracking-widest mb-6 inline-block">
                   {scenario.area}
                </span>
                <h3 className="text-2xl font-serif font-bold text-legal-900 mb-2 leading-tight">{scenario.title}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-8">
                   <Briefcase size={14}/> {scenario.difficulty}
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                   <span>Trajeto Processual</span>
                   <span>{scenario.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full">
                   <div className="bg-accent-gold h-1.5 rounded-full transition-all duration-1000" style={{width: `${scenario.progress}%`}}/>
                </div>
             </div>
          </div>

          <div className="flex-1 p-10 flex flex-col justify-between">
             <div className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-accent-gold uppercase tracking-[0.2em]">
                   <Scale size={14}/> Resumo Fático dos Autos
                </div>
                <p className="text-legal-700 text-sm leading-relaxed italic line-clamp-4">
                   "{scenario.facts}"
                </p>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FileText size={14}/> {scenario.evidence?.length || 0} Provas
                   </div>
                   <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Users size={14}/> {scenario.witnesses?.length || 0} Testemunhas
                   </div>
                </div>
             </div>

             <div className="flex justify-end mt-8">
                <button 
                  onClick={() => isLocked ? onUpgrade() : onStart(scenario.id)} 
                  className={`px-10 py-4 rounded-2xl text-sm font-black transition-all shadow-lg flex items-center gap-3 ${isLocked ? 'bg-slate-200 text-slate-500 shadow-none cursor-not-allowed' : 'bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900 transform active:scale-95'}`}
                >
                   {isLocked ? <Lock size={18}/> : <Play size={18} fill="currentColor"/>}
                   {isLocked ? 'Cenário Bloqueado' : 'Acessar Audiência Virtual'}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${active ? 'bg-white text-legal-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
    <Icon size={16}/> {label}
  </button>
);
