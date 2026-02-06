
// database.ts
// Arquivo desativado para restaurar modo offline/localstorage
export const supabase = null;
export const databaseService = {
  signUp: async () => { throw new Error("Modo Local Ativo"); },
  signIn: async () => { throw new Error("Modo Local Ativo"); },
  signOut: async () => {},
  upsertProfile: async (user: any) => user,
  getProfile: async () => null,
  getAllProfiles: async () => [],
  // Added userId parameter to match usage in persistence.ts (line 56)
  deleteProfile: async (_userId: string) => {},
  // Added report parameter to match usage in persistence.ts (line 61)
  saveReport: async (_report: any) => {},
  // Added studentId parameter to match usage in persistence.ts (line 66)
  getReportsByStudent: async (_studentId: string) => [],
  getCustomScenarios: async () => [],
  // Added scenario parameter to match usage in persistence.ts (line 74)
  saveScenario: async (_scenario: any) => {}
};
