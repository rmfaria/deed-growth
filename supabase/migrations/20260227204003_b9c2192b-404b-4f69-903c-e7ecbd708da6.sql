
-- Create enum for lead temperature/classification
CREATE TYPE public.lead_temperature AS ENUM ('cold', 'warm', 'hot');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'agent');

-- Create enum for campaign status
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');

-- Create enum for integration type
CREATE TYPE public.integration_type AS ENUM ('whatsapp', 'email', 'webhook');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Pipeline stages table
CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#88B544',
  position INT NOT NULL DEFAULT 0,
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  temperature lead_temperature NOT NULL DEFAULT 'cold',
  source TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  enterprise TEXT,
  unit_interest TEXT,
  notes TEXT,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead activities/timeline
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL DEFAULT '',
  status campaign_status NOT NULL DEFAULT 'draft',
  sent_count INT NOT NULL DEFAULT 0,
  open_count INT NOT NULL DEFAULT 0,
  click_count INT NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign recipients
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  tracking_id UUID NOT NULL DEFAULT gen_random_uuid()
);

-- Integrations config
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type integration_type NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks config
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API keys for external access
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{"read"}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
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

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user has any CRM role
CREATE OR REPLACE FUNCTION public.has_any_crm_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies  
CREATE POLICY "Users can view roles" ON public.user_roles
  FOR SELECT USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Pipeline stages policies
CREATE POLICY "CRM users can view stages" ON public.pipeline_stages
  FOR SELECT USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "Admins can manage stages" ON public.pipeline_stages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Leads policies
CREATE POLICY "CRM users can view leads" ON public.leads
  FOR SELECT USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can insert leads" ON public.leads
  FOR INSERT WITH CHECK (public.has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can update leads" ON public.leads
  FOR UPDATE USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can delete leads" ON public.leads
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Lead activities policies
CREATE POLICY "CRM users can view activities" ON public.lead_activities
  FOR SELECT USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can insert activities" ON public.lead_activities
  FOR INSERT WITH CHECK (public.has_any_crm_role(auth.uid()));

-- Campaigns policies
CREATE POLICY "CRM users can view campaigns" ON public.campaigns
  FOR SELECT USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage campaigns" ON public.campaigns
  FOR ALL USING (public.has_any_crm_role(auth.uid()));

-- Campaign recipients policies
CREATE POLICY "CRM users can view recipients" ON public.campaign_recipients
  FOR SELECT USING (public.has_any_crm_role(auth.uid()));
CREATE POLICY "CRM users can manage recipients" ON public.campaign_recipients
  FOR ALL USING (public.has_any_crm_role(auth.uid()));

-- Integrations policies (admins only)
CREATE POLICY "Admins can view integrations" ON public.integrations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage integrations" ON public.integrations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Webhooks policies (admins only)
CREATE POLICY "Admins can view webhooks" ON public.webhooks
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage webhooks" ON public.webhooks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- API keys policies (admins only)
CREATE POLICY "Admins can view api_keys" ON public.api_keys
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage api_keys" ON public.api_keys
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default pipeline stages
INSERT INTO public.pipeline_stages (name, color, position) VALUES
  ('Novo Lead', '#3B82F6', 0),
  ('Qualificado', '#F59E0B', 1),
  ('Visita Agendada', '#8B5CF6', 2),
  ('Proposta Enviada', '#EC4899', 3),
  ('Negociação', '#F97316', 4),
  ('Venda Fechada', '#22C55E', 5),
  ('Perdido', '#EF4444', 6);

UPDATE public.pipeline_stages SET is_won = true WHERE name = 'Venda Fechada';
UPDATE public.pipeline_stages SET is_lost = true WHERE name = 'Perdido';

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
