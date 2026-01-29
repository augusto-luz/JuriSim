
import React, { useState } from 'react';
import { 
  Check, Shield, Zap, GraduationCap, Briefcase, 
  Users, AlertTriangle, Lock, MessageSquare, 
  Send, HelpCircle, Headphones, ArrowLeft, Loader2
} from 'lucide-react';
import { UserRole } from '../types.ts';

interface PricingProps {
  onSelectPlan: (role: UserRole, billingCycle: 'monthly' | 'annual') => void;
  onCancel: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan, onCancel }) => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [sacForm, setSacForm] = useState({ subject: '', message: '' });
  const [sacSubmitted, setSacSubmitted] = useState(false);
  const [isSubmittingSac, setIsSubmittingSac] = useState(false);

  const plans = [
    {
      role: UserRole.STUDENT,
      title: 'Estudante',
      icon: GraduationCap,
      price: billing === 'monthly' ? '39,90' : '399,00',
      period: billing === 'monthly' ? '/mês' : '/ano',
      features: [
        'Acesso a casos educacionais',
        'Simulações ilimitadas com IA',
        'Dashboard de performance técnica',
        'Participação em Audiências Live'
      ],
      color: 'bg-blue-50 border-blue-200 text-blue-900',
    },
    {
      role: UserRole.LAWYER,
      title: 'Advogado Individual',
      icon: Briefcase,
      price: billing === 'monthly' ? '99,90' : '999,00',
      period: billing === 'monthly' ? '/mês' : '/ano',
      features: [
        'Tudo do plano Estudante',
        'Criação de Casos Autorais',
        'Analytics avançado de oratória',
        'Suporte prioritário via SAC',
        'Certificado de Prática Forense'
      ],
      color: 'bg-legal-50 border-legal-200 text-legal-900',
      popular: true
    },
    {
      role: UserRole.INSTRUCTOR,
      title: 'Instrutor / Professor',
      icon: Users,
      price: billing === 'monthly' ? '149,90' : '1.499,00',
      period: billing === 'monthly' ? '/mês' : '/ano',
      features: [
        'Tudo do plano Advogado',
        'Gestão de Turmas e Alunos',
        'Atribuição de exercícios específicos',
        'Mural de Avisos da Turma',
        'Relatórios de evolução coletiva'
      ],
      color: 'bg-purple-50 border-purple-200 text-purple-900',
    }
  ];

  const handleSacSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sacForm.message) return;
    setIsSubmittingSac(true);
    
    // Simulação de envio para o banco de dados
    setTimeout(() => {
      setIsSubmittingSac(false);
      setSacSubmitted(true);
      setSacForm({ subject: '', message: '' });
      setTimeout(() => setSacSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-full bg-slate-50 py-10 px-4 md:px-10 animate-in fade-in pb-24">
      <div className="max-w-7xl mx-auto space-y-16">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="text-left">
              <button onClick={onCancel} className="flex items-center gap-2 text-legal-500 hover:text-legal-900 font-bold text-sm mb-4 transition">
                <ArrowLeft size={16}/> Voltar ao Dashboard
              </button>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-legal-900">Planos de Assinatura</h1>
              <p className="text-slate-500 mt-2">Invista na sua excelência profissional com simulações de alta performance.</p>
           </div>
           
           <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 max-w-sm shadow-sm">
             <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20}/>
             <div className="text-xs">
                <p className="font-bold text-amber-800">Assinaturas Suspensas</p>
                <p className="text-amber-700 mt-0.5 leading-relaxed">
                   Gatway de pagamento em configuração. Por enquanto, utilize as funções gratuitas liberadas.
                </p>
             </div>
           </div>
        </div>

        {/* Toggle de Ciclo de Cobrança */}
        <div className="flex justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex shadow-inner">
            <button
              onClick={() => setBilling('monthly')}
              className={`${billing === 'monthly' ? 'bg-legal-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'} px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`${billing === 'annual' ? 'bg-legal-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'} px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2`}
            >
              Anual <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.title} className={`relative border rounded-[2.5rem] shadow-sm flex flex-col justify-between p-10 bg-white transition-all hover:shadow-2xl ${plan.popular ? 'ring-2 ring-accent-gold' : 'border-slate-100'}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-accent-gold px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-legal-900 shadow-xl border-4 border-white">
                      Mais Procurado
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-8">
                     <div className={`p-4 rounded-2xl ${plan.color.split(' ')[0]} ${plan.color.split(' ')[2]}`}>
                        <Icon size={32} />
                     </div>
                     <div className="text-right">
                        <h3 className="text-xl font-serif font-bold text-gray-900">{plan.title}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Plano Profissional</p>
                     </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1 text-gray-900">
                    <span className="text-4xl font-serif font-black">R$ {plan.price}</span>
                    <span className="text-lg font-bold text-slate-400">{plan.period}</span>
                  </div>

                  <ul className="mt-10 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="shrink-0 text-green-500 mt-0.5" size={18}/>
                        <span className="text-sm text-slate-600 leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={true}
                  className="mt-12 w-full py-4 rounded-2xl font-bold bg-slate-100 text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed group"
                >
                  <Lock size={16}/>
                  <span className="uppercase text-xs tracking-widest">Assinatura Indisponível</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Sistema SAC */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden max-w-5xl mx-auto mt-20">
           <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2 p-12 bg-legal-900 text-white flex flex-col justify-between">
                 <div>
                    <div className="bg-accent-gold w-14 h-14 rounded-2xl flex items-center justify-center text-legal-900 mb-8 shadow-2xl">
                       <Headphones size={28}/>
                    </div>
                    <h3 className="text-3xl font-serif font-bold mb-4">Central de Suporte SAC</h3>
                    <p className="text-legal-300 leading-relaxed text-sm">
                       Enquanto configuramos nossos fluxos financeiros, utilize este canal para reportar erros, solicitar recursos ou tirar dúvidas sobre o tribunal.
                    </p>
                 </div>
                 <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-legal-300">
                       <Check size={14} className="text-accent-gold"/> Resposta em até 24h
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-legal-300">
                       <Check size={14} className="text-accent-gold"/> Suporte Especializado
                    </div>
                 </div>
              </div>
              
              <div className="md:col-span-3 p-12">
                 {sacSubmitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                       <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner"><Check size={40}/></div>
                       <h4 className="text-2xl font-bold text-legal-900">Chamado Aberto</h4>
                       <p className="text-slate-500 mt-2 max-w-xs">Sua solicitação foi protocolada com sucesso. Verifique seu e-mail cadastrado em breve.</p>
                       <button onClick={() => setSacSubmitted(false)} className="mt-8 text-legal-600 font-bold hover:underline">Novo Chamado</button>
                    </div>
                 ) : (
                    <form onSubmit={handleSacSubmit} className="space-y-6">
                       <div className="grid grid-cols-1 gap-6">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Assunto da Demanda</label>
                             <select 
                               value={sacForm.subject}
                               onChange={e=>setSacForm({...sacForm, subject: e.target.value})}
                               required
                               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-gold text-sm transition-all"
                             >
                                <option value="">Selecione o tema...</option>
                                <option value="billing">Problemas com Conta</option>
                                <option value="technical">Falha no Sistema / IA</option>
                                <option value="scenarios">Sugestão de Novos Casos</option>
                                <option value="academic">Parcerias Acadêmicas</option>
                                <option value="other">Outros Assuntos</option>
                             </select>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sua Manifestação</label>
                             <textarea 
                               value={sacForm.message}
                               onChange={e=>setSacForm({...sacForm, message: e.target.value})}
                               required
                               placeholder="Descreva detalhadamente sua necessidade ou reporte o erro encontrado..."
                               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-gold h-40 resize-none text-sm transition-all"
                             />
                          </div>
                       </div>
                       <button 
                         type="submit" 
                         disabled={isSubmittingSac}
                         className="w-full bg-legal-900 text-white py-5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                       >
                          {isSubmittingSac ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>} 
                          Protocolar Ticket de Suporte
                       </button>
                    </form>
                 )}
              </div>
           </div>
        </div>
        
      </div>
    </div>
  );
};
