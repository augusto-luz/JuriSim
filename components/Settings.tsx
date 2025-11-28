import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, User as UserIcon, LogOut, Save, Trash2 } from 'lucide-react';
import { persistenceService } from '../services/persistence';

interface SettingsProps {
  user: User;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, apiKey, onUpdateApiKey, onLogout }) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateApiKey(localKey);
    // Update persistence
    persistenceService.saveSession(localKey, user, true); // Assuming remember=true for settings update
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if(confirm("Tem certeza? Isso apagará todo seu histórico de conversas e progresso neste navegador.")) {
        persistenceService.resetAll();
        onLogout();
        window.location.reload();
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h1 className="text-3xl font-serif font-bold text-legal-900 mb-8">Configurações</h1>

      <div className="space-y-8">
        
        {/* Profile Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-legal-100">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><UserIcon size={20}/> Perfil</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                 <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700 font-medium border border-gray-200">
                    {user.name}
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                 <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700 font-medium border border-gray-200">
                    {user.email}
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Plano Atual</label>
                 <div className="mt-1 p-3 bg-gray-50 rounded-lg text-legal-800 font-bold border border-gray-200">
                    {user.plan === 'PREMIUM' || user.role === 'ADMIN' ? 'PREMIUM / ADMIN' : 'GRATUITO'}
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Função</label>
                 <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700 font-medium border border-gray-200 capitalize">
                    {user.role.toLowerCase()}
                 </div>
              </div>
           </div>
        </section>

        {/* API Key Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-legal-100">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><KeyRound size={20}/> Integração Gemini AI</h2>
           <p className="text-sm text-gray-500 mb-4">A chave da API é necessária para utilizar os recursos de Simulação de Chat com o Juiz.</p>
           
           <div className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">API Key</label>
                 <div className="flex gap-2 mt-1">
                    <input 
                      type="password" 
                      value={localKey}
                      onChange={(e) => setLocalKey(e.target.value)}
                      placeholder="Cole sua chave AIza..."
                      className="flex-1 p-3 rounded-lg border border-gray-300 focus:border-legal-500 focus:ring-2 focus:ring-legal-200 outline-none font-mono text-sm"
                    />
                    <button 
                      onClick={handleSave}
                      className={`px-6 py-2 rounded-lg font-bold text-white transition flex items-center gap-2 ${isSaved ? 'bg-green-600' : 'bg-legal-800 hover:bg-legal-700'}`}
                    >
                       {isSaved ? 'Salvo!' : <><Save size={18}/> Salvar</>}
                    </button>
                 </div>
              </div>
              <div className="text-xs text-gray-400">
                 Sua chave é armazenada apenas no seu navegador.
              </div>
           </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 p-6 rounded-xl border border-red-100">
           <h2 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2"><Trash2 size={20}/> Zona de Perigo</h2>
           <p className="text-sm text-red-600 mb-4">Ações irreversíveis que afetam seus dados locais.</p>
           
           <div className="flex gap-4">
              <button onClick={handleReset} className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-100 transition shadow-sm text-sm">
                 Resetar Todos os Dados
              </button>
              <button onClick={onLogout} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition shadow-sm text-sm flex items-center gap-2">
                 <LogOut size={16}/> Sair da Conta
              </button>
           </div>
        </section>

      </div>
    </div>
  );
};