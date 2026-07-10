# Stripe — ADAM General · Premium (+ Tutor Pro)

Create **2 Products** in [Stripe Dashboard](https://dashboard.stripe.com/products) → each with **two recurring Prices** (monthly + annual, USD).

After creation, copy each `price_…` ID into `alm-backend/.env` (production) or `.env.lab` (test).

---

## 1. ADAM General · Premium (umum lane)

| Cycle | Amount | Env key |
|-------|--------|---------|
| Monthly | **USD 19.00** / month | `STRIPE_PRICE_ID_GENERAL_PREMIUM_MONTHLY` |
| Annual | **USD 200.00** / year | `STRIPE_PRICE_ID_GENERAL_PREMIUM_ANNUAL` |

**Product name:** `ADAM General · Premium`

**Description:** ADAM General — 100 messages/day · neural voice · deeper memory

**Checkout tier:** `GENERAL_PREMIUM` → Mongo `PRO` + `consumerProductSku: general_premium`

**Stripe metadata (Product or each Price):**

```text
alamtologi_checkout_type=adam_subscription
alamtologi_product=ADAM_CONSUMER
alamtologi_consumer_sku=general_premium
alamtologi_sku=consumer.general_premium.monthly
alamtologi_billing_cycle=monthly
```

(Use `consumer.general_premium.annual` and `annual` on the annual Price.)

---

## 2. ADAM Tutor · Pro (optional — same USD amounts)

| Cycle | Amount | Env key |
|-------|--------|---------|
| Monthly | **USD 19.00** / month | `STRIPE_PRICE_ID_PRO_MONTHLY` |
| Annual | **USD 200.00** / year | `STRIPE_PRICE_ID_PRO_ANNUAL` |

**Product name:** `ADAM Tutor · Pro`

**Checkout tier:** `PRO` → Mongo `PRO` + `consumerProductSku: pro`

---

## Platform Premium (USD 75 — legacy, not General)

| Cycle | Amount | Env key |
|-------|--------|---------|
| Monthly | **USD 75.00** | `STRIPE_PRICE_ID_PREMIUM_MONTHLY` |
| Annual | **USD 800.00** | `STRIPE_PRICE_ID_PREMIUM_ANNUAL` |

Checkout tier `PREMIUM` → `PROFESIONAL`. Separate product if still offered.

---

## Production `.env` block

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ADAM General · Premium — $19/mo · $200/yr
STRIPE_PRICE_ID_GENERAL_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_GENERAL_PREMIUM_ANNUAL=price_...

# ADAM Tutor · Pro — $19/mo · $200/yr
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_ANNUAL=price_...
```

---

## Provision via CLI (test or live)

From `alm-backend` with `STRIPE_SECRET_KEY` in `.env`:

```bash
npm run provision:consumer-stripe-prices
```

Prints `price_…` IDs to paste into `.env`.

Verify amounts match canonical fees:

```bash
npm run verify:stripe-prices -- --required-only
```

---

## Deploy

```bash
DEPLOY_TARGET=alm-backend ./deploy.sh
```

Restart backend after `.env` changes. Verify: `GET /api/subscriptions/pricing` → `tiers.generalPremium.monthlyAmount` = 19.
