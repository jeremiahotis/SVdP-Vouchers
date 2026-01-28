# Shyft Component Contract Examples (v1)

**Status:** Authoritative examples (pattern + structure)  
**Purpose:** Show how Shyft defines reusable UI primitives with enforceable constraints.

Component contracts:
- Prevent UI drift
- Make Review-phase validation possible
- Make “patch-first” edits feasible on modest hardware and small models

---

## Contract Format (Required Fields)

Each component contract MUST include:
- Purpose (single sentence)
- When to use / when NOT to use
- Props table (name, type, required, default, notes)
- States (loading/empty/error/disabled)
- Accessibility requirements
- Do Not rules (anti-drift constraints)
- Token usage notes

---

## Example 1: `DecisionCard`

### Purpose
Present a choice as a calm, explicit decision surface (not a form field).

### When to Use
- Any “Decision Third” section in a Decision Surface
- Any resource-impacting selection (voucher type, eligibility path, exception approval)

### When NOT to Use
- Simple toggles or preferences with no consequence
- Multi-select checklists (use a structured multi-select component instead)

### Props

| Prop | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `id` | string | yes | — | Stable identifier (used for audit/review) |
| `title` | string | yes | — | The option label |
| `description` | string | no | — | One short sentence max |
| `selected` | boolean | yes | false | Controlled selection |
| `disabled` | boolean | no | false | Must render disabled state clearly |
| `badge` | `{ label: string, tone: "neutral"|"info"|"warning" }` | no | — | Optional constraint hint |
| `onSelect` | () => void | yes | — | Must be keyboard accessible |

### States
- **Default**: neutral border, calm background
- **Selected**: accent border + subtle accent wash
- **Disabled**: muted, no hover
- **Error**: do not show “error state” on card itself; errors belong to the decision section

### Accessibility
- MUST be reachable via keyboard
- MUST have visible focus state
- MUST expose role semantics (radio option within a group)

### Token Usage
- Border/background/text MUST use tokens
- Accent tokens ONLY apply to selected state

### Do Not
- Do not use raw hex colors
- Do not use icons as the only differentiator
- Do not add urgent warning copy inside the card
- Do not allow multiple cards to appear “primary” at once

---

## Example 2: `ContextCard`

### Purpose
Render read-only “Known Facts” so the steward can proceed without confusion.

### When to Use
- Context section at top of Decision Surfaces
- Hours, location constraints, eligibility constraints that are not editable

### When NOT to Use
- Editable settings
- “Instructions” blocks that belong in inline help

### Props

| Prop | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `title` | string | yes | — | e.g., “Voucher Context” |
| `items` | Array<{ label: string, value: string }> | yes | — | Label-value pairs only |
| `tone` | "subtle" \| "neutral" | no | "subtle" | Must remain non-interactive |

### States
- No loading skeleton unless data actually loads asynchronously
- Empty state: “No context details available” (neutral, no blame)

### Accessibility
- Use semantic markup for definition lists where appropriate
- No interactive elements inside

### Token Usage
- Uses neutral subtle background token
- No accent color use

### Do Not
- Do not style like a form
- Do not include buttons/links that imply edits
- Do not hide constraints in long paragraphs

---

## Example 3: `StewardIdentityPanel`

### Purpose
Capture or display steward identity without competing with neighbor identity.

### When to Use
- Confirmation-last section
- “Requested by” metadata capture

### When NOT to Use
- Any section prior to identity/situation/decision
- As a required first step

### Props

| Prop | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `collapsedByDefault` | boolean | no | true | Must be collapsed by default |
| `stewardName` | string | no | — | Prefer auto-filled |
| `stewardId` | string | no | — | Optional |
| `notes` | string | no | — | Optional |

### States
- Collapsed (default)
- Expanded
- Disabled (if system-authenticated and locked)

### Accessibility
- Accordion must be keyboard navigable
- Clear labels for any inputs

### Do Not
- Do not place above neighbor identity
- Do not add policy text inside
- Do not make required unless strictly necessary

---

## Example 4: Donor-Facing `PickupSchedulerCard`

### Purpose
Enable donors to schedule a pickup with calm, predictable steps and minimal friction.

### When to Use
- Donor self-scheduling flows (NeighborRoute)
- Appointment selection + confirmation

### When NOT to Use
- Complex multi-criteria intake requiring full Decision Surface (use Decision Surface pattern)

### Props

| Prop | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `availableSlots` | Array<{ start: string, end: string }> | yes | — | ISO strings |
| `selectedSlot` | string | no | — | ISO start time |
| `address` | string | yes | — | Can be prefilled |
| `accessNotes` | string | no | — | “Stairs, gate code, etc.” |
| `onConfirm` | () => void | yes | — | Single primary action |

### States
- Loading: skeleton list of slots
- Empty: “No pickup times available yet. Check back tomorrow.”
- Error: neutral error copy, no blame

### Accessibility
- Slot list must be keyboard navigable
- Clear time formatting

### Do Not
- Do not use urgency (“Hurry, slots going fast”)
- Do not introduce multiple CTAs
- Do not expand into long explanations

---
