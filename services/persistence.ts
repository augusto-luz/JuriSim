
import { ChatMessage, User, Scenario, StudentReport, CourtRole, UserPerformance, SocialMessage } from '../types';
import { SCENARIOS } from '../constants';

const DB_VERSION = '1.6';
const KEYS = {
  VERSION: 'jurisim_db_v',
  USER: 'jurisim_user',
  ALL_USERS: 'jurisim_all_users_list',
  CHAT_HISTORY: 'jurisim_chat_',
  SCENARIO_PROGRESS: 'jurisim_progress_',
  CUSTOM_SCENARIOS: 'jurisim_custom_scenarios_',
  REPORTS: 'jurisim_reports_',
  ROOM_HISTORY: 'jurisim_room_history_',
  PERFORMANCE: 'jurisim_performance_',
  SOCIAL_MESSAGES: 'jurisim_social_msg_',
  FRIENDS: 'jurisim_friends_'
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
        localStorage.setItem(KEYS.VERSION, DB_VERSION);
      }
    } catch (e) { }
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

  // Gerenciamento Global de Usuários (Banco de Dados do Admin)
  getAllUsers: (): User[] => {
    return persistenceService._safeGet(KEYS.ALL_USERS) || [];
  },

  saveUserGlobally: (user: User) => {
    const users = persistenceService.getAllUsers();
    // Busca sincronizada por ID ou E-mail (Case-Insensitive)
    const index = users.findIndex(u => 
      u.id === user.id || 
      u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (index !== -1) {
      // Atualiza usuário existente preservando campos não enviados
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    persistenceService._safeSave(KEYS.ALL_USERS, users);
  },

  deleteUser: (userId: string) => {
    // Segurança: Não permite deletar o Admin Master via persistência
    if (userId === 'admin-master') return;

    const users = persistenceService.getAllUsers().filter(u => u.id !== userId);
    persistenceService._safeSave(KEYS.ALL_USERS, users);
    
    // Limpeza profunda de dados vinculados
    localStorage.removeItem(`${KEYS.PERFORMANCE}${userId}`);
    localStorage.removeItem(`${KEYS.FRIENDS}${userId}`);
    localStorage.removeItem(`${KEYS.ROOM_HISTORY}${userId}`);
    
    // Limpa também progresso de cenários para este usuário
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(KEYS.SCENARIO_PROGRESS) || key.startsWith(KEYS.CHAT_HISTORY))) {
        if (key.includes(userId)) {
          localStorage.removeItem(key);
        }
      }
    }
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
      const allUsers = persistenceService.getAllUsers();
      // Retorna a versão mais atualizada do banco
      const dbUser = allUsers.find(u => u.id === sessionUser.id);
      return dbUser || null;
    } catch (e) {
      return null;
    }
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.USER);
  },

  getCustomScenarios: (userId: string): Scenario[] => {
    return persistenceService._safeGet(`${KEYS.CUSTOM_SCENARIOS}${userId}`) || [];
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

  saveStudentReport: (report: StudentReport) => {
    const reports = persistenceService._safeGet(KEYS.REPORTS) || [];
    persistenceService._safeSave(KEYS.REPORTS, [...reports, report]);
    persistenceService.updatePerformanceStats(report.studentId, report);
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
    if (!perf) {
      perf = { userId, userName: userName || 'Usuário', totalExerciseTime: 0, avgOratory: 0, avgProcedural: 0, avgEvidence: 0, totalSimulations: 0 };
      persistenceService._safeSave(key, perf);
    }
    return perf;
  },

  getGlobalRankings: (currentUser?: User): UserPerformance[] => {
    const rankings: UserPerformance[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEYS.PERFORMANCE)) {
        const item = persistenceService._safeGet(key);
        if (item) rankings.push(item);
      }
    }
    return rankings.sort((a, b) => (b.avgOratory + b.avgProcedural + b.avgEvidence) - (a.avgOratory + a.avgProcedural + a.avgEvidence));
  },

  addFriend: (userId: string, friendId: string) => {
    const friends = persistenceService._safeGet(`${KEYS.FRIENDS}${userId}`) || [];
    if (!friends.includes(friendId)) {
      persistenceService._safeSave(`${KEYS.FRIENDS}${userId}`, [...friends, friendId]);
    }
  },

  getFriends: (userId: string): string[] => {
    return persistenceService._safeGet(`${KEYS.FRIENDS}${userId}`) || [];
  },

  saveSocialMessage: (msg: SocialMessage) => {
    const chatKey = [msg.fromId, msg.toId].sort().join('_');
    const history = persistenceService._safeGet(`${KEYS.SOCIAL_MESSAGES}${chatKey}`) || [];
    persistenceService._safeSave(`${KEYS.SOCIAL_MESSAGES}${chatKey}`, [...history, msg].slice(-100));
  },

  getSocialMessages: (userId: string, friendId: string): SocialMessage[] => {
    const chatKey = [userId, friendId].sort().join('_');
    return persistenceService._safeGet(`${KEYS.SOCIAL_MESSAGES}${chatKey}`) || [];
  },

  trackExerciseTime: (userId: string, minutes: number) => {
    const perf = persistenceService.getUserPerformance(userId);
    perf.totalExerciseTime += minutes;
    persistenceService._safeSave(`${KEYS.PERFORMANCE}${userId}`, perf);
  },

  getScenarioById: (userId: string, scenarioId: string): Scenario | null => {
    const all = [...SCENARIOS, ...persistenceService.getCustomScenarios(userId)];
    return all.find(s => s.id === scenarioId) || null;
  },

  saveRoomHistory: (userId: string, entry: RoomHistoryEntry) => {
    const history = persistenceService._safeGet(`${KEYS.ROOM_HISTORY}${userId}`) || [];
    const filtered = history.filter((h: any) => h.roomId !== entry.roomId);
    persistenceService._safeSave(`${KEYS.ROOM_HISTORY}${userId}`, [entry, ...filtered].slice(0, 10));
  },

  getRoomHistory: (userId: string): RoomHistoryEntry[] => {
    return persistenceService._safeGet(`${KEYS.ROOM_HISTORY}${userId}`) || [];
  },

  getRoleForRoom: (userId: string, roomId: string): CourtRole | null => {
    const history = persistenceService.getRoomHistory(userId);
    const entry = history.find(h => h.roomId === roomId);
    return entry ? entry.role : null;
  },

  trackScenarioStart: (id: string) => {},
  
  resetAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

persistenceService._init();
