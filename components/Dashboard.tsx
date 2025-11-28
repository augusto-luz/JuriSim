import React, { useEffect, useState } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole, Classroom } from '../types';
import { Clock, Award, TrendingUp, FileText, PlayCircle, ShieldCheck, Trash2, Search, Filter, Users, Plus, BookOpen, Video, ArrowRight, Keyboard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', horas: 4 },
  { name: 'Fev', horas: 8 },
  { name: 'Mar', horas: 12 },
  { name: 'Abr', horas: 10 },
  { name: 'Mai', horas: 15 },
  { name: 'Jun', horas: 20 },
];

const MOCK_CLASSES: Classroom[] = [
  { id: 't1', name: 'Direito Penal I - 2024.1', studentCount: 34, activeCase: 'Roubo Qualificado' },
  { id: 't2', name: 'Prática Cível - Noite', studentCount: 28, activeCase: 'Caso do Celular' }
];

interface DashboardProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
  onStartMeeting: () => void;
  onJoinMeeting: () => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    onStartScenario, user, onUpgrade, 
    onStartMeeting, onJoinMeeting, joinCode, setJoinCode 
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Iniciante' | 'Intermediário' | 'Avançado'>('All');
  const [filterArea, setFilterArea] = useState<'All' | 'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial'>('All');

  useEffect(() => {
    // Load real progress linked to current user
    const updated = SCENARIOS.map(s => ({
      ...s,
      progress: persistenceService.getScenarioProgress(user.id, s.id)
    }));
    setScenarios(updated);
  }, [user.id]);

  const totalProgress = scenarios.reduce((acc, curr) => acc + curr.progress, 0);
  const avgProgress = scenarios.length > 0 ? Math.round(totalProgress / scenarios.length) : 0;

  const isAdmin = user.role === UserRole.ADMIN;
  const isInstructor = user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN;
  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;

  const handleAdminReset = () => {
     if(confirm("ATENÇÃO ADMIN: Isso apagará todos os dados de progresso e histórico de todos os usuários neste navegador. Confirmar?")) {
        persistenceService.resetAll();
        window.location.reload();
     }
  };

  // Filter Logic
  const filteredScenarios = scenarios.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = filterDifficulty === 'All' || s.difficulty === filterDifficulty;
    const matchesArea = filterArea === 'All' || s.area === filterArea;
    return matchesSearch && matchesDiff && matchesArea;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-2xl md:text-3xl font-serif font-bold text-legal-900">Olá, {user.role === UserRole.INSTRUCTOR ? 'Prof.' : 'Dr(a).'} {user.name}</h2>
             {isAdmin && (
                <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                   <ShieldCheck size={14}/> ADMIN
                </div>
             )}
             {!isPremium && (
                <button onClick={onUpgrade} className="flex items-center gap-1 bg-legal-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow hover:bg-legal-700 transition">
                   Assinar Premium
                </button>
             )}
          </div>
          <p className="text-legal-500 mt-1">
             {isInstructor ? 'Gestão de Turmas e Casos.' : 'Painel de treinamento jurídico e performance.'}
          </p>
        </div>
        
        {isAdmin && (
           <button onClick={handleAdminReset} className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg transition border border-red-100">
              <Trash2 size={14}/> Resetar Sistema
           </button>
        )}
      </div>

      {/* Meet Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-legal-900 rounded-2xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 space-y-6">
           <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight">Audiência <br/>ao Vivo</h1>
           <p className="text-legal-300 max-w-sm">Crie salas de julgamento simuladas com vídeo em tempo real. Convide colegas e distribua papéis.</p>
           
           <div className="flex flex-wrap gap-3">
             <button onClick={onStartMeeting} className="flex items-center gap-2 bg-accent-gold text-legal-900 px-5 py-3 rounded-lg font-bold hover:bg-yellow-500 transition shadow-lg">
               <Video size={20}/> Nova Audiência
             </button>
             <div className="flex items-center bg-legal-800 rounded-lg p-1 border border-legal-700">
                <div className="p-2 text-legal-400"><Keyboard size={20}/></div>
                <input 
                  type="text" 
                  placeholder="Digitar código" 
                  className="bg-transparent border-none outline-none text-white placeholder-legal-500 w-32 px-1"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <button 
                  disabled={!joinCode}
                  onClick={onJoinMeeting}
                  className="text-accent-gold font-bold px-3 py-1.5 hover:bg-legal-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Entrar
                </button>
             </div>
           </div>
        </div>
        <div className="relative z-10 hidden md:flex flex-col items-center justify-center border-l border-legal-700 pl-6">
           <div className="text-6xl font-serif font-thin text-legal-200">
             {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
           </div>
           <div className="text-legal-400 mt-2">
             {new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})}
           </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Clock size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">32h</div><div className="text-xs text-gray-500 uppercase font-medium">Tempo de Prática</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Award size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">{avgProgress}%</div><div className="text-xs text-gray-500 uppercase font-medium">{isInstructor ? 'Engajamento' : 'Média Geral'}</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">{scenarios.filter(s => s.progress === 100).length}</div><div className="text-xs text-gray-500 uppercase font-medium">Casos Concluídos</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">{isPremium ? 'A+' : 'Free'}</div><div className="text-xs text-gray-500 uppercase font-medium">Plano Atual</div></div>
        </div>
      </div>

      {/* INSTRUCTOR VIEW (Phase 2) */}
      {isInstructor && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-legal-800 flex items-center gap-2"><Users size={20} /> Suas Turmas</h3>
              <button className="flex items-center gap-2 text-sm bg-legal-800 text-white px-4 py-2 rounded-lg hover:bg-legal-700 transition"><Plus size={16}/> Criar Turma</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_CLASSES.map(cls => (
                 <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 hover:shadow-md transition">
                    <h4 className="font-bold text-lg text-legal-900">{cls.name}</h4>
                    <div className="mt-4 space-y-2">
                       <div className="flex justify-between text-sm"><span className="text-gray-500">Alunos:</span> <span className="font-medium">{cls.studentCount}</span></div>
                       <div className="flex justify-between text-sm"><span className="text-gray-500">Caso Ativo:</span> <span className="font-medium text-blue-600">{cls.activeCase}</span></div>
                    </div>
                    <div className="mt-6 flex gap-2">
                       <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded text-sm font-medium hover:bg-slate-200">Gerenciar</button>
                       <button className="flex-1 bg-legal-50 text-legal-700 py-2 rounded text-sm font-medium hover:bg-legal-100">Relatórios</button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* CASE LIBRARY (Phase 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <h3 className="text-xl font-bold text-legal-800 flex items-center gap-2"><BookOpen size={20} /> Biblioteca de Casos</h3>
             
             {/* Filters */}
             <div className="flex gap-2">
                <div className="relative">
                   <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                   <input 
                      type="text" 
                      placeholder="Buscar caso..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-48 outline-none focus:border-legal-500"
                   />
                </div>
                <div className="relative">
                   <select 
                     value={filterDifficulty}
                     onChange={(e) => setFilterDifficulty(e.target.value as any)}
                     className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-legal-500 appearance-none bg-white cursor-pointer"
                   >
                     <option value="All">Dificuldade</option>
                     <option value="Iniciante">Iniciante</option>
                     <option value="Intermediário">Intermediário</option>
                     <option value="Avançado">Avançado</option>
                   </select>
                   <Filter size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-legal-100 divide-y divide-legal-100">
            {filteredScenarios.length === 0 ? (
               <div className="p-8 text-center text-gray-500">Nenhum caso encontrado para estes filtros.</div>
            ) : filteredScenarios.map((scenario) => (
              <div key={scenario.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${scenario.area === 'Civil' ? 'bg-blue-100 text-blue-700' : scenario.area === 'Penal' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{scenario.area}</span>
                    <span className="text-xs text-gray-400">• {scenario.difficulty}</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{scenario.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{scenario.description}</p>
                  <div className="mt-3 w-full max-w-xs bg-gray-200 rounded-full h-1.5"><div className="bg-legal-600 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${scenario.progress}%` }}></div></div>
                </div>
                <button onClick={() => onStartScenario(scenario.id)} className="px-6 py-2 bg-legal-800 text-white rounded-lg hover:bg-legal-700 transition font-medium text-sm whitespace-nowrap shadow-md">
                  {isAdmin || isInstructor ? 'Gerenciar' : (scenario.progress > 0 ? 'Continuar' : 'Iniciar')}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-legal-800">Evolução</h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="horas" fill="#486581" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {!isPremium && (
             <div className="bg-gradient-to-br from-legal-900 to-legal-700 rounded-xl p-6 text-white text-center shadow-lg transform transition hover:scale-[1.02]">
                <ShieldCheck size={32} className="mx-auto mb-2 text-accent-gold"/>
                <h4 className="font-serif font-bold text-lg">Seja Premium</h4>
                <p className="text-sm text-legal-200 mb-4">Desbloqueie casos avançados e IA ilimitada.</p>
                <button onClick={onUpgrade} className="bg-accent-gold text-legal-900 font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition w-full">Ver Planos</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};