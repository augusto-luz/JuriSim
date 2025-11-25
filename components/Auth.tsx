import React, { useState } from 'react';
import { Gavel, KeyRound, ArrowRight, User, Mail, ShieldCheck } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface AuthProps {
  onLogin: (apiKey: string, user: UserType) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    apiKey: '',
    role: UserRole.STUDENT
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (formData.name.length < 3) {
      setError("Por favor, insira seu nome completo.");
      return;
    }
    if (!formData.email.includes('@')) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }
    if (formData.apiKey.trim().length < 10) {
      setError("A chave da API parece inválida.");
      return;
    }

    setIsLoading(true);

    // Simulate API delay and login
    setTimeout(() => {
      const newUser: UserType = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role
      };
      onLogin(formData.apiKey, newUser);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side - Brand & Info */}
        <div className="md:w-1/2 bg-legal-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-accent-gold p-2 rounded-lg text-legal-900">
                <Gavel size={24} />
              </div>
              <h1 className="text-2xl font-serif font-bold tracking-wide">JuriSim</h1>
            </div>
            
            <h2 className="text-4xl font-serif font-bold mb-6 leading-tight">
              Domine a prática forense com Inteligência Artificial.
            </h2>
            <p className="text-legal-300 text-lg leading-relaxed">
              Treine argumentação, conduza audiências simuladas e receba feedback em tempo real. Sua evolução jurídica começa aqui.
            </p>
          </div>

          <div className="relative z-10 space-y-4 mt-8">
            <div className="flex items-center gap-4 text-sm text-legal-200">
              <div className="w-8 h-8 rounded-full bg-legal-800 flex items-center justify-center text-accent-gold font-bold">1</div>
              <span>Crie seu perfil profissional</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-legal-200">
              <div className="w-8 h-8 rounded-full bg-legal-800 flex items-center justify-center text-accent-gold font-bold">2</div>
              <span>Conecte sua chave Gemini AI</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-legal-200">
              <div className="w-8 h-8 rounded-full bg-legal-800 flex items-center justify-center text-accent-gold font-bold">3</div>
              <span>Inicie simulações imersivas</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Acesse sua conta</h3>
            <p className="text-gray-500 text-sm mt-1">Preencha seus dados para configurar o ambiente.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-legal-500 focus:border-legal-500 outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder="Dr. João Silva"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-legal-500 focus:border-legal-500 outline-none transition text-gray-900 placeholder-gray-400"
                  placeholder="joao@advocacia.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-gray-700 uppercase flex justify-between">
                  <span>Google Gemini API Key</span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline cursor-pointer text-[10px] normal-case">Obter Chave</a>
               </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-legal-500 focus:border-legal-500 outline-none transition text-gray-900 placeholder-gray-400 font-mono text-sm"
                  placeholder="AIzaSy..."
                  required
                />
              </div>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <ShieldCheck size={10} />
                Sua chave é salva localmente e nunca enviada para nossos servidores.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in">
                <span className="font-bold">Erro:</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 bg-legal-800 hover:bg-legal-700 text-white rounded-lg font-bold shadow-lg transform active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Configurando Ambiente...' : 'Entrar na Plataforma'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            JuriSim v1.0.0 (Beta) &copy; 2024
          </p>
        </div>
      </div>
    </div>
  );
};