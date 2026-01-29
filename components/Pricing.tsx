
import React, { useState } from 'react';
import { 
  Check, Shield, Zap, GraduationCap, Briefcase, 
  Users, AlertTriangle, Lock, MessageSquare, 
  Send, HelpCircle, Headphones
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

  const plans = [
    {
      role: UserRole.STUDENT,
      title: 'Estudante',
      icon: GraduationCap,
      price: billing === 'monthly' ? '39,90' : '399,00',
      period: billing === 'monthly' ? '/mês' : '/ano',
      features: [
        'Acesso a casos educacionais',
        'Simulações com IA (Gemini)',
        'Dashboard de progresso pessoal',
        'Multiplayer Básico'
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
        'Casos Avançados e Complexos',
        'Analytics de Desempenho',
        'Scorecard de Argumentação',
        'Prioridade no Suporte'
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
        'Criação de Turmas Virtuais',
        'Gestão de Alunos',
        'Atribuição de Casos',
        'Dashboard de Turma'
      ],
      color: 'bg-purple-50 border-purple-200 text-purple-900',
    }
  ];

  const handleSacSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sacForm.message) return;
    // Aqui seria a integração com banco para salvar o ticket
    setSacSubmitted(true);
    setTimeout(() => {
      setSacSubmitted(false);
      setSacForm({ subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="text-center">
          <h2 className="text-base font-semibold text-legal-600 tracking-wide uppercase">Planos e Preços</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl font-serif">
            Escolha o plano ideal para sua carreira
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Da graduação à advocacia de alta performance, temos a ferramenta certa para você.
          </p>
          
          <div className="mt-6 mx-auto max-w-lg bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 text-left shadow-sm">
             <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20}/>
             <div>
                <h4 className="font-bold text-amber-800 text-sm">Transações Suspensas</h4>
                <p className="text-xs text-amber-700 mt-1">
                   O sistema de assinaturas está em fase de homologação bancária. A contratação direta via plataforma será liberada em breve.
                </p>
             </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="relative bg-white border border-gray-200 rounded-2xl p-1.5 flex shadow-inner">
            <button
              onClick={() => setBilling('monthly')}
              className={`${billing === 'monthly' ? 'bg-legal-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'} relative w-32 rounded-xl py-2.5 text-sm font-bold transition-all`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`${billing === 'annual' ? 'bg-legal-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'} relative w-32 rounded-xl py-2.5 text-sm font-bold transition-all`}
            >
              Anual <span className="text-[10px] ml-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.title} className={`relative border rounded-[2.5rem] shadow-sm flex flex-col justify-between p-10 bg-white transition-all hover:shadow-xl ${plan.popular ? 'ring-2 ring-accent-gold' : 'border-gray-100'}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-10 -translate-y-1/2">
                    <span className="inline-flex rounded-full bg-accent-gold px-4 py-1.5 text-xs font-black tracking-widest uppercase text-legal-900 shadow-lg">
                      Mais Procurado
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-serif font-bold text-gray-900">{plan.title}</h3>
                     <div className={`p-3 rounded-2xl ${plan.color.split(' ')[0]}`}>
                        <Icon size={28} className={plan.color.split('text-')[1]} />
                     </div>
                  </div>
                  
                  <div className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-4xl font-serif font-black tracking-tight">R$ {plan.price}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-400">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Homologação Stripe pendente</p>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" />
                        <span className="ml-3 text-sm text-gray-600 leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={true}
                  className={`mt-10 block w-full py-4 px-6 rounded-2xl text-center font-bold text-white shadow-sm cursor-not-allowed bg-slate-300 transition-all active:scale-95`}
                >
                  <div className="flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                     <Lock size={16}/>
                     Indisponível
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Sistema SAC Integrado */}
        <div id="sac" className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-12 bg-legal-900 text-white flex flex-col justify-between">
                 <div>
                    <div className="bg-accent-gold w-12 h-12 rounded-2xl flex items-center justify-center text-legal-900 mb-6 shadow-lg">
                       <Headphones size={24}/>
                    </div>
                    <h3 className="text-3xl font-serif font-bold mb-4">Central SAC</h3>
                    <p className="text-legal-300 leading-relaxed mb-8">
                       Precisa de auxílio técnico ou tem dúvidas sobre sua conta? Nosso time de suporte jurídico está pronto para ajudar.
                    </p>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-sm">
                          <HelpCircle size={18} className="text-accent-gold"/>
                          <span>Dúvidas Técnicas</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm">
                          <MessageSquare size={18} className="text-accent-gold"/>
                          <span>Sugestão de Teses</span>
                       </div>
                    </div>
                 </div>
                 <p className="text-[10px] text-legal-400 font-black uppercase tracking-widest mt-12">Resposta em até 24h úteis</p>
              </div>
              
              <div className="p-12">
                 {sacSubmitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                       <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4"><Check size={32}/></div>
                       <h4 className="text-xl font-bold text-legal-900">Chamado Aberto!</h4>
                       <p className="text-sm text-slate-500 mt-2">Protocolamos sua solicitação. Verifique seu e-mail em breve.</p>
                    </div>
                 ) : (
                    <form onSubmit={handleSacSubmit} className="space-y-6">
                       <h4 className="text-lg font-bold text-legal-900 mb-6 flex items-center gap-2">Protocolar Chamado</h4>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Assunto</label>
                          <select 
                            value={sacForm.subject}
                            onChange={e=>setSacForm({...sacForm, subject: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-gold text-sm"
                          >
                             <option value="">Selecione o tema...</option>
                             <option value="billing">Dúvida Financeira</option>
                             <option value="technical">Erro no Sistema</option>
                             <option value="academic">Dúvida sobre Casos</option>
                             <option value="other">Outros Assuntos</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sua Mensagem</label>
                          <textarea 
                            value={sacForm.message}
                            onChange={e=>setSacForm({...sacForm, message: e.target.value})}
                            required
                            placeholder="Descreva detalhadamente sua necessidade..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-gold h-32 resize-none text-sm"
                          />
                       </div>
                       <button className="w-full bg-legal-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-gold hover:text-legal-900 transition-all shadow-lg active:scale-95">
                          <Send size={18}/> Abrir Ticket de Suporte
                       </button>
                    </form>
                 )}
              </div>
           </div>
        </div>
        
        <div className="text-center pt-8">
           <button onClick={onCancel} className="text-legal-600 hover:text-legal-900 text-sm font-bold underline transition-colors">
             Voltar ao Dashboard
           </button>
        </div>
      </div>
    </div>
  );
};
