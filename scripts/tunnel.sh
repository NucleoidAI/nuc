#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT/.tunnel-backup"
NGROK_LOG="$BACKUP_DIR/ngrok.log"
PORT=3000

PATCH_TARGETS=("dashboard/config.js" "dashboard/vite.config.ts" ".env.local")

DEFAULT_PROJECT_ID="e6d4744d-a11b-4c75-acad-e24a02903729"
if [[ -n "${TUNNEL_NO_AUTOLOGIN:-}" ]]; then
  AUTOLOGIN_PROJECT_ID=""
else
  AUTOLOGIN_PROJECT_ID="${TUNNEL_PROJECT_ID:-$DEFAULT_PROJECT_ID}"
fi

NGROK_PID=""

log() { printf '\033[36m[tunnel]\033[0m %s\n' "$*"; }
err() { printf '\033[31m[tunnel]\033[0m %s\n' "$*" >&2; }

restore_files() {
  local restored=0
  for rel in "${PATCH_TARGETS[@]}"; do
    local bak="$BACKUP_DIR/$(echo "$rel" | tr '/' '_')"
    if [[ -f "$bak" ]]; then
      cp "$bak" "$ROOT/$rel"
      rm -f "$bak"
      restored=1
    fi
  done
  [[ $restored -eq 1 ]] && log "Patched files restored."
  return 0
}

backup_files() {
  mkdir -p "$BACKUP_DIR"
  for rel in "${PATCH_TARGETS[@]}"; do
    [[ -f "$ROOT/$rel" ]] || continue
    cp "$ROOT/$rel" "$BACKUP_DIR/$(echo "$rel" | tr '/' '_')"
  done
}

cleanup() {
  trap - EXIT INT TERM
  echo
  if [[ -n "$NGROK_PID" ]] && kill -0 "$NGROK_PID" 2>/dev/null; then
    kill "$NGROK_PID" 2>/dev/null || true
    wait "$NGROK_PID" 2>/dev/null || true
  fi
  restore_files
}

command -v ngrok >/dev/null || { err "ngrok not found: brew install ngrok"; exit 1; }
command -v bun   >/dev/null || { err "bun not found."; exit 1; }

if curl -sf -m 2 http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
  log "WARNING: 127.0.0.1:4040 is in use — another ngrok agent is running."
  log "         The new agent will move its web UI to 4041; URL is read from the log."
fi

mkdir -p "$BACKUP_DIR"
restore_files
trap cleanup EXIT INT TERM

log "Starting ngrok (http :$PORT)..."
ngrok http "$PORT" --log stdout --log-format logfmt >"$NGROK_LOG" 2>&1 &
NGROK_PID=$!

PUBLIC_URL=""
for _ in $(seq 1 40); do
  if ! kill -0 "$NGROK_PID" 2>/dev/null; then
    err "ngrok exited unexpectedly. Log:"
    tail -20 "$NGROK_LOG" >&2
    exit 1
  fi
  PUBLIC_URL="$(grep -o 'url=https://[^ ]*' "$NGROK_LOG" 2>/dev/null | tail -1 | cut -d= -f2- || true)"
  [[ -n "$PUBLIC_URL" ]] && break
  sleep 0.5
done

if [[ -z "$PUBLIC_URL" ]]; then
  err "Could not obtain the ngrok public URL within 20s. Log:"
  tail -20 "$NGROK_LOG" >&2
  exit 1
fi

WEB_ADDR="$(grep -o 'starting web service.*addr=[^ ]*' "$NGROK_LOG" | grep -o 'addr=[^ ]*' | tail -1 | cut -d= -f2- || true)"
log "Public URL: $PUBLIC_URL/dashboard"
log "ngrok inspector: http://${WEB_ADDR:-127.0.0.1:4040}"

backup_files

TUNNEL_URL="$PUBLIC_URL" TUNNEL_ROOT="$ROOT" \
  TUNNEL_PROJECT_ID="$AUTOLOGIN_PROJECT_ID" \
  bun "$ROOT/scripts/tunnel-patch.mjs" || true

if [[ -n "$AUTOLOGIN_PROJECT_ID" ]]; then
  cat <<EOF

  WARNING: auto-login is ON — ANYONE who opens this URL is signed in as OWNER
  via admin/admin. To disable: TUNNEL_NO_AUTOLOGIN=1 bun run dev:tunnel

EOF
fi

cat <<EOF
  Note: this URL changes on every run. If you need to test OAuth sign-in, the
  redirect URIs in the Google/GitHub console have to be updated too.
  On the ngrok free plan the first visit shows an interstitial — click "Visit Site".

EOF

if [[ -n "${TUNNEL_DRY_RUN:-}" ]]; then
  log "TUNNEL_DRY_RUN — dev stack not started, cleaning up in ${TUNNEL_DRY_RUN_SLEEP:-3}s."
  sleep "${TUNNEL_DRY_RUN_SLEEP:-3}"
  exit 0
fi

log "Starting dev stack (bun run dev)..."
cd "$ROOT"
bun run dev
