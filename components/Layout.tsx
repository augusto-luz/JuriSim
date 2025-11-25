import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Video, 
  Settings, 
  LogOut, 
  Gavel,
  BookOpen,
  Menu,
  X,
  HelpCircle,
  Lock
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: string;
  hasApiKey: boolean;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick, disabled = false, badge }: any) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
      active 
        ? 'bg-legal-800 text-white shadow-md' 
        : disabled 
          ? 'text-legal-600 cursor-not-allowed opacity-60' 
          : 'text-legal-300 hover:bg-legal-800/50 hover:text-white'
    }`}
  >
    <div className="flex items-center space-x-3">
       <Icon size={20} />
       <span className="font-medium">{label}</span>
    </div>
    {badge}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, hasApiKey, onChangeView, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-legal-900 text-white shadow-xl z-20">
        <div className="p-6 flex items-center space-x-3 border-b border-legal-800">
          <div className="bg-accent-gold p-2 rounded-lg">
            <Gavel className="text-legal-900" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold tracking-wide">JuriSim</h1>
            <p className="text-xs text-legal-400">Simulação Jurídica AI</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-xs font-bold text-legal-500 uppercase tracking-wider">Principal</div>
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => onChangeView('dashboard')} 
          />
          <NavItem 
            icon={BookOpen} 
            label="Cenários" 
            active={currentView === 'scenarios'} 
            onClick={() => onChangeView('scenarios')} 
          />
          
          <div className="px-4 py-2 mt-6 text-xs font-bold text-legal-500 uppercase tracking-wider">Prática</div>
          <NavItem 
            icon={MessageSquare} 
            label="Simulação IA" 
            active={currentView === 'simulation'} 
            disabled={!hasApiKey}
            badge={!hasApiKey && <Lock size={14} className="text-legal-500"/>}
            onClick={() => onChangeView('simulation')} 
          />
          <NavItem 
            icon={Video} 
            label="Audiência ao Vivo" 
            active={currentView === 'multiplayer'} 
            onClick={() => onChangeView('multiplayer')} 
          />

          <div className="px-4 py-2 mt-6 text-xs font-bold text-legal-500 uppercase tracking-wider">Conta</div>
          <NavItem 
            icon={Settings} 
            label="Configurações" 
            active={currentView === 'settings'} 
            onClick={() => onChangeView('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-legal-800 bg-legal-900">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-legal-300 hover:text-white hover:bg-red-900/30 rounded-lg transition-colors mb-2"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
          
          <div className="pt-4 border-t border-legal-800 flex items-center justify-between text-xs text-legal-500 px-2">
            <span>v1.0.0 (Beta)</span>
            <span className="flex items-center gap-1 cursor-help" title="Suporte"><HelpCircle size={12}/> Ajuda</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-legal-900 text-white z-50 flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center space-x-2">
          <Gavel className="text-accent-gold" size={20} />
          <span className="font-serif font-bold">JuriSim</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-legal-900 pt-20 px-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => {onChangeView('dashboard'); setIsMobileMenuOpen(false);}} />
          
          <button 
            disabled={!hasApiKey}
            onClick={() => {onChangeView('simulation'); setIsMobileMenuOpen(false);}}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${!hasApiKey ? 'text-legal-600' : 'text-legal-300'}`}
          >
             <MessageSquare size={20}/>
             <span>Simulação IA</span>
             {!hasApiKey && <Lock size={14} className="ml-auto"/>}
          </button>
          
          <NavItem icon={Video} label="Audiência ao Vivo" active={currentView === 'multiplayer'} onClick={() => {onChangeView('multiplayer'); setIsMobileMenuOpen(false);}} />
          <div className="border-t border-legal-800 mt-4 pt-4">
             <NavItem icon={LogOut} label="Sair" active={false} onClick={() => {onLogout(); setIsMobileMenuOpen(false);}} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto w-full pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};