
-- Bot leads table
CREATE TABLE public.bot_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  origin text,
  profile_type text CHECK (profile_type IN ('empresa', 'investimento', 'indefinido')),
  objective text,
  desired_area text,
  construction_interest boolean DEFAULT false,
  score integer DEFAULT 0,
  score_classification text DEFAULT 'frio' CHECK (score_classification IN ('frio', 'morno', 'quente')),
  attendance_status text DEFAULT 'bot' CHECK (attendance_status IN ('bot', 'aguardando_humano', 'em_atendimento', 'atendido', 'encerrado')),
  visit_interest boolean DEFAULT false,
  human_handoff boolean DEFAULT false,
  handoff_reason text,
  conversation_state text DEFAULT 'START' CHECK (conversation_state IN ('START', 'ABERTURA', 'CONTEXTUALIZACAO', 'QUALIFICACAO_PRINCIPAL', 'QUALIFICACAO_SECUNDARIA', 'APRESENTACAO_EMPREENDIMENTO', 'CONDICOES_COMERCIAIS', 'CONVERSAO', 'AGENDAMENTO_VISITA', 'TRANSFERENCIA_HUMANA', 'ENCERRADO')),
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bot messages table
CREATE TABLE public.bot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.bot_leads(id) ON DELETE CASCADE NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'template')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Score events table
CREATE TABLE public.score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.bot_leads(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  points integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Bot materials table
CREATE TABLE public.bot_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('apresentacao', 'planta', 'mapa', 'tabela', 'video', 'pdf')),
  url text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bot visits table
CREATE TABLE public.bot_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.bot_leads(id) ON DELETE CASCADE NOT NULL,
  scheduled_at timestamptz,
  status text DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'confirmada', 'realizada', 'cancelada')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Bot handoffs table
CREATE TABLE public.bot_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.bot_leads(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  assigned_to uuid,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'concluido')),
  notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Bot configuration table
CREATE TABLE public.bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CRM users can view bot_leads" ON public.bot_leads FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage bot_leads" ON public.bot_leads FOR ALL USING (has_any_crm_role(auth.uid()));

CREATE POLICY "CRM users can view bot_messages" ON public.bot_messages FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage bot_messages" ON public.bot_messages FOR ALL USING (has_any_crm_role(auth.uid()));

CREATE POLICY "CRM users can view score_events" ON public.score_events FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage score_events" ON public.score_events FOR ALL USING (has_any_crm_role(auth.uid()));

CREATE POLICY "CRM users can view bot_materials" ON public.bot_materials FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage bot_materials" ON public.bot_materials FOR ALL USING (has_any_crm_role(auth.uid()));

CREATE POLICY "CRM users can view bot_visits" ON public.bot_visits FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage bot_visits" ON public.bot_visits FOR ALL USING (has_any_crm_role(auth.uid()));

CREATE POLICY "CRM users can view bot_handoffs" ON public.bot_handoffs FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage bot_handoffs" ON public.bot_handoffs FOR ALL USING (has_any_crm_role(auth.uid()));

CREATE POLICY "CRM users can view bot_config" ON public.bot_config FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "Admins can manage bot_config" ON public.bot_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_leads;

-- Triggers for updated_at
CREATE TRIGGER update_bot_leads_updated_at BEFORE UPDATE ON public.bot_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_materials_updated_at BEFORE UPDATE ON public.bot_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_config_updated_at BEFORE UPDATE ON public.bot_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
