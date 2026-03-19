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
  async selectManyRaw(table, queryString) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${queryString}`;
    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };
    const r = await fetchJSON(url, { method: "GET", headers });
    return Array.isArray(r.data) ? r.data : [];
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
  POS_CONVERSAO: "POS_CONVERSAO", // after materials sent
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
    "Posso te ajudar com:\n\n1️⃣ *Enviar material* do empreendimento\n2️⃣ *Enviar a planta*\n3️⃣ *Agendar uma visita*\n4️⃣ *Falar com um consultor*\n\nO que prefere?",
  POS_CONVERSAO:
    "Enviei o material! Se quiser, posso agendar uma visita ou te conectar com um consultor. É só me dizer.",
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
// LLM CONVERSATION SERVICE — AI-powered conversation
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_SYSTEM_PROMPT = `Voce e {persona}, corretor responsavel pelo Metropolitan Business Center (MBC).

## REGRAS DE COMPORTAMENTO
- Responda SEMPRE em portugues brasileiro, informal mas profissional
- Seja conciso: maximo 3 paragrafos curtos
- NUNCA invente informacoes que nao estejam neste prompt
- Se nao souber algo, diga que vai verificar com a equipe
- Nao discuta politica, religiao ou temas fora do empreendimento
- NUNCA repita a mesma mensagem — varie sempre suas respostas
- Se o lead disser "sim", "pode", "ok", "claro" entenda como afirmacao a sua ultima pergunta
- Conduza naturalmente para envio de material, visita ou falar com consultor
- Seja PROATIVO: na primeira mensagem, apresente-se e ja fale brevemente sobre o MBC. NAO fique apenas perguntando "como posso ajudar"
- Siga este fluxo natural: apresentacao → qualificacao (empresa ou investimento?) → detalhes do MBC → condicoes comerciais → oferecer material/visita
- Se o lead mandou "oi" ou saudacao simples, apresente-se e ja comece a falar sobre o empreendimento
- NUNCA responda apenas com saudacao. Sempre inclua informacao util sobre o MBC

## SOBRE O EMPREENDIMENTO
- Nome: Metropolitan Business Center (MBC)
- Tipo: Condominio empresarial
- Localizacao: margens da MG-10, a 3km do Aeroporto de Confins/MG
- Lotes a partir de 1.000 m2
- Infraestrutura: ruas 10m com asfalto para carretas, rotatorias para manobra, portaria com seguranca 24h, energia Cemig, agua Copasa e internet
- Regiao em forte expansao logistica

## CONDICOES COMERCIAIS
- Preco base: R$ 530.000
- Entrada: 20%
- Saldo: ate 24 parcelas (tabela Price, 0,99% a.m.)
- Condominio: aproximadamente R$ 500/mes

## PERFIS DE CLIENTE
- Empresa: quer instalar operacao (galpao, centro de distribuicao, sede, escritorio, deposito)
- Investidor: busca valorizacao patrimonial ou renda com construcao de galpao

## ACOES DISPONIVEIS
Quando o lead demonstrar intencao clara, inclua UMA acao no JSON:
- "send_material": lead pediu ou aceitou receber material, apresentacao, book, brochura, video
- "send_planta": lead pediu planta especificamente
- "schedule_visit": lead quer visitar, conhecer, ir ate la, agendar visita
- "transfer_human": lead quer proposta personalizada, negociar desconto, condicao especial, falar com consultor/atendente

## QUALIFICACAO DO LEAD (score_events)
Analise a mensagem do lead e inclua no JSON um array "score_events" com os eventos detectados nesta mensagem. Inclua APENAS eventos que realmente ocorreram NESTA mensagem, nao repita eventos de mensagens anteriores.
Eventos possiveis:
- "perfil_respondido": lead revelou se e empresa ou investidor
- "objetivo_informado": lead disse o que pretende fazer (galpao, CD, sede, investir, etc)
- "metragem_informada": lead mencionou area desejada (ex: 1000m2, 2000m2)
- "material_solicitado": lead pediu ou aceitou material/apresentacao/book
- "planta_solicitada": lead pediu planta
- "visita_aceita": lead quer visitar ou agendar visita
- "proposta_solicitada": lead pediu proposta, orcamento ou simulacao
- "interesse_construcao": lead mencionou construir galpao ou edificar
- "pergunta_preco": lead perguntou sobre valores, precos ou condicoes
- "pergunta_localizacao": lead perguntou onde fica, como chegar
- "engajamento_alto": lead fez 2+ perguntas na mesma mensagem ou demonstrou entusiasmo claro

Se nenhum evento foi detectado, envie array vazio [].

Inclua tambem:
- "detected_profile": "empresa" ou "investimento" ou null (se detectou o perfil do lead)
- "detected_objective": descricao curta do objetivo ou null
- "detected_area": metragem mencionada ou null

## FORMATO DE RESPOSTA (OBRIGATORIO)
Responda SEMPRE em JSON valido, nada mais:
{"text": "sua resposta aqui", "action": null, "score_events": [], "detected_profile": null, "detected_objective": null, "detected_area": null}

Exemplo com eventos:
{"text": "Otimo! Um galpao de 2000m2 e um excelente investimento na regiao.", "action": null, "score_events": ["perfil_respondido", "objetivo_informado", "metragem_informada"], "detected_profile": "empresa", "detected_objective": "galpao logistico", "detected_area": "2000 m2"}`;

const LLM_PROVIDERS = {
  openai:    { endpoint: "https://api.openai.com/v1/chat/completions",  defaultModel: "gpt-4o-mini",   format: "openai" },
  anthropic: { endpoint: "https://api.anthropic.com/v1/messages",       defaultModel: "claude-sonnet-4-20250514", format: "anthropic" },
  google:    { endpoint: "https://generativelanguage.googleapis.com/v1beta/models", defaultModel: "gemini-2.0-flash", format: "google" },
  xai:       { endpoint: "https://api.x.ai/v1/chat/completions",       defaultModel: "grok-3-mini",   format: "openai" },
};

const guardrails = {
  _lastCallTime: new Map(),    // leadId → timestamp (rate limit, ok in memory)
  _failCooldowns: new Map(),   // leadId → { count, disabledUntil }

  checkRateLimit(leadId) {
    const last = this._lastCallTime.get(leadId) || 0;
    if (Date.now() - last < 2000) return true;
    this._lastCallTime.set(leadId, Date.now());
    return false;
  },

  // M2: Loop detection using bot_messages (persistent, survives restarts)
  async detectLoop(leadId, newResponse) {
    try {
      const recentOutbound = await supabase.selectManyRaw(
        "bot_messages",
        `lead_id=eq.${leadId}&direction=eq.outbound&order=created_at.desc&limit=5&select=content`
      );
      const normalize = (s) => (s || "").toLowerCase().replace(/[!?.,\s]+/g, " ").trim();
      const newWords = normalize(newResponse).split(" ").slice(0, 8).join(" ");
      return recentOutbound.some((r) => {
        const rWords = normalize(r.content).split(" ").slice(0, 8).join(" ");
        if (newWords === rWords) return true;
        if (/^(oi|olá|ola|como|tudo)/.test(newWords) && /^(oi|olá|ola|como|tudo)/.test(rWords)) return true;
        return false;
      });
    } catch {
      return false; // if query fails, don't block
    }
  },

  // M2: Get recent responses from DB for anti-repetition in system prompt
  async getRecentResponses(leadId) {
    try {
      const rows = await supabase.selectManyRaw(
        "bot_messages",
        `lead_id=eq.${leadId}&direction=eq.outbound&order=created_at.desc&limit=3&select=content`
      );
      return rows.map((r) => (r.content || "").slice(0, 100));
    } catch {
      return [];
    }
  },

  truncateAtSentence(text, maxLen) {
    if (!text || text.length <= maxLen) return text;
    // Find the last complete sentence within the limit
    const truncated = text.slice(0, maxLen);
    const lastEnd = Math.max(
      truncated.lastIndexOf(". "),
      truncated.lastIndexOf("! "),
      truncated.lastIndexOf("? "),
      truncated.lastIndexOf(".\n"),
      truncated.lastIndexOf("."),
      truncated.lastIndexOf("!"),
      truncated.lastIndexOf("?"),
    );
    return lastEnd > maxLen * 0.3 ? truncated.slice(0, lastEnd + 1).trim() : truncated.trim();
  },

  parseResponse(raw) {
    const empty = { text: null, action: null, score_events: [], detected_profile: null, detected_objective: null, detected_area: null };
    if (!raw) return empty;

    const extract = (parsed) => ({
      text: parsed.text || null,
      action: parsed.action || null,
      score_events: Array.isArray(parsed.score_events) ? parsed.score_events : [],
      detected_profile: parsed.detected_profile || null,
      detected_objective: parsed.detected_objective || null,
      detected_area: parsed.detected_area || null,
    });

    // Try direct JSON parse
    try {
      const parsed = JSON.parse(raw);
      if (parsed.text) return extract(parsed);
    } catch {}
    // Try extracting JSON from markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.text) return extract(parsed);
      } catch {}
    }
    // Try finding JSON object with "text" key
    const braceMatch = raw.match(/\{[\s\S]*"text"\s*:[\s\S]*\}/);
    if (braceMatch) {
      try {
        const parsed = JSON.parse(braceMatch[0]);
        if (parsed.text) return extract(parsed);
      } catch {}
    }
    // Fallback: use raw text
    return { ...empty, text: raw.replace(/```json|```/g, "").trim() };
  },

  // M4: Failure tracking with progressive cooldown
  recordFailure(leadId) {
    const entry = this._failCooldowns.get(leadId) || { count: 0, disabledUntil: 0 };
    entry.count++;
    if (entry.count >= 3) {
      // Progressive cooldown: 30min, 2h, 8h
      const cooldownMs = [30, 120, 480][Math.min(entry.count - 3, 2)] * 60_000;
      entry.disabledUntil = Date.now() + cooldownMs;
      log("guardrails", `LLM cooldown for lead ${leadId}`, { failures: entry.count, cooldownMin: cooldownMs / 60_000 });
    }
    this._failCooldowns.set(leadId, entry);
    return entry.count >= 3;
  },

  recordSuccess(leadId) {
    this._failCooldowns.delete(leadId);
  },

  isDisabled(leadId) {
    const entry = this._failCooldowns.get(leadId);
    if (!entry) return false;
    if (entry.count < 3) return false;
    // Check if cooldown expired
    if (entry.disabledUntil && Date.now() > entry.disabledUntil) {
      entry.count = 0;
      entry.disabledUntil = 0;
      this._failCooldowns.set(leadId, entry);
      return false; // cooldown expired, allow LLM again
    }
    return true;
  },
};

const llmConversationService = {
  // M3: Smart truncation — keep first 3 messages (context) + last N (recent)
  async loadHistory(leadId, maxMessages) {
    const contextWindow = 3; // always keep first N messages

    // Get first messages (lead introduction context)
    const firstRows = await supabase.selectManyRaw(
      "bot_messages",
      `lead_id=eq.${leadId}&order=created_at.asc&limit=${contextWindow}&select=direction,content,created_at`
    );

    // Get recent messages
    const recentLimit = maxMessages - contextWindow;
    const recentRows = await supabase.selectManyRaw(
      "bot_messages",
      `lead_id=eq.${leadId}&order=created_at.desc&limit=${recentLimit}&select=direction,content,created_at`
    );
    recentRows.reverse();

    // If conversation is short, just return all
    const totalEstimate = firstRows.length + recentRows.length;
    if (totalEstimate <= maxMessages) {
      // Deduplicate (some messages may overlap)
      const seen = new Set();
      const all = [...firstRows, ...recentRows].filter((r) => {
        const key = r.created_at;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return all.map((r) => ({
        role: r.direction === "inbound" ? "user" : "assistant",
        content: r.content,
      }));
    }

    // Long conversation: first 3 + gap marker + last N
    const format = (r) => ({
      role: r.direction === "inbound" ? "user" : "assistant",
      content: r.content,
    });

    return [
      ...firstRows.map(format),
      { role: "system", content: "[... mensagens anteriores omitidas ...]" },
      ...recentRows.map(format),
    ];
  },

  async buildSystemPrompt(lead, template) {
    const persona = getConfig("persona", "Rogério");
    let prompt = (template || DEFAULT_SYSTEM_PROMPT).replace(/\{persona\}/g, persona);
    // Inject lead context
    prompt += `\n\n## CONTEXTO DO LEAD ATUAL\n`;
    prompt += `- Nome: ${lead.name || "desconhecido"}\n`;
    if (lead.profile_type && lead.profile_type !== "indefinido") prompt += `- Perfil: ${lead.profile_type}\n`;
    if (lead.objective) prompt += `- Objetivo: ${lead.objective}\n`;
    if (lead.desired_area) prompt += `- Area desejada: ${lead.desired_area}\n`;
    prompt += `- Score: ${lead.score} (${lead.score_classification})\n`;
    prompt += `- Estado da conversa: ${lead.conversation_state}\n`;
    if (lead.visit_interest) prompt += `- Ja demonstrou interesse em visita\n`;
    if (lead.human_handoff) prompt += `- Ja foi transferido para humano\n`;

    // Check if materials were already sent
    try {
      const sentMedia = await supabase.selectManyRaw(
        "bot_messages",
        `lead_id=eq.${lead.id}&message_type=neq.text&limit=1&select=id`
      );
      if (sentMedia.length > 0) {
        prompt += `\n⚠️ MATERIAIS JA FORAM ENVIADOS para este lead. NAO use action "send_material" novamente. Conduza a conversa para agendar visita ou falar com consultor humano.\n`;
      }
    } catch {}

    // M2: Anti-repetition from DB (persistent, survives restarts)
    const recent = await guardrails.getRecentResponses(lead.id);
    if (recent.length > 0) {
      prompt += `\n## SUAS ULTIMAS RESPOSTAS (NAO REPITA)\n`;
      recent.forEach((r, i) => {
        prompt += `${i + 1}. "${r}"\n`;
      });
      prompt += `\nVarie completamente sua abordagem. Avance a conversa, nao fique repetindo saudacoes.\n`;
    }

    return prompt;
  },

  async callOpenAIFormat(endpoint, apiKey, model, systemPrompt, history, temperature, extraHeaders) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const body = {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...history],
        temperature,
        max_tokens: 1000,
      };
      // Force JSON output for OpenAI models that support it
      if (endpoint.includes("openai.com")) {
        body.response_format = { type: "json_object" };
      }
      const resp = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `API ${resp.status}`);
      return data.choices?.[0]?.message?.content || "";
    } finally {
      clearTimeout(timeout);
    }
  },

  async callAnthropic(apiKey, model, systemPrompt, history, temperature) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: history,
          max_tokens: 800,
          temperature,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `API ${resp.status}`);
      return data.content?.[0]?.text || "";
    } finally {
      clearTimeout(timeout);
    }
  },

  async callGoogle(apiKey, model, systemPrompt, history, temperature) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const contents = history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const resp = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature, maxOutputTokens: 800 },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `API ${resp.status}`);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } finally {
      clearTimeout(timeout);
    }
  },

  async generate(leadId, lead, message) {
    const provider = getConfig("llm_provider", "openai");
    const apiKey = getConfig("llm_api_key", "");
    const providerConfig = LLM_PROVIDERS[provider] || LLM_PROVIDERS.openai;
    const model = getConfig("llm_model", "") || providerConfig.defaultModel;
    const temperature = Number(getConfig("llm_temperature", 0.7));
    const maxHistory = Number(getConfig("llm_max_history", 20));
    const maxLen = Number(getConfig("llm_max_response_length", 500));
    const systemPromptTemplate = getConfig("llm_system_prompt", DEFAULT_SYSTEM_PROMPT);

    if (!apiKey) throw new Error("LLM API key not configured");

    // Rate limit
    if (guardrails.checkRateLimit(leadId)) {
      throw new Error("Rate limited");
    }

    // Check if LLM disabled for this lead (too many failures)
    if (guardrails.isDisabled(leadId)) {
      throw new Error("LLM disabled for this lead (consecutive failures)");
    }

    // Load conversation history
    const history = await this.loadHistory(leadId, maxHistory);
    // Add current message (not yet saved when this runs — it IS saved before this call in process())
    // Actually it IS already saved, so it's in the history. No need to add again.

    // Build system prompt with lead context
    const systemPrompt = await this.buildSystemPrompt(lead, systemPromptTemplate);

    // Call provider
    let rawResponse;
    const format = providerConfig.format;

    if (format === "openai") {
      rawResponse = await this.callOpenAIFormat(
        providerConfig.endpoint, apiKey, model, systemPrompt, history, temperature,
        provider === "xai" ? {} : {},
      );
    } else if (format === "anthropic") {
      rawResponse = await this.callAnthropic(apiKey, model, systemPrompt, history, temperature);
    } else if (format === "google") {
      rawResponse = await this.callGoogle(apiKey, model, systemPrompt, history, temperature);
    } else {
      throw new Error(`Unknown provider format: ${format}`);
    }

    log("llmConversation", "raw response", { provider, model, raw: rawResponse?.slice(0, 200) });

    // Parse structured response
    const parsed = guardrails.parseResponse(rawResponse);

    if (!parsed.text) {
      guardrails.recordFailure(leadId);
      throw new Error("Empty LLM response");
    }

    // Truncate if needed
    parsed.text = guardrails.truncateAtSentence(parsed.text, maxLen);

    // Loop detection
    if (await guardrails.detectLoop(leadId, parsed.text)) {
      guardrails.recordFailure(leadId);
      throw new Error("Loop detected — same response repeated");
    }

    // Validate action
    const validActions = ["send_material", "send_planta", "schedule_visit", "transfer_human", null];
    if (!validActions.includes(parsed.action)) {
      parsed.action = null;
    }

    // Validate score events
    const validEvents = Object.keys(SCORE_MAP).concat(["interesse_construcao", "pergunta_preco", "pergunta_localizacao", "engajamento_alto"]);
    parsed.score_events = (parsed.score_events || []).filter((e) => validEvents.includes(e));

    guardrails.recordSuccess(leadId);
    log("llmConversation", "generated", {
      provider, text: parsed.text.slice(0, 100), action: parsed.action,
      score_events: parsed.score_events, detected_profile: parsed.detected_profile,
    });

    return parsed;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE 2: leadScoringService
// ═══════════════════════════════════════════════════════════════════════════

const SCORE_MAP = {
  perfil_respondido:     { points: 10, description: "Respondeu perfil" },
  objetivo_informado:    { points: 10, description: "Informou objetivo" },
  metragem_informada:    { points: 10, description: "Informou metragem" },
  material_solicitado:   { points: 20, description: "Solicitou material" },
  planta_solicitada:     { points: 15, description: "Solicitou planta" },
  visita_aceita:         { points: 25, description: "Aceitou visita" },
  proposta_solicitada:   { points: 30, description: "Solicitou proposta" },
  interesse_construcao:  { points: 10, description: "Interesse em construir" },
  pergunta_preco:        { points:  5, description: "Perguntou sobre preço" },
  pergunta_localizacao:  { points:  5, description: "Perguntou localização" },
  engajamento_alto:      { points: 15, description: "Alto engajamento na conversa" },
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

    if (this.detectProfile(text) && (!lead.profile_type || lead.profile_type === "indefinido")) events.push("perfil_respondido");
    if (this.detectObjective(text) && !lead.objective) events.push("objetivo_informado");
    if (this.detectArea(text) && !lead.desired_area) events.push("metragem_informada");
    if (/material|apresentação|book|brochura/.test(lower)) events.push("material_solicitado");
    if (/planta/.test(lower)) events.push("planta_solicitada");
    if (/visita|conhecer|ir até|ver pessoalmente/.test(lower)) events.push("visita_aceita");
    if (/proposta|orçamento|simulação/.test(lower)) events.push("proposta_solicitada");
    if (/constru|galpão|edificar/.test(lower)) events.push("interesse_construcao");
    if (/preço|valor|quanto|custa|parcela|entrada/.test(lower)) events.push("pergunta_preco");
    if (/onde fica|localiza|como chegar|endereço|mapa/.test(lower)) events.push("pergunta_localizacao");

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

    // Notify all configured attendants via WhatsApp
    try {
      const attendants = getConfig("attendants", []);
      if (Array.isArray(attendants) && attendants.length > 0) {
        const lead = await supabase.selectOne("bot_leads", { id: leadId });
        const leadName = lead?.name || "Lead";
        const leadPhone = lead?.phone || "";
        const leadOrigin = lead?.origin || "WhatsApp";
        const leadScore = lead?.score || 0;
        const leadProfile = lead?.profile_type || "indefinido";
        const waLink = `https://wa.me/${leadPhone.replace(/[^0-9]/g, "")}`;

        const msg =
          `🔔 *Transferência Automática*\n\n` +
          `*Cliente:* ${leadName}\n` +
          `*Telefone:* ${leadPhone}\n` +
          `*Campanha:* ${leadOrigin}\n` +
          `*Score:* ${leadScore} (${lead?.score_classification || "frio"})\n` +
          `*Perfil:* ${leadProfile}\n` +
          `*Motivo:* ${reason}\n\n` +
          `👉 Abrir conversa: ${waLink}`;

        for (const att of attendants) {
          const attPhone = (att.phone || "").replace(/[^0-9]/g, "");
          if (attPhone) {
            await whatsappMessageService.sendText(attPhone, msg);
          }
        }
        log("handoffRouter", "attendants notified", { count: attendants.length, leadId });
      }
    } catch (err) {
      log("handoffRouter", "notify error (non-fatal)", { error: err.message });
    }
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

    // ── Rate limit per phone: min 3s between responses ──
    if (!global._lastResponseTime) global._lastResponseTime = new Map();
    const lastResp = global._lastResponseTime.get(phone) || 0;
    if (Date.now() - lastResp < 3000) {
      log("webhookReceiver", "rate limited", { phone, elapsed: Date.now() - lastResp });
      return { status: 200, body: { status: "rate_limited", lead_id: lead.id } };
    }
    global._lastResponseTime.set(phone, Date.now());

    // ── Auto-reactivate leads that were in trash/encerrado ──
    if (lead.attendance_status === "encerrado") {
      log("webhookReceiver", "reactivating lead from trash", { leadId: lead.id, phone });
      await supabase.update("bot_leads", { id: lead.id }, {
        attendance_status: "bot",
        conversation_state: "START",
        human_handoff: false,
        handoff_reason: null,
      });
      lead.attendance_status = "bot";
      lead.conversation_state = "START";
      lead.human_handoff = false;
    }

    // ── Auto-reactivate leads stuck in aguardando_humano ──
    if (lead.attendance_status === "aguardando_humano") {
      log("webhookReceiver", "reactivating lead from handoff", { leadId: lead.id, phone });
      await supabase.update("bot_leads", { id: lead.id }, {
        attendance_status: "bot",
        conversation_state: "START",
        human_handoff: false,
        handoff_reason: null,
      });
      lead.attendance_status = "bot";
      lead.conversation_state = "START";
      lead.human_handoff = false;
    }

    // ── Skip only if actively being handled by human ──
    if (["em_atendimento", "atendido"].includes(lead.attendance_status)) {
      log("webhookReceiver", "skipped — human handling", { leadId: lead.id });
      return {
        status: 200,
        body: { status: "skipped", reason: "Lead is being handled by human", lead_id: lead.id },
      };
    }

    // ── Scoring: detect events from message ──
    const scoreEvents = leadScoringService.detectScoreEvents(message, lead);
    await leadScoringService.persistScoreEvents(lead.id, scoreEvents);

    // Calculate score from source of truth (score_events table) to avoid race conditions
    const allEvents = await supabase.selectManyRaw("score_events", `lead_id=eq.${lead.id}&select=points`);
    const newScore = allEvents.reduce((sum, e) => sum + (e.points || 0), 0);
    const classification = leadScoringService.classifyScore(newScore);

    // ── Build lead updates ──
    const updates = {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      score: newScore,
      score_classification: classification,
    };

    // ── Detect profile, objective, area ──
    const detectedProfile = leadScoringService.detectProfile(message);
    if (detectedProfile && (!lead.profile_type || lead.profile_type === "indefinido")) updates.profile_type = detectedProfile;
    const detectedObjective = leadScoringService.detectObjective(message);
    if (detectedObjective && !lead.objective) updates.objective = detectedObjective;
    const detectedArea = leadScoringService.detectArea(message);
    if (detectedArea && !lead.desired_area) updates.desired_area = detectedArea;
    if (/constru|galpão para/.test(message.toLowerCase())) updates.construction_interest = true;

    // ── Check if materials were already sent ──
    const prevMedia = await supabase.selectManyRaw("bot_messages", `lead_id=eq.${lead.id}&message_type=neq.text&limit=1&select=id`);
    const materialsAlreadySent = prevMedia.length > 0;

    // ── M5: Regex intent classifier (guardrail semântico leve) ──
    const lower = message.toLowerCase();
    const isHostile = /porra|merda|idiota|burro|lixo|vai se|fdp|caralho|puta/i.test(lower);
    const isOffTopic = /político|eleição|bolsonaro|lula|futebol|flamengo|palmeiras|corinthians|religião|igreja|bitcoin|crypto/i.test(lower);

    if (isHostile || isOffTopic) {
      const deflectResponse = isHostile
        ? "Estou aqui para te ajudar com o MBC! Se precisar de informações sobre lotes ou condições, é só falar."
        : "Entendo sua curiosidade! Mas meu foco é te ajudar com o Metropolitan Business Center. Posso te contar sobre os lotes, condições ou agendar uma visita?";

      await supabase.insert("bot_messages", { lead_id: lead.id, direction: "outbound", content: deflectResponse, message_type: "text" });
      await supabase.update("bot_leads", { id: lead.id }, updates);
      await whatsappMessageService.sendText(phone, deflectResponse);
      log("intentClassifier", isHostile ? "hostile" : "off_topic", { phone });
      return { status: 200, body: { status: "deflected", lead_id: lead.id, reason: isHostile ? "hostile" : "off_topic" } };
    }

    // ── Determine bot response ──
    const handoff = handoffRouterService.needsHandoff(message, newScore);
    let botResponse;
    let dispatchMaterialTypes = null;
    // M6: A/B testing — determine if this lead should use LLM
    const llmGlobalEnabled = getConfig("llm_enabled", false) && getConfig("llm_api_key", "");
    const abTestEnabled = getConfig("ab_test_enabled", false);
    const abTestPercentage = Number(getConfig("ab_test_llm_percentage", 20));
    let llmEnabled = false;

    if (llmGlobalEnabled) {
      if (abTestEnabled) {
        // Deterministic hash: same phone always gets same group
        let hash = 0;
        for (let i = 0; i < phone.length; i++) {
          hash = ((hash << 5) - hash) + phone.charCodeAt(i);
          hash |= 0;
        }
        llmEnabled = (Math.abs(hash) % 100) < abTestPercentage;
        if (llmEnabled) log("abTest", "lead in LLM group", { phone, hash: Math.abs(hash) % 100, threshold: abTestPercentage });
      } else {
        llmEnabled = true; // no A/B, use global toggle
      }
    }

    if (handoff.needed) {
      // ── Handoff ──
      updates.human_handoff = true;
      updates.handoff_reason = handoff.reason;
      updates.attendance_status = "aguardando_humano";
      updates.conversation_state = "TRANSFERENCIA_HUMANA";
      await handoffRouterService.createHandoff(lead.id, handoff.reason);
      if (visitSchedulingService.detectVisitIntent(message)) {
        updates.visit_interest = true;
        await visitSchedulingService.createVisitRequest(lead.id, message);
      }
      botResponse = getBotMessages().TRANSFERENCIA_HUMANA;

    } else if (llmEnabled) {
      // ── LLM mode ──
      try {
        const llmResult = await llmConversationService.generate(lead.id, lead, message);
        botResponse = llmResult.text;

        if (llmResult.detected_profile && (!lead.profile_type || lead.profile_type === "indefinido")) updates.profile_type = llmResult.detected_profile;
        if (llmResult.detected_objective && !lead.objective) updates.objective = llmResult.detected_objective;
        if (llmResult.detected_area && !lead.desired_area) updates.desired_area = llmResult.detected_area;

        if (llmResult.action === "send_material" && !materialsAlreadySent) {
          dispatchMaterialTypes = ["apresentacao", "pdf", "video"];
          updates.conversation_state = "POS_CONVERSAO";
        } else if (llmResult.action === "send_planta" && !materialsAlreadySent) {
          dispatchMaterialTypes = ["planta"];
          updates.conversation_state = "POS_CONVERSAO";
        } else if (llmResult.action === "schedule_visit") {
          updates.visit_interest = true;
          updates.human_handoff = true;
          updates.handoff_reason = "IA: lead solicitou visita";
          updates.attendance_status = "aguardando_humano";
          updates.conversation_state = "TRANSFERENCIA_HUMANA";
          await visitSchedulingService.createVisitRequest(lead.id, message);
          await handoffRouterService.createHandoff(lead.id, "IA: lead solicitou visita");
        } else if (llmResult.action === "transfer_human") {
          updates.human_handoff = true;
          updates.handoff_reason = "IA: lead pediu atendimento humano";
          updates.attendance_status = "aguardando_humano";
          updates.conversation_state = "TRANSFERENCIA_HUMANA";
          await handoffRouterService.createHandoff(lead.id, "IA: lead pediu atendimento humano");
        } else {
          updates.conversation_state = "LLM_ACTIVE";
        }
        log("llmConversation", "success", { leadId: lead.id, action: llmResult.action });
      } catch (llmErr) {
        log("llmConversation", "fallback to state machine", { error: llmErr.message });
        botResponse = null;
      }
    }

    // ── State machine (default or LLM fallback) ──
    if (!botResponse && !handoff.needed) {
      const currentState = lead.conversation_state || "START";
      const lower = message.toLowerCase();

      if (currentState === "CONVERSAO" || currentState === "POS_CONVERSAO" || currentState === "LLM_ACTIVE") {
        const trimmed = lower.trim();
        const isChoice1 = /^1$|^1️⃣/.test(trimmed);
        const isChoice2 = /^2$|^2️⃣/.test(trimmed);
        const isChoice3 = /^3$|^3️⃣/.test(trimmed);
        const isChoice4 = /^4$|^4️⃣/.test(trimmed);

        const wantsMaterial = isChoice1 || /material|sim|pode|enviar|manda|quero|ok|claro|por favor|apresentação|book|brochura/i.test(lower);
        const wantsPlanta = isChoice2 || /planta/i.test(lower);
        const wantsVisita = isChoice3 || /visita|conhecer|ir até|ver pessoalmente|agendar/i.test(lower);
        const wantsHuman = isChoice4 || /falar|humano|atendente|consultor|alguém/i.test(lower);
        const wantsProposal = /proposta|orçamento|simulação/i.test(lower);

        if (wantsVisita || wantsProposal || wantsHuman) {
          const reason = wantsVisita ? "Lead solicitou visita" : wantsProposal ? "Lead solicitou proposta" : "Lead pediu atendimento humano";
          updates.human_handoff = true;
          updates.handoff_reason = reason;
          updates.attendance_status = "aguardando_humano";
          updates.conversation_state = "TRANSFERENCIA_HUMANA";
          if (wantsVisita) { updates.visit_interest = true; await visitSchedulingService.createVisitRequest(lead.id, message); }
          await handoffRouterService.createHandoff(lead.id, reason);
          botResponse = getBotMessages().TRANSFERENCIA_HUMANA;
        } else if ((wantsMaterial || wantsPlanta) && !materialsAlreadySent) {
          dispatchMaterialTypes = [];
          if (wantsPlanta) dispatchMaterialTypes.push("planta");
          if (wantsMaterial) dispatchMaterialTypes.push("apresentacao", "pdf", "video");
          updates.conversation_state = "POS_CONVERSAO";
          botResponse = "Perfeito! Estou enviando o material para você. Qualquer dúvida, estou à disposição.";
        } else if ((wantsMaterial || wantsPlanta) && materialsAlreadySent) {
          updates.conversation_state = "POS_CONVERSAO";
          botResponse = "Já enviei o material para você! Posso agendar uma visita ou te conectar com um consultor. O que prefere?";
        } else {
          updates.conversation_state = "CONVERSAO";
          botResponse = BOT_MESSAGES_STATIC.CONVERSAO;
        }
      } else {
        const isQuestion = /\?|como assim|não entendi|o que é|qual|pode explicar|me explica|como funciona/i.test(lower);
        if (isQuestion && currentState !== "START") {
          updates.conversation_state = currentState;
          botResponse = conversationStateService.getBotResponse(currentState, updates.profile_type || lead.profile_type);
        } else {
          const nextState = conversationStateService.getNextState(currentState, detectedProfile);
          updates.conversation_state = nextState;
          botResponse = conversationStateService.getBotResponse(nextState, updates.profile_type || lead.profile_type);
        }
      }
    }

    // ── Save outbound message ──
    await supabase.insert("bot_messages", { lead_id: lead.id, direction: "outbound", content: botResponse, message_type: "text" });

    // ── Update lead ──
    log("webhookReceiver", "updating lead", { id: lead.id, score: updates.score, state: updates.conversation_state });
    const updateResult = await supabase.update("bot_leads", { id: lead.id }, updates);
    log("webhookReceiver", "lead updated", { result: updateResult?.score ?? "no result" });

    // ── Send materials (once only, before text) ──
    let materialsSent = [];
    if (dispatchMaterialTypes && dispatchMaterialTypes.length > 0) {
      const materials = await materialDispatchService.getActiveMaterials(dispatchMaterialTypes);
      for (const material of materials) {
        if (material.url && !material.url.includes("example.com")) {
          await whatsappMessageService.sendMedia(phone, material.url, material.name);
          materialsSent.push({ type: material.type, name: material.name });
        }
      }
      log("materialDispatch", "sent", { phone, count: materialsSent.length });
    }

    // ── Send bot text (always, even after materials) ──
    const whatsappResult = await whatsappMessageService.sendText(phone, botResponse);

    // ── Build response ──
    const responsePayload = {
      status: "processed",
      lead_id: lead.id, phone, bot_response: botResponse,
      conversation_state: updates.conversation_state || lead.conversation_state,
      score: newScore, score_classification: classification,
      handoff: handoff.needed, handoff_reason: handoff.reason,
      score_events: scoreEvents, materials_sent: materialsSent,
      whatsapp_sent: whatsappResult.sent,
    };

    log("webhookReceiver", "processed", {
      lead_id: lead.id, state: responsePayload.conversation_state,
      score: newScore, handoff: handoff.needed, whatsapp_sent: whatsappResult.sent,
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

      // Dedup: ignore messages already processed (Evolution can send duplicate webhooks)
      const messageId = data?.key?.id;
      if (messageId) {
        if (!global._processedMsgIds) global._processedMsgIds = new Map();
        if (global._processedMsgIds.has(messageId)) {
          return jsonResponse(res, 200, { status: "ignored", reason: "duplicate webhook" });
        }
        global._processedMsgIds.set(messageId, Date.now());
        // Cleanup old entries (keep last 5 minutes)
        if (global._processedMsgIds.size > 500) {
          const cutoff = Date.now() - 300000;
          for (const [k, v] of global._processedMsgIds) {
            if (v < cutoff) global._processedMsgIds.delete(k);
          }
        }
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

  // ── Config API: read/write bot_config (bypasses RLS) ──
  if (url.pathname === "/api/webhook/config" && req.method === "GET") {
    try {
      const config = await loadBotConfig();
      return jsonResponse(res, 200, { ok: true, config });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (url.pathname === "/api/webhook/config" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const entries = body.entries || [];
      for (const entry of entries) {
        const existing = await supabase.selectOne("bot_config", { key: entry.key });
        if (existing && !existing.code) {
          await supabase.update("bot_config", { key: entry.key }, { value: JSON.stringify(entry.value) });
        } else {
          await supabase.insert("bot_config", { key: entry.key, value: JSON.stringify(entry.value) });
        }
      }
      _configLoadedAt = 0; // bust cache
      return jsonResponse(res, 200, { ok: true, saved: entries.length });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Web Chat: same bot flow but returns response directly ──
  if (url.pathname === "/api/webhook/webchat" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const { session_id, message: chatMessage, name } = body;

      if (!session_id || !chatMessage) {
        return jsonResponse(res, 400, { error: "Missing: session_id, message" });
      }

      // Use session_id as phone (prefixed to avoid collision with real phones)
      const webPhone = `web-${session_id}`;
      const senderName = name || "Visitante do Site";

      // Process through the same orchestrator
      const result = await openclawWebhookReceiver.process({
        phone: webPhone,
        message: chatMessage,
        sender_name: senderName,
        origin: "webchat",
      });

      return jsonResponse(res, 200, {
        ok: true,
        response: result.body.bot_response,
        lead_id: result.body.lead_id,
        state: result.body.conversation_state,
        action: result.body.materials_sent?.length > 0 ? "materials_sent" : null,
      });
    } catch (err) {
      log("webchat", "error", { error: err.message });
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Web Chat: load conversation history ──
  if (url.pathname === "/api/webhook/webchat/history" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const { session_id } = body;
      if (!session_id) return jsonResponse(res, 400, { error: "Missing: session_id" });

      const webPhone = `web-${session_id}`;
      const lead = await supabase.selectOne("bot_leads", { phone: webPhone });
      if (!lead || lead.code === "PGRST116") {
        return jsonResponse(res, 200, { ok: true, messages: [] });
      }

      const messages = await supabase.selectManyRaw(
        "bot_messages",
        `lead_id=eq.${lead.id}&order=created_at.asc&limit=50&select=direction,content,created_at`
      );

      return jsonResponse(res, 200, {
        ok: true,
        messages: messages.map((m) => ({
          role: m.direction === "inbound" ? "user" : "bot",
          text: m.content,
          time: m.created_at,
        })),
      });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Upload proxy: materials to Supabase Storage ──
  if (url.pathname === "/api/webhook/upload" && req.method === "POST") {
    try {
      const contentType = req.headers["content-type"] || "";

      // Expect multipart-like: read raw body
      if (!contentType) {
        return jsonResponse(res, 400, { error: "Missing Content-Type" });
      }

      const fileName = url.searchParams.get("filename") || `upload-${Date.now()}`;
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);

      if (!body.length) {
        return jsonResponse(res, 400, { error: "Empty body" });
      }

      // Upload to Supabase Storage via REST
      const storagePath = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const uploadResp = await fetch(
        `${SUPABASE_URL}/storage/v1/object/materials/${storagePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": contentType,
            "x-upsert": "true",
          },
          body,
        }
      );

      if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        log("upload", "storage error", { status: uploadResp.status, error: errText });
        return jsonResponse(res, 500, { error: `Storage error: ${errText}` });
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/materials/${storagePath}`;
      log("upload", "file uploaded", { fileName, size: body.length, path: storagePath });
      return jsonResponse(res, 200, { ok: true, url: publicUrl, path: storagePath });
    } catch (err) {
      log("upload", "error", { error: err.message });
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

  // ── Auto-reset cron: resets stale conversations every 10 minutes ──
  setInterval(async () => {
    try {
      const config = await loadBotConfig();
      const hours = Number(config.auto_reset_hours) || 4;
      const cutoff = new Date(Date.now() - hours * 3600_000).toISOString();

      // Find leads that are NOT in START/ENCERRADO and last_message_at < cutoff
      const url = `${SUPABASE_URL}/rest/v1/bot_leads?conversation_state=neq.START&conversation_state=neq.ENCERRADO&attendance_status=neq.encerrado&last_message_at=lt.${cutoff}&select=id,name,conversation_state,last_message_at`;
      const headers = {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      };
      const resp = await fetch(url, { headers });
      const staleLeads = await resp.json();

      if (!Array.isArray(staleLeads) || staleLeads.length === 0) return;

      // Reset conversation state but KEEP score (score is historical, don't zero it)
      const resetUrl = `${SUPABASE_URL}/rest/v1/bot_leads?conversation_state=neq.START&conversation_state=neq.ENCERRADO&attendance_status=neq.encerrado&last_message_at=lt.${cutoff}`;
      await fetch(resetUrl, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          conversation_state: "START",
          attendance_status: "bot",
          human_handoff: false,
          handoff_reason: null,
        }),
      });

      log("autoReset", `reset ${staleLeads.length} stale leads (>${hours}h inactivity)`, {
        count: staleLeads.length,
        names: staleLeads.slice(0, 5).map(l => l.name),
      });
    } catch (err) {
      log("autoReset", "error", { error: err.message });
    }
  }, 10 * 60_000); // check every 10 minutes
});
