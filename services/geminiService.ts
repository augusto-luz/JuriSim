
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, StudentReport } from "../types";

export const generateCharacterResponse = async (
  characterName: string,
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  try {
    // Inicialização dentro da função para garantir o uso da API_KEY atualizada
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const historyFormatted = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: `${h.senderName}: ${h.text}` }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...historyFormatted.slice(-12),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        // Adicionando um pequeno budget de pensamento para respostas mais jurídicas
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    return response.text || "(O tribunal permanece em silêncio)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro na conexão com o Tribunal Virtual. Por favor, verifique sua conexão ou tente novamente.";
  }
};

export const generateLegalEvaluation = async (
  messages: ChatMessage[],
  scenarioTitle: string
): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chatTranscript = messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise a seguinte transcrição de audiência simulada para o caso "${scenarioTitle}":\n\n${chatTranscript}`,
      config: {
        systemInstruction: "Você é um Corregedor de Justiça altamente rigoroso avaliando o desempenho de um advogado. Analise técnica processual, oratória e uso de provas.",
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2048 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Nota de 0 a 100" },
            feedback: { type: Type.STRING, description: "Feedback qualitativo técnico e direto" },
            rhetoric: { type: Type.NUMBER, description: "Nota de 0 a 100 para oratória" },
            procedure: { type: Type.NUMBER, description: "Nota de 0 a 100 para rito processual" },
            evidence: { type: Type.NUMBER, description: "Nota de 0 a 100 para uso de provas" }
          },
          required: ["score", "feedback", "rhetoric", "procedure", "evidence"]
        }
      }
    });

    const result = response.text;
    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Evaluation Error:", error);
    return { 
      score: 0, 
      feedback: "Erro crítico na análise. A audiência pode ter sido muito curta ou conter conteúdo inadequado.", 
      rhetoric: 0, 
      procedure: 0, 
      evidence: 0 
    };
  }
};
