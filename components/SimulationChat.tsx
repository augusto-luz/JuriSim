import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Scenario } from '../types';
import { generateCharacterResponse } from '../services/geminiService';
import { persistenceService } from '../services/persistence';
import { SYSTEM_PROMPTS } from '../constants';
import { Send, User as UserIcon, Bot, ArrowLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface SimulationChatProps {
  scenario: Scenario;
  onExit: () => void;
  apiKey: string;
}

export const SimulationChat: React.FC<SimulationChatProps> = ({ scenario, onExit, apiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Try to load from persistence first
    const saved = persistenceService.getChatHistory(scenario.id);
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: '0',
        role: 'model',
        senderName: 'Juiz',
        text: `Bom dia a todos. Estamos reunidos para a audiência do processo "${scenario.title}". Doutor(a), pode iniciar suas alegações iniciais.`,
        timestamp: Date.now()
      }
    ];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-save whenever messages change
  useEffect(() => {
    persistenceService.saveChatHistory(scenario.id, messages);
    
    // Also update "progress" slightly just to show interactivity
    if (messages.length > 2) {
      persistenceService.saveScenarioProgress(scenario.id, Math.min(100, messages.length * 5));
    }
  }, [messages, scenario.id]);

  useEffect(() => {
    if (scrollRef.current) {
        // Use scrollIntoView on the last element for robust scrolling
        const lastChild = scrollRef.current.lastElementChild;
        if (lastChild) {
            lastChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !apiKey) return;
    if (isLoading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      senderName: 'Advogado (Você)',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      let activeCharacter = 'Juiz';
      let prompt = SYSTEM_PROMPTS.JUDGE;
      const lowerInput = inputValue.toLowerCase();
      if (lowerInput.includes('defesa') || lowerInput.includes('promotor')) {
        activeCharacter = 'Advogado da Parte Contrária';
        prompt = SYSTEM_PROMPTS.OPPOSING_COUNSEL;
      }

      const historyForAI = [...messages, userMsg];
      const responseText = await generateCharacterResponse(activeCharacter, prompt, historyForAI, inputValue);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        senderName: activeCharacter,
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setError("Erro de comunicação com a IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if(confirm("Deseja reiniciar esta simulação? O histórico será perdido.")) {
      persistenceService.clearChatHistory(scenario.id);
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        senderName: 'Juiz',
        text: `Bom dia. Vamos reiniciar a audiência do processo "${scenario.title}".`,
        timestamp: Date.now()
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full transition text-gray-600"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{scenario.title}</h2>
            <div className="flex items-center space-x-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <p className="text-xs text-gray-500 font-medium">Gemini 2.5 Flash • Ativo</p>
            </div>
          </div>
        </div>
        <button onClick={handleReset} className="text-sm px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-2 font-medium transition">
           <RefreshCw size={16} /> Reiniciar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${isUser ? 'bg-legal-800 ml-3 text-white' : 'bg-white mr-3 text-legal-600'}`}>
                  {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>
                <div>
                  <div className={`text-xs text-gray-400 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>{msg.senderName}</div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isUser ? 'bg-legal-700 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
           <div className="flex items-center gap-2 text-gray-400 text-sm ml-12 animate-pulse">
              <Bot size={16}/> O Juiz está analisando...
           </div>
        )}
        {error && <div className="text-center text-red-500 bg-red-50 p-2 rounded text-sm mx-auto max-w-md">{error}</div>}
      </div>

      <div className="bg-white border-t p-4 md:p-6 z-20">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            placeholder="Digite sua argumentação..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-legal-500 outline-none resize-none h-[60px]"
          />
          <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="w-[60px] bg-legal-800 text-white rounded-xl flex items-center justify-center hover:bg-legal-700 disabled:opacity-50 transition shadow-lg">
            {isLoading ? <Loader2 className="animate-spin"/> : <Send/>}
          </button>
        </div>
      </div>
    </div>
  );
};