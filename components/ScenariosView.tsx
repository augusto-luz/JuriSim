
import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole, Classroom, StudentReport } from '../types';
import { 
  Search, BookOpen, Play, CheckCircle, Lock, Plus, X, 
  Save, Trash2, FileText, PlusCircle, MinusCircle, Users,
  BarChart3, GraduationCap, QrCode, ClipboardList, LogIn
} from 'lucide-react';

interface ScenariosViewProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onStartScenario, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'my_cases' | 'classes'>('library');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [classReports, setClassReports] = useState<StudentReport[]>([]);
  
  // Form States
  const [newScenario, setNewScenario] = useState<Omit<Scenario, 'id' | 'progress'>>({
    title: '', description: '', area: 'Civil', difficulty: 'Iniciante',
    facts: '', evidence: [''], witnesses: [''], objectives: ['']
  });
  const [newClass, setNewClass] = useState<Omit<Classroom, 'id'>>({
    name: '', instructorId: user.id, area: 'Civil', inviteCode: '', studentIds: [], assignedScenarioIds: []
  });
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const isInstructor = user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN;
  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;

  useEffect(() => { loadData(); }, [user.id, activeTab]);

  const loadData = () => {
    if (activeTab === 'library') {
      setScenarios(SCENARIOS.map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })));
    } else if (activeTab === 'my_cases') {
      setScenarios(persistenceService.getCustomScenarios(user.id).map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) })));
    } else if (activeTab === 'classes') {
      setClassrooms(persistenceService.getClassrooms(user.id));
    }
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const classroom: Classroom = {
      ...newClass,
      id: `class_${Date.now()}`,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    };
    persistenceService.saveClassroom(classroom);
    setIsCreatingClass(false);
    loadData();
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (persistenceService.joinClassroom(user.id, inviteCodeInput)) {
      alert("Sucesso! Você ingressou na turma.");
      setIsJoiningClass(false);
      setInviteCodeInput('');
      loadData();
    } else {
      alert("Código de convite inválido.");
    }
  };

  const viewClassPerformance = (cls: Classroom) => {
    const reports = persistenceService.getReportsByClass(cls.studentIds);
    setClassReports(reports);
    setSelectedClass(cls);
  };

  const filteredScenarios = scenarios.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
           <h1 className="text-3xl font-serif font-bold text-legal-900">Gestão Educacional</h1>
           <div className="flex bg-slate-100 p-1 rounded-xl">
              <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} label="Biblioteca" icon={BookOpen} />
              <TabButton active={activeTab === 'my_cases'} onClick={() => setActiveTab('my_cases')} label="Meus Casos" icon={FileText} />
              <TabButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} label={isInstructor ? "Minhas Turmas" : "Minhas Salas"} icon={Users} />
           </div>
        </div>
        <div className="flex gap-3">
           {!isInstructor && activeTab === 'classes' && (
              <button onClick={() => setIsJoiningClass(true)} className="bg-white text-legal-900 border border-legal-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"><LogIn size={20}/> Entrar em Turma</button>
           )}
           {isInstructor && activeTab === 'classes' && (
              <button onClick={() => setIsCreatingClass(true)} className="bg-legal-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-gold hover:text-legal-900 transition shadow-lg"><PlusCircle size={20}/> Criar Turma</button>
           )}
           {activeTab !== 'classes' && (
              <button onClick={() => setIsCreating(true)} className="bg-legal-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-gold hover:text-legal-900 transition shadow-lg"><Plus size={20}/> Novo Caso</button>
           )}
        </div>
      </div>

      {activeTab === 'classes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {classrooms.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-40">
                 <Users size={64} className="mx-auto mb-4"/>
                 <p className="font-bold">Nenhuma turma vinculada.</p>
              </div>
           )}
           {classrooms.map(cls => (
             <div key={cls.id} className="bg-white rounded-2xl border border-legal-100 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                   <div className="bg-legal-50 p-3 rounded-xl text-legal-900"><GraduationCap size={24}/></div>
                   <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded uppercase">{cls.area}</span>
                </div>
                <h3 className="text-xl font-bold text-legal-900 mb-1">{cls.name}</h3>
                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1"><QrCode size={12}/> Código: <span className="font-mono font-bold text-legal-700">{cls.inviteCode}</span></p>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-6">
                   <span>{cls.studentIds.length} Alunos</span>
                   <span>{cls.assignedScenarioIds.length} Casos</span>
                </div>
                {isInstructor && (
                  <button onClick={() => viewClassPerformance(cls)} className="w-full py-2 bg-slate-100 hover:bg-legal-900 hover:text-white rounded-lg text-sm font-bold transition flex items-center justify-center gap-2">
                     <BarChart3 size={16}/> Ver Desempenho
                  </button>
                )}
             </div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map(scenario => (
            <CaseCard key={scenario.id} scenario={scenario} onStart={onStartScenario} isPremium={isPremium} onUpgrade={onUpgrade} isCustom={activeTab === 'my_cases'} />
          ))}
        </div>
      )}

      {/* Modal Join Class (Student) */}
      {isJoiningClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 bg-legal-900 text-white flex justify-between items-center">
                 <h2 className="font-serif font-bold text-xl">Ingressar em Turma</h2>
                 <button onClick={() => setIsJoiningClass(false)}><X/></button>
              </div>
              <form onSubmit={handleJoinClass} className="p-6 space-y-4">
                 <p className="text-sm text-slate-500">Insira o código de 6 dígitos fornecido pelo seu professor.</p>
                 <input 
                    required 
                    maxLength={6}
                    value={inviteCodeInput} 
                    onChange={e=>setInviteCodeInput(e.target.value.toUpperCase())} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center text-2xl font-mono font-bold tracking-[0.5em]" 
                    placeholder="ABCDEF" 
                 />
                 <button type="submit" className="w-full py-4 bg-legal-900 text-white rounded-xl font-bold shadow-xl hover:bg-accent-gold hover:text-legal-900 transition">Ingressar Agora</button>
              </form>
           </div>
        </div>
      )}

      {/* Modal Performance View (Instructor) */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                 <div>
                    <h2 className="text-2xl font-serif font-bold text-legal-900">{selectedClass.name}</h2>
                    <p className="text-xs text-slate-500">Analytics Consolidado da Turma</p>
                 </div>
                 <button onClick={() => setSelectedClass(null)} className="p-2 bg-white border rounded-full shadow-sm"><X/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardMetric label="Média de Score" value={`${classReports.length ? Math.round(classReports.reduce((a,b)=>a+b.score,0)/classReports.length) : 0}%`} icon={BarChart3} color="text-blue-600" />
                    <DashboardMetric label="Total de Práticas" value={classReports.length} icon={ClipboardList} color="text-green-600" />
                    <DashboardMetric label="Engajamento" value={classReports.length > 5 ? "Alto" : "Inicial"} icon={Users} color="text-purple-600" />
                 </div>
                 
                 <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b font-bold text-legal-900">Relatórios Individuais</div>
                    <table className="w-full text-sm">
                       <thead><tr className="text-left text-slate-400 border-b bg-slate-50/50"><th className="px-6 py-3">Estudante</th><th className="px-6 py-3">Caso Simulado</th><th className="px-6 py-3">Score</th><th className="px-6 py-3">Data</th></tr></thead>
                       <tbody className="divide-y">
                          {classReports.length === 0 ? (
                            <tr><td colSpan={4} className="py-10 text-center text-slate-400">Nenhum aluno finalizou simulações nesta turma ainda.</td></tr>
                          ) : classReports.map(rep => (
                            <tr key={rep.id} className="hover:bg-slate-50 transition">
                              <td className="px-6 py-4 font-bold">{rep.studentName}</td>
                              <td className="px-6 py-4">{rep.scenarioTitle}</td>
                              <td className="px-6 py-4">
                                <span className={`font-bold ${rep.score >= 70 ? 'text-green-600' : 'text-amber-600'}`}>{rep.score}/100</span>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs">{new Date(rep.timestamp).toLocaleDateString()}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* Modal Create Class and Create Scenario forms omitted for brevity as they follow the standard pattern of the app */}
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-white text-legal-900 shadow-sm' : 'text-slate-400'}`}><Icon size={16}/> {label}</button>
);

const DashboardMetric = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
     <div className={`p-3 bg-slate-50 rounded-lg ${color}`}><Icon size={20}/></div>
     <div><p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p><p className="text-xl font-bold text-legal-900">{value}</p></div>
  </div>
);

const CaseCard = ({ scenario, onStart, isPremium, onUpgrade, isCustom }: any) => {
  const isLocked = scenario.difficulty === 'Avançado' && !isPremium && !isCustom;
  return (
    <div className={`bg-white rounded-2xl border border-legal-100 overflow-hidden shadow-sm hover:shadow-lg transition group ${isLocked ? 'opacity-75 grayscale' : ''}`}>
       <div className="p-6">
          <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 uppercase">{scenario.area}</span>
          </div>
          <h3 className="text-lg font-bold text-legal-900 group-hover:text-accent-gold transition-colors truncate">{scenario.title}</h3>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 h-8">{scenario.facts || scenario.description}</p>
          <div className="mt-6 flex justify-between items-end">
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Resolução</span>
                <span className="text-sm font-bold text-legal-900">{scenario.progress}%</span>
             </div>
             <button onClick={() => isLocked ? onUpgrade() : onStart(scenario.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900 shadow-md'}`}>
                {isLocked ? 'Unlock Pro' : 'Praticar'}
             </button>
          </div>
       </div>
    </div>
  );
};
