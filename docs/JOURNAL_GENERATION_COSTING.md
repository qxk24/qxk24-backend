# Formal Costing Schedule — ADAM Constitutional Journal Generation

**Document ID:** QXK24-COST-JNL-2026-001  
**System:** QIUBBX Management System · QXK24 Kernel v1.7.0  
**Prepared for:** P.alt Masa Bayu (Founder)  
**Prepared by:** QXK24 Engineering  
**Date:** 28 May 2026  
**Status:** Estimate — API list pricing; excludes infrastructure  
**Classification:** Internal — Founder & Operations  

---

## 1. Purpose

This schedule sets out the **estimated direct API cost** to produce **one Alamtologi constitutional journal manuscript** through ADAM — from founder instruction in **JOURNAL GEN** mode through IMRaD structuring, seven-principle analysis, Hukum Z scoring, and optional `<adam_journal_seal>` submission to the Founder review queue.

It supports budget planning for the **ADAM Lab** stack (primary journal path) and comparison with the **Production** Claude backup stack.

---

## 2. Scope

### 2.1 In scope

| Item | Description |
|------|-------------|
| LLM inference | Chat streaming for journal drafting and sealing |
| Auto-continuation | Up to two additional segments when output exceeds single-turn limit |
| Background brain transform | Post-message QXK24Brain absorption (founder turns) |
| Public submit path | Single non-streaming analysis call on `/api/adam/journal/submit` |

### 2.2 Out of scope

| Item | Notes |
|------|--------|
| VPS hosting, MongoDB Atlas, Redis, R2 | Fixed operational overhead — not per journal |
| Founder labour | Review, approval, teaching input |
| Web front-end delivery | Static/SSR — negligible marginal cost |
| DashScope / Anthropic trial credits | Promotional — not assumed |
| Currency conversion fees | Bank/card FX on API billing |

---

## 3. Technical basis (system configuration)

Configuration as deployed **28 May 2026**:

| Parameter | ADAM Lab (`QXK24_STACK=lab`) | Production |
|-----------|------------------------------|------------|
| LLM provider | Qwen (DashScope) | Anthropic Claude |
| Deep model | `qwen-plus` | `claude-sonnet-4-6` |
| Journal mode | `JOURNAL_GEN` | `JOURNAL_GEN` |
| Max output tokens / turn | `ADAM_JOURNAL_MAX_TOKENS` = **8,192** | **8,192** |
| Max continuations / journal turn | **2** (3 segments total) | **2** |
| Founder deep output (non-journal) | `ADAM_FOUNDER_DEEP_MAX_TOKENS` = **8,192** | **8,192** |
| Lab context budget | Brain 8,000 chars; 12-message window | Brain 48,000 chars; 30-message window |

**Primary workflow (Founder):**  
`/adam/lab` → JOURNAL GEN → seal → `/adam/lab/journals/review` → approve & publish.

---

## 4. Unit pricing assumptions

Rates are **vendor list prices** (May 2026). Actual invoices may differ by region, tier, and promotions.

### 4.1 ADAM Lab — Alibaba DashScope (`qwen-plus`)

| Token type | USD per 1M tokens | MYR per 1M tokens¹ |
|------------|-------------------|---------------------|
| Input | $0.40 | RM 1.76 |
| Output | $1.20 | RM 5.28 |

¹ MYR converted at **USD 1.00 = RM 4.40** (planning rate).

### 4.2 Production — Anthropic (`claude-sonnet-4-6`)

| Token type | USD per 1M tokens | MYR per 1M tokens¹ |
|------------|-------------------|---------------------|
| Input | $3.00 | RM 13.20 |
| Output | $15.00 | RM 66.00 |

### 4.3 Cost formula

For each API call:

```text
Cost (USD) = (Input_tokens ÷ 1,000,000 × Input_rate)
           + (Output_tokens ÷ 1,000,000 × Output_rate)
```

Total journal cost = sum of all chat segments + brain transforms (+ public submit call if applicable).

---

## 5. Token workload model — one journal

### 5.1 Founder chat path (Lab — primary)

| Component | Typical input tokens | Typical output tokens | API calls |
|-----------|---------------------:|----------------------:|----------:|
| **A. Single-turn journal + seal** | 10,000 – 14,000 | 5,500 – 8,000 | 1 |
| **B. One auto-continuation** | +18,000 – 22,000 | +4,000 – 7,000 | +1 |
| **C. Two auto-continuations** | +36,000 – 44,000 | +8,000 – 14,000 | +2 |
| **D. Brain transform (per founder message)** | 1,500 – 2,500 | 600 – 1,200 | 1 per turn |

**Interpretation:**

- **Scenario L1 (efficient):** One JOURNAL GEN turn; manuscript and seal complete within 8,192 output tokens → **Component A only** + **one D**.
- **Scenario L2 (typical):** Two founder messages (draft, then seal) + one continuation → **A + B** + **two D**.
- **Scenario L3 (heavy):** Extended teaching thread, two continuations, three founder messages → **A + B + partial C** + **three D**.

### 5.2 Public submit path (`/journals/submit`)

| Component | Input tokens | Output tokens | API calls |
|-----------|-------------:|--------------:|----------:|
| Journal analysis (`submitJournal`) | 3,000 – 6,000 | 3,500 – 6,500 | 1 |

No chat continuations. Uses same deep model as stack. Does not include prior ADAM teaching context.

---

## 6. Unit cost schedule — per journal (MYR)

### 6.1 ADAM Lab (Qwen) — Founder workflow

| Scenario | Description | Total input (approx.) | Total output (approx.) | **USD** | **MYR** |
|----------|-------------|------------------------:|-----------------------:|--------:|--------:|
| **L1** | Single turn, sealed | 12,000 | 7,000 | 0.013 | **0.06** |
| **L2** | Typical (2 turns + 1 continue) | 38,000 | 16,000 | 0.034 | **0.15** |
| **L3** | Heavy (3 turns + 2 continue) | 62,000 | 27,000 | 0.057 | **0.25** |
| **L-max** | Upper bound (lab config ceiling) | 80,000 | 35,000 | 0.074 | **0.33** |

**Recommended planning figure (Lab):** **RM 0.15 per journal** (Scenario L2).

### 6.2 ADAM Lab (Qwen) — Public submit

| Scenario | **USD** | **MYR** |
|----------|--------:|--------:|
| Single analysis call | 0.008 – 0.012 | **0.04 – 0.05** |

### 6.3 Production (Claude Sonnet) — Founder workflow

| Scenario | Total input (approx.) | Total output (approx.) | **USD** | **MYR** |
|----------|------------------------:|-----------------------:|--------:|--------:|
| **P1** | Single turn | 22,000 | 7,000 | 0.17 | **0.75** |
| **P2** | Typical with continuation | 55,000 | 18,000 | 0.44 | **1.94** |
| **P3** | Heavy | 90,000 | 30,000 | 0.72 | **3.17** |

**Lab vs Production (typical):** Production is approximately **12×** the Lab API cost per journal.

---

## 7. Volume projections (API only)

Planning rate: **RM 0.15 / journal** (Lab, Scenario L2).

| Volume | Journals / period | Estimated API (MYR) | Estimated API (USD) |
|--------|-------------------|--------------------:|--------------------:|
| Pilot | 4 / month | 0.60 | 0.14 |
| Steady | 1 / week | 0.65 / month | 0.15 / month |
| Active | 1 / day | 4.50 / month | 1.02 / month |
| Batch | 12 / month | 1.80 / month | 0.41 / month |

At **Production** pricing (Scenario P2, ~RM 1.94/journal):

| Volume | Estimated API (MYR / month) |
|--------|----------------------------:|
| 1 / week | 8.40 |
| 1 / day | 58.20 |

---

## 8. Sensitivity factors

| Factor | Effect on cost |
|--------|----------------|
| **Output length** | Dominant driver — output priced 3× (Qwen) to 5× (Claude) vs input |
| **Auto-continuation** | Each continuation adds one full-depth input (includes prior assistant text) |
| **Prior chat in session** | Increases input tokens on every subsequent turn |
| **Teaching file uploads** | Extracted text injected into context — increases input |
| **Web search (Lab agent mode)** | Additional tokens if model invokes search — rare in journal mode |
| **Brain transform** | Small additive cost per founder message (~RM 0.01–0.02 each on Lab) |
| **Failed / retried API calls** | Up to 3 retries on transient errors — occasional overrun |

---

## 9. Cost control measures (implemented)

| Control | Purpose |
|---------|---------|
| Lab stack for journal pilot | Routes journals to Qwen — lowest unit cost |
| `ADAM_JOURNAL_MAX_TOKENS = 8192` | Caps single-segment output |
| Auto-continue (max 2) | Completes long manuscripts without manual re-prompt |
| Lab memory budget reduction | Limits input context size on `QXK24_STACK=lab` |
| `QWEN_ENABLE_THINKING=false` (Lab) | Avoids reasoning-token overhead |
| Seal-in-tag workflow | Enables review queue without separate generation pass |

---

## 10. Recommendations

1. **Budget RM 0.15 per journal** for Lab operations; hold **RM 0.35** contingency for unusually long manuscripts.
2. **Reserve Production Claude** for constitutional backup and quality comparison — not routine journal volume.
3. **Use JOURNAL GEN mode** explicitly; avoid drafting full manuscripts in TEACHING mode without seal intent (reduces stray turns).
4. **Split very long source material** across sections if cost or truncation recurs — e.g. Introduction/Background, then Findings/Discussion, then seal.
5. **Optional next step:** Enable per-turn token metering in API logs for actuals vs this schedule.

---

## 11. Certification

This schedule is an **engineering estimate** based on configured limits and published vendor pricing. It is not a tax invoice or contractual quote.

| Field | Value |
|-------|--------|
| Document | QXK24-COST-JNL-2026-001 |
| Version | 1.0 |
| Effective date | 28 May 2026 |
| Review due | Upon change to `ADAM_JOURNAL_MAX_TOKENS`, model tier, or vendor pricing |
| Approved by | _P.alt Masa Bayu — Founder_ |
| Date | _________________ |

---

## Appendix A — Configuration reference

```text
ADAM_JOURNAL_MAX_TOKENS=8192
ADAM_FOUNDER_DEEP_MAX_TOKENS=8192
QWEN_MODEL_DEEP=qwen-plus
ANTHROPIC_MODEL_DEEP=claude-sonnet-4-6
QXK24_STACK=lab  →  LLM_PROVIDER=qwen
```

## Appendix B — Glossary

| Term | Meaning |
|------|---------|
| **JOURNAL GEN** | ADAM chat mode for IMRaD constitutional journal drafting |
| **Seal** | `<adam_journal_seal>` JSON block → `PENDING_REVIEW` in MongoDB |
| **Auto-continuation** | Server-side second/third LLM segment when manuscript is incomplete |
| **Brain transform** | Background A+B=C absorption into `qxk24_lab` / `qxk24` brain |

---

*Born from Time. Built by Truth.*  
*QXK24 · ERA_1 · The Teaching Era*
