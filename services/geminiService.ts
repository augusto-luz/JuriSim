
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, StudentReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCharacterResponse = async (
  characterName: string,
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  try {
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
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return response.text || "(O tribunal permanece em silêncio)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "O Magistrado não pôde processar sua solicitação no momento.";
  }
};

export const generateLegalEvaluation = async (
  messages: ChatMessage[],
  scenarioTitle: string
): Promise<any> => {
  try {
    const chatTranscript = messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise a seguinte transcrição de audiência simulada para o caso "${scenarioTitle}":\n\n${chatTranscript}`,
      config: {
        systemInstruction: "Você é um Corregedor de Justiça avaliando o desempenho de um advogado em uma simulação. Seja rigoroso e técnico.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Nota de 0 a 100" },
            feedback: { type: Type.STRING, description: "Feedback qualitativo curto" },
            rhetoric: { type: Type.NUMBER, description: "Nota de 0 a 100 para oratória" },
            procedure: { type: Type.NUMBER, description: "Nota de 0 a 100 para rito processual" },
            evidence: { type: Type.NUMBER, description: "Nota de 0 a 100 para uso de provas" }
          },
          required: ["score", "feedback", "rhetoric", "procedure", "evidence"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Evaluation Error:", error);
    return { score: 70, feedback: "Análise automática indisponível.", rhetoric: 70, procedure: 70, evidence: 70 };
  }
};
