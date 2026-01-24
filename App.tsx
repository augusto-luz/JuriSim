
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SimulationChat } from './components/SimulationChat';
import { CaseBriefing } from './components/CaseBriefing';
import { MultiplayerRoom } from './components/MultiplayerRoom';
import { Pricing } from './components/Pricing';
import { ScenariosView } from './components/ScenariosView';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { InstructorPanel } from './components/InstructorPanel';
import { persistenceService } from './services/persistence';
import { MOCK_USER, SCENARIOS } from './constants';
import { CourtRole, User as UserType, UserRole, Scenario, Attachment } from './types';
import { X, User as UserIcon, Shield, Gavel, Scale, Users, PlayCircle, Info, PlusCircle, Save, FileText, Upload, Download, Trash2 } from 'lucide-react';

const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const CaseCreatorModal = ({ onClose, onSave, userId }: { onClose: () => void, onSave: () => void, userId: string }) => {
  const [scenario, setScenario] = useState<Partial<Scenario>>({
    id: `custom-${Date.now()}`,
    title: '',
    difficulty: 'Intermediário',
    area: 'Civil',
    facts: '',
    evidence: [],
    witnesses: [],
    objectives: [],
    progress: 0,
    createdBy: userId,
    attachments: []
  });
  
  const [newEvidence, setNewEvidence] = useState('');
  const [newWitness, setNewWitness] = useState('');
  const [newObjective, setNewObjective] = useState('');

  const handleSave = () => {
    if (!scenario.title || !scenario.facts) {
      alert("Os campos Título e Exposição dos Fatos são essenciais para o motor de IA processar o caso.");
      return;
    }
    persistenceService.saveCustomScenario(scenario as Scenario);
    onSave();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        url: URL.createObjectURL(file)
      };
      setScenario(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAttachment] }));
    }
  };

  const removeAttachment = (id: string) => {
    setScenario(prev => ({ ...prev, attachments: prev.attachments?.filter(a => a.id !== id) }));
  };

  const removeEvidence = (index: number) => {
    setScenario(prev => ({ ...prev, evidence: prev.evidence?.filter((_, i) => i !== index) }));
  };

  const removeObjective = (index: number) => {
    setScenario(prev => ({ ...prev, objectives: prev.objectives?.filter((_, i) => i !== index) }));
  };

  const removeWitness = (index: number) => {
    setScenario(prev => ({ ...prev, witnesses: prev.witnesses?.filter((_, i) => i !== index) }));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-legal-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
       <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl my-8 animate-in zoom-in-95 overflow-hidden border border-slate-200">
          <div className="p-8 bg-legal-900 text-white flex justify-between items-center shadow-lg">
             <div>
                <h2 className="text-2xl font-serif font-bold">Protocolar Novo Caso Acadêmico</h2>
                <p className="text-legal-400 text-sm font-medium">Configure as bases processuais para simulação</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition active:scale-95"><X size={24}/></button>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
             <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Processo / Caso</label>
                   <input value={scenario.title} onChange={e=>setScenario({...scenario, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-accent-gold transition" placeholder="Ex: Indenização por Erro Médico" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Área do Direito</label>
                      <select value={scenario.area} onChange={e=>setScenario({...scenario, area: e.target.value as any})} className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-accent-gold transition">
                         <option>Civil</option><option>Penal</option><option>Trabalhista</option><option>Empresarial</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível de Dificuldade</label>
                      <select value={scenario.difficulty} onChange={e=>setScenario({...scenario, difficulty: e.target.value as any})} className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-accent-gold transition">
                         <option>Iniciante</option><option>Intermediário</option><option>Avançado</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exposição Detalhada dos Fatos</label>
                   <textarea value={scenario.facts} onChange={e=>setScenario({...scenario, facts: e.target.value})} className="w-full h-48 p-4 bg-slate-50 border rounded-2xl text-sm leading-relaxed shadow-inner outline-none focus:ring-2 focus:ring-accent-gold transition" placeholder="Narração detalhada que a IA usará como verdade processual..." />
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Anexos de Autos (PDF/Imagens)</label>
                   <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all shadow-inner group">
                         <div className="flex items-center gap-3 text-slate-400 group-hover:text-accent-gold transition-colors">
                            <Upload size={20}/>
                            <span className="text-xs font-bold uppercase tracking-tight">Upload de Documentos Digitais</span>
                         </div>
                         <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                   </div>
                   <div className="flex flex-wrap gap-2 mt-2">
                      {scenario.attachments?.map(a => (
                         <div key={a.id} className="group flex items-center gap-2 px-3 py-1.5 bg-legal-50 text-legal-900 border border-legal-100 rounded-xl text-[10px] font-bold shadow-sm">
                            <FileText size={12}/> {a.name}
                            <button onClick={() => removeAttachment(a.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Excluir Anexo">
                               <X size={12}/>
                            </button>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Acervo Probatório (Texto)</label>
                   <div className="flex gap-2">
                      <input value={newEvidence} onChange={e=>setNewEvidence(e.target.value)} className="flex-1 p-3 bg-slate-50 border rounded-xl text-xs font-medium shadow-inner outline-none" placeholder="Ex: Laudo Pericial de fls. 45" />
                      <button onClick={() => { if(newEvidence) setScenario({...scenario, evidence: [...(scenario.evidence || []), newEvidence]}); setNewEvidence(''); }} className="p-3 bg-legal-900 text-white rounded-xl hover:bg-accent-gold hover:text-legal-900 transition shadow-md active:scale-95"><PlusCircle size={18}/></button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {scenario.evidence?.map((e,i)=>(
                        <span key={i} className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold flex items-center gap-2 border shadow-sm">
                           {e} 
                           <button onClick={() => removeEvidence(i)} className="text-slate-400 hover:text-red-600 transition-colors"><X size={10}/></button>
                        </span>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rol de Testemunhas</label>
                   <div className="flex gap-2">
                      <input value={newWitness} onChange={e=>setNewWitness(e.target.value)} className="flex-1 p-3 bg-slate-50 border rounded-xl text-xs font-medium shadow-inner outline-none" placeholder="Ex: Maria das Graças (Enfermeira)" />
                      <button onClick={() => { if(newWitness) setScenario({...scenario, witnesses: [...(scenario.witnesses || []), newWitness]}); setNewWitness(''); }} className="p-3 bg-legal-900 text-white rounded-xl hover:bg-accent-gold hover:text-legal-900 transition shadow-md active:scale-95"><PlusCircle size={18}/></button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {scenario.witnesses?.map((w,i)=>(
                        <span key={i} className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold flex items-center gap-2 border shadow-sm">
                           {w} 
                           <button onClick={() => removeWitness(i)} className="text-slate-400 hover:text-red-600 transition-colors"><X size={10}/></button>
                        </span>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Objetivos Estratégicos da Defesa/Acusação</label>
                   <div className="flex gap-2">
                      <input value={newObjective} onChange={e=>setNewObjective(e.target.value)} className="flex-1 p-3 bg-slate-50 border rounded-xl text-xs font-medium shadow-inner outline-none" placeholder="Ex: Provar nexo causal" />
                      <button onClick={() => { if(newObjective) setScenario({...scenario, objectives: [...(scenario.objectives || []), newObjective]}); setNewObjective(''); }} className="p-3 bg-legal-900 text-white rounded-xl hover:bg-accent-gold hover:text-legal-900 transition shadow-md active:scale-95"><PlusCircle size={18}/></button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {scenario.objectives?.map((o,i)=>(
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-blue-100 shadow-sm">
                           {o} 
                           <button onClick={() => removeObjective(i)} className="text-blue-400 hover:text-red-600 transition-colors"><X size={10}/></button>
                        </span>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="p-8 border-t bg-slate-50 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button onClick={onClose} className="px-8 py-3 text-slate-500 font-bold text-sm hover:text-legal-900 transition-colors">Cancelar Protocolo</button>
             <button onClick={handleSave} className="px-12 py-4 bg-legal-900 text-white rounded-[1.2rem] font-bold text-sm flex items-center gap-3 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-xl active:scale-[0.98] border border-transparent hover:border-accent-gold/20">
                <Save size={20}/> Protocolar Autos e Liberar IA
             </button>
          </div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType>(MOCK_USER);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  
  const [multiplayerRole, setMultiplayerRole] = useState<CourtRole | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isHost, setIsHost] = useState(false);
  
  const [showCaseCreator, setShowCaseCreator] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room')?.trim();
    const restoredUser = persistenceService.restoreSession();
    
    if (restoredUser) {
      if (restoredUser.status === 'suspended') {
        persistenceService.clearSession();
      } else {
        setUser(restoredUser);
        setIsAuthenticated(true);
      }
    }
    
    if (roomParam) {
        const normalizedRoom = roomParam.toUpperCase();
        setJoinCodeInput(normalizedRoom);
        setActiveRoomId(normalizedRoom);
        const previousRole = restoredUser ? persistenceService.getRoleForRoom(restoredUser.id, normalizedRoom) : null;
        if (previousRole) {
          setMultiplayerRole(previousRole);
          setIsHost(false);
          setCurrentView('multiplayer_active');
        } else {
          setIsHost(false); 
          setShowRoleSelection(true);
          setCurrentView('multiplayer');
        }
    }
    setIsLoadingSession(false);

    const handleOpenCaseModal = () => setShowCaseCreator(true);
    window.addEventListener('OPEN_CASE_MODAL', handleOpenCaseModal);
    return () => window.removeEventListener('OPEN_CASE_MODAL', handleOpenCaseModal);
  }, []);

  const handleLogin = (loggedUser: UserType, rememberMe: boolean) => {
    setUser(loggedUser);
    setIsAuthenticated(true);
    persistenceService.saveSession(loggedUser, rememberMe);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(MOCK_USER);
    setCurrentView('dashboard');
    persistenceService.clearSession();
  };

  const startScenario = (id: string) => {
    setActiveScenarioId(id);
    setCurrentView('simulation_briefing');
  };

  const navigateToSimulation = () => {
     const all = [...SCENARIOS, ...persistenceService.getCustomScenarios()];
     const withProgress = all
       .map(s => ({ ...s, progress: persistenceService.getScenarioProgress(user.id, s.id) }))
       .filter(s => s.progress > 0 && s.progress < 100)
       .sort((a, b) => b.progress - a.progress);

     if (withProgress.length > 0) {
        setActiveScenarioId(withProgress[0].id);
        setCurrentView('simulation_active');
     } else {
        setCurrentView('simulation_hub');
     }
  };

  const handleSelectRole = (role: CourtRole) => {
    setMultiplayerRole(role);
    setShowRoleSelection(false);
    setCurrentView('multiplayer_active');
    
    persistenceService.saveRoomHistory(user.id, {
      roomId: activeRoomId,
      role: role,
      title: `Sessão ${activeRoomId}`,
      timestamp: Date.now()
    });
  };

  const renderContent = () => {
    if (currentView === 'pricing') return <Pricing onSelectPlan={() => alert("Assinatura liberada via API Key")} onCancel={() => setCurrentView('dashboard')} />;

    if (currentView === 'simulation_briefing' && activeScenarioId) {
       const scenario = persistenceService.getScenarioById(user.id, activeScenarioId);
       return scenario ? <CaseBriefing scenario={scenario} onStart={() => setCurrentView('simulation_active')} onBack={() => setCurrentView('scenarios')} /> : null;
    }
    
    if (currentView === 'simulation_active' && activeScenarioId) {
      const scenario = persistenceService.getScenarioById(user.id, activeScenarioId);
      return scenario ? <SimulationChat scenario={scenario} onExit={() => setCurrentView('scenarios')} user={user} /> : null;
    }

    if (currentView === 'simulation_hub') {
       return (
         <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
               <div className="bg-legal-900 w-20 h-20 rounded-3xl flex items-center justify-center text-accent-gold mx-auto mb-8 shadow-xl">
                  <PlayCircle size={40}/>
               </div>
               <h2 className="text-3xl font-serif font-bold text-legal-900 mb-4">Pronto para praticar?</h2>
               <p className="text-slate-500 mb-10 leading-relaxed">Você ainda não tem audiências em curso. Escolha um caso na biblioteca de cenários para iniciar sua simulação com IA.</p>
               <button onClick={() => setCurrentView('scenarios')} className="w-full py-5 bg-legal-900 text-white rounded-2xl font-bold shadow-xl hover:bg-accent-gold hover:text-legal-900 transition-all flex items-center justify-center gap-3">
                  Acessar Biblioteca <X className="rotate-45" size={18}/>
               </button>
            </div>
         </div>
       );
    }

    if (currentView === 'multiplayer_active' && multiplayerRole) {
      return <MultiplayerRoom onExit={() => { setCurrentView('multiplayer'); setMultiplayerRole(null); }} currentUserRole={multiplayerRole} roomId={activeRoomId} user={user} isHost={isHost} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'scenarios':
        return <ScenariosView onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} />;
      case 'simulation':
        navigateToSimulation();
        return null;
      case 'multiplayer':
        return (
          <MultiplayerLobby 
            onStartNewMeeting={() => { 
              const newId = generateShortCode();
              setActiveRoomId(newId); 
              setIsHost(true); 
              setShowRoleSelection(true); 
            }} 
            onJoinMeeting={(role) => {
              if (role) {
                handleSelectRole(role);
              } else if (joinCodeInput) {
                const normalizedCode = joinCodeInput.trim().toUpperCase();
                setActiveRoomId(normalizedCode);
                setIsHost(false); 
                setShowRoleSelection(true);
              }
            }} 
            joinCode={joinCodeInput} 
            setJoinCode={(code) => setJoinCodeInput(code.trim().toUpperCase())} 
            user={user} 
          />
        );
      case 'admin_panel':
        return user.role === UserRole.ADMIN ? <AdminPanel /> : <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'instructor_panel':
        return (user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN) ? <InstructorPanel user={user} /> : <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'settings':
        return <Settings user={user} onLogout={handleLogout} />;
      default:
        return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
    }
  };

  if (isLoadingSession) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-serif text-legal-900">Carregando Tribunal Virtual JuriSim...</div>;
  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen overflow-hidden font-sans">
      {['simulation_active', 'multiplayer_active', 'simulation_briefing', 'simulation_hub'].includes(currentView) ? (
        renderContent()
      ) : (
        <Layout user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout}>
          {renderContent()}
        </Layout>
      )}

      {showCaseCreator && (
         <CaseCreatorModal userId={user.id} onClose={() => setShowCaseCreator(false)} onSave={() => { setShowCaseCreator(false); setCurrentView('scenarios'); }} />
      )}

      {showRoleSelection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
              <div className="p-8 bg-legal-900 text-white flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-serif font-bold">Identificação Processual</h2>
                    <p className="text-legal-400 text-sm">Selecione seu papel nesta audiência ao vivo</p>
                 </div>
                 <button onClick={() => setShowRoleSelection(false)} className="p-2 hover:bg-white/10 rounded-full transition active:scale-95"><X size={24}/></button>
              </div>
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <RoleOption icon={Gavel} title="Juiz de Direito" role={CourtRole.JUDGE} onClick={handleSelectRole} description="Presida a sessão e profira a sentença final." />
                 <RoleOption icon={Scale} title="Promotor de Justiça" role={CourtRole.PROSECUTOR} onClick={handleSelectRole} description="Represente o Ministério Público no caso." />
                 <RoleOption icon={Shield} title="Advogado de Defesa" role={CourtRole.DEFENSE} onClick={handleSelectRole} description="Defenda os direitos e garantias do acusado." />
                 <RoleOption icon={Users} title="Testemunha" role={CourtRole.WITNESS} onClick={handleSelectRole} description="Preste seu depoimento sobre os fatos." />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const RoleOption = ({ icon: Icon, title, role, onClick, description }: any) => (
  <button 
    onClick={() => onClick(role)}
    className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-accent-gold hover:bg-slate-50 transition-all text-left group active:scale-95 shadow-sm"
  >
     <div className="bg-legal-100 p-3 rounded-xl text-legal-900 group-hover:bg-accent-gold group-hover:text-legal-900 transition-colors shadow-inner">
        <Icon size={24}/>
     </div>
     <div className="flex-1 min-w-0">
        <h4 className="font-bold text-legal-900 truncate">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{description}</p>
     </div>
  </button>
);

export default App;
