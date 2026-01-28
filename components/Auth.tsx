
import { persistenceService } from '../services/persistence';
import React, { useState } from 'react';
import { Gavel, ArrowRight, User, ShieldCheck, Lock, Mail, Users, AlertCircle, CheckCircle, School, CreditCard, Send, Fingerprint, ExternalLink } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType, remember: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [justRegisteredUser, setJustRegisteredUser] = useState<UserType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.STUDENT,
    password: '',
    institution: '',
    period: '',
    oab: '',
    course: ''
  });
  
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MASTER_ADMIN_EMAIL = "augusto.luzq@gmail.com";
  const MASTER_ADMIN_PASS = "Augusto@454528#";

  const generateNetworkId = () => {
    return `JURI-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailLow = formData.email.toLowerCase();

    if (isRegistering) {
      if (!formData.name.trim()) return setError("Nome é obrigatório.");
      if (formData.role === UserRole.STUDENT && (!formData.institution || !formData.period)) 
        return setError("Instituição e período são obrigatórios para estudantes.");
      if (formData.role === UserRole.LAWYER && !formData.oab) 
        return setError("Nº da OAB é obrigatório para advogados.");
      if (formData.role === UserRole.INSTRUCTOR && !formData.institution) 
        return setError("Nome da instituição é obrigatório para instrutores.");
    }

    setIsLoading(true);

    if (isRegistering) {
      setTimeout(() => {
        const allUsers = persistenceService.getAllUsers();
        if (allUsers.find(u => u.email.toLowerCase() === emailLow)) {
          setError("E-mail já cadastrado.");
          setIsLoading(false);
          return;
        }

        const newUser: UserType = {
          id: generateNetworkId(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
          status: 'active',
          isVerified: false,
          institution: formData.institution,
          period: formData.period,
          oab: formData.oab,
          course: formData.course,
          plan: 'FREE'
        };

        persistenceService.saveUserGlobally(newUser);
        setJustRegisteredUser(newUser);
        setIsConfirmingEmail(true);
        setIsLoading(false);
      }, 1500);
      return;
    }

    // Fluxo de Login
    setTimeout(() => {
      const isMaster = emailLow === MASTER_ADMIN_EMAIL.toLowerCase() && formData.password === MASTER_ADMIN_PASS;
      const allUsers = persistenceService.getAllUsers();
      let targetUser = allUsers.find(u => u.email.toLowerCase() === emailLow);

      if (isMaster && !targetUser) {
        targetUser = {
          id: 'JURI-0001',
          name: "Admin Augusto",
          email: MASTER_ADMIN_EMAIL,
          role: UserRole.ADMIN,
          status: 'active',
          isVerified: true,
          plan: 'PREMIUM',
          password: MASTER_ADMIN_PASS
        };
        persistenceService.saveUserGlobally(targetUser);
      }

      if (!targetUser || targetUser.password !== formData.password) {
        setError("Credenciais inválidas.");
        setIsLoading(false);
        return;
      }

      if (!targetUser.isVerified && targetUser.role !== UserRole.ADMIN) {
        setJustRegisteredUser(targetUser);
        setIsConfirmingEmail(true);
        setIsLoading(false);
        return;
      }

      onLogin(targetUser, rememberMe);
      setIsLoading(false);
    }, 1200);
  };

  const handleVerifyNow = () => {
    if (justRegisteredUser) {
      const verified = { ...justRegisteredUser, isVerified: true };
      persistenceService.saveUserGlobally(verified);
      onLogin(verified, rememberMe);
    }
  };

  if (isConfirmingEmail) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
          <div className="bg-legal-900 p-10 text-white text-center">
            <div className="w-20 h-20 bg-accent-gold rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <Mail size={40} className="text-legal-900" />
            </div>
            <h3 className="text-3xl font-serif font-bold">Verifique seu E-mail</h3>
            <p className="text-legal-300 mt-2">Protocolo de segurança JuriSim ativado.</p>
          </div>
          <div className="p-10 space-y-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Enviamos um link de ativação exclusivo para <strong>{justRegisteredUser?.email}</strong>. 
                Certifique-se de clicar no link para liberar seu ID de Identificação na rede.
              </p>
              <div className="flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm">
                <Fingerprint className="text-accent-gold" size={24}/>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seu ID JuriSim</p>
                  <p className="text-lg font-mono font-bold text-legal-900">{justRegisteredUser?.id}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <button onClick={handleVerifyNow} className="w-full py-5 bg-legal-900 text-white rounded-2xl font-bold shadow-xl hover:bg-accent-gold hover:text-legal-900 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                <ExternalLink size={20} className="group-hover:rotate-12 transition-transform"/>
                Confirmar Cadastro e Acessar
              </button>
              <p className="text-[11px] text-center text-slate-400 font-bold uppercase tracking-widest">
                Não recebeu? <span className="text-accent-gold cursor-pointer hover:underline">Tentar reenviar e-mail</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[800px] border border-slate-200">
        <div className="md:w-5/12 bg-legal-900 text-white p-12 flex flex-col justify-between relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
              <div className="bg-accent-gold p-3 rounded-2xl text-legal-900 shadow-lg">
                <Gavel size={32} />
              </div>
              <h1 className="text-3xl font-serif font-bold">JuriSim</h1>
            </div>
            <h2 className="text-4xl font-serif font-bold mb-6 leading-tight">Excelência na Prática Forense Digital.</h2>
            <p className="text-legal-300 text-lg leading-relaxed font-light">Simulações inteligentes para advogados, professores e estudantes.</p>
          </div>
          <div className="relative z-10 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
             <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={20} className="text-accent-gold"/>
                <span className="text-xs font-bold uppercase tracking-widest">Plataforma Homologada</span>
             </div>
             <p className="text-[10px] text-legal-400">Ambiente seguro para desenvolvimento de teses e ritos processuais em conformidade com o CPC/CPP.</p>
          </div>
        </div>

        <div className="md:w-7/12 p-10 md:p-16 flex flex-col justify-center overflow-y-auto custom-scrollbar">
          <div className="mb-10 flex bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto md:mx-0">
            <button onClick={() => { setIsRegistering(false); setError(null); }} className={`px-10 py-3 rounded-xl font-bold text-sm transition-all ${!isRegistering ? 'bg-white text-legal-900 shadow-sm' : 'text-slate-400'}`}>Login</button>
            <button onClick={() => { setIsRegistering(true); setError(null); }} className={`px-10 py-3 rounded-xl font-bold text-sm transition-all ${isRegistering ? 'bg-white text-legal-900 shadow-sm' : 'text-slate-400'}`}>Cadastro</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none transition text-sm" placeholder="Ex: Dr. Augusto Silva" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none transition text-sm" placeholder="seu@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none transition text-sm" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Categoria</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-gold outline-none text-sm font-bold text-legal-800">
                  <option value={UserRole.STUDENT}>Estudante de Direito</option>
                  <option value={UserRole.LAWYER}>Advogado(a)</option>
                  <option value={UserRole.INSTRUCTOR}>Professor / Instrutor</option>
                </select>
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                {formData.role === UserRole.STUDENT && (
                  <div className="grid grid-cols-2 gap-4">
                    <input value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} className="w-full p-4 bg-white border rounded-2xl text-xs font-bold" placeholder="Instituição de Ensino" />
                    <input value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} className="w-full p-4 bg-white border rounded-2xl text-xs font-bold" placeholder="Período / Semestre" />
                  </div>
                )}
                {formData.role === UserRole.LAWYER && (
                  <input value={formData.oab} onChange={e => setFormData({...formData, oab: e.target.value})} className="w-full p-4 bg-white border rounded-2xl text-xs font-bold" placeholder="Nº de Registro OAB (Ex: SP 123456)" />
                )}
                {formData.role === UserRole.INSTRUCTOR && (
                  <div className="grid grid-cols-2 gap-4">
                    <input value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} className="w-full p-4 bg-white border rounded-2xl text-xs font-bold" placeholder="Instituição Acadêmica" />
                    <input value={formData.oab} onChange={e => setFormData({...formData, oab: e.target.value})} className="w-full p-4 bg-white border rounded-2xl text-xs font-bold" placeholder="OAB (Opcional)" />
                  </div>
                )}
              </div>
            )}

            {error && <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-bounce"><AlertCircle size={16}/>{error}</div>}

            <button type="submit" disabled={isLoading} className="w-full py-5 bg-legal-900 text-white rounded-[1.5rem] font-bold text-lg shadow-xl hover:bg-accent-gold hover:text-legal-900 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegistering ? "Cadastrar Agora" : "Acessar Sistema")}
              <ArrowRight size={22} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
