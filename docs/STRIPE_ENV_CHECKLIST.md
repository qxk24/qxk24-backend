# Stripe `.env` checklist (alm-backend)

After creating products in Stripe Dashboard, paste **price_…** IDs into production `.env` or `.env.lab`.

## Core

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## ADAM Tutor (pelajar lane)

| Band | MYR/month | Env key |
|------|-----------|---------|
| Primary School | 49.90 | `STRIPE_PRICE_ID_TUTOR_PRIMARY_MONTHLY` |
| Secondary School | 89.90 | `STRIPE_PRICE_ID_TUTOR_SECONDARY_MONTHLY` |
| College & University | 129.90 | `STRIPE_PRICE_ID_TUTOR_UNIVERSITY_MONTHLY` |

Legacy alias (secondary): `STRIPE_PRICE_ID_TUTOR_MONTHLY`

```bash
STRIPE_PRICE_ID_TUTOR_PRIMARY_MONTHLY=price_...
STRIPE_PRICE_ID_TUTOR_SECONDARY_MONTHLY=price_...
STRIPE_PRICE_ID_TUTOR_UNIVERSITY_MONTHLY=price_...
ADAM_TUTOR_BILLING_REQUIRED=true
```

## ADAM Profesional + Consultant

| Cycle | MYR | Env key |
|-------|-----|---------|
| Monthly | 450.00 | `STRIPE_PRICE_ID_PROFESIONAL_MONTHLY` |
| Annual | 4500.00 | `STRIPE_PRICE_ID_PROFESIONAL_ANNUAL` |

```bash
STRIPE_PRICE_ID_PROFESIONAL_MONTHLY=price_...
STRIPE_PRICE_ID_PROFESIONAL_ANNUAL=price_...
```

## R&D Eksklusif & Applied Science (annual · USD)

Full table: `docs/STRIPE_RD_APPLIED_PRICES.md`

| SKU | USD/year | Env key |
|-----|----------|---------|
| `RD-IND-SOLO` | 4,500 | `STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL` |
| `RD-GRAD-SOLO` | 4,500 | `STRIPE_PRICE_ID_RD_GRAD_SOLO_ANNUAL` |
| `RD-GRAD-EDU` | 2,700 | `STRIPE_PRICE_ID_RD_GRAD_EDU_ANNUAL` |
| `RD-LAB-5` | 45,000 | `STRIPE_PRICE_ID_RD_LAB_5_ANNUAL` |
| `AS-IND-SOLO` | 9,000 | `STRIPE_PRICE_ID_AS_IND_SOLO_ANNUAL` |
| `AS-LAB-5` | 90,000 | `STRIPE_PRICE_ID_AS_LAB_5_ANNUAL` |
| `BUNDLE-IND-AS-SOLO` | 12,000 | `STRIPE_PRICE_ID_BUNDLE_IND_AS_SOLO_ANNUAL` |
| `BUNDLE-IND-AS-LAB` | 120,000 | `STRIPE_PRICE_ID_BUNDLE_IND_AS_LAB_ANNUAL` |

`RD-POOL-10` (35,000) · Pool 25/50 — **invoice** — tiada env Stripe self-serve.

```bash
STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL=price_...
STRIPE_PRICE_ID_RD_GRAD_SOLO_ANNUAL=price_...
STRIPE_PRICE_ID_RD_GRAD_EDU_ANNUAL=price_...
STRIPE_PRICE_ID_RD_LAB_5_ANNUAL=price_...
STRIPE_PRICE_ID_AS_IND_SOLO_ANNUAL=price_...
STRIPE_PRICE_ID_AS_LAB_5_ANNUAL=price_...
STRIPE_PRICE_ID_BUNDLE_IND_AS_SOLO_ANNUAL=price_...
STRIPE_PRICE_ID_BUNDLE_IND_AS_LAB_ANNUAL=price_...
```

## Deploy

```bash
DEPLOY_TARGET=alm-backend ./deploy.sh
```

Restart backend after `.env` changes. Verify: `GET /api/subscriptions/tiers` shows updated amounts.
