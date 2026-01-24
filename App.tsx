
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
import { persistenceService } from './services/persistence';
import { MOCK_USER, SCENARIOS } from './constants';
import { CourtRole, User as UserType } from './types';
import { X, User as UserIcon, Shield, Gavel, Scale, Users, PlayCircle, Info } from 'lucide-react';

const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room')?.trim();
    const restoredUser = persistenceService.restoreSession();
    
    if (restoredUser) {
      setUser(restoredUser);
      setIsAuthenticated(true);
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
     const all = [...SCENARIOS, ...persistenceService.getCustomScenarios(user.id)];
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
      case 'settings':
        return <Settings user={user} onLogout={handleLogout} />;
      default:
        return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
    }
  };

  if (isLoadingSession) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando JuriSim...</div>;
  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen overflow-hidden">
      {['simulation_active', 'multiplayer_active', 'simulation_briefing', 'simulation_hub'].includes(currentView) ? (
        renderContent()
      ) : (
        <Layout user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout}>
          {renderContent()}
        </Layout>
      )}

      {showRoleSelection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
              <div className="p-8 bg-legal-900 text-white flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-serif font-bold">Identificação Processual</h2>
                    <p className="text-legal-400 text-sm">Selecione seu papel nesta audiência ao vivo</p>
                 </div>
                 <button onClick={() => setShowRoleSelection(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24}/></button>
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
    className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-accent-gold hover:bg-slate-50 transition-all text-left group"
  >
     <div className="bg-legal-100 p-3 rounded-xl text-legal-900 group-hover:bg-accent-gold group-hover:text-legal-900 transition-colors">
        <Icon size={24}/>
     </div>
     <div>
        <h4 className="font-bold text-legal-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
     </div>
  </button>
);

export default App;
