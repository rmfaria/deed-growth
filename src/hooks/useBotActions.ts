import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useHandoffLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: string; reason: string }) => {
      const { error: e1 } = await supabase.from("bot_leads").update({
        human_handoff: true,
        handoff_reason: reason,
        attendance_status: "aguardando_humano",
        conversation_state: "TRANSFERENCIA_HUMANA",
        updated_at: new Date().toISOString(),
      }).eq("id", leadId);
      if (e1) throw e1;

      const { error: e2 } = await supabase.from("bot_handoffs").insert({
        lead_id: leadId,
        reason,
        status: "pendente",
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-leads"] });
      qc.invalidateQueries({ queryKey: ["bot-lead"] });
      qc.invalidateQueries({ queryKey: ["bot-handoffs"] });
      toast.success("Lead transferido para atendimento humano.");
    },
    onError: () => toast.error("Erro ao transferir lead."),
  });
}

export function useScheduleVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, scheduledAt, notes }: { leadId: string; scheduledAt?: string; notes?: string }) => {
      const { error: e1 } = await supabase.from("bot_visits").insert({
        lead_id: leadId,
        scheduled_at: scheduledAt || null,
        status: "solicitada",
        notes: notes || "Agendamento manual via painel",
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase.from("bot_leads").update({
        visit_interest: true,
        updated_at: new Date().toISOString(),
      }).eq("id", leadId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-leads"] });
      qc.invalidateQueries({ queryKey: ["bot-lead"] });
      qc.invalidateQueries({ queryKey: ["bot-visits"] });
      toast.success("Visita agendada com sucesso.");
    },
    onError: () => toast.error("Erro ao agendar visita."),
  });
}

export function useSendMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, materialNames }: { leadId: string; materialNames: string[] }) => {
      const { error } = await supabase.from("bot_messages").insert({
        lead_id: leadId,
        direction: "outbound",
        content: `[Material enviado: ${materialNames.join(", ")}]`,
        message_type: "material",
      });
      if (error) throw error;

      await supabase.from("score_events").insert({
        lead_id: leadId,
        event_type: "material_solicitado",
        points: 20,
        description: `Material enviado via painel: ${materialNames.join(", ")}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-messages"] });
      qc.invalidateQueries({ queryKey: ["score-events"] });
      toast.success("Material registrado como enviado.");
    },
    onError: () => toast.error("Erro ao registrar envio de material."),
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, note }: { leadId: string; note: string }) => {
      const { error } = await supabase.from("bot_messages").insert({
        lead_id: leadId,
        direction: "outbound",
        content: `[Observação: ${note}]`,
        message_type: "note",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-messages"] });
      toast.success("Observação adicionada.");
    },
    onError: () => toast.error("Erro ao adicionar observação."),
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mat: { name: string; type: string; url?: string; category?: string }) => {
      const { error } = await supabase.from("bot_materials").insert({
        name: mat.name,
        type: mat.type,
        url: mat.url || null,
        category: mat.category || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-materials"] });
      toast.success("Material criado.");
    },
    onError: () => toast.error("Erro ao criar material."),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; name?: string; type?: string; url?: string; category?: string; is_active?: boolean }) => {
      const { error } = await supabase.from("bot_materials").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-materials"] });
      toast.success("Material atualizado.");
    },
    onError: () => toast.error("Erro ao atualizar material."),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bot_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-materials"] });
      toast.success("Material removido.");
    },
    onError: () => toast.error("Erro ao remover material."),
  });
}
