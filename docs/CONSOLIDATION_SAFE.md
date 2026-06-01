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
QWEN_MODEL_DEEP=qwen-plus
QWEN_MODEL_FAST=qwen-turbo
QWEN_MODEL_VISION=qwen-vl-max

ADAM_BUILDER_ENABLED=true
HAWA_ENABLED=true
QXK24_ROOT=/var/www/qxk24

# One-time: lab Mongo URI (same host, database qxk24_lab)
LAB_MONGODB_URI=<copy MONGODB_URI from .env.lab but db name qxk24_lab>
```

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

### 7. Optional — stop lab PM2 (after 24h stable)

```bash
pm2 stop qxk24-backend-lab
```

Keep `.env.lab` and `qxk24_lab` DB as backup; do not delete until Founder confirms.

## Rollback

- Lab PM2 + `qxk24_lab` DB unchanged until you stop it
- Re-enable lab routing in web only if you redeploy an older web build
