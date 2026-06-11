# Stripe — ADAMGuru prices (Layer 2)

Create **4 Products** in [Stripe Dashboard](https://dashboard.stripe.com/products) → each with **one recurring Price (monthly, MYR)**.

After creation, copy each `price_…` ID into `alm-backend/.env` (see env keys below).

---

## 1. Guru (solo)

| Field | Value |
|--------|--------|
| **Product name** | ADAMGuru — Guru |
| **Description** | 1 subject channel · 20 students · guru teaches ADAM |
| **Price** | **RM 59.00** / month |
| **Currency** | MYR |
| **Billing** | Recurring · Monthly |
| **`.env` key** | `STRIPE_PRICE_ID_GURU_STARTER_MONTHLY` |

**Stripe metadata (Product or Price):**

```text
alamtologi_checkout_type=adam_server
alamtologi_server_id=GURU
alamtologi_server_tier=STARTER
alamtologi_sku=guru.starter.monthly
```

---

## 2. Guru Pro

| Field | Value |
|--------|--------|
| **Product name** | ADAMGuru — Guru Pro |
| **Description** | 5 subject channels · 80 students |
| **Price** | **RM 129.00** / month |
| **Currency** | MYR |
| **Billing** | Recurring · Monthly |
| **`.env` key** | `STRIPE_PRICE_ID_GURU_PROFESSIONAL_MONTHLY` |

**Metadata:**

```text
alamtologi_checkout_type=adam_server
alamtologi_server_id=GURU
alamtologi_server_tier=PROFESSIONAL
alamtologi_sku=guru.professional.monthly
```

---

## 3. Kampus (institution)

| Field | Value |
|--------|--------|
| **Product name** | ADAMGuru — Kampus |
| **Description** | Unlimited subject channels · 300 students · 5 guru accounts |
| **Price** | **RM 399.00** / month |
| **Currency** | MYR |
| **Billing** | Recurring · Monthly |
| **`.env` key** | `STRIPE_PRICE_ID_GURU_INSTITUTION_MONTHLY` |

**Metadata:**

```text
alamtologi_checkout_type=adam_server
alamtologi_server_id=GURU
alamtologi_server_tier=INSTITUTION
alamtologi_sku=guru.institution.monthly
```

---

## 4. Pas Kelas (student add-on)

| Field | Value |
|--------|--------|
| **Product name** | ADAMGuru — Pas Kelas (pelajar) |
| **Description** | Access invited guru kelas — no full private ADAM Premium desk |
| **Price** | **RM 15.00** / month |
| **Currency** | MYR |
| **Billing** | Recurring · Monthly |
| **`.env` key** | `STRIPE_PRICE_ID_GURU_STUDENT_KELAS_MONTHLY` |

**Metadata:**

```text
alamtologi_checkout_type=adam_server
alamtologi_server_id=GURU
alamtologi_server_tier=STUDENT_KELAS
alamtologi_sku=guru.student_kelas.monthly
```

---

## `.env` template

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_ID_GURU_STARTER_MONTHLY=price_
STRIPE_PRICE_ID_GURU_PROFESSIONAL_MONTHLY=price_
STRIPE_PRICE_ID_GURU_INSTITUTION_MONTHLY=price_
STRIPE_PRICE_ID_GURU_STUDENT_KELAS_MONTHLY=price_

# Enable Layer 2 checkout when QA is done
ADAM_LAYER2_ENABLED=true
```

---

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/adam/servers/stripe-catalog` | JSON list of products + env keys + configured status |
| `POST /api/adam/servers/subscribe` | Body: `{ "serverId": "GURU", "tier": "STARTER" }` → Stripe Checkout URL |

**`tier` values:** `STARTER` · `PROFESSIONAL` · `INSTITUTION` · `STUDENT_KELAS`

---

## Pricing model (reminder)

- **Guru plans** — teacher pays; students included up to seat quota.
- **Pas Kelas** — optional student add-on when not on Premium (Layer 1).
