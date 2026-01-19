
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
    return [{ id: '0', role: 'model', senderName: 'Sistema', text: `[JUIZ]: Audiência aberta. Proc. n. ${scenario.id}. Doutor(a) ${user.name}, pode iniciar.`, timestamp: Date.now() }];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [report, setReport] = useState<StudentReport | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistenceService.saveChatHistory(user.id, scenario.id, messages);
    if (messages.length > 2) persistenceService.saveScenarioProgress(user.id, scenario.id, Math.min(99, messages.length * 4));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
    } catch (err) { } finally { setIsLoading(false); }
  };

  const finalizeHearing = async () => {
    if (messages.length < 3) {
      alert("A audiência é muito curta para uma avaliação técnica.");
      return;
    }
    
    setIsFinishing(true);
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
      alert("Erro ao gerar relatório. Tente novamente.");
    } finally { setIsFinishing(false); }
  };

  if (report) return (
    <div className="h-full bg-slate-50 flex items-center justify-center p-6 animate-in zoom-in-95">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-legal-100">
         <div className="p-10 text-center bg-legal-900 text-white">
            <div className="w-20 h-20 bg-accent-gold rounded-full flex items-center justify-center mx-auto mb-4 text-legal-900 shadow-lg"><CheckCircle2 size={40}/></div>
            <h2 className="text-3xl font-serif font-bold">Relatório Concluído</h2>
            <p className="text-legal-400 mt-2">Sua performance foi analisada pelo Corregedor Virtual.</p>
         </div>
         <div className="p-10 space-y-6">
            <div className="flex justify-between items-end border-b pb-4">
               <div><p className="text-xs font-bold text-slate-400 uppercase">Score Geral</p><p className="text-5xl font-black text-legal-900">{report.score}<span className="text-lg text-slate-300">/100</span></p></div>
               <div className="text-right"><p className="text-xs font-bold text-slate-400 uppercase">Resultado</p><p className={`text-lg font-bold ${report.score >= 70 ? 'text-green-600' : 'text-amber-600'}`}>{report.score >= 70 ? 'APROVADO' : 'REVISÃO'}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
               <SkillMetric label="Retórica" val={report.technicalAnalysis.rhetoric} />
               <SkillMetric label="Rito" val={report.technicalAnalysis.procedure} />
               <SkillMetric label="Provas" val={report.technicalAnalysis.evidenceHandling} />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border italic text-sm text-slate-600">"{report.feedback}"</div>
            <button onClick={onExit} className="w-full py-4 bg-legal-900 text-white rounded-xl font-bold hover:bg-accent-gold hover:text-legal-900 transition">Voltar ao Painel</button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full transition text-gray-600"><ArrowLeft size={20}/></button>
          <div><h2 className="font-bold text-gray-900 text-sm md:text-lg">{scenario.title}</h2><p className="text-[10px] text-green-500 font-bold flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> AUDIÊNCIA EM CURSO</p></div>
        </div>
        <div className="flex gap-2">
           <button onClick={finalizeHearing} disabled={isFinishing || messages.length < 3} className="px-4 py-2 bg-legal-900 text-white hover:bg-accent-gold hover:text-legal-900 rounded-xl text-xs font-bold transition flex items-center gap-2">{isFinishing ? <Loader2 className="animate-spin" size={14}/> : <Gavel size={14}/>} Finalizar e Avaliar</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`flex max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${msg.role === 'user' ? 'bg-legal-800 ml-3 text-white' : 'bg-white mr-3 text-legal-600'}`}>
                 {msg.role === 'user' ? <UserIcon size={16}/> : <Scale size={16}/>}
               </div>
               <div className={`p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-legal-800 text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-slate-800'}`}>
                  {msg.role === 'model' ? renderLegalContent(msg.text) : msg.text}
               </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2 ml-12 animate-pulse uppercase"><Bot size={14}/> O Magistrado está analisando...</div>}
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea value={inputValue} onChange={e=>setInputValue(e.target.value)} onKeyDown={e=>e.key==='Enter' && !e.shiftKey && handleSendMessage()} placeholder="Argumente perante o tribunal..." className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 outline-none resize-none h-[60px] text-sm" />
          <button onClick={handleSendMessage} className="w-[60px] bg-legal-900 text-white rounded-xl flex items-center justify-center hover:bg-accent-gold hover:text-legal-900 transition"><Send size={20}/></button>
        </div>
      </div>
    </div>
  );
};

const SkillMetric = ({ label, val }: any) => (
  <div className="text-center">
     <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</div>
     <div className="text-xl font-bold text-legal-900">{val}%</div>
     <div className="w-full bg-slate-100 h-1 rounded-full mt-1"><div className="bg-legal-800 h-1 rounded-full" style={{width:`${val}%`}}/></div>
  </div>
);

const renderLegalContent = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.includes('[JUIZ]')) return <div key={i} className="mb-2 bg-slate-50 border-l-4 border-legal-900 p-2 text-xs italic">{line}</div>;
    if (line.includes('[PARTE')) return <div key={i} className="mb-2 bg-red-50 border-l-4 border-red-500 p-2 text-xs italic">{line}</div>;
    return <div key={i}>{line}</div>;
  });
};
