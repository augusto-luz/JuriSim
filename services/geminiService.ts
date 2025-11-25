import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

let aiClient: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string) => {
  aiClient = new GoogleGenAI({ apiKey });
};

export const generateCharacterResponse = async (
  characterName: string,
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  if (!aiClient) throw new Error("API Key not initialized");

  try {
    // Construct the prompt with history context
    const context = history.map(h => `${h.senderName}: ${h.text}`).join('\n');
    const prompt = `${context}\nUser: ${userMessage}\n\nResponda como ${characterName}. Mantenha a personagem.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "(Sem resposta)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar resposta da IA. Verifique sua chave API.";
  }
};