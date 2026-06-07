# ADAM consolidation — safe production cutover

Lab and production now share **one codebase** (Qwen only). Production is the canonical stack.

## Safe order (VPS)

### 1. Deploy latest code to production backend

```bash
cd /var/www/qxk24/qxk24-backend
git pull   # or rsync from your machine
npm ci && npm run build
```

### 2. Production `.env` (required)

```env
LLM_PROVIDER=qwen
DASHSCOPE_API_KEY=<your key>
# Singapore / international Model Studio (QXK24 production default):
QWEN_API_BASE=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL_DEEP=qwen-plus
QWEN_MODEL_FAST=qwen-turbo
QWEN_MODEL_VISION=qwen-vl-max
QWEN_ENABLE_THINKING=false
```

If production `.env` is missing Qwen vars, copy the block from `.env.example` (do **not** use obsolete `.env.lab`):

```bash
cd /var/www/qxk24/qxk24-backend
# Edit .env — set DASHSCOPE_API_KEY from https://dashscope.console.aliyun.com/ (Model Studio)
# International keys: QWEN_API_BASE=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
# Mainland keys:     QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
nano .env
pm2 restart qxk24-backend --update-env
```

Without `DASHSCOPE_API_KEY` in **`/var/www/qxk24/qxk24-backend/.env`**, ADAM chat and Builder return: `DASHSCOPE_API_KEY is not configured.`

**Common paste mistake (401 Incorrect API key):** each variable must be on its own line:

```env
DASHSCOPE_API_KEY=sk-xxxxxxxx
QWEN_API_BASE=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

Never merge them into one line (`DASHSCOPE_API_KEY=QWEN_API_BASE=...`) — the server will send the URL as the “key” and DashScope returns 401.

Also set `ADAM_BUILDER_ENABLED=true`, `HAWA_ENABLED=true`, `QXK24_ROOT=/var/www/qxk24`, and optional `LAB_MONGODB_URI` for brain import.

### 3. Restart production API

```bash
pm2 restart qxk24-backend --update-env
curl -s https://api.qxk24.com/health | jq '.llmProvider,.stack'
# expect: "qwen", "production"
```

### 4. Merge lab brain → production (Founder only)

Sign in at `https://qxk24.com/adam/command` → **Students** panel → **Import lab brain**.

Or:

```bash
curl -X POST https://api.qxk24.com/api/adam/students/import-lab-memory \
  -H "Authorization: Bearer <founder-jwt>"
```

This **replaces** production collections with lab data. Run once after backup.

### 5. Deploy web

```bash
cd /var/www/qxk24/qxk24-web
npm ci && npm run build
pm2 restart qxk24-web
```

### 6. Verify

- `https://qxk24.com/adam/command` — Founder command board
- `https://qxk24.com/adam/builder` — Builder
- Old `/adam/lab/*` URLs redirect to `/adam/*`

### 7. Remove lab PM2 (consolidated — one production backend)

```bash
pm2 delete qxk24-backend-lab
pm2 save
```

`ecosystem.config.js` no longer defines `qxk24-backend-lab`. Keep `.env.lab` and `qxk24_lab` DB for import/backup only.

## Rollback

- Lab PM2 + `qxk24_lab` DB unchanged until you stop it
- Re-enable lab routing in web only if you redeploy an older web build
