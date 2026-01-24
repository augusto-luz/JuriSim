
import React from 'react';
import { User } from '../types';
import { User as UserIcon, LogOut, Trash2, Fingerprint, Copy } from 'lucide-react';
import { persistenceService } from '../services/persistence';

interface SettingsProps {
  user: User;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const handleReset = () => {
    if(confirm("Tem certeza? Isso apagará todo seu histórico de conversas e progresso neste navegador.")) {
        persistenceService.resetAll();
        onLogout();
        window.location.reload();
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    alert("ID copiado para a área de transferência!");
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h1 className="text-3xl font-serif font-bold text-legal-900 mb-8">Configurações</h1>

      <div className="space-y-8">
        
        {/* Profile Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-legal-100">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><UserIcon size={20}/> Perfil Profissional</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Fingerprint size={12}/> ID de Identificação (Use para adicionar amigos)</label>
                 <div className="mt-1 flex gap-2">
                    <div className="flex-1 p-3 bg-slate-100 rounded-lg text-legal-900 font-mono text-sm border border-slate-200">
                       {user.id}
                    </div>
                    <button onClick={copyId} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition text-legal-600 shadow-sm" title="Copiar ID">
                       <Copy size={18}/>
                    </button>
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
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
