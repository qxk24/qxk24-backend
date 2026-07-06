# Stripe — ADAM Stream Host packages

Create **3 Products** in [Stripe Dashboard](https://dashboard.stripe.com/products) → each with **two recurring Prices** (monthly + annual, USD).

After creation, copy each `price_…` ID into `alm-backend/.env` (production) or `.env.lab` (test).

---

## 1. Business Starter

| Cycle | Amount | Env key |
|-------|--------|---------|
| Monthly | **USD 5.00** / month | `STRIPE_PRICE_ID_STREAM_BUSINESS_STARTER_MONTHLY` |
| Annual | **USD 50.00** / year | `STRIPE_PRICE_ID_STREAM_BUSINESS_STARTER_ANNUAL` |

**Product name:** `ADAM Stream — Business Starter`

**Description:** Removes 60-minute group cap · smart noise cancellation · dial-in · local recording

**Stripe metadata (Product or each Price):**

```text
alamtologi_checkout_type=adam_stream_host
alamtologi_product=ADAM_STREAM
alamtologi_stream_plan=business_starter
alamtologi_sku=stream.business_starter.monthly
alamtologi_billing_cycle=monthly
```

(Use `stream.business_starter.annual` and `annual` on the annual Price.)

---

## 2. Business Standard (most popular)

| Cycle | Amount | Env key |
|-------|--------|---------|
| Monthly | **USD 12.00** / month | `STRIPE_PRICE_ID_STREAM_BUSINESS_STANDARD_MONTHLY` |
| Annual | **USD 120.00** / year | `STRIPE_PRICE_ID_STREAM_BUSINESS_STANDARD_ANNUAL` |

**Product name:** `ADAM Stream — Business Standard`

**Description:** Cloud recording (Google Drive) · breakout rooms · polls & Q&A · up to 150 participants · 2 TB pooled storage

**Metadata:**

```text
alamtologi_checkout_type=adam_stream_host
alamtologi_product=ADAM_STREAM
alamtologi_stream_plan=business_standard
alamtologi_sku=stream.business_standard.monthly
alamtologi_billing_cycle=monthly
```

---

## 3. Business Plus

| Cycle | Amount | Env key |
|-------|--------|---------|
| Monthly | **USD 20.00** / month | `STRIPE_PRICE_ID_STREAM_BUSINESS_PLUS_MONTHLY` |
| Annual | **USD 200.00** / year | `STRIPE_PRICE_ID_STREAM_BUSINESS_PLUS_ANNUAL` |

**Product name:** `ADAM Stream — Business Plus`

**Description:** Attendance tracking · advanced security & admin · up to 500 participants

---

## Percuma & Enterprise

| Tier | Billing |
|------|---------|
| **Percuma** | No Stripe price — free for signed-in users |
| **Enterprise** | Custom — contact `hello@qxk24.com` (up to 1,000 participants) |

---

## Production `.env` block

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_ID_STREAM_BUSINESS_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STREAM_BUSINESS_STARTER_ANNUAL=price_...
STRIPE_PRICE_ID_STREAM_BUSINESS_STANDARD_MONTHLY=price_...
STRIPE_PRICE_ID_STREAM_BUSINESS_STANDARD_ANNUAL=price_...
STRIPE_PRICE_ID_STREAM_BUSINESS_PLUS_MONTHLY=price_...
STRIPE_PRICE_ID_STREAM_BUSINESS_PLUS_ANNUAL=price_...
```

---

## Provision via CLI (test mode)

From `alm-backend` with `STRIPE_SECRET_KEY=sk_test_...` in env:

```bash
npx ts-node --transpile-only src/scripts/provision-adam-stream-stripe-prices.ts
```

Prints `price_…` IDs to paste into `.env`.

---

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/adam/stream/pricing` | Public |
| GET | `/api/adam/stream/subscription/me` | ADAM user |
| POST | `/api/adam/stream/checkout` | ADAM user |
| POST | `/api/adam/stream/checkout/confirm` | ADAM user |

**Checkout body:**

```json
{
  "planId": "business_standard",
  "billingCycle": "annual"
}
```

`planId`: `business_starter` | `business_standard` | `business_plus`

---

## Webhook

Ensure `checkout.session.completed` is enabled. Handler: `activateAdamStreamFromStripeCheckout` in `alm-backend/src/adam/stream/adam-stream-stripe.service.ts`.

`checkoutType` metadata: `adam_stream_host`

---

## Verification checklist

- [ ] `GET /api/adam/stream/pricing` shows all 6 prices as `configured: true`
- [ ] Signed-in user on `/adam/stream/host` → Upgrade → Stripe Checkout opens
- [ ] After payment, `GET /api/adam/stream/subscription/me` returns active plan
- [ ] Host studio unlocks recording / moderation per tier
