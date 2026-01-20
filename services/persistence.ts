
import { ChatMessage, User, Scenario, Classroom, StudentReport, CourtRole, UserPerformance, ClassChatMessage } from '../types';
import { SCENARIOS } from '../constants';

const KEYS = {
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
  saveSession: (user: User, remember: boolean) => {
    try {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) { console.error("Storage error", e); }
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

  trackExerciseTime: (userId: string, minutes: number) => {
    try {
      const perf = persistenceService.getUserPerformance(userId);
      perf.totalExerciseTime += minutes;
      localStorage.setItem(`${KEYS.PERFORMANCE}${userId}`, JSON.stringify(perf));
    } catch (e) { console.error(e); }
  },

  trackScenarioStart: (scenarioId: string) => {
    try {
      const stats = JSON.parse(localStorage.getItem(KEYS.SCENARIO_STATS) || '{}');
      stats[scenarioId] = (stats[scenarioId] || 0) + 1;
      localStorage.setItem(KEYS.SCENARIO_STATS, JSON.stringify(stats));
    } catch (e) { console.error(e); }
  },

  updatePerformanceStats: (userId: string, report: StudentReport) => {
    try {
      const perf = persistenceService.getUserPerformance(userId);
      const n = perf.totalSimulations;
      perf.avgOratory = (perf.avgOratory * n + report.technicalAnalysis.rhetoric) / (n + 1);
      perf.avgProcedural = (perf.avgProcedural * n + report.technicalAnalysis.procedure) / (n + 1);
      perf.avgEvidence = (perf.avgEvidence * n + report.technicalAnalysis.evidenceHandling) / (n + 1);
      perf.totalSimulations += 1;
      localStorage.setItem(`${KEYS.PERFORMANCE}${userId}`, JSON.stringify(perf));
    } catch (e) { console.error(e); }
  },

  getUserPerformance: (userId: string): UserPerformance => {
    const stored = localStorage.getItem(`${KEYS.PERFORMANCE}${userId}`);
    if (stored) return JSON.parse(stored);
    
    return {
      userId,
      userName: 'Usuário',
      totalExerciseTime: 0,
      avgOratory: 0,
      avgProcedural: 0,
      avgEvidence: 0,
      totalSimulations: 0
    };
  },

  getGlobalRankings: (): UserPerformance[] => {
    const rankings: UserPerformance[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(KEYS.PERFORMANCE)) {
          rankings.push(JSON.parse(localStorage.getItem(key)!));
        }
      }
    } catch(e) {}

    // Mock data para preencher se vazio
    if (rankings.length < 3) {
      const mocks = [
        { userId: 'm1', userName: 'Dra. Beatriz Santos', totalExerciseTime: 850, avgOratory: 94, avgProcedural: 88, avgEvidence: 92, totalSimulations: 45 },
        { userId: 'm2', userName: 'Dr. Marcos Oliveira', totalExerciseTime: 620, avgOratory: 85, avgProcedural: 91, avgEvidence: 84, totalSimulations: 32 },
        { userId: 'm3', userName: 'Dra. Julia Costa', totalExerciseTime: 410, avgOratory: 78, avgProcedural: 72, avgEvidence: 95, totalSimulations: 18 }
      ];
      mocks.forEach(m => {
        if (!rankings.find(r => r.userId === m.userId)) rankings.push(m);
      });
    }
    return rankings.sort((a, b) => 
      ((b.avgOratory + b.avgProcedural + b.avgEvidence)/3) - 
      ((a.avgOratory + a.avgProcedural + a.avgEvidence)/3)
    );
  },

  getScenarioStats: () => {
    return JSON.parse(localStorage.getItem(KEYS.SCENARIO_STATS) || '{}');
  },

  getClassrooms: (userId: string): Classroom[] => {
    const stored = localStorage.getItem(KEYS.CLASSROOMS);
    const allClasses: Classroom[] = stored ? JSON.parse(stored) : [];
    return allClasses.filter(c => c.instructorId === userId || (c.studentIds && c.studentIds.includes(userId)));
  },

  saveClassroom: (classroom: Classroom) => {
    try {
      const stored = localStorage.getItem(KEYS.CLASSROOMS);
      const current: Classroom[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify([...current, classroom]));
    } catch (e) { }
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
    const history = persistenceService.getClassChat(classId);
    const newHistory = [...history, message].slice(-50);
    localStorage.setItem(`${KEYS.CLASS_CHAT}${classId}`, JSON.stringify(newHistory));
  },

  getClassChat: (classId: string): ClassChatMessage[] => {
    const stored = localStorage.getItem(`${KEYS.CLASS_CHAT}${classId}`);
    return stored ? JSON.parse(stored) : [];
  },

  getCustomScenarios: (userId: string): Scenario[] => {
    const stored = localStorage.getItem(`${KEYS.CUSTOM_SCENARIOS}${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  getScenarioById: (userId: string, scenarioId: string): Scenario | undefined => {
    const native = SCENARIOS.find(s => s.id === scenarioId);
    if (native) return native;
    return persistenceService.getCustomScenarios(userId).find(s => s.id === scenarioId);
  },

  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => {
    localStorage.setItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`, progress.toString());
  },

  getScenarioProgress: (userId: string, scenarioId: string): number => {
    const stored = localStorage.getItem(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`);
    return stored ? parseInt(stored, 10) : 0;
  },

  saveStudentReport: (report: StudentReport) => {
    const reports = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
    localStorage.setItem(KEYS.REPORTS, JSON.stringify([...reports, report]));
    persistenceService.updatePerformanceStats(report.studentId, report);
  },

  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => {
    localStorage.setItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`, JSON.stringify(messages));
  },

  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => {
    const stored = localStorage.getItem(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`);
    return stored ? JSON.parse(stored) : null;
  },

  saveRoomHistory: (userId: string, entry: RoomHistoryEntry) => {
    const history = persistenceService.getRoomHistory(userId);
    const filtered = history.filter(h => h.roomId !== entry.roomId);
    const newHistory = [entry, ...filtered].slice(0, 10);
    localStorage.setItem(`${KEYS.ROOM_HISTORY}${userId}`, JSON.stringify(newHistory));
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

  resetAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};
