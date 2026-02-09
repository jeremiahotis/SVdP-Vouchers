# Story 4.4: Partner Form Customization

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a store admin,
I want partner-specific form customization,
So that each partner’s embedded form matches their allowed voucher types and messaging.

## Acceptance Criteria

1. **Given** a partner agency,
   **When** the admin configures allowed voucher types, intro text, and rules list,
   **Then** the embedded form reflects those settings in the correct positions.
2. **And** intro text renders as a `<p>` near the top of the form.
3. **And** rules render as a `<ul>` directly above the name collection field.
4. **And** allowed voucher types are enforced server-side for partner-token issuance.

## Tasks / Subtasks

- [ ] Data persistence
  - [ ] Store partner form configuration with the form-specific token (allowed_voucher_types, intro_text, rules_list)
- [ ] Admin UI
  - [ ] Add partner form configuration fields in admin UI
  - [ ] Validate/sanitize intro text and rules list
  - [ ] Preview or confirm placement of intro + rules in form layout
- [ ] Embedded form
  - [ ] Load partner form config using token
  - [ ] Render intro `<p>` and rules `<ul>` in correct placement
  - [ ] Render only allowed voucher types
- [ ] Tests / QA
  - [ ] Verify partner form config persists and renders correctly
  - [ ] Verify disallowed voucher types are rejected server-side

## Dev Notes

- Form customization is **partner + token specific** (form-specific tokens).
- Embed form must not accept tenant or partner identifiers from the URL/body; use token-derived context only.
- Intro/rules content must be sanitized to avoid unsafe HTML.

### Project Structure Notes

- Admin UI: `apps/web/` (tenant admin views)
- Embed form: `apps/web/` (partner embed surface)
- API: `apps/api/src/` (token-config fetch + enforcement)
- Contracts: `packages/contracts/`

### References

- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md` (FR40)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (PartnerEmbedForm, PartnerAgencyManager)
- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md` (Decision 1b, 9c)
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Handoff: `_bmad-output/implementation-artifacts/handoff-plan-2026-02-09.md`

