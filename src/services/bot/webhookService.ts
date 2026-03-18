import { supabase } from "@/integrations/supabase/client";

export interface WebhookPayload {
  phone: string;
  message: string;
  sender_name?: string;
  origin?: string;
}

export interface WebhookResponse {
  status: string;
  lead_id: string;
  phone: string;
  bot_response: string;
  conversation_state: string;
  score: number;
  score_classification: string;
  handoff: boolean;
  handoff_reason: string | null;
  score_events: string[];
  detected: {
    profile: string | null;
    objective: string | null;
    area: string | null;
  };
}

export async function sendWebhookMessage(payload: WebhookPayload): Promise<WebhookResponse> {
  const { data, error } = await supabase.functions.invoke("openclaw-webhook", {
    body: payload,
  });

  if (error) throw new Error(`Webhook error: ${error.message}`);
  return data as WebhookResponse;
}
