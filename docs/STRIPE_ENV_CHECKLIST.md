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

## Deploy

```bash
DEPLOY_TARGET=alm-backend ./deploy.sh
```

Restart backend after `.env` changes. Verify: `GET /api/subscriptions/tiers` shows updated amounts.
