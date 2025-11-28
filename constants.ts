import { Scenario, UserRole } from './types';

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
    progress: 0,
    facts: 'O Autor adquiriu um smartphone modelo "X-Phone 10" em 10/01/2024. Após 3 dias de uso, o aparelho superaqueceu e explodiu, causando queimaduras leves na mão do autor e inutilizando o bem. A fabricante negou a troca alegando "mau uso".',
    evidence: [
      'Nota Fiscal de compra datada de 10/01/2024.',
      'Laudo médico das queimaduras de 1º grau.',
      'Fotos do aparelho carbonizado.',
      'Email de recusa de garantia enviado pela fabricante.'
    ],
    witnesses: [
      'Maria Silva (Vizinha que presenciou o incidente)',
      'Técnico de Celular (Perito Particular)'
    ],
    objectives: [
      'Obter o ressarcimento do valor do aparelho (R$ 4.000,00).',
      'Obter indenização por danos morais (Sugestão: R$ 10.000,00).',
      'Rebater a tese de "mau uso" da defesa.'
    ]
  },
  {
    id: '2',
    title: 'Roubo Qualificado',
    description: 'Audiência de instrução e julgamento de réu primário acusado de roubo.',
    difficulty: 'Intermediário',
    area: 'Penal',
    progress: 35,
    facts: 'O Réu, Carlos, foi detido em flagrante portando a bolsa da vítima. A vítima alega que foi abordada mediante grave ameaça com uso de faca. O Réu nega o uso de arma e alega que apenas "puxou" a bolsa (furto por arrebatamento). A faca não foi encontrada.',
    evidence: [
      'Boletim de Ocorrência.',
      'Auto de Prisão em Flagrante.',
      'Depoimento da Vítima na delegacia.',
      'Imagens de câmera de segurança (baixa qualidade).'
    ],
    witnesses: [
      'Policial Militar que efetuou a prisão.',
      'Vítima.',
      'Testemunha de defesa (Mãe do réu).'
    ],
    objectives: [
      'Desclassificar o crime de Roubo para Furto (pena menor).',
      'Questionar a materialidade da arma (faca não encontrada).',
      'Pleitear responder em liberdade (réu primário).'
    ]
  },
  {
    id: '3',
    title: 'Assédio Moral Corporativo',
    description: 'Processo trabalhista complexo envolvendo múltiplas testemunhas.',
    difficulty: 'Avançado',
    area: 'Trabalhista',
    progress: 10,
    facts: 'A Reclamante alega que seu superior hierárquico a expunha a situações humilhantes, chamando-a de "incompetente" na frente dos colegas e estipulando metas inatingíveis. Pede Rescisão Indireta e Danos Morais. A empresa nega e alega baixa produtividade.',
    evidence: [
      'Emails com cobranças de metas fora do horário.',
      'Áudio gravado de uma reunião (validade contestada).',
      'Registro de ponto.',
      'Avaliações de desempenho.'
    ],
    witnesses: [
      'Ex-funcionário que também processa a empresa.',
      'Gerente de RH (Preposto).'
    ],
    objectives: [
      'Comprovar o rigor excessivo e a humilhação.',
      'Validar o áudio como prova lícita.',
      'Caracterizar a Rescisão Indireta.'
    ]
  }
];

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
- Use DUAS quebras de linha (\n\n) para separar claramente as falas.

FORMATO DE RESPOSTA OBRIGATÓRIO:
[JUIZ]: Texto do juiz...

[PARTE CONTRÁRIA]: Texto do advogado oponente...

OBJETIVO:
Pressione o usuário. Se ele demorar ou for vago, o Juiz deve cobrar celeridade e a Parte Contrária deve explorar a fraqueza.
`;