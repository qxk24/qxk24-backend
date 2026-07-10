# UL Test Retirement — LLM Guard Suite

**Date:** 2026-07-10  
**Decision:** ADAM is 100% sovereign UL. Tests that verified cleanup of unpredictable LLM output are retired.

## Retired (Category 1)

LLM-era guard tests removed from `tests/`. They asserted strip/repair of model leaks (Arabic gloss, Alamtologi billboards, tutor language drift, technical display reshaping).

See git history for deleted filenames (`git log --diff-filter=D --summary`).

## Kept

- `tests/qxk24brain/deep-ul/` — UL engine (13/13)
- Turn-gate / brain-river routing (deterministic IQ/EQ)
- Sovereignty seal (`npm run verify:sovereignty`)
- Pricing, login, tutor fee, consumer plan, media quota
- `adam-usd-myr-rate.test.ts` — Frankfurter rate service (not LLM)

## Migrated / Fixed (Category 2–3)

- `adam-tutor-agent-pin-invite.test.ts` — ENV mock includes `ADAM_DEFAULT_LANGUAGE`
- `lab-economics-turn.manual.test.ts` — retired (LLM essay repair dry-run)
