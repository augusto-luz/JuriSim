
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, StudentReport } from "../types";

const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateCharacterResponse = async (
  characterName: string,
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const historyFormatted = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: `${h.senderName}: ${h.text}` }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...historyFormatted.slice(-10),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    return response.text || "(O tribunal permanece em silêncio)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro na conexão com o Tribunal Virtual. Por favor, tente novamente.";
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
        systemInstruction: "Você é um Corregedor de Justiça avaliando o desempenho técnico de um advogado. Retorne APENAS um objeto JSON válido.",
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2048 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            rhetoric: { type: Type.NUMBER },
            procedure: { type: Type.NUMBER },
            evidence: { type: Type.NUMBER }
          },
          required: ["score", "feedback", "rhetoric", "procedure", "evidence"]
        }
      }
    });

    const result = cleanJsonResponse(response.text);
    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Evaluation Error:", error);
    return { 
      score: 50, 
      feedback: "Falha técnica na geração do relatório. Tente uma sessão mais longa.", 
      rhetoric: 50, 
      procedure: 50, 
      evidence: 50 
    };
  }
};
