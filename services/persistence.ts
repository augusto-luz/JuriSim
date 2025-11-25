import { ChatMessage, User, Scenario, UserRole } from '../types';
import { SCENARIOS, MOCK_USER } from '../constants';

const KEYS = {
  USER: 'jurisim_user',
  SESSION: 'jurisim_session', // Stores API Key and Auth State
  CHAT_HISTORY: 'jurisim_chat_',
  SCENARIO_PROGRESS: 'jurisim_progress_',
  APP_SETTINGS: 'jurisim_settings'
};

export const persistenceService = {
  // --- Session Management ---
  saveSession: (apiKey: string, user: User) => {
    // Simple obfuscation to prevent casual shoulder-surfing. 
    // In a real app, never store raw API keys in localStorage without backend encryption.
    const sessionData = {
      key: btoa(apiKey),
      timestamp: Date.now()
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionData));
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  restoreSession: (): { apiKey: string, user: User } | null => {
    try {
      const sessionStored = localStorage.getItem(KEYS.SESSION);
      const userStored = localStorage.getItem(KEYS.USER);

      if (sessionStored && userStored) {
        const session = JSON.parse(sessionStored);
        const user = JSON.parse(userStored);
        
        // Decode key
        const apiKey = atob(session.key);
        
        // Basic validation
        if (apiKey && user && user.id) {
          return { apiKey, user };
        }
      }
    } catch (e) {
      console.error("Failed to restore session", e);
      localStorage.removeItem(KEYS.SESSION);
    }
    return null;
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.USER);
  },

  // --- User Data ---
  getUser: (): User => {
    const stored = localStorage.getItem(KEYS.USER);
    return stored ? JSON.parse(stored) : MOCK_USER;
  },
  
  // --- Chat History (Per Scenario) ---
  getChatHistory: (scenarioId: string): ChatMessage[] | null => {
    const stored = localStorage.getItem(`${KEYS.CHAT_HISTORY}${scenarioId}`);
    return stored ? JSON.parse(stored) : null;
  },

  saveChatHistory: (scenarioId: string, messages: ChatMessage[]) => {
    localStorage.setItem(`${KEYS.CHAT_HISTORY}${scenarioId}`, JSON.stringify(messages));
  },

  clearChatHistory: (scenarioId: string) => {
    localStorage.removeItem(`${KEYS.CHAT_HISTORY}${scenarioId}`);
  },

  // --- Scenario Progress ---
  getScenarioProgress: (scenarioId: string): number => {
    const stored = localStorage.getItem(`${KEYS.SCENARIO_PROGRESS}${scenarioId}`);
    if (stored) return parseInt(stored, 10);
    // Fallback to constants if not found locally
    const constantScenario = SCENARIOS.find(s => s.id === scenarioId);
    return constantScenario ? constantScenario.progress : 0;
  },

  saveScenarioProgress: (scenarioId: string, progress: number) => {
    localStorage.setItem(`${KEYS.SCENARIO_PROGRESS}${scenarioId}`, progress.toString());
  },

  // --- Helpers ---
  resetAll: () => {
    localStorage.clear();
  }
};