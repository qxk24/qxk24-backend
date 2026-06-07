# ADAM Lab Pilot — Evaluation Protocol

**Stack:** Production + lab both use Qwen / DashScope (consolidated — no Claude path)  
**Pilot cohort:** 1 Founder + 2 students  
**Duration:** Minimum 2 weeks before AIDIL memory comparison is valid

---

## What We Are Testing

The LLM engine (Layer B) only. Everything else is identical:

- QXK24 constitution and prompts (Layer A) — same
- AIDIL brain engine — same
- ADAM voice rules and Adab — same

A difference in output is a signal about the engine, not about ADAM.

---

## Cold-Start Bias — Read This First

The lab brain (`qxk24_lab`) starts empty.  
Production Claude has accumulated memory.  
**Do not compare long-horizon memory or stage progression until the lab brain has had comparable teaching exposure.**

| Week | What is valid to compare |
|------|--------------------------|
| Week 1–2 | Single-turn Voice/Adab (blinded), Cost, Stability |
| Week 2+ | AIDIL stage transitions, constitutional chain |
| Week 3+ | Long-horizon memory, transformation audit |

Run a **brain warm-up block** in week 1: Founder teaches ADAM core context (mission, student profiles, active stages) explicitly before evaluation begins.

---

## Four Metrics

### 1. Voice / Adab

- Prepare a prompt set of 15–20 representative turns: greeting, Quran citation, constitutional question, business analysis, emotional support, structured table request, LaTeX formula request.
- Run identical prompts on both stacks.
- Export raw replies (no stack label).
- Score blind on: Malay register, constitutional tone, Adab, accuracy, formatting correctness.
- Score 1–5 per dimension per turn. Average per stack.

### 2. Cost

- Source: DashScope usage dashboard (lab) vs Anthropic dashboard (production).
- Normalise to: **cost per meaningful interaction** (not raw token count).
- Log `modelTier` and `modelReason` on saved ADAM messages for breakdown by qwen-turbo vs qwen-plus.

### 3. Stability

- PM2 logs: `pm2 logs qxk24-backend-lab --lines 500`
- Track per 100 turns: stream completion rate, `adam_error` SSE rate, timeout rate, health check failures.
- Compare against production baseline from same period.

### 4. AIDIL Brain Behaviour

- Use Stage Dashboard after 2+ weeks of real teaching.
- Check: stage transition logic, memory tier recall, transformation audit trail.
- Do not evaluate this metric in week 1.

---

## Search Gating — Pilot Tuning

Search-gate ENABLED turns are logged in PM2 with an 80-character message preview.

During pilot, review logs every 3 days:

```bash
pm2 logs qxk24-backend-lab | grep "adam:search-gate"
```

Flag false positives (search fired on a greeting or Quran turn) and adjust `shouldEnableWebSearchForMessage()` keywords in `src/adam/adam-web-search.ts`.  
False negatives surface via pilot user feedback — collect these manually.

---

## Decision Threshold

After minimum 2 weeks + warm brain + blind Voice/Adab scoring:

| Signal | Action |
|--------|--------|
| Qwen Voice/Adab ≥ Claude on blind eval AND cost lower AND stability ≥ 99% | Migrate production B to Qwen, Claude as backup |
| Qwen Voice/Adab within 0.5 points AND cost lower | Migrate with monitoring |
| Qwen Voice/Adab < Claude OR stability < 99% | Extend pilot, do not migrate |

Production Claude remains active backup throughout. Rollback is one env change + PM2 restart.

---

## Rollback

```bash
# If lab has issues, production is untouched — nothing to do.

# If you have migrated production and need to roll back:
# Set LLM_PROVIDER=anthropic in .env, then:
pm2 restart qxk24-backend
```

---

## Pre-Pilot Checklist

1. Web rendering deployed (Markdown, GFM tables, KaTeX) — blind eval invalid without it
2. `curl -s https://api.qxk24.com/lab/health` → `"stack":"lab","llmProvider":"qwen"`
3. `curl -sI https://qxk24.com/adam/lab` → HTTP 200
4. `.env.lab` has `DASHSCOPE_API_KEY`, `QWEN_ENABLE_THINKING=false`, separate `MONGODB_URI`
5. Brief pilot cohort on cold-start bias and warm-up block

See also: [ADAM_LAB_DEPLOY.md](./ADAM_LAB_DEPLOY.md)
