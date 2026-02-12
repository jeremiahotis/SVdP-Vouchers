# Shyft UX, Design, and Brand System

**Version:** v1 (Authoritative)

**Status:** Locked unless changed through formal Review

---

## Purpose of This Document

This document is the **single source of truth** for how Shyft looks, feels, and behaves when it communicates or facilitates decisions.

It is intentionally written to:
- Be readable and meaningful to Board members and Executive Directors
- Be precise enough to create system-level invariants for engineering and UX
- Scale across products, audiences, and contexts without stylistic drift

This is not a style guide. It is governance.

---

## 1. The Shyft Philosophy of Design

Shyft exists to mediate **dignified decisions** involving real people, real resources, and real constraints.

Our design philosophy is therefore not decorative. It is ethical infrastructure.

### Core Beliefs
- Decisions should be calm, explicit, and traceable
- Stewards should feel trusted, not policed
- Neighbors should never be made to feel like a problem to be solved
- Authority should be exercised quietly, not theatrically

Design is how these beliefs become visible.

---

## 2. Quiet Authority (Design Posture)

### Definition

**Quiet Authority** is the stance that communicates competence, legitimacy, and trust without urgency, emotion, or coercion.

### What Quiet Authority Avoids
- Emotional framing or pity language
- Over-explaining policy in advance
- Visual shouting (multiple CTAs, warnings by default, dense copy)
- UI patterns that imply the user is likely to fail

### What Quiet Authority Emphasizes
- Clear hierarchy
- Restrained color and motion
- Confidence through omission
- Calm progression toward a single decision

Quiet Authority mirrors Shyft’s technical posture: nothing hidden, nothing rushed, nothing manipulative.

---

## 3. Shyft Design Tokens v1 (Locked)

**Name:** Shyft Design Tokens v1 – Quiet Authority

Design tokens are **non-negotiable system infrastructure**. They exist to prevent drift, enforce accessibility, and ensure cross-product coherence.

### Token Categories

- Color
  - Neutral (backgrounds, borders, text)
  - Semantic (success, warning, danger, info)
  - Accent (primary, secondary)
- Typography
  - Serif for headings
  - Sans for body
  - Locked scale and line-height pairs
- Spacing
  - 4px base rhythm only
- Radius & Elevation
  - Soft radius only
  - Maximum two elevation levels

### Hard Rules
- No raw hex values in UI components
- Accent colors never used for informational-only content
- Tokens may not be reordered or renamed without migration

Tokens are defined globally, with module-level overrides allowed only where explicitly permitted.

---

## 4. The Decision Surface Pattern (Canonical)

### Definition

A **Decision Surface** is a UI structure that makes a single steward decision unmistakably clear at any moment.

**Invariant:**
> At any scroll position, the user knows why they are here and what they are deciding next.

Decision Surfaces are mandatory for any action that impacts dignity, safety, eligibility, or resource allocation.

---

## 5. Formal Decision Surface Specification

### Structural Order (Always Preserved)

1. **Context (Read-Only)**
   - Known facts
   - Non-editable
   - Muted visual treatment
   - Never styled like a form

2. **Identity First**
   - Who before what
   - Minimal required fields only

3. **Situation Second**
   - Progressively disclosed
   - Inline explanation where doubt occurs

4. **Decision Third**
   - Presented as a choice, not a field
   - Implemented using Decision Cards

5. **Steward Confirmation Last**
   - De-emphasized
   - Auto-filled where possible

This structure is invariant across all Shyft products.

---

## 6. The Guided Steward Decision Form (Canonical Template)

This is the primary reusable template derived from the Decision Surface pattern.

### Sections
- Header (title + minimal subtext)
- Context Card
- Identity Step
- Situation Step
- Decision Cards
- Confirmation
- Primary Action

### Reuse Domains
- Voucher requests
- Financial assistance
- Resource referrals
- Emergency overrides
- Exceptions and approvals

---

## 7. Information Hierarchy Rules

- Information that cannot be changed must never look editable
- Explanations belong where uncertainty occurs, not where policy lives
- Steward identity must never compete with neighbor identity
- Only one primary action is allowed per Decision Surface

---

## 8. Intentional Design Discipline (What We Remove)

- Redundant headings
- Repeated labels
- Preemptive policy explanations
- Competing calls to action
- Visual signals of mistrust

This restraint is deliberate. It is how dignity is protected.

---

## 9. Accessibility and Equity Commitments

- WCAG AA contrast targets
- Minimum tap targets respected
- Keyboard and screen-reader navigable flows
- Calm visual density by default

Accessibility is not a feature. It is a baseline.

---

## 10. Brand as System, Not Aesthetic

Shyft’s brand is not a logo or color palette.

It is the consistent experience of:
- Calm authority
- Ethical restraint
- Trust in the steward
- Respect for the neighbor

This document governs how we communicate:
- In software
- In documentation
- With funders
- With volunteers
- With partners
- With the public

---

## 11. Worked Examples: Decision Surfaces in Practice

These examples illustrate how the Shyft design system operates in real contexts. They are intentionally written from multiple perspectives to ensure the system is understandable to stewards, leaders, funders, designers, and engineers alike.

The examples below are split evenly between:
- **Narrative walkthroughs** (what a person experiences)
- **Annotated UI breakdowns** (how the pattern is structurally applied)

---

### Example A: Voucher Request (Steward-Facing, Narrative Walkthrough)

**Context**
A Vincentian is meeting with a neighbor and needs to request a clothing voucher.

**What the steward sees**
The page opens with a clear title: *Request a Voucher*. A short line beneath it states the purpose without justification. There is no sense of urgency or warning.

A muted **Voucher Context** card appears first. It shows the store location and hours. The steward cannot edit this information. It feels factual and settled.

The steward is then guided to **Neighbor Information**. Only first name, last name, and date of birth are visible. Nothing else competes for attention.

Once the date of birth is entered, the form gently expands to ask about household size. Inline text explains why this matters, exactly where the question arises.

Next, the steward is asked a single, clear question:
*What kind of support is being requested?*

Voucher types are presented as decision cards. Each option is brief and confident. No policy language appears.

Finally, a collapsed **Requested by** section shows the steward’s name, already filled in.

At the bottom, one primary action exists:
**Submit Voucher Request**

The steward understands the decision they are making and feels confident proceeding.

---

### Example B: Emergency Override (Steward-Facing, Annotated UI Breakdown)

**Header**
- Title: *Emergency Override*
- Subtext: Minimal, factual

**Context Card**
- System state
- Reason override is available
- Read-only, visually muted

**Identity First**
- Neighbor identifier only

**Situation Second**
- Conditions triggering emergency
- Inline explanations only

**Decision Third**
- Decision Cards:
  - Approve Override
  - Decline Override

**Steward Confirmation**
- Auto-filled name
- Optional note

**Primary Action**
- Single confirm button

At no point does the interface imply blame, urgency, or fear.

---

### Example C: Donor Furniture Pickup Scheduling (Donor-Facing, Narrative Walkthrough)

**Context**
A donor is scheduling a furniture pickup through NeighborRoute.

**What the donor sees**
The page title reads: *Schedule a Furniture Pickup*.

A short line explains that the information helps coordinate volunteers and trucks. No emotional appeal is present.

A **Pickup Context** card shows service area boundaries and pickup days. This information is informational and non-editable.

The donor is asked first for **Contact Information**. Only the essential fields appear.

Next, the donor selects furniture categories through clearly labeled options. As selections are made, additional fields appear only when relevant.

The final step presents available pickup windows as a choice.

The primary action reads:
**Confirm Pickup Request**

The donor experiences clarity and confidence, not pressure.

---

### Example D: Resource Referral (Steward-Facing, Annotated UI Breakdown)

**Header**
- Title: *Refer to a Resource*

**Context Card**
- Current case summary
- Read-only

**Identity First**
- Neighbor identification

**Situation Second**
- Eligibility factors
- Progressive disclosure

**Decision Third**
- Resource options presented as Decision Cards

**Steward Confirmation**
- Auto-filled steward info

**Primary Action**
- Submit Referral

---

These examples are not exhaustive. They demonstrate how a single set of invariants scales across roles, domains, and emotional contexts without changing posture.

## 12. Governance and Change Control

This document is **LOCKED for v1**.

Changes require:
- Explicit review
- Clear justification
- Versioned update

This ensures the Shyft ecosystem evolves deliberately, not accidentally.

---

## Closing Statement

Shyft does not rush decisions.
Shyft does not dramatize need.
Shyft does not hide authority.

Shyft makes the right thing clear, and then gets out of the way.

