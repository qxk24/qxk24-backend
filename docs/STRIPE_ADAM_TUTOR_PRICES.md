# Stripe — ADAM Tutor prices (Layer 1)

Create **6 Prices** in [Stripe Dashboard](https://dashboard.stripe.com/products) — dual channel (public + agent/kod-daftar) **student monthly USD**.

| Band | Public (USD/mo) | Agent / kod (USD/mo) | Public `.env` | Agent `.env` |
|------|-----------------|----------------------|---------------|--------------|
| Primary School | **$25** | **$19** | `STRIPE_PRICE_ID_TUTOR_PRIMARY_PUBLIC_MONTHLY` | `STRIPE_PRICE_ID_TUTOR_PRIMARY_AGENT_MONTHLY` |
| Secondary School | **$33** | **$23** | `STRIPE_PRICE_ID_TUTOR_SECONDARY_PUBLIC_MONTHLY` | `STRIPE_PRICE_ID_TUTOR_SECONDARY_AGENT_MONTHLY` |
| College & University | **$45** | **$29** | `STRIPE_PRICE_ID_TUTOR_UNIVERSITY_PUBLIC_MONTHLY` | `STRIPE_PRICE_ID_TUTOR_UNIVERSITY_AGENT_MONTHLY` |

Legacy single-price keys (fallback for **agent** until `*_AGENT_*` set):

- `STRIPE_PRICE_ID_TUTOR_PRIMARY_MONTHLY`
- `STRIPE_PRICE_ID_TUTOR_SECONDARY_MONTHLY` · `STRIPE_PRICE_ID_TUTOR_MONTHLY`
- `STRIPE_PRICE_ID_TUTOR_UNIVERSITY_MONTHLY`

**Stripe metadata (Product or Price):**

```text
alamtologi_checkout_type=subscription
alamtologi_tier=TUTOR
alamtologi_sku=tutor.monthly
```

---

## Agent wholesale packages — **12 Prices (MYR one-time)**

Ejen **mesti bayar pakej** bila aktif (Silver / Gold / Diamond / Platinum).  
Checkout: `mode=payment` · currency **MYR** · webhook `checkoutType=tutor_agent_package`.

### Cara cipta di Stripe (ulang 12 kali)

1. [Products → Add product](https://dashboard.stripe.com/products)
2. **Pricing model:** One time  
3. **Currency:** MYR  
4. **Amount:** ikut jadual di bawah  
5. Salin **Price ID** (`price_…`) ke `.env` key yang sepadan  
6. **Metadata** (Product atau Price):

```text
alamtologi_checkout_type=tutor_agent_package
alamtologi_band=primary|secondary|university
alamtologi_tier=silver|gold|diamond|platinum
```

### Jadual 12 harga (wajib tepat)

| Product name (cadangan) | MYR | `.env` key |
|-------------------------|-----|------------|
| ADAM Tutor Ejen · Rendah · Silver | **200.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_SILVER` |
| ADAM Tutor Ejen · Rendah · Gold | **900.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_GOLD` |
| ADAM Tutor Ejen · Rendah · Diamond | **1,600.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_DIAMOND` |
| ADAM Tutor Ejen · Rendah · Platinum | **2,100.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_PLATINUM` |
| ADAM Tutor Ejen · Menengah · Silver | **300.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_SILVER` |
| ADAM Tutor Ejen · Menengah · Gold | **1,400.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_GOLD` |
| ADAM Tutor Ejen · Menengah · Diamond | **2,600.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_DIAMOND` |
| ADAM Tutor Ejen · Menengah · Platinum | **3,600.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_PLATINUM` |
| ADAM Tutor Ejen · IPT · Silver | **400.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_SILVER` |
| ADAM Tutor Ejen · IPT · Gold | **1,900.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_GOLD` |
| ADAM Tutor Ejen · IPT · Diamond | **3,600.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_DIAMOND` |
| ADAM Tutor Ejen · IPT · Platinum | **5,100.00** | `STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_PLATINUM` |

**PIN count** (untuk description, bukan harga Stripe): Silver 100 · Gold 500 · Diamond 1,000 · Platinum 1,500.

### `.env` — 12 Price IDs

```bash
STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_SILVER=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_GOLD=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_DIAMOND=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_PLATINUM=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_SILVER=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_GOLD=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_DIAMOND=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_PLATINUM=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_SILVER=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_GOLD=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_DIAMOND=price_xxx
STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_PLATINUM=price_xxx
```

Portal ejen: `/adam/tutor/ejen` → **Pakej & PIN** → **Bayar — Stripe**.  
Webhook endpoint: `https://api.alamtologi.com/api/subscriptions/webhooks/stripe` · event **`checkout.session.completed`**.

---

## Production `.env` (student + ejen)

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://www.alamtologi.com

# Student public self-serve (when opened)
STRIPE_PRICE_ID_TUTOR_PRIMARY_PUBLIC_MONTHLY=price_xxx
STRIPE_PRICE_ID_TUTOR_SECONDARY_PUBLIC_MONTHLY=price_xxx
STRIPE_PRICE_ID_TUTOR_UNIVERSITY_PUBLIC_MONTHLY=price_xxx

# Student agent / kod-daftar checkout
STRIPE_PRICE_ID_TUTOR_PRIMARY_AGENT_MONTHLY=price_xxx
STRIPE_PRICE_ID_TUTOR_SECONDARY_AGENT_MONTHLY=price_xxx
STRIPE_PRICE_ID_TUTOR_UNIVERSITY_AGENT_MONTHLY=price_xxx

# … plus 12 STRIPE_PRICE_ID_TUTOR_EJEN_* above

ADAM_TUTOR_PRIMARY_PUBLIC_MONTHLY_USD=25
ADAM_TUTOR_SECONDARY_PUBLIC_MONTHLY_USD=33
ADAM_TUTOR_UNIVERSITY_PUBLIC_MONTHLY_USD=45
ADAM_TUTOR_PRIMARY_AGENT_MONTHLY_USD=19
ADAM_TUTOR_SECONDARY_AGENT_MONTHLY_USD=23
ADAM_TUTOR_UNIVERSITY_AGENT_MONTHLY_USD=29

ADAM_TUTOR_BILLING_REQUIRED=true
```

See also: [STRIPE_ENV_CHECKLIST.md](./STRIPE_ENV_CHECKLIST.md) · [STRIPE_ADAM_PROFESIONAL_PRICES.md](./STRIPE_ADAM_PROFESIONAL_PRICES.md)

## Test flow

1. **Ejen:** `/adam/tutor/ejen` → pilih pakej → Stripe test card `4242 4242 4242 4242` → PIN aktif  
2. **Pelajar:** kod-daftar → checkout USD monthly  
3. Pre-Stripe soak: `ADAM_TUTOR_BILLING_REQUIRED=false` · dev tanpa 12 IDs guna `price_data` fallback
