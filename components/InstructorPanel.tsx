
import React, { useState, useEffect, useRef } from 'react';
import { persistenceService } from '../services/persistence';
import { User, UserRole, ClassRoom, StudentReport, Scenario, ChatMessage } from '../types';
import { 
  Users, Plus, PlusCircle, BookOpen, Activity, MessageCircle, 
  Search, Trash2, UserPlus, ArrowRight, Eye, 
  Download, FileText, CheckCircle, Clock, BarChart2,
  Lock, AlertCircle, Send
} from 'lucide-react';

interface InstructorPanelProps {
  user: User;
}

export const InstructorPanel: React.FC<InstructorPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'performance' | 'cases' | 'chat'>('classes');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const isApproved = user.instructorApproved || user.role === UserRole.ADMIN;

  useEffect(() => {
    if (isApproved) {
      loadData();
    }
  }, [isApproved, user.id]);

  useEffect(() => {
    if (activeTab === 'chat' && selectedClass) {
      loadChat();
      const interval = setInterval(loadChat, 3000); // Polling simples para simular tempo real
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedClass]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadData = () => {
    const instructorClasses = persistenceService.getClasses(user.id);
    setClasses([...instructorClasses]);
    setAllUsers(persistenceService.getAllUsers());
    setReports(persistenceService.getAllReports());
    setCustomScenarios(persistenceService.getCustomScenarios(user.id));
  };

  const loadChat = () => {
    if (selectedClass) {
      const msgs = persistenceService.getClassMessages(selectedClass.id);
      setChatMessages(msgs);
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !selectedClass) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      senderName: user.name,
      text: chatInput,
      timestamp: Date.now()
    };
    persistenceService.saveClassMessage(selectedClass.id, newMsg);
    setChatInput('');
    loadChat();
  };

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassRoom = {
      id: `class-${Date.now()}`,
      name: newClassName,
      instructorId: user.id,
      studentIds: [],
      createdAt: Date.now()
    };
    persistenceService.saveClass(newClass);
    setNewClassName('');
    setIsAddingClass(false);
    loadData();
    setSelectedClass(newClass);
  };

  const handleDeleteClass = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente excluir esta turma? Todos os vínculos de alunos serão removidos permanentemente.")) {
      persistenceService.deleteClass(id);
      if (selectedClass?.id === id) setSelectedClass(null);
      setClasses(prev => prev.filter(c => c.id !== id));
      setTimeout(() => loadData(), 100);
    }
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja excluir permanentemente este caso autoral? Alunos que já iniciaram o estudo deste caso perderão o acesso.")) {
      persistenceService.deleteCustomScenario(id);
      loadData();
    }
  };

  const handleAddStudentToClass = (studentId: string) => {
    if (!selectedClass) return;
    if (selectedClass.studentIds.includes(studentId)) return;
    
    const updated = { ...selectedClass, studentIds: [...selectedClass.studentIds, studentId] };
    persistenceService.saveClass(updated);
    setSelectedClass(updated);
    loadData();
  };

  const removeStudentFromClass = (studentId: string) => {
    if (!selectedClass) return;
    if (confirm("Remover este aluno da turma? Ele não terá mais acesso aos casos atribuídos especificamente a este grupo.")) {
      const updated = { ...selectedClass, studentIds: selectedClass.studentIds.filter(id => id !== studentId) };
      persistenceService.saveClass(updated);
      setSelectedClass(updated);
      loadData();
    }
  };

  const filteredSearchUsers = allUsers.filter(u => 
    u.id !== user.id && (
      u.email.toLowerCase().includes(studentSearch.toLowerCase()) || 
      u.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(studentSearch.toLowerCase())
    )
  );

  if (!isApproved) {
    return (
      <div className="h-full flex items-center justify-center p-6 animate-in fade-in">
        <div className="max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center">
           <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40}/>
           </div>
           <h2 className="text-2xl font-serif font-bold text-legal-900 mb-4">Acesso Restrito</h2>
           <p className="text-slate-500 mb-8 leading-relaxed">
             Suas credenciais de Instrutor ainda não foram validadas pelo Administrador Master. 
             Após a aprovação, você terá acesso completo à gestão de turmas e alunos.
           </p>
           <button className="w-full py-4 bg-legal-900 text-white rounded-xl font-bold opacity-50 cursor-not-allowed">
              Aguardando Liberação...
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div>
           <h1 className="text-3xl font-serif font-bold text-legal-900">Portal do Professor</h1>
           <p className="text-sm text-slate-500">Gestão acadêmica e monitoramento de performance.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar">
           <TabButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} label="Minhas Turmas" icon={Users} />
           <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} label="Desempenho" icon={BarChart2} />
           <TabButton active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} label="Casos Autorais" icon={BookOpen} />
           <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label="Mural da Turma" icon={MessageCircle} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-white rounded-[2rem] p-8 border shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-legal-900">Turmas Ativas</h3>
                      <button onClick={() => setIsAddingClass(true)} className="p-2 bg-legal-900 text-white rounded-lg hover:bg-accent-gold hover:text-legal-900 transition shadow-md active:scale-95">
                        <Plus size={18}/>
                      </button>
                  </div>
                  <div className="space-y-3">
                      {classes.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedClass(c)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${selectedClass?.id === c.id ? 'bg-slate-50 border-accent-gold shadow-sm' : 'hover:bg-slate-50 border-slate-100'}`}
                        >
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-bold text-legal-900 truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase">{c.studentIds.length} Alunos Matrulados</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                  onClick={(e) => handleDeleteClass(c.id, e)} 
                                  className="p-2 text-slate-300 hover:text-red-600 opacity-60 group-hover:opacity-100 transition-opacity"
                                  title="Excluir Turma"
                              >
                                  <Trash2 size={18}/>
                              </button>
                              <ArrowRight size={16} className={selectedClass?.id === c.id ? 'text-accent-gold' : 'text-slate-300'}/>
                            </div>
                        </div>
                      ))}
                      {classes.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma turma criada.</p>}
                  </div>
                </div>

                {isAddingClass && (
                  <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4 animate-in slide-in-from-top-4 shadow-2xl">
                      <h4 className="text-sm font-bold">Nova Turma</h4>
                      <input 
                        value={newClassName} 
                        onChange={e=>setNewClassName(e.target.value)} 
                        placeholder="Nome da Turma (Ex: Direito Civil III)" 
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleCreateClass} className="flex-1 bg-accent-gold text-legal-900 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition active:scale-95">Criar</button>
                        <button onClick={() => setIsAddingClass(false)} className="flex-1 bg-white/10 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition">Cancelar</button>
                      </div>
                  </div>
                )}
            </div>

            <div className="lg:col-span-2 h-full">
                {selectedClass ? (
                  <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col h-full">
                      <div className="p-8 bg-slate-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-legal-900">{selectedClass.name}</h3>
                            <p className="text-xs text-slate-500 font-mono">ID da Turma: {selectedClass.id}</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                            <input 
                              value={studentSearch} 
                              onChange={e=>setStudentSearch(e.target.value)} 
                              placeholder="Pesquisar Usuário (ID, E-mail ou Nome)..." 
                              className="pl-9 pr-4 py-2 bg-white border rounded-lg text-xs w-full sm:w-64 focus:ring-2 focus:ring-accent-gold shadow-inner" 
                            />
                            {studentSearch.trim() && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto border-slate-200">
                                  {filteredSearchUsers.map(u => (
                                    <button 
                                      key={u.id} 
                                      onClick={() => { handleAddStudentToClass(u.id); setStudentSearch(''); }}
                                      className="w-full text-left p-3 hover:bg-slate-50 text-xs flex items-center justify-between border-b last:border-0 transition-colors"
                                    >
                                        <div>
                                          <p className="font-bold text-legal-900">{u.name} <span className="text-[9px] font-black text-slate-400 uppercase">({u.role})</span></p>
                                          <p className="text-[10px] text-slate-400">{u.email}</p>
                                        </div>
                                        <UserPlus size={14} className="text-accent-gold"/>
                                    </button>
                                  ))}
                                  {filteredSearchUsers.length === 0 && <div className="p-4 text-center text-[10px] text-slate-400 italic">Nenhum usuário encontrado.</div>}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedClass.studentIds.map(sid => {
                              const s = allUsers.find(u => u.id === sid);
                              if (!s) return null;
                              return (
                                  <div key={sid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-legal-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">{s.name.charAt(0)}</div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold text-legal-900 truncate">{s.name}</p>
                                          <p className="text-[10px] text-slate-400 font-mono truncate">ID: {s.id}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeStudentFromClass(sid)} 
                                        className="p-2 text-slate-300 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                                        title="Desvincular Aluno"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                  </div>
                              );
                            })}
                            {selectedClass.studentIds.length === 0 && (
                              <div className="col-span-2 text-center py-20 text-slate-400 italic">Esta turma ainda não possui alunos vinculados.</div>
                            )}
                        </div>
                      </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 italic border-2 border-dashed rounded-[2.5rem] bg-white p-20">
                      <Users size={64} className="mb-4 opacity-10"/>
                      <p>Selecione uma turma para gerenciar alunos e matrículas.</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6 h-full overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Relatórios IA</p>
                    <p className="text-3xl font-serif font-bold text-legal-900">{reports.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Média Geral de Turma</p>
                    <p className="text-3xl font-serif font-bold text-accent-gold">
                      {reports.length > 0 ? Math.round(reports.reduce((a,b)=>a+b.score, 0) / reports.length) : 0}%
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alunos Ativos</p>
                    <p className="text-3xl font-serif font-bold text-legal-900">{new Set(reports.map(r=>r.studentId)).size}</p>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Aluno</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Caso Simulado</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Score IA</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Data/Hora</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {reports.sort((a,b)=>b.timestamp-a.timestamp).map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-legal-900 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-sm">{r.studentName.charAt(0)}</div>
                                      <span className="text-xs font-bold text-legal-900">{r.studentName}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-600 truncate max-w-[200px]">{r.scenarioTitle}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${r.score > 70 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {r.score}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-[10px] text-slate-400">{new Date(r.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                  <button className="p-2 bg-slate-100 rounded-lg text-legal-900 hover:bg-accent-gold transition shadow-sm">
                                      <Eye size={16}/>
                                  </button>
                                </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                </div>
              </div>
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="space-y-6 h-full overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-legal-900 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10 space-y-4">
                    <h2 className="text-3xl font-serif font-bold leading-tight">Construtor de Casos Acadêmicos</h2>
                    <p className="text-legal-300 max-w-lg">Crie seus próprios autos, defina provas e objetivos. Seus alunos poderão simular audiências baseadas na sua metodologia.</p>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('OPEN_CASE_MODAL'))} className="bg-accent-gold text-legal-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-yellow-500 transition shadow-xl shrink-0 active:scale-95">
                    <PlusCircle size={20}/> Criar Novo Caso
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customScenarios.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between hover:border-accent-gold transition-all group relative overflow-hidden">
                      <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black px-3 py-1 bg-legal-50 text-legal-600 rounded-full uppercase tracking-widest">{s.area}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-legal-900" title="Ver Detalhes"><Eye size={16}/></button>
                                <button onClick={(e) => handleDeleteScenario(s.id, e)} className="p-2 text-slate-400 hover:text-red-600" title="Excluir Caso"><Trash2 size={18}/></button>
                            </div>
                          </div>
                          <h4 className="text-lg font-serif font-bold text-legal-900 mb-2 truncate">{s.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-6 italic leading-relaxed">"{s.facts.substring(0, 150)}..."</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <FileText size={12}/> {s.attachments?.length || 0} Anexos
                          </div>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">REF: {s.id.split('-')[1] || 'AUTO'}</span>
                      </div>
                    </div>
                ))}
                {customScenarios.length === 0 && (
                    <div className="col-span-2 text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic">
                      Nenhum caso autoral encontrado. Clique em "Criar Novo Caso" para começar.
                    </div>
                )}
              </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col gap-4 animate-in slide-in-from-bottom-4">
             {selectedClass ? (
               <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
                 <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="bg-legal-900 p-2.5 rounded-xl text-accent-gold shadow-md">
                          <MessageCircle size={20}/>
                       </div>
                       <div>
                          <h3 className="text-lg font-serif font-bold text-legal-900">{selectedClass.name} - Mural de Avisos</h3>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedClass.studentIds.length} Participantes</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30" ref={chatScrollRef}>
                    {chatMessages.length === 0 && (
                       <div className="h-full flex flex-col items-center justify-center opacity-40 text-slate-400 italic py-20">
                          <MessageCircle size={48} className="mb-4"/>
                          <p>Nenhuma mensagem no mural. Inicie um diálogo com a turma.</p>
                       </div>
                    )}
                    {chatMessages.map(msg => (
                       <div key={msg.id} className={`flex flex-col ${msg.senderName === user.name ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm border ${msg.senderName === user.name ? 'bg-legal-900 text-white rounded-tr-none border-legal-800' : 'bg-white text-slate-700 rounded-tl-none border-slate-100'}`}>
                             <p className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-60">{msg.senderName}</p>
                             <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                    ))}
                 </div>

                 <div className="p-6 border-t bg-white">
                    <div className="flex gap-3 max-w-4xl mx-auto">
                       <input 
                         value={chatInput} 
                         onChange={e=>setChatInput(e.target.value)} 
                         onKeyDown={e=>e.key==='Enter' && handleSendChatMessage()}
                         placeholder="Escrever comunicado para a turma..." 
                         className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-accent-gold transition text-sm shadow-inner"
                       />
                       <button onClick={handleSendChatMessage} className="bg-legal-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg hover:bg-accent-gold hover:text-legal-900 transition active:scale-95 shrink-0">
                          <Send size={20}/>
                       </button>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-300 italic border-2 border-dashed rounded-[2.5rem] bg-white p-20">
                  <MessageCircle size={64} className="mb-4 opacity-10"/>
                  <p>Selecione uma turma à esquerda para acessar o mural de mensagens.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${active ? 'bg-white text-legal-900 border-slate-200' : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100'}`}>
    <Icon size={16}/> {label}
  </button>
);
