# Stripe — ADAM Profesional + Consultant (Layer 1)

Create **1 Product** in [Stripe Dashboard](https://dashboard.stripe.com/products) with **two recurring Prices (MYR)** — monthly and annual.

| Field | Value |
|--------|--------|
| **Product name** | ADAM Profesional |
| **Description** | ADAM Consultant (all fields) + full memory, API, publishing, Builder |
| **Monthly price** | **RM 450.00** / month |
| **Annual price** | **RM 4,500.00** / year (2 months free) |
| **Currency** | MYR |
| **Billing** | Recurring |

**Stripe metadata (Product or each Price):**

```text
alamtologi_checkout_type=subscription
alamtologi_tier=PROFESIONAL
alamtologi_sku=profesional.monthly
```

(Use `profesional.annual` on the annual Price.)

## Production `.env` (alm-backend)

Paste the `price_…` IDs from Stripe after creating the prices:

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_ID_PROFESIONAL_MONTHLY=price_1Tg4YyCYI196tlwhGYnEkarQ
STRIPE_PRICE_ID_PROFESIONAL_ANNUAL=price_1Tg4YyCYI196tlwh38sgydyc
```

Checkout prefers these **fixed Price IDs** when set. If empty, checkout falls back to dynamic `price_data` from `PROFESIONAL_PRICING` (MYR 450 / 4500).

## Test flow

1. Register / sign in as a non-student (`umum`) user
2. Open `/subscription/checkout?tier=PROFESIONAL&billingCycle=MONTHLY`
3. Complete Stripe test card `4242 4242 4242 4242`
4. Success → `/subscription/success` — tier `PROFESIONAL` active

## Related

- Tutor school bands: [STRIPE_ADAM_TUTOR_PRICES.md](./STRIPE_ADAM_TUTOR_PRICES.md)
- ADAMGuru Layer 2: [STRIPE_ADAMGURU_PRICES.md](./STRIPE_ADAMGURU_PRICES.md)
