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
    totalHours: 24,
    completedCases: 0,
    avgScore: 85,
    rank: 'Advogado Pleno'
  });

  const [lastScenario, setLastScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    const all = [...SCENARIOS, ...persistenceService.getCustomScenarios(user.id)];
    const completed = all.filter(s => persistenceService.getScenarioProgress(user.id, s.id) === 100).length;
    
    // Pegar o último caso com progresso
    const withProgress = all
      .map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) }))
      .filter(s => s.progress > 0 && s.progress < 100)
      .sort((a, b) => b.progress - a.progress);

    setLastScenario(withProgress[0] || null);
    setStats(prev => ({ ...prev, completedCases: completed }));
  }, [user.id]);

  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Top Banner - Personal Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-legal-900">Bom dia, {user.role === UserRole.INSTRUCTOR ? 'Prof.' : 'Dr(a).'} {user.name.split(' ')[0]}</h1>
          <p className="text-legal-500 mt-1 flex items-center gap-2">
            <Activity size={16} className="text-green-500" /> Seu desempenho subiu 12% esta semana.
          </p>
        </div>
        <div className="flex gap-3">
           {!isPremium && (
             <button onClick={onUpgrade} className="bg-accent-gold text-legal-900 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:scale-105 transition">Upgrade PRO</button>
           )}
           <div className="bg-white border border-legal-100 px-4 py-2 rounded-lg flex items-center gap-3 shadow-sm">
              <Calendar size={18} className="text-legal-400" />
              <span className="text-sm font-bold text-legal-800">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
           </div>
        </div>
      </div>

      {/* Hero: Last Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-legal-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10">
               <span className="text-accent-gold text-xs font-bold uppercase tracking-widest">Continuar de onde parou</span>
               {lastScenario ? (
                 <>
                   <h2 className="text-2xl font-serif font-bold mt-2">{lastScenario.title}</h2>
                   <div className="mt-4 flex items-center gap-6">
                      <div className="flex-1">
                         <div className="flex justify-between text-xs mb-2">
                            <span className="text-legal-300">Progresso do Caso</span>
                            <span className="text-accent-gold font-bold">{lastScenario.progress}%</span>
                         </div>
                         <div className="w-full bg-legal-800 rounded-full h-2">
                            <div className="bg-accent-gold h-2 rounded-full transition-all duration-1000" style={{ width: `${lastScenario.progress}%` }} />
                         </div>
                      </div>
                      <button onClick={() => onStartScenario(lastScenario.id)} className="bg-white text-legal-900 p-4 rounded-xl hover:bg-accent-gold transition shadow-lg group">
                         <Play size={24} className="group-hover:scale-110 transition" fill="currentColor" />
                      </button>
                   </div>
                 </>
               ) : (
                 <>
                   <h2 className="text-2xl font-serif font-bold mt-2">Nenhuma audiência em curso</h2>
                   <p className="text-legal-300 text-sm mt-2">Inicie um novo caso na biblioteca para praticar.</p>
                   <button onClick={() => onChangeView('scenarios')} className="mt-6 bg-accent-gold text-legal-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-500 transition">
                      Explorar Casos <ArrowRight size={18}/>
                   </button>
                 </>
               )}
            </div>
         </div>

         <div className="bg-white rounded-2xl p-6 border border-legal-100 shadow-sm flex flex-col justify-between">
            <div>
               <h3 className="font-bold text-legal-900 flex items-center gap-2 mb-4"><Zap size={18} className="text-accent-gold"/> Atalhos Rápidos</h3>
               <div className="space-y-3">
                  <button onClick={() => onChangeView('multiplayer')} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-accent-gold hover:bg-slate-50 transition flex items-center gap-3">
                     <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Star size={18}/></div>
                     <div><p className="text-sm font-bold">Nova Audiência Live</p><p className="text-[10px] text-gray-500">Pratique com colegas</p></div>
                  </button>
                  <button onClick={() => onChangeView('scenarios')} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-accent-gold hover:bg-slate-50 transition flex items-center gap-3">
                     <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><FileText size={18}/></div>
                     <div><p className="text-sm font-bold">Criar Petição</p><p className="text-[10px] text-gray-500">Novo caso customizado</p></div>
                  </button>
               </div>
            </div>
            <button onClick={() => onChangeView('scenarios')} className="text-legal-600 text-xs font-bold hover:underline flex items-center gap-1 justify-center mt-4">Ver todos os recursos <ArrowRight size={14}/></button>
         </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatsCard icon={Clock} label="Prática Total" value={`${stats.totalHours}h`} color="text-blue-600" bg="bg-blue-50" />
         <StatsCard icon={Award} label="Casos Concluídos" value={stats.completedCases} color="text-green-600" bg="bg-green-50" />
         <StatsCard icon={Target} label="Média de Score" value={`${stats.avgScore}%`} color="text-amber-600" bg="bg-amber-50" />
         <StatsCard icon={ShieldCheck} label="Nível Atual" value={stats.rank} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-2xl border border-legal-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-legal-900 text-lg">Evolução Técnica</h3>
               <select className="text-xs border-none bg-slate-50 rounded-lg px-2 py-1 outline-none">
                  <option>Últimos 30 dias</option>
                  <option>Este Ano</option>
               </select>
            </div>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                     <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#102a43" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#102a43" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="pontuacao" stroke="#102a43" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                     <Area type="monotone" dataKey="argumentacao" stroke="#c5a065" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-8 rounded-2xl border border-legal-100 shadow-sm">
            <h3 className="font-bold text-legal-900 text-lg mb-6">Áreas de Especialização</h3>
            <div className="h-64 flex flex-col md:flex-row items-center gap-8">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={[
                           { name: 'Civil', value: 45 },
                           { name: 'Penal', value: 30 },
                           { name: 'Trabalho', value: 15 },
                           { name: 'Empresarial', value: 10 },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {evolutionData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
               <div className="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0">
                  {['Civil', 'Penal', 'Trabalho', 'Empresa'].map((label, i) => (
                     <div key={label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                        <span className="text-xs font-bold text-gray-600">{label}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-legal-100 flex items-center gap-4 hover:shadow-md transition group">
    <div className={`p-3 ${bg} ${color} rounded-xl group-hover:scale-110 transition`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-serif font-bold text-legal-900">{value}</p>
    </div>
  </div>
);