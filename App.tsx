
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
import { MOCK_USER } from './constants';
import { CourtRole, User as UserType } from './types';

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
    const roomParam = params.get('room');
    const restoredUser = persistenceService.restoreSession();
    if (restoredUser) {
      setUser(restoredUser);
      setIsAuthenticated(true);
    }
    if (roomParam) {
        setJoinCodeInput(roomParam);
        setActiveRoomId(roomParam);
        setIsHost(false); 
        setShowRoleSelection(true);
        setCurrentView('multiplayer');
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

  const renderContent = () => {
    if (currentView === 'pricing') return <Pricing onSelectPlan={() => alert("Gateway em manutenção")} onCancel={() => setCurrentView('dashboard')} />;

    if (currentView === 'simulation_briefing' && activeScenarioId) {
       const scenario = persistenceService.getScenarioById(user.id, activeScenarioId);
       return scenario ? <CaseBriefing scenario={scenario} onStart={() => setCurrentView('simulation_active')} onBack={() => setCurrentView('scenarios')} /> : null;
    }
    
    if (currentView === 'simulation_active' && activeScenarioId) {
      const scenario = persistenceService.getScenarioById(user.id, activeScenarioId);
      return scenario ? <SimulationChat scenario={scenario} onExit={() => setCurrentView('scenarios')} user={user} /> : null;
    }

    if (currentView === 'multiplayer_active' && multiplayerRole) {
      return <MultiplayerRoom onExit={() => setCurrentView('multiplayer')} currentUserRole={multiplayerRole} roomId={activeRoomId} user={user} isHost={isHost} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'scenarios':
      case 'simulation':
        return <ScenariosView onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} />;
      case 'multiplayer':
        return <MultiplayerLobby onStartNewMeeting={() => { setActiveRoomId('room-'+Date.now()); setIsHost(true); setShowRoleSelection(true); }} onJoinMeeting={() => setShowRoleSelection(true)} joinCode={joinCodeInput} setJoinCode={setJoinCodeInput} user={user} />;
      case 'settings':
        return <Settings user={user} onLogout={handleLogout} />;
      default:
        return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
    }
  };

  if (isLoadingSession) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando...</div>;
  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen overflow-hidden">
      {['simulation_active', 'multiplayer_active', 'simulation_briefing'].includes(currentView) ? (
        renderContent()
      ) : (
        <Layout user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout}>
          {renderContent()}
        </Layout>
      )}
    </div>
  );
};

export default App;
