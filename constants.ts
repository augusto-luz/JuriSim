
import { Scenario, UserRole, User } from './types.ts';

export const MOCK_USER: User = {
  id: 'ADMIN-MASTER',
  name: 'Augusto',
  email: 'augusto.luzq@gmail.com',
  password: 'Augusto@454528#', // Senha definida conforme solicitação
  role: UserRole.ADMIN,
  status: 'active',
  isVerified: true,
  plan: 'PREMIUM'
};

export const SCENARIOS: Scenario[] = [
  // --- CIVIL (6) ---
  { id: 'CIV-01', title: 'X-Phone: Explosão de Bateria', difficulty: 'Iniciante', area: 'Civil', progress: 0, facts: 'Smartphone explodiu após 3 dias de uso causando danos materiais e físicos.', evidence: ['Nota Fiscal', 'Fotos do Aparelho', 'Laudo Médico'], witnesses: ['Vizinho', 'Perito'], objectives: ['Danos Morais', 'Ressarcimento'], description: 'Consumidor vs Fabricante.' },
  { id: 'CIV-02', title: 'Despejo por Falta de Pagamento', difficulty: 'Iniciante', area: 'Civil', progress: 0, facts: 'Locatário inadimplente há 4 meses e sublocação irregular.', evidence: ['Contrato', 'Planilha de Débitos'], witnesses: ['Síndico'], objectives: ['Desocupação', 'Cobrança'], description: 'Direito Imobiliário.' },
  { id: 'CIV-03', title: 'Erro Médico em Cirurgia Estética', difficulty: 'Avançado', area: 'Civil', progress: 0, facts: 'Paciente com sequelas graves após rinoplastia não consentida plenamente.', evidence: ['Prontuário', 'Termo de Consentimento'], witnesses: ['Enfermeira'], objectives: ['Indenização Estética'], description: 'Responsabilidade Civil Médica.' },
  { id: 'CIV-04', title: 'Alienação Parental e Guarda', difficulty: 'Intermediário', area: 'Civil', progress: 0, facts: 'Genitor dificulta visitas e deprecia a imagem do outro perante o menor.', evidence: ['Relatório Psicológico', 'Prints de Mensagens'], witnesses: ['Avó'], objectives: ['Guarda Compartilhada'], description: 'Direito de Família.' },
  { id: 'CIV-05', title: 'Negativação Indevida (SPC/Serasa)', difficulty: 'Iniciante', area: 'Civil', progress: 0, facts: 'Nome negativado por dívida já quitada há 2 anos.', evidence: ['Comprovante de Pagamento', 'Extrato Serasa'], witnesses: [], objectives: ['Baixa do Nome', 'Danos Morais'], description: 'Direito do Consumidor.' },
  { id: 'CIV-06', title: 'Acidente de Trânsito: Embriaguez', difficulty: 'Intermediário', area: 'Civil', progress: 0, facts: 'Colisão traseira onde o condutor culpado recusou o bafômetro.', evidence: ['Boletim de Ocorrência', 'Orçamentos'], witnesses: ['Pedestre'], objectives: ['Reparação de Danos'], description: 'Responsabilidade Civil.' },

  // --- PENAL (6) ---
  { id: 'PEN-01', title: 'Roubo Qualificado (Arma Branca)', difficulty: 'Intermediário', area: 'Penal', progress: 0, facts: 'Subtração de bolsa mediante ameaça com faca. Réu nega a arma.', evidence: ['Auto de Prisão', 'Depoimento Vítima'], witnesses: ['Policial'], objectives: ['Desclassificação para Furto'], description: 'Crimes contra o Patrimônio.' },
  { id: 'PEN-02', title: 'Tráfico de Drogas: Privilegiado', difficulty: 'Intermediário', area: 'Penal', progress: 0, facts: 'Flagrante com 50g de maconha. Réu primário e bons antecedentes.', evidence: ['Laudo de Constatação'], witnesses: ['Guardas Municipais'], objectives: ['Redutora do Art. 33 §4º'], description: 'Lei de Drogas.' },
  { id: 'PEN-03', title: 'Homicídio Qualificado (Júri)', difficulty: 'Avançado', area: 'Penal', progress: 0, facts: 'Crime passional com motivo fútil. Defesa alega legítima defesa putativa.', evidence: ['Laudo Necroscópico'], witnesses: ['Testemunha Ocular'], objectives: ['Absolvição ou Retirada de Qualificadora'], description: 'Tribunal do Júri.' },
  { id: 'PEN-04', title: 'Estelionato Digital (Phishing)', difficulty: 'Avançado', area: 'Penal', progress: 0, facts: 'Fraude bancária via link falso. Investigação por IP.', evidence: ['Logs de Acesso', 'Extrato Bancário'], witnesses: ['Especialista em TI'], objectives: ['Nulidade de Prova Digital'], description: 'Crimes Cibernéticos.' },
  { id: 'PEN-05', title: 'Violência Doméstica (Medida)', difficulty: 'Iniciante', area: 'Penal', progress: 0, facts: 'Ameaça e agressão verbal. Vítima deseja retirar a queixa.', evidence: ['Medida Protetiva', 'Prints'], witnesses: ['Vizinha'], objectives: ['Revogação de Medida'], description: 'Lei Maria da Penha.' },
  { id: 'PEN-06', title: 'Crime Ambiental: Descarte Químico', difficulty: 'Avançado', area: 'Penal', progress: 0, facts: 'Empresa despejou resíduos em rio. Responsabilidade da diretoria.', evidence: ['Laudo Ambiental', 'Notas Fiscais'], witnesses: ['Fiscal do IBAMA'], objectives: ['Exclusão de Ilicitude'], description: 'Direito Penal Ambiental.' },

  // --- TRABALHISTA (6) ---
  { id: 'TRA-01', title: 'Assédio Moral no Varejo', difficulty: 'Avançado', area: 'Trabalhista', progress: 0, facts: 'Gerente expunha metas de forma vexatória em grupo de WhatsApp.', evidence: ['Prints', 'Áudios'], witnesses: ['Ex-colega'], objectives: ['Rescisão Indireta'], description: 'Danos Morais.' },
  { id: 'TRA-02', title: 'Horas Extras e Intervalo Intra', difficulty: 'Iniciante', area: 'Trabalhista', progress: 0, facts: 'Funcionário trabalhava 10h/dia sem registro fiel no cartão.', evidence: ['Cartão de Ponto', 'Extrato Bancário'], witnesses: ['Colega de Turno'], objectives: ['Pagamento de Extras'], description: 'Jornada de Trabalho.' },
  { id: 'TRA-03', title: 'Equiparação Salarial', difficulty: 'Intermediário', area: 'Trabalhista', progress: 0, facts: 'Mesma função, mesma produtividade, mas salários diferentes.', evidence: ['Holerites', 'Contrato de Trabalho'], witnesses: ['Paradigma'], objectives: ['Diferenças Salariais'], description: 'Isonomia.' },
  { id: 'TRA-04', title: 'Acidente em Obra Civil', difficulty: 'Avançado', area: 'Trabalhista', progress: 0, facts: 'Queda de andaime sem EPI fornecido pela empresa.', evidence: ['CAT', 'Fotos do Local'], witnesses: ['Mestre de Obras'], objectives: ['Pensão e Danos Morais'], description: 'Segurança do Trabalho.' },
  { id: 'TRA-05', title: 'Pejotização e Vínculo', difficulty: 'Intermediário', area: 'Trabalhista', progress: 0, facts: 'Contratado como PJ, mas com subordinação e horário fixo.', evidence: ['Notas Fiscais', 'Emails de Comando'], witnesses: ['Secretária'], objectives: ['Reconhecimento de Vínculo'], description: 'Fraude Trabalhista.' },
  { id: 'TRA-06', title: 'Estabilidade Gestante', difficulty: 'Iniciante', area: 'Trabalhista', progress: 0, facts: 'Demitida sem saber da gravidez. Empresa recusa reintegração.', evidence: ['Exame Beta HCG', 'TRCT'], witnesses: [], objectives: ['Reintegração ou Indenização'], description: 'Garantia de Emprego.' },

  // --- ADMINISTRATIVO (6) ---
  { id: 'ADM-01', title: 'Licitação: Dispensa Indevida', difficulty: 'Avançado', area: 'Administrativo', progress: 0, facts: 'Prefeitura contratou empresa sem licitação alegando emergência fabricada.', evidence: ['Contrato Administrativo', 'Parecer Jurídico'], witnesses: ['Auditor do TCE'], objectives: ['Nulidade do Ato'], description: 'Lei de Licitações (14.133).' },
  { id: 'ADM-02', title: 'Improbidade: Enriquecimento Ilícito', difficulty: 'Avançado', area: 'Administrativo', progress: 0, facts: 'Secretário comprou imóveis incompatíveis com a renda declarada.', evidence: ['DIRPF', 'Matrículas Imobiliárias'], witnesses: ['Denunciante'], objectives: ['Perda da Função Pública'], description: 'Lei de Improbidade.' },
  { id: 'ADM-03', title: 'Concurso: Preterição de Vaga', difficulty: 'Intermediário', area: 'Administrativo', progress: 0, facts: 'Candidato aprovado em cadastro reserva enquanto terceirizados ocupam a vaga.', evidence: ['Edital', 'Contratos de Terceirização'], witnesses: [], objectives: ['Nomeação Imediata'], description: 'Direito Administrativo.' },
  { id: 'ADM-04', title: 'Reequilíbrio de Contrato Público', difficulty: 'Avançado', area: 'Administrativo', progress: 0, facts: 'Aumento drástico do insumo (asfalto) inviabiliza obra pública.', evidence: ['Planilha de Custos', 'Índices FIPE'], witnesses: ['Engenheiro Civil'], objectives: ['Revisão Contratual'], description: 'Contratos Administrativos.' },
  { id: 'ADM-05', title: 'PAD: Demissão de Servidor', difficulty: 'Intermediário', area: 'Administrativo', progress: 0, facts: 'Servidor demitido por abandono de cargo. Alega cerceamento de defesa.', evidence: ['Cópia Integral do PAD'], witnesses: ['Chefe de Setor'], objectives: ['Anulação da Demissão'], description: 'Processo Administrativo Disciplinar.' },
  { id: 'ADM-06', title: 'Multa Ambiental: Ausência de Notificação', difficulty: 'Iniciante', area: 'Administrativo', progress: 0, facts: 'Posto de gasolina multado sem auto de infração entregue presencialmente.', evidence: ['Certidão de Dívida Ativa'], witnesses: ['Frentista'], objectives: ['Insubsistência da Multa'], description: 'Processo Administrativo Ambiental.' }
];

export const DYNAMIC_HEARING_PROMPT = `
Você é o MOTOR DE SIMULAÇÃO JURÍDICA (JuriSim Engine).
Sua função é controlar DOIS personagens simultaneamente nesta audiência:
1. O JUIZ DE DIREITO (formal, imparcial, decisivo).
2. O ADVOGADO DA PARTE CONTRÁRIA (técnico, combatente, levanta objeções).

O usuário é o ADVOGADO da outra parte.

REGRAS:
- Utilize linguagem jurídica formal brasileira.
- Seja combativo. Se o usuário cometer um erro, a Parte Contrária deve arguir.

FORMATO:
[JUIZ]: Texto...
[PARTE CONTRÁRIA]: Texto...
`;
