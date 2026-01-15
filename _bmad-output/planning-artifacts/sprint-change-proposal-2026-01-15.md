# Sprint Change Proposal - Defer Billing Calculations to Receipt Import

**Date:** 2026-01-15  
**Author:** Jeremiah (via PM Agent)  
**Status:** Pending Approval

---

## 1. Issue Summary

### Problem Statement

Capturing `gross_total` at voucher redemption creates operational friction and duplicates work. The current Story 5.2 design requires cashiers to manually enter gross_total during redemption, which:

1. **Interrupts barcode scanner workflow** - Cashiers use barcode scanners to rapidly scan receipt_id and auto-submit redemptions. Stopping to manually enter a dollar amount breaks this fast flow.
2. **Creates double entry** - The gross_total will be imported from ThriftWorks CSV receipts anyway, making manual cashier entry redundant.
3. **Reduces data accuracy** - POS receipt data is more accurate than manual cashier entry.

### Discovery Context

This issue was identified during implementation of Story 5.1 (Redeem Voucher with Receipt Capture), which has been completed successfully. The receipt_id capture is working well with the barcode scanner workflow. However, the planned Story 5.2 (Billing Math on Redemption) would require adding gross_total input, which would degrade the UX gains from Story 5.1.

### Evidence

- **Story 5.1 Status:** ✅ Completed - receipt_id capture working with barcode scanner
- **Current workflow:** Barcode scanner fills receipt_id → auto-clicks "Mark as Redeemed" → fast, frictionless
- **Proposed Story 5.2 workflow:** Would require stopping to manually enter gross_total → slower, error-prone
- **Data source:** ThriftWorks CSV imports will provide accurate gross_total from POS system

---

## 2. Impact Analysis

### Epic Impact

**Epic 5: Cashier Redemption and Receipt Capture**
- **Story 5.1:** ✅ Completed - No changes needed
- **Story 5.2:** ⚠️ **Requires modification** - Remove gross_total capture from redemption; defer billing calculations
- **Story 5.3:** No impact - Emergency overrides remain unchanged
- **Story 5.4:** No impact - Coat issuance remains unchanged

**Epic 6: POS Receipt Import and Linking**
- **Impact:** ✅ **New story needed** - Add billing calculation during receipt import/linking
- **Story 6.1:** No changes - CSV import continues as planned
- **Story 6.2:** No changes - Receipt line item storage continues as planned
- **Story 6.3:** ⚠️ **Enhancement opportunity** - When linking voucher ↔ receipt, calculate and store billing shares

**Epic 7: Reconciliation and Reporting**
- **Impact:** ✅ **Simplified** - Billing shares already calculated and stored; just display them
- **Story 7.3:** Reporting will read pre-calculated billing shares instead of calculating on-demand

### Artifact Conflicts

**PRD (prd.md)**
- **FR17 [MVP]:** Currently states "Redemption captures `receipt_id` (required) and gross total (configurable required/optional via settings)."
  - **Change needed:** Remove "gross total" from redemption capture; clarify it comes from receipt import
- **FR25 [MVP]:** Currently states "The system computes conference vs store payment shares using cap rules..."
  - **Change needed:** Clarify that computation happens during receipt import, not at redemption time
- **Cashier Journey (lines 155-162):** Currently mentions "gross total if required"
  - **Change needed:** Remove gross_total from redemption flow description

**Architecture (architecture.md)**
- **No fundamental changes needed**
- **Clarification needed:** Document that billing calculations occur during receipt import (Epic 6), not redemption (Epic 5)
- **Schema note:** `gross_total` column in `wp_svdp_vouchers` table can be populated during receipt import/linking

**Epics (epics.md)**
- **Story 5.2:** Acceptance criteria need rewriting
- **Epic 6:** New story needed for billing calculations during import

---

## 3. Recommended Approach

### Selected Path: **Direct Adjustment**

**Approach:**
1. Modify Story 5.2 to remove gross_total capture requirement
2. Create new story in Epic 6 to calculate and store billing shares during receipt import
3. Update PRD to reflect the change in when/where billing calculations occur
4. Update Architecture to clarify billing calculation timing

**Rationale:**
- **Low risk** - No code rollback needed; Story 5.1 is working correctly
- **Low effort** - Primarily documentation updates and moving acceptance criteria
- **Improved UX** - Maintains fast barcode scanner workflow at redemption
- **Better data accuracy** - Uses POS receipt data instead of manual cashier entry
- **No scope reduction** - Billing calculations remain in MVP, just moved to Epic 6
- **Clean separation of concerns** - Redemption focuses on speed; import focuses on data accuracy

**Effort Estimate:** Low  
**Risk Level:** Low  
**Timeline Impact:** Minimal - Story 5.2 becomes simpler; Epic 6 gains one story

---

## 4. Detailed Change Proposals

### Change 1: Modify Story 5.2 in epics.md ✅ APPROVED

**Section:** Epic 5: Cashier Redemption and Receipt Capture → Story 5.2  
**File:** [epics.md](file:///Users/jeremiahotis/Local%20Sites/voucher-system/app/public/wp-content/plugins/SVdP-Vouchers/_bmad-output/planning-artifacts/epics.md#L372-L387)

**OLD:**
```markdown
### Story 5.2: Billing Math on Redemption

As store staff,
I want billing math computed at redemption,
So that conference vs store shares are consistent.

**Acceptance Criteria:**

**Given** a voucher has a conference cap and gross_total
**When** redemption is saved
**Then** conference pays 50% up to cap and store pays 50% up to cap plus 100% over cap

**Given** the gross_total is below cap
**When** billing is computed
**Then** both conference and store pay 50% of gross_total
```

**NEW:**
```markdown
### Story 5.2: Billing Math on Receipt Import

As store staff,
I want billing math computed when receipts are imported and linked,
So that conference vs store shares are consistent and based on accurate POS data.

**Acceptance Criteria:**

**Given** a receipt is imported with gross_total and linked to a voucher with a conference cap
**When** the receipt-voucher link is created
**Then** the system calculates and stores: conference pays 50% up to cap; store pays 50% up to cap plus 100% over cap

**Given** the gross_total is below the conference cap
**When** billing is computed
**Then** both conference and store pay 50% of gross_total

**Given** the gross_total exceeds the conference cap
**When** billing is computed
**Then** conference pays 50% of cap; store pays 50% of cap plus 100% of the amount over cap

**Given** a voucher is redeemed but receipt not yet imported
**When** billing shares are requested
**Then** they show as "Pending receipt import" or null until receipt is linked
```

**Rationale:** Moves billing calculations to receipt import phase where accurate POS data is available. Removes dependency on manual cashier entry of gross_total.

---

### Change 2: Update FR17 in prd.md

**Section:** Functional Requirements → Cashier Redemption  
**File:** [prd.md](file:///Users/jeremiahotis/Local%20Sites/voucher-system/app/public/wp-content/plugins/SVdP-Vouchers/_bmad-output/planning-artifacts/prd.md#L308)

**OLD:**
```markdown
- FR17 [MVP]: Redemption captures `receipt_id` (required) and gross total (configurable required/optional via settings).
```

**NEW:**
```markdown
- FR17 [MVP]: Redemption captures `receipt_id` (required). Gross total is obtained from POS receipt import, not manual cashier entry.
```

**Rationale:** Clarifies that gross_total is not captured at redemption time; it comes from the imported receipt data.

---

### Change 3: Update FR25 in prd.md

**Section:** Functional Requirements → Billing & Reporting  
**File:** [prd.md](file:///Users/jeremiahotis/Local%20Sites/voucher-system/app/public/wp-content/plugins/SVdP-Vouchers/_bmad-output/planning-artifacts/prd.md#L321)

**OLD:**
```markdown
- FR25 [MVP]: The system computes conference vs store payment shares using cap rules (conference pays 50% up to cap; store pays 50% of conference spend plus 100% over cap).
```

**NEW:**
```markdown
- FR25 [MVP]: The system computes conference vs store payment shares during receipt import using cap rules (conference pays 50% up to cap; store pays 50% of conference spend plus 100% over cap). Billing shares are calculated and stored when receipts are linked to vouchers.
```

**Rationale:** Clarifies that billing calculations happen during receipt import, not at redemption time. Emphasizes that values are calculated once and stored.

---

### Change 4: Update Cashier Journey in prd.md

**Section:** User Journeys → Cashier — Redemption at Counter  
**File:** [prd.md](file:///Users/jeremiahotis/Local%20Sites/voucher-system/app/public/wp-content/plugins/SVdP-Vouchers/_bmad-output/planning-artifacts/prd.md#L155-L162)

**OLD:**
```markdown
### Cashier — Redemption at Counter
Opening scene: Neighbor shops as usual; cashier completes POS transaction and gets a receipt ID.

Rising action: Cashier opens the Cashier Station, finds the voucher, clicks Redeem.

Climax: Cashier enters `receipt_id` (and gross total if required), confirms redemption.

Resolution: Voucher is marked redeemed, receipt is stored, billing math applied (50% up to cap; 100% over cap to store). Typos or mismatches surface later in reconciliation—not at the counter. The flow stays fast and judgment-free.
```

**NEW:**
```markdown
### Cashier — Redemption at Counter
Opening scene: Neighbor shops as usual; cashier completes POS transaction and gets a receipt ID.

Rising action: Cashier opens the Cashier Station, finds the voucher, clicks Redeem.

Climax: Cashier scans or enters `receipt_id`, confirms redemption. Fast, barcode-scanner-friendly workflow.

Resolution: Voucher is marked redeemed with receipt_id stored. Billing calculations happen later when receipts are imported from POS system. Typos or mismatches surface during reconciliation—not at the counter. The flow stays fast and judgment-free.
```

**Rationale:** Removes mention of gross_total entry. Emphasizes barcode scanner workflow. Clarifies that billing calculations happen during receipt import, not at redemption.

---

### Change 5: Add clarification note to Architecture

**Section:** Data Architecture  
**File:** [architecture.md](file:///Users/jeremiahotis/Local%20Sites/voucher-system/app/public/wp-content/plugins/SVdP-Vouchers/_bmad-output/planning-artifacts/architecture.md#L135-L153)

**Location:** After "Snapshot immutability" section (around line 153)

**ADD:**
```markdown

**Billing calculation timing:** Billing shares (conference_share, store_share) are calculated and stored during receipt import (Epic 6), not at redemption time (Epic 5). This ensures:
- Calculations use accurate POS gross_total data
- Cashier redemption flow remains fast (barcode scanner workflow)
- No double entry of gross_total
- Billing shares are calculated once and stored for fast reporting
```

**Rationale:** Documents the architectural decision to defer billing calculations to receipt import phase.

---

## 5. Implementation Handoff

### Change Scope Classification: **Minor**

This change can be implemented directly by the development team without requiring backlog reorganization or fundamental replanning.

### Handoff Recipients

**Primary:** Development Team (Dev Agent)  
**Secondary:** Product Manager (for PRD/Architecture updates)

### Implementation Tasks

1. **Update Planning Documents** (PM/Dev)
   - [ ] Update Story 5.2 in `epics.md`
   - [ ] Update FR17 in `prd.md`
   - [ ] Update FR25 in `prd.md`
   - [ ] Update Cashier Journey in `prd.md`
   - [ ] Add billing calculation timing note to `architecture.md`

2. **Epic 6 Story Creation** (PM/Dev)
   - [ ] Ensure Story 5.2 (now "Billing Math on Receipt Import") is properly positioned in Epic 6 workflow
   - [ ] Update Epic 6 story list if needed

3. **Implementation** (Dev)
   - [ ] Implement billing calculation logic during receipt import/linking
   - [ ] Add database columns for `conference_share` and `store_share` if not already present
   - [ ] Update receipt import code to calculate and store billing shares
   - [ ] Add tests for billing calculation logic

4. **Verification** (Dev/QA)
   - [ ] Verify redemption flow does NOT require gross_total input
   - [ ] Verify barcode scanner workflow remains fast
   - [ ] Verify billing shares are calculated correctly during receipt import
   - [ ] Verify reporting displays pre-calculated billing shares

### Success Criteria

- ✅ Cashier redemption requires only `receipt_id` (no gross_total input)
- ✅ Barcode scanner workflow remains uninterrupted
- ✅ Billing shares are calculated during receipt import
- ✅ Billing shares are stored and available for reporting
- ✅ All planning documents reflect the change

### Dependencies

- Story 5.1 must remain completed (receipt_id capture working)
- Epic 6 receipt import infrastructure must be in place before billing calculations can be added

---

## 6. Approval and Next Steps

### Approval Status: ✅ **APPROVED**

**Approved by:** Jeremiah  
**Approval date:** 2026-01-15

### Next Steps After Approval

1. **Immediate:** Update planning documents (epics.md, prd.md, architecture.md)
2. **Epic 6 Planning:** Ensure Story 5.2 is properly integrated into Epic 6 workflow
3. **Implementation:** Proceed with Epic 6 development including billing calculations

---

**Document Status:** Ready for Review  
**Last Updated:** 2026-01-15
