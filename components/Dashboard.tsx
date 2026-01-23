
import React, { useEffect, useState } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole } from '../types';
import { 
  Clock, Award, TrendingUp, FileText, 
  Play, ShieldCheck, Activity, Target, 
  Calendar, ArrowRight, Zap, Star
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, 
  PieChart, Pie, Cell 
} from 'recharts';

const evolutionData = [
  { name: 'Sem 1', pontuacao: 65, argumentacao: 40 },
  { name: 'Sem 2', pontuacao: 72, argumentacao: 55 },
  { name: 'Sem 3', pontuacao: 68, argumentacao: 62 },
  { name: 'Sem 4', pontuacao: 85, argumentacao: 78 },
  { name: 'Sem 5', pontuacao: 92, argumentacao: 85 },
];

const COLORS = ['#102a43', '#c5a065', '#486581', '#829ab1'];

interface DashboardProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
  onChangeView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    onStartScenario, user, onUpgrade, onChangeView
}) => {
  const [stats, setStats] = useState({
    totalHours: 0,
    completedCases: 0,
    avgScore: 0,
    rank: 'Iniciante'
  });

  const [lastScenario, setLastScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    const perf = persistenceService.getUserPerformance(user.id, user.name);
    const all = [...SCENARIOS, ...persistenceService.getCustomScenarios(user.id)];
    const completed = all.filter(s => persistenceService.getScenarioProgress(user.id, s.id) === 100).length;
    
    const withProgress = all
      .map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) }))
      .filter(s => s.progress > 0 && s.progress < 100)
      .sort((a, b) => b.progress - a.progress);

    setLastScenario(withProgress[0] || null);
    
    // Determinar Rank baseado em simulações
    let rank = 'Estudante';
    if (perf.totalSimulations > 30) rank = 'Advogado Sênior';
    else if (perf.totalSimulations > 10) rank = 'Advogado Pleno';
    else if (perf.totalSimulations > 0) rank = 'Advogado Júnior';

    setStats({
      totalHours: Math.round(perf.totalExerciseTime / 60),
      completedCases: completed,
      // Fixed: changed 'r.avgEvidence' to 'perf.avgEvidence' to correctly use the 'perf' object
      avgScore: Math.round((perf.avgOratory + perf.avgProcedural + perf.avgEvidence) / 3) || 0,
      rank
    });
  }, [user.id, user.name]);

  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-6 md:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-24">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-legal-900">Olá, {user.name.split(' ')[0]}</h1>
          <p className="text-sm text-legal-500 mt-1 flex items-center gap-2">
            <Activity size={14} className="text-green-500" /> Panorama de desempenho atualizado.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           {!isPremium && (
             <button onClick={onUpgrade} className="flex-1 md:flex-none bg-accent-gold text-legal-900 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition">Upgrade PRO</button>
           )}
           <div className="bg-white border border-legal-100 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
              <Calendar size={16} className="text-legal-400" />
              <span className="text-xs font-bold text-legal-800 uppercase">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
           </div>
        </div>
      </div>

      {/* Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-legal-900 rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[220px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold rounded-full mix-blend-multiply filter blur-[80px] opacity-10 translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10">
               <span className="text-accent-gold text-[10px] font-black uppercase tracking-[0.2em]">Audiência em Curso</span>
               {lastScenario ? (
                 <div className="mt-4">
                   <h2 className="text-xl md:text-3xl font-serif font-bold mb-6 max-w-md leading-tight">{lastScenario.title}</h2>
                   <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1">
                         <div className="flex justify-between text-[10px] font-bold mb-2">
                            <span className="text-legal-300">Progresso Atual</span>
                            <span className="text-accent-gold">{lastScenario.progress}%</span>
                         </div>
                         <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div className="bg-accent-gold h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(197,160,101,0.5)]" style={{ width: `${lastScenario.progress}%` }} />
                         </div>
                      </div>
                      <button onClick={() => onStartScenario(lastScenario.id)} className="bg-white text-legal-900 px-6 py-4 rounded-2xl hover:bg-accent-gold transition shadow-xl group flex items-center justify-center gap-3 font-bold text-sm">
                         Continuar <Play size={18} fill="currentColor" />
                      </button>
                   </div>
                 </div>
               ) : (
                 <div className="mt-4">
                   <h2 className="text-2xl font-serif font-bold">Nenhuma prática ativa</h2>
                   <p className="text-legal-300 text-sm mt-2 max-w-xs">Explore nossa biblioteca de autos e inicie sua primeira simulação hoje.</p>
                   <button onClick={() => onChangeView('scenarios')} className="mt-6 bg-accent-gold text-legal-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-yellow-500 transition shadow-lg active:scale-95">
                      Explorar Casos <ArrowRight size={18}/>
                   </button>
                 </div>
               )}
            </div>
         </div>

         <div className="bg-white rounded-[2rem] p-8 border border-legal-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
               <h3 className="font-bold text-legal-900 flex items-center gap-2"><Zap size={18} className="text-accent-gold"/> Acesso Rápido</h3>
               <div className="space-y-4">
                  <QuickActionButton onClick={() => onChangeView('multiplayer')} icon={Star} color="text-blue-600" bg="bg-blue-50" label="Sessão Multiplayer" sub="Conectar com pares" />
                  <QuickActionButton onClick={() => onChangeView('scenarios')} icon={FileText} color="text-purple-600" bg="bg-purple-50" label="Biblioteca Global" sub="Protocolar casos" />
               </div>
            </div>
            <button onClick={() => onChangeView('settings')} className="text-legal-400 text-[10px] font-black uppercase tracking-widest hover:text-legal-900 transition flex items-center gap-2 justify-center mt-6">Configurações de Perfil <ArrowRight size={14}/></button>
         </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <StatsCard icon={Clock} label="Prática" value={`${stats.totalHours}h`} color="text-blue-600" bg="bg-blue-50" />
         <StatsCard icon={Award} label="Concluídos" value={stats.completedCases} color="text-green-600" bg="bg-green-50" />
         <StatsCard icon={Target} label="Score Médio" value={`${stats.avgScore}%`} color="text-amber-600" bg="bg-amber-50" />
         <StatsCard icon={ShieldCheck} label="Nível Profissional" value={stats.rank} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
         <ChartCard title="Evolução Técnica" subtitle="Métricas acumuladas por semana">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={evolutionData}>
                  <defs>
                     <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#102a43" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#102a43" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} />
                  <YAxis hide />
                  <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="pontuacao" stroke="#102a43" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
               </AreaChart>
            </ResponsiveContainer>
         </ChartCard>

         <ChartCard title="Especialidades" subtitle="Distribuição de casos por área">
            <div className="flex flex-col md:flex-row items-center justify-between h-full gap-4">
               <div className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={[
                              { name: 'Civil', value: 45 },
                              { name: 'Penal', value: 30 },
                              { name: 'Trabalho', value: 25 },
                           ]}
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={8}
                           dataKey="value"
                        >
                           {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-3 md:grid-cols-1 gap-3 shrink-0">
                  {['Civil', 'Penal', 'Trabalho'].map((label, i) => (
                     <div key={label} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
                     </div>
                  ))}
               </div>
            </div>
         </ChartCard>
      </div>
    </div>
  );
};

const QuickActionButton = ({ icon: Icon, color, bg, label, sub, onClick }: any) => (
  <button onClick={onClick} className="w-full group flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all text-left active:scale-[0.98]">
     <div className={`${bg} ${color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
     </div>
     <div>
        <p className="text-xs font-bold text-legal-900 leading-tight">{label}</p>
        <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
     </div>
  </button>
);

const ChartCard = ({ title, subtitle, children }: any) => (
  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-legal-100 shadow-sm flex flex-col">
     <div className="mb-8">
        <h3 className="font-bold text-legal-900 text-lg leading-tight">{title}</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{subtitle}</p>
     </div>
     <div className="flex-1 min-h-[220px]">
        {children}
     </div>
  </div>
);

const StatsCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-legal-100 flex flex-col md:flex-row items-center md:items-start gap-4 hover:shadow-md transition group">
    <div className={`p-3 ${bg} ${color} rounded-xl group-hover:scale-110 transition shrink-0`}>
      <Icon size={20} />
    </div>
    <div className="text-center md:text-left overflow-hidden w-full">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
      <p className="text-xl md:text-2xl font-serif font-bold text-legal-900 truncate">{value}</p>
    </div>
  </div>
);
