
import React, { useState } from 'react';
// Added Loader2 to lucide-react imports
import { X, Save, FileText, Plus, Trash2, BookOpen, Target, Users, Loader2 } from 'lucide-react';
import { Scenario, User } from '../types.ts';
import { persistenceService } from '../services/persistence.ts';

interface NewCaseModalProps {
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({ onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Scenario>>({
    title: '',
    description: '',
    area: 'Civil',
    difficulty: 'Iniciante',
    facts: '',
    evidence: [''],
    witnesses: [''],
    objectives: ['']
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddField = (field: 'evidence' | 'witnesses' | 'objectives') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const handleRemoveField = (field: 'evidence' | 'witnesses' | 'objectives', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index)
    }));
  };

  const handleChangeField = (field: 'evidence' | 'witnesses' | 'objectives', index: number, value: string) => {
    const updated = [...(formData[field] || [])];
    updated[index] = value;
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.facts) {
      alert("Título e Fatos do Caso são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const newCase: Scenario = {
        id: `CUSTOM-${Date.now()}`,
        title: formData.title!,
        description: formData.description || formData.title!,
        area: formData.area as any,
        difficulty: formData.difficulty as any,
        progress: 0,
        facts: formData.facts!,
        evidence: formData.evidence?.filter(e => e.trim()) || [],
        witnesses: formData.witnesses?.filter(w => w.trim()) || [],
        objectives: formData.objectives?.filter(o => o.trim()) || [],
        createdBy: user.id
      };

      await persistenceService.saveCustomScenario(newCase);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o caso. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="p-6 bg-legal-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-accent-gold p-2 rounded-xl text-legal-900 shadow-lg">
                <FileText size={20}/>
             </div>
             <h2 className="text-xl font-serif font-bold">Protocolar Novo Caso Autoral</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-50/50">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Título do Caso / Autos</label>
                 <input 
                   value={formData.title} 
                   onChange={e=>setFormData({...formData, title: e.target.value})}
                   placeholder="Ex: Ação de Cobrança Indevida c/c Danos Morais"
                   className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-sm"
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Área do Direito</label>
                 <select 
                   value={formData.area} 
                   onChange={e=>setFormData({...formData, area: e.target.value as any})}
                   className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-gold transition shadow-sm"
                 >
                    <option value="Civil">Civil</option>
                    <option value="Penal">Penal</option>
                    <option value="Trabalhista">Trabalhista</option>
                    <option value="Administrativo">Administrativo</option>
                 </select>
              </div>
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Narrativa dos Fatos (Obrigatório)</label>
              <textarea 
                value={formData.facts} 
                onChange={e=>setFormData({...formData, facts: e.target.value})}
                placeholder="Descreva detalhadamente os fatos que fundamentam a lide..."
                className="w-full p-6 bg-white border border-slate-200 rounded-[1.5rem] outline-none h-40 focus:ring-2 focus:ring-accent-gold transition shadow-sm resize-none text-sm leading-relaxed"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DynamicFieldList 
                 icon={BookOpen} 
                 label="Acervo Probatório" 
                 items={formData.evidence || []} 
                 onAdd={() => handleAddField('evidence')} 
                 onRemove={i => handleRemoveField('evidence', i)} 
                 onChange={(i, v) => handleChangeField('evidence', i, v)}
              />
              <DynamicFieldList 
                 icon={Users} 
                 label="Rol de Testemunhas" 
                 items={formData.witnesses || []} 
                 onAdd={() => handleAddField('witnesses')} 
                 onRemove={i => handleRemoveField('witnesses', i)} 
                 onChange={(i, v) => handleChangeField('witnesses', i, v)}
              />
              <DynamicFieldList 
                 icon={Target} 
                 label="Objetivos Técnicos" 
                 items={formData.objectives || []} 
                 onAdd={() => handleAddField('objectives')} 
                 onRemove={i => handleRemoveField('objectives', i)} 
                 onChange={(i, v) => handleChangeField('objectives', i, v)}
              />
           </div>
        </div>

        <div className="p-6 bg-white border-t flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-legal-900 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-xl active:scale-95 disabled:opacity-50"
           >
              {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Protocolar Caso
           </button>
        </div>
      </div>
    </div>
  );
};

const DynamicFieldList = ({ icon: Icon, label, items, onAdd, onRemove, onChange }: any) => (
  <div className="space-y-4">
     <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <Icon size={12}/> {label}
        </label>
        <button onClick={onAdd} className="p-1 hover:bg-slate-100 rounded text-legal-900"><Plus size={16}/></button>
     </div>
     <div className="space-y-2">
        {items.map((item: string, i: number) => (
           <div key={i} className="flex gap-2">
              <input 
                 value={item} 
                 onChange={e=>onChange(i, e.target.value)}
                 className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-accent-gold"
                 placeholder={`Item ${i+1}`}
              />
              <button onClick={() => onRemove(i)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
           </div>
        ))}
     </div>
  </div>
);
