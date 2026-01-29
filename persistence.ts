
import { ChatMessage, User, Scenario, StudentReport, UserPerformance } from './types';
import { SCENARIOS } from './constants';
import { databaseService } from './database';

const DB_VERSION = '3.0-prod';
const KEYS = {
  USER: 'jurisim_user',
  CACHE_USERS: 'jurisim_cache_users',
  PERF_PREFIX: 'jurisim_performance_'
};

export const persistenceService = {
  _init: () => {
    localStorage.setItem('jurisim_version', DB_VERSION);
  },

  saveSession: (user: User, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(KEYS.USER, JSON.stringify(user));
    databaseService.upsertProfile(user).catch(err => console.error('Sync error:', err));
  },

  restoreSession: (): User | null => {
    const stored = sessionStorage.getItem(KEYS.USER) || localStorage.getItem(KEYS.USER);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.USER);
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await databaseService.getAllProfiles();
      localStorage.setItem(KEYS.CACHE_USERS, JSON.stringify(users));
      return users;
    } catch {
      const cached = localStorage.getItem(KEYS.CACHE_USERS);
      return cached ? JSON.parse(cached) : [];
    }
  },

  /**
   * Salva alterações globais (como autorização de instrutor)
   * Liberado de imediato via banco de dados.
   */
  async saveUserGlobally(user: User) {
    await databaseService.upsertProfile(user);
    // Força atualização do cache de usuários
    await this.getAllUsers();
  },

  async deleteUser(userId: string) {
    await databaseService.deleteProfile(userId);
    localStorage.removeItem(`${KEYS.PERF_PREFIX}${userId}`);
  },

  async saveStudentReport(report: StudentReport) {
    await databaseService.saveReport(report);
    this.updatePerformanceStats(report.studentId, report);
  },

  async getReportsByStudent(studentId: string): Promise<StudentReport[]> {
    return await databaseService.getReportsByStudent(studentId);
  },

  async getCustomScenarios(): Promise<Scenario[]> {
    return await databaseService.getCustomScenarios();
  },

  async saveCustomScenario(scenario: Scenario) {
    await databaseService.saveScenario(scenario);
  },

  // --- Helpers Locais (Síncronos para UI Responsiva) ---
  getUserPerformance: (userId: string, userName?: string): UserPerformance => {
    const key = `${KEYS.PERF_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    if (!data) {
      return { 
        userId, 
        userName: userName || 'Usuário', 
        totalExerciseTime: 0, 
        avgOratory: 0, 
        avgProcedural: 0, 
        avgEvidence: 0, 
        totalSimulations: 0 
      };
    }
    return JSON.parse(data);
  },

  updatePerformanceStats: (userId: string, report: StudentReport) => {
    const perf = persistenceService.getUserPerformance(userId, report.studentName);
    const n = perf.totalSimulations;
    perf.avgOratory = Math.round((perf.avgOratory * n + report.technicalAnalysis.rhetoric) / (n + 1));
    perf.avgProcedural = Math.round((perf.avgProcedural * n + report.technicalAnalysis.procedure) / (n + 1));
    perf.avgEvidence = Math.round((perf.avgEvidence * n + report.technicalAnalysis.evidenceHandling) / (n + 1));
    perf.totalSimulations += 1;
    localStorage.setItem(`${KEYS.PERF_PREFIX}${userId}`, JSON.stringify(perf));
  },

  getGlobalRankings: (): UserPerformance[] => {
    const rankings: UserPerformance[] = [];
    const users = JSON.parse(localStorage.getItem(KEYS.CACHE_USERS) || '[]');
    users.forEach((u: User) => {
      const p = localStorage.getItem(`${KEYS.PERF_PREFIX}${u.id}`);
      if (p) rankings.push(JSON.parse(p));
    });
    return rankings.sort((a, b) => (b.avgOratory + b.avgProcedural + b.avgEvidence) - (a.avgOratory + a.avgProcedural + a.avgEvidence));
  },

  getScenarioById: (userId: string, scenarioId: string): Scenario | null => {
    return SCENARIOS.find(s => s.id === scenarioId) || null;
  },

  trackExerciseTime: (userId: string, minutes: number) => {
    const perf = persistenceService.getUserPerformance(userId);
    perf.totalExerciseTime += minutes;
    localStorage.setItem(`${KEYS.PERF_PREFIX}${userId}`, JSON.stringify(perf));
  },

  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => {
    localStorage.setItem(`jurisim_progress_${userId}_${scenarioId}`, JSON.stringify(progress));
  },

  getScenarioProgress: (userId: string, scenarioId: string): number => {
    const data = localStorage.getItem(`jurisim_progress_${userId}_${scenarioId}`);
    return data ? JSON.parse(data) : 0;
  },

  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => {
    localStorage.setItem(`jurisim_chat_${userId}_${scenarioId}`, JSON.stringify(messages));
  },

  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => {
    const data = localStorage.getItem(`jurisim_chat_${userId}_${scenarioId}`);
    return data ? JSON.parse(data) : null;
  },

  saveRoomHistory: (userId: string, entry: any) => {
    const history = JSON.parse(localStorage.getItem(`jurisim_room_history_${userId}`) || '[]');
    localStorage.setItem(`jurisim_room_history_${userId}`, JSON.stringify([entry, ...history].slice(0, 10)));
  },

  getRoomHistory: (userId: string): any[] => {
    return JSON.parse(localStorage.getItem(`jurisim_room_history_${userId}`) || '[]');
  },

  getRoleForRoom: (userId: string, roomId: string): any => {
    const history = persistenceService.getRoomHistory(userId);
    const entry = history.find(h => h.roomId === roomId);
    return entry ? entry.role : null;
  },

  resetAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

persistenceService._init();
