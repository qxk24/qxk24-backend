# Stripe — ADAM Business Coach

Create two recurring monthly USD prices in the Stripe Dashboard (or via API).

## Products & prices

| Channel | Product name | Amount | Env key |
|---------|--------------|--------|---------|
| Public | `ADAM Business Coach — Public` | **USD 35.00 / month** | `STRIPE_PRICE_ID_BUSINESS_COACH_PUBLIC_MONTHLY` |
| PIN | `ADAM Business Coach — PIN` | **USD 23.00 / month** | `STRIPE_PRICE_ID_BUSINESS_COACH_PIN_MONTHLY` |

## Required metadata (Checkout / Subscription)

Set on both products/prices or rely on session metadata from the backend:

- `alamtologi_checkout_type` = `subscription`
- `alamtologi_tier` = `BUSINESS_COACH`
- `alamtologi_sku` = `business_coach.monthly`
- `alamtologi_channel` = `public` | `pin`

Backend also sets `checkoutType` = `business_coach_register` on Checkout sessions.

## Webhook

Ensure `checkout.session.completed` is enabled. Handler: `activateBusinessCoachFromStripeCheckout` in `alm-backend/src/business-coach/business-coach-stripe.service.ts`.

## Env example

```bash
ADAM_BUSINESS_COACH_PUBLIC_MONTHLY_USD=35
ADAM_BUSINESS_COACH_PIN_MONTHLY_USD=23
STRIPE_PRICE_ID_BUSINESS_COACH_PUBLIC_MONTHLY=price_xxxxxxxx
STRIPE_PRICE_ID_BUSINESS_COACH_PIN_MONTHLY=price_xxxxxxxx
```

## Verification checklist

- [ ] Public `/subscription/checkout?tier=BUSINESS_COACH` → USD35 Stripe price
- [ ] PIN `/adam/business-coach/daftar` → checkout USD23
- [ ] After payment, `/adam/business-coach/chat` access gate opens
- [ ] Malaysia ADAM Niaga (`/niaga/*`) unchanged
