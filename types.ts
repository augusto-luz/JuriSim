export enum UserRole {
  STUDENT = 'STUDENT',
  LAWYER = 'LAWYER',
  INSTRUCTOR = 'INSTRUCTOR',
  OFFICE = 'OFFICE',
  INSTITUTION = 'INSTITUTION',
  ADMIN = 'ADMIN'
}

export enum CourtRole {
  JUDGE = 'Juiz de Direito',
  PROSECUTOR = 'Promotor/Acusação',
  DEFENSE = 'Advogado de Defesa',
  PLAINTIFF_COUNSEL = 'Advogado do Autor',
  PLAINTIFF = 'Autor/Requerente',
  DEFENDANT = 'Réu/Acusado',
  WITNESS = 'Testemunha',
  CLERK = 'Escrivão/Secretário',
  JUROR = 'Jurado'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan?: 'FREE' | 'PREMIUM';
  organizationId?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  area: 'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial';
  progress: number;
  facts: string;
  evidence: string[];
  witnesses: string[];
  objectives: string[];
}

export interface StudentReport {
  id: string;
  studentId: string;
  studentName: string;
  scenarioId: string;
  scenarioTitle: string;
  score: number;
  feedback: string;
  technicalAnalysis: {
    rhetoric: number;
    procedure: number;
    evidenceHandling: number;
  };
  timestamp: number;
}

export interface Classroom {
  id: string;
  name: string;
  instructorId: string;
  area: 'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial' | 'Multi';
  inviteCode: string;
  studentIds: string[];
  assignedScenarioIds: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Participant {
  id: string;
  name: string;
  role: CourtRole;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised?: boolean;
  isPinned?: boolean;
  audioLevel?: number;
  status: 'waiting' | 'active' | 'disconnected' | 'kicked';
  stream?: MediaStream;
}