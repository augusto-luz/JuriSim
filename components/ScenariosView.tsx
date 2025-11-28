import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { persistenceService } from '../services/persistence';
import { Scenario, User, UserRole } from '../types';
import { Search, Filter, BookOpen, Play, CheckCircle, Lock, Plus, X, Save, Trash2, FileText } from 'lucide-react';

interface ScenariosViewProps {
  onStartScenario: (id: string) => void;
  user: User;
  onUpgrade: () => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({ onStartScenario, user, onUpgrade }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Iniciante' | 'Intermediário' | 'Avançado'>('All');
  const [filterArea, setFilterArea] = useState<'All' | 'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial'>('All');
  
  // Creation Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newScenario, setNewScenario] = useState<{
    title: string;
    description: string;
    area: 'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial';
    difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  }>({
    title: '',
    description: '',
    area: 'Civil',
    difficulty: 'Iniciante'
  });

  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;

  // Load scenarios (Native + Custom)
  useEffect(() => {
    loadScenarios();
  }, [user.id]);

  const loadScenarios = () => {
    // 1. Get Built-in scenarios
    const nativeScenarios = SCENARIOS.map(s => ({
      ...s,
      progress: persistenceService.getScenarioProgress(user.id, s.id)
    }));

    // 2. Get Custom scenarios created by user
    const customScenarios = persistenceService.getCustomScenarios(user.id).map(s => ({
       ...s,
       progress: persistenceService.getScenarioProgress(user.id, s.id)
    }));

    setScenarios([...nativeScenarios, ...customScenarios]);
  };

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenario.title.trim() || !newScenario.description.trim()) return;

    const scenario: Scenario = {
      id: `custom_${Date.now()}`,
      title: newScenario.title,
      description: newScenario.description,
      area: newScenario.area,
      difficulty: newScenario.difficulty,
      progress: 0
    };

    persistenceService.saveCustomScenario(user.id, scenario);
    loadScenarios(); // Refresh list
    setIsCreating(false);
    setNewScenario({ title: '', description: '', area: 'Civil', difficulty: 'Iniciante' });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este caso criado?")) {
      persistenceService.deleteCustomScenario(user.id, id);
      loadScenarios();
    }
  };

  const filteredScenarios = scenarios.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = filterDifficulty === 'All' || s.difficulty === filterDifficulty;
    const matchesArea = filterArea === 'All' || s.area === filterArea;
    return matchesSearch && matchesDiff && matchesArea;
  });

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h1 className="text-3xl font-serif font-bold text-legal-900 flex items-center gap-3">
              <BookOpen className="text-accent-gold" /> Gestão de Casos
           </h1>
           <p className="text-legal-500 mt-2">Crie novos cenários jurídicos ou pratique com a biblioteca existente.</p>
        </div>
        <button 
           onClick={() => setIsCreating(true)}
           className="flex items-center gap-2 bg-legal-900 text-white px-5 py-3 rounded-lg hover:bg-legal-800 transition shadow-lg font-bold"
        >
           <Plus size={20}/> Criar Novo Caso
        </button>
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
               <option value="Empresarial">Empresarial</option>
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
           const isLocked = scenario.difficulty === 'Avançado' && !isPremium && !scenario.id.startsWith('custom_');
           const isCustom = scenario.id.startsWith('custom_');
           
           return (
             <div key={scenario.id} className={`group bg-white rounded-xl border border-legal-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <div className="p-6 flex-1">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide
                           ${scenario.area === 'Civil' ? 'bg-blue-50 text-blue-700' : 
                             scenario.area === 'Penal' ? 'bg-red-50 text-red-700' : 
                             scenario.area === 'Trabalhista' ? 'bg-green-50 text-green-700' :
                             'bg-orange-50 text-orange-700'}`}>
                           {scenario.area}
                        </span>
                        {isCustom && <span className="text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-purple-100 text-purple-700">Pessoal</span>}
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                           {isLocked && <Lock size={12}/>} {scenario.difficulty}
                         </span>
                         {isCustom && (
                           <button onClick={(e) => {e.stopPropagation(); handleDelete(scenario.id);}} className="text-gray-400 hover:text-red-500 transition">
                              <Trash2 size={14}/>
                           </button>
                         )}
                      </div>
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
                      <span className="text-gray-400 text-sm">Prática Livre</span>
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
            <p className="text-gray-500">Tente ajustar filtros ou criar um novo caso.</p>
         </div>
      )}

      {/* CREATE SCENARIO MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-legal-900 px-6 py-4 flex items-center justify-between text-white">
                 <h2 className="text-lg font-bold flex items-center gap-2"><FileText size={20} className="text-accent-gold"/> Criar Novo Caso</h2>
                 <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white transition"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleCreateScenario} className="p-6 space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Título do Caso</label>
                    <input 
                       required
                       autoFocus
                       type="text" 
                       value={newScenario.title}
                       onChange={e => setNewScenario({...newScenario, title: e.target.value})}
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-500 outline-none"
                       placeholder="Ex: Ação de Despejo por Falta de Pagamento"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-600 uppercase">Área do Direito</label>
                       <select 
                          value={newScenario.area}
                          onChange={e => setNewScenario({...newScenario, area: e.target.value as any})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-500 outline-none bg-white"
                       >
                          <option value="Civil">Civil</option>
                          <option value="Penal">Penal</option>
                          <option value="Trabalhista">Trabalhista</option>
                          <option value="Empresarial">Empresarial</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-600 uppercase">Nível de Dificuldade</label>
                       <select 
                          value={newScenario.difficulty}
                          onChange={e => setNewScenario({...newScenario, difficulty: e.target.value as any})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-500 outline-none bg-white"
                       >
                          <option value="Iniciante">Iniciante</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Descrição do Cenário</label>
                    <textarea 
                       required
                       value={newScenario.description}
                       onChange={e => setNewScenario({...newScenario, description: e.target.value})}
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-500 outline-none h-32 resize-none"
                       placeholder="Descreva brevemente os fatos, as partes envolvidas e o objetivo da simulação..."
                    />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 bg-legal-900 text-white rounded-lg font-bold hover:bg-legal-800 transition flex items-center justify-center gap-2"><Save size={18}/> Salvar Caso</button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};