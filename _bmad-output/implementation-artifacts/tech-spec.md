---
title: 'Printable Voucher Receipts & Design System'
slug: 'printable-voucher-receipts'
created: '2026-01-28'
status: 'review'
stepsCompleted: [1, 2, 3]
tech_stack: ['WordPress', 'PHP', 'jQuery', 'CSS (Design Tokens)']
files_to_modify: 
  - 'includes/class-database.php'
  - 'includes/class-conference.php'
  - 'includes/class-voucher.php'
  - 'admin/views/tab-conferences.php'
  - 'admin/views/admin-page.php'
  - 'admin/views/tab-vouchers.php'
  - 'public/js/svdp-print-receipt.js'
  - 'public/css/svdp-print-receipt.css'
  - 'public/css/shyft-variables.css'
  - 'public/js/voucher-request.js'
  - 'public/templates/voucher-request-form.php'
code_patterns: 
  - 'AJAX-driven form submission'
  - 'Database migrations via dbDelta'
  - 'Shared Asset Enqueueing (Admin + Frontend)'
  - 'Modal UI for Print Context'
  - 'CSS Variables (Design Tokens)'
test_patterns: 
  - 'Manual verification of voucher submission'
  - 'Browser print preview inspection'
  - 'Admin Reprint Verification'
---

# Printable Voucher Receipts & Design System Initialization

## Overview

### Problem Statement
Volunteers (Vincentians) need a way to provide neighbors with a physical record of their voucher details. Additionally, the entire application needs to adopt a new "Quiet Authority" design system to ensure dignity and clarity.

### Proposed Solution
1. 	**Initialize Design System**: Implement the core "Shyft" design tokens (CSS variables) based on the provided governance docs and visual references.
2. 	**Printable Vouchers**: Implement the "Print Receipt" feature using these new system tokens to ensure the printed artifact matches the new brand standard.

**Adversarial Improvements:**
- **Shared Logic**: Print logic and styles extracted to shared assets (`svdp-print-receipt.js/css`).
- **Admin Reprint**: New "Vouchers" tab in Admin to list recent vouchers and reprint receipts.
- **Modal UI**: Uses a modal overlay instead of popup windows to prevent blocking.
- **Security**: Strict XSS prevention in template construction.

### Scope

**In Scope:**
- **[NEW] Design System**: Create `shyft-variables.css` defining the new color, typography, and spacing tokens.
- Database migration to add `enable_printable_voucher` flag to conferences table.
- Admin UI updates to toggle this flag.
- **[NEW] Admin UI**: Create a "Vouchers" tab to list vouchers with pagination.
- **[NEW] Shared Assets**: Create reusable JS/CSS for the print modal.
- Frontend update to `voucher-request.js` to trigger the shared modal.

**Out of Scope:**
- Full rewriting of *existing* pages to the new design system (only the new Printable Voucher feature will consume it immediately, though the variables will be available globally).

## Implementation Plan

### Task Breakdown

- [ ] Task 0: Initialize Core Design System
  - File: `public/css/shyft-variables.css` (NEW)
  - Action: Define CSS variables for the "Quiet Authority" system using provided tokens:
    ```css
    :root {
      /* Core Colors */
      --shyft-color-primary: #3F647E;
      --shyft-color-primary-hover: #35576D;
      --shyft-color-primary-active: #2C4A5D;

      /* Backgrounds */
      --shyft-color-bg-app: #F6F4F1;
      --shyft-color-bg-card: #FFFFFF;
      --shyft-color-bg-surface: #EFE9E4;

      /* Text */
      --shyft-color-text-primary: #2B2B2B;
      --shyft-color-text-secondary: #5F6A70;
      --shyft-color-text-muted: #8A949A;

      /* Borders */
      --shyft-color-border: #D6DAD8;
      --shyft-color-divider: #E4E7E5;
      --shyft-color-border-focus: #3F647E;

      /* Status */
      --shyft-color-success: #6F8F7A;
      --shyft-color-warning: #C6A86B;
      --shyft-color-error: #9A5A5A;
      --shyft-color-info: #7A8A94;

      /* Secondary/Disabled */
      --shyft-color-secondary-bg: #E7ECEF;
      --shyft-color-secondary-text: #3F647E;
      --shyft-color-disabled-bg: #E2E2E2;
      --shyft-color-disabled-text: #9B9B9B;
    }
    ```
  - Action: Enqueue this file in both Frontend (`wp_enqueue_scripts`) and Admin (`admin_enqueue_scripts`).
  - Note: These tokens are non-negotiable system infrastructure.

- [ ] Task 1: Database Migration for Printable Voucher Flag
  - File: `includes/class-database.php`
  - Action: create `migrate_to_v3()` to add `enable_printable_voucher` column to `wp_svdp_conferences`. Add default value `0`.
  - File: `includes/class-conference.php`
  - Action: Update `create()` and `update()` methods to handle `enable_printable_voucher` field. Capture this field in `get_all()` and `get_by_id()`.

- [ ] Task 2: Admin UI for Printable Voucher Setting
  - File: `admin/views/tab-conferences.php`
  - Action: Add "Enable Printable Voucher" checkbox to "Add New Organization" form.
  - Action: Add logic to disabled it if organization type is 'store'.
  - Action: Add column/checkbox to "Existing Organizations" table to toggle setting inline.

- [ ] Task 3: API & Backend Logic
  - File: `includes/class-voucher.php`
  - Action: Update `create()` response to include `enablePrintableVoucher`, `storeAddress`, `storeHours`, and `computed_limits`.
  - Action: **[Refactor]** Update `get_all()` to accept `$limit` and `$offset` arguments for pagination.
  - Action: Create `get_count()` method (Required for Admin Pagination).

- [ ] Task 4: Shared Print Logic & Assets
  - File: `public/js/svdp-print-receipt.js` (NEW)
  - Action: Implement `SVDP_PrintReceipt.showModal(voucherData)`.
  - File: `public/css/svdp-print-receipt.css` (NEW)
  - Action: specific styles for the Modal Overlay using `var(--shyft-*)` tokens.
  - **Constraint**: All styles MUST exist under `.svdp-print-modal` scope to prevent WP Admin leakage.
  - Action: `@media print` styles:
    - Hide everything BUT the modal content.
    - **Optimization**: Force high contrast and verify legibility in Grayscale/B&W.
    - **Optimization**: Remove colored backgrounds (override `--shyft-color-bg-app: #ffffff;`).
    - **Optimization**: Use `color-adjust: exact` (or `print-color-adjust`) cautiously, favoring black text on white backgrounds.

- [ ] Task 5: Frontend Integration
  - File: `public/js/voucher-request.js`
  - Action: Enqueue new shared assets.
  - Action: In `createVoucher` success callback, add "Print Receipt" button.

- [ ] Task 6: Admin Vouchers List & Reprint
  - File: `admin/views/tab-vouchers.php` (New)
  - File: `admin/views/admin-page.php`
  - Action: Add "Vouchers" tab router.
  - Action: Implement list view using `SVDP_Voucher::get_all($limit, $offset)`.
  - Action: Add standard WP pagination.
  - Action: Enqueue `svdp-print-receipt.js` and `css`.

### Acceptance Criteria

- [ ] AC 1: Design Tokens Available
  - Given I inspect the page (Frontend or Admin)
  - Then I can see `--shyft-color-primary` and other variables defined in the `:root` scope

- [ ] AC 2: Printable Receipt Matches Brand
  - Given I view the print modal
  - Then the headings use the Serif font token
  - And the buttons use the Primary Action token
  - And the spacing matches the 4px rhythm

- [ ] AC 3: Admin Pagination
  - Given I am on the Admin Vouchers tab
  - And there are more than 50 vouchers
  - Then I see pagination controls

- [ ] AC 4: Security (XSS)
  - Given a voucher with malicious script in the Name
  - When I print the receipt
  - Then the script is NOT executed

## Dependencies
- Shared asset availability in both Admin and Frontend contexts.

## Testing Strategy
1.  **Visual**: Verify `variables.css` is loaded and variables are resolvable.
2.  **Manual**: Submit voucher -> Print (Verify Brand/Data).
3.  **Manual**: Admin -> Vouchers -> Reprint.
4.  **Print Test**: Print to PDF in "Black and White" mode to verify contrast and clarity.
