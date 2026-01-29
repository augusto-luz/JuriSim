
import React, { useEffect, useState } from 'react';
import { SCENARIOS } from '../constants.ts';
import { persistenceService } from '../services/persistence.ts';
import { Scenario, User, UserPerformance } from '../types.ts';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RT
} from 'recharts';
import { Play, Clock, Target, Activity, FileText } from 'lucide-react';

interface SimulationIAProps {
  onStartScenario: (id: string) => void;
  user: User;
}

export const SimulationIA: React.FC<SimulationIAProps> = ({ onStartScenario, user }) => {
  const [activeScenarios, setActiveScenarios] = useState<Scenario[]>([]);
  const [perf, setPerf] = useState<UserPerformance | null>(null);

  useEffect(() => {
    const p = persistenceService.getUserPerformance(user.id);
    setPerf(p);
    
    const all = [...SCENARIOS, ...persistenceService.getCustomScenarios()];
    const filtered = all
      .map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) }))
      .filter(s => s.progress > 0)
      .sort((a, b) => b.progress - a.progress);
    
    setActiveScenarios(filtered);
  }, [user.id]);

  const radarData = [
    { subject: 'Oratória', A: perf?.avgOratory || 20, fullMark: 100 },
    { subject: 'Processual', A: perf?.avgProcedural || 20, fullMark: 100 },
    { subject: 'Provas', A: perf?.avgEvidence || 20, fullMark: 100 },
    { subject: 'Retórica', A: (perf?.avgOratory || 20) * 0.8, fullMark: 100 },
    { subject: 'Ética', A: 90, fullMark: 100 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
       <div className="flex justify-between items-end">
          <div>
             <h1 className="text-3xl font-serif font-bold text-legal-900">Minhas Simulações</h1>
             <p className="text-sm text-slate-500">Monitoramento técnico e progressão em tempo real.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white px-4 py-2 rounded-xl border flex items-center gap-2">
                <Target className="text-accent-gold" size={16}/>
                <span className="text-xs font-bold text-legal-900">{perf?.totalSimulations || 0} Sessões</span>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14}/> Histórico de Progressão
             </h3>
             <div className="space-y-4">
                {activeScenarios.map(s => (
                   <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-[9px] font-black px-2 py-0.5 bg-legal-900 text-white rounded-full uppercase">{s.area}</span>
                            <h4 className="font-bold text-legal-900">{s.title}</h4>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-accent-gold" style={{width: `${s.progress}%`}}/>
                            </div>
                            <span className="text-[10px] font-black text-slate-400">{s.progress}%</span>
                         </div>
                      </div>
                      <button onClick={() => onStartScenario(s.id)} className="ml-8 p-4 bg-slate-50 text-legal-900 rounded-2xl hover:bg-accent-gold transition shadow-inner group-hover:scale-110">
                         <Play size={20} fill="currentColor"/>
                      </button>
                   </div>
                ))}
                {activeScenarios.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed text-slate-300">
                     Nenhuma simulação iniciada. Escolha um caso na biblioteca.
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14}/> Radar de Competências
             </h3>
             <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm aspect-square">
                <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <Radar name="Performance" dataKey="A" stroke="#102a43" fill="#102a43" fillOpacity={0.5} />
                   </RadarChart>
                </ResponsiveContainer>
             </div>
             
             <div className="bg-legal-900 p-6 rounded-[2rem] text-white">
                <h4 className="font-bold mb-2">Dica do Corregedor IA</h4>
                <p className="text-xs text-legal-300 leading-relaxed italic">
                   "Seu desempenho em Provas está 15% acima da média nacional para sua categoria. Foque em melhorar a Oratória nas próximas audiências de rito ordinário."
                </p>
             </div>
          </div>
       </div>
    </div>
  );
};
