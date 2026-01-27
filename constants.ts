
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
    progress: 0,
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
    progress: 0,
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
  },
  {
    id: '4',
    title: 'Ação de Despejo Residencial',
    description: 'Retomada de imóvel por inadimplência prolongada e infração contratual.',
    difficulty: 'Iniciante',
    area: 'Civil',
    progress: 0,
    facts: 'O Locatário não paga o aluguel há 4 meses e sublocou parte do imóvel sem autorização expressa do locador, violando cláusula contratual. O locador busca o despejo imediato e o pagamento dos atrasados.',
    evidence: [
      'Contrato de locação registrado.',
      'Planilha de débitos atualizada.',
      'Notificação extrajudicial ignorada.',
      'Anúncio de sublocação em rede social.'
    ],
    witnesses: [
      'Síndico do prédio.',
      'Sublocatário irregular.'
    ],
    objectives: [
      'Garantir a desocupação do imóvel.',
      'Cobrar multas e aluguéis em atraso.',
      'Validar a infração de sublocação.'
    ]
  },
  {
    id: '5',
    title: 'Indenização por Erro Médico',
    description: 'Caso complexo envolvendo imperícia técnica em procedimento cirúrgico.',
    difficulty: 'Avançado',
    area: 'Civil',
    progress: 0,
    facts: 'O Autor foi submetido a uma cirurgia de joelho, mas saiu com sequelas motoras permanentes. Alega que o cirurgião utilizou técnica obsoleta e houve falha no pós-operatório hospitalar.',
    evidence: [
      'Prontuário médico completo.',
      'Exames de imagem pré e pós operatórios.',
      'Parecer técnico de médico assistente.',
      'Protocolos de segurança hospitalar.'
    ],
    witnesses: [
      'Médico perito do IMESC.',
      'Enfermeiro chefe do bloco cirúrgico.'
    ],
    objectives: [
      'Estabelecer o nexo causal entre a conduta e o dano.',
      'Pleitear pensão vitalícia e danos estéticos.',
      'Questionar o consentimento informado.'
    ]
  },
  {
    id: '6',
    title: 'Reintegração de Posse Rural',
    description: 'Disputa de limites territoriais e invasão de propriedade produtiva.',
    difficulty: 'Intermediário',
    area: 'Civil',
    progress: 0,
    facts: 'O proprietário da Fazenda Santa Luzia alega que o vizinho deslocou a cerca divisória em 50 metros para dentro de sua área produtiva durante a noite, ocupando uma faixa de 10 hectares.',
    evidence: [
      'Escritura pública do imóvel.',
      'Levantamento topográfico georreferenciado.',
      'Fotos da cerca antiga e da nova.',
      'Boletim de Ocorrência de esbulho possessório.'
    ],
    witnesses: [
      'Topógrafo independente.',
      'Caseiro da propriedade.'
    ],
    objectives: [
      'Liminar de reintegração de posse.',
      'Demolição da cerca irregular.',
      'Indenização por perdas e danos na colheita.'
    ]
  },
  {
    id: '7',
    title: 'Furto em Supermercado',
    description: 'Delito patrimonial de baixo potencial ofensivo com alegação de furto famélico.',
    difficulty: 'Iniciante',
    area: 'Penal',
    progress: 0,
    facts: 'O Réu foi flagrado pelas câmeras escondendo três latas de leite em pó sob a blusa. Foi abordado na saída pela segurança. Alega estado de necessidade para alimentar o filho recém-nascido.',
    evidence: [
      'Imagens do circuito interno.',
      'Auto de exibição e apreensão.',
      'Nota fiscal dos itens subtraídos.',
      'Comprovante de desemprego do réu.'
    ],
    witnesses: [
      'Segurança do estabelecimento.',
      'Gerente da loja.'
    ],
    objectives: [
      'Absolvição por furto famélico.',
      'Aplicação do princípio da insignificância.',
      'Conversão em pena restritiva de direitos.'
    ]
  },
  {
    id: '8',
    title: 'Homicídio Culposo no Trânsito',
    description: 'Acidente automobilístico com vítima fatal sob suposta embriaguez.',
    difficulty: 'Intermediário',
    area: 'Penal',
    progress: 0,
    facts: 'O condutor atropelou um pedestre na faixa de segurança. O teste do bafômetro indicou 0,34mg/L. A defesa alega que a vítima atravessou com o sinal fechado e havia má iluminação.',
    evidence: [
      'Laudo de necropsia.',
      'Perícia técnica do local do acidente.',
      'Resultado do teste do etilômetro.',
      'Relatório de iluminação pública da via.'
    ],
    witnesses: [
      'Policial que atendeu a ocorrência.',
      'Passageiro do veículo.',
      'Testemunha ocular no ponto de ônibus.'
    ],
    objectives: [
      'Desqualificar a culpa consciente.',
      'Demonstrar culpa exclusiva da vítima.',
      'Evitar a suspensão da CNH.'
    ]
  },
  {
    id: '9',
    title: 'Tráfico e Associação para o Tráfico',
    description: 'Prisão em flagrante em ponto de venda com múltiplos envolvidos.',
    difficulty: 'Avançado',
    area: 'Penal',
    progress: 0,
    facts: 'Operação policial apreendeu 5kg de maconha e balanças de precisão na residência do réu. Ele alega ser apenas usuário e que a droga pertencia a terceiros que fugiram.',
    evidence: [
      'Auto de prisão em flagrante.',
      'Laudo toxicológico definitivo.',
      'Transcrição de interceptações telefônicas.',
      'Dinheiro trocado apreendido (R$ 2.500).'
    ],
    witnesses: [
      'Delegado responsável pela investigação.',
      'Vizinho (testemunha arrolada pelo MP).',
      'Usuário que saía do local no momento da abordagem.'
    ],
    objectives: [
      'Desclassificação para consumo pessoal (Art. 28).',
      'Questionar a validade da entrada sem mandado.',
      'Afastar a qualificadora de associação criminosa.'
    ]
  },
  {
    id: '10',
    title: 'Ação por Verbas Rescisórias',
    description: 'Demissão sem justa causa com ausência de pagamento de aviso prévio.',
    difficulty: 'Iniciante',
    area: 'Trabalhista',
    progress: 0,
    facts: 'O empregado trabalhou por 2 anos como balconista. Ao ser dispensado, a empresa não pagou as férias proporcionais nem a multa de 40% do FGTS, alegando crise financeira.',
    evidence: [
      'CTPS com baixa anotada.',
      'TRCT sem assinaturas de quitação.',
      'Extrato da conta vinculada do FGTS.',
      'Conversas de WhatsApp sobre a demissão.'
    ],
    witnesses: [
      'Colega de trabalho atual.',
      'Contador da empresa (preposto).'
    ],
    objectives: [
      'Obter o pagamento integral das verbas.',
      'Aplicação da multa do Art. 477 da CLT.',
      'Liberação imediata das guias de seguro-desemprego.'
    ]
  },
  {
    id: '11',
    title: 'Vínculo de Emprego de PJ',
    description: 'Contratação via MEI ocultando relação de subordinação e pessoalidade.',
    difficulty: 'Intermediário',
    area: 'Trabalhista',
    progress: 0,
    facts: 'Um designer gráfico prestou serviços exclusivos por 3 anos emitindo notas fiscais. Alega que tinha horário fixo, recebia ordens diretas e era proibido de atender outros clientes.',
    evidence: [
      'Notas fiscais sequenciais.',
      'Crachá e login em sistema interno.',
      'Troca de e-mails com subordinação direta.',
      'Contrato de prestação de serviços MEI.'
    ],
    witnesses: [
      'Ex-gerente da agência.',
      'Outro prestador de serviço na mesma condição.'
    ],
    objectives: [
      'Reconhecer o vínculo empregatício em juízo.',
      'Recolhimento retroativo de INSS e FGTS.',
      'Anotação da CTPS com data retroativa.'
    ]
  },
  {
    id: '12',
    title: 'Acidente de Trabalho e Estabilidade',
    description: 'Lesão por esforço repetitivo com pedido de reintegração e danos.',
    difficulty: 'Avançado',
    area: 'Trabalhista',
    progress: 0,
    facts: 'Operário de linha de montagem desenvolveu LER/DORT severa. Após retorno do auxílio-doença acidentário, foi demitido em menos de 1 mês. Pede reintegração e indenização.',
    evidence: [
      'Comunicação de Acidente de Trabalho (CAT).',
      'Laudo médico do INSS reconhecendo nexo.',
      'Estudo de ergonomia do posto de trabalho.',
      'Receitas de medicamentos controlados.'
    ],
    witnesses: [
      'Médico do trabalho da empresa.',
      'Líder de produção da época do afastamento.'
    ],
    objectives: [
      'Garantir a estabilidade provisória (12 meses).',
      'Indenização por danos morais e materiais.',
      'Readequação de função compatível com a lesão.'
    ]
  }
];

export const DYNAMIC_HEARING_PROMPT = `
Você é o MOTOR DE SIMULAÇÃO JURÍDICA (JuriSim Engine).
Sua função é controlar DOIS personagens simultaneamente nesta audiência:
1. O JUIZ DE DIREITO (Presidente da sessão, formal, imparcial, decisivo, utiliza termos como "Doutor", "Vossa Excelência" se referido, mantém a ordem).
2. O ADVOGADO DA PARTE CONTRÁRIA (Oponente do usuário, técnico, atento a contradições, levanta objeções baseadas no CPC/CPP).

O usuário é o ADVOGADO da outra parte.

REGRAS DE INTERAÇÃO:
- Se o Usuário terminar sua fala, o JUIZ deve intervir para dar andamento ou questionar.
- Se o JUIZ passar a palavra para a Parte Contrária, VOCÊ MESMO escreve a fala da Parte Contrária na mesma resposta.
- Utilize linguagem jurídica formal (jurisprudência, ritos, artigos).
- Seja combativo. Se o usuário cometer um erro processual, a Parte Contrária deve arguir e o Juiz deve decidir.

FORMATO:
[JUIZ]: Texto...
[PARTE CONTRÁRIA]: Texto...
`;
