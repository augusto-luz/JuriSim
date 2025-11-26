import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SimulationChat } from './components/SimulationChat';
import { MultiplayerRoom } from './components/MultiplayerRoom';
import { initializeGemini } from './services/geminiService';
import { persistenceService } from './services/persistence';
import { SCENARIOS, MOCK_USER } from './constants';
import { CourtRole, User as UserType } from './types';
import { Gavel, Users, User, ArrowRight, Shield, Scale, ScrollText, Video, Keyboard, Plus, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [user, setUser] = useState<UserType>(MOCK_USER);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  
  // Multiplayer specific states
  const [multiplayerRole, setMultiplayerRole] = useState<CourtRole | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    // Check if URL has room param
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    
    const session = persistenceService.restoreSession();
    if (session) {
      setApiKey(session.apiKey);
      setUser(session.user);
      if (session.apiKey) initializeGemini(session.apiKey);
      setIsAuthenticated(true);
    }
    
    if (roomParam) {
        // If accessed via link, auto-join flow
        setJoinCodeInput(roomParam);
        setActiveRoomId(roomParam);
        setIsHost(false); // Link joiners are guests
        setShowRoleSelection(true);
        setCurrentView('multiplayer');
    }

    setIsLoadingSession(false);
  }, []);

  const handleLogin = (key: string, loggedUser: UserType, rememberMe: boolean) => {
    setApiKey(key);
    setUser(loggedUser);
    if (key) initializeGemini(key);
    setIsAuthenticated(true);
    persistenceService.saveSession(key, loggedUser, rememberMe);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setApiKey('');
    setUser(MOCK_USER);
    setCurrentView('dashboard');
    persistenceService.clearSession();
  };

  const startScenario = (id: string) => {
    if (!apiKey) {
      alert("Para iniciar uma Simulação com IA, você precisa configurar uma Chave API nas Configurações ou no Login.");
      return;
    }
    setActiveScenarioId(id);
    setCurrentView('simulation_active');
  };

  const generateRoomCode = () => {
    const segment = () => Math.random().toString(36).substring(2, 5);
    return `${segment()}-${segment()}-${segment()}`;
  };

  const handleStartNewMeeting = () => {
    const newCode = generateRoomCode();
    setActiveRoomId(newCode);
    setIsHost(true); // Creator is Host
    setShowRoleSelection(true);
  };

  const handleJoinMeeting = () => {
    if (joinCodeInput.trim().length >= 5) {
      setActiveRoomId(joinCodeInput);
      setIsHost(false); // Joiner is Guest
      setShowRoleSelection(true);
    }
  };

  // Helper for Role Cards
  const RoleCard = ({ role, title, desc, icon: Icon, colorClass }: any) => (
    <button 
      onClick={() => { setMultiplayerRole(role); setCurrentView('multiplayer_active'); }}
      className="group bg-white p-4 md:p-5 rounded-xl shadow-sm border border-legal-100 hover:border-legal-500 hover:shadow-md transition text-left flex flex-col h-full relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition`}>
         <Icon size={64} />
      </div>
      <div className={`${colorClass} w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-sm`}>
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight">{title}</h3>
      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{desc}</p>
      <div className="mt-auto pt-4 text-xs font-semibold text-legal-600 group-hover:underline flex items-center gap-1">
        Ocupar Lugar <ArrowRight size={12} />
      </div>
    </button>
  );

  const renderContent = () => {
    if (currentView === 'simulation_active' && activeScenarioId) {
      const scenario = SCENARIOS.find(s => s.id === activeScenarioId)!;
      return (
        <SimulationChat 
          scenario={scenario} 
          onExit={() => setCurrentView('dashboard')} 
          apiKey={apiKey}
          user={user}
        />
      );
    }

    if (currentView === 'multiplayer_active' && multiplayerRole) {
      return (
        <MultiplayerRoom 
          onExit={() => {
            setMultiplayerRole(null);
            setShowRoleSelection(false);
            setCurrentView('dashboard');
            // Clear URL param on exit
            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url);
          }}
          currentUserRole={multiplayerRole}
          roomId={activeRoomId}
          user={user}
          isHost={isHost}
        />
      );
    }

    if (currentView === 'multiplayer' && showRoleSelection) {
      return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2 text-legal-600 text-sm font-medium mb-1">
                 <Video size={16} />
                 <span>Sala: {activeRoomId} {isHost ? '(Anfitrião)' : '(Convidado)'}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-legal-900">Escolha seu Papel</h2>
              <p className="text-gray-500">Selecione qual cadeira você irá ocupar nesta audiência.</p>
            </div>
            <button 
              onClick={() => setShowRoleSelection(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
          
          <div className="space-y-8 pb-10">
            {/* Sections unchanged... */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Gavel size={14} /> Magistratura e Serventia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RoleCard role={CourtRole.JUDGE} title="Juiz de Direito" desc="Preside a audiência, mantém a ordem e profere a sentença." icon={Gavel} colorClass="bg-legal-100 text-legal-800" />
                <RoleCard role={CourtRole.CLERK} title="Escrivão" desc="Registra os atos da audiência e auxilia o juiz." icon={ScrollText} colorClass="bg-slate-100 text-slate-800" />
              </div>
            </section>
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Scale size={14} /> Advocacia e Ministério Público</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RoleCard role={CourtRole.PROSECUTOR} title="Promotor / M.P." desc="Fiscal da lei ou representante da acusação." icon={Shield} colorClass="bg-red-100 text-red-800" />
                <RoleCard role={CourtRole.DEFENSE} title="Adv. de Defesa" desc="Representa o réu/requerido e garante o contraditório." icon={Shield} colorClass="bg-blue-100 text-blue-800" />
                <RoleCard role={CourtRole.PLAINTIFF_COUNSEL} title="Adv. do Autor" desc="Representa a parte que iniciou o processo." icon={Shield} colorClass="bg-cyan-100 text-cyan-800" />
              </div>
            </section>
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={14} /> Partes e Outros</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <RoleCard role={CourtRole.PLAINTIFF} title="Autor / Vítima" desc="Pessoa física ou jurídica que propõe a ação." icon={User} colorClass="bg-green-100 text-green-800" />
                <RoleCard role={CourtRole.DEFENDANT} title="Réu / Acusado" desc="Pessoa contra quem o processo é movido." icon={User} colorClass="bg-orange-100 text-orange-800" />
                 <RoleCard role={CourtRole.WITNESS} title="Testemunha" desc="Presta depoimento (Inicia na Sala de Espera)." icon={User} colorClass="bg-amber-100 text-amber-800" />
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (currentView === 'multiplayer') {
      const now = new Date();
      return (
        <div className="h-full flex flex-col md:flex-row p-6 md:p-12 gap-8 md:gap-16 items-center justify-center bg-white">
           <div className="max-w-md w-full space-y-8">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-legal-900 leading-tight">Audiências virtuais e simulações premium.</h1>
                <p className="text-lg text-gray-500">A JuriSim conecta estudantes e profissionais. Participe de audiências ao vivo mesmo sem chave API.</p>
                {!apiKey && <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800"><AlertCircle size={20} className="shrink-0 mt-0.5" /><div><p className="font-bold">Modo Convidado</p><p>Você está logado sem chave API. A Simulação com IA está desativada.</p></div></div>}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                 <button onClick={handleStartNewMeeting} className="flex items-center gap-2 bg-legal-800 hover:bg-legal-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition transform active:scale-95"><Plus size={20} /> Nova Audiência</button>
                 <div className="flex items-center gap-2 w-full sm:w-auto relative">
                    <div className="absolute left-3 text-gray-400"><Keyboard size={18} /></div>
                    <input type="text" placeholder="Código ou link" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-500 outline-none text-gray-700" />
                    <button onClick={handleJoinMeeting} disabled={joinCodeInput.length < 3} className="text-legal-600 font-medium hover:bg-legal-50 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">Entrar</button>
                 </div>
              </div>
           </div>
           {/* Decorative Blob */}
           <div className="hidden md:flex flex-1 items-center justify-center relative w-full max-w-lg aspect-square">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
               <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-full">
                  <div className="aspect-video bg-legal-900 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                     <Gavel size={48} className="text-white/20 group-hover:text-white/40 transition duration-500" />
                     <div className="absolute bottom-4 left-4 text-white"><div className="text-xs font-bold bg-red-600 px-2 py-0.5 rounded inline-block mb-1">AO VIVO</div><p className="font-bold">Sala 001 - Instrução</p></div>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex -space-x-3">{[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">U{i}</div>)}<div className="w-10 h-10 rounded-full border-2 border-white bg-legal-100 flex items-center justify-center text-xs font-bold text-legal-600">+12</div></div>
                     <div className="text-right"><p className="text-2xl font-light text-gray-900">{now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}</p><p className="text-xs text-gray-500">{now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</p></div>
                  </div>
               </div>
           </div>
        </div>
      );
    }

    if (currentView === 'scenarios') {
      return <Dashboard onStartScenario={startScenario} user={user} />;
    }
    
    return <Dashboard onStartScenario={startScenario} user={user} />;
  };

  if (isLoadingSession) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-800"></div></div>;

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  if (currentView === 'simulation_active' || currentView === 'multiplayer_active') {
    return <div className="h-screen w-screen overflow-hidden">{renderContent()}</div>;
  }

  return <Layout user={user} currentView={currentView} hasApiKey={!!apiKey} onChangeView={setCurrentView} onLogout={handleLogout}>{renderContent()}</Layout>;
};

export default App;