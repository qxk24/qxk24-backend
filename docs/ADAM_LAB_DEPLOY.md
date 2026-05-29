# ADAM Lab — Qwen pilot deployment

Production **Claude backup** stays at `/adam` → `qxk24-backend` (port 5000, DB `qxk24`).

Lab **Qwen pilot** runs at `/adam/lab` → `qxk24-backend-lab` (port **5002**, DB `qxk24_lab`). Do not use 5001 on this VPS — it is usually `qiubbx-admin-api`.

Same codebase. Same constitutional **A**. Different engine **B**.

## VPS steps

1. Copy `qxk24-backend/.env.lab.example` → `.env.lab` and set `DASHSCOPE_API_KEY`, auth, MongoDB URI.
2. Build once: `cd qxk24-backend && npm run build`
3. Quran corpus (once): `npm run quran:fetch` → `data/quran/corpus.json` (ayat only, no tafsir)
4. PM2: `pm2 start ecosystem.config.js --only qxk24-backend,qxk24-backend-lab`
5. Web (manual — not in `deploy.sh` yet):

```bash
# On Mac — sync web source to VPS
rsync -avz -e "ssh -p 2222" --exclude node_modules --exclude .next \
  ~/Desktop/qxk24/qxk24-web/ root@89.117.49.12:/var/www/qxk24/web/

# On VPS — env + build + restart
cd /var/www/qxk24/web
grep -q NEXT_PUBLIC_QXK24_LAB_API_URL .env.production 2>/dev/null || \
  echo 'NEXT_PUBLIC_QXK24_LAB_API_URL=https://api.qxk24.com/lab' >> .env.production
npm ci && npm run build
pm2 restart qxk24-web   # or: pm2 list | grep qxk24
```

Open **`https://qxk24.com/adam/lab`** — not `https://api.qxk24.com/lab`.

## nginx (api.qxk24.com)

Add inside the existing `api.qxk24.com` server block:

```nginx
    location = /lab {
        return 301 /lab/health;
    }

    location /lab/ {
        proxy_pass http://127.0.0.1:5002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
```

Place **above** `location /`. The trailing slash on `proxy_pass` strips `/lab/` so `/lab/health` → backend `/health`.

Health checks:

- Production: `https://api.qxk24.com/health` → `"llmProvider":"anthropic"`
- Lab: `https://api.qxk24.com/lab/health` → `"llmProvider":"qwen","stack":"lab"`

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `EADDRINUSE :::5001` | Another service owns 5001. Use `PORT=5002` in `.env.lab` and ecosystem; `ss -tlnp \| grep 500` |
| `curl …/health` returns `qiubbx-admin-api` | You hit port 5001, not QXK24 lab. Use `curl -s http://127.0.0.1:5002/health` |
| `DASHSCOPE_API_KEY is missing` | Add key to `.env.lab`, redeploy `dist`, `pm2 delete qxk24-backend-lab && pm2 start ecosystem.config.js --only qxk24-backend-lab` |
| `Route not found` JSON in browser | You opened `https://api.qxk24.com/lab` (no path). Use `/lab/health` or deploy web and open `https://qxk24.com/adam/lab` |
| Qwen search slow on every turn | Use `QWEN_SEARCH_STRATEGY=agent` and `forced_search=false` (default). Search only turns on when message needs live data |
| Qwen replies slow (no search) | Set `QWEN_ENABLE_THINKING=false` in `.env.lab`. Routine chat uses `qwen-turbo`; deep modes use `qwen-plus` |
| Still slow on lab | Add `ADAM_FOUNDER_BRAIN_CHARS=8000` and `ADAM_FOUNDER_MESSAGE_WINDOW=12` to `.env.lab`, restart lab PM2 |

## Pilot rules

- Founder + 2 students only
- Lab brain is empty at start — teach fresh or import later; never point lab at production MongoDB
- Pass/fail on voice, cost, stability, AIDIL brain — then decide production switch
