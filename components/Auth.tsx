
import { persistenceService } from '../services/persistence';
import React, { useState } from 'react';
import { Gavel, ArrowRight, User, ShieldCheck, Lock, Mail, Users, AlertCircle, Key, CheckCircle } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType, remember: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.STUDENT,
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MASTER_ADMIN_EMAIL = "augusto.luzq@gmail.com";
  const MASTER_ADMIN_PASS = "Augusto@454528#";

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isMasterEmail = formData.email.toLowerCase() === MASTER_ADMIN_EMAIL;
    
    if (isMasterEmail && formData.password !== MASTER_ADMIN_PASS) {
      setError("Senha administrativa incorreta.");
      return;
    }

    setIsLoading(true);

    if (isRegistering && !isConfirmingEmail) {
      setTimeout(() => {
        const allUsers = persistenceService.getAllUsers();
        const existing = allUsers.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
        
        if (existing) {
          setError("Este e-mail já está cadastrado no Tribunal.");
          setIsLoading(false);
          return;
        }

        const newUser: UserType = {
          id: `user-${Math.random().toString(36).substr(2, 9)}`,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
          status: 'active',
          plan: formData.role === UserRole.INSTRUCTOR ? 'PREMIUM' : 'FREE'
        };

        persistenceService.saveUserGlobally(newUser);
        setIsConfirmingEmail(true);
        setIsLoading(false);
      }, 1500);
      return;
    }

    setTimeout(() => {
      const allUsers = persistenceService.getAllUsers();
      let targetUser = allUsers.find(u => u.email.toLowerCase() === formData.email.toLowerCase());

      if (!isRegistering && !targetUser && !isMasterEmail) {
        setError("Usuário não encontrado. Crie uma conta para acessar.");
        setIsLoading(false);
        return;
      }

      if (!isRegistering && targetUser && targetUser.password && targetUser.password !== formData.password) {
        setError("Senha incorreta. Verifique seus dados.");
        setIsLoading(false);
        return;
      }

      // Garante que o ID do Master Admin seja sempre 'admin-master'
      if (isMasterEmail && (!targetUser || targetUser.id !== 'admin-master')) {
        targetUser = {
          id: 'admin-master',
          name: "Administrador Augusto",
          email: MASTER_ADMIN_EMAIL,
          role: UserRole.ADMIN,
          status: 'active',
          plan: 'PREMIUM',
          password: MASTER_ADMIN_PASS
        };
        persistenceService.saveUserGlobally(targetUser);
      }

      if (targetUser && targetUser.status === 'suspended') {
        setError("Sua conta foi suspensa pela administração do Tribunal Virtual.");
        setIsLoading(false);
        return;
      }

      if (targetUser) {
        onLogin(targetUser, rememberMe);
      }
      
      setIsLoading(false);
    }, 1200);
  };

  if (isConfirmingEmail) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-200 animate-in zoom-in-95">
           <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
              <Mail size={40} className="animate-pulse" />
           </div>
           <h3 className="text-2xl font-serif font-bold text-legal-900 mb-4">Verifique seu e-mail</h3>
           <p className="text-slate-500 text-sm mb-8 leading-relaxed">
             O cadastro de <strong>{formData.name}</strong> foi realizado com sucesso! Enviamos um link de ativação para <strong>{formData.email}</strong>.
           </p>
           <div className="space-y-3">
              <button 
                onClick={handleAuth}
                className="w-full py-4 bg-legal-900 text-white rounded-2xl font-bold shadow-lg hover:bg-legal-800 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                Simular Confirmação e Entrar <CheckCircle size={18}/>
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px] border border-slate-200">
        
        <div className="md:w-5/12 bg-legal-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-accent-gold p-2.5 rounded-2xl text-legal-900 shadow-lg shadow-accent-gold/20">
                <Gavel size={32} />
              </div>
              <h1 className="text-3xl font-serif font-bold tracking-tight">JuriSim</h1>
            </div>
            
            <h2 className="text-4xl font-serif font-bold mb-6 leading-tight">
              {isRegistering ? "Sua carreira jurídica começa aqui." : "Tribunal Virtual JuriSim"}
            </h2>
            <p className="text-legal-300 text-lg leading-relaxed font-light">
              Plataforma de alta performance para simulação forense e gestão acadêmica.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <FeatureBadge icon={ShieldCheck} text="Motor Gemini Flash Ativo" />
            <FeatureBadge icon={Key} text="Acesso Master Liberado" />
          </div>
        </div>

        <div className="md:w-7/12 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => { setIsRegistering(false); setError(null); }} 
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${!isRegistering ? 'bg-white text-legal-900 shadow-sm' : 'text-slate-400'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => { setIsRegistering(true); setError(null); }} 
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${isRegistering ? 'bg-white text-legal-900 shadow-sm' : 'text-slate-400'}`}
              >
                Cadastrar
              </button>
            </div>
            <h3 className="text-2xl font-serif font-bold text-legal-900 mb-2">
              {isRegistering ? "Crie seu perfil profissional" : "Identifique-se para acessar"}
            </h3>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isRegistering && (
               <div className="space-y-2 animate-in slide-in-from-top-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                   <input
                     type="text"
                     required={isRegistering}
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                     className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none transition"
                     placeholder="Ex: Dr. Augusto Silva"
                   />
                 </div>
               </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none transition"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Função</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none text-sm font-bold text-legal-800"
                >
                  <option value={UserRole.STUDENT}>Estudante</option>
                  <option value={UserRole.LAWYER}>Advogado(a)</option>
                  <option value={UserRole.INSTRUCTOR}>Professor / Instrutor</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-legal-600 focus:ring-accent-gold border-slate-300"
                />
                <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer">Manter conectado</label>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-center gap-3 animate-bounce">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-legal-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-legal-900/20 hover:bg-legal-800 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegistering ? "Solicitar Cadastro" : "Entrar no Tribunal"}
                  <ArrowRight size={22} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const FeatureBadge = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex items-center gap-4 text-legal-100 bg-white/5 p-5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
    <div className="bg-accent-gold/20 p-2.5 rounded-xl text-accent-gold group-hover:scale-110 transition-transform"><Icon size={24} /></div>
    <span className="text-sm font-bold tracking-tight">{text}</span>
  </div>
);
