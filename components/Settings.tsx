
import React from 'react';
import { User } from '../types';
import { User as UserIcon, LogOut, Trash2 } from 'lucide-react';
import { persistenceService } from '../services/persistence';

interface SettingsProps {
  user: User;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const handleReset = () => {
    if(confirm("Tem certeza? Isso apagará todo seu histórico de conversas e progresso neste navegador.")) {
        // Fix: resetAll is now correctly defined in persistenceService
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
