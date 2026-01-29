
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
import { Settings } from './components/Settings.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { InstructorPanel } from './components/InstructorPanel.tsx';
import { persistenceService } from './services/persistence.ts';
import { MOCK_USER, SCENARIOS } from './constants.ts';
import { User as UserType, UserRole } from './types.ts';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType>(MOCK_USER);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  useEffect(() => {
    const restored = persistenceService.restoreSession();
    if (restored) {
      setUser(restored);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (loggedUser: UserType, rememberMe: boolean) => {
    setUser(loggedUser);
    setIsAuthenticated(true);
    persistenceService.saveSession(loggedUser, rememberMe);
  };

  const startScenario = (id: string) => {
    setActiveScenarioId(id);
    setCurrentView('simulation_briefing');
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

    switch (currentView) {
      case 'dashboard': return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'simulation': return <SimulationIA onStartScenario={startScenario} user={user} />;
      case 'scenarios': return <ScenariosView onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} />;
      case 'multiplayer': return <MultiplayerLobby onStartNewMeeting={() => {}} onJoinMeeting={() => {}} joinCode="" setJoinCode={() => {}} user={user} />;
      case 'admin_panel': return user.role === UserRole.ADMIN ? <AdminPanel /> : <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'instructor_panel': return (user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN) ? <InstructorPanel user={user} /> : <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
      case 'settings': return <Settings user={user} onLogout={() => setIsAuthenticated(false)} />;
      default: return <Dashboard onStartScenario={startScenario} user={user} onUpgrade={() => setCurrentView('pricing')} onChangeView={setCurrentView} />;
    }
  };

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Layout user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={() => setIsAuthenticated(false)}>
        {renderContent()}
      </Layout>
    </div>
  );
};

export default App;
