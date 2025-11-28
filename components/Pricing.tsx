import React, { useState } from 'react';
import { Check, Shield, Zap, GraduationCap, Briefcase, Building, Users } from 'lucide-react';
import { UserRole } from '../types';

interface PricingProps {
  onSelectPlan: (role: UserRole, billingCycle: 'monthly' | 'annual') => void;
  onCancel: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan, onCancel }) => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

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
      btnColor: 'bg-blue-600 hover:bg-blue-700'
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
      btnColor: 'bg-legal-800 hover:bg-legal-700',
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
      btnColor: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-base font-semibold text-legal-600 tracking-wide uppercase">Planos e Preços</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl font-serif">
            Escolha o plano ideal para sua carreira
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Da graduação à advocacia de alta performance, temos a ferramenta certa para você.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="relative bg-white border border-gray-200 rounded-lg p-1 flex">
            <button
              onClick={() => setBilling('monthly')}
              className={`${billing === 'monthly' ? 'bg-legal-800 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'} relative w-32 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 sm:w-auto sm:px-8 transition-all`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`${billing === 'annual' ? 'bg-legal-800 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'} relative w-32 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 sm:w-auto sm:px-8 transition-all`}
            >
              Anual <span className="text-[10px] ml-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.title} className={`relative border rounded-2xl shadow-sm flex flex-col justify-between p-8 bg-white hover:shadow-lg transition-shadow duration-300 ${plan.popular ? 'ring-2 ring-legal-500 scale-105 z-10' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                    <span className="inline-flex rounded-full bg-accent-gold px-4 py-1 text-sm font-semibold tracking-wider uppercase text-white shadow-sm">
                      Recomendado
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                     <div className={`p-2 rounded-lg ${plan.color.split(' ')[0]}`}>
                        <Icon size={24} className={plan.color.split('text-')[1]} />
                     </div>
                  </div>
                  
                  <div className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-4xl font-extrabold tracking-tight">R$ {plan.price}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Cobrança recorrente via Stripe</p>

                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex">
                        <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                        <span className="ml-3 text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onSelectPlan(plan.role, billing)}
                  className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium text-white shadow-sm transition-colors ${plan.btnColor}`}
                >
                  Assinar Agora
                </button>
              </div>
            );
          })}
        </div>

        {/* Enterprise / Institution */}
        <div className="mt-10 max-w-4xl mx-auto bg-slate-900 rounded-2xl shadow-xl overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:self-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Instituições e Escritórios</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-legal-200">
                Soluções personalizadas com licenças em volume, integração LMS (Moodle/Canvas) e suporte dedicado.
              </p>
              <a href="#" className="mt-8 bg-white border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-legal-900 hover:bg-legal-50">
                Falar com Vendas
              </a>
            </div>
          </div>
          <div className="-mt-6 aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1 opacity-50 lg:opacity-100 relative">
              <Building className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-legal-700" size={120} />
          </div>
        </div>
        
        <div className="mt-8 text-center">
           <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 text-sm font-medium">
             Continuar com plano Gratuito (Limitado)
           </button>
        </div>
      </div>
    </div>
  );
};