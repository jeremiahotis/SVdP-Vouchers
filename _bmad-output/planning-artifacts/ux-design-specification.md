---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
inputDocuments:
  - ecosystem-rule-book.md
  - _bmad-output/planning-artifacts/ui/decision-surface-review-checklist.md
  - _bmad-output/planning-artifacts/ui/redesign-mode-rules.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_do_dont_appendix_v_1.md
  - _bmad-output/planning-artifacts/ui/system-invariants.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_design_and_brand_system_source_of_truth_v_1.md
  - _bmad-output/planning-artifacts/ui/quiet-authority-canonical-color-tokens-v1.0.0.md
  - _bmad-output/planning-artifacts/ui/ui/review/lint-style-ui-violations.md
  - _bmad-output/planning-artifacts/ui/ui/components/component-contract-examples.md
  - _bmad-output/planning-artifacts/ui/ui/guided-steward-decision-form.md
  - _bmad-output/planning-artifacts/ui/ui/ui-review-validator-output-schema-v1.md
  - _bmad-output/planning-artifacts/voucher-shyft-prd.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/voucher-shyft-prd-validation-report.md
  - _bmad-output/project-context.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/development-guide.md
  - docs/deployment-guide.md
  - docs/component-inventory.md
  - docs/source-tree-analysis.md
  - docs/data-models-plugin.md
  - docs/api-contracts-plugin.md
  - docs/comprehensive-analysis-plugin.md
  - docs/CUTOVER.md
  - docs/TENANCY_AND_ACCESS.md
  - Image #1
  - Image #2
lastStep: 14
---

# UX Design Specification SVdP-Vouchers

**Author:** Jeremiah
**Date:** 2026-02-04 05:40:45

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->
## Executive Summary

### Project Vision
VoucherShyft is a standalone module that delivers dignity‑first voucher workflows with refusal‑clear outcomes and minimal friction. Tenant context is derived from host + JWT match only, and tenant switching requires a host change. A critical pre‑launch requirement is coat entitlement tracking (per member, per year) to prevent counter disputes. The UX must enforce Decision Surface invariants and support high‑tempo cashier redemption on touchscreen POS devices.

### Target Users
- Vincentian stewards requesting vouchers.
- Cashiers redeeming vouchers at POS.
- Store admins managing catalog availability, rules, and staff.
- Partner agency staff issuing vouchers via embedded form.
- Managers/auditors handling overrides and review contexts.
- Platform admins operating VoucherShyft platform admin.
- Legacy WP reference‑only operators (temporary, 30‑day window).

### Key Design Challenges
- Entitlement complexity without conflict: coat entitlement is annual/per‑person; the cashier must resolve “already used” outcomes without escalation.
- Entitlement input dependency: voucher issuance must capture or reference the household member count used for coat entitlement; changes after issuance require a governed adjustment path with audit.
- Mutable catalog governance: furniture catalog is structured but changeable; updates must be tenant‑scoped and immediately reflected without confusion.
- Touchscreen speed + accuracy: cashier flow is touchscreen POS under time pressure; design for taps, scanning, and minimal typing.
- Latency posture at POS: redemption must show immediate “working” state and, if latency exceeds X seconds, show a clear retry/next step without double‑redeeming.
- Decision Surface discipline across roles: maintain context‑first, identity‑first, single‑decision structure even with multi‑type voucher complexity.

### Design Opportunities
- Make coat entitlement a calm, automatic benefit: show “included” at issuance, not a discretionary request, reducing negotiation and conflict.
- Progressive disclosure for furniture catalog: search + category browsing + constraints without overwhelming stewards/cashiers.
- POS‑tuned refusal language: short headline + next step (e.g., “Not eligible this year,” “Already redeemed,” “Ask a manager”) with neutral tone.
## Core User Experience

### Defining Experience
The core loop is cashier redemption at POS: scan/enter voucher ID → confirm eligibility/status → enter receipt_id → redeem. This is the highest‑frequency, highest‑tempo action. The experience must deliver unambiguous outcomes (valid vs refused) with refusal semantics that protect the cashier and prevent disputes, while guarding against double‑redeem risk. If a voucher ID is not found in the active tenant, the result must be indistinguishable from “not found” elsewhere (no cross‑tenant leakage).

### Platform Strategy
VoucherShyft is a web app (Next.js) used on desktop POS for cashiers and desktop/laptop for stewards/admins. Cashier interactions are touch‑first and scanner‑friendly; steward/admin/auditor flows are mouse/keyboard‑first. Tenancy is enforced by host + JWT match only, with tenant switching requiring host change. No offline mode in MVP; design for graceful latency with immediate “working” state, safe retries, and idempotent redemption. WCAG 2.1 AA applies to critical flows.

### Effortless Interactions
- Cashier: scan/enter ID → see a single, clear redeemability state → tap Redeem → enter receipt_id → done.
- Steward: select allowed voucher type, enter minimal identity + household member count, issue.
- Automatic actions: coat entitlement inclusion and eligibility evaluation, duplicate detection, and persistent tenant context display.

### Critical Success Moments
- Cashier’s first redemption completes in under 30 seconds with immediate, unambiguous status and calm refusal language.
- Steward’s first issuance completes in under 2 minutes with minimal entry and a clear “what happens next.”
- Failure conditions that ruin trust: false accept/reject at POS or double redemption due to retries/latency.

### Experience Principles
1. **Scan → Status → One Primary Action**: Redemption must resolve to a single, calm decision path with no ambiguity.
2. **Calm Refusal Clarity**: Refusals are short, line‑friendly, and always include the next step (e.g., “Check tenant/store,” “Ask a manager,” “Contact issuing conference,” “Try again”).
3. **Touch‑First at POS, Keyboard‑First Elsewhere**: Optimize cashier surfaces for taps/scans; keep admin/steward flows efficient on desktop.
4. **Automatic Entitlement & Tenancy Awareness**: Coat entitlement, duplicate checks, and tenant context are system‑driven, not user‑entered.
5. **Graceful Latency, No Double‑Redeem**: Immediate working state, safe retry paths, and idempotent redemption are mandatory.
## Desired Emotional Response

### Primary Emotional Goals
- Calm confidence: “I know what to do, and the system won’t surprise me.”
- Protected: “If something can’t happen, the system explains it clearly and I’m not the bad guy.”
- Dignified clarity: firm outcomes without judgment, drama, or “gotcha” messaging—especially on refusals.

### Emotional Journey Mapping
- First discovery: safe and oriented — “This is straightforward, and it’s built for real work.”
- During core action (POS redemption / issuance): focused and steady, minimal cognitive load, one decision, one primary action.
- After completion: closure — clear confirmation and next‑step optionality without lingering uncertainty.
- If something goes wrong: calm containment — clear explanation + next step, no blame language.
- When returning: predictability — consistent patterns, language, and outcomes across tenants/roles.

### Micro‑Emotions
- Confidence over confusion (fast, unambiguous states).
- Calm over anxiety (line‑friendly refusals, no escalation cues).
- Trust over skepticism (consistent refusal reasons, no surprises, auditability).
- Accomplishment over frustration (clear closure, no “did it save?” doubts).
- Relief over satisfaction (ops software win condition).
- Belonging over isolation (system supports the user’s role without making them feel at fault).

### Design Implications
- Refusal copy must be neutral, short, and action‑oriented; never blame or dramatize.
- POS refusal states must be readable in under 2 seconds: headline + one next step; no paragraphs.
- Confirmation states must be explicit and final: “recorded,” “completed,” or “saved.”
- UI should favor predictable structures and repeated patterns across roles and tenants.
- Latency handling should preserve calm: immediate working state and clear next‑step if delayed.

### Emotional Design Principles
1. **Stability over flair**: prioritize predictable, steady interactions.
2. **Clarity without judgment**: refusals are firm, neutral, and protective.
3. **Closure matters**: always confirm completion and remove doubt.
4. **Role‑supporting tone**: the system stands with the user, not against them.
5. **Refusal ≠ error**: refusals feel like firm policy outcomes; errors feel like system issues with recovery steps.
## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis
**Square POS**
- One primary action per surface (charge/refund/discount) with minimal branching.
- Fast state transitions and unmistakable “done” confirmations.
- Touch‑first ergonomics: large targets, low typing, predictable layout.

**Clover / Lightspeed / Toast‑style POS**
- Checkout as a guided lane: scan → cart → total → pay, with clear recovery when something doesn’t scan.
- Line‑friendly exceptions that don’t stall the flow.
- Role‑separated affordances: managers can do manager things; cashiers stay in their lane.

**Google Sheets / Excel**
- Instant search/filter mental model; users trust they can “find it” fast.
- Exports are the currency of ops; reconciliation happens via filters/pivots.
- Low ceremony: no wizard required to answer basic questions.

### Transferable UX Patterns
- **Guided lane flow**: scan/enter → status → one primary action (POS checkout pattern).
- **Clear outcome language**: success vs refusal is unmistakable, with short next‑step messaging.
- **Touch‑first controls**: large tap targets and predictable layout for speed.
- **Find‑it‑fast mental model**: quick lookup and filtering that mirrors spreadsheets.
- **Role separation**: cashier‑safe surfaces, manager‑only escape hatches.
- **Performance anchor**: status must resolve in p95 ≤ 1.5s (lookup) and redemption confirmation/refusal in p95 ≤ 1.5s.

### Anti‑Patterns to Avoid
- Form‑wall screens that demand too much up front.
- Treating policy refusals like errors (creates blame/conflict).
- Hidden tenant/role context (causes wrong‑store mistakes).
- Free‑text “anything goes” inputs that create reconciliation chaos.
- Any response that implies “exists in another store” (cross‑tenant leakage) is forbidden; “not found” must be indistinguishable.

### Design Inspiration Strategy
**Adopt**
- POS “guided lane” structure for redemption (scan → status → action).
- Large, dominant primary action with de‑emphasized secondary actions.
- Short, line‑friendly exception messaging with one next step.

**Adapt**
- Spreadsheet‑style search/filters to voucher lookup and reconciliation context.
- POS recovery patterns for “not found” and refusal states without stalling the line.

**Avoid**
- Wizard‑like multi‑step flows for fast cashier actions.
- Ambiguous refusal vs error treatment.
- Free‑text issuance inputs outside controlled override paths.
## Design System Foundation

### 1.1 Design System Choice
Themeable system: Tailwind + shadcn/ui components, customized to Shyft tokens.

### Rationale for Selection
- Speed and consistency without surrendering token governance.
- shadcn provides structural primitives; Shyft tokens provide brand, posture, and constraints.
- Aligns with the Decision Surface pattern and Quiet Authority rules.

### Implementation Approach
- Use Tailwind + shadcn as the component foundation for VoucherShyft.
- Enforce token‑only styling for color, spacing, and typography (no raw hex, no arbitrary spacing).
- Treat Decision Surface layouts as first‑class primitives with enforced structure.
- Accessibility baked in: visible focus, keyboard parity where relevant, reduced‑motion support.
- MVP rule: prefer shadcn primitives; only create bespoke components when Decision Surface requires a new primitive.

### Customization Strategy
- Tokens are the only styling surface; components consume tokens, not ad‑hoc styles.
- Typography: 1–2 font families max, consistent scale, readability prioritized for POS.
- Layout: default single‑column decision surfaces, clear primary action zone, predictable refusal/error placement, no visual noise.
- Motion: minimal; respect reduced‑motion; no attention‑grabbing animations on refusals.
- Enforcement: Tailwind config restricts palette to tokens; lint rule/CI check blocks raw hex and arbitrary values; PR review checklist includes token compliance.
- Do not align to WP/jQuery UI; VoucherShyft is standalone with WP as legacy reference‑only during the 30‑day window.
## 2. Core User Experience

### 2.1 Defining Experience
The defining interaction is: **“Scan → instant status → one tap to redeem (or a calm refusal with the next step).”**  
Secondary for stewards: “Issue a voucher fast without policy guesswork.”

### 2.2 User Mental Model
- **POS today:** scan/enter, then trust the system or fall back to manager lookup/workarounds when unclear.
- **Issuance today:** fill a form with extra fields “just in case,” relying on memory for policy/duplicate rules.
- **Expectation on scan:** immediate truth (valid here or not), no surprise screens, no error‑looking denials.
- **Confusion points:** ambiguous denials, wrong‑store context, latency that feels like failure, and eligibility disputes (especially coat entitlement).

### 2.3 Success Criteria
- Most redemptions complete in one pass.
- Refusals are firm, neutral, and actionable; cashier doesn’t interpret policy.
- Retrying the same redemption returns the existing redemption result (idempotent), not a second redemption.
- **Right‑action feedback:** “Redeemed/Recorded” confirmation with receipt_id, visible tenant/store indicator, and clear coat entitlement status.
- **Speed cues:** “Working…” visible within ~150–250ms and primary action locked; outcomes feel near‑instant or explain delays.

### 2.4 Novel UX Patterns
- **Established POS patterns** dominate the interaction.
- Novelty is in **refusal semantics + dignity posture** and **automatic entitlement logic**, taught by consistency (not onboarding).

### 2.5 Experience Mechanics
**Initiation**
- Cashier opens the Redemption lane (default screen) and scans/enters voucher ID (scanner as keyboard).
- Steward starts from “New Voucher” within active tenant context.

**Interaction**
- Cashier: scan/enter → confirm status → enter receipt_id (and gross_total if required) → tap Redeem.
- Steward: select allowed type → minimal identity + household member count → Issue (duplicate check).

**Feedback**
- Success: “Redeemed”/“Issued” + timestamp + key reference (receipt_id; voucher_id).
- Refusal: short headline + reason + one next step; no blame language.
- Error: explicitly “System problem” + retry guidance + visible correlation_id.

**Completion**
- Final, unambiguous “Recorded” state; primary action becomes “Done” or returns to scan field.
- Active tenant/store remains visibly pinned on the redemption lane at all times; completion returns to scan field within the same tenant context.
- Next step: autofocus reset to scan/enter for next customer; optional “View details” secondary action.
## Visual Design Foundation

### Color System
- **Canonical source:** Shyft Quiet Authority tokens (no raw hex).
- Light‑mode only for MVP.
- Semantic mapping follows token definitions (primary, success, warning, error, info).
- Context surfaces use neutral tokens; accent reserved for decisions only.
- Contrast: all text and interactive states must meet WCAG AA; token pairings that fail are forbidden.

### Typography System
- **Primary font:** Inter (UI), with system fallback.
- **Mono:** only if required for IDs/log‑like displays.
- 1–2 font families max; consistent scale; readability prioritized for POS.
- POS rule: minimum base font size 16px; no dense tables in cashier lanes.

### Spacing & Layout Foundation
- 4/8 spacing rhythm only.
- Default single‑column Decision Surfaces.
- Clear primary action zone; pinned where POS flow requires it.
- Predictable placement for refusals/errors to reduce cognitive load.

### Accessibility Considerations
- WCAG 2.1 AA baseline.
- **Hard gates (MVP):**
  - 200% zoom: critical flows must not break or hide primary actions.
  - POS touch targets: minimum 44px for primary controls.
- Visible focus, no color‑only meaning, reduced‑motion honored.
## Design Direction Decision

### Design Directions Explored
- WP‑informed variations that preserve cashier list + search and right‑panel request layout.
- Guided lane variants that transition from search → select → redemption lane.
- Card and row density options for high‑tempo POS use.

### Chosen Direction
**Base:** Direction 2 (Search‑First + Drawer Lane)
**Combined With:** Direction 5 density and Direction 1 steward gating patterns.

### Design Rationale
- Matches cashier reality: name + DOB search first, then a guided redemption lane.
- Reduces “browse chaos” by tightening results into dense, disambiguated rows.
- Preserves Quiet Authority posture while keeping the UI familiar to WP users.
- Enforces policy gating: Emergency vs Full Request split is a first‑class decision surface.
- Coats are claimed optionally at redemption time (0..X) with explicit “0 means not claimed today.”

### Implementation Approach
- Cashier default: Search lane with Name + DOB inputs and a single Search action.
- Results list: dense, tap‑friendly people‑first rows (name + DOB primary; status + coats secondary).
- Selection opens a guided lane panel/drawer with autofocused fields in order:
  1. Receipt ID
  2. Gross total (only if required)
  3. Coats claimed today (0..X)
- Primary action: Redeem (single action in lane).
- Steward flow: Start Voucher decision surface with Emergency (clothing‑only) vs Full Request.
  - Full Request disabled unless enabled for the issuer context, with refusal‑style message.
  - Emergency always available (if policy allows), locked to clothing only.
## User Journey Flows

### 1) Cashier Redemption (Search → Select → Redeem)
**Scope:** Cashier searches by Name + DOB, selects a person, enters receipt, optionally claims coats, redeems.

```mermaid
flowchart TD
  A[Cashier opens Cashier Station] --> B[Enter Name + DOB]
  B --> C[Search]
  C --> D{Results found?}

  D -- No --> E[Not found (neutral)\nNext step: verify name + DOB\nIf still not found, ask a manager]
  D -- Yes --> F[Select person]
  F --> G[Open guided redemption lane\nTenant pinned + issuer context pinned]
  G --> H[Show voucher status + eligibility]

  H --> O{Voucher redeemable?}
  O -- No --> P[Refusal: Not redeemable\nReason: already redeemed/expired/voided\nNext step: ask manager or contact issuer]
  O -- Yes --> I[Enter receipt_id]
  I --> J{Gross total required?}
  J -- Yes --> K[Enter gross_total]
  J -- No --> M

  K --> M[Coats: eligible this year X\nClaim coats now 0..X\n"0 means not claimed today"]
  M --> N[Tap Redeem]

  N --> R[Record redemption (idempotent)\nRecord coats_claimed_today]
  R --> S[Success: Redeemed/Recorded\nReceipt_id shown]
  S --> T[Return focus to Search]

  N --> U{System error?}
  U -- Yes --> V[Error: system problem\nShow correlation_id + retry]
```

**Refusal-heavy scenarios included:**
- “Already redeemed / expired / voided”
- “Not found” (neutral, no tenant leakage)

**Note:** Coat ineligibility never blocks voucher redemption. If coat claim exceeds eligibility, force stepper to 0 and proceed with redemption.

---

### 2) Store-Issued Emergency Voucher (Store Staff Only)
**Scope:** Store staff create Emergency Voucher for immediate clothing assistance, then referral handoff.

```mermaid
flowchart TD
  A[Store staff opens Emergency Voucher] --> B{Actor is Store Staff?}
  B -- No --> C[Refusal: Not permitted\nNext step: Contact store manager]
  B -- Yes --> D[Enter Neighbor Info\nName, DOB, Household Count]
  D --> E[Emergency catalog: Clothing only]
  E --> F{Non-clothing selected?}
  F -- Yes --> G[Refusal: Not allowed in Emergency\nChoose clothing item]
  F -- No --> H{Catalog item available?}
  H -- No --> I[Refusal: Item unavailable\nChoose different item]
  H -- Yes --> J[Create Emergency Voucher]
  J --> K[Record clothing issued now]
  K --> L[Coats: eligible this year X\nClaim coats now 0..X (optional)]
  L --> M[Record coats_claimed_today]
  M --> N[Generate referral handoff\nConference/Partner next step]
  N --> O[Completion: Emergency issued + referral instructions]
```

**Refusal-heavy scenarios included:**
- “Not permitted (non-store actor)”
- “Not allowed in Emergency (non-clothing)”
- “Catalog item unavailable”

---

### 3) Full Voucher Issuance (Conference/Partner/Location)
**Scope:** Conference/Partner user issues Full Voucher if enabled; includes duplicate governance and snapshot.

```mermaid
flowchart TD
  A[User opens Start Voucher] --> B{Full Request enabled for issuer?}
  B -- No --> C[Refusal: Full not enabled\nNext step: Refer neighbor to store for Emergency clothing support\nor contact admin to enable Full]
  B -- Yes --> D[Enter Neighbor Info\nName, DOB, Household Count]
  D --> E[Select Voucher Types\nClothing + Furniture + Other (allowed only)]
  E --> F[Duplicate Check]
  F --> G{Duplicate within window?}
  G -- Yes --> H{Override requested?}
  H -- No --> I[Refusal: Duplicate in window\nNext step: Authorized override only]
  H -- Yes --> J{Authorized + reason provided?}
  J -- No --> K[Refusal: NOT_AUTHORIZED_FOR_ACTION]
  J -- Yes --> L[Issue Full Voucher]
  G -- No --> L
  L --> M[Record Authorization Snapshot\nIssuer context pinned]
  M --> N[Confirmation: Issued + voucher details]
```

**Refusal-heavy scenarios included:**
- “Full request not enabled for this issuer”
- “Duplicate within window” with explicit override branch

---

### 4) Partner Embedded Issuance + Lookup (No Account)
**Scope:** Partner agency issues vouchers from its own website using a form-specific token; can look up only vouchers it issued.

```mermaid
flowchart TD
  A[Partner opens embedded form] --> B[Form shows intro + rules]
  B --> C[Select allowed voucher type]
  C --> D[Enter required identity fields]
  D --> E[Submit issuance]
  E --> F[Issue voucher under partner agency scope]
  F --> G[Success: voucher issued + reference ID]

  H[Partner enters voucher ID for lookup] --> I{Issued by this partner?}
  I -- Yes --> J[Show status (read-only)]
  I -- No --> K[Refusal: NOT_AUTHORIZED_FOR_ACTION]
```

**Refusal-heavy scenarios included:**
- “Not authorized for action” when attempting to access non-partner vouchers

---

### Journey Patterns
- **Search → Select → Lane:** Person-first search leads into a single guided lane with one primary action.
- **Refusal vs Error split:** Refusals are firm, neutral, next-step guided; errors are system problems with correlation_id.
- **Entitlement as optional claim:** Coats are eligible but claimed only if selected (0..X), recorded on redemption.
- **Context pinned:** Tenant + issuer context visible in all flows to prevent wrong-issuer mistakes.

### Flow Optimization Principles
- Minimize steps between selection and redeem.
- Keep tenant + issuer context pinned in all flows.
- Ensure idempotent redemption with safe retry behavior.
- Keep Emergency and Full flows separated by actor + enablement gating.
## Component Strategy

### Design System Components
Use shadcn/ui primitives for all base UI (buttons, inputs, cards, tabs, badges, dialogs, accordions, lists) with strict token‑only styling. No bespoke library in MVP unless a Decision Surface requires a new primitive.

### Custom Components
#### 1) TenantPin
**Purpose:** Always-visible tenant/store indicator.  
**Usage:** Pinned on all cashier, steward, and admin surfaces.  
**States:** normal, warning (context mismatch), locked (read-only).  
**Accessibility:** screen-reader label includes tenant name and role.  
**Contract:** `tenantName`, `tenantSlug`, optional `roleContext`.

#### 2) CashierSearchLane
**Purpose:** Default cashier surface: Name + DOB search + results container.  
**Usage:** Cashier landing screen.  
**States:** idle, working, empty, error.  
**Accessibility:** numeric keypad friendly DOB input; clear focus order.  
**Contract:** owns autofocus, scanner/keyboard behavior, and “Working…” state.

#### 3) PersonMatchRow
**Purpose:** Tap‑friendly, dense result row for disambiguation.  
**Usage:** Search results list.  
**States:** normal, selected, disabled.  
**Content:** Name, DOB, optional last4/address fragment; status badges (active voucher, coats remaining).  
**Contract:** standardized disambiguation fields; must not expose excess PII.

#### 4) RedemptionLanePanel
**Purpose:** Guided lane after selection: status → receipt → gross total (if needed) → coat claim → redeem.  
**Usage:** Cashier redemption flow.  
**States:** eligible, refusal, error, success.  
**Accessibility:** one primary action; clear focus order.  
**Contract:** single primary action; tenant pinned; refusal/error rendering; correlation_id only on errors.

#### 5) VoucherStatusCard
**Purpose:** Single source of truth for redeemability state.  
**Usage:** Cashier lane and back‑office view.  
**Contract:** maps refusal reasons to neutral headline + one next step; never implies cross‑tenant existence.

#### 6) CoatClaimStepper
**Purpose:** Optional coat claim (0..X) with explicit “0 means not claimed today.”  
**Usage:** Redemption lane and Emergency issuance if coats allowed.  
**States:** enabled, disabled (entitlement 0).  
**Contract:** enforce entitlement upper bound; disabled state without blame.

#### 7) StartVoucherGate (Emergency vs Full)
**Purpose:** Hard gate between Emergency and Full request paths.  
**Usage:** Steward/issuer start surface.  
**States:** emergency enabled; full enabled/disabled with reason.  
**Contract:** Full card can render disabled‑with‑reason; Emergency card is store‑only.

#### 8) CatalogPickerPanel
**Purpose:** Search + category browse + controlled quantities.  
**Usage:** Furniture/clothing selection.  
**Contract:** tenant‑scoped catalog only; emergency mode restricts to clothing categories; no free‑text items.

#### 9) PartnerAgencyManager
**Purpose:** Store admin surface to manage partner agencies, tokens, and embed code.  
**Usage:** Tenant admin settings.  
**States:** list, create/edit, token rotate/revoke, embed preview.  
**Contract:** per‑partner form settings (allowed voucher types, intro text, rules list); generates form-specific token + embed snippet.

#### 10) PartnerEmbedForm
**Purpose:** Embedded partner issuance + lookup form (no user account).  
**Usage:** Partner agency website.  
**States:** idle, working, success, refusal, error.  
**Contract:** token-scoped; issue + lookup own only; refusal for non-partner vouchers; no access to admin-only actions.

### Component Implementation Strategy
- Build custom components on top of shadcn primitives using Shyft tokens only.
- Enforce Decision Surface layout and refusal/error semantics through component contracts.
- Provide Storybook‑style examples or MDX docs for each custom component with required props, states, and accessibility notes.

### Implementation Roadmap
**Phase 1 (MVP critical):**
- TenantPin
- CashierSearchLane
- PersonMatchRow
- RedemptionLanePanel
- VoucherStatusCard
- CoatClaimStepper
- StartVoucherGate
- CatalogPickerPanel
- IdentityPanel (Cashier summary + Steward capture)
- PartnerAgencyManager
- PartnerEmbedForm

**Phase 2 (early growth):**
- AuditEventTable (read‑only)
- ExportControls (CSV)
- AdminConfigEditor (rules text/hours)

**Phase 3 (later):**
- ReconciliationDashboard
- AdvancedFilters / SavedSearches
- BulkOps / ExceptionQueues
## UX Consistency Patterns

### Button Hierarchy
**When to Use:** Every Decision Surface and lane action.  
**Visual Design:** One primary action only; secondary actions are link‑style or neutral buttons.  
**Behavior:** Primary action is locked during “Working…” states; no duplicate primary CTAs.  
**Accessibility:** Focus visible; 44px targets in POS.  
**Variants:** Primary, Secondary, Link, Disabled.  
**Rules:** Never show “Issue Coat” as a primary action; coat claim is a stepper within lane.  
**Destructive actions:** Void/disable must require confirm step and must never be primary on a lane surface.

### Feedback Patterns
**When to Use:** Success, refusal, error outcomes.  
**Visual Design:** Refusal is neutral and calm; error is system‑problem styling; success is “Recorded” language.  
**Behavior:**  
- Auth failures (401/403) are errors (not refusals).  
- Business denials are refusals (HTTP 200).  
- Refusal: headline + one next step; no correlation_id.  
- Error: correlation_id required + retry guidance.  
- Success: explicit completion state (Recorded/Redeemed).  
- Refusals do not auto‑clear on blur; they clear only on next attempt or explicit dismiss.  
**Accessibility:** Messages are announced and remain visible until dismissed or next action.

### Form Patterns & Validation
**When to Use:** Steward issuance and Emergency creation.  
**Visual Design:** Context → Identity → Decision → Action; inline helper text only where needed.  
**Behavior:**  
- Validate on submit; show field‑level errors, no blame language.  
- Required fields visibly marked; no policy blocks before the field in question.  
- DOB input: masked, numeric keypad friendly, accepts MM/DD/YYYY and digits‑only.  
- No policy pre‑check popups before submit; denials return as refusals after submit with next step.  
**Accessibility:** Labels programmatically linked; errors announced; keyboard-first support.

### Navigation Patterns
**When to Use:** Switching between search list and redemption lane.  
**Visual Design:** Tenant/issuer pinned in header or lane panel.  
**Behavior:**  
- Search → Select → Lane as a single flow.  
- Back returns to search results without losing query.  
- Lane close returns focus to first search field and preserves scroll position.  
- Tenant/issuer context never changes within a lane.  
**Accessibility:** Clear focus order on transitions.

### Modal/Overlay Patterns
**When to Use:** Confirmations or manager overrides only.  
**Visual Design:** Minimal, single decision, no competing CTA.  
**Behavior:**  
- Modals must not block core lane flow unless necessary.  
- Override modals require reason capture and authorization.  
- Override modal must display current tenant + issuer context at top.  
**Accessibility:** Focus trap, escape to close (when safe).

### Empty & Loading States
**When to Use:** Search results, exports, lists.  
**Visual Design:** Neutral, calm copy.  
**Behavior:**  
- Loading within 150–250ms shows “Working…”  
- Working state locks primary action and disables repeated submit, but allows cancel/back where safe.  
- Empty search: “No match found. Verify name + DOB.”  
**Accessibility:** Loading states announced; no infinite spinners without copy.

### Search & Filtering Patterns
**When to Use:** Cashier search and admin lists.  
**Visual Design:** Name + DOB primary inputs; filters secondary.  
**Behavior:**  
- Search is the only primary action.  
- Results are people‑first rows with disambiguation fields.  
- Disambiguation minimum: if multiple matches, show Name + DOB + one of address fragment / phone last4 / internal ID.  
- Exact‑match affordance: allow “Add DOB” prompt or DOB‑only refine when too many results.  
- Never imply cross‑tenant existence.  
**Accessibility:** Inputs keyboard friendly; DOB accepts numeric keypad.
## Responsive Design & Accessibility

### Responsive Strategy
- **Desktop‑first for Cashier Redemption Lane (POS):** touchscreen desktop, scanner‑as‑keyboard, receipt_id speed, 44px targets, one primary action.
- **Mobile‑first for Steward/Request + Support Lookup (read‑only):** works well on phones for search and reference.
- **Role‑gated mobile mutations:** redemption, overrides, voids are **not** allowed on mobile by default.

**Mobile Support View (required):**
Allowed on mobile:
- Person search (Name + DOB)
- View voucher status/details (read‑only)
- View coat entitlement/claim history (read‑only)
- View next‑step guidance (who to contact / where issued)
- Exports/audit views (read‑only or limited)

Not allowed by default (mobile):
- Cashier redemption (mutating) unless “mobile cashier” is explicitly enabled later
- Overrides/voids (mutating) unless explicitly enabled and guarded

### Breakpoint Strategy
- Use standard Tailwind breakpoints:
  - `sm` 640+, `md` 768+, `lg` 1024+, `xl` 1280+
- Conceptual model: 320–767 (mobile), 768–1023 (tablet), 1024+ (desktop), implemented with Tailwind defaults.

### Accessibility Strategy
- WCAG 2.1 AA baseline.
- Hard gates (MVP):
  - 200% zoom: critical flows must not break or hide primary actions.
  - POS touch targets: minimum 44px for primary controls.
- Visible focus, no color‑only meaning, reduced‑motion honored.

### Testing Strategy
- Required for MVP:
  - NVDA + Chrome (Windows) for critical flows
  - VoiceOver + Safari (macOS) for critical flows
- Not required in MVP: JAWS (add later if regulated needs emerge).

### Implementation Guidelines
- Focus management required on lane open/close, modal open/close, and after success/refusal (return focus to correct control).
- No hover‑only interactions (POS is touch‑first).
- Input ergonomics:
  - DOB supports numeric keypad + paste
  - Receipt_id is scanner‑friendly
  - Prevent accidental submit on partial input
