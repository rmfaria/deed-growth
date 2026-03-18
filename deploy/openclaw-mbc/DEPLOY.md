# OpenClaw MBC — Deploy on prod.nesecurity.com.br

## Architecture

OpenClaw MBC is the **central hub** for the WhatsApp pre-sales bot.
All processing happens inside the engine — no forwarding to external functions.

```
WhatsApp (any provider)
       ↓ incoming message
OpenClaw MBC Engine (7 services on Docker Swarm)
  ├── openclawWebhookReceiver   ← receives & sanitizes
  ├── conversationStateService  ← manages state machine (11 states)
  ├── leadScoringService        ← calculates score (7 rules)
  ├── handoffRouterService      ← detects handoff triggers
  ├── materialDispatchService   ← sends PDFs/media via WhatsApp
  ├── visitSchedulingService    ← creates visit requests
  └── whatsappMessageService    ← sends reply via WhatsApp API
       ↓ persists to Supabase
       ↓ pushes events to orbit-core
       ↓ sends response via WhatsApp
Lead receives message
```

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://prod.nesecurity.com.br/mbc/` | Web UI (CRM + Bot dashboard) |
| `https://prod.nesecurity.com.br/mbc/api/webhook/whatsapp` | Generic webhook (phone, message, sender_name, origin) |
| `https://prod.nesecurity.com.br/mbc/api/webhook/evolution` | Evolution API format adapter |
| `https://prod.nesecurity.com.br/mbc/api/webhook/health` | Health check |
| `https://prod.nesecurity.com.br/mbc/api/webhook/stats` | Service stats |

## Services

| Service | Purpose |
|---------|---------|
| `openclawWebhookReceiver` | Receives inbound WhatsApp messages, orchestrates all services |
| `conversationStateService` | Manages 11-state conversation flow (START → ENCERRADO) |
| `leadScoringService` | Scores leads (0-100+), classifies as frio/morno/quente |
| `handoffRouterService` | Detects handoff triggers (proposta, visita, desconto...) |
| `materialDispatchService` | Fetches active materials from Supabase, sends via WhatsApp |
| `visitSchedulingService` | Creates visit requests when intent detected |
| `whatsappMessageService` | Sends text/media via Evolution API |

## Setup Steps

### 1. Copy files to server

```bash
scp -r deploy/openclaw-mbc/ root@prod.nesecurity.com.br:/root/.openclaw/workspace/openclaw-mbc/deploy/openclaw-mbc/
scp -r dist/ root@prod.nesecurity.com.br:/root/.openclaw/workspace/openclaw-mbc/dist/
```

Or clone repo (requires deploy key):
```bash
cd /root/.openclaw/workspace
git clone git@github.com:rmfaria/deed-growth.git openclaw-mbc
```

### 2. Configure environment

```bash
cp deploy/openclaw-mbc/.env.example deploy/openclaw-mbc/.env
nano deploy/openclaw-mbc/.env
```

Required:
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Settings → API
- `WHATSAPP_API_URL` — Evolution API URL (e.g., `http://evolution_evolution_api:8080`)
- `WHATSAPP_API_KEY` — Evolution API global key
- `WEBHOOK_SECRET` — `openssl rand -hex 32`
- `ORBIT_API_KEY` — orbit-core admin API key

### 3. Build frontend (if not pre-built)

```bash
npm install && npm run build
```

### 4. Deploy Docker stack

```bash
source deploy/openclaw-mbc/.env
docker stack deploy -c deploy/openclaw-mbc/docker-stack.yml openclaw-mbc
```

### 5. Register connector in orbit-core

```bash
curl -X POST "http://orbitcore_api:3010/api/v1/connectors" \
  -H "X-Api-Key: $ORBIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d @deploy/openclaw-mbc/orbit-connector-spec.json

curl -X POST "http://orbitcore_api:3010/api/v1/connectors/mbc-bot/approve" \
  -H "X-Api-Key: $ORBIT_API_KEY"
```

### 6. Configure Evolution API instance

Create instance "mbc" in Evolution API and set webhook:
```
Webhook URL: https://prod.nesecurity.com.br/mbc/api/webhook/evolution
Header: X-Webhook-Secret: <your WEBHOOK_SECRET>
Events: MESSAGES_UPSERT
```

## Updates

```bash
ssh prod
cd /root/.openclaw/workspace/openclaw-mbc
bash deploy/openclaw-mbc/deploy.sh
```

## Docker Services

| Service | Port | Image | RAM |
|---------|------|-------|-----|
| `openclaw-mbc_mbc_ui` | 80 | nginx:alpine | 64M |
| `openclaw-mbc_mbc_engine` | 3020 | node:22-alpine | 128M |
| **Total** | | | **~192M** |
