
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { User, Scenario, StudentReport } from './types.ts';

const getEnv = (name: string): string => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[name]) || 
           (import.meta && (import.meta as any).env && (import.meta as any).env[name]) || '';
  } catch {
    return '';
  }
};

const SUPABASE_URL = getEnv('PRÓXIMO_PÚBLICO_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('PRÓXIMO_PÚBLICO_SUPABASE_ANON_KEY');

// Só inicializa se as chaves estiverem presentes para evitar erro "supabaseUrl is required"
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const databaseService = {
  // Implementação de upsert para gerenciar perfis de usuários no Supabase
  async upsertProfile(user: User) {
    if (!supabase) return user;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, 
          network_id: user.id,
          name: user.name,
          email: user.email.toLowerCase(),
          password: user.password || null, // Persiste senha se disponível
          role: user.role,
          status: user.status,
          plan: user.plan || 'FREE',
          is_verified: user.isVerified,
          instructor_approved: user.instructorApproved || false,
          institution: user.institution || null,
          period: user.period || null,
          oab: user.oab || null,
          course: user.course || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' })
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error('[Database] Erro no upsertProfile:', err);
      throw err;
    }
  },

  // Busca perfil por e-mail no banco de dados
  async getProfileByEmail(email: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      // Mapeia snake_case do banco para camelCase do objeto User
      return {
        ...data,
        isVerified: data.is_verified,
        instructorApproved: data.instructor_approved
      };
    }
    return null;
  },

  // Retorna todos os perfis cadastrados
  async getAllProfiles() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      isVerified: d.is_verified,
      instructorApproved: d.instructor_approved
    }));
  },

  // Deleta um perfil do banco de dados
  async deleteProfile(userId: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  },

  // Salva o relatório de desempenho da audiência simulada
  async saveReport(report: StudentReport) {
    if (!supabase) return;
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

  // Recupera relatórios de um estudante
  async getReportsByStudent(studentId: string): Promise<StudentReport[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('student_reports')
      .select('*')
      .eq('student_id', studentId);
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: 'Estudante',
      scenarioId: r.scenario_id,
      scenarioTitle: 'Caso Simulado',
      score: r.score,
      feedback: r.feedback,
      technicalAnalysis: {
        rhetoric: r.rhetoric_score,
        procedure: r.procedure_score,
        evidenceHandling: r.evidence_score
      },
      timestamp: new Date(r.timestamp).getTime()
    }));
  },

  // Busca cenários customizados do banco de dados
  async getCustomScenarios(): Promise<Scenario[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('scenarios')
      .select('*');
    if (error) throw error;
    return (data || []).map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      difficulty: s.difficulty,
      area: s.area,
      progress: 0,
      facts: s.facts,
      evidence: s.evidence || [],
      witnesses: s.witnesses || [],
      objectives: s.objectives || [],
      createdBy: s.created_by,
      attachments: s.attachments || []
    }));
  },

  // Salva ou atualiza um cenário customizado no banco de dados
  async saveScenario(scenario: Scenario) {
    if (!supabase) return;
    const { error } = await supabase
      .from('scenarios')
      .upsert({
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
        difficulty: scenario.difficulty,
        area: scenario.area,
        facts: scenario.facts,
        evidence: scenario.evidence,
        witnesses: scenario.witnesses,
        objectives: scenario.objectives,
        created_by: scenario.createdBy,
        attachments: scenario.attachments,
        updated_at: new Date().toISOString()
      });
    if (error) throw error;
  }
};
