
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
  PlusCircle,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { User, UserRole } from '../types';

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
       <Icon size={20} className="shrink-0" />
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
  const isPremium = user.plan === 'PREMIUM' || user.role === UserRole.ADMIN;
  const isAdmin = user.role === UserRole.ADMIN;
  const isInstructor = user.role === UserRole.INSTRUCTOR || isAdmin;

  const handleNavClick = (view: string) => {
    onChangeView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-legal-900 text-white shadow-xl z-40 shrink-0">
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
          <div className="px-4 py-2 text-[10px] font-black text-legal-500 uppercase tracking-widest">Navegação Principal</div>
          <NavItem icon={LayoutDashboard} label="Dashboard" sublabel="Resumo e Performance" active={currentView === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon={BookOpen} label="Biblioteca" sublabel="Acervo Processual" active={currentView === 'scenarios'} onClick={() => handleNavClick('scenarios')} />
          
          <div className="px-4 py-2 mt-6 text-[10px] font-black text-legal-500 uppercase tracking-widest">Prática Jurídica</div>
          <NavItem icon={PlayCircle} label="Simulação IA" sublabel="Treinamento Solo" active={currentView === 'simulation'} onClick={() => handleNavClick('simulation')} />
          <NavItem icon={Video} label="Audiência Live" sublabel="Tribunal Virtual" active={currentView === 'multiplayer'} onClick={() => handleNavClick('multiplayer')} />

          {isInstructor && (
            <>
               <div className="px-4 py-2 mt-6 text-[10px] font-black text-purple-400 uppercase tracking-widest">Espaço Acadêmico</div>
               <NavItem icon={GraduationCap} label="Painel Instrutor" sublabel="Gestão de Turmas" active={currentView === 'instructor_panel'} onClick={() => handleNavClick('instructor_panel')} />
            </>
          )}

          {isAdmin && (
             <>
               <div className="px-4 py-2 mt-6 text-[10px] font-black text-red-400 uppercase tracking-widest">Administração</div>
               <NavItem icon={ShieldAlert} label="Painel Admin" sublabel="Controle de Usuários" active={currentView === 'admin_panel'} onClick={() => handleNavClick('admin_panel')} />
             </>
          )}

          <div className="px-4 py-2 mt-6 text-[10px] font-black text-legal-500 uppercase tracking-widest">Gestão de Conta</div>
          <NavItem icon={Crown} label="Planos" active={currentView === 'pricing'} onClick={() => handleNavClick('pricing')} badge={isPremium ? <div className="bg-legal-900 text-accent-gold text-[10px] px-1.5 rounded font-black border border-accent-gold/30">PRO</div> : <div className="bg-gray-700 text-gray-300 text-[10px] px-1.5 rounded">FREE</div>} />
          <NavItem icon={Settings} label="Ajustes" active={currentView === 'settings'} onClick={() => handleNavClick('settings')} />
        </nav>

        <div className="p-6 border-t border-legal-800 bg-legal-900/50">
          <div className="mb-6 flex items-center gap-4 px-2">
             <div className="w-10 h-10 rounded-xl bg-accent-gold flex items-center justify-center text-legal-900 font-bold shadow-lg shrink-0 uppercase">
                {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{user.name}</p>
                <p className="text-[10px] text-legal-400 truncate font-bold uppercase tracking-tighter">{user.role}</p>
             </div>
          </div>
          <button onClick={onLogout} className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all font-bold text-sm">
            <LogOut size={18} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <div className="md:hidden fixed top-0 w-full bg-legal-900 text-white z-[60] flex items-center justify-between p-4 shadow-lg border-b border-white/5">
        <div className="flex items-center space-x-2">
          <Gavel className="text-accent-gold" size={20} />
          <span className="font-serif font-bold text-lg">JuriSim</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/5 rounded-lg active:scale-95 transition-transform">
          {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Menu Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[55] bg-legal-900 pt-24 px-6 space-y-3 animate-in slide-in-from-top-10 flex flex-col pb-10">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon={BookOpen} label="Biblioteca" active={currentView === 'scenarios'} onClick={() => handleNavClick('scenarios')} />
          <NavItem icon={PlayCircle} label="Simulação IA" active={currentView === 'simulation'} onClick={() => handleNavClick('simulation')} />
          <NavItem icon={Video} label="Audiência Live" active={currentView === 'multiplayer'} onClick={() => handleNavClick('multiplayer')} />
          {isInstructor && <NavItem icon={GraduationCap} label="Painel Instrutor" active={currentView === 'instructor_panel'} onClick={() => handleNavClick('instructor_panel')} />}
          {isAdmin && <NavItem icon={ShieldAlert} label="Painel Admin" active={currentView === 'admin_panel'} onClick={() => handleNavClick('admin_panel')} />}
          <NavItem icon={Settings} label="Ajustes" active={currentView === 'settings'} onClick={() => handleNavClick('settings')} />
          <div className="flex-1"></div>
          <div className="border-t border-legal-800 pt-6">
             <button onClick={onLogout} className="flex items-center space-x-3 px-4 py-4 w-full text-red-400 font-bold">
               <LogOut size={20} />
               <span>Sair da Conta</span>
             </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full pt-16 md:pt-0 bg-slate-50 relative z-30">
        <div className="max-w-[1600px] mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
