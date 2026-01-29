
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, StudentReport } from "../types.ts";

/**
 * Limpa a resposta do modelo para garantir que apenas o JSON seja processado
 */
const cleanJsonResponse = (text: string): string => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}') + 1;
  if (start !== -1 && end > start) {
    return text.substring(start, end);
  }
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Helper para obter a chave de API de forma segura
 */
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env?.API_KEY) || "";
  } catch {
    return "";
  }
};

/**
 * Gera a resposta dos personagens da audiência (Juiz e Parte Contrária)
 */
export const generateCharacterResponse = async (
  characterName: string,
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const historyFormatted: any[] = [];
    let lastRole = '';

    const recentHistory = history.slice(-10);

    for (const h of recentHistory) {
      const role = h.role === 'user' ? 'user' : 'model';
      
      if (historyFormatted.length === 0 && role === 'model') continue;

      if (role === lastRole && historyFormatted.length > 0) {
        historyFormatted[historyFormatted.length - 1].parts[0].text += `\n${h.senderName}: ${h.text}`;
      } else {
        historyFormatted.push({
          role,
          parts: [{ text: `${h.senderName}: ${h.text}` }]
        });
        lastRole = role;
      }
    }

    if (historyFormatted.length === 0) {
      historyFormatted.push({
        role: 'user',
        parts: [{ text: userMessage || "Início da manifestação" }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: historyFormatted,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.9,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "(O tribunal aguarda sua manifestação)";
  } catch (error) {
    console.error("Gemini connection error details:", error);
    return "Ocorreu um erro na conexão com o Tribunal Virtual. O sistema de IA está sendo reiniciado. Por favor, tente enviar sua mensagem novamente em 5 segundos.";
  }
};

/**
 * Gera avaliação técnica do desempenho do usuário após a audiência
 */
export const generateLegalEvaluation = async (
  messages: ChatMessage[],
  scenarioTitle: string
): Promise<any> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const chatTranscript = messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise detalhadamente a seguinte transcrição de audiência simulada para o caso "${scenarioTitle}" e avalie o desempenho técnico do advogado:\n\n${chatTranscript}`,
      config: {
        systemInstruction: "Você é um Corregedor de Justiça experiente. Sua função é avaliar a retórica, o conhecimento procedimental e a gestão de provas do advogado. Retorne APENAS um objeto JSON válido.",
        responseMimeType: "application/json",
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
    console.error("Legal evaluation failed:", error);
    return { 
      score: 0, 
      feedback: "Erro ao processar relatório técnico automático.", 
      rhetoric: 0, 
      procedure: 0, 
      evidence: 0 
    };
  }
};
