# ADAM Business Coach — Professional Domains

**Status:** Official product strategy  
**Package:** ADAM Business Coach (master subscription)  
**Founder:** Masa Bayu · QXK24 Kernel v1.7.0  
**Created:** 2026-06-26

---

## Product Direction

ADAM Business Coach remains the **master paid package**. Legal, Health Education, Finance, and Business are **Professional Domains** under the same subscription — not separate products at launch.

### Commercial model

| Channel | Price |
|---------|-------|
| Public checkout | USD 35 / month |
| PIN redemption | USD 23 / month |

- One master package: **ADAM Business Coach — Professional Domains**
- User selects an **active domain** before or during onboarding
- ADAM answers inside the selected domain with **strict domain lock**

### Public naming

**ADAM Business Coach — Professional Domains**

Short copy:

> Choose your domain: Business, Legal, Health Education, or Finance. Same subscription. Specialist reasoning. Domain-locked answers.

---

## Domain Model

| ID | Public label | Scope |
|----|--------------|-------|
| `business` | Business | Strategy, decision clarity, trade-offs, action planning, accountability |
| `legal` | Legal | Legal education, contract review, risk spotting, questions for lawyers — **not legal advice** |
| `health` | Health Education | Health education, symptom understanding, appointment preparation, emergency red flags — **not diagnosis or treatment** |
| `finance` | Finance | Cashflow, budgeting, bookkeeping preparation, tax education — **not certified accounting or tax filing** |

**Health Education** is used in public UI instead of "Medical" to avoid implying diagnosis, treatment, or doctor replacement.

---

## UX Direction

Keep UI compact and professional.

- **One** ADAM Business Coach card on pricing
- Inside the card: small **domain chips** (Business · Legal · Health Education · Finance)
- CTA: `Subscribe — $35/mo` · `Redeem PIN — $23/mo`
- `View domains` opens a compact modal (1–2 lines per domain)
- Registration asks user to **choose a domain** before profile/payment fields

Do **not** add four separate pricing cards or many noisy links.

---

## Register Flow

### Public checkout

1. Open ADAM Business Coach register flow
2. User chooses domain
3. User fills domain-specific profile fields
4. Inline auth if not signed in
5. Stripe checkout at USD 35/month
6. After payment → domain-locked chat

### PIN checkout

1. Open register flow
2. User enters PIN
3. User chooses domain
4. User fills domain-specific profile fields
5. Inline auth if needed
6. Stripe at USD 23/month
7. After payment → domain-locked chat

---

## Domain Lock Rules

Every chat session has **one active professional domain**.

Sessions cannot freely mix Legal, Health, Finance, and Business. To use another domain, the user starts a new session or switches domain intentionally.

| Active domain | Answers |
|---------------|---------|
| Business | Business / coaching questions only |
| Legal | Legal education / reasoning only |
| Health Education | Health education / support only |
| Finance | Finance / accounting / tax education only |

Out-of-domain questions redirect cleanly:

- Legal question inside Business → suggest Legal domain
- Finance/tax inside Business → suggest Finance domain
- Health inside Legal → suggest Health Education domain

---

## Technical Model

Extend Business Coach enrollment:

```ts
professionalDomain: 'business' | 'legal' | 'health' | 'finance'
domainProfile: Record<string, unknown>
```

Domain context and guard logic live in the Business Coach chat route. A shared `professional-suite` engine may be extracted later once stable.

---

## Safety Boundaries

Public language must be honest and safety-first:

| Domain | Safe framing |
|--------|--------------|
| Legal | Legal education and reasoning — not final legal advice |
| Health Education | Health education — not medical diagnosis or treatment |
| Finance | Financial education — not certified accounting or tax advice |
| Business | Thinking partner — not decision replacement |

Avoid absolute claims (e.g. "100% emergency detection") in public-facing copy. Test aggressively internally; communicate honestly externally.

---

## Success Criteria

- Pricing page stays clean: one Business Coach card
- Users understand domains are included in the same package
- Users select a domain before serious chat
- Chat stays inside the selected domain
- Legal, Health, and Finance show professional boundaries clearly
- Business Coach remains the master commercial package
