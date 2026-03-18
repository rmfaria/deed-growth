import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Score rules ───
const SCORE_MAP: Record<string, { points: number; description: string }> = {
  perfil_respondido: { points: 10, description: "Respondeu perfil" },
  objetivo_informado: { points: 10, description: "Informou objetivo" },
  metragem_informada: { points: 10, description: "Informou metragem" },
  material_solicitado: { points: 20, description: "Solicitou material" },
  planta_solicitada: { points: 15, description: "Solicitou planta" },
  visita_aceita: { points: 25, description: "Aceitou visita" },
  proposta_solicitada: { points: 30, description: "Solicitou proposta" },
};

// ─── Handoff triggers (keywords) ───
const HANDOFF_KEYWORDS = [
  "proposta personalizada",
  "visita",
  "desconto",
  "negociar",
  "veículo na entrada",
  "carro na entrada",
  "condição especial",
  "condição diferenciada",
  "falar com alguém",
  "falar com humano",
  "atendente",
];

// ─── State machine transitions ───
const STATE_TRANSITIONS: Record<string, string> = {
  START: "ABERTURA",
  ABERTURA: "CONTEXTUALIZACAO",
  CONTEXTUALIZACAO: "QUALIFICACAO_PRINCIPAL",
  QUALIFICACAO_PRINCIPAL: "QUALIFICACAO_SECUNDARIA",
  QUALIFICACAO_SECUNDARIA: "APRESENTACAO_EMPREENDIMENTO",
  APRESENTACAO_EMPREENDIMENTO: "CONDICOES_COMERCIAIS",
  CONDICOES_COMERCIAIS: "CONVERSAO",
  CONVERSAO: "CONVERSAO", // stays until action
};

// ─── Bot response templates ───
const BOT_MESSAGES: Record<string, string> = {
  ABERTURA:
    "Olá! Vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o Rogério, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade.",
  CONTEXTUALIZACAO:
    "O MBC é um condomínio empresarial às margens da MG-10, próximo ao Aeroporto de Confins. Os lotes começam a partir de 1.000 m² e a região está em forte expansão logística.",
  QUALIFICACAO_PRINCIPAL:
    "Você está avaliando para instalar sua empresa ou pensando como investimento?",
  QUALIFICACAO_SECUNDARIA_EMPRESA:
    "Ótimo! Qual tipo de operação você pretende instalar e qual a metragem necessária?",
  QUALIFICACAO_SECUNDARIA_INVESTIMENTO:
    "Interessante! Você busca valorização patrimonial ou pensa em construir um galpão para renda?",
  APRESENTACAO_EMPREENDIMENTO:
    "O MBC oferece: ruas de 10m de largura com asfalto para carretas, rotatórias para manobra, portaria com segurança 24h, energia Cemig, água Copasa e internet. Localização privilegiada a 3km do Aeroporto de Confins.",
  CONDICOES_COMERCIAIS:
    "As condições são: preço base R$ 530.000, entrada de 20%, saldo em até 24 parcelas (Price – 0,99% a.m.), condomínio aproximado de R$ 500/mês.",
  CONVERSAO:
    "Posso te enviar o material completo do empreendimento? Ou se preferir, posso enviar a planta ou agendar uma visita. O que faz mais sentido para você?",
  TRANSFERENCIA_HUMANA:
    "Vou te conectar com um consultor que vai cuidar de tudo para você. Em breve ele entrará em contato!",
};

function classifyScore(score: number): string {
  if (score >= 51) return "quente";
  if (score >= 21) return "morno";
  return "frio";
}

function detectProfile(text: string): string | null {
  const lower = text.toLowerCase();
  if (/empresa|instalar|galpão|logística|operação|sede|escritório|depósito|distribuição/.test(lower))
    return "empresa";
  if (/invest|valorização|patrimôn|renda|revender|comprar/.test(lower)) return "investimento";
  return null;
}

function detectObjective(text: string): string | null {
  const lower = text.toLowerCase();
  const objectives = [
    "centro de distribuição", "galpão", "logística", "sede", "escritório",
    "depósito", "valorização", "renda", "revender", "construir",
  ];
  for (const obj of objectives) {
    if (lower.includes(obj)) return obj;
  }
  return null;
}

function detectArea(text: string): string | null {
  const match = text.match(/(\d[\d.,]*)\s*m[²2]?/i);
  return match ? `${match[1]} m²` : null;
}

function detectHandoffTrigger(text: string): string | null {
  const lower = text.toLowerCase();
  for (const keyword of HANDOFF_KEYWORDS) {
    if (lower.includes(keyword)) return keyword;
  }
  return null;
}

function detectScoreEvents(text: string, lead: any): string[] {
  const events: string[] = [];
  const lower = text.toLowerCase();

  if (detectProfile(text) && !lead.profile_type) events.push("perfil_respondido");
  if (detectObjective(text) && !lead.objective) events.push("objetivo_informado");
  if (detectArea(text) && !lead.desired_area) events.push("metragem_informada");
  if (/material|apresentação|book|brochura/.test(lower)) events.push("material_solicitado");
  if (/planta/.test(lower)) events.push("planta_solicitada");
  if (/visita|conhecer|ir até|ver pessoalmente/.test(lower)) events.push("visita_aceita");
  if (/proposta|orçamento|simulação/.test(lower)) events.push("proposta_solicitada");

  return events;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();

    // ─── Validate payload ───
    const { phone, message, sender_name, origin } = body;

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phone, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedPhone = String(phone).replace(/[^\d+() -]/g, "").slice(0, 30);
    const sanitizedMessage = String(message).slice(0, 2000);
    const sanitizedName = sender_name ? String(sender_name).slice(0, 200) : "Lead WhatsApp";
    const sanitizedOrigin = origin ? String(origin).slice(0, 100) : "whatsapp";

    // ─── Find or create lead ───
    let { data: lead } = await supabase
      .from("bot_leads")
      .select("*")
      .eq("phone", sanitizedPhone)
      .maybeSingle();

    if (!lead) {
      const { data: newLead, error: createError } = await supabase
        .from("bot_leads")
        .insert({
          name: sanitizedName,
          phone: sanitizedPhone,
          origin: sanitizedOrigin,
          conversation_state: "START",
          score: 0,
          score_classification: "frio",
          attendance_status: "bot",
        })
        .select()
        .single();

      if (createError) throw new Error(`Failed to create lead: ${createError.message}`);
      lead = newLead;
    }

    // ─── Save inbound message ───
    await supabase.from("bot_messages").insert({
      lead_id: lead.id,
      direction: "inbound",
      content: sanitizedMessage,
      message_type: "text",
    });

    // ─── If already handed off, skip bot processing ───
    if (lead.attendance_status === "em_atendimento" || lead.attendance_status === "atendido" || lead.attendance_status === "encerrado") {
      return new Response(
        JSON.stringify({
          status: "skipped",
          reason: "Lead is being handled by human",
          lead_id: lead.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Detect score events ───
    const scoreEvents = detectScoreEvents(sanitizedMessage, lead);
    let totalNewPoints = 0;

    for (const eventType of scoreEvents) {
      const rule = SCORE_MAP[eventType];
      if (rule) {
        await supabase.from("score_events").insert({
          lead_id: lead.id,
          event_type: eventType,
          points: rule.points,
          description: rule.description,
        });
        totalNewPoints += rule.points;
      }
    }

    // ─── Update lead fields ───
    const updates: Record<string, any> = {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const detectedProfile = detectProfile(sanitizedMessage);
    if (detectedProfile && !lead.profile_type) updates.profile_type = detectedProfile;

    const detectedObjective = detectObjective(sanitizedMessage);
    if (detectedObjective && !lead.objective) updates.objective = detectedObjective;

    const detectedArea = detectArea(sanitizedMessage);
    if (detectedArea && !lead.desired_area) updates.desired_area = detectedArea;

    if (/constru|galpão para/.test(sanitizedMessage.toLowerCase())) {
      updates.construction_interest = true;
    }

    // ─── Update score ───
    const newScore = lead.score + totalNewPoints;
    updates.score = newScore;
    updates.score_classification = classifyScore(newScore);

    // ─── Check for handoff triggers ───
    const handoffTrigger = detectHandoffTrigger(sanitizedMessage);
    const isHotLead = newScore >= 51;
    const needsHandoff = !!handoffTrigger || isHotLead;

    let botResponse: string;

    if (needsHandoff) {
      const reason = handoffTrigger
        ? `Detectado: ${handoffTrigger}`
        : "Score alto (lead quente)";

      updates.human_handoff = true;
      updates.handoff_reason = reason;
      updates.attendance_status = "aguardando_humano";
      updates.conversation_state = "TRANSFERENCIA_HUMANA";

      if (/visita|conhecer|ir até/.test(sanitizedMessage.toLowerCase())) {
        updates.visit_interest = true;
        await supabase.from("bot_visits").insert({
          lead_id: lead.id,
          status: "solicitada",
          notes: `Solicitado via WhatsApp: "${sanitizedMessage.slice(0, 200)}"`,
        });
      }

      await supabase.from("bot_handoffs").insert({
        lead_id: lead.id,
        reason,
        status: "pendente",
      });

      botResponse = BOT_MESSAGES.TRANSFERENCIA_HUMANA;
    } else {
      // ─── Advance conversation state ───
      const currentState = lead.conversation_state || "START";
      let nextState = STATE_TRANSITIONS[currentState] || currentState;

      // Special handling for qualification branching
      if (currentState === "QUALIFICACAO_PRINCIPAL" && detectedProfile) {
        nextState = "QUALIFICACAO_SECUNDARIA";
      }

      updates.conversation_state = nextState;

      // Pick bot response
      if (nextState === "QUALIFICACAO_SECUNDARIA") {
        const profile = updates.profile_type || lead.profile_type;
        botResponse =
          profile === "empresa"
            ? BOT_MESSAGES.QUALIFICACAO_SECUNDARIA_EMPRESA
            : BOT_MESSAGES.QUALIFICACAO_SECUNDARIA_INVESTIMENTO;
      } else {
        botResponse = BOT_MESSAGES[nextState] || BOT_MESSAGES.CONVERSAO;
      }
    }

    // ─── Save bot response ───
    await supabase.from("bot_messages").insert({
      lead_id: lead.id,
      direction: "outbound",
      content: botResponse,
      message_type: "text",
    });

    // ─── Update lead ───
    await supabase.from("bot_leads").update(updates).eq("id", lead.id);

    // ─── Build response payload for WhatsApp provider / OpenClaw ───
    const responsePayload = {
      status: "processed",
      lead_id: lead.id,
      phone: sanitizedPhone,
      bot_response: botResponse,
      conversation_state: updates.conversation_state || lead.conversation_state,
      score: newScore,
      score_classification: classifyScore(newScore),
      handoff: needsHandoff,
      handoff_reason: needsHandoff ? updates.handoff_reason : null,
      score_events: scoreEvents,
      detected: {
        profile: detectedProfile,
        objective: detectedObjective,
        area: detectedArea,
      },
    };

    console.log(`[openclaw-webhook] Processed message from ${sanitizedPhone} | State: ${responsePayload.conversation_state} | Score: ${newScore}`);

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[openclaw-webhook] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
