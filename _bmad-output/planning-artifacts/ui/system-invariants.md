# Shyft UI System Invariants (v1)

**Status:** Authoritative  
**Applies to:** All Shyft products, modules, and steward-facing tools

This document defines the **non-negotiable UI invariants** of the Shyft ecosystem.
Any interface that violates these rules is considered **out of spec**, regardless of visual quality.

---

## Core Invariant

At any scroll position, the user must know:

1. Why they are here  
2. What decision they are being asked to make next  

If either is unclear, the interface has failed.

---

## Invariant 1: Decision Visibility

- Exactly **one primary decision** per screen
- No competing primary CTAs
- Decisions must be explicit, never implied

If a screen supports multiple actions, they must be sequenced across surfaces.

---

## Invariant 2: Context Integrity

- Read-only information must **never look editable**
- Context always precedes inputs
- Context uses muted, neutral visual tokens only

Known facts are informational, not interactive.

---

## Invariant 3: Identity First

- Identity must be established before:
  - Eligibility
  - Allocation
  - Resource type
- Only minimum required identity fields are shown initially

Who comes before what.

---

## Invariant 4: Progressive Disclosure

- Do not show fields before they are relevant
- Explanations appear **where doubt occurs**
- Policy text never precedes user action

Policy lives behind decisions, not in front of them.

---

## Invariant 5: Visual Authority

- Accent colors are reserved for decisions only
- No urgency framing by default
- Calm density is the baseline

The system does not shout to be heard.

---

## Invariant 6: Confirmation Discipline

- Steward confirmation appears last
- Confirmation is de-emphasized
- Auto-fill wherever possible

Confirmation is responsibility, not ceremony.

---

## Enforcement

Violations of these invariants require:
- Explicit Review-phase exception
- Documented rationale
- Versioned approval

These rules are foundational and not stylistic.
