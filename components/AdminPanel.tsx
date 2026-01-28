
import React, { useState, useEffect } from 'react';
import { persistenceService } from '../services/persistence';
import { User, UserRole } from '../types';
import { 
  Users, Search, ShieldAlert, Edit, Trash2, Ban, CheckCircle, Mail, Key, 
  Database, Fingerprint, Clock, ExternalLink, MoreVertical, X, Save, AlertTriangle, Copy, RefreshCw,
  ShieldCheck
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = () => {
    setIsRefreshing(true);
    // Pequeno delay para feedback visual de carregamento
    setTimeout(() => {
      const data = persistenceService.getAllUsers();
      setUsers(data);
      setIsRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleSuspend = (user: User) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const updatedUser = { ...user, status: newStatus as 'active' | 'suspended' };
    persistenceService.saveUserGlobally(updatedUser);
    loadUsers();
    notify(`Usuário ${user.name} ${newStatus === 'suspended' ? 'suspenso' : 'reativado'}.`);
  };

  const handleToggleApproveInstructor = (user: User) => {
    const updatedUser = { ...user, instructorApproved: !user.instructorApproved };
    persistenceService.saveUserGlobally(updatedUser);
    loadUsers();
    notify(
      `Acesso de Instrutor para ${user.name} ${updatedUser.instructorApproved ? 'AUTORIZADO' : 'REVOGADO'} imediatamente.`, 
      updatedUser.instructorApproved ? 'success' : 'error'
    );
  };

  const handleDelete = (userId: string) => {
    if (userId === 'JURI-0001' || userId === 'admin-master') {
      notify("Não é possível excluir a conta mestre do sistema.", 'error');
      return;
    }

    if (confirm("ATENÇÃO: A exclusão é irreversível. Todos os dados, histórico de audiências e performance deste usuário serão apagados permanentemente do banco de dados. Deseja prosseguir?")) {
      persistenceService.deleteUser(userId);
      loadUsers();
      notify("Registro removido do banco de dados com sucesso.", 'error');
    }
  };

  const handleSendRecovery = (email: string) => {
    notify(`Link de recuperação enviado para: ${email}`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      persistenceService.saveUserGlobally(editingUser);
      setEditingUser(null);
      loadUsers();
      notify("Dados do usuário atualizados no sistema.");
    }
  };

  const copyUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    notify("ID de Identificação copiado!");
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-serif font-bold text-legal-900 flex items-center gap-3">
             <ShieldAlert className="text-red-600" size={32}/> Painel de Controle Master
           </h1>
           <p className="text-sm text-slate-500 mt-1">Gestão centralizada de usuários e integridade do banco de dados.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={loadUsers} 
             disabled={isRefreshing}
             className="bg-white border rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
           >
              <RefreshCw size={16} className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}/>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                {isRefreshing ? 'Sincronizando...' : `${users.length} Registros`}
              </span>
           </button>
        </div>
      </div>

      {notification && (
        <div className={`fixed bottom-10 right-10 p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-legal-900 text-white'}`}>
          {notification.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
          <span className="text-sm font-bold">{notification.msg}</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
        <input 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder="Pesquisar por Nome, E-mail ou ID..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition shadow-sm"
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Função / Plano</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID de Identificação</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.status === 'suspended' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-legal-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-700">{u.role}</span>
                       <span className={`text-[10px] font-black uppercase ${u.plan === 'PREMIUM' ? 'text-accent-gold' : 'text-slate-400'}`}>{u.plan || 'FREE'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${u.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {u.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                          </span>
                          {u.isVerified && <CheckCircle size={12} className="text-blue-500" title="E-mail Verificado"/>}
                       </div>
                       {u.role === UserRole.INSTRUCTOR && (
                         <div className="flex items-center gap-1">
                            <ShieldCheck size={10} className={u.instructorApproved ? 'text-green-500' : 'text-slate-300'}/>
                            <span className={`text-[9px] font-black uppercase ${u.instructorApproved ? 'text-green-600' : 'text-slate-400'}`}>
                               {u.instructorApproved ? 'Instrutor Autorizado' : 'Pendente de Avaliação'}
                            </span>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyUserId(u.id)}>
                       <Fingerprint size={12} className="text-slate-400 group-hover:text-legal-900"/>
                       <code className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded group-hover:bg-slate-200 transition-colors">
                         {u.id}
                       </code>
                       <Copy size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {u.role === UserRole.INSTRUCTOR && (
                        <button 
                          onClick={() => handleToggleApproveInstructor(u)} 
                          className={`p-2 transition ${u.instructorApproved ? 'text-green-600' : 'text-slate-400 hover:text-green-500'}`} 
                          title={u.instructorApproved ? 'Revogar Autorização' : 'Autorizar Acesso Instrutor'}
                        >
                          <ShieldCheck size={16}/>
                        </button>
                      )}
                      <button onClick={() => setEditingUser(u)} className="p-2 text-slate-400 hover:text-blue-600 transition" title="Editar Dados"><Edit size={16}/></button>
                      <button onClick={() => handleSendRecovery(u.email)} className="p-2 text-slate-400 hover:text-accent-gold transition" title="Recuperar Senha"><Key size={16}/></button>
                      <button onClick={() => handleToggleSuspend(u)} className={`p-2 transition ${u.status === 'suspended' ? 'text-green-500' : 'text-slate-400 hover:text-red-600'}`} title={u.status === 'suspended' ? 'Ativar Conta' : 'Suspender Conta'}>
                        <Ban size={16}/>
                      </button>
                      {(u.id !== 'JURI-0001' && u.id !== 'admin-master') && (
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 transition" title="Excluir Permanentemente"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">
              {users.length === 0 ? "O banco de dados de usuários está vazio." : "Nenhum usuário encontrado com os termos de pesquisa informados."}
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <form onSubmit={handleSaveEdit} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-serif font-bold">Editar Usuário</h2>
                    <p className="text-slate-400 text-sm">Atualizando registro master: {editingUser.id}</p>
                 </div>
                 <button type="button" onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24}/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase">Nome Completo</label>
                       <input 
                         value={editingUser.name} 
                         onChange={e=>setEditingUser({...editingUser, name: e.target.value})} 
                         className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold text-legal-900" 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase">E-mail</label>
                       <input 
                         value={editingUser.email} 
                         onChange={e=>setEditingUser({...editingUser, email: e.target.value})} 
                         className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold text-legal-900" 
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase">Função</label>
                       <select 
                         value={editingUser.role} 
                         onChange={e=>setEditingUser({...editingUser, role: e.target.value as UserRole})}
                         className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold text-legal-900" 
                       >
                          <option value={UserRole.STUDENT}>Estudante</option>
                          <option value={UserRole.LAWYER}>Advogado(a)</option>
                          <option value={UserRole.INSTRUCTOR}>Instrutor</option>
                          <option value={UserRole.ADMIN}>Administrador</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase">Plano</label>
                       <select 
                         value={editingUser.plan} 
                         onChange={e=>setEditingUser({...editingUser, plan: e.target.value as 'FREE' | 'PREMIUM'})}
                         className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold text-legal-900" 
                       >
                          <option value="FREE">Gratuito</option>
                          <option value="PREMIUM">Premium</option>
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={18}/> Salvar Alterações e Sincronizar
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};
