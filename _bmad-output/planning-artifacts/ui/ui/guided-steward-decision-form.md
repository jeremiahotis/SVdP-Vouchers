# Guided Steward Decision Form — shadcn/ui Template (v1)

**Framework:** shadcn/ui + Tailwind  
**Status:** Canonical Template

This template implements the Shyft Decision Surface pattern and is reusable across all steward-facing decision flows.

---

## Layout

- Single-column
- Centered
- Max width: 640–720px
- Vertical rhythm enforced via spacing tokens

---

## Section Order (Invariant)

1. Header
2. Context Card (read-only)
3. Identity Step
4. Situation Step
5. Decision Cards
6. Steward Confirmation
7. Primary Action

---

## Component Mapping

### Header
- `Card`
- Title: heading scale
- Subtext: muted body text

### Context Card
- `Card` with neutral background
- No inputs
- Label–value pairs only

### Identity Step
- `Form`
- Minimal required fields
- No optional fields initially

### Situation Step
- Conditionally rendered
- Inline helper text only
- No long descriptions

### Decision Cards
- `Card` as selectable surface
- Radio-group behavior
- Accent token applied only to selected state

### Steward Confirmation
- `Accordion` or collapsed section
- Auto-filled where possible
- Muted styling

### Primary Action
- Single `Button` (primary semantic color)
- Secondary action as text link only

---

## Forbidden Patterns

- Multi-column layouts
- Inline policy blocks
- Multiple primary buttons
- Full-file UI rewrites without redesign mode

---

## Implementation Notes

- Patch-first UI updates are mandatory
- All styling must use design tokens
- Component contracts must be respected

This template is invariant unless explicitly redesigned through Review.
