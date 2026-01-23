
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Scenario, User, StudentReport } from '../types';
import { generateCharacterResponse, generateLegalEvaluation } from '../services/geminiService';
import { persistenceService } from '../services/persistence';
import { DYNAMIC_HEARING_PROMPT } from '../constants';
import { Send, User as UserIcon, Bot, ArrowLeft, Loader2, Scale, CheckCircle2, Gavel } from 'lucide-react';

interface SimulationChatProps {
  scenario: Scenario;
  onExit: () => void;
  user: User;
}

export const SimulationChat: React.FC<SimulationChatProps> = ({ scenario, onExit, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = persistenceService.getChatHistory(user.id, scenario.id);
    if (saved && saved.length > 0) return saved;
    return [{ id: '0', role: 'model', senderName: 'Sistema', text: `[JUIZ]: Audiência aberta. Proc. n. ${scenario.id}. Doutor(a) ${user.name}, pode iniciar sua sustentação ou requerimentos.`, timestamp: Date.now() }];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [startTime] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistenceService.trackScenarioStart(scenario.id);
  }, []);

  useEffect(() => {
    persistenceService.saveChatHistory(user.id, scenario.id, messages);
    if (messages.length > 2) {
      persistenceService.saveScenarioProgress(user.id, scenario.id, Math.min(95, messages.length * 5));
    }
  }, [messages, user.id, scenario.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', senderName: user.name, text: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const caseContext = `AUTOS: ${scenario.facts}\nPROVAS: ${scenario.evidence.join(', ')}\nTESTEMUNHAS: ${scenario.witnesses.join(', ')}`;
      const systemPrompt = `${DYNAMIC_HEARING_PROMPT}\n\n${caseContext}`;
      const responseText = await generateCharacterResponse('Tribunal', systemPrompt, [...messages, userMsg], inputValue);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'model', senderName: 'Tribunal', text: responseText, timestamp: Date.now() }]);
    } catch (err) { 
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const finalizeHearing = async () => {
    if (messages.length < 3) {
      alert("Realize ao menos algumas interações antes de finalizar.");
      return;
    }
    
    setIsFinishing(true);
    const exerciseMinutes = Math.floor((Date.now() - startTime) / 60000);
    persistenceService.trackExerciseTime(user.id, Math.max(1, exerciseMinutes));

    try {
      const evaluation = await generateLegalEvaluation(messages, scenario.title);
      const finalReport: StudentReport = {
        id: `rep_${Date.now()}`,
        studentId: user.id,
        studentName: user.name,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        score: evaluation.score,
        feedback: evaluation.feedback,
        technicalAnalysis: { 
          rhetoric: evaluation.rhetoric, 
          procedure: evaluation.procedure, 
          evidenceHandling: evaluation.evidence 
        },
        timestamp: Date.now()
      };
      
      persistenceService.saveStudentReport(finalReport);
      persistenceService.saveScenarioProgress(user.id, scenario.id, 100);
      setReport(finalReport);
    } catch (e) {
      alert("Houve um problema ao processar seu relatório. Verifique sua conexão.");
    } finally { 
      setIsFinishing(false); 
    }
  };

  if (report) return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-[100] animate-in zoom-in-95">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-legal-100 max-h-[95vh] flex flex-col">
         <div className="p-8 text-center bg-legal-900 text-white shrink-0">
            <div className="w-16 h-16 bg-accent-gold rounded-full flex items-center justify-center mx-auto mb-4 text-legal-900 shadow-lg"><CheckCircle2 size={32}/></div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold">Relatório de Sessão</h2>
            <p className="text-legal-400 mt-2 text-sm">Análise baseada no desempenho processual.</p>
         </div>
         <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex justify-between items-end border-b pb-4">
               <div><p className="text-[10px] font-black text-slate-400 uppercase">Pontuação Técnica</p><p className="text-5xl font-black text-legal-900">{report.score}<span className="text-lg text-slate-300">/100</span></p></div>
               <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Status</p><p className={`text-lg font-bold ${report.score >= 70 ? 'text-green-600' : 'text-amber-600'}`}>{report.score >= 70 ? 'APROVADO' : 'PENDENTE'}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <SkillMetric label="Oratória" val={report.technicalAnalysis.rhetoric} />
               <SkillMetric label="Procedimento" val={report.technicalAnalysis.procedure} />
               <SkillMetric label="Argumentação" val={report.technicalAnalysis.evidenceHandling} />
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-sm text-slate-600 leading-relaxed">
               "{report.feedback}"
            </div>
         </div>
         <div className="p-8 border-t shrink-0">
            <button onClick={onExit} className="w-full py-4 bg-legal-900 text-white rounded-xl font-bold hover:bg-accent-gold hover:text-legal-900 transition shadow-lg">Retornar ao Painel</button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100 z-50">
      {/* Header Fixo */}
      <div className="bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full transition text-gray-600 shrink-0"><ArrowLeft size={20}/></button>
          <div className="truncate">
             <h2 className="font-bold text-gray-900 text-sm md:text-base truncate">{scenario.title}</h2>
             <p className="text-[10px] text-green-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> AUDIÊNCIA ATIVA</p>
          </div>
        </div>
        <button onClick={finalizeHearing} disabled={isFinishing || messages.length < 3} className="px-3 md:px-4 py-2 bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900 rounded-xl text-[10px] md:text-xs font-bold transition flex items-center gap-2 shrink-0">
           {isFinishing ? <Loader2 className="animate-spin" size={14}/> : <Gavel size={14}/>} 
           <span className="hidden sm:inline">Finalizar Sessão</span>
        </button>
      </div>

      {/* Corpo do Chat */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-[#f8fafc]" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`flex max-w-[95%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${msg.role === 'user' ? 'bg-legal-900 ml-2 text-white shadow-md' : 'bg-white mr-2 text-legal-600 shadow-sm'}`}>
                 {msg.role === 'user' ? <UserIcon size={16}/> : <Scale size={16}/>}
               </div>
               <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-legal-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none text-slate-800'}`}>
                  {msg.role === 'model' ? renderLegalContent(msg.text) : msg.text}
               </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 ml-10 animate-pulse">
             <div className="w-8 h-1.5 bg-slate-200 rounded-full"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aguardando Resposta...</span>
          </div>
        )}
      </div>

      {/* Input de Texto Fixo na base */}
      <div className="bg-white border-t p-4 pb-6 md:pb-4 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] shrink-0">
        <div className="max-w-4xl mx-auto flex gap-2 md:gap-3 items-end">
          <textarea 
             value={inputValue} 
             onChange={e=>setInputValue(e.target.value)} 
             onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey && !isLoading) { e.preventDefault(); handleSendMessage(); }}} 
             placeholder="Escreva sua manifestação..." 
             className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none resize-none max-h-32 min-h-[52px] text-sm focus:border-accent-gold transition-colors" 
          />
          <button 
             onClick={handleSendMessage} 
             disabled={!inputValue.trim() || isLoading}
             className="w-12 h-12 md:w-14 md:h-14 bg-legal-900 text-white rounded-2xl flex items-center justify-center hover:bg-accent-gold hover:text-legal-900 transition-all shadow-lg disabled:opacity-50 disabled:grayscale"
          >
             <Send size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
};

const SkillMetric = ({ label, val }: any) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
     <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">{label}</div>
     <div className="text-xl font-black text-legal-900">{val}%</div>
     <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
        <div className="bg-legal-900 h-1 rounded-full transition-all duration-1000" style={{width:`${val}%`}}/>
     </div>
  </div>
);

const renderLegalContent = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('[JUIZ]')) {
      return <div key={i} className="mb-3 bg-slate-50 border-l-4 border-legal-900 p-3 rounded-r-xl text-xs font-medium italic text-legal-800 shadow-sm">{line}</div>;
    }
    if (line.startsWith('[PARTE')) {
      return <div key={i} className="mb-3 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl text-xs font-medium italic text-red-900 shadow-sm">{line}</div>;
    }
    return <div key={i} className="mb-2 last:mb-0">{line}</div>;
  });
};
