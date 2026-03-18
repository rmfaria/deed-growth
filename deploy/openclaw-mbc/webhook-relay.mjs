/**
 * OpenClaw MBC — Bot Engine
 *
 * Central hub for the MBC WhatsApp pre-sales bot.
 * Processes all messages locally (no forwarding to Supabase Edge Functions).
 *
 * Services:
 *   1. openclawWebhookReceiver  — receives inbound WhatsApp messages
 *   2. conversationStateService — manages the conversation state machine
 *   3. leadScoringService       — calculates and updates lead scores
 *   4. handoffRouterService     — detects handoff triggers, routes to human
 *   5. materialDispatchService  — sends materials via WhatsApp
 *   6. visitSchedulingService   — creates and manages visit requests
 *   7. whatsappMessageService   — sends outbound messages via WhatsApp API
 *
 * Persistence: Supabase (PostgreSQL) via REST API
 * Monitoring:  orbit-core event/metric ingestion
 */

import { createServer } from "node:http";

// ── Environment ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3020", 10);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const ORBIT_CORE_URL = process.env.ORBIT_CORE_URL || "";
const ORBIT_API_KEY = process.env.ORBIT_API_KEY || "";
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "";
const WHATSAPP_INSTANCE = process.env.WHATSAPP_INSTANCE || "mbc";

// ── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function fetchJSON(url, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await resp.text();
  try {
    return { ok: resp.ok, status: resp.status, data: JSON.parse(text) };
  } catch {
    return { ok: resp.ok, status: resp.status, data: text };
  }
}

function log(service, msg, data) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${service}] ${msg}`, data ? JSON.stringify(data) : "");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

// ── Supabase Client ─────────────────────────────────────────────────────────

const supabase = {
  async query(table, method, params = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "INSERT" ? "return=representation" : "return=representation",
    };

    if (method === "SELECT") {
      const qs = Object.entries(params.filters || {}).map(([k, v]) => `${k}=eq.${v}`).join("&");
      if (qs) url += `?${qs}`;
      if (params.single) headers.Accept = "application/vnd.pgrst.object+json";
      const r = await fetchJSON(url, { method: "GET", headers });
      return r.data;
    }

    if (method === "INSERT") {
      url += "?select=*";
      const r = await fetchJSON(url, { method: "POST", headers, body: JSON.stringify(params.body) });
      return Array.isArray(r.data) ? r.data[0] : r.data;
    }

    if (method === "UPDATE") {
      const qs = Object.entries(params.filters || {}).map(([k, v]) => `${k}=eq.${v}`).join("&");
      url += `?${qs}&select=*`;
      const r = await fetchJSON(url, { method: "PATCH", headers, body: JSON.stringify(params.body) });
      return Array.isArray(r.data) ? r.data[0] : r.data;
    }
  },

  async selectOne(table, filters) {
    return this.query(table, "SELECT", { filters, single: true });
  },
  async selectMany(table, filters) {
    return this.query(table, "SELECT", { filters });
  },
  async insert(table, body) {
    return this.query(table, "INSERT", { body });
  },
  async update(table, filters, body) {
    return this.query(table, "UPDATE", { filters, body });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG LOADER — reads bot_config from Supabase (cached 60s)
// ═══════════════════════════════════════════════════════════════════════════

let _configCache = {};
let _configLoadedAt = 0;
const CONFIG_TTL_MS = 60_000;

async function loadBotConfig() {
  if (Date.now() - _configLoadedAt < CONFIG_TTL_MS) return _configCache;
  try {
    const rows = await supabase.selectMany("bot_config", {});
    const config = {};
    if (Array.isArray(rows)) {
      for (const row of rows) {
        try { config[row.key] = JSON.parse(row.value); } catch { config[row.key] = row.value; }
      }
    }
    _configCache = config;
    _configLoadedAt = Date.now();
    log("configLoader", "config loaded", { keys: Object.keys(config) });
  } catch (err) {
    log("configLoader", "failed to load config, using cache", { error: err.message });
  }
  return _configCache;
}

function getConfig(key, fallback) {
  return _configCache[key] !== undefined ? _configCache[key] : fallback;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 1: conversationStateService
// ═══════════════════════════════════════════════════════════════════════════

const STATE_TRANSITIONS = {
  START: "ABERTURA",
  ABERTURA: "CONTEXTUALIZACAO",
  CONTEXTUALIZACAO: "QUALIFICACAO_PRINCIPAL",
  QUALIFICACAO_PRINCIPAL: "QUALIFICACAO_SECUNDARIA",
  QUALIFICACAO_SECUNDARIA: "APRESENTACAO_EMPREENDIMENTO",
  APRESENTACAO_EMPREENDIMENTO: "CONDICOES_COMERCIAIS",
  CONDICOES_COMERCIAIS: "CONVERSAO",
  CONVERSAO: "CONVERSAO", // stays until action
};

function getBotMessages() {
  const persona = getConfig("persona", "Rogério");
  const openingMsg = getConfig("opening_message",
    "Olá! Vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o {persona}, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade.");
  const contextMsg = getConfig("context_message",
    "O MBC é um condomínio empresarial às margens da MG-10, próximo ao Aeroporto de Confins. Os lotes começam a partir de 1.000 m² e a região está em forte expansão logística.");
  const transferMsg = getConfig("transfer_message",
    "Vou te conectar com um consultor que vai cuidar de tudo para você. Em breve ele entrará em contato!");

  return {
    ABERTURA: openingMsg.replace("{persona}", persona).replace(/\{persona\}/g, persona),
    CONTEXTUALIZACAO: contextMsg,
    TRANSFERENCIA_HUMANA: transferMsg,
  };
}

const BOT_MESSAGES_STATIC = {
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
};

const conversationStateService = {
  getNextState(currentState, detectedProfile) {
    if (currentState === "QUALIFICACAO_PRINCIPAL" && detectedProfile) {
      return "QUALIFICACAO_SECUNDARIA";
    }
    return STATE_TRANSITIONS[currentState] || currentState;
  },

  getBotResponse(state, profileType) {
    const dynamic = getBotMessages();
    const msgs = { ...BOT_MESSAGES_STATIC, ...dynamic };
    if (state === "QUALIFICACAO_SECUNDARIA") {
      return profileType === "empresa"
        ? msgs.QUALIFICACAO_SECUNDARIA_EMPRESA
        : msgs.QUALIFICACAO_SECUNDARIA_INVESTIMENTO;
    }
    return msgs[state] || msgs.CONVERSAO;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 2: leadScoringService
// ═══════════════════════════════════════════════════════════════════════════

const SCORE_MAP = {
  perfil_respondido:   { points: 10, description: "Respondeu perfil" },
  objetivo_informado:  { points: 10, description: "Informou objetivo" },
  metragem_informada:  { points: 10, description: "Informou metragem" },
  material_solicitado: { points: 20, description: "Solicitou material" },
  planta_solicitada:   { points: 15, description: "Solicitou planta" },
  visita_aceita:       { points: 25, description: "Aceitou visita" },
  proposta_solicitada: { points: 30, description: "Solicitou proposta" },
};

const leadScoringService = {
  classifyScore(score) {
    if (score >= 51) return "quente";
    if (score >= 21) return "morno";
    return "frio";
  },

  detectProfile(text) {
    const lower = text.toLowerCase();
    if (/empresa|instalar|galpão|logística|operação|sede|escritório|depósito|distribuição/.test(lower))
      return "empresa";
    if (/invest|valorização|patrimôn|renda|revender|comprar/.test(lower))
      return "investimento";
    return null;
  },

  detectObjective(text) {
    const lower = text.toLowerCase();
    const objectives = [
      "centro de distribuição", "galpão", "logística", "sede", "escritório",
      "depósito", "valorização", "renda", "revender", "construir",
    ];
    for (const obj of objectives) {
      if (lower.includes(obj)) return obj;
    }
    return null;
  },

  detectArea(text) {
    const match = text.match(/(\d[\d.,]*)\s*m[²2]?/i);
    return match ? `${match[1]} m²` : null;
  },

  detectScoreEvents(text, lead) {
    const events = [];
    const lower = text.toLowerCase();

    if (this.detectProfile(text) && !lead.profile_type) events.push("perfil_respondido");
    if (this.detectObjective(text) && !lead.objective) events.push("objetivo_informado");
    if (this.detectArea(text) && !lead.desired_area) events.push("metragem_informada");
    if (/material|apresentação|book|brochura/.test(lower)) events.push("material_solicitado");
    if (/planta/.test(lower)) events.push("planta_solicitada");
    if (/visita|conhecer|ir até|ver pessoalmente/.test(lower)) events.push("visita_aceita");
    if (/proposta|orçamento|simulação/.test(lower)) events.push("proposta_solicitada");

    return events;
  },

  async persistScoreEvents(leadId, events) {
    let totalPoints = 0;
    for (const eventType of events) {
      const rule = SCORE_MAP[eventType];
      if (rule) {
        await supabase.insert("score_events", {
          lead_id: leadId,
          event_type: eventType,
          points: rule.points,
          description: rule.description,
        });
        totalPoints += rule.points;
      }
    }
    return totalPoints;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 3: handoffRouterService
// ═══════════════════════════════════════════════════════════════════════════

const HANDOFF_KEYWORDS = [
  "proposta personalizada", "visita", "desconto", "negociar",
  "veículo na entrada", "carro na entrada", "condição especial",
  "condição diferenciada", "falar com alguém", "falar com humano", "atendente",
];

const handoffRouterService = {
  detectTrigger(text) {
    const lower = text.toLowerCase();
    for (const keyword of HANDOFF_KEYWORDS) {
      if (lower.includes(keyword)) return keyword;
    }
    return null;
  },

  needsHandoff(text, score) {
    const trigger = this.detectTrigger(text);
    const autoHandoff = getConfig("auto_handoff_hot", true);
    const isHotLead = autoHandoff && score >= 51;
    return {
      needed: !!trigger || isHotLead,
      reason: trigger ? `Detectado: ${trigger}` : isHotLead ? "Score alto (lead quente)" : null,
    };
  },

  async createHandoff(leadId, reason) {
    await supabase.insert("bot_handoffs", {
      lead_id: leadId,
      reason,
      status: "pendente",
    });
    log("handoffRouter", "handoff created", { leadId, reason });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 4: materialDispatchService
// ═══════════════════════════════════════════════════════════════════════════

const materialDispatchService = {
  detectMaterialRequest(text) {
    const lower = text.toLowerCase();
    const requests = [];
    if (/material|apresentação|book|brochura/.test(lower)) requests.push("apresentacao");
    if (/planta/.test(lower)) requests.push("planta");
    if (/mapa|localização|como chegar/.test(lower)) requests.push("mapa");
    if (/tabela|preço|valores/.test(lower)) requests.push("tabela");
    if (/vídeo|video/.test(lower)) requests.push("video");
    return requests;
  },

  async getActiveMaterials(types) {
    const materials = await supabase.selectMany("bot_materials", { is_active: true });
    if (!Array.isArray(materials)) return [];
    return materials.filter((m) => types.includes(m.type));
  },

  async dispatch(leadId, text) {
    const requested = this.detectMaterialRequest(text);
    if (requested.length === 0) return [];

    const materials = await this.getActiveMaterials(requested);
    const sent = [];

    for (const material of materials) {
      // Send via WhatsApp
      await whatsappMessageService.sendMedia(leadId, material.url, material.name);
      sent.push({ type: material.type, name: material.name });
    }

    if (sent.length > 0) {
      log("materialDispatch", "materials sent", { leadId, sent });
    }
    return sent;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 5: visitSchedulingService
// ═══════════════════════════════════════════════════════════════════════════

const visitSchedulingService = {
  detectVisitIntent(text) {
    return /visita|conhecer|ir até|ver pessoalmente|agendar/.test(text.toLowerCase());
  },

  async createVisitRequest(leadId, message) {
    await supabase.insert("bot_visits", {
      lead_id: leadId,
      status: "solicitada",
      notes: `Solicitado via WhatsApp: "${message.slice(0, 200)}"`,
    });
    log("visitScheduling", "visit request created", { leadId });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 6: whatsappMessageService
// ═══════════════════════════════════════════════════════════════════════════

const whatsappMessageService = {
  async sendText(phone, text) {
    if (!WHATSAPP_API_URL) {
      log("whatsappMessage", "WHATSAPP_API_URL not set — skipping send", { phone });
      return { sent: false, reason: "api_not_configured" };
    }

    try {
      const result = await fetchJSON(`${WHATSAPP_API_URL}/message/sendText/${WHATSAPP_INSTANCE}`, {
        method: "POST",
        headers: { apikey: WHATSAPP_API_KEY },
        body: JSON.stringify({
          number: phone,
          text,
        }),
      });

      log("whatsappMessage", "text sent", { phone, ok: result.ok });
      return { sent: result.ok, data: result.data };
    } catch (err) {
      log("whatsappMessage", "send failed", { phone, error: err.message });
      return { sent: false, error: err.message };
    }
  },

  detectMediaType(url) {
    const lower = (url || "").toLowerCase();
    if (/\.(mp4|mov|avi|webm|3gp)/.test(lower)) return "video";
    if (/\.(jpg|jpeg|png|gif|webp|bmp)/.test(lower)) return "image";
    if (/\.(mp3|ogg|opus|wav|aac)/.test(lower)) return "audio";
    return "document";
  },

  getFileName(url) {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split("/").pop() || "file";
    } catch {
      return url.split("/").pop() || "file";
    }
  },

  async sendMedia(phone, mediaUrl, caption) {
    if (!WHATSAPP_API_URL) return { sent: false, reason: "api_not_configured" };

    try {
      const mediatype = this.detectMediaType(mediaUrl);
      const fileName = this.getFileName(mediaUrl);

      const result = await fetchJSON(`${WHATSAPP_API_URL}/message/sendMedia/${WHATSAPP_INSTANCE}`, {
        method: "POST",
        headers: { apikey: WHATSAPP_API_KEY },
        body: JSON.stringify({
          number: phone,
          mediatype,
          media: mediaUrl,
          caption: caption || "",
          fileName,
        }),
      });

      log("whatsappMessage", "media sent", { phone, mediatype, fileName, ok: result.ok });
      return { sent: result.ok, data: result.data };
    } catch (err) {
      log("whatsappMessage", "media send failed", { phone, error: err.message });
      return { sent: false, error: err.message };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 7: openclawWebhookReceiver (ORCHESTRATOR)
// ═══════════════════════════════════════════════════════════════════════════

const openclawWebhookReceiver = {
  sanitize(body) {
    return {
      phone: String(body.phone || "").replace(/[^\d+() -]/g, "").slice(0, 30),
      message: String(body.message || "").slice(0, 2000),
      senderName: body.sender_name ? String(body.sender_name).slice(0, 200) : "Lead WhatsApp",
      origin: body.origin ? String(body.origin).slice(0, 100) : "whatsapp",
    };
  },

  async findOrCreateLead(phone, senderName, origin) {
    let lead = await supabase.selectOne("bot_leads", { phone });

    if (!lead || lead.code === "PGRST116") {
      lead = await supabase.insert("bot_leads", {
        name: senderName,
        phone,
        origin,
        conversation_state: "START",
        score: 0,
        score_classification: "frio",
        attendance_status: "bot",
      });
      log("webhookReceiver", "lead created", { id: lead.id, phone });
    }

    return lead;
  },

  async process(body) {
    const { phone, message, senderName, origin } = this.sanitize(body);

    if (!phone || !message) {
      return { status: 400, body: { error: "Missing required fields: phone, message" } };
    }

    // ── Load config from bot_config table ──
    await loadBotConfig();

    // ── Find or create lead ──
    const lead = await this.findOrCreateLead(phone, senderName, origin);

    // ── Save inbound message ──
    await supabase.insert("bot_messages", {
      lead_id: lead.id,
      direction: "inbound",
      content: message,
      message_type: "text",
    });

    // ── Skip if already handled by human ──
    if (["em_atendimento", "atendido", "encerrado"].includes(lead.attendance_status)) {
      log("webhookReceiver", "skipped — human handling", { leadId: lead.id });
      return {
        status: 200,
        body: { status: "skipped", reason: "Lead is being handled by human", lead_id: lead.id },
      };
    }

    // ── leadScoringService: detect & persist score events ──
    const scoreEvents = leadScoringService.detectScoreEvents(message, lead);
    const newPoints = await leadScoringService.persistScoreEvents(lead.id, scoreEvents);
    const newScore = lead.score + newPoints;
    const classification = leadScoringService.classifyScore(newScore);

    // ── Build lead updates ──
    const updates = {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      score: newScore,
      score_classification: classification,
    };

    const detectedProfile = leadScoringService.detectProfile(message);
    if (detectedProfile && !lead.profile_type) updates.profile_type = detectedProfile;

    const detectedObjective = leadScoringService.detectObjective(message);
    if (detectedObjective && !lead.objective) updates.objective = detectedObjective;

    const detectedArea = leadScoringService.detectArea(message);
    if (detectedArea && !lead.desired_area) updates.desired_area = detectedArea;

    if (/constru|galpão para/.test(message.toLowerCase())) {
      updates.construction_interest = true;
    }

    // ── handoffRouterService: check if needs human ──
    const handoff = handoffRouterService.needsHandoff(message, newScore);
    let botResponse;

    if (handoff.needed) {
      updates.human_handoff = true;
      updates.handoff_reason = handoff.reason;
      updates.attendance_status = "aguardando_humano";
      updates.conversation_state = "TRANSFERENCIA_HUMANA";

      await handoffRouterService.createHandoff(lead.id, handoff.reason);

      // ── visitSchedulingService: check visit intent ──
      if (visitSchedulingService.detectVisitIntent(message)) {
        updates.visit_interest = true;
        await visitSchedulingService.createVisitRequest(lead.id, message);
      }

      botResponse = getBotMessages().TRANSFERENCIA_HUMANA;
    } else {
      // ── conversationStateService: advance state ──
      const currentState = lead.conversation_state || "START";
      const lower = message.toLowerCase();

      // Special handling for CONVERSAO state — detect affirmative responses
      if (currentState === "CONVERSAO") {
        const wantsMaterial = /material|sim|pode|enviar|manda|quero|ok|claro|por favor|apresentação|book|brochura/i.test(lower);
        const wantsPlanta = /planta/i.test(lower);
        const wantsVisita = /visita|conhecer|ir até|ver pessoalmente|agendar/i.test(lower);
        const wantsProposal = /proposta|orçamento|valores|preço/i.test(lower);
        const wantsHuman = /falar|humano|atendente|consultor|alguém/i.test(lower);

        if (wantsVisita || wantsProposal || wantsHuman) {
          // Trigger handoff for high-intent actions
          const reason = wantsVisita ? "Lead solicitou visita" : wantsProposal ? "Lead solicitou proposta" : "Lead pediu atendimento humano";
          updates.human_handoff = true;
          updates.handoff_reason = reason;
          updates.attendance_status = "aguardando_humano";
          updates.conversation_state = "TRANSFERENCIA_HUMANA";
          if (wantsVisita) {
            updates.visit_interest = true;
            await visitSchedulingService.createVisitRequest(lead.id, message);
          }
          await handoffRouterService.createHandoff(lead.id, reason);
          botResponse = getBotMessages().TRANSFERENCIA_HUMANA;
        } else if (wantsMaterial || wantsPlanta) {
          // Send materials and acknowledge
          botResponse = "Perfeito! Estou enviando o material para você. Qualquer dúvida, estou à disposição. Posso também agendar uma visita se quiser conhecer pessoalmente.";
          updates.conversation_state = "CONVERSAO";
        } else {
          // Generic affirmative or unrecognized — offer options clearly
          botResponse = "Posso te ajudar com:\n\n1️⃣ *Enviar material* do empreendimento\n2️⃣ *Enviar a planta*\n3️⃣ *Agendar uma visita*\n4️⃣ *Falar com um consultor*\n\nO que prefere?";
          updates.conversation_state = "CONVERSAO";
        }
      } else {
        const nextState = conversationStateService.getNextState(currentState, detectedProfile);
        updates.conversation_state = nextState;
        const profile = updates.profile_type || lead.profile_type;
        botResponse = conversationStateService.getBotResponse(nextState, profile);
      }
    }

    // ── Save outbound message ──
    await supabase.insert("bot_messages", {
      lead_id: lead.id,
      direction: "outbound",
      content: botResponse,
      message_type: "text",
    });

    // ── Update lead ──
    await supabase.update("bot_leads", { id: lead.id }, updates);

    // ── materialDispatchService: send materials if requested ──
    const materialsSent = await materialDispatchService.dispatch(phone, message);

    // ── whatsappMessageService: send bot response ──
    const whatsappResult = await whatsappMessageService.sendText(phone, botResponse);

    // ── Build response payload ──
    const responsePayload = {
      status: "processed",
      lead_id: lead.id,
      phone,
      bot_response: botResponse,
      conversation_state: updates.conversation_state || lead.conversation_state,
      score: newScore,
      score_classification: classification,
      handoff: handoff.needed,
      handoff_reason: handoff.reason,
      score_events: scoreEvents,
      materials_sent: materialsSent,
      whatsapp_sent: whatsappResult.sent,
      detected: {
        profile: detectedProfile,
        objective: detectedObjective,
        area: detectedArea,
      },
    };

    log("webhookReceiver", "processed", {
      lead_id: lead.id,
      state: responsePayload.conversation_state,
      score: newScore,
      handoff: handoff.needed,
      whatsapp_sent: whatsappResult.sent,
    });

    // ── Push to orbit-core (fire-and-forget) ──
    pushToOrbitCore(responsePayload);

    return { status: 200, body: responsePayload };
  },
};

// ── orbit-core monitoring (fire-and-forget) ─────────────────────────────────

async function pushToOrbitCore(data) {
  if (!ORBIT_CORE_URL || !ORBIT_API_KEY) return;

  try {
    const events = [{
      source_id: "mbc-bot",
      namespace: "mbc",
      kind: "lead_update",
      severity: data.handoff ? "high" : "low",
      asset_id: `lead-${data.lead_id}`,
      title: data.handoff
        ? `[MBC] Handoff: ${data.handoff_reason}`
        : `[MBC] Lead ${data.phone} → ${data.conversation_state}`,
      description: JSON.stringify({
        phone: data.phone,
        score: data.score,
        classification: data.score_classification,
        state: data.conversation_state,
        detected: data.detected,
      }),
      ts: new Date().toISOString(),
    }];

    const metrics = [{
      source_id: "mbc-bot",
      namespace: "mbc",
      asset_id: `lead-${data.lead_id}`,
      metric: "lead.score",
      value: data.score,
      ts: new Date().toISOString(),
    }];

    // Use /ingest/raw/mbc-bot so events are mapped via the connector DSL spec
    // and appear in connector EPS/runs tracking
    fetchJSON(`${ORBIT_CORE_URL}/api/v1/ingest/raw/mbc-bot`, {
      method: "POST",
      headers: { "X-Api-Key": ORBIT_API_KEY },
      body: JSON.stringify(events),
    }).catch((e) => log("orbitCore", "event push failed", { error: e.message }));

    fetchJSON(`${ORBIT_CORE_URL}/api/v1/ingest/metrics`, {
      method: "POST",
      headers: { "X-Api-Key": ORBIT_API_KEY },
      body: JSON.stringify(metrics),
    }).catch((e) => log("orbitCore", "metric push failed", { error: e.message }));
  } catch (err) {
    log("orbitCore", "push error", { error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════════════════

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Webhook-Secret, apikey");

  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ── Health ──
  if (url.pathname === "/health" || url.pathname === "/api/webhook/health") {
    return jsonResponse(res, 200, {
      status: "ok",
      service: "openclaw-mbc",
      uptime: process.uptime(),
      services: [
        "openclawWebhookReceiver",
        "conversationStateService",
        "leadScoringService",
        "handoffRouterService",
        "materialDispatchService",
        "visitSchedulingService",
        "whatsappMessageService",
      ],
    });
  }

  // ── Stats ──
  if (url.pathname === "/api/webhook/stats" && req.method === "GET") {
    return jsonResponse(res, 200, {
      service: "openclaw-mbc",
      uptime: process.uptime(),
      config: {
        supabase: !!SUPABASE_URL,
        orbit_core: !!ORBIT_CORE_URL,
        whatsapp_api: !!WHATSAPP_API_URL,
        webhook_secret: !!WEBHOOK_SECRET,
      },
    });
  }

  // ── Main webhook: generic format ──
  if (url.pathname === "/api/webhook/whatsapp" && req.method === "POST") {
    try {
      if (WEBHOOK_SECRET && req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
        return jsonResponse(res, 401, { error: "Unauthorized" });
      }
      const body = await readBody(req);
      const result = await openclawWebhookReceiver.process(body);
      return jsonResponse(res, result.status, result.body);
    } catch (err) {
      log("webhookReceiver", "error", { error: err.message });
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Evolution API adapter ──
  if (url.pathname === "/api/webhook/evolution" && req.method === "POST") {
    try {
      if (WEBHOOK_SECRET && req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
        return jsonResponse(res, 401, { error: "Unauthorized" });
      }
      const body = await readBody(req);
      const data = body.data || body;

      // Ignore outbound messages (sent by us) to prevent loops
      const fromMe = data?.key?.fromMe;
      if (fromMe) {
        return jsonResponse(res, 200, { status: "ignored", reason: "outbound message (fromMe)" });
      }

      // Ignore non-message events (status updates, receipts, etc.)
      const event = body.event;
      if (event && event !== "messages.upsert") {
        return jsonResponse(res, 200, { status: "ignored", reason: `event: ${event}` });
      }

      const remoteJid = data?.key?.remoteJid || "";
      // Ignore group messages
      if (remoteJid.endsWith("@g.us")) {
        return jsonResponse(res, 200, { status: "ignored", reason: "group message" });
      }

      const phone = remoteJid.replace("@s.whatsapp.net", "");
      const message = data?.message?.conversation || data?.message?.extendedTextMessage?.text || "";
      const pushName = data?.pushName || "Lead WhatsApp";

      if (!phone || !message) {
        return jsonResponse(res, 200, { status: "ignored", reason: "no text message" });
      }

      log("webhookReceiver", "evolution inbound", { phone, pushName, event });

      const result = await openclawWebhookReceiver.process({
        phone, message, sender_name: pushName, origin: "evolution-api",
      });
      return jsonResponse(res, result.status, result.body);
    } catch (err) {
      log("webhookReceiver", "evolution error", { error: err.message });
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Manual send: text message ──
  if (url.pathname === "/api/webhook/send" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const { phone, text, lead_id } = body;
      if (!phone || !text) {
        return jsonResponse(res, 400, { error: "Missing: phone, text" });
      }

      const result = await whatsappMessageService.sendText(phone, text);

      // Log in Supabase if lead_id provided
      if (lead_id) {
        await supabase.insert("bot_messages", {
          lead_id, direction: "outbound", content: text, message_type: "text",
        });
      }

      log("manualSend", "text sent", { phone, sent: result.sent });
      return jsonResponse(res, 200, { ok: true, sent: result.sent, data: result.data });
    } catch (err) {
      log("manualSend", "error", { error: err.message });
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Manual send: media (image/video/document) ──
  if (url.pathname === "/api/webhook/send-media" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const { phone, media_url, media_type, caption, lead_id } = body;
      if (!phone || !media_url) {
        return jsonResponse(res, 400, { error: "Missing: phone, media_url" });
      }

      if (!WHATSAPP_API_URL) {
        return jsonResponse(res, 503, { error: "WhatsApp API not configured" });
      }

      const mediatype = media_type || whatsappMessageService.detectMediaType(media_url);
      const fileName = whatsappMessageService.getFileName(media_url);
      const result = await fetchJSON(`${WHATSAPP_API_URL}/message/sendMedia/${WHATSAPP_INSTANCE}`, {
        method: "POST",
        headers: { apikey: WHATSAPP_API_KEY },
        body: JSON.stringify({ number: phone, mediatype, media: media_url, caption: caption || "", fileName }),
      });

      if (lead_id) {
        await supabase.insert("bot_messages", {
          lead_id, direction: "outbound",
          content: caption ? `[${mediatype}] ${caption}` : `[${mediatype}] ${media_url}`,
          message_type: mediatype,
          metadata: JSON.stringify({ media_url, media_type: mediatype }),
        });
      }

      log("manualSend", "media sent", { phone, mediatype, ok: result.ok });
      return jsonResponse(res, 200, { ok: result.ok, data: result.data });
    } catch (err) {
      log("manualSend", "media error", { error: err.message });
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── 404 ──
  jsonResponse(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  log("openclaw-mbc", `listening on port ${PORT}`);
  log("openclaw-mbc", `supabase: ${SUPABASE_URL ? "OK" : "NOT SET"}`);
  log("openclaw-mbc", `whatsapp: ${WHATSAPP_API_URL ? "OK" : "NOT SET"}`);
  log("openclaw-mbc", `orbit-core: ${ORBIT_CORE_URL ? "OK" : "NOT SET"}`);
});
