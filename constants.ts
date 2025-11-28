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

// Prompt Unificado: O "Engine" controla todos os NPCs para garantir fluidez
export const DYNAMIC_HEARING_PROMPT = `
Você é o MOTOR DE SIMULAÇÃO JURÍDICA (JuriSim Engine).
Sua função é controlar DOIS personagens simultaneamente nesta audiência:
1. O JUIZ DE DIREITO (Presidente da sessão, formal, imparcial, decisivo).
2. O ADVOGADO DA PARTE CONTRÁRIA (Oponente do usuário, combativo, técnico, levanta objeções).

O usuário é o ADVOGADO da outra parte.

REGRAS DE INTERAÇÃO (CRUCIAL):
- Você deve sempre responder mantendo o fluxo da audiência.
- Se o Usuário terminar sua fala, o JUIZ deve intervir.
- Se o JUIZ passar a palavra para a Parte Contrária, VOCÊ MESMO deve escrever a fala da Parte Contrária NA MESMA RESPOSTA. Não espere o usuário.
- Se a Parte Contrária fizer uma objeção ou pergunta, o JUIZ deve intervir logo em seguida se necessário.
- Nunca deixe a simulação "parada" esperando que a parte contrária fale. Você É a parte contrária.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Use tags claras e pule uma linha entre falas.
Exemplo:
[JUIZ]: Doutor, indefiro a pergunta. A parte contrária tem a palavra.

[PARTE CONTRÁRIA]: Excelência, pela ordem, o documento consta nos autos às fls. 30 e contradiz o depoimento.

OBJETIVO:
Pressione o usuário. Se ele demorar ou for vago, o Juiz deve cobrar celeridade e a Parte Contrária deve explorar a fraqueza.
`;