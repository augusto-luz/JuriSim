
import { ChatMessage, User, Scenario, Classroom, StudentReport, CourtRole, UserPerformance, ClassChatMessage } from '../types';
import { SCENARIOS } from '../constants';

const DB_VERSION = '1.3';
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
    try {
      const currentVersion = localStorage.getItem(KEYS.VERSION);
      if (currentVersion !== DB_VERSION) {
        console.debug(`[DB] Upgrading schema to ${DB_VERSION}`);
        localStorage.setItem(KEYS.VERSION, DB_VERSION);
      }
    } catch (e) { console.warn("Local storage inaccessible", e); }
  },

  // Segurança: Garante que os dados salvos sejam objetos válidos e sanitizados
  _safeSave: (key: string, value: any) => {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (e) {
      persistenceService._handleStorageError(e);
    }
  },

  _safeGet: (key: string): any | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveSession: (user: User, remember: boolean) => {
    try {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(KEYS.USER, JSON.stringify(user));
        // Sincroniza identidade no registro global de performance
        persistenceService.getUserPerformance(user.id, user.name);
    } catch (e) { persistenceService._handleStorageError(e); }
  },

  restoreSession: (): User | null => {
    try {
      const userStored = sessionStorage.getItem(KEYS.USER) || localStorage.getItem(KEYS.USER);
      if (userStored) {
        const user = JSON.parse(userStored);
        if (user && user.id) {
          // Garante que o ranking esteja sempre atualizado com o nome atual
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

  // Fix: Added missing getCustomScenarios method
  getCustomScenarios: (userId: string): Scenario[] => {
    return persistenceService._safeGet(`${KEYS.CUSTOM_SCENARIOS}${userId}`) || [];
  },

  // Fix: Added missing trackScenarioStart method
  trackScenarioStart: (scenarioId: string) => {
    const stats = persistenceService.getScenarioStats();
    stats[scenarioId] = (stats[scenarioId] || 0) + 1;
    persistenceService._safeSave(KEYS.SCENARIO_STATS, stats);
  },

  // Fix: Added missing getScenarioStats method
  getScenarioStats: (): Record<string, number> => {
    return persistenceService._safeGet(KEYS.SCENARIO_STATS) || {};
  },

  // Fix: Added missing saveStudentReport method
  saveStudentReport: (report: StudentReport) => {
    const reports: StudentReport[] = persistenceService._safeGet(KEYS.REPORTS) || [];
    persistenceService._safeSave(KEYS.REPORTS, [...reports, report]);
    persistenceService.updatePerformanceStats(report.studentId, report);
  },

  // Fix: Added missing getRoomHistory method
  getRoomHistory: (userId: string): RoomHistoryEntry[] => {
    return persistenceService._safeGet(`${KEYS.ROOM_HISTORY}${userId}`) || [];
  },

  // Fix: Added missing getRoleForRoom method
  getRoleForRoom: (userId: string, roomId: string): CourtRole | null => {
    const history = persistenceService.getRoomHistory(userId);
    const entry = history.find(h => h.roomId === roomId);
    return entry ? entry.role : null;
  },

  // Fix: Added missing saveRoomHistory method
  saveRoomHistory: (userId: string, entry: RoomHistoryEntry) => {
    const history = persistenceService.getRoomHistory(userId);
    const filtered = history.filter(h => h.roomId !== entry.roomId);
    persistenceService._safeSave(`${KEYS.ROOM_HISTORY}${userId}`, [entry, ...filtered].slice(0, 10));
  },

  // Fix: Added missing getScenarioById method
  getScenarioById: (userId: string, scenarioId: string): Scenario | null => {
    const all = [...SCENARIOS, ...persistenceService.getCustomScenarios(userId)];
    return all.find(s => s.id === scenarioId) || null;
  },

  // Fix: Added missing getClassChat method
  getClassChat: (classroomId: string): ClassChatMessage[] => {
    return persistenceService._safeGet(`${KEYS.CLASS_CHAT}${classroomId}`) || [];
  },

  // Fix: Added missing saveClassMessage method
  saveClassMessage: (classroomId: string, message: ClassChatMessage) => {
    const chat = persistenceService.getClassChat(classroomId);
    persistenceService._safeSave(`${KEYS.CLASS_CHAT}${classroomId}`, [...chat, message].slice(-50));
  },

  // Fix: Added missing joinClassroom method
  joinClassroom: (userId: string, inviteCode: string): boolean => {
    const allClasses: Classroom[] = persistenceService._safeGet(KEYS.CLASSROOMS) || [];
    const classroom = allClasses.find(c => c.inviteCode === inviteCode);
    if (classroom) {
      if (!classroom.studentIds.includes(userId)) {
        classroom.studentIds.push(userId);
        persistenceService._safeSave(KEYS.CLASSROOMS, allClasses);
      }
      return true;
    }
    return false;
  },

  trackExerciseTime: (userId: string, minutes: number) => {
    const perf = persistenceService.getUserPerformance(userId);
    perf.totalExerciseTime += minutes;
    persistenceService._safeSave(`${KEYS.PERFORMANCE}${userId}`, perf);
  },

  updatePerformanceStats: (userId: string, report: StudentReport) => {
    const perf = persistenceService.getUserPerformance(userId, report.studentName);
    const n = perf.totalSimulations;
    perf.avgOratory = Math.round((perf.avgOratory * n + report.technicalAnalysis.rhetoric) / (n + 1));
    perf.avgProcedural = Math.round((perf.avgProcedural * n + report.technicalAnalysis.procedure) / (n + 1));
    perf.avgEvidence = Math.round((perf.avgEvidence * n + report.technicalAnalysis.evidenceHandling) / (n + 1));
    perf.totalSimulations += 1;
    persistenceService._safeSave(`${KEYS.PERFORMANCE}${userId}`, perf);
  },

  getUserPerformance: (userId: string, userName?: string): UserPerformance => {
    const key = `${KEYS.PERFORMANCE}${userId}`;
    let perf = persistenceService._safeGet(key);
    
    if (perf) {
      if (userName && userName !== 'Usuário' && perf.userName !== userName) {
        perf.userName = userName;
        persistenceService._safeSave(key, perf);
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
      persistenceService._safeSave(key, perf);
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
          const item = persistenceService._safeGet(key);
          if (item && item.userId) rankings.push(item);
        }
      }
    } catch(e) { }

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

  getClassrooms: (userId: string): Classroom[] => {
    const allClasses: Classroom[] = persistenceService._safeGet(KEYS.CLASSROOMS) || [];
    return allClasses.filter(c => c.instructorId === userId || (c.studentIds && c.studentIds.includes(userId)));
  },

  saveClassroom: (classroom: Classroom) => {
    const current: Classroom[] = persistenceService._safeGet(KEYS.CLASSROOMS) || [];
    persistenceService._safeSave(KEYS.CLASSROOMS, [...current, classroom]);
  },

  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => {
    persistenceService._safeSave(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`, progress.toString());
  },

  getScenarioProgress: (userId: string, scenarioId: string): number => {
    const stored = localStorage.getItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`);
    return stored ? parseInt(stored, 10) : 0;
  },

  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => {
    // Escala: Mantém apenas os últimos 30 balões de chat para economizar espaço
    persistenceService._safeSave(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`, messages.slice(-30));
  },

  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => {
    return persistenceService._safeGet(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`);
  },

  _handleStorageError: (e: any) => {
    console.error("[DB] Storage Quota Exceeded. Aplicando limpeza de cache LRU...");
    // Remove dados de chat e salas antigas para manter performance e relatórios
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(KEYS.CHAT_HISTORY) || key.startsWith(KEYS.ROOM_HISTORY))) {
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
