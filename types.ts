
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

export interface UserPerformance {
  userId: string;
  userName: string;
  totalExerciseTime: number; 
  avgOratory: number;
  avgProcedural: number;
  avgEvidence: number;
  totalSimulations: number;
}

export interface User {
  id: string; // Network ID (ex: JURI-XXXX)
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  status: 'active' | 'suspended';
  plan?: 'FREE' | 'PREMIUM';
  organizationId?: string;
  performance?: UserPerformance;
  friends?: string[];
  instructorApproved?: boolean;
  isVerified: boolean;
  // Campos específicos por categoria
  institution?: string; // Estudante e Instrutor
  period?: string;      // Estudante
  oab?: string;         // Advogado e Instrutor (opcional)
  course?: string;      // Estudante (cursos preparatórios)
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  // Adicionado 'Administrativo' para suportar os cenários definidos em constants.ts
  area: 'Civil' | 'Penal' | 'Trabalhista' | 'Empresarial' | 'Administrativo';
  progress: number;
  facts: string;
  evidence: string[];
  witnesses: string[];
  objectives: string[];
  isCompleted?: boolean;
  createdBy?: string;
  attachments?: Attachment[];
}

export interface ClassRoom {
  id: string;
  name: string;
  instructorId: string;
  studentIds: string[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  senderName: string;
  text: string;
  timestamp: number;
}

export interface SocialMessage {
  id: string;
  fromId: string;
  toId: string;
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
