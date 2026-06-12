# Stripe — R&D Eksklusif & Applied Science (annual)

Create **Products + recurring annual Prices (USD)** in [Stripe Dashboard](https://dashboard.stripe.com/products).  
Paste `price_…` IDs into production `.env` or `.env.lab`.

**Charter:** `docs/ALAMTOLOGI_COMMERCIAL_PLAN.md` · **Registration:** `docs/public/ALAMTOLOGI_REGISTRATION_CHECKLIST.md`

---

## SKU → Price (meterai v1.0)

| SKU | Stripe product name (cadangan) | USD/year | `.env` key |
|-----|-------------------------------|----------|------------|
| `RD-IND-SOLO` | Alamtologi R&D Individual | **4,500** | `STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL` |
| `RD-GRAD-SOLO` | Alamtologi R&D Graduate Solo | **4,500** | `STRIPE_PRICE_ID_RD_GRAD_SOLO_ANNUAL` |
| `RD-GRAD-EDU` | Alamtologi R&D Graduate `.edu` PPP | **2,700** | `STRIPE_PRICE_ID_RD_GRAD_EDU_ANNUAL` |
| `RD-LAB-5` | Alamtologi R&D Lab (5 seat) | **45,000** | `STRIPE_PRICE_ID_RD_LAB_5_ANNUAL` |
| `AS-IND-SOLO` | Alamtologi Applied Science Individual | **9,000** | `STRIPE_PRICE_ID_AS_IND_SOLO_ANNUAL` |
| `AS-LAB-5` | Alamtologi Applied Science Lab (5 seat) | **90,000** | `STRIPE_PRICE_ID_AS_LAB_5_ANNUAL` |
| `BUNDLE-IND-AS-SOLO` | Bundle Industri R&D + Applied Solo | **12,000** | `STRIPE_PRICE_ID_BUNDLE_IND_AS_SOLO_ANNUAL` |
| `BUNDLE-IND-AS-LAB` | Bundle Industri R&D + Applied Lab | **120,000** | `STRIPE_PRICE_ID_BUNDLE_IND_AS_LAB_ANNUAL` |

### Bukan self-serve Stripe (invoice / enterprise)

| SKU | USD/year | Nota |
|-----|----------|------|
| `RD-POOL-10` | **35,000** | PO / invoice — `enterprise@alamtologi.com` |
| `RD-POOL-25` | Quote | Custom |
| `RD-POOL-50` | Quote | Custom |

### Metadata kategori (bukan Price berasingan)

| Sub-SKU | Parent Price | Gate checkout |
|---------|--------------|---------------|
| `RD-IND-ACAD` | `STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL` | `rd_category=academic` |
| `RD-IND-IND` | `STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL` | `rd_category=industry` |

---

## Stripe metadata (Product atau Price)

```text
alamtologi_checkout_type=subscription
alamtologi_product_line=rd_applied
alamtologi_sku=RD-IND-SOLO
alamtologi_billing_cycle=annual
```

Graduate `.edu` price: tambah `alamtologi_edu_ppp=true`.

---

## Production `.env` (template)

Ganti `price_…` dengan ID sebenar dari Stripe Dashboard.

```bash
# ── R&D Eksklusif & Applied Science (annual · USD) ─────────────────────────
# Harga meterai: docs/ALAMTOLOGI_COMMERCIAL_PLAN.md v1.0

STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL=price_...          # RD-IND-SOLO · USD 4,500/year
STRIPE_PRICE_ID_RD_GRAD_SOLO_ANNUAL=price_...         # RD-GRAD-SOLO · USD 4,500/year
STRIPE_PRICE_ID_RD_GRAD_EDU_ANNUAL=price_...          # RD-GRAD-EDU · USD 2,700/year (.edu)
STRIPE_PRICE_ID_RD_LAB_5_ANNUAL=price_...             # RD-LAB-5 · USD 45,000/year

STRIPE_PRICE_ID_AS_IND_SOLO_ANNUAL=price_...          # AS-IND-SOLO · USD 9,000/year
STRIPE_PRICE_ID_AS_LAB_5_ANNUAL=price_...             # AS-LAB-5 · USD 90,000/year

STRIPE_PRICE_ID_BUNDLE_IND_AS_SOLO_ANNUAL=price_...   # BUNDLE-IND-AS-SOLO · USD 12,000/year
STRIPE_PRICE_ID_BUNDLE_IND_AS_LAB_ANNUAL=price_...      # BUNDLE-IND-AS-LAB · USD 120,000/year

# Pool / institution — invoice sahaja (tiada Price ID self-serve):
# RD-POOL-10 · USD 35,000/year · enterprise@alamtologi.com
```

---

## Checkout gates (selari `.env`)

| SKU | Gate sebelum bayar |
|-----|-------------------|
| `RD-IND-SOLO` | Kategori Akademik/Industri · project focus |
| `RD-GRAD-EDU` | `.edu` e-mel disahkan |
| `AS-IND-SOLO` · `AS-LAB-5` | **Pack ID** wajib |
| `BUNDLE-*` | Checkbox Applied / R&D Industri |
| `RD-POOL-*` | Jangan guna Stripe Payment Link awam |

Backend wiring: `environments.ts` · `POST /api/rd/checkout` · webhook `checkoutType=rd_applied` · web `/rd/checkout?sku=…`
