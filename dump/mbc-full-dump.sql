-- ============================================================================
-- MBC Full Database Dump — Generated 2026-03-18
-- Target: Any Supabase project (run in SQL Editor)
-- ============================================================================

-- ─── 1. ENUMS ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_type AS ENUM ('whatsapp', 'email', 'webhook');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_temperature AS ENUM ('cold', 'warm', 'hot');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. FUNCTIONS ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.has_any_crm_role(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$function$;

-- ─── 3. TABLES ─────────────────────────────────────────────────────────────

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- pipeline_stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#88B544',
  position integer NOT NULL DEFAULT 0,
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- leads
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  cpf text,
  source text,
  enterprise text,
  unit_interest text,
  notes text,
  temperature lead_temperature NOT NULL DEFAULT 'cold',
  score integer NOT NULL DEFAULT 0,
  assigned_to uuid,
  stage_id uuid REFERENCES public.pipeline_stages(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- lead_activities
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL DEFAULT '',
  status campaign_status NOT NULL DEFAULT 'draft',
  sent_count integer NOT NULL DEFAULT 0,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- campaign_recipients
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),
  lead_id uuid NOT NULL REFERENCES public.leads(id),
  tracking_id uuid NOT NULL DEFAULT gen_random_uuid(),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz
);

-- integrations
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type integration_type NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- webhooks
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}'::text[],
  secret text,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- api_keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  permissions text[] NOT NULL DEFAULT '{read}'::text[],
  created_by uuid,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- bot_config
CREATE TABLE IF NOT EXISTS public.bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- bot_leads
CREATE TABLE IF NOT EXISTS public.bot_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  origin text,
  profile_type text,
  objective text,
  desired_area text,
  construction_interest boolean DEFAULT false,
  score integer DEFAULT 0,
  score_classification text DEFAULT 'frio',
  attendance_status text DEFAULT 'bot',
  visit_interest boolean DEFAULT false,
  human_handoff boolean DEFAULT false,
  handoff_reason text,
  conversation_state text DEFAULT 'START',
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- bot_messages
CREATE TABLE IF NOT EXISTS public.bot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.bot_leads(id),
  direction text NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- score_events
CREATE TABLE IF NOT EXISTS public.score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.bot_leads(id),
  event_type text NOT NULL,
  points integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- bot_handoffs
CREATE TABLE IF NOT EXISTS public.bot_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.bot_leads(id),
  reason text NOT NULL,
  assigned_to uuid,
  status text DEFAULT 'pendente',
  notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- bot_visits
CREATE TABLE IF NOT EXISTS public.bot_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.bot_leads(id),
  scheduled_at timestamptz,
  status text DEFAULT 'solicitada',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- bot_materials
CREATE TABLE IF NOT EXISTS public.bot_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  category text,
  url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── 4. RLS POLICIES ──────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_materials ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (has_any_crm_role(auth.uid()));

-- user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT USING (has_any_crm_role(auth.uid()));

-- pipeline_stages
CREATE POLICY "Admins can manage stages" ON public.pipeline_stages FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "CRM users can view stages" ON public.pipeline_stages FOR SELECT USING (has_any_crm_role(auth.uid()));

-- leads
CREATE POLICY "CRM users can view leads" ON public.leads FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can insert leads" ON public.leads FOR INSERT WITH CHECK (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can update leads" ON public.leads FOR UPDATE USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can delete leads" ON public.leads FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- lead_activities
CREATE POLICY "CRM users can view activities" ON public.lead_activities FOR SELECT USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can insert activities" ON public.lead_activities FOR INSERT WITH CHECK (has_any_crm_role(auth.uid()));

-- campaigns
CREATE POLICY "CRM users can manage campaigns" ON public.campaigns FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view campaigns" ON public.campaigns FOR SELECT USING (has_any_crm_role(auth.uid()));

-- campaign_recipients
CREATE POLICY "CRM users can manage recipients" ON public.campaign_recipients FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view recipients" ON public.campaign_recipients FOR SELECT USING (has_any_crm_role(auth.uid()));

-- integrations
CREATE POLICY "Admins can manage integrations" ON public.integrations FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view integrations" ON public.integrations FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- webhooks
CREATE POLICY "Admins can manage webhooks" ON public.webhooks FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view webhooks" ON public.webhooks FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- api_keys
CREATE POLICY "Admins can manage api_keys" ON public.api_keys FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view api_keys" ON public.api_keys FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- bot_config
CREATE POLICY "Admins can manage bot_config" ON public.bot_config FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "CRM users can view bot_config" ON public.bot_config FOR SELECT USING (has_any_crm_role(auth.uid()));

-- bot_leads
CREATE POLICY "CRM users can manage bot_leads" ON public.bot_leads FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view bot_leads" ON public.bot_leads FOR SELECT USING (has_any_crm_role(auth.uid()));

-- bot_messages
CREATE POLICY "CRM users can manage bot_messages" ON public.bot_messages FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view bot_messages" ON public.bot_messages FOR SELECT USING (has_any_crm_role(auth.uid()));

-- score_events
CREATE POLICY "CRM users can manage score_events" ON public.score_events FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view score_events" ON public.score_events FOR SELECT USING (has_any_crm_role(auth.uid()));

-- bot_handoffs
CREATE POLICY "CRM users can manage bot_handoffs" ON public.bot_handoffs FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view bot_handoffs" ON public.bot_handoffs FOR SELECT USING (has_any_crm_role(auth.uid()));

-- bot_visits
CREATE POLICY "CRM users can manage bot_visits" ON public.bot_visits FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view bot_visits" ON public.bot_visits FOR SELECT USING (has_any_crm_role(auth.uid()));

-- bot_materials
CREATE POLICY "CRM users can manage bot_materials" ON public.bot_materials FOR ALL USING (has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can view bot_materials" ON public.bot_materials FOR SELECT USING (has_any_crm_role(auth.uid()));

-- ─── 5. TRIGGER: handle_new_user ───────────────────────────────────────────
-- NOTE: This trigger attaches to auth.users which is managed by Supabase.
-- Run this AFTER creating the profiles table:
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 6. DATA: pipeline_stages ──────────────────────────────────────────────
INSERT INTO public.pipeline_stages (id, name, color, position, is_won, is_lost, created_at) VALUES
  ('cbdcc8d0-8026-45ac-81b2-ce2f44657f0c', 'Novo Lead', '#3B82F6', 0, false, false, '2026-02-27 20:40:01.316565+00'),
  ('d53e857a-97d9-4d5e-a230-9430c226c194', 'Qualificado', '#F59E0B', 1, false, false, '2026-02-27 20:40:01.316565+00'),
  ('bffc0966-c241-43d3-8065-52d5591b2ce4', 'Visita Agendada', '#8B5CF6', 2, false, false, '2026-02-27 20:40:01.316565+00'),
  ('f6d26ceb-dbb9-4cd7-b218-ee0d1c6c5134', 'Proposta Enviada', '#EC4899', 3, false, false, '2026-02-27 20:40:01.316565+00'),
  ('b5885b1f-9c45-41e9-8e0d-4fc53ca27a66', 'Negociação', '#F97316', 4, false, false, '2026-02-27 20:40:01.316565+00'),
  ('1dff1fe3-7250-40ad-bd0a-825be10c56d4', 'Venda Fechada', '#22C55E', 5, true, false, '2026-02-27 20:40:01.316565+00'),
  ('3808be2c-d183-49fb-b855-04061c256659', 'Perdido', '#EF4444', 6, false, true, '2026-02-27 20:40:01.316565+00')
ON CONFLICT (id) DO NOTHING;

-- ─── 7. DATA: bot_config ───────────────────────────────────────────────────
INSERT INTO public.bot_config (id, key, value, updated_at) VALUES
  ('652bbdb5-c766-4bd9-af5e-428a872b9e85', 'persona', '"Rogério"', '2026-03-18 01:50:35.837303+00'),
  ('2ecfe20c-e364-46f7-abed-678a2413bdd1', 'opening_message', '"Olá, vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o {persona}, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade."', '2026-03-18 01:50:36.205186+00'),
  ('50be0a63-ed6a-4652-9fa7-7238cd9cd64b', 'context_message', '"O MBC é um condomínio empresarial às margens da MG-10, próximo ao Aeroporto de Confins. Os lotes começam a partir de 1.000 m² e a região está em forte expansão logística."', '2026-03-18 01:50:36.492736+00'),
  ('487efda0-0bae-4602-a669-b64e646ccdc5', 'transfer_message', '"Vou te conectar com um consultor que vai cuidar de tudo para você. Em breve ele entrará em contato!"', '2026-03-18 01:50:36.793315+00'),
  ('66457d5d-287c-46e8-8deb-f037274a8c62', 'business_hours_start', '"08:00"', '2026-03-18 01:50:37.053041+00'),
  ('3e33943b-328e-4c06-82f7-f478e032aff7', 'business_hours_end', '"18:00"', '2026-03-18 01:50:37.314951+00'),
  ('9e8cbab8-9499-4664-8e78-0b3397995607', 'auto_handoff_hot', 'true', '2026-03-18 01:50:37.561292+00')
ON CONFLICT (key) DO NOTHING;

-- ─── 8. DATA: bot_leads ────────────────────────────────────────────────────
INSERT INTO public.bot_leads (id, name, phone, origin, profile_type, objective, desired_area, construction_interest, score, score_classification, attendance_status, visit_interest, human_handoff, handoff_reason, conversation_state, last_message_at, created_at, updated_at) VALUES
  ('210d0d99-d628-425d-b9b1-0da4bb08299e', 'Teste Lead', '(31) 99999-8888', 'openclaw', 'empresa', 'logística', '2.000 m²', false, 85, 'quente', 'aguardando_humano', true, true, 'Detectado: proposta personalizada', 'TRANSFERENCIA_HUMANA', '2026-03-18 00:37:17.89+00', '2026-03-18 00:37:06.653876+00', '2026-03-18 00:37:19.019951+00')
ON CONFLICT (id) DO NOTHING;

-- ─── 9. DATA: bot_messages ─────────────────────────────────────────────────
INSERT INTO public.bot_messages (id, lead_id, direction, content, message_type, metadata, created_at) VALUES
  ('47970b60-2786-4a49-94a7-98b1915a400a', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'inbound', 'Olá, quero saber sobre os lotes para instalar minha empresa de logística', 'text', '{}', '2026-03-18 00:37:07.236568+00'),
  ('296a9bab-07fa-4b67-a33c-0ce8d106bf37', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'outbound', 'Olá! Vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o Rogério, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade.', 'text', '{}', '2026-03-18 00:37:08.292821+00'),
  ('585d4ac8-794b-489a-ac93-374bb73771a1', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'inbound', 'Preciso de uns 2.000 m² para meu galpão. Quero agendar uma visita e receber a proposta personalizada', 'text', '{}', '2026-03-18 00:37:16.704038+00'),
  ('3d8c037a-b409-45a5-86df-2d59e161b535', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'outbound', 'Vou te conectar com um consultor que vai cuidar de tudo para você. Em breve ele entrará em contato!', 'text', '{}', '2026-03-18 00:37:18.742448+00')
ON CONFLICT (id) DO NOTHING;

-- ─── 10. DATA: score_events ────────────────────────────────────────────────
INSERT INTO public.score_events (id, lead_id, event_type, points, description, created_at) VALUES
  ('b4c014d8-9ff8-43b9-be68-dcb330c4517b', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'perfil_respondido', 10, 'Respondeu perfil', '2026-03-18 00:37:07.82446+00'),
  ('d925d179-e191-49c0-867b-d6a0dfe9117a', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'objetivo_informado', 10, 'Informou objetivo', '2026-03-18 00:37:08.039796+00'),
  ('fe5c4df9-76f2-423e-a78d-cf8f04d36f08', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'metragem_informada', 10, 'Informou metragem', '2026-03-18 00:37:16.961465+00'),
  ('48e7c38f-5239-4c49-8c9f-bb137a02f148', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'visita_aceita', 25, 'Aceitou visita', '2026-03-18 00:37:17.543341+00'),
  ('fe13d0b5-1b64-429f-ba9d-de92318358cb', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'proposta_solicitada', 30, 'Solicitou proposta', '2026-03-18 00:37:17.783809+00')
ON CONFLICT (id) DO NOTHING;

-- ─── 11. DATA: bot_handoffs ────────────────────────────────────────────────
INSERT INTO public.bot_handoffs (id, lead_id, reason, status, created_at) VALUES
  ('5d7450dc-5208-4201-9d47-7c299a7983de', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'Detectado: proposta personalizada', 'pendente', '2026-03-18 00:37:18.423805+00')
ON CONFLICT (id) DO NOTHING;

-- ─── 12. DATA: bot_visits ──────────────────────────────────────────────────
INSERT INTO public.bot_visits (id, lead_id, status, notes, created_at) VALUES
  ('9dc311dd-7ceb-41a4-997d-42fc1fca3248', '210d0d99-d628-425d-b9b1-0da4bb08299e', 'solicitada', 'Solicitado via WhatsApp: "Preciso de uns 2.000 m² para meu galpão. Quero agendar uma visita e receber a proposta personalizada"', '2026-03-18 00:37:18.105225+00')
ON CONFLICT (id) DO NOTHING;

-- ─── 13. DATA: campaigns ───────────────────────────────────────────────────
INSERT INTO public.campaigns (id, name, subject, html_content, status, created_by, created_at, updated_at) VALUES
  ('0a4e7df5-b690-4a11-bf6e-98b939519565', 'teste', 'teste', 'teste', 'draft', '91a06f19-3a4f-418c-8ba8-24b2c3a6d83c', '2026-02-27 21:31:38.7878+00', '2026-02-27 21:31:38.7878+00')
ON CONFLICT (id) DO NOTHING;

-- ─── 14. NOTE: leads table has ~500+ rows ──────────────────────────────────
-- The leads table data is too large to include inline.
-- Use the Supabase REST API to export/import:
--   curl "https://ayjbdwwbhvdsltmvcgls.supabase.co/rest/v1/leads?select=*" \
--     -H "apikey: <ANON_KEY>" \
--     -H "Authorization: Bearer <SERVICE_ROLE_KEY>" > leads.json
--
-- Then import to new project:
--   curl -X POST "https://<NEW_PROJECT>.supabase.co/rest/v1/leads" \
--     -H "apikey: <NEW_ANON_KEY>" \
--     -H "Authorization: Bearer <NEW_SERVICE_ROLE_KEY>" \
--     -H "Content-Type: application/json" \
--     -H "Prefer: resolution=ignore-duplicates" \
--     -d @leads.json

-- ============================================================================
-- END OF DUMP
-- ============================================================================
