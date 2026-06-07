#!/usr/bin/env bash
# Remove stale alm-backend teaching upload temp files (orphaned after child OOM/kill).
set -euo pipefail
TMP="${TMPDIR:-/tmp}"
find "$TMP" -maxdepth 1 -name 'alm-upload-*' -type f -mmin +60 -print -delete 2>/dev/null || true
