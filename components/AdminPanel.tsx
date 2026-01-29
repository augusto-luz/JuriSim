
import React, { useState, useEffect } from 'react';
import { persistenceService } from '../services/persistence.ts';
import { User, UserRole } from '../types.ts';
import { 
  ShieldAlert, Edit, Trash2, Ban, CheckCircle, Key, 
  Fingerprint, Copy, RefreshCw, ShieldCheck, UserCog
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const loadUsers = async () => {
    const data = await persistenceService.getAllUsers();
    setUsers(data);
  };

  useEffect(() => { loadUsers(); }, []);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleAdmin = (user: User) => {
    if (user.id === 'ADMIN-MASTER') return;
    const newRole = user.role === UserRole.ADMIN ? UserRole.STUDENT : UserRole.ADMIN;
    const updated = { ...user, role: newRole };
    persistenceService.saveUserGlobally(updated);
    loadUsers();
    notify(`Usuário ${user.name} agora é ${newRole}.`);
  };

  const handleToggleSuspend = (user: User) => {
    if (user.id === 'ADMIN-MASTER') return;
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    persistenceService.saveUserGlobally({ ...user, status: newStatus as any });
    loadUsers();
    notify(`Status de ${user.name} alterado para ${newStatus}.`);
  };

  const handleDelete = (userId: string) => {
    if (userId === 'ADMIN-MASTER') return;
    if (confirm("EXCLUIR PERMANENTEMENTE? Esta ação não pode ser desfeita.")) {
      persistenceService.deleteUser(userId);
      loadUsers();
      notify("Usuário removido do sistema.", 'error');
    }
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
       <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-legal-900 flex items-center gap-3">
             <ShieldAlert className="text-red-600" size={32}/> Painel Admin Master
          </h1>
          <button onClick={loadUsers} className="p-2 hover:bg-slate-100 rounded-full"><RefreshCw size={20}/></button>
       </div>

       {notification && (
         <div className={`fixed top-10 right-10 p-4 rounded-xl shadow-2xl z-50 text-white ${notification.type === 'error' ? 'bg-red-600' : 'bg-legal-900'}`}>
            {notification.msg}
         </div>
       )}

       <input 
         value={searchTerm} 
         onChange={e=>setSearchTerm(e.target.value)} 
         placeholder="Filtrar magistrados, advogados ou alunos..." 
         className="w-full p-4 bg-white border rounded-2xl outline-none shadow-sm"
       />

       <div className="bg-white rounded-[2rem] border overflow-hidden">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                   <th className="px-6 py-4">Usuário</th>
                   <th className="px-6 py-4">Cargo Atual</th>
                   <th className="px-6 py-4">ID Juri</th>
                   <th className="px-6 py-4 text-right">Ações de Superusuário</th>
                </tr>
             </thead>
             <tbody className="divide-y text-sm">
                {filtered.map(u => (
                   <tr key={u.id} className={`hover:bg-slate-50 ${u.status === 'suspended' ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                         <p className="font-bold text-legal-900">{u.name}</p>
                         <p className="text-xs text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : 'bg-slate-100'}`}>
                            {u.role}
                         </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{u.id}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                         <button onClick={() => handleToggleAdmin(u)} className={`p-2 rounded-lg transition ${u.role === UserRole.ADMIN ? 'text-red-600' : 'text-slate-400 hover:text-legal-900'}`} title="Tornar Admin"><UserCog size={18}/></button>
                         <button onClick={() => handleToggleSuspend(u)} className={`p-2 rounded-lg transition ${u.status === 'suspended' ? 'text-green-600' : 'text-slate-400 hover:text-red-600'}`} title="Suspender"><Ban size={18}/></button>
                         <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 transition"><Trash2 size={18}/></button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};
