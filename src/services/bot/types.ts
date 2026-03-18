export type ProfileType = 'empresa' | 'investimento' | 'indefinido';
export type ScoreClassification = 'frio' | 'morno' | 'quente';
export type AttendanceStatus = 'bot' | 'aguardando_humano' | 'em_atendimento' | 'atendido' | 'encerrado';
export type ConversationState =
  | 'START' | 'ABERTURA' | 'CONTEXTUALIZACAO'
  | 'QUALIFICACAO_PRINCIPAL' | 'QUALIFICACAO_SECUNDARIA'
  | 'APRESENTACAO_EMPREENDIMENTO' | 'CONDICOES_COMERCIAIS'
  | 'CONVERSAO' | 'AGENDAMENTO_VISITA' | 'TRANSFERENCIA_HUMANA' | 'ENCERRADO';
export type MaterialType = 'apresentacao' | 'planta' | 'mapa' | 'tabela' | 'video' | 'pdf';
export type VisitStatus = 'solicitada' | 'confirmada' | 'realizada' | 'cancelada';
export type HandoffStatus = 'pendente' | 'em_atendimento' | 'concluido';
export type MessageDirection = 'inbound' | 'outbound';

export interface BotLead {
  id: string;
  name: string;
  phone: string;
  origin: string | null;
  profile_type: ProfileType | null;
  objective: string | null;
  desired_area: string | null;
  construction_interest: boolean;
  score: number;
  score_classification: ScoreClassification;
  attendance_status: AttendanceStatus;
  visit_interest: boolean;
  human_handoff: boolean;
  handoff_reason: string | null;
  conversation_state: ConversationState;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BotMessage {
  id: string;
  lead_id: string;
  direction: MessageDirection;
  content: string;
  message_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ScoreEvent {
  id: string;
  lead_id: string;
  event_type: string;
  points: number;
  description: string | null;
  created_at: string;
}

export interface BotMaterial {
  id: string;
  name: string;
  type: MaterialType;
  url: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BotVisit {
  id: string;
  lead_id: string;
  scheduled_at: string | null;
  status: VisitStatus;
  notes: string | null;
  created_at: string;
}

export interface BotHandoff {
  id: string;
  lead_id: string;
  reason: string;
  assigned_to: string | null;
  status: HandoffStatus;
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export const FLOW_STAGES: { key: ConversationState; label: string; description: string }[] = [
  { key: 'START', label: 'Início', description: 'Lead entrou no sistema' },
  { key: 'ABERTURA', label: 'Abertura', description: 'Mensagem inicial de boas-vindas' },
  { key: 'CONTEXTUALIZACAO', label: 'Contextualização', description: 'Apresentação do MBC' },
  { key: 'QUALIFICACAO_PRINCIPAL', label: 'Qualificação Principal', description: 'Empresa ou investimento?' },
  { key: 'QUALIFICACAO_SECUNDARIA', label: 'Qualificação Secundária', description: 'Detalhes do perfil' },
  { key: 'APRESENTACAO_EMPREENDIMENTO', label: 'Apresentação', description: 'Infraestrutura e localização' },
  { key: 'CONDICOES_COMERCIAIS', label: 'Condições Comerciais', description: 'Preços e parcelamento' },
  { key: 'CONVERSAO', label: 'Conversão', description: 'Material, planta, visita' },
  { key: 'AGENDAMENTO_VISITA', label: 'Agendamento', description: 'Visita agendada' },
  { key: 'TRANSFERENCIA_HUMANA', label: 'Transferência Humana', description: 'Handoff para consultor' },
  { key: 'ENCERRADO', label: 'Encerrado', description: 'Conversa finalizada' },
];

export const SCORE_RULES = [
  { event: 'perfil_respondido', points: 10, label: 'Respondeu perfil' },
  { event: 'objetivo_informado', points: 10, label: 'Informou objetivo' },
  { event: 'metragem_informada', points: 10, label: 'Informou metragem' },
  { event: 'material_solicitado', points: 20, label: 'Solicitou material' },
  { event: 'planta_solicitada', points: 15, label: 'Solicitou planta' },
  { event: 'visita_aceita', points: 25, label: 'Aceitou visita' },
  { event: 'proposta_solicitada', points: 30, label: 'Solicitou proposta' },
];
