# Stripe — ADAM Tutor price (Layer 1)

Create **3 Products** (or 3 Prices) in [Stripe Dashboard](https://dashboard.stripe.com/products) — one per school band.

| Band | Product name | Price / month (MYR) | Optional `.env` key |
|------|----------------|---------------------|---------------------|
| Primary School | ADAM Tutor — Primary | **RM 49.90** | `STRIPE_PRICE_ID_TUTOR_PRIMARY_MONTHLY` |
| Secondary School | ADAM Tutor — Secondary | **RM 89.90** | `STRIPE_PRICE_ID_TUTOR_SECONDARY_MONTHLY` |
| College & University | ADAM Tutor — University | **RM 129.90** | `STRIPE_PRICE_ID_TUTOR_UNIVERSITY_MONTHLY` |

Legacy single-price key (secondary): `STRIPE_PRICE_ID_TUTOR_MONTHLY`

**Stripe metadata (Product or Price):**

```text
alamtologi_checkout_type=subscription
alamtologi_tier=TUTOR
alamtologi_sku=tutor.monthly
```

## Production `.env`

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_ID_TUTOR_PRIMARY_MONTHLY=price_1Th86WCYI196tlwhUQC9lIg5
STRIPE_PRICE_ID_TUTOR_SECONDARY_MONTHLY=price_1Th876CYI196tlwhRHDoPoXp
STRIPE_PRICE_ID_TUTOR_UNIVERSITY_MONTHLY=price_1Th87TCYI196tlwhhEzkInix

# Optional legacy alias (secondary) if you only have one old price ID:
# STRIPE_PRICE_ID_TUTOR_MONTHLY=price_xxxxxxxx

ADAM_TUTOR_BILLING_REQUIRED=true
```

Checkout uses **Stripe Price IDs** when set (matched to `tutorLevel` on checkout).  
If IDs are empty, checkout falls back to dynamic `price_data` from `getTutorPricing(level)`.

See also: [STRIPE_ENV_CHECKLIST.md](./STRIPE_ENV_CHECKLIST.md) · [STRIPE_ADAM_PROFESIONAL_PRICES.md](./STRIPE_ADAM_PROFESIONAL_PRICES.md)

## Test flow

1. Login as `pelajar-test` or `sabrina` (lane: pelajar) — **QA bypass** (no Stripe) built into backend
2. Open `/adam/tutor` → profile setup → chat
3. For real billing QA: use a non-bypass pelajar account + Stripe test card `4242 4242 4242 4242`
4. Success → `/adam/tutor` chat

Pre-Stripe soak (all pelajar accounts free): `ADAM_TUTOR_BILLING_REQUIRED=false`
