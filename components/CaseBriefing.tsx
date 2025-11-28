import React from 'react';
import { Scenario } from '../types';
import { FileText, ArrowRight, ArrowLeft, Shield, AlertCircle, Users, Target, BookOpen } from 'lucide-react';

interface CaseBriefingProps {
  scenario: Scenario;
  onStart: () => void;
  onBack: () => void;
}

export const CaseBriefing: React.FC<CaseBriefingProps> = ({ scenario, onStart, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header Processual */}
      <div className="bg-legal-900 text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-legal-300 hover:text-white mb-4 text-sm transition">
            <ArrowLeft size={16}/> Voltar para Biblioteca
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="bg-accent-gold text-legal-900 text-xs font-bold px-2 py-0.5 rounded uppercase">Autos Digitais</span>
                   <span className="text-legal-400 text-xs font-mono">Proc. nº {scenario.id.split('-')[0] || '001'}.2024.8.26.0100</span>
                </div>
                <h1 className="text-3xl font-serif font-bold">{scenario.title}</h1>
                <p className="text-legal-300 text-sm mt-1">{scenario.area} • {scenario.difficulty}</p>
             </div>
             <button 
                onClick={onStart} 
                className="bg-accent-gold text-legal-900 px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition shadow-lg flex items-center gap-2 animate-pulse"
             >
                Iniciar Audiência <ArrowRight size={20}/>
             </button>
          </div>
        </div>
      </div>

      {/* Conteúdo dos Autos */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
         
         {/* Coluna Principal: Fatos e Provas */}
         <div className="md:col-span-2 space-y-6 animate-in slide-in-from-left-4 duration-500">
            
            {/* Cartão de Fatos */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-legal-200 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
               <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BookOpen className="text-blue-500"/> Resumo dos Fatos
               </h2>
               <p className="text-gray-600 leading-relaxed text-justify">
                  {scenario.facts || scenario.description}
               </p>
            </div>

            {/* Cartão de Provas */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-legal-200 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
               <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="text-amber-500"/> Provas Anexadas
               </h2>
               {scenario.evidence && scenario.evidence.length > 0 ? (
                  <ul className="space-y-3">
                     {scenario.evidence.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
                              <span className="text-xs font-bold text-slate-400">DOC.{idx+1}</span>
                           </div>
                           <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                     ))}
                  </ul>
               ) : (
                  <p className="text-gray-400 italic">Nenhuma prova documental cadastrada.</p>
               )}
            </div>

         </div>

         {/* Coluna Lateral: Estratégia e Partes */}
         <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            
            {/* Objetivos */}
            <div className="bg-legal-50 p-6 rounded-xl border border-legal-100">
               <h3 className="font-bold text-legal-800 mb-3 flex items-center gap-2">
                  <Target size={18}/> Objetivos da Defesa
               </h3>
               <ul className="space-y-2">
                  {scenario.objectives ? scenario.objectives.map((obj, i) => (
                     <li key={i} className="flex items-start gap-2 text-sm text-legal-700">
                        <CheckCircleIcon className="shrink-0 mt-0.5 text-legal-500" size={14}/>
                        {obj}
                     </li>
                  )) : (
                     <li className="text-sm text-gray-500">Realizar a instrução e obter êxito na causa.</li>
                  )}
               </ul>
            </div>

            {/* Testemunhas */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={18}/> Rol de Testemunhas
               </h3>
               <ul className="space-y-3">
                  {scenario.witnesses ? scenario.witnesses.map((wit, i) => (
                     <li key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                           {i+1}
                        </div>
                        <span className="text-sm text-gray-700">{wit}</span>
                     </li>
                  )) : (
                     <li className="text-sm text-gray-400 italic">Sem testemunhas arroladas.</li>
                  )}
               </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-xs flex gap-2">
               <AlertCircle size={32} className="shrink-0"/>
               <p>
                  <strong>Dica do Instrutor:</strong> Revise bem as datas e contradições nos depoimentos. O Juiz IA pode questionar detalhes específicos dos fatos.
               </p>
            </div>

         </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = ({className, size}: any) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
