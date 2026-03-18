import { BotLead, BotMessage, ScoreEvent, BotMaterial, BotVisit, BotHandoff } from './types';

const now = new Date();
const ago = (days: number, hours = 0) => new Date(now.getTime() - days * 86400000 - hours * 3600000).toISOString();

export const mockLeads: BotLead[] = [
  {
    id: '1', name: 'Carlos Alberto Silva', phone: '(31) 99876-5432', origin: 'Facebook Ads',
    profile_type: 'empresa', objective: 'Instalar centro de distribuição', desired_area: '2.000 m²',
    construction_interest: true, score: 75, score_classification: 'quente',
    attendance_status: 'aguardando_humano', visit_interest: true, human_handoff: true,
    handoff_reason: 'Solicitou proposta personalizada', conversation_state: 'TRANSFERENCIA_HUMANA',
    last_message_at: ago(0, 2), created_at: ago(3), updated_at: ago(0, 2),
  },
  {
    id: '2', name: 'Marina Costa Oliveira', phone: '(31) 98765-4321', origin: 'Google Ads',
    profile_type: 'investimento', objective: 'Valorização patrimonial', desired_area: '1.000 m²',
    construction_interest: false, score: 45, score_classification: 'morno',
    attendance_status: 'bot', visit_interest: false, human_handoff: false,
    handoff_reason: null, conversation_state: 'CONDICOES_COMERCIAIS',
    last_message_at: ago(0, 5), created_at: ago(2), updated_at: ago(0, 5),
  },
  {
    id: '3', name: 'Roberto Mendes', phone: '(31) 97654-3210', origin: 'Indicação',
    profile_type: 'empresa', objective: 'Galpão para logística', desired_area: '3.000 m²',
    construction_interest: true, score: 60, score_classification: 'quente',
    attendance_status: 'em_atendimento', visit_interest: true, human_handoff: true,
    handoff_reason: 'Lead muito interessado + visita', conversation_state: 'AGENDAMENTO_VISITA',
    last_message_at: ago(1), created_at: ago(5), updated_at: ago(1),
  },
  {
    id: '4', name: 'Fernanda Almeida', phone: '(31) 96543-2109', origin: 'Instagram',
    profile_type: 'indefinido', objective: null, desired_area: null,
    construction_interest: false, score: 10, score_classification: 'frio',
    attendance_status: 'bot', visit_interest: false, human_handoff: false,
    handoff_reason: null, conversation_state: 'QUALIFICACAO_PRINCIPAL',
    last_message_at: ago(0, 8), created_at: ago(1), updated_at: ago(0, 8),
  },
  {
    id: '5', name: 'João Pedro Nascimento', phone: '(31) 95432-1098', origin: 'Site',
    profile_type: 'investimento', objective: 'Construir galpão para renda', desired_area: '1.500 m²',
    construction_interest: true, score: 55, score_classification: 'quente',
    attendance_status: 'aguardando_humano', visit_interest: true, human_handoff: true,
    handoff_reason: 'Solicitou visita', conversation_state: 'CONVERSAO',
    last_message_at: ago(0, 1), created_at: ago(4), updated_at: ago(0, 1),
  },
  {
    id: '6', name: 'Ana Beatriz Souza', phone: '(31) 94321-0987', origin: 'Facebook Ads',
    profile_type: 'empresa', objective: 'Escritório + depósito', desired_area: '1.200 m²',
    construction_interest: true, score: 35, score_classification: 'morno',
    attendance_status: 'bot', visit_interest: false, human_handoff: false,
    handoff_reason: null, conversation_state: 'APRESENTACAO_EMPREENDIMENTO',
    last_message_at: ago(0, 12), created_at: ago(6), updated_at: ago(0, 12),
  },
  {
    id: '7', name: 'Lucas Ferreira', phone: '(31) 93210-9876', origin: 'Google Ads',
    profile_type: null, objective: null, desired_area: null,
    construction_interest: false, score: 0, score_classification: 'frio',
    attendance_status: 'bot', visit_interest: false, human_handoff: false,
    handoff_reason: null, conversation_state: 'ABERTURA',
    last_message_at: ago(0, 3), created_at: ago(0, 3), updated_at: ago(0, 3),
  },
  {
    id: '8', name: 'Patrícia Gonçalves', phone: '(31) 92109-8765', origin: 'Indicação',
    profile_type: 'investimento', objective: 'Valorização + renda', desired_area: '2.500 m²',
    construction_interest: true, score: 80, score_classification: 'quente',
    attendance_status: 'atendido', visit_interest: true, human_handoff: true,
    handoff_reason: 'Proposta personalizada', conversation_state: 'ENCERRADO',
    last_message_at: ago(2), created_at: ago(10), updated_at: ago(2),
  },
  {
    id: '9', name: 'Marcos Vinícius', phone: '(31) 91098-7654', origin: 'Site',
    profile_type: 'empresa', objective: 'Sede da empresa', desired_area: '1.800 m²',
    construction_interest: true, score: 20, score_classification: 'frio',
    attendance_status: 'bot', visit_interest: false, human_handoff: false,
    handoff_reason: null, conversation_state: 'CONTEXTUALIZACAO',
    last_message_at: ago(1, 6), created_at: ago(1, 6), updated_at: ago(1, 6),
  },
  {
    id: '10', name: 'Juliana Martins', phone: '(31) 90987-6543', origin: 'Instagram',
    profile_type: 'investimento', objective: 'Comprar para revender', desired_area: '1.000 m²',
    construction_interest: false, score: 40, score_classification: 'morno',
    attendance_status: 'bot', visit_interest: false, human_handoff: false,
    handoff_reason: null, conversation_state: 'CONVERSAO',
    last_message_at: ago(0, 4), created_at: ago(3), updated_at: ago(0, 4),
  },
];

export const mockMessages: Record<string, BotMessage[]> = {
  '1': [
    { id: 'm1', lead_id: '1', direction: 'outbound', content: 'Olá Carlos! Vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o Rogério, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade.', message_type: 'text', metadata: {}, created_at: ago(3) },
    { id: 'm2', lead_id: '1', direction: 'inbound', content: 'Oi Rogério, sim! Estou procurando um local para instalar meu centro de distribuição.', message_type: 'text', metadata: {}, created_at: ago(3, -1) },
    { id: 'm3', lead_id: '1', direction: 'outbound', content: 'Excelente! O MBC é um condomínio empresarial às margens da MG-10, próximo ao Aeroporto de Confins. Os lotes começam a partir de 1.000 m² e a região está em forte expansão logística.', message_type: 'text', metadata: {}, created_at: ago(3, -2) },
    { id: 'm4', lead_id: '1', direction: 'outbound', content: 'Você está avaliando para instalar sua empresa ou pensando como investimento?', message_type: 'text', metadata: {}, created_at: ago(3, -2) },
    { id: 'm5', lead_id: '1', direction: 'inbound', content: 'Para a empresa mesmo. Preciso de pelo menos 2.000 m² para o galpão.', message_type: 'text', metadata: {}, created_at: ago(2) },
    { id: 'm6', lead_id: '1', direction: 'outbound', content: 'Ótimo! Temos lotes que atendem essa metragem. A infraestrutura inclui ruas de 10m, asfalto para carretas e rotatórias. Segurança 24h com portaria.', message_type: 'text', metadata: {}, created_at: ago(2, -1) },
    { id: 'm7', lead_id: '1', direction: 'outbound', content: 'O preço base é R$ 530.000, com entrada de 20% e saldo em até 24 parcelas. Posso te enviar o material completo?', message_type: 'text', metadata: {}, created_at: ago(1) },
    { id: 'm8', lead_id: '1', direction: 'inbound', content: 'Sim, me envia! E quero agendar uma visita e receber uma proposta personalizada.', message_type: 'text', metadata: {}, created_at: ago(0, 2) },
    { id: 'm9', lead_id: '1', direction: 'outbound', content: 'Perfeito! Vou te enviar o material agora e transferir para nosso consultor para cuidar da proposta e agendar sua visita. Obrigado, Carlos!', message_type: 'text', metadata: {}, created_at: ago(0, 2) },
  ],
  '2': [
    { id: 'm10', lead_id: '2', direction: 'outbound', content: 'Olá Marina! Vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o Rogério, responsável pelo projeto.', message_type: 'text', metadata: {}, created_at: ago(2) },
    { id: 'm11', lead_id: '2', direction: 'inbound', content: 'Oi! Quero saber mais sobre investimento.', message_type: 'text', metadata: {}, created_at: ago(2, -1) },
    { id: 'm12', lead_id: '2', direction: 'outbound', content: 'Que bom! O MBC está em uma localização estratégica, às margens da MG-10, a 3km do Aeroporto de Confins. A região está em forte valorização.', message_type: 'text', metadata: {}, created_at: ago(2, -2) },
    { id: 'm13', lead_id: '2', direction: 'outbound', content: 'Você busca valorização patrimonial ou pensa em construir um galpão para renda?', message_type: 'text', metadata: {}, created_at: ago(1) },
    { id: 'm14', lead_id: '2', direction: 'inbound', content: 'Por enquanto só valorização. Qual o valor?', message_type: 'text', metadata: {}, created_at: ago(0, 5) },
    { id: 'm15', lead_id: '2', direction: 'outbound', content: 'O preço base é R$ 530.000, com entrada de 20% e saldo em até 24 parcelas com correção de 0,99% a.m. O condomínio é de aproximadamente R$ 500/mês.', message_type: 'text', metadata: {}, created_at: ago(0, 5) },
  ],
};

export const mockScoreEvents: Record<string, ScoreEvent[]> = {
  '1': [
    { id: 'se1', lead_id: '1', event_type: 'perfil_respondido', points: 10, description: 'Informou perfil: empresa', created_at: ago(3, -1) },
    { id: 'se2', lead_id: '1', event_type: 'objetivo_informado', points: 10, description: 'Centro de distribuição', created_at: ago(2) },
    { id: 'se3', lead_id: '1', event_type: 'metragem_informada', points: 10, description: '2.000 m²', created_at: ago(2) },
    { id: 'se4', lead_id: '1', event_type: 'material_solicitado', points: 20, description: 'Solicitou material completo', created_at: ago(0, 2) },
    { id: 'se5', lead_id: '1', event_type: 'visita_aceita', points: 25, description: 'Quer agendar visita', created_at: ago(0, 2) },
  ],
  '2': [
    { id: 'se6', lead_id: '2', event_type: 'perfil_respondido', points: 10, description: 'Informou perfil: investimento', created_at: ago(2, -1) },
    { id: 'se7', lead_id: '2', event_type: 'objetivo_informado', points: 10, description: 'Valorização patrimonial', created_at: ago(1) },
    { id: 'se8', lead_id: '2', event_type: 'metragem_informada', points: 10, description: '1.000 m²', created_at: ago(0, 5) },
    { id: 'se9', lead_id: '2', event_type: 'material_solicitado', points: 15, description: 'Perguntou sobre preço', created_at: ago(0, 5) },
  ],
};

export const mockMaterials: BotMaterial[] = [
  { id: 'mat1', name: 'Apresentação Institucional MBC', type: 'apresentacao', url: 'https://mbc.com.br/apresentacao.pdf', category: 'institucional', is_active: true, created_at: ago(30), updated_at: ago(5) },
  { id: 'mat2', name: 'Planta do Empreendimento', type: 'planta', url: 'https://mbc.com.br/planta.pdf', category: 'tecnico', is_active: true, created_at: ago(30), updated_at: ago(5) },
  { id: 'mat3', name: 'Mapa de Localização', type: 'mapa', url: 'https://mbc.com.br/mapa.pdf', category: 'institucional', is_active: true, created_at: ago(30), updated_at: ago(10) },
  { id: 'mat4', name: 'Tabela de Preços Atualizada', type: 'tabela', url: 'https://mbc.com.br/tabela.pdf', category: 'comercial', is_active: true, created_at: ago(15), updated_at: ago(1) },
  { id: 'mat5', name: 'Vídeo Institucional MBC', type: 'video', url: 'https://youtube.com/watch?v=mbc123', category: 'institucional', is_active: true, created_at: ago(20), updated_at: ago(20) },
  { id: 'mat6', name: 'Book Completo MBC', type: 'pdf', url: 'https://mbc.com.br/book.pdf', category: 'comercial', is_active: false, created_at: ago(60), updated_at: ago(30) },
];

export const mockVisits: BotVisit[] = [
  { id: 'v1', lead_id: '1', scheduled_at: new Date(now.getTime() + 2 * 86400000).toISOString(), status: 'solicitada', notes: 'Quer conhecer os lotes de 2.000 m²', created_at: ago(0, 2) },
  { id: 'v2', lead_id: '3', scheduled_at: new Date(now.getTime() + 1 * 86400000).toISOString(), status: 'confirmada', notes: 'Visita com equipe técnica', created_at: ago(1) },
  { id: 'v3', lead_id: '5', scheduled_at: new Date(now.getTime() + 3 * 86400000).toISOString(), status: 'solicitada', notes: null, created_at: ago(0, 1) },
  { id: 'v4', lead_id: '8', scheduled_at: ago(3), status: 'realizada', notes: 'Visitou e gostou muito', created_at: ago(5) },
];

export const mockHandoffs: BotHandoff[] = [
  { id: 'h1', lead_id: '1', reason: 'Solicitou proposta personalizada', assigned_to: null, status: 'pendente', notes: null, created_at: ago(0, 2), resolved_at: null },
  { id: 'h2', lead_id: '3', reason: 'Lead muito interessado + visita', assigned_to: null, status: 'em_atendimento', notes: 'Consultor João assumiu', created_at: ago(1), resolved_at: null },
  { id: 'h3', lead_id: '5', reason: 'Solicitou visita', assigned_to: null, status: 'pendente', notes: null, created_at: ago(0, 1), resolved_at: null },
  { id: 'h4', lead_id: '8', reason: 'Proposta personalizada', assigned_to: null, status: 'concluido', notes: 'Venda concluída', created_at: ago(5), resolved_at: ago(2) },
];
