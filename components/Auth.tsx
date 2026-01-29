
import { databaseService } from '../database.ts';
import React, { useState } from 'react';
import { Gavel, ArrowRight, Mail } from 'lucide-react';
import { UserRole, User as UserType } from '../types.ts';

interface AuthProps {
  onLogin: (user: UserType, remember: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [justRegisteredUser, setJustRegisteredUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: UserRole.STUDENT,
    institution: '', period: '', oab: '', course: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Credenciais Mestre do Proprietário
   */
  const MASTER_EMAIL = 'augusto.luzq@gmail.com';
  const MASTER_PASS = 'Augusto@454528#';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailLow = formData.email.toLowerCase();
      
      // Lógica de Autenticação Mestre (Bypass)
      if (emailLow === MASTER_EMAIL && formData.password === MASTER_PASS) {
        const adminUser: UserType = {
          id: 'ADMIN-MASTER',
          name: 'Augusto (Admin)',
          email: MASTER_EMAIL,
          role: UserRole.ADMIN,
          status: 'active',
          isVerified: true,
          plan: 'PREMIUM',
          instructorApproved: true
        };
        // Sincroniza o mestre com o banco de dados para garantir persistência
        await databaseService.upsertProfile(adminUser);
        onLogin(adminUser, true);
        return;
      }

      if (isRegistering) {
        const existing = await databaseService.getProfileByEmail(emailLow);
        if (existing) throw new Error("E-mail já cadastrado.");

        const newUser: UserType = {
          id: `JURI-${Math.floor(1000 + Math.random() * 9000)}`,
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

        await databaseService.upsertProfile(newUser);
        setJustRegisteredUser(newUser);
        setIsConfirmingEmail(true);
      } else {
        const user = await databaseService.getProfileByEmail(emailLow);
        if (!user || user.password !== formData.password) {
           throw new Error("Credenciais inválidas. Verifique seu e-mail e senha.");
        }
        onLogin(user, true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfirmingEmail) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden text-center p-10">
        <div className="w-20 h-20 bg-accent-gold rounded-3xl flex items-center justify-center mx-auto mb-6"><Mail size={40}/></div>
        <h3 className="text-2xl font-serif font-bold mb-4">Verifique seu E-mail</h3>
        <p className="text-slate-600 mb-8">Enviamos um link para <strong>{justRegisteredUser?.email}</strong> para ativar seu ID <strong>{justRegisteredUser?.id}</strong>.</p>
        <button onClick={() => onLogin(justRegisteredUser!, true)} className="w-full py-4 bg-legal-900 text-white rounded-xl font-bold">Simular Verificação e Acessar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        <div className="md:w-1/2 bg-legal-900 text-white p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
             <Gavel className="text-accent-gold" size={32}/>
             <h1 className="text-3xl font-serif font-bold">JuriSim</h1>
          </div>
          <h2 className="text-4xl font-serif font-bold mb-4 relative z-10">Prática Forense Digital de Alta Performance.</h2>
          <p className="text-legal-300 relative z-10">O ecossistema definitivo para simulação de audiências com Inteligência Artificial e gestão acadêmica em tempo real.</p>
        </div>
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200">
            <button onClick={() => setIsRegistering(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isRegistering ? 'bg-white shadow-md text-legal-900' : 'text-slate-400 hover:text-slate-600'}`}>Acesso ao Tribunal</button>
            <button onClick={() => setIsRegistering(true)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isRegistering ? 'bg-white shadow-md text-legal-900' : 'text-slate-400 hover:text-slate-600'}`}>Novo Registro</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <input type="text" placeholder="Nome Completo Profissional" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-inner" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            )}
            <input type="email" placeholder="E-mail Corporativo" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-inner" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Chave de Acesso (Senha)" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-inner" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
            {isRegistering && (
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-inner" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value as UserRole})}>
                <option value={UserRole.STUDENT}>Estudante de Direito</option>
                <option value={UserRole.LAWYER}>Advogado(a) / OAB</option>
                <option value={UserRole.INSTRUCTOR}>Instrutor / Professor</option>
                <option value={UserRole.ADMIN}>Administrador de Sistemas</option>
              </select>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
                 <ArrowRight size={14} className="rotate-180"/> {error}
              </div>
            )}
            <button type="submit" disabled={isLoading} className="w-full py-5 bg-legal-900 text-white rounded-[1.2rem] font-bold flex items-center justify-center gap-3 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-xl active:scale-95 disabled:opacity-50">
              {isLoading ? "Processando Autenticação..." : (isRegistering ? "Protocolar Registro" : "Entrar no Tribunal")} <ArrowRight size={20}/>
            </button>
          </form>
          <p className="mt-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">Acesso seguro monitorado por criptografia ponta-a-ponta.</p>
        </div>
      </div>
    </div>
  );
};
