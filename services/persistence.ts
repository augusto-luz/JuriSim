import { ChatMessage, User, Scenario } from '../types';
import { SCENARIOS, MOCK_USER } from '../constants';

const KEYS = {
  USER: 'jurisim_user',
  SESSION: 'jurisim_session', // Stores API Key and Auth State
  CHAT_HISTORY: 'jurisim_chat_',
  SCENARIO_PROGRESS: 'jurisim_progress_',
  CUSTOM_SCENARIOS: 'jurisim_custom_scenarios_', // New key for user created cases
};

export const persistenceService = {
  // --- Session Management ---
  saveSession: (apiKey: string, user: User, remember: boolean) => {
    try {
        const storage = remember ? localStorage : sessionStorage;
        
        // Simple obfuscation to prevent casual shoulder-surfing. 
        const sessionData = {
          key: btoa(apiKey),
          timestamp: Date.now()
        };
        
        // Clear other storage to prevent sync issues
        if (remember) {
            sessionStorage.removeItem(KEYS.SESSION);
            sessionStorage.removeItem(KEYS.USER);
        } else {
            localStorage.removeItem(KEYS.SESSION);
            localStorage.removeItem(KEYS.USER);
        }
    
        storage.setItem(KEYS.SESSION, JSON.stringify(sessionData));
        storage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
        console.error("Storage limit reached or access denied", e);
    }
  },

  restoreSession: (): { apiKey: string, user: User } | null => {
    try {
      // Check SessionStorage first (active tab), then LocalStorage
      let sessionStored = sessionStorage.getItem(KEYS.SESSION);
      let userStored = sessionStorage.getItem(KEYS.USER);

      if (!sessionStored || !userStored) {
         sessionStored = localStorage.getItem(KEYS.SESSION);
         userStored = localStorage.getItem(KEYS.USER);
      }

      if (sessionStored && userStored) {
        const session = JSON.parse(sessionStored);
        const user = JSON.parse(userStored);
        
        // Decode key with safe check
        let apiKey = '';
        if (session.key) {
            try {
                apiKey = atob(session.key);
            } catch {
                console.warn("Invalid API key format in storage");
            }
        }
        
        // Basic validation
        if (user && user.id) {
          return { apiKey, user };
        }
      }
    } catch (e) {
      console.error("Failed to restore session", e);
      persistenceService.clearSession();
    }
    return null;
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.SESSION);
    sessionStorage.removeItem(KEYS.USER);
  },

  // --- User Data ---
  getUser: (): User => {
    try {
        const stored = localStorage.getItem(KEYS.USER) || sessionStorage.getItem(KEYS.USER);
        return stored ? JSON.parse(stored) : MOCK_USER;
    } catch {
        return MOCK_USER;
    }
  },
  
  // --- Chat History (Per User & Scenario) ---
  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => {
    try {
        const stored = localStorage.getItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`);
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  },

  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => {
    try {
        localStorage.setItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`, JSON.stringify(messages));
    } catch (e) { console.error("Quota exceeded", e); }
  },

  clearChatHistory: (userId: string, scenarioId: string) => {
    localStorage.removeItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`);
  },

  // --- Scenario Progress (Per User) ---
  getScenarioProgress: (userId: string, scenarioId: string): number => {
    try {
        const stored = localStorage.getItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`);
        if (stored) return parseInt(stored, 10);
        // Fallback to constants if not found locally
        const constantScenario = SCENARIOS.find(s => s.id === scenarioId);
        return constantScenario ? constantScenario.progress : 0;
    } catch { return 0; }
  },

  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => {
    localStorage.setItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`, progress.toString());
  },

  // --- Custom Scenarios Management ---
  getCustomScenarios: (userId: string): Scenario[] => {
    try {
        const stored = localStorage.getItem(`${KEYS.CUSTOM_SCENARIOS}${userId}`);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  },

  saveCustomScenario: (userId: string, scenario: Scenario) => {
    try {
        const current = persistenceService.getCustomScenarios(userId);
        const updated = [...current, scenario];
        localStorage.setItem(`${KEYS.CUSTOM_SCENARIOS}${userId}`, JSON.stringify(updated));
    } catch (e) { alert("Erro ao salvar cenário. Armazenamento cheio."); }
  },

  deleteCustomScenario: (userId: string, scenarioId: string) => {
    const current = persistenceService.getCustomScenarios(userId);
    const updated = current.filter(s => s.id !== scenarioId);
    localStorage.setItem(`${KEYS.CUSTOM_SCENARIOS}${userId}`, JSON.stringify(updated));
  },

  // --- Helper: Get Any Scenario (Native or Custom) ---
  getScenarioById: (userId: string, scenarioId: string): Scenario | undefined => {
    // 1. Try Native
    const native = SCENARIOS.find(s => s.id === scenarioId);
    if (native) return native;

    // 2. Try Custom
    const customScenarios = persistenceService.getCustomScenarios(userId);
    return customScenarios.find(s => s.id === scenarioId);
  },

  // --- Helpers ---
  resetAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};