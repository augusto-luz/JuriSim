import { Scenario, UserRole, CourtRole } from './types';

export const MOCK_USER = {
  id: '1',
  name: 'Dr. Augusto',
  email: 'augusto@jurisim.com',
  role: UserRole.STUDENT
};

export const SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: 'Caso do Celular com Defeito',
    description: 'Ação de indenização por danos morais e materiais contra fabricante de eletrônicos.',
    difficulty: 'Iniciante',
    area: 'Civil',
    progress: 0
  },
  {
    id: '2',
    title: 'Roubo Qualificado',
    description: 'Audiência de instrução e julgamento de réu primário acusado de roubo.',
    difficulty: 'Intermediário',
    area: 'Penal',
    progress: 35
  },
  {
    id: '3',
    title: 'Assédio Moral Corporativo',
    description: 'Processo trabalhista complexo envolvendo múltiplas testemunhas.',
    difficulty: 'Avançado',
    area: 'Trabalhista',
    progress: 10
  }
];

export const SYSTEM_PROMPTS = {
  JUDGE: `Você é um Juiz de Direito brasileiro experiente, imparcial e formal. 
  Seu objetivo é conduzir uma audiência de instrução. 
  Mantenha a ordem, faça perguntas pertinentes às partes e decida questões de ordem. 
  Seja conciso e utilize terminologia jurídica adequada.`,
  
  OPPOSING_COUNSEL: `Você é o Advogado da parte contrária. 
  Seu objetivo é defender os interesses do seu cliente com vigor, mas respeito.
  Conteste os argumentos do usuário, levante objeções quando apropriado e faça perguntas difíceis.`,
};