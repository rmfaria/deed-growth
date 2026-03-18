#!/usr/bin/env bash
# deed-growth (MBC Bot) deploy script
# Runs on prod.nesecurity.com.br
set -euo pipefail

REPO=/root/.openclaw/workspace/openclaw-mbc
STACK_NAME="openclaw-mbc"
UI_SERVICE="${STACK_NAME}_mbc_ui"
WEBHOOK_SERVICE="${STACK_NAME}_mbc_webhook"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
ok()   { echo "[$(date '+%H:%M:%S')] ✓ $*"; }
fail() { echo "[$(date '+%H:%M:%S')] ✗ $*" >&2; exit 1; }

cd "$REPO"

# ── 1. Pull ──────────────────────────────────────────────────────────────────
log "git pull..."
_HASH_BEFORE=$(git rev-parse HEAD)
git pull || fail "git pull failed"
_HASH_AFTER=$(git rev-parse HEAD)
ok "code updated → $(git log --oneline -1)"

if [ "$_HASH_BEFORE" != "$_HASH_AFTER" ] && git diff --name-only "$_HASH_BEFORE" "$_HASH_AFTER" | grep -q 'deploy/openclaw-mbc/deploy\.sh'; then
  log "deploy.sh updated — re-executing new version..."
  exec bash "$0" "$@"
fi

# ── 2. Install deps & Build ─────────────────────────────────────────────────
if [ -f bun.lockb ] || [ -f bun.lock ]; then
  log "bun install..."
  bun install --frozen-lockfile 2>/dev/null || npm install --frozen-lockfile || npm install
else
  log "npm install..."
  npm install --frozen-lockfile 2>/dev/null || npm install
fi
ok "dependencies installed"

log "building frontend..."
npm run build || fail "build failed"
ok "build done → dist/"

# ── 3. Deploy / Update Docker Stack ─────────────────────────────────────────
if [ -f "$REPO/deploy/openclaw-mbc/.env" ]; then
  log "loading .env..."
  set -a
  # shellcheck disable=SC1091
  source "$REPO/deploy/openclaw-mbc/.env"
  set +a
fi

# Check if stack exists
if docker stack ls 2>/dev/null | grep -q "^${STACK_NAME}"; then
  log "updating existing stack..."
  for SVC in "$UI_SERVICE" "$WEBHOOK_SERVICE"; do
    if docker service ls --format '{{.Name}}' 2>/dev/null | grep -q "^${SVC}$"; then
      log "updating service ${SVC}..."
      docker service update --force --detach=true "$SVC" > /dev/null
      ok "service ${SVC} updated"
    fi
  done
else
  log "deploying new stack ${STACK_NAME}..."
  docker stack deploy -c "$REPO/deploy/openclaw-mbc/docker-stack.yml" "$STACK_NAME" \
    || fail "stack deploy failed"
  ok "stack deployed"
fi

# ── 4. Health check ─────────────────────────────────────────────────────────
log "waiting for services to converge..."
sleep 5

# Check webhook service
for _i in $(seq 1 6); do
  _CID=$(docker ps --filter "name=${WEBHOOK_SERVICE}" --format '{{.ID}}' 2>/dev/null | head -1)
  [ -n "$_CID" ] && break
  sleep 5
done

if [ -n "${_CID:-}" ]; then
  log "webhook health check..."
  docker exec "$_CID" wget -qO- http://localhost:3020/health 2>/dev/null \
    && ok "webhook relay healthy" \
    || log "WARN: webhook health check failed — may still be starting"
else
  log "WARN: webhook container not found yet — check 'docker service ps ${WEBHOOK_SERVICE}'"
fi

echo ""
echo "========================================"
echo "  MBC Bot Deploy Complete!"
echo "  Commit: $(git log --oneline -1)"
echo "  UI:      https://${MBC_HOST:-prod.nesecurity.com.br}/mbc/"
echo "  Webhook: https://${MBC_HOST:-prod.nesecurity.com.br}/mbc/api/webhook/whatsapp"
echo "  Evolution: https://${MBC_HOST:-prod.nesecurity.com.br}/mbc/api/webhook/evolution"
echo "========================================"
