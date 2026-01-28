# Shyft UI Lint Violations (v1)

**Used in:** Review phase validation (UI Review Validator)  
**Goal:** Detect objective drift from Shyft UI invariants and tokens.

Format:
- **Rule ID**
- **Trigger**
- **Severity**
- **Message**
- **Fix Guidance**

Severity levels:
- **ERROR**: Must be fixed or granted a Review-phase exception
- **WARN**: Allowed but creates drift risk; fix recommended
- **INFO**: Advisory

---

## Token & Styling Rules

### SHYFT_UI_TOKENS_001 — Raw Color Detected
- Trigger: Any raw hex/rgb/hsl color in component styles
- Severity: ERROR
- Message: "Raw color detected. Use Shyft tokens only."
- Fix: Replace with `tokens.global.json` or module token reference.

### SHYFT_UI_TOKENS_002 — Arbitrary Spacing
- Trigger: Non-scale spacing (e.g., `p-[13px]`, `gap-3.5`)
- Severity: ERROR
- Message: "Spacing must follow 4/8 rhythm scale."
- Fix: Use spacing tokens / approved Tailwind scale mapping.

### SHYFT_UI_TOKENS_003 — Elevation Exceeds Allowed Levels
- Trigger: More than 2 elevation variants used (e.g., multiple shadow intensities)
- Severity: WARN
- Message: "Elevation exceeds v1 constraints (max 2 levels)."
- Fix: Normalize to allowed elevation tokens.

---

## Decision Surface Structure Rules

### SHYFT_UI_DS_001 — Missing Context-First Section
- Trigger: Decision Surface with no read-only Context Card before inputs
- Severity: ERROR
- Message: "Decision Surface requires Context (read-only) before inputs."
- Fix: Add ContextCard at top with non-editable known facts.

### SHYFT_UI_DS_002 — Multiple Primary CTAs
- Trigger: More than one `primary` button on a Decision Surface
- Severity: ERROR
- Message: "Only one primary CTA allowed per Decision Surface."
- Fix: Demote additional CTAs to secondary link style or move to separate surface.

### SHYFT_UI_DS_003 — Decision Presented as Field
- Trigger: “Decision Third” implemented as dropdown without Decision Cards (when decision has meaningful consequence)
- Severity: WARN
- Message: "Meaningful decisions should be rendered as Decision Cards, not a field."
- Fix: Convert to DecisionCardGroup with explicit options.

### SHYFT_UI_DS_004 — Steward Confirmation Competes with Neighbor Identity
- Trigger: Steward section appears before neighbor identity OR visually dominates
- Severity: ERROR
- Message: "Steward identity must not compete with neighbor identity."
- Fix: Move to Confirmation-last; collapse by default.

### SHYFT_UI_DS_005 — Policy Explained Before Doubt
- Trigger: Multi-sentence policy blocks appear before the relevant input/decision
- Severity: WARN
- Message: "Policy belongs where doubt occurs, not before action."
- Fix: Move copy to inline helper near the field/choice that triggers uncertainty.

---

## Copy & Tone Rules

### SHYFT_UI_COPY_001 — Emotional Framing
- Trigger: Pity/urgency language (e.g., “in need,” “urgent,” “desperate”)
- Severity: WARN (ERROR if donor-facing fundraising context is conflated with steward tools)
- Message: "Avoid emotional framing. Use factual, calm language."
- Fix: Replace with neutral, operational phrasing.

### SHYFT_UI_COPY_002 — Blame Language
- Trigger: Copy implies user failure (“Don’t mess this up,” “Make sure you…”)
- Severity: ERROR
- Message: "UI must not imply steward mistrust."
- Fix: Replace with factual constraints or inline guidance.

---

## Accessibility Rules

### SHYFT_UI_A11Y_001 — Missing Label Association
- Trigger: Inputs without programmatic label
- Severity: ERROR
- Message: "Inputs must have proper label association."
- Fix: Add `<Label htmlFor>` or equivalent.

### SHYFT_UI_A11Y_002 — Focus Not Visible
- Trigger: Focus outlines removed or insufficient
- Severity: ERROR
- Message: "Focus must be visible for keyboard navigation."
- Fix: Restore focus ring tokens.

### SHYFT_UI_A11Y_003 — Tap Targets Too Small
- Trigger: Click targets under minimum size for PWA
- Severity: WARN
- Message: "Tap targets must meet mobile minimum."
- Fix: Increase padding / hit area using tokens.

---
