import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole } from '../types';
import { Search, Filter, BookOpen, Play, CheckCircle, Lock } from 'lucide-react';

interface ScenariosViewProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onStartScenario, user, onUpgrade }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Iniciante' | 'Intermediário' | 'Avançado'>('All');
  const [filterArea, setFilterArea] = useState<'All' | 'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial'>('All');

  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;

  useEffect(() => {
    const updated = SCENARIOS.map(s => ({
      ...s,
      progress: persistenceService.getScenarioProgress(user.id, s.id)
    }));
    setScenarios(updated);
  }, [user.id]);

  const filteredScenarios = scenarios.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = filterDifficulty === 'All' || s.difficulty === filterDifficulty;
    const matchesArea = filterArea === 'All' || s.area === filterArea;
    return matchesSearch && matchesDiff && matchesArea;
  });

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h1 className="text-3xl font-serif font-bold text-legal-900 flex items-center gap-3">
              <BookOpen className="text-accent-gold" /> Biblioteca de Casos
           </h1>
           <p className="text-legal-500 mt-2">Explore simulações jurídicas práticas categorizadas por área e dificuldade.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-legal-100 flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
             <Search className="absolute left-3 top-3 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Buscar por título ou palavra-chave..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-legal-500 transition"
             />
         </div>
         <div className="flex gap-2">
            <select 
               value={filterArea} 
               onChange={(e) => setFilterArea(e.target.value as any)}
               className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-legal-500 cursor-pointer"
            >
               <option value="All">Todas as Áreas</option>
               <option value="Civil">Civil</option>
               <option value="Penal">Penal</option>
               <option value="Trabalhista">Trabalhista</option>
            </select>
            <select 
               value={filterDifficulty} 
               onChange={(e) => setFilterDifficulty(e.target.value as any)}
               className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-legal-500 cursor-pointer"
            >
               <option value="All">Dificuldade</option>
               <option value="Iniciante">Iniciante</option>
               <option value="Intermediário">Intermediário</option>
               <option value="Avançado">Avançado</option>
            </select>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScenarios.map((scenario) => {
           const isLocked = scenario.difficulty === 'Avançado' && !isPremium;
           
           return (
             <div key={scenario.id} className={`group bg-white rounded-xl border border-legal-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <div className="p-6 flex-1">
                   <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide
                         ${scenario.area === 'Civil' ? 'bg-blue-50 text-blue-700' : 
                           scenario.area === 'Penal' ? 'bg-red-50 text-red-700' : 
                           'bg-green-50 text-green-700'}`}>
                         {scenario.area}
                      </span>
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                         {isLocked && <Lock size={12}/>} {scenario.difficulty}
                      </span>
                   </div>
                   
                   <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-legal-700 transition-colors">
                      {scenario.title}
                   </h3>
                   <p className="text-sm text-gray-500 line-clamp-3 mb-6">
                      {scenario.description}
                   </p>

                   {/* Progress Bar */}
                   <div className="mt-auto">
                      <div className="flex justify-between text-xs mb-1">
                         <span className="text-gray-400 font-medium">Progresso</span>
                         <span className="text-legal-600 font-bold">{scenario.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                         <div 
                           className={`h-2 rounded-full transition-all duration-1000 ${scenario.progress === 100 ? 'bg-green-500' : 'bg-legal-600'}`} 
                           style={{ width: `${scenario.progress}%` }}
                         />
                      </div>
                   </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-legal-100 flex items-center justify-between">
                   {scenario.progress === 100 ? (
                      <span className="text-green-600 text-sm font-bold flex items-center gap-2"><CheckCircle size={16}/> Concluído</span>
                   ) : (
                      <span className="text-gray-400 text-sm">~ 45 min</span>
                   )}
                   
                   <button 
                     onClick={() => isLocked ? onUpgrade() : onStartScenario(scenario.id)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm
                        ${isLocked 
                           ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' 
                           : 'bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900'}`}
                   >
                     {isLocked ? <Lock size={14}/> : <Play size={14}/>}
                     {isLocked ? 'Premium' : (scenario.progress > 0 ? 'Continuar' : 'Iniciar')}
                   </button>
                </div>
             </div>
           );
        })}
      </div>
      
      {filteredScenarios.length === 0 && (
         <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum caso encontrado</h3>
            <p className="text-gray-500">Tente ajustar seus filtros de busca.</p>
         </div>
      )}
    </div>
  );
};