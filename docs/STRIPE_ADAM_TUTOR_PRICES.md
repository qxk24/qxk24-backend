# Stripe — ADAM Tutor prices (production)

Last aligned: **School | University** USD monthly · **RM200** wholesale 100 PIN (Jul 2026).

---

## Copy-paste — production `alm-backend/.env`

Create **6 Stripe Prices** in [Dashboard → Products](https://dashboard.stripe.com/products) (**Live** mode):

```bash
# ── Tutor student monthly (recurring USD) ──
STRIPE_PRICE_ID_TUTOR_PUBLIC_SCHOOL_MONTHLY=price_...       # $19.00 USD / month
STRIPE_PRICE_ID_TUTOR_PUBLIC_UNIVERSITY_MONTHLY=price_...   # $25.00 USD / month
STRIPE_PRICE_ID_TUTOR_AGENT_SCHOOL_MONTHLY=price_...        # $17.00 USD / month
STRIPE_PRICE_ID_TUTOR_AGENT_UNIVERSITY_MONTHLY=price_...    # $19.00 USD / month

# ── Commercial agent wholesale (one-time MYR · 100 PIN · RM200 each) ──
STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_SCHOOL=price_...      # RM 200.00 · School
STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_UNIVERSITY=price_...   # RM 200.00 · University

# ── Display amounts (monthly USD must match Stripe Prices above) ──
ADAM_TUTOR_PUBLIC_SCHOOL_USD=19
ADAM_TUTOR_PUBLIC_UNIVERSITY_USD=25
ADAM_TUTOR_AGENT_SCHOOL_USD=17
ADAM_TUTOR_AGENT_UNIVERSITY_USD=19

STRIPE_ENABLED=true
ADAM_TUTOR_BILLING_REQUIRED=true
```

**Legacy fallback:** if `STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_*` are empty, backend still reads old `STRIPE_PRICE_ID_TUTOR_EJEN_*_SILVER` keys (must also be **RM200** if you use them).

---

## 1. Student monthly subscriptions

| Who pays | Band | Amount | Env key |
|----------|------|--------|---------|
| Public | School | **$19/mo** | `STRIPE_PRICE_ID_TUTOR_PUBLIC_SCHOOL_MONTHLY` |
| Public | University | **$25/mo** | `STRIPE_PRICE_ID_TUTOR_PUBLIC_UNIVERSITY_MONTHLY` |
| Agent PIN | School | **$17/mo** | `STRIPE_PRICE_ID_TUTOR_AGENT_SCHOOL_MONTHLY` |
| Agent PIN | University | **$19/mo** | `STRIPE_PRICE_ID_TUTOR_AGENT_UNIVERSITY_MONTHLY` |

Primary and secondary both use the **School** price.

---

## 2. Commercial agent wholesale (100 PIN)

| Band | Amount | Env key |
|------|--------|---------|
| **School** | **RM 200** (100 PIN) | `STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_SCHOOL` |
| **University** | **RM 200** (100 PIN) | `STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_UNIVERSITY` |

Same price both bands — separate Stripe products optional (for reporting only).

```bash
stripe prices create --live --currency=myr --unit-amount=20000 \
  -d "product_data[name]=ADAM Tutor Agent · School · 100 PIN"

stripe prices create --live --currency=myr --unit-amount=20000 \
  -d "product_data[name]=ADAM Tutor Agent · University · 100 PIN"
```

Charity agents: no wholesale Stripe checkout.

---

## 3. Deploy

```bash
ssh -p 2222 root@<your-vps>
nano /var/www/alamtologi/alm-backend/.env
cd /var/www/alamtologi/alm-backend && pm2 reload ecosystem.config.js --update-env
```

Smoke test: `/pricing` shows **$19/$25** and **RM200** wholesale; agent checkout shows **RM200**.
