
import { ChatMessage, User, Scenario, StudentReport, UserPerformance, SocialMessage, ClassRoom, RoomHistoryEntry } from '../types.ts';
import { SCENARIOS, MOCK_USER } from '../constants.ts';

const DB_VERSION = '4.0-offline';
const KEYS = {
  VERSION: 'jurisim_db_v',
  USER: 'jurisim_user',
  ALL_USERS: 'jurisim_all_users_list',
  CHAT_HISTORY: 'jurisim_chat_',
  SCENARIO_PROGRESS: 'jurisim_progress_',
  CUSTOM_SCENARIOS: 'jurisim_custom_scenarios',
  REPORTS: 'jurisim_reports',
  ROOM_HISTORY: 'jurisim_room_history_',
  PERFORMANCE: 'jurisim_performance_',
  SOCIAL_MESSAGES: 'jurisim_social_msg_',
  CLASS_MESSAGES: 'jurisim_class_msg_',
  FRIENDS: 'jurisim_friends_',
  CLASSES: 'jurisim_classes'
};

export const persistenceService = {
  _init: () => {
    try {
      const allUsers = persistenceService.getAllUsersSync();
      const adminExists = allUsers.find(u => u.email.toLowerCase() === MOCK_USER.email.toLowerCase());
      
      if (!adminExists) {
        allUsers.push(MOCK_USER);
        persistenceService._safeSave(KEYS.ALL_USERS, allUsers);
      } else {
        // Garante que os poderes de admin do Augusto estejam sempre atualizados no mock
        const index = allUsers.findIndex(u => u.email.toLowerCase() === MOCK_USER.email.toLowerCase());
        allUsers[index] = { ...allUsers[index], ...MOCK_USER };
        persistenceService._safeSave(KEYS.ALL_USERS, allUsers);
      }

      const currentVersion = localStorage.getItem(KEYS.VERSION);
      if (currentVersion !== DB_VERSION) {
        localStorage.setItem(KEYS.VERSION, DB_VERSION);
      }
    } catch (e) {
      console.warn("Falha na inicialização do DB Local:", e);
    }
  },

  _safeSave: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { }
  },

  _safeGet: (key: string): any | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  getAllUsersSync: (): User[] => {
    return persistenceService._safeGet(KEYS.ALL_USERS) || [];
  },

  async getAllUsers(): Promise<User[]> {
    return persistenceService.getAllUsersSync();
  },

  async saveUserGlobally(user: User) {
    const users = persistenceService.getAllUsersSync();
    const index = users.findIndex(u => 
      u.id === user.id || 
      u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (index !== -1) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    persistenceService._safeSave(KEYS.ALL_USERS, users);
  },

  async deleteUser(userId: string) {
    if (userId === 'ADMIN-MASTER') return;
    const users = persistenceService.getAllUsersSync().filter(u => u.id !== userId);
    persistenceService._safeSave(KEYS.ALL_USERS, users);
    localStorage.removeItem(`${KEYS.PERFORMANCE}${userId}`);
    localStorage.removeItem(`${KEYS.FRIENDS}${userId}`);
  },

  async saveStudentReport(report: StudentReport) {
    const reports = persistenceService.getAllReportsSync();
    persistenceService._safeSave(KEYS.REPORTS, [...reports, report]);
    persistenceService.updatePerformanceStats(report.studentId, report);
  },

  getAllReportsSync: (): StudentReport[] => {
    return persistenceService._safeGet(KEYS.REPORTS) || [];
  },

  async getAllReports(): Promise<StudentReport[]> {
    return persistenceService.getAllReportsSync();
  },

  async getReportsByStudent(studentId: string): Promise<StudentReport[]> {
    const all = persistenceService.getAllReportsSync();
    return all.filter(r => r.studentId === studentId);
  },

  async getCustomScenarios(): Promise<Scenario[]> {
    const all = persistenceService._safeGet(KEYS.CUSTOM_SCENARIOS) || [];
    return Array.isArray(all) ? all : [];
  },

  async saveCustomScenario(scenario: Scenario) {
    const all = await persistenceService.getCustomScenarios();
    const index = all.findIndex((s: Scenario) => s.id === scenario.id);
    if (index !== -1) all[index] = scenario;
    else all.push(scenario);
    persistenceService._safeSave(KEYS.CUSTOM_SCENARIOS, all);
  },

  async deleteCustomScenario(scenarioId: string) {
    const all = await persistenceService.getCustomScenarios();
    const filtered = all.filter((s: Scenario) => s.id !== scenarioId);
    persistenceService._safeSave(KEYS.CUSTOM_SCENARIOS, filtered);
  },

  saveSession: (user: User, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(KEYS.USER, JSON.stringify(user));
    persistenceService.saveUserGlobally(user);
  },

  restoreSession: (): User | null => {
    const userStored = sessionStorage.getItem(KEYS.USER) || localStorage.getItem(KEYS.USER);
    if (!userStored) return null;
    try {
      const sessionUser = JSON.parse(userStored);
      const allUsers = persistenceService.getAllUsersSync();
      return allUsers.find(u => u.id === sessionUser.id) || null;
    } catch (e) { return null; }
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.USER);
  },

  getUserPerformance: (userId: string, userName?: string): UserPerformance => {
    // Fixed: Corrected PERF_PREFIX to PERFORMANCE
    const key = `${KEYS.PERFORMANCE}${userId}`;
    let perf = persistenceService._safeGet(key);
    if (!perf) {
      perf = { userId, userName: userName || 'Usuário', totalExerciseTime: 0, avgOratory: 0, avgProcedural: 0, avgEvidence: 0, totalSimulations: 0 };
      persistenceService._safeSave(key, perf);
    }
    return perf;
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

  getGlobalRankings: (): UserPerformance[] => {
    const rankings: UserPerformance[] = [];
    const users = persistenceService.getAllUsersSync();
    users.forEach(u => {
        const p = persistenceService._safeGet(`${KEYS.PERFORMANCE}${u.id}`);
        if(p) rankings.push(p);
    });
    return rankings.sort((a, b) => (b.avgOratory + b.avgProcedural + b.avgEvidence) - (a.avgOratory + a.avgProcedural + a.avgEvidence));
  },

  getScenarioById: (userId: string, scenarioId: string): Scenario | null => {
    const custom = persistenceService._safeGet(KEYS.CUSTOM_SCENARIOS) || [];
    const all = [...SCENARIOS, ...custom];
    return all.find(s => s.id === scenarioId) || null;
  },

  trackExerciseTime: (userId: string, minutes: number) => {
    const perf = persistenceService.getUserPerformance(userId);
    perf.totalExerciseTime += minutes;
    // Fixed: Corrected PERF_PREFIX to PERFORMANCE
    persistenceService._safeSave(`${KEYS.PERFORMANCE}${userId}`, perf);
  },

  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => {
    persistenceService._safeSave(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`, progress);
  },

  getScenarioProgress: (userId: string, scenarioId: string): number => {
    return persistenceService._safeGet(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`) || 0;
  },

  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => {
    persistenceService._safeSave(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`, messages);
  },

  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => {
    return persistenceService._safeGet(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`);
  },

  saveRoomHistory: (userId: string, entry: RoomHistoryEntry) => {
    const history = persistenceService.getRoomHistory(userId);
    const filtered = history.filter((h: any) => h.roomId !== entry.roomId);
    persistenceService._safeSave(`${KEYS.ROOM_HISTORY}${userId}`, [entry, ...filtered].slice(0, 10));
  },

  getRoomHistory: (userId: string): RoomHistoryEntry[] => {
    return persistenceService._safeGet(`${KEYS.ROOM_HISTORY}${userId}`) || [];
  },

  getSocialMessages: (userId: string, friendId: string): SocialMessage[] => {
    const chatKey = [userId, friendId].sort().join('_');
    return persistenceService._safeGet(`${KEYS.SOCIAL_MESSAGES}${chatKey}`) || [];
  },

  saveSocialMessage: (msg: SocialMessage) => {
    const chatKey = [msg.fromId, msg.toId].sort().join('_');
    const history = persistenceService.getSocialMessages(msg.fromId, msg.toId);
    persistenceService._safeSave(`${KEYS.SOCIAL_MESSAGES}${chatKey}`, [...history, msg].slice(-100));
  },

  getFriends: (userId: string): string[] => {
    return persistenceService._safeGet(`${KEYS.FRIENDS}${userId}`) || [];
  },

  addFriend: (userId: string, friendId: string) => {
    const friends = persistenceService.getFriends(userId);
    if (!friends.includes(friendId)) {
      persistenceService._safeSave(`${KEYS.FRIENDS}${userId}`, [...friends, friendId]);
    }
  },

  getClasses: (instructorId: string): ClassRoom[] => {
    const all = persistenceService._safeGet(KEYS.CLASSES) || [];
    return all.filter((c: ClassRoom) => c.instructorId === instructorId);
  },

  saveClass: (classObj: ClassRoom) => {
    const all = persistenceService._safeGet(KEYS.CLASSES) || [];
    const index = all.findIndex((c: ClassRoom) => c.id === classObj.id);
    if (index !== -1) all[index] = classObj;
    else all.push(classObj);
    persistenceService._safeSave(KEYS.CLASSES, all);
  },

  deleteClass: (classId: string) => {
    const all = persistenceService._safeGet(KEYS.CLASSES) || [];
    const filtered = all.filter((c: ClassRoom) => c.id !== classId);
    persistenceService._safeSave(KEYS.CLASSES, filtered);
  },

  getClassMessages: (classId: string): ChatMessage[] => {
    return persistenceService._safeGet(`${KEYS.CLASS_MESSAGES}${classId}`) || [];
  },

  saveClassMessage: (classId: string, msg: ChatMessage) => {
    const history = persistenceService.getClassMessages(classId);
    persistenceService._safeSave(`${KEYS.CLASS_MESSAGES}${classId}`, [...history, msg].slice(-200));
  },

  resetAll: () => {
    localStorage.clear();
    sessionStorage.clear();
    persistenceService._init();
  }
};

persistenceService._init();
