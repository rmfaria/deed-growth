import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BotLead, BotMessage, ScoreEvent, BotMaterial, BotVisit, BotHandoff } from "@/services/bot/types";

const castLead = (row: any): BotLead => ({
  ...row,
  score: row.score ?? 0,
  score_classification: row.score_classification ?? 'frio',
  attendance_status: row.attendance_status ?? 'bot',
  conversation_state: row.conversation_state ?? 'START',
  construction_interest: row.construction_interest ?? false,
  visit_interest: row.visit_interest ?? false,
  human_handoff: row.human_handoff ?? false,
  created_at: row.created_at ?? '',
  updated_at: row.updated_at ?? '',
});

export function useBotLeads() {
  return useQuery({
    queryKey: ["bot-leads"],
    queryFn: async (): Promise<BotLead[]> => {
      const { data, error } = await supabase
        .from("bot_leads")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map(castLead);
    },
  });
}

export function useBotLead(id: string | undefined) {
  return useQuery({
    queryKey: ["bot-lead", id],
    queryFn: async (): Promise<BotLead | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("bot_leads")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? castLead(data) : null;
    },
    enabled: !!id,
  });
}

export function useBotMessages(leadId: string | undefined) {
  return useQuery({
    queryKey: ["bot-messages", leadId],
    queryFn: async (): Promise<BotMessage[]> => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("bot_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        ...m,
        metadata: m.metadata ?? {},
        message_type: m.message_type ?? 'text',
        created_at: m.created_at ?? '',
      }));
    },
    enabled: !!leadId,
  });
}

export function useScoreEvents(leadId: string | undefined) {
  return useQuery({
    queryKey: ["score-events", leadId],
    queryFn: async (): Promise<ScoreEvent[]> => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("score_events")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((e: any) => ({
        ...e,
        created_at: e.created_at ?? '',
      }));
    },
    enabled: !!leadId,
  });
}

export function useBotMaterials() {
  return useQuery({
    queryKey: ["bot-materials"],
    queryFn: async (): Promise<BotMaterial[]> => {
      const { data, error } = await supabase
        .from("bot_materials")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        ...m,
        is_active: m.is_active ?? true,
        created_at: m.created_at ?? '',
        updated_at: m.updated_at ?? '',
      }));
    },
  });
}

export function useBotVisits(leadId?: string) {
  return useQuery({
    queryKey: ["bot-visits", leadId ?? "all"],
    queryFn: async (): Promise<BotVisit[]> => {
      let q = supabase.from("bot_visits").select("*").order("created_at", { ascending: false });
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((v: any) => ({
        ...v,
        status: v.status ?? 'solicitada',
        created_at: v.created_at ?? '',
      }));
    },
  });
}

export function useBotHandoffs(leadId?: string) {
  return useQuery({
    queryKey: ["bot-handoffs", leadId ?? "all"],
    queryFn: async (): Promise<BotHandoff[]> => {
      let q = supabase.from("bot_handoffs").select("*").order("created_at", { ascending: false });
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((h: any) => ({
        ...h,
        status: h.status ?? 'pendente',
        created_at: h.created_at ?? '',
      }));
    },
  });
}

export function useBotConfig() {
  return useQuery({
    queryKey: ["bot-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_config")
        .select("*");
      if (error) throw error;
      const config: Record<string, any> = {};
      (data ?? []).forEach((row: any) => {
        config[row.key] = row.value;
      });
      return config;
    },
  });
}
