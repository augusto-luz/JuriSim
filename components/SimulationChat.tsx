
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Scenario, User, StudentReport } from '../types.ts';
import { generateCharacterResponse, generateLegalEvaluation } from '../services/geminiService.ts';
import { persistenceService } from '../services/persistence.ts';
import { DYNAMIC_HEARING_PROMPT } from '../constants.ts';
import { Send, User as UserIcon, ArrowLeft, Loader2, Scale, CheckCircle2, Gavel } from 'lucide-react';

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

  const isStudyMode = persistenceService.getScenarioProgress(user.id, scenario.id) === 100;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isStudyMode) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', senderName: user.name, text: inputValue, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const caseContext = `AUTOS: ${scenario.facts}\nPROVAS: ${scenario.evidence.join(', ')}\nTESTEMUNHAS: ${scenario.witnesses.join(', ')}`;
      const systemPrompt = `${DYNAMIC_HEARING_PROMPT}\n\n${caseContext}`;
      const responseText = await generateCharacterResponse('Tribunal', systemPrompt, newMessages, inputValue);
      const botMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', senderName: 'Tribunal', text: responseText, timestamp: Date.now() };
      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      persistenceService.saveChatHistory(user.id, scenario.id, finalMessages);
      persistenceService.saveScenarioProgress(user.id, scenario.id, Math.min(95, finalMessages.length * 5));
    } catch (err) { 
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const finalizeHearing = async () => {
    if (messages.length < 3 || isStudyMode) return;
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
      alert("Erro ao processar relatório.");
    } finally { setIsFinishing(false); }
  };

  const renderLegalContent = (text: string) => {
    const parseBold = (str: string) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-black text-legal-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    return text.split('\n').map((line, i) => {
      if (line.startsWith('[JUIZ]')) {
        return <div key={i} className="mb-3 bg-slate-50 border-l-4 border-legal-900 p-3 rounded-r-xl text-xs font-medium italic text-legal-800 shadow-sm break-words">{parseBold(line)}</div>;
      }
      if (line.startsWith('[PARTE')) {
        return <div key={i} className="mb-3 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl text-xs font-medium italic text-red-900 shadow-sm break-words">{parseBold(line)}</div>;
      }
      return <div key={i} className="mb-2 last:mb-0 break-words">{parseBold(line)}</div>;
    });
  };

  if (report) return (
    <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-4 z-[100] animate-in zoom-in-95">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-legal-100 p-8 text-center">
         <div className="w-16 h-16 bg-accent-gold rounded-full flex items-center justify-center mx-auto mb-4 text-legal-900 shadow-lg"><CheckCircle2 size={32}/></div>
         <h2 className="text-2xl font-serif font-bold">Audiência Protocolada</h2>
         <p className="text-slate-500 mt-2 mb-8">Seu desempenho foi registrado e o histórico está disponível para estudo na aba "Meus Casos".</p>
         <button onClick={onExit} className="w-full py-4 bg-legal-900 text-white rounded-xl font-bold hover:bg-accent-gold hover:text-legal-900 transition">Retornar ao Painel</button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden">
      <div className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-3 truncate">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full transition text-gray-600"><ArrowLeft size={18}/></button>
          <div className="truncate">
             <h2 className="font-bold text-gray-900 text-xs md:text-sm truncate leading-tight">{scenario.title}</h2>
             <p className="text-[9px] text-green-600 font-bold flex items-center gap-1">
                {isStudyMode ? 'MODO DE ESTUDO' : 'AUDIÊNCIA ATIVA'}
             </p>
          </div>
        </div>
        {!isStudyMode && (
          <button onClick={finalizeHearing} disabled={isFinishing || messages.length < 3} className="px-3 py-1.5 md:px-4 md:py-2 bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-2 whitespace-nowrap">
             {isFinishing ? <Loader2 className="animate-spin" size={14}/> : <Gavel size={14}/>} Finalizar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#f8fafc]" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`flex max-w-[92%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border ${msg.role === 'user' ? 'bg-legal-900 ml-2 text-white' : 'bg-white mr-2 text-legal-600 shadow-sm'}`}>
                 {msg.role === 'user' ? <UserIcon size={14}/> : <Scale size={14}/>}
               </div>
               <div className={`p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm break-words overflow-hidden ${msg.role === 'user' ? 'bg-legal-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none text-slate-800'}`}>
                  {msg.role === 'model' ? renderLegalContent(msg.text) : msg.text}
               </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="ml-9 text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">O Tribunal está deliberando...</div>}
      </div>

      {!isStudyMode && (
        <div className="bg-white border-t p-3 md:p-4 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] shrink-0">
          <div className="max-w-4xl mx-auto flex gap-2 md:gap-3">
            <textarea 
               value={inputValue} 
               onChange={e=>setInputValue(e.target.value)} 
               onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}} 
               placeholder="Escreva sua manifestação..." 
               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 outline-none resize-none h-12 md:h-14 text-xs md:text-sm focus:border-accent-gold transition-colors" 
            />
            <button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="w-12 md:w-14 h-12 md:h-14 bg-legal-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-accent-gold hover:text-legal-900 transition-all shadow-lg disabled:opacity-50 shrink-0">
               <Send size={18} className="md:w-5 md:h-5"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
