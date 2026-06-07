#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
exec node ./dist/server.js
