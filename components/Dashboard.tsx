import React, { useEffect, useState } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole } from '../types';
import { Clock, Award, TrendingUp, FileText, PlayCircle, ShieldCheck, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', horas: 4 },
  { name: 'Fev', horas: 8 },
  { name: 'Mar', horas: 12 },
  { name: 'Abr', horas: 10 },
  { name: 'Mai', horas: 15 },
  { name: 'Jun', horas: 20 },
];

export const Dashboard: React.FC<{ onStartScenario: (id: string) => void, user: User }> = ({ onStartScenario, user }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);

  useEffect(() => {
    // Load real progress linked to current user
    const updated = SCENARIOS.map(s => ({
      ...s,
      progress: persistenceService.getScenarioProgress(user.id, s.id)
    }));
    setScenarios(updated);
  }, [user.id]);

  const totalProgress = scenarios.reduce((acc, curr) => acc + curr.progress, 0);
  const avgProgress = Math.round(totalProgress / scenarios.length);

  const isAdmin = user.role === UserRole.ADMIN;

  const handleAdminReset = () => {
     if(confirm("ATENÇÃO ADMIN: Isso apagará todos os dados de progresso e histórico de todos os usuários neste navegador. Confirmar?")) {
        persistenceService.resetAll();
        window.location.reload();
     }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-2xl md:text-3xl font-serif font-bold text-legal-900">Olá, {user.name}</h2>
             {isAdmin && (
                <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                   <ShieldCheck size={14}/> ADMIN
                </div>
             )}
          </div>
          <p className="text-legal-500 mt-1">
             {isAdmin ? 'Painel de Controle Administrativo.' : 'Continue seu treinamento de onde parou.'}
          </p>
        </div>
        
        {isAdmin && (
           <button onClick={handleAdminReset} className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg transition border border-red-100">
              <Trash2 size={14}/> Resetar Sistema
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Clock size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">32h</div><div className="text-xs text-gray-500 uppercase font-medium">Tempo de Prática</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Award size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">{avgProgress}%</div><div className="text-xs text-gray-500 uppercase font-medium">Média Geral</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">{scenarios.filter(s => s.progress === 100).length}</div><div className="text-xs text-gray-500 uppercase font-medium">Casos Concluídos</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-legal-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp size={24} /></div>
          <div><div className="text-2xl font-bold text-gray-900">{isAdmin ? 'AAA' : 'B+'}</div><div className="text-xs text-gray-500 uppercase font-medium">Nível</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-legal-800 flex items-center gap-2"><PlayCircle size={20} /> Cenários Disponíveis</h3>
          <div className="bg-white rounded-xl shadow-sm border border-legal-100 divide-y divide-legal-100">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${scenario.area === 'Civil' ? 'bg-blue-100 text-blue-700' : scenario.area === 'Penal' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{scenario.area}</span>
                    <span className="text-xs text-gray-400">• {scenario.difficulty}</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{scenario.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
                  <div className="mt-3 w-full max-w-xs bg-gray-200 rounded-full h-1.5"><div className="bg-legal-600 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${scenario.progress}%` }}></div></div>
                </div>
                <button onClick={() => onStartScenario(scenario.id)} className="px-6 py-2 bg-legal-800 text-white rounded-lg hover:bg-legal-700 transition font-medium text-sm whitespace-nowrap shadow-md">
                  {isAdmin ? 'Gerenciar' : (scenario.progress > 0 ? 'Continuar' : 'Iniciar')}
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
        </div>
      </div>
    </div>
  );
};