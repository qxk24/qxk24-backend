#!/usr/bin/env bash
# Live test for ADAM licensed media API keys (production VPS).
# Usage: ./scripts/test-media-apis.sh
# Loads .env from repo root — never prints secret values.

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

ok=0
fail=0

check() {
  local name="$1"
  local url="$2"
  shift 2
  local body
  body="$(curl -sf "$@" "$url" 2>/dev/null || true)"
  if [[ -n "$body" ]] && echo "$body" | grep -qE '"results"|"photos"|"hits"|"response"'; then
    echo "OK  $name"
    ok=$((ok + 1))
  else
    echo "FAIL $name (no results or request error)"
    fail=$((fail + 1))
  fi
}

echo "=== ADAM media API key check ==="
echo "unsplash: $([[ -n "${ADAM_UNSPLASH_ACCESS_KEY:-}" ]] && echo set || echo missing)"
echo "pexels:   $([[ -n "${ADAM_PEXELS_API_KEY:-}" ]] && echo set || echo missing)"
echo "pixabay:  $([[ -n "${ADAM_PIXABAY_API_KEY:-}" ]] && echo set || echo missing)"
echo ""

if [[ -n "${ADAM_UNSPLASH_ACCESS_KEY:-}" ]]; then
  check unsplash \
    "https://api.unsplash.com/search/photos?query=chemistry&per_page=1" \
    -H "Authorization: Client-ID ${ADAM_UNSPLASH_ACCESS_KEY}"
else
  echo "SKIP unsplash (no ADAM_UNSPLASH_ACCESS_KEY)"
fi

if [[ -n "${ADAM_PEXELS_API_KEY:-}" ]]; then
  check pexels \
    "https://api.pexels.com/v1/search?query=chemistry&per_page=1" \
    -H "Authorization: ${ADAM_PEXELS_API_KEY}"
else
  echo "SKIP pexels (no ADAM_PEXELS_API_KEY)"
fi

if [[ -n "${ADAM_PIXABAY_API_KEY:-}" ]]; then
  check pixabay \
    "https://pixabay.com/api/?key=${ADAM_PIXABAY_API_KEY}&q=chemistry&image_type=photo&per_page=1"
else
  echo "SKIP pixabay (no ADAM_PIXABAY_API_KEY)"
fi

check openverse \
  "https://api.openverse.org/v1/images/?q=chemistry&page_size=1"

check internet_archive \
  "https://archive.org/advancedsearch.php?q=chemistry&fl[]=identifier&rows=1&output=json"

echo ""
echo "Passed: $ok | Failed: $fail"
[[ "$fail" -eq 0 ]]
