# MBC Bot — Deploy on prod.nesecurity.com.br

## Architecture

```
WhatsApp (Evolution API / Z-API)
       ↓ POST /mbc/api/webhook/evolution
mbc_webhook (Node.js relay on Docker Swarm)
       ↓ forward to Supabase Edge Function
Supabase (openclaw-webhook) — bot logic, scoring, state machine
       ↓ response
mbc_webhook ← bot_response
       ↓ fire-and-forget
orbit-core ← lead events + score metrics
       ↓ (WhatsApp provider sends reply)
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

## Setup Steps

### 1. Clone repo on server

```bash
cd /root/.openclaw/workspace
git clone https://github.com/rmfaria/deed-growth.git openclaw-mbc
cd openclaw-mbc
```

### 2. Configure environment

```bash
cp deploy/openclaw-mbc/.env.example deploy/openclaw-mbc/.env
nano deploy/openclaw-mbc/.env
```

Fill in:
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard → Settings → API
- `WEBHOOK_SECRET` — generate with `openssl rand -hex 32`
- `ORBIT_API_KEY` — from orbit-core admin
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon key from Supabase

### 3. Build frontend

```bash
npm install
npm run build
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
```

### 6. Approve connector

```bash
curl -X POST "http://orbitcore_api:3010/api/v1/connectors/mbc-bot/approve" \
  -H "X-Api-Key: $ORBIT_API_KEY"
```

### 7. Configure WhatsApp provider

Point your Evolution API / Z-API webhook to:
```
https://prod.nesecurity.com.br/mbc/api/webhook/evolution
```

With header:
```
X-Webhook-Secret: <your WEBHOOK_SECRET>
```

### 8. Deploy Supabase Edge Function

```bash
supabase functions deploy openclaw-webhook --project-ref ayjbdwwbhvdsltmvcgls
```

## Updates

```bash
ssh prod
cd /root/.openclaw/workspace/openclaw-mbc
bash deploy/openclaw-mbc/deploy.sh
```

## Docker Services

| Service | Port | Image |
|---------|------|-------|
| `openclaw-mbc_mbc_ui` | 80 (nginx) | nginx:alpine |
| `openclaw-mbc_mbc_webhook` | 3020 | node:22-alpine |

## Resource Usage

- UI: 64MB RAM max, 0.3 CPU
- Webhook: 128MB RAM max, 0.5 CPU
- Total: ~192MB RAM — fits within prod constraints
