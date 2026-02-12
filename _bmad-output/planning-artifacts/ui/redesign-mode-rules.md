# Shyft Redesign Mode Rules (v1)

**Status:** Authoritative  
**Purpose:** Allow intentional full redesigns without violating “patch-first” discipline by default.

Shyft UI work defaults to **patch-first** (targeted diffs).
Redesign Mode is the controlled exception path.

---

## Default Rule: Patch-First

Unless Redesign Mode is explicitly enabled:
- UI changes MUST be proposed as targeted patches
- Full-file rewrites are treated as high-risk churn
- Review must flag churn and require explicit steward approval

---

## What Redesign Mode Is

Redesign Mode is a session-scoped posture that:
- Permits structural layout changes
- Permits component reorganization
- Permits template migration (within Shyft templates)
- Still requires tokens + invariants compliance

Redesign Mode is **not** permission to:
- Introduce new ad-hoc styles
- Ignore Decision Surface invariants
- Add multiple CTAs
- Add “wow” motion or novelty patterns by default

---

## How Redesign Mode Is Activated

Redesign Mode MUST be explicit and logged.

Allowed activation mechanisms:
- CLI flag (session): `--mode redesign`
- One-command override: `--redesign-once`
- Repo policy default (rare): only if set in `.shyft/config.json` and still bounded by invariants

Activation MUST:
- Emit a Review-auditable event
- Record the active UI policy snapshot hash

---

## Redesign Mode Constraints (Still Enforced)

Even in Redesign Mode, these remain non-negotiable:
- Token-only styling
- One primary CTA per Decision Surface
- Context-first, Identity-first ordering (unless redesigning a non-decision surface)
- Accessibility baseline (labels, focus, tap targets)
- Calm copy posture (no emotional framing)

---

## Redesign Mode Deliverables (Required)

When Redesign Mode is used, output MUST include:
1. **Before/After intent summary** (1–3 bullets)
2. **Template mapping** (which canonical template the screen now follows)
3. **Component contract impact** (new components or changes require contracts)
4. **Decision Surface checklist result** (pass/fail with reasons)
5. **Churn disclosure** (what was rewritten and why)

---

## Review-Phase Handling

- Redesign Mode outcomes are assessed only in **Review phase**
- Review MUST produce:
  - violations (lint-style)
  - suggested fixes
  - any exception requirements

If redesign introduces drift:
- It MUST be fixed
- Or explicitly approved as a versioned exception

---

## Devil’s Advocate Check

Concern: "Does redesign mode create chaos?"

Answer:
Not if it is explicit, logged, and bounded.
It enables intentional change without normalizing churn.

Shyft allows redesigns.
Shyft does not allow silent redesigns.
