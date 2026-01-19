
import { ChatMessage, User, Scenario, Classroom, StudentReport } from '../types';
import { SCENARIOS, MOCK_USER } from '../constants';

const KEYS = {
  USER: 'jurisim_user',
  SESSION: 'jurisim_session',
  CHAT_HISTORY: 'jurisim_chat_',
  SCENARIO_PROGRESS: 'jurisim_progress_',
  CUSTOM_SCENARIOS: 'jurisim_custom_scenarios_',
  CLASSROOMS: 'jurisim_classrooms_',
  REPORTS: 'jurisim_reports_',
};

export const persistenceService = {
  saveSession: (user: User, remember: boolean) => {
    try {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) { console.error("Storage limit reached", e); }
  },

  restoreSession: (): User | null => {
    try {
      let userStored = sessionStorage.getItem(KEYS.USER) || localStorage.getItem(KEYS.USER);
      if (userStored) return JSON.parse(userStored);
    } catch (e) { }
    return null;
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.USER);
  },

  // --- Scenarios ---
  getCustomScenarios: (userId: string): Scenario[] => {
    try {
        const stored = localStorage.getItem(`${KEYS.CUSTOM_SCENARIOS}${userId}`);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  },

  saveCustomScenario: (userId: string, scenario: Scenario) => {
    const current = persistenceService.getCustomScenarios(userId);
    localStorage.setItem(`${KEYS.CUSTOM_SCENARIOS}${userId}`, JSON.stringify([...current, scenario]));
  },

  getScenarioProgress: (userId: string, scenarioId: string): number => {
    const stored = localStorage.getItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`);
    return stored ? parseInt(stored, 10) : 0;
  },

  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => {
    localStorage.setItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`, progress.toString());
  },

  // --- LMS (Classrooms & Reports) ---
  getClassrooms: (userId: string): Classroom[] => {
    const stored = localStorage.getItem(`${KEYS.CLASSROOMS}${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  saveClassroom: (classroom: Classroom) => {
    const current = persistenceService.getClassrooms(classroom.instructorId);
    localStorage.setItem(`${KEYS.CLASSROOMS}${classroom.instructorId}`, JSON.stringify([...current, classroom]));
  },

  joinClassroom: (userId: string, inviteCode: string): boolean => {
    // Procura em todos os registros de turmas de todos os instrutores (simulado para local)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(KEYS.CLASSROOMS)) {
        const classes: Classroom[] = JSON.parse(localStorage.getItem(key) || '[]');
        const target = classes.find(c => c.inviteCode === inviteCode);
        if (target) {
          if (!target.studentIds.includes(userId)) {
            target.studentIds.push(userId);
            localStorage.setItem(key, JSON.stringify(classes));
          }
          return true;
        }
      }
    }
    return false;
  },

  saveStudentReport: (report: StudentReport) => {
    const reports = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
    localStorage.setItem(KEYS.REPORTS, JSON.stringify([...reports, report]));
  },

  getReportsByStudent: (studentId: string): StudentReport[] => {
    const reports = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
    return reports.filter((r: StudentReport) => r.studentId === studentId);
  },

  getReportsByClass: (studentIds: string[]): StudentReport[] => {
    const reports = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
    return reports.filter((r: StudentReport) => studentIds.includes(r.studentId));
  },

  // --- Generic ---
  getScenarioById: (userId: string, scenarioId: string): Scenario | undefined => {
    const native = SCENARIOS.find(s => s.id === scenarioId);
    if (native) return native;
    return persistenceService.getCustomScenarios(userId).find(s => s.id === scenarioId);
  },

  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => {
    const stored = localStorage.getItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`);
    return stored ? JSON.parse(stored) : null;
  },

  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => {
    localStorage.setItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`, JSON.stringify(messages));
  },

  resetAll: () => {
    const prefixes = Object.values(KEYS);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some(p => key.startsWith(p))) {
        localStorage.removeItem(key);
        i--;
      }
    }
    sessionStorage.clear();
  }
};
