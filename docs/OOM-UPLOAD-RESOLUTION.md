# OOM Crash Resolution — ADAM Teaching Upload

**Service:** `alm-backend` (`POST /api/adam/upload`)  
**Issue:** `FATAL ERROR: JavaScript heap out of memory` (~1528 MB near V8 cap)  
**Status:** Resolved (deployed 2026-06-04)  
**Last updated:** 2026-06-04  

---

## 1. Problem summary

`alm-backend` crashed during teaching file uploads (DOCX, PDF, PPTX). PM2 logs showed:

- Heap pinned near **1536–2048 MB** (`--max-old-space-size` cap).
- Process exit → nginx **502 Bad Gateway** on `api.alamtologi.com`.

Concurrent or heavy parses (especially **PDF via pdf.js** and large **DOCX** in the main process) could allocate far more RAM than the file size on disk.

---

## 2. Root cause (as implemented)

| Layer | Failure mode | Fix |
|--------|--------------|-----|
| **Ingress** | `file.arrayBuffer()` then `writeFile` | One unavoidable copy from the Web `File` API to `/tmp`; temp file deleted in `finally`. |
| **DOCX** | Full-file buffer + mammoth in main process | `mammoth.extractRawText({ path })` in **child** — no second full buffer for DOCX on disk path. |
| **PDF** | pdf.js page rasterization / parse RAM | **Fail fast** &gt; `UPLOAD_PDF_PARSE_MAX_MB` (default 40 MB); child 1536 MB heap; **disk `file://` + range** for PDFs ≥ 20 MB; **page cap** size-scaled. |
| **Office** | mammoth / JSZip / lite XML | **Fail fast** &gt; `UPLOAD_OFFICE_PARSE_MAX_MB` (default 50 MB); lite path when `document.xml` &gt; 5 MB uncompressed. |
| **Main API** | Parse OOM killed entire server | `extractTeachingTextInChild()` — OOM kills child only; main stays up. |
| **Concurrency** | N parses × heap | Upload **rate limit** (5/min per user); PM2 `max_memory_restart: 2560M`. |

> **Note:** `GET /health/memory` reports **constitutional** memory (Mongo, teaching records, continuity bridge). For **V8 heap** use `GET /health/heap`.

---

## 3. Solution architecture

### Lifecycle (A → disk → child → C)

1. **A** — `saveTeachingUpload` writes `file.arrayBuffer()` to `os.tmpdir()/alm-upload-<uuid>`.
2. **Parse** — `extractTeachingTextInChild()` spawns `node --max-old-space-size=1536 dist/scripts/extract-teaching-upload.js`, which calls `extractTextFromPath()` (PDFs use `file://` + range loading, not a full-file buffer).
3. **C** — Plain text only (truncated to `UPLOAD_MAX_EXTRACT_CHARS`), stored in Mongo.
4. **Slave death** — `fs.unlink(tempPath)` in `finally`; permanent copy under `ADAM_UPLOAD_DIR`.

### Key files

| File | Role |
|------|------|
| `src/adam/adam-upload.service.ts` | Temp file + child extract + DB |
| `src/adam/adam-upload-extract-child.ts` | Spawn / timeout / OOM message |
| `src/scripts/extract-teaching-upload.ts` | Child entry (compiled to `dist/scripts/`) |
| `src/adam/adam-file-extract.service.ts` | DOCX `{ path }`, PDF page cap, office size gates |
| `start.sh` | Main heap `--max-old-space-size=2048` |
| `ecosystem.config.js` | `max_memory_restart: 2560M` |

### Runtime (production)

```bash
# PM2 (not package.json start)
./start.sh   # NODE_OPTIONS=--max-old-space-size=2048 → node dist/server.js
```

Defaults (env overrides in `.env`):

- `UPLOAD_MAX_FILE_MB=50` (accept; must be ≥ parse gates)
- `UPLOAD_PDF_MAX_PAGES=8` (further capped by file size in code)
- `UPLOAD_PDF_PARSE_MAX_MB=40`
- `UPLOAD_OFFICE_PARSE_MAX_MB=50`

---

## 4. Validation

### Confirm patch on disk

```bash
grep -n 'tmpdir\|writeFile\|extractTeachingTextInChild\|unlink' \
  src/adam/adam-upload.service.ts
# Expect: tempPath (~73), writeFile (~81), extractTeachingTextInChild (~91), unlink (~94)

ls -la dist/scripts/extract-teaching-upload.js
```

### Health

```bash
curl -s http://127.0.0.1:5000/health          # operational banner
curl -s http://127.0.0.1:5000/health/heap     # V8 heap_used, ratio
curl -s http://127.0.0.1:5000/health/memory   # constitutional memory (not heap)
```

### Upload smoke (authenticated)

```bash
# Production API — not :3000 (that is alm-web)
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://api.alamtologi.com/api/adam/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document"
# Expect 201; pm2 logs should NOT show main-process FATAL ERROR heap OOM
```

> PM2 logs do **not** expose V8 `mu` (GC efficiency). Use `/health/heap` or Node crash dumps for heap diagnosis.

---

## 5. Operational safeguards

| Layer | Implementation |
|--------|----------------|
| **Heap monitor** | `GET /health/heap` → `{ heap_used, heap_total, ratio, rss }` — alert if `ratio > 0.92` |
| **Rate limit** | `uploadRateLimit` on `POST /api/adam/upload` — 5 requests / 60s per user (or IP) |
| **Tmp cleanup** | `scripts/cleanup-upload-tmp.sh` — cron: `find "$TMPDIR" -name 'alm-upload-*' -mmin +60 -delete` |
| **PM2** | `max_memory_restart: 2560M` on `alm-backend` |

### VPS cron example

```cron
15 * * * * /var/www/alamtologi/alm-backend/scripts/cleanup-upload-tmp.sh >> /var/log/alm-upload-tmp-cleanup.log 2>&1
```

---

## 6. Deploy checklist

```bash
cd alm-backend && npm run build
DEPLOY_TARGET=alm-backend ./deploy.sh   # from repo root

ssh -p 2222 root@<vps> '
  cd /var/www/alamtologi/alm-backend
  head -2 start.sh
  pm2 reload alm-backend --env production
  curl -s http://127.0.0.1:5000/health/heap | head -c 200
'
```

---

*ADAM sacred memory/token settings (`adam-memory.config.ts`, etc.) were not changed for this fix.*
