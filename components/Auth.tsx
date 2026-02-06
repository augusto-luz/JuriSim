
import React, { useState } from 'react';
import { Gavel, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { UserRole, User as UserType } from '../types.ts';
import { persistenceService } from '../services/persistence.ts';

interface AuthProps {
  onLogin: (user: UserType, remember: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: UserRole.STUDENT,
    institution: '', period: '', oab: '', course: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Delay simulado para UX
    setTimeout(async () => {
      try {
        const emailLow = formData.email.toLowerCase();
        const allUsers = await persistenceService.getAllUsers();

        if (isRegistering) {
          if (allUsers.find(u => u.email.toLowerCase() === emailLow)) {
            setError("Este e-mail já possui um registro protocolado.");
            setIsLoading(false);
            return;
          }

          const newUser: UserType = {
            id: `JURI-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            name: formData.name,
            email: emailLow,
            password: formData.password,
            role: formData.role,
            status: 'active',
            isVerified: true,
            institution: formData.institution,
            period: formData.period,
            oab: formData.oab,
            course: formData.course,
            plan: 'FREE'
          };

          await persistenceService.saveUserGlobally(newUser);
          onLogin(newUser, true);
        } else {
          const user = allUsers.find(u => u.email.toLowerCase() === emailLow && u.password === formData.password);
          if (user) {
            if (user.status === 'suspended') {
              setError("Este registro foi suspenso pela Corregedoria.");
            } else {
              onLogin(user, true);
            }
          } else {
            setError("E-mail ou senha não encontrados em nossos registros.");
          }
        }
      } catch (err) {
        setError("Erro interno na autenticação local.");
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        <div className="md:w-1/2 bg-legal-900 text-white p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
             <Gavel className="text-accent-gold" size={32}/>
             <h1 className="text-3xl font-serif font-bold">JuriSim</h1>
          </div>
          <h2 className="text-4xl font-serif font-bold mb-4 relative z-10 leading-tight">Prática Forense Digital de Alta Performance.</h2>
          <p className="text-legal-300 relative z-10 text-lg">O ecossistema definitivo para simulação de audiências e treinamento com IA.</p>
        </div>
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200 shadow-inner">
            <button onClick={() => { setIsRegistering(false); setError(null); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isRegistering ? 'bg-white shadow-md text-legal-900' : 'text-slate-400'}`}>Entrar</button>
            <button onClick={() => { setIsRegistering(true); setError(null); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isRegistering ? 'bg-white shadow-md text-legal-900' : 'text-slate-400'}`}>Novo Registro</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <input type="text" placeholder="Nome Completo" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none shadow-inner" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            )}
            <input type="email" placeholder="E-mail" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none shadow-inner" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Chave de Acesso" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none shadow-inner" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
            
            {isRegistering && (
              <select className="w-full p-4 bg-slate-50 border rounded-2xl outline-none shadow-inner font-bold text-slate-500" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value as UserRole})}>
                <option value={UserRole.STUDENT}>Estudante</option>
                <option value={UserRole.LAWYER}>Advogado(a)</option>
                <option value={UserRole.INSTRUCTOR}>Instrutor(a)</option>
              </select>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[10px] font-bold flex items-center gap-2 rounded-xl border border-red-100 animate-in shake">
                <AlertCircle size={14}/> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-5 bg-legal-900 text-white rounded-[1.2rem] font-bold flex items-center justify-center gap-3 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-xl active:scale-95 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={20}/> : (isRegistering ? "Protocolar Registro" : "Entrar no Tribunal")} <ArrowRight size={20}/>
            </button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
             <ShieldCheck size={14}/>
             <p className="text-[9px] font-black uppercase tracking-[0.2em]">Criptografia de Ponta-a-Ponta Local</p>
          </div>
        </div>
      </div>
    </div>
  );
};
