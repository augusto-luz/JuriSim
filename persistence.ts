
import { ChatMessage, User, Scenario, StudentReport, CourtRole, UserPerformance, SocialMessage, ClassRoom } from './types';
import { SCENARIOS } from './constants';

const DB_VERSION = '1.9';
const KEYS = {
  VERSION: 'jurisim_db_v',
  USER: 'jurisim_user',
  ALL_USERS: 'jurisim_all_users_list',
  CHAT_HISTORY: 'jurisim_chat_',
  SCENARIO_PROGRESS: 'jurisim_progress_',
  CUSTOM_SCENARIOS: 'jurisim_custom_scenarios_global',
  REPORTS: 'jurisim_reports_all',
  ROOM_HISTORY: 'jurisim_room_history_',
  PERFORMANCE: 'jurisim_performance_',
  SOCIAL_MESSAGES: 'jurisim_social_msg_',
  CLASS_MESSAGES: 'jurisim_class_msg_',
  FRIENDS: 'jurisim_friends_',
  CLASSES: 'jurisim_classes_all'
};

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

  getAllUsers: (): User[] => {
    return persistenceService._safeGet(KEYS.ALL_USERS) || [];
  },

  saveUserGlobally: (user: User) => {
    const users = persistenceService.getAllUsers();
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
      return allUsers.find(u => u.id === sessionUser.id) || null;
    } catch (e) { return null; }
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.USER);
  },

  // Outros métodos (GetClasses, SaveClass, etc.) mantidos iguais...
  getClasses: (instructorId: string): ClassRoom[] => {
    const all = persistenceService._safeGet(KEYS.CLASSES) || [];
    return Array.isArray(all) ? all.filter((c: ClassRoom) => c.instructorId === instructorId) : [];
  },

  saveClass: (classObj: ClassRoom) => {
    const all = persistenceService._safeGet(KEYS.CLASSES) || [];
    const dataArray = Array.isArray(all) ? all : [];
    const index = dataArray.findIndex((c: ClassRoom) => c.id === classObj.id);
    if (index !== -1) dataArray[index] = classObj;
    else dataArray.push(classObj);
    persistenceService._safeSave(KEYS.CLASSES, dataArray);
  },

  deleteClass: (classId: string) => {
    const all = persistenceService._safeGet(KEYS.CLASSES) || [];
    if (!Array.isArray(all)) return;
    const filtered = all.filter((c: ClassRoom) => c.id !== classId);
    persistenceService._safeSave(KEYS.CLASSES, filtered);
  },

  getCustomScenarios: (userId?: string): Scenario[] => {
    const all = persistenceService._safeGet(KEYS.CUSTOM_SCENARIOS) || [];
    if (!Array.isArray(all)) return [];
    if (userId) return all.filter((s: Scenario) => s.createdBy === userId);
    return all;
  },

  saveCustomScenario: (scenario: Scenario) => {
    const all = persistenceService._safeGet(KEYS.CUSTOM_SCENARIOS) || [];
    const dataArray = Array.isArray(all) ? all : [];
    const index = dataArray.findIndex((s: Scenario) => s.id === scenario.id);
    if (index !== -1) dataArray[index] = scenario;
    else dataArray.push(scenario);
    persistenceService._safeSave(KEYS.CUSTOM_SCENARIOS, dataArray);
  },

  deleteCustomScenario: (scenarioId: string) => {
    const all = persistenceService._safeGet(KEYS.CUSTOM_SCENARIOS) || [];
    if (!Array.isArray(all)) return;
    const filtered = all.filter((s: Scenario) => s.id !== scenarioId);
    persistenceService._safeSave(KEYS.CUSTOM_SCENARIOS, filtered);
  },

  getAllReports: (): StudentReport[] => persistenceService._safeGet(KEYS.REPORTS) || [],
  saveStudentReport: (report: StudentReport) => {
    const reports = persistenceService.getAllReports();
    persistenceService._safeSave(KEYS.REPORTS, [...reports, report]);
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
    const users = persistenceService.getAllUsers();
    users.forEach(u => {
        const p = persistenceService._safeGet(`${KEYS.PERFORMANCE}${u.id}`);
        if(p) rankings.push(p);
    });
    return rankings.sort((a, b) => (b.avgOratory + b.avgProcedural + b.avgEvidence) - (a.avgOratory + a.avgProcedural + a.avgEvidence));
  },

  addFriend: (userId: string, friendId: string) => {
    const friends = persistenceService._safeGet(`${KEYS.FRIENDS}${userId}`) || [];
    if (!friends.includes(friendId)) {
      persistenceService._safeSave(`${KEYS.FRIENDS}${userId}`, [...friends, friendId]);
    }
  },

  getFriends: (userId: string): string[] => persistenceService._safeGet(`${KEYS.FRIENDS}${userId}`) || [],

  saveClassMessage: (classId: string, msg: ChatMessage) => {
    const key = `${KEYS.CLASS_MESSAGES}${classId}`;
    const history = persistenceService._safeGet(key) || [];
    persistenceService._safeSave(key, [...history, msg].slice(-200));
  },

  getClassMessages: (classId: string): ChatMessage[] => persistenceService._safeGet(`${KEYS.CLASS_MESSAGES}${classId}`) || [],

  getScenarioProgress: (userId: string, scenarioId: string): number => persistenceService._safeGet(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`) || 0,
  saveScenarioProgress: (userId: string, scenarioId: string, progress: number) => persistenceService._safeSave(`${KEYS.SCENARIO_PROGRESS}${userId}_${scenarioId}`, progress),
  
  getChatHistory: (userId: string, scenarioId: string): ChatMessage[] | null => persistenceService._safeGet(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`),
  saveChatHistory: (userId: string, scenarioId: string, messages: ChatMessage[]) => persistenceService._safeSave(`${KEYS.CHAT_HISTORY}${userId}_${scenarioId}`, messages),

  trackExerciseTime: (userId: string, minutes: number) => {
    const perf = persistenceService.getUserPerformance(userId);
    perf.totalExerciseTime += minutes;
    persistenceService._safeSave(`${KEYS.PERFORMANCE}${userId}`, perf);
  },

  getScenarioById: (userId: string, scenarioId: string): Scenario | null => {
    const all = [...SCENARIOS, ...persistenceService.getCustomScenarios()];
    return all.find(s => s.id === scenarioId) || null;
  },

  saveRoomHistory: (userId: string, entry: any) => {
    const history = persistenceService._safeGet(`${KEYS.ROOM_HISTORY}${userId}`) || [];
    persistenceService._safeSave(`${KEYS.ROOM_HISTORY}${userId}`, [entry, ...history.filter((h:any)=>h.roomId!==entry.roomId)].slice(0, 10));
  },

  getRoomHistory: (userId: string): any[] => persistenceService._safeGet(`${KEYS.ROOM_HISTORY}${userId}`) || [],
  getRoleForRoom: (userId: string, roomId: string): CourtRole | null => {
    const h = persistenceService.getRoomHistory(userId).find(x => x.roomId === roomId);
    return h ? h.role : null;
  },

  resetAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

persistenceService._init();
