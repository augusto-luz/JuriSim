
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, StudentReport } from "../types";

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
 * Gera a resposta dos personagens da audiência (Juiz e Parte Contrária)
 */
export const generateCharacterResponse = async (
  characterName: string,
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  try {
    // Inicializa o cliente dentro da função para garantir o uso da chave correta no deploy
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const historyFormatted: any[] = [];
    let lastRole = '';

    // Filtra e formata o histórico para os requisitos da API (deve começar com 'user')
    // Pegamos as últimas 15 mensagens para manter contexto sem exceder limites
    const recentHistory = history.slice(-15);

    for (const h of recentHistory) {
      const role = h.role === 'user' ? 'user' : 'model';
      
      // A API do Gemini exige que o primeiro turno seja do usuário
      if (historyFormatted.length === 0 && role === 'model') continue;

      // Agrupa mensagens consecutivas do mesmo papel para evitar erro de alternância
      if (role === lastRole) {
        historyFormatted[historyFormatted.length - 1].parts[0].text += `\n${h.senderName}: ${h.text}`;
      } else {
        historyFormatted.push({
          role,
          parts: [{ text: `${h.senderName}: ${h.text}` }]
        });
        lastRole = role;
      }
    }

    // Se a última mensagem do histórico não for do usuário, adicionamos a mensagem atual do usuário
    // Caso contrário, a mensagem atual já está no histórico (dependendo de como o App a envia)
    // No JuriSim, SimulationChat já inclui o userMsg no histórico passado por parâmetro.

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: historyFormatted,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 4096 } // Orçamento para raciocínio jurídico complexo
      }
    });

    return response.text || "(O tribunal permanece em silêncio)";
  } catch (error) {
    console.error("Gemini character response failed:", error);
    return "Ocorreu um erro na conexão com o Tribunal Virtual. Por favor, verifique sua conexão ou tente novamente em instantes.";
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chatTranscript = messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise detalhadamente a seguinte transcrição de audiência simulada para o caso "${scenarioTitle}" e avalie o desempenho técnico do advogado:\n\n${chatTranscript}`,
      config: {
        systemInstruction: "Você é um Corregedor de Justiça experiente. Sua função é avaliar a retórica, o conhecimento procedimental e a gestão de provas do advogado. Retorne APENAS um objeto JSON válido, sem markdown ou textos explicativos fora do JSON.",
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2048 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Pontuação global de 0 a 100" },
            feedback: { type: Type.STRING, description: "Feedback qualitativo e construtivo" },
            rhetoric: { type: Type.NUMBER, description: "Nota de oratória (0-100)" },
            procedure: { type: Type.NUMBER, description: "Nota de conhecimento processual (0-100)" },
            evidence: { type: Type.NUMBER, description: "Nota de manejo de provas (0-100)" }
          },
          required: ["score", "feedback", "rhetoric", "procedure", "evidence"]
        }
      }
    });

    const result = cleanJsonResponse(response.text);
    return JSON.parse(result || "{}");
  } catch (error) {
    console.error("Legal evaluation generation failed:", error);
    return { 
      score: 50, 
      feedback: "Houve um atraso no processamento do seu relatório técnico. O histórico foi salvo e poderá ser avaliado manualmente pelo seu instrutor.", 
      rhetoric: 50, 
      procedure: 50, 
      evidence: 50 
    };
  }
};
