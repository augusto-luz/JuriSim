
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth.tsx';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { SimulationChat } from './components/SimulationChat.tsx';
import { CaseBriefing } from './components/CaseBriefing.tsx';
import { SimulationIA } from './components/SimulationIA.tsx';
import { Pricing } from './components/Pricing.tsx';
import { ScenariosView } from './components/ScenariosView.tsx';
import { MultiplayerLobby } from './components/MultiplayerLobby.tsx';
import { MultiplayerRoom } from './components/MultiplayerRoom.tsx';
import { Settings } from './components/Settings.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { InstructorPanel } from './components/InstructorPanel.tsx';
import { NewCaseModal } from './components/NewCaseModal.tsx';
import { persistenceService } from './services/persistence.ts';
import { MOCK_USER } from './constants.ts';
import { User as UserType, UserRole, CourtRole } from './types.ts';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType>(MOCK_USER);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Multiplayer States
  const [joinCode, setJoinCode] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomRole, setRoomRole] = useState<CourtRole>(CourtRole.JUDGE);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const savedUser = persistenceService.restoreSession();
    if (savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);

    const openModalListener = () => setIsCaseModalOpen(true);
    window.addEventListener('OPEN_CASE_MODAL', openModalListener);
    
    return () => {
      window.removeEventListener('OPEN_CASE_MODAL', openModalListener);
    };
  }, []);

  const handleLogin = (loggedUser: UserType, rememberMe: boolean) => {
    setUser(loggedUser);
    setIsAuthenticated(true);
    persistenceService.saveSession(loggedUser, rememberMe);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(MOCK_USER);
    persistenceService.clearSession();
  };

  const startScenario = (id: string) => {
    setActiveScenarioId(id);
    setCurrentView('simulation_briefing');
  };

  const handleStartNewMeeting = () => {
    const newRoomId = `JURI-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setActiveRoomId(newRoomId);
    setRoomRole(CourtRole.JUDGE);
    setIsHost(true);
    setCurrentView('multiplayer_active');
    
    persistenceService.saveRoomHistory(user.id, {
      roomId: newRoomId,
      role: CourtRole.JUDGE,
      title: 'Audiência Magistrada',
      timestamp: Date.now()
    });
  };

  const handleJoinMeeting = (role?: CourtRole) => {
    if (!joinCode && !role) return;
    setActiveRoomId(joinCode);
    setRoomRole(role || CourtRole.DEFENSE);
    setIsHost(false);
    setCurrentView('multiplayer_active');
    
    persistenceService.saveRoomHistory(user.id, {
      roomId: joinCode,
      role: role || CourtRole.DEFENSE,
      title: 'Audiência Participativa',
      timestamp: Date.now()
    });
  };

  const renderContent = () => {
    if (currentView === 'simulation_briefing' && activeScenarioId) {
      const scenario = persistenceService.getScenarioById(user.id, activeScenarioId);
      return scenario ? <CaseBriefing scenario={scenario} onStart={() => setCurrentView('simulation_active')} onBack={() => setCurrentView('scenarios')} /> : null;
    }
    if (currentView === 'simulation_active' && activeScenarioId) {
      const scenario = persistenceService.getScenarioById(user.id, activeScenarioId);
      return scenario ? <SimulationChat scenario={scenario} onExit={() => setCurrentView('scenarios')} user={user} /> : null;
    }

    if (currentView === 'multiplayer_active' && activeRoomId) {
      return (
        <MultiplayerRoom 
          onExit={() => setCurrentView('multiplayer')} 
          currentUserRole={roomRole} 
          roomId={activeRoomId} 
          user={user} 
          isHost={isHost} 
        />
      );
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'simulation': return <SimulationIA onStartScenario={startScenario} user={user} />;
      case 'scenarios': return <ScenariosView onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} />;
      case 'multiplayer': return (
        <MultiplayerLobby 
          onStartNewMeeting={handleStartNewMeeting} 
          onJoinMeeting={handleJoinMeeting} 
          joinCode={joinCode} 
          setJoinCode={setJoinCode} 
          user={user} 
        />
      );
      case 'pricing': return <Pricing onSelectPlan={() => {}} onCancel={() => setCurrentView('dashboard')} />;
      case 'admin_panel': return user.role === UserRole.ADMIN ? <AdminPanel /> : <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'instructor_panel': return (user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN) ? <InstructorPanel user={user} /> : <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'settings': return <Settings user={user} onLogout={handleLogout} />;
      default: return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-legal-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-accent-gold border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-serif italic text-accent-gold">Carregando Tribunal Virtual...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <Layout user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout}>
        {renderContent()}
      </Layout>
      
      {isCaseModalOpen && (
        <NewCaseModal 
           user={user} 
           onClose={() => setIsCaseModalOpen(false)} 
           onSuccess={() => {
              window.dispatchEvent(new CustomEvent('CASE_CREATED'));
           }}
        />
      )}
    </div>
  );
};

export default App;
