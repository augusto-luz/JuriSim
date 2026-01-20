
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Video, 
  Settings, 
  LogOut, 
  Gavel,
  BookOpen,
  Menu,
  X,
  HelpCircle,
  Crown,
  PlusCircle
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick, disabled = false, badge, sublabel }: any) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-accent-gold text-legal-900 shadow-lg shadow-accent-gold/20' 
        : disabled 
          ? 'text-legal-600 cursor-not-allowed opacity-60' 
          : 'text-legal-300 hover:bg-legal-800/50 hover:text-white'
    }`}
  >
    <div className="flex items-center space-x-3">
       <Icon size={20} />
       <div className="text-left">
          <p className="font-bold text-sm leading-tight">{label}</p>
          {sublabel && <p className={`text-[10px] ${active ? 'text-legal-800/70' : 'text-legal-500'}`}>{sublabel}</p>}
       </div>
    </div>
    {badge}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onChangeView, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isPremium = user.plan === 'PREMIUM' || user.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-72 bg-legal-900 text-white shadow-xl z-20 shrink-0">
        <div className="p-8 flex items-center space-x-3 border-b border-legal-800">
          <div className="bg-accent-gold p-2.5 rounded-xl">
            <Gavel className="text-legal-900" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">JuriSim</h1>
            <p className="text-[10px] text-accent-gold font-black uppercase tracking-widest">Enterprise AI</p>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-[10px] font-black text-legal-500 uppercase tracking-widest">Central de Gestão</div>
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            sublabel="Métricas e Performance"
            active={currentView === 'dashboard'} 
            onClick={() => onChangeView('dashboard')} 
          />
          <NavItem 
            icon={BookOpen} 
            label="Cenários" 
            sublabel="Biblioteca e Autos do Caso"
            active={currentView === 'scenarios'} 
            onClick={() => onChangeView('scenarios')} 
          />
          
          <div className="px-4 py-2 mt-6 text-[10px] font-black text-legal-500 uppercase tracking-widest">Prática Jurídica</div>
          <NavItem 
            icon={PlayCircle} 
            label="Simulação IA" 
            sublabel="Executar Prática Solo"
            active={currentView === 'simulation'} 
            onClick={() => onChangeView('simulation')} 
          />
          <NavItem 
            icon={Video} 
            label="Audiência Live" 
            sublabel="Tribunal Virtual Ativo"
            active={currentView === 'multiplayer'} 
            onClick={() => onChangeView('multiplayer')} 
          />

          <div className="px-4 py-2 mt-6 text-[10px] font-black text-legal-500 uppercase tracking-widest">Configurações</div>
          <NavItem 
            icon={Crown} 
            label="Assinatura" 
            active={currentView === 'pricing'} 
            onClick={() => onChangeView('pricing')}
            badge={isPremium ? <div className="bg-legal-900 text-accent-gold text-[10px] px-1.5 rounded font-black border border-accent-gold/30">PRO</div> : <div className="bg-gray-700 text-gray-300 text-[10px] px-1.5 rounded">FREE</div>} 
          />
          <NavItem 
            icon={Settings} 
            label="Ajustes" 
            active={currentView === 'settings'} 
            onClick={() => onChangeView('settings')} 
          />
        </nav>

        <div className="p-6 border-t border-legal-800 bg-legal-900/50">
          <div className="mb-6 flex items-center gap-4 px-2">
             <div className="w-10 h-10 rounded-xl bg-accent-gold flex items-center justify-center text-legal-900 font-bold shadow-lg">
                {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{user.name}</p>
                <p className="text-[10px] text-legal-400 truncate font-bold uppercase tracking-tighter">{user.role}</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 w-full bg-legal-900 text-white z-50 flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center space-x-2">
          <Gavel className="text-accent-gold" size={20} />
          <span className="font-serif font-bold">JuriSim</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-legal-900 pt-20 px-4 space-y-2 animate-in slide-in-from-top-10">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => {onChangeView('dashboard'); setIsMobileMenuOpen(false);}} />
          <NavItem icon={BookOpen} label="Cenários" active={currentView === 'scenarios'} onClick={() => {onChangeView('scenarios'); setIsMobileMenuOpen(false);}} />
          <NavItem icon={PlayCircle} label="Simulação IA" active={currentView === 'simulation'} onClick={() => {onChangeView('simulation'); setIsMobileMenuOpen(false);}} />
          <NavItem icon={Video} label="Audiência Live" active={currentView === 'multiplayer'} onClick={() => {onChangeView('multiplayer'); setIsMobileMenuOpen(false);}} />
          <div className="border-t border-legal-800 mt-4 pt-4">
             <NavItem icon={LogOut} label="Sair" active={false} onClick={() => {onLogout(); setIsMobileMenuOpen(false);}} />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto w-full pt-16 md:pt-0 bg-slate-50">
        {children}
      </main>
    </div>
  );
};
