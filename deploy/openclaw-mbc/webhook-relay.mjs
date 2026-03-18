/**
 * MBC Bot Webhook Relay
 *
 * Lightweight Node.js service that:
 * 1. Receives WhatsApp messages (from Evolution API / Z-API / OpenClaw)
 * 2. Forwards to Supabase Edge Function (openclaw-webhook)
 * 3. Returns bot response to the caller (for WhatsApp delivery)
 * 4. Pushes lead events to orbit-core for monitoring/alerting
 *
 * Runs on prod.nesecurity.com.br as part of the openclaw-mbc Docker stack.
 * No external dependencies — uses only Node built-in http/https.
 */

import { createServer } from "node:http";

const PORT = parseInt(process.env.PORT || "3020", 10);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const ORBIT_CORE_URL = process.env.ORBIT_CORE_URL || "";
const ORBIT_API_KEY = process.env.ORBIT_API_KEY || "";

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function fetchJSON(url, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await resp.text();
  try {
    return { ok: resp.ok, status: resp.status, data: JSON.parse(text) };
  } catch {
    return { ok: resp.ok, status: resp.status, data: text };
  }
}

function log(msg, data) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [mbc-webhook] ${msg}`, data ? JSON.stringify(data) : "");
}

// ── Orbit-core event push (fire-and-forget) ─────────────────────────────────

async function pushToOrbitCore(leadData) {
  if (!ORBIT_CORE_URL || !ORBIT_API_KEY) return;

  try {
    const events = [];

    // Push lead state change as orbit event
    events.push({
      source_id: "mbc-bot",
      namespace: "mbc",
      kind: "lead_update",
      severity: leadData.handoff ? "high" : "low",
      asset_id: `lead-${leadData.lead_id}`,
      title: leadData.handoff
        ? `[MBC] Handoff: ${leadData.handoff_reason}`
        : `[MBC] Lead ${leadData.phone} → ${leadData.conversation_state}`,
      description: JSON.stringify({
        phone: leadData.phone,
        score: leadData.score,
        classification: leadData.score_classification,
        state: leadData.conversation_state,
        detected: leadData.detected,
      }),
      ts: new Date().toISOString(),
    });

    // Push score as metric
    const metrics = [
      {
        source_id: "mbc-bot",
        namespace: "mbc",
        asset_id: `lead-${leadData.lead_id}`,
        metric: "lead.score",
        value: leadData.score,
        ts: new Date().toISOString(),
      },
    ];

    // Fire-and-forget — don't block the webhook response
    fetchJSON(`${ORBIT_CORE_URL}/api/v1/ingest/events`, {
      method: "POST",
      headers: { "X-Api-Key": ORBIT_API_KEY },
      body: JSON.stringify(events),
    }).catch((err) => log("orbit-core event push failed", { error: err.message }));

    fetchJSON(`${ORBIT_CORE_URL}/api/v1/ingest/metrics`, {
      method: "POST",
      headers: { "X-Api-Key": ORBIT_API_KEY },
      body: JSON.stringify(metrics),
    }).catch((err) => log("orbit-core metric push failed", { error: err.message }));
  } catch (err) {
    log("orbit-core push error", { error: err.message });
  }
}

// ── Request body parser ─────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

// ── HTTP Server ─────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Webhook-Secret");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ── Health check ──
  if (url.pathname === "/health" || url.pathname === "/api/webhook/health") {
    return jsonResponse(res, 200, { status: "ok", service: "mbc-webhook-relay", uptime: process.uptime() });
  }

  // ── Webhook: receive WhatsApp message ──
  if (url.pathname === "/api/webhook/whatsapp" && req.method === "POST") {
    try {
      // Validate secret
      if (WEBHOOK_SECRET && req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
        log("unauthorized webhook attempt");
        return jsonResponse(res, 401, { error: "Unauthorized" });
      }

      const body = await readBody(req);
      log("incoming message", { phone: body.phone, origin: body.origin });

      // Validate required fields
      if (!body.phone || !body.message) {
        return jsonResponse(res, 400, { error: "Missing required fields: phone, message" });
      }

      // Forward to Supabase Edge Function
      const supabaseUrl = `${SUPABASE_URL}/functions/v1/openclaw-webhook`;
      const result = await fetchJSON(supabaseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          phone: body.phone,
          message: body.message,
          sender_name: body.sender_name || body.pushName || "Lead WhatsApp",
          origin: body.origin || "whatsapp",
        }),
      });

      if (!result.ok) {
        log("supabase error", { status: result.status, data: result.data });
        return jsonResponse(res, 502, { error: "Upstream error", details: result.data });
      }

      // Push to orbit-core (fire-and-forget)
      pushToOrbitCore(result.data);

      log("processed", {
        lead_id: result.data.lead_id,
        state: result.data.conversation_state,
        score: result.data.score,
        handoff: result.data.handoff,
      });

      // Return bot response (caller sends it via WhatsApp)
      return jsonResponse(res, 200, result.data);
    } catch (err) {
      log("webhook error", { error: err.message });
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Webhook: Evolution API format adapter ──
  if (url.pathname === "/api/webhook/evolution" && req.method === "POST") {
    try {
      if (WEBHOOK_SECRET && req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
        return jsonResponse(res, 401, { error: "Unauthorized" });
      }

      const body = await readBody(req);

      // Evolution API payload structure
      // { data: { key: { remoteJid }, pushName, message: { conversation } } }
      const data = body.data || body;
      const remoteJid = data?.key?.remoteJid || "";
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const message = data?.message?.conversation || data?.message?.extendedTextMessage?.text || "";
      const pushName = data?.pushName || "Lead WhatsApp";

      if (!phone || !message) {
        log("evolution: no phone or message in payload");
        return jsonResponse(res, 200, { status: "ignored", reason: "no text message" });
      }

      log("evolution incoming", { phone, pushName });

      // Forward to Supabase
      const supabaseUrl = `${SUPABASE_URL}/functions/v1/openclaw-webhook`;
      const result = await fetchJSON(supabaseUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ phone, message, sender_name: pushName, origin: "evolution-api" }),
      });

      if (!result.ok) {
        return jsonResponse(res, 502, { error: "Upstream error", details: result.data });
      }

      pushToOrbitCore(result.data);

      return jsonResponse(res, 200, result.data);
    } catch (err) {
      log("evolution webhook error", { error: err.message });
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // ── Stats endpoint ──
  if (url.pathname === "/api/webhook/stats" && req.method === "GET") {
    return jsonResponse(res, 200, {
      service: "mbc-webhook-relay",
      uptime: process.uptime(),
      env: {
        supabase_configured: !!SUPABASE_URL,
        orbit_core_configured: !!ORBIT_CORE_URL,
        webhook_secret_set: !!WEBHOOK_SECRET,
      },
    });
  }

  // ── 404 ──
  jsonResponse(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  log(`listening on port ${PORT}`);
  log(`supabase: ${SUPABASE_URL ? "configured" : "NOT SET"}`);
  log(`orbit-core: ${ORBIT_CORE_URL ? "configured" : "NOT SET"}`);
});
