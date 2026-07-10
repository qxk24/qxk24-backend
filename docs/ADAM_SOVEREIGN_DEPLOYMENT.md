# ADAM Sovereign Deployment Guide (Phases 14–18)

ADAM runs **100% locally** on deterministic Universal Language (UL) engines. No DashScope, OpenAI, or Wanx API keys are required.

## Requirements

| Component | Version |
|-----------|---------|
| Node.js | 20+ |
| MongoDB | 6+ (Brain C, sessions, vault) |
| Redis | optional (stream cache) |

## Quick start (zero external AI)

```bash
cd alm-backend
npm ci
cp .env.example .env   # no DASHSCOPE_* or OPENAI_* keys needed
npm run build
npm run verify:sovereignty
npm test -- tests/qxk24brain/deep-ul/
npm start
```

## Sovereignty env flags (Phase 14+)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ADAM_WEB_SEARCH_ENABLED` | `true` | Local UL web-search engine (no DashScope) |
| `ADAM_LOCAL_ML_ENABLED` | `false` | Optional `@xenova/transformers` vision |
| `ADAM_LOCAL_SD_MODEL` | — | Local Stable Diffusion path when ML enabled |

**Sacred memory/token defaults are unchanged.** Do not lower `ADAM_*_BRAIN_CHARS`, `ADAM_*_MAX_TOKENS`, or model tiers without Founder approval.

## Model router (Phase 14)

All routes resolve to UL tiers only:

| Tier | Model id |
|------|----------|
| Deep | `deep-ul` |
| Fast | `fast-ul` |
| Vision | `vision-ul` |

Legacy Qwen hooks live in `src/llm/ul-compat.ts` as no-op stubs.

## UL engine API surface

Public exports from `src/qxk24brain/deep-ul/index.ts`:

- **Dialogue** — `dialogue-synthesizer`, `stream-interceptor`
- **Constitutional** — `constitutional-synthesizer`, `constitutional-judgment-engine`
- **Context** — `context-weaver`, `graph-cache`
- **Search** — `web-search-engine` (local, deterministic)
- **Vision** — `local-vision-engine`, `vision-descriptor`
- **Media** — wired via `adam-media-generation.service.ts`

Profile engines:

```bash
npx tsx scripts/profile-ul-engines.ts
```

## CI sovereignty seal

Every PR must pass:

```bash
npm run verify:sovereignty
```

This fails the build if `dashscope`, `openai`, or `wanx` imports are added under `src/` or `scripts/`.

## adam-coder (Phase 17)

```bash
cd adam-coder
npm ci
npm test -- tests/renderer/store/persona-store.test.ts
npx tsx scripts/test-new-features.ts
```

Personas: Default, Tutor, Researcher, Writer, **Architect**.

## Production checklist

- [ ] `npm run verify:sovereignty` — green
- [ ] `npx tsc --noEmit` — green
- [ ] `npm test -- tests/qxk24brain/deep-ul/` — 13/13
- [ ] No `DASHSCOPE_API_KEY` in `.env`
- [ ] Sacred memory config untouched (`adam-memory.config.ts`)
