export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
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
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  area: 'Civil' | 'Penal' | 'Trabalhista';
  progress: number;
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
}