
import { ChatMessage, User, Scenario, Classroom, StudentReport, CourtRole, UserPerformance, ClassChatMessage } from '../types';
import { SCENARIOS } from '../constants';

const DB_VERSION = '1.2';
const KEYS = {
  VERSION: 'jurisim_db_v',
  USER: 'jurisim_user',
  SESSION: 'jurisim_session',
  CHAT_HISTORY: 'jurisim_chat_',
  SCENARIO_PROGRESS: 'jurisim_progress_',
  CUSTOM_SCENARIOS: 'jurisim_custom_scenarios_',
  CLASSROOMS: 'jurisim_classrooms_',
  REPORTS: 'jurisim_reports_',
  ROOM_HISTORY: 'jurisim_room_history_',
  PERFORMANCE: 'jurisim_performance_',
  CLASS_CHAT: 'jurisim_class_chat_',
  SCENARIO_STATS: 'jurisim_scenario_stats_'
};

export interface RoomHistoryEntry {
  roomId: string;
  role: CourtRole;
  title: string;
  timestamp: number;
}

export const persistenceService = {
  _init: () => {
    const currentVersion = localStorage.getItem(KEYS.VERSION);
    if (currentVersion !== DB_VERSION) {
      console.warn(`[DB] Migrando banco de dados de ${currentVersion} para ${DB_VERSION}`);
      // Poderia haver lógica de migração aqui; por enquanto apenas marca a versão
      localStorage.setItem(KEYS.VERSION, DB_VERSION);
    }
  },

  saveSession: (user: User, remember: boolean) => {
    try {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(KEYS.USER, JSON.stringify(user));
        persistenceService.getUserPerformance(user.id, user.name);
    } catch (e) { persistenceService._handleStorageError(e); }
  },

  restoreSession: (): User | null => {
    try {
      const userStored = sessionStorage.getItem(KEYS.USER) || localStorage.getItem(KEYS.USER);
      if (userStored) {
        const user = JSON.parse(userStored);
        if (user && user.id) {
          persistenceService.getUserPerformance(user.id, user.name);
          return user;
        }
      }
    } catch (e) { }
    return null;
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.USER);
  },

  trackExerciseTime: (userId: string, minutes: number) => {
    try {
      const perf = persistenceService.getUserPerformance(userId);
      perf.totalExerciseTime += minutes;
      localStorage.setItem(`${KEYS.PERFORMANCE}${userId}`, JSON.stringify(perf));
    } catch (e) { persistenceService._handleStorageError(e); }
  },

  trackScenarioStart: (scenarioId: string) => {
    try {
      const stats = JSON.parse(localStorage.getItem(KEYS.SCENARIO_STATS) || '{}');
      stats[scenarioId] = (stats[scenarioId] || 0) + 1;
      localStorage.setItem(KEYS.SCENARIO_STATS, JSON.stringify(stats));
    } catch (e) { }
  },

  updatePerformanceStats: (userId: string, report: StudentReport) => {
    try {
      const perf = persistenceService.getUserPerformance(userId, report.studentName);
      const n = perf.totalSimulations;
      perf.avgOratory = Math.round((perf.avgOratory * n + report.technicalAnalysis.rhetoric) / (n + 1));
      perf.avgProcedural = Math.round((perf.avgProcedural * n + report.technicalAnalysis.procedure) / (n + 1));
      perf.avgEvidence = Math.round((perf.avgEvidence * n + report.technicalAnalysis.evidenceHandling) / (n + 1));
      perf.totalSimulations += 1;
      localStorage.setItem(`${KEYS.PERFORMANCE}${userId}`, JSON.stringify(perf));
    } catch (e) { persistenceService._handleStorageError(e); }
  },

  getUserPerformance: (userId: string, userName?: string): UserPerformance => {
    const key = `${KEYS.PERFORMANCE}${userId}`;
    const stored = localStorage.getItem(key);
    let perf: UserPerformance;
    
    if (stored) {
      perf = JSON.parse(stored);
      // Sincronização rigorosa do nome logado
      if (userName && userName !== 'Usuário' && perf.userName !== userName) {
        perf.userName = userName;
        localStorage.setItem(key, JSON.stringify(perf));
      }
    } else {
      perf = {
        userId,
        userName: userName || 'Usuário',
        totalExerciseTime: 0,
        avgOratory: 0,
        avgProcedural: 0,
        avgEvidence: 0,
        totalSimulations: 0
      };
      localStorage.setItem(key, JSON.stringify(perf));
    }
    return perf;
  },

  getGlobalRankings: (currentUser?: User): UserPerformance[] => {
    const rankings: UserPerformance[] = [];
    try {
      if (currentUser) {
        persistenceService.getUserPerformance(currentUser.id, currentUser.name);
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(KEYS.PERFORMANCE)) {
          try {
            const item = JSON.parse(localStorage.getItem(key)!);
            if (item && item.userId) rankings.push(item);
          } catch (e) {}
        }
      }
    } catch(e) { }

    // Mock data resiliente
    if (rankings.length < 2) {
      const mocks = [
        { userId: 'm1', userName: 'Dra. Beatriz Santos', totalExerciseTime: 850, avgOratory: 94, avgProcedural: 88, avgEvidence: 92, totalSimulations: 45 },
        { userId: 'm2', userName: 'Dr. Marcos Oliveira', totalExerciseTime: 620, avgOratory: 85, avgProcedural: 91, avgEvidence: 84, totalSimulations: 32 }
      ];
      mocks.forEach(m => {
        if (!rankings.find(r => r.userId === m.userId)) rankings.push(m);
      });
    }

    return rankings.sort((a, b) => {
      const scoreA = (a.avgOratory + a.avgProcedural + a.avgEvidence) / 3;
      const scoreB = (b.avgOratory + b.avgProcedural + b.avgEvidence) / 3;
      return scoreB - scoreA;
    });
  },

  getScenarioStats: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.SCENARIO_STATS) || '{}');
    } catch (e) { return {}; }
  },

  getClassrooms: (userId: string): Classroom[] => {
    try {
      const stored = localStorage.getItem(KEYS.CLASSROOMS);
      const allClasses: Classroom[] = stored ? JSON.parse(stored) : [];
      return allClasses.filter(c => c.instructorId === userId || (c.studentIds && c.studentIds.includes(userId)));
    } catch (e) { return []; }
  },

  saveClassroom: (classroom: Classroom) => {
    try {
      const stored = localStorage.getItem(KEYS.CLASSROOMS);
      const current: Classroom[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify([...current, classroom]));
    } catch (e) { persistenceService._handleStorageError(e); }
  },

  joinClassroom: (userId: string, inviteCode: string): boolean => {
    try {
      const stored = localStorage.getItem(KEYS.CLASSROOMS);
      const classes: Classroom[] = stored ? JSON.parse(stored) : [];
      const targetIdx = classes.findIndex(c => c.inviteCode === inviteCode);
      
      if (targetIdx !== -1) {
        if (!classes[targetIdx].studentIds) classes[targetIdx].studentIds = [];
        if (!classes[targetIdx].studentIds.includes(userId)) {
          classes[targetIdx].studentIds.push(userId);
          localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(classes));
        }
        return true;
      }
    } catch (e) { }
    return false;
  },

  saveClassMessage: (classId: string, message: ClassChatMessage) => {
    try {
      const history = persistenceService.getClassChat(classId);
      const newHistory = [...history, message].slice(-50);
      localStorage.setItem(`${KEYS.CLASS_CHAT}${classId}`, JSON.stringify(newHistory));
    } catch (e) { }
  },

  getClassChat: (classId: string): ClassChatMessage[] => {
    try {
      const stored = localStorage.getItem(`${KEYS.CLASS_CHAT}${classId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  },

  getCustomScenarios: (userId: string): Scenario[] => {
    try {
      const stored = localStorage.getItem(`${KEYS.CUSTOM_SCENARIOS}${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  },

  getScenarioById: (userId: string, scenarioId: string): Scenario | undefined => {
    const native = SCENARIOS.find(s => s.id === scenarioId);
    if (native) return native;
    return persistenceService.getCustomScenarios(userId).find(s => s.id === scenarioId);
  },

  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => {
    try {
      localStorage.setItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`, progress.toString());
    } catch (e) {}
  },

  getScenarioProgress: (userId: string, scenarioId: string): number => {
    const stored = localStorage.getItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`);
    return stored ? parseInt(stored, 10) : 0;
  },

  saveStudentReport: (report: StudentReport) => {
    try {
      const reports = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
      const newReports = [...reports, report].slice(-50); // Mantém apenas os últimos 50 relatórios para performance
      localStorage.setItem(KEYS.REPORTS, JSON.stringify(newReports));
      persistenceService.updatePerformanceStats(report.studentId, report);
    } catch (e) { persistenceService._handleStorageError(e); }
  },

  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => {
    try {
      localStorage.setItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`, JSON.stringify(messages.slice(-30)));
    } catch (e) { persistenceService._handleStorageError(e); }
  },

  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => {
    const stored = localStorage.getItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`);
    return stored ? JSON.parse(stored) : null;
  },

  saveRoomHistory: (userId: string, entry: RoomHistoryEntry) => {
    try {
      const history = persistenceService.getRoomHistory(userId);
      const filtered = history.filter(h => h.roomId !== entry.roomId);
      const newHistory = [entry, ...filtered].slice(0, 10);
      localStorage.setItem(`${KEYS.ROOM_HISTORY}${userId}`, JSON.stringify(newHistory));
    } catch (e) { }
  },

  getRoomHistory: (userId: string): RoomHistoryEntry[] => {
    const stored = localStorage.getItem(`${KEYS.ROOM_HISTORY}${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  getRoleForRoom: (userId: string, roomId: string): CourtRole | null => {
    const history = persistenceService.getRoomHistory(userId);
    const entry = history.find(h => h.roomId === roomId);
    return entry ? entry.role : null;
  },

  _handleStorageError: (e: any) => {
    console.error("[DB] Storage Quota Exceeded. Limpando histórico antigo...");
    // Limpa metadados não essenciais se o disco encher
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(KEYS.CHAT_HISTORY) || key.startsWith(KEYS.CLASS_CHAT))) {
            localStorage.removeItem(key);
        }
    }
  },

  resetAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

persistenceService._init();
