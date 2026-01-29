
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { User, Scenario, StudentReport } from './types';

// Helper para ler variáveis de ambiente em diferentes contextos de build (Vite/Vercel)
const getEnv = (name: string): string => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env && process.env[name]) || 
           // @ts-ignore
           (import.meta && import.meta.env && import.meta.env[name]) || '';
  } catch {
    return '';
  }
};

const SUPABASE_URL = getEnv('PRÓXIMO_PÚBLICO_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('PRÓXIMO_PÚBLICO_SUPABASE_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const databaseService = {
  /**
   * Sincroniza o perfil do usuário com o Supabase.
   * Usado para cadastros, logins e autorizações administrativas.
   */
  async upsertProfile(user: User) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Database] Chaves do Supabase não configuradas. Operando em modo local.');
      return user;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, 
          network_id: user.id,
          name: user.name,
          email: user.email.toLowerCase(),
          role: user.role,
          status: user.status,
          plan: user.plan || 'FREE',
          is_verified: user.isVerified,
          instructor_approved: user.instructorApproved || false,
          institution: user.institution,
          period: user.period,
          oab: user.oab,
          course: user.course,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' })
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error('[Database] Erro ao sincronizar perfil:', err);
      throw err;
    }
  },

  async getProfileByEmail(email: string) {
    if (!SUPABASE_URL) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getAllProfiles() {
    if (!SUPABASE_URL) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async deleteProfile(userId: string) {
    if (!SUPABASE_URL) return;
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  },

  async saveReport(report: StudentReport) {
    if (!SUPABASE_URL) return;
    const { error } = await supabase
      .from('student_reports')
      .insert([{
        student_id: report.studentId,
        scenario_id: report.scenarioId,
        score: report.score,
        feedback: report.feedback,
        rhetoric_score: report.technicalAnalysis.rhetoric,
        procedure_score: report.technicalAnalysis.procedure,
        evidence_score: report.technicalAnalysis.evidenceHandling,
        timestamp: new Date(report.timestamp).toISOString()
      }]);
    if (error) throw error;
  },

  async getReportsByStudent(studentId: string) {
    if (!SUPABASE_URL) return [];
    const { data, error } = await supabase
      .from('student_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async saveScenario(scenario: Scenario) {
    if (!SUPABASE_URL) return;
    const { error } = await supabase
      .from('scenarios')
      .upsert({
        id: scenario.id.startsWith('custom-') ? undefined : scenario.id,
        title: scenario.title,
        facts: scenario.facts,
        area: scenario.area,
        difficulty: scenario.difficulty,
        evidence: scenario.evidence,
        witnesses: scenario.witnesses,
        objectives: scenario.objectives,
        created_by: scenario.createdBy,
        is_public: true
      });
    if (error) throw error;
  },

  async getCustomScenarios() {
    if (!SUPABASE_URL) return [];
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('is_public', true);
    if (error) throw error;
    return data || [];
  }
};
