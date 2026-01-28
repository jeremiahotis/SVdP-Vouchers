# Shyft UI Review Validator Output Schema (v1)

**Status:** Authoritative  
**Audience:** Engineering, UX, QA, auditors  
**Purpose:** Define the machine-readable contract emitted by `shyft review` for UI validation.  
**Scope:** Review-phase only. Findings are persisted into `offers.json` and the audit store.

This schema is designed to:
- Support deterministic outputs (stable key ordering, snake_case keys)
- Integrate with `offers.json` as persistent, dismissible “pending offers”
- Enable a future UI linter/validator implementation without ambiguous interpretation

---

## 1. Where This Output Goes

### 1.1 Primary output (CLI)
- `shyft review --json` MUST print a single JSON object matching **ReviewReport**.

### 1.2 Persistence (repo trust state)
- Router/CLI MUST persist the report to:
  - `.shyft/review/ui/<session_id>/<timestamp>_ui_review.json`
- Router/CLI MUST emit one audit event referencing:
  - `report_id`
  - `report_path`
  - `nist_function` = `MEASURE`

### 1.3 Offers (persistent suggestions)
- If **any** issues exist (ERROR/WARN), create or update a corresponding offer in:
  - `.shyft/offers.json`
- Offers MUST be review-phase only and MUST be deduplicated by `dedupe_key`.

---

## 2. JSON Conventions (Non-negotiable)

- All keys MUST be `snake_case`
- Output MUST be deterministic:
  - stable key ordering
  - UTF-8
  - LF line endings
- No pretty printing (single-line JSON) for NDJSON compatibility when embedded

---

## 3. Top-Level Type: `ReviewReport`

### 3.1 Type Definition (conceptual)

`ReviewReport` describes the UI validation result for a repo at a specific moment.

Required:
- `schema_version`
- `report_id`
- `generated_at`
- `repo_root`
- `session_id`
- `policy_hash`
- `scope`
- `summary`
- `findings`
- `evidence`
- `offers`

Optional:
- `redesign_mode`
- `exceptions_requested`

---

## 4. JSON Schema (Draft 2020-12)

> This is a normative JSON Schema. Validators MUST validate against this.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "shyft://schemas/ui_review_report.v1.json",
  "title": "UiReviewReport",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "report_id",
    "generated_at",
    "repo_root",
    "session_id",
    "policy_hash",
    "scope",
    "summary",
    "findings",
    "evidence",
    "offers"
  ],
  "properties": {
    "schema_version": { "type": "string", "const": "1.0" },
    "report_id": { "type": "string", "minLength": 8 },
    "generated_at": { "type": "string", "format": "date-time" },
    "repo_root": { "type": "string", "minLength": 1 },
    "session_id": { "type": "string", "minLength": 8 },
    "policy_hash": { "type": "string", "minLength": 16 },

    "scope": {
      "type": "object",
      "additionalProperties": false,
      "required": ["mode", "targets"],
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["review_phase_only"]
        },
        "targets": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["target_type", "path"],
            "properties": {
              "target_type": {
                "type": "string",
                "enum": ["screen_spec", "component_contract", "implementation_file", "tokens_file"]
              },
              "path": { "type": "string", "minLength": 1 }
            }
          }
        }
      }
    },

    "summary": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "counts", "decision_surface_pass_rate"],
      "properties": {
        "status": { "type": "string", "enum": ["pass", "warn", "fail"] },
        "counts": {
          "type": "object",
          "additionalProperties": false,
          "required": ["error", "warn", "info"],
          "properties": {
            "error": { "type": "integer", "minimum": 0 },
            "warn": { "type": "integer", "minimum": 0 },
            "info": { "type": "integer", "minimum": 0 }
          }
        },
        "decision_surface_pass_rate": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    },

    "findings": {
      "type": "array",
      "items": { "$ref": "#/$defs/finding" }
    },

    "evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["tokens", "decision_surfaces"],
      "properties": {
        "tokens": { "$ref": "#/$defs/tokens_evidence" },
        "decision_surfaces": { "$ref": "#/$defs/decision_surface_evidence" },
        "accessibility": { "$ref": "#/$defs/accessibility_evidence" }
      }
    },

    "offers": {
      "type": "array",
      "items": { "$ref": "#/$defs/offer" }
    },

    "redesign_mode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["enabled", "activation_source"],
      "properties": {
        "enabled": { "type": "boolean" },
        "activation_source": {
          "type": "string",
          "enum": ["flag", "one_command_override", "repo_policy"]
        },
        "intent_summary": {
          "type": "array",
          "items": { "type": "string" },
          "maxItems": 5
        },
        "churn_disclosure": {
          "type": "object",
          "additionalProperties": false,
          "required": ["files_rewritten", "reason"],
          "properties": {
            "files_rewritten": { "type": "array", "items": { "type": "string" } },
            "reason": { "type": "string" }
          }
        }
      }
    },

    "exceptions_requested": {
      "type": "array",
      "items": { "$ref": "#/$defs/exception_request" }
    }
  },

  "$defs": {
    "finding": {
      "type": "object",
      "additionalProperties": false,
      "required": ["rule_id", "severity", "message", "target", "fix"],
      "properties": {
        "rule_id": { "type": "string", "minLength": 8 },
        "severity": { "type": "string", "enum": ["error", "warn", "info"] },
        "message": { "type": "string" },
        "target": { "$ref": "#/$defs/target_ref" },
        "location": { "$ref": "#/$defs/location_ref" },
        "fix": { "$ref": "#/$defs/fix_ref" }
      }
    },

    "target_ref": {
      "type": "object",
      "additionalProperties": false,
      "required": ["path", "target_type"],
      "properties": {
        "path": { "type": "string" },
        "target_type": {
          "type": "string",
          "enum": ["screen_spec", "component_contract", "implementation_file", "tokens_file"]
        }
      }
    },

    "location_ref": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "line": { "type": "integer", "minimum": 1 },
        "column": { "type": "integer", "minimum": 1 },
        "range": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "start_line": { "type": "integer", "minimum": 1 },
            "end_line": { "type": "integer", "minimum": 1 }
          }
        }
      }
    },

    "fix_ref": {
      "type": "object",
      "additionalProperties": false,
      "required": ["guidance"],
      "properties": {
        "guidance": { "type": "string" },
        "suggested_patch": {
          "type": "object",
          "additionalProperties": false,
          "required": ["type"],
          "properties": {
            "type": { "type": "string", "enum": ["patch", "full_rewrite"] },
            "note": { "type": "string" }
          }
        }
      }
    },

    "tokens_evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["tokens_files", "raw_color_count", "arbitrary_spacing_count"],
      "properties": {
        "tokens_files": {
          "type": "array",
          "items": { "type": "string" }
        },
        "raw_color_count": { "type": "integer", "minimum": 0 },
        "arbitrary_spacing_count": { "type": "integer", "minimum": 0 }
      }
    },

    "decision_surface_evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["surfaces_checked", "surfaces_passed", "checklist_results"],
      "properties": {
        "surfaces_checked": { "type": "integer", "minimum": 0 },
        "surfaces_passed": { "type": "integer", "minimum": 0 },
        "checklist_results": {
          "type": "array",
          "items": { "$ref": "#/$defs/checklist_result" }
        }
      }
    },

    "checklist_result": {
      "type": "object",
      "additionalProperties": false,
      "required": ["surface_id", "target", "passed", "checks"],
      "properties": {
        "surface_id": { "type": "string" },
        "target": { "$ref": "#/$defs/target_ref" },
        "passed": { "type": "boolean" },
        "checks": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["check_id", "passed", "note"],
            "properties": {
              "check_id": { "type": "string" },
              "passed": { "type": "boolean" },
              "note": { "type": "string" }
            }
          }
        }
      }
    },

    "accessibility_evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["a11y_errors", "a11y_warnings"],
      "properties": {
        "a11y_errors": { "type": "integer", "minimum": 0 },
        "a11y_warnings": { "type": "integer", "minimum": 0 },
        "notes": { "type": "array", "items": { "type": "string" } }
      }
    },

    "offer": {
      "type": "object",
      "additionalProperties": false,
      "required": ["offer_id", "dedupe_key", "title", "prompt", "source", "priority", "dismissed"],
      "properties": {
        "offer_id": { "type": "string" },
        "dedupe_key": { "type": "string" },
        "title": { "type": "string" },
        "prompt": { "type": "string" },
        "source": {
          "type": "object",
          "additionalProperties": false,
          "required": ["phase", "report_id"],
          "properties": {
            "phase": { "type": "string", "enum": ["review"] },
            "report_id": { "type": "string" }
          }
        },
        "priority": { "type": "string", "enum": ["low", "medium", "high"] },
        "dismissed": { "type": "boolean" }
      }
    },

    "exception_request": {
      "type": "object",
      "additionalProperties": false,
      "required": ["rule_id", "reason", "requested_by"],
      "properties": {
        "rule_id": { "type": "string" },
        "reason": { "type": "string" },
        "requested_by": { "type": "string" },
        "expires_in_version": { "type": "string" }
      }
    }
  }
}
```

---

## 5. Example Output (PASS)

```json
{"schema_version":"1.0","report_id":"ui-2026-01-22-001","generated_at":"2026-01-22T20:11:10Z","repo_root":"/repo","session_id":"sess_8f2c1e9a","policy_hash":"pol_9b2a3c4d5e6f7a8b","scope":{"mode":"review_phase_only","targets":[{"target_type":"tokens_file","path":"ui/tokens.global.json"},{"target_type":"screen_spec","path":"ui/screens/voucher.request.yaml"}]},"summary":{"status":"pass","counts":{"error":0,"warn":0,"info":2},"decision_surface_pass_rate":1.0},"findings":[{"rule_id":"SHYFT_UI_INFO_001","severity":"info","message":"Decision Surface checklist passed for voucher.request.","target":{"path":"ui/screens/voucher.request.yaml","target_type":"screen_spec"},"fix":{"guidance":"No action required."}},{"rule_id":"SHYFT_UI_INFO_002","severity":"info","message":"No raw colors detected.","target":{"path":"apps/web/src/pages/voucher-request.tsx","target_type":"implementation_file"},"fix":{"guidance":"No action required."}}],"evidence":{"tokens":{"tokens_files":["ui/tokens.global.json","ui/modules/voucher/tokens.module.json"],"raw_color_count":0,"arbitrary_spacing_count":0},"decision_surfaces":{"surfaces_checked":1,"surfaces_passed":1,"checklist_results":[{"surface_id":"voucher_request_surface","target":{"path":"ui/screens/voucher.request.yaml","target_type":"screen_spec"},"passed":true,"checks":[{"check_id":"DS_CONTEXT_FIRST","passed":true,"note":"ContextCard present and read-only."},{"check_id":"DS_SINGLE_PRIMARY_CTA","passed":true,"note":"Only one primary CTA found."}]}]},"accessibility":{"a11y_errors":0,"a11y_warnings":0,"notes":["Focus visible verified in component library."]}},"offers":[]}
```

---

## 6. Example Output (FAIL with offers)

```json
{"schema_version":"1.0","report_id":"ui-2026-01-22-002","generated_at":"2026-01-22T20:13:22Z","repo_root":"/repo","session_id":"sess_1a7d3c90","policy_hash":"pol_9b2a3c4d5e6f7a8b","scope":{"mode":"review_phase_only","targets":[{"target_type":"implementation_file","path":"apps/web/src/pages/voucher-request.tsx"}]},"summary":{"status":"fail","counts":{"error":2,"warn":1,"info":0},"decision_surface_pass_rate":0.0},"findings":[{"rule_id":"SHYFT_UI_TOKENS_001","severity":"error","message":"Raw color detected. Use Shyft tokens only.","target":{"path":"apps/web/src/pages/voucher-request.tsx","target_type":"implementation_file"},"location":{"line":88,"column":17},"fix":{"guidance":"Replace #2563eb with color token mapping (e.g., color.accent.primary).","suggested_patch":{"type":"patch","note":"Convert raw hex to token class reference."}}},{"rule_id":"SHYFT_UI_DS_002","severity":"error","message":"Only one primary CTA allowed per Decision Surface.","target":{"path":"apps/web/src/pages/voucher-request.tsx","target_type":"implementation_file"},"location":{"line":142,"column":5},"fix":{"guidance":"Demote secondary primary button to link style or move to separate surface.","suggested_patch":{"type":"patch","note":"Convert extra primary button to secondary."}}},{"rule_id":"SHYFT_UI_COPY_001","severity":"warn","message":"Avoid emotional framing. Use factual, calm language.","target":{"path":"apps/web/src/pages/voucher-request.tsx","target_type":"implementation_file"},"location":{"line":21,"column":1},"fix":{"guidance":"Replace pity/urgency language with neutral operational phrasing.","suggested_patch":{"type":"patch","note":"Rewrite subtext to Quiet Authority posture."}}}],"evidence":{"tokens":{"tokens_files":["ui/tokens.global.json"],"raw_color_count":1,"arbitrary_spacing_count":0},"decision_surfaces":{"surfaces_checked":1,"surfaces_passed":0,"checklist_results":[{"surface_id":"voucher_request_surface","target":{"path":"apps/web/src/pages/voucher-request.tsx","target_type":"implementation_file"},"passed":false,"checks":[{"check_id":"DS_SINGLE_PRIMARY_CTA","passed":false,"note":"Found 2 primary CTAs."},{"check_id":"DS_CONTEXT_FIRST","passed":true,"note":"Context present."}]}]},"accessibility":{"a11y_errors":0,"a11y_warnings":1,"notes":["Tap target size borderline on mobile for small icon button."]}},"offers":[{"offer_id":"offer_ui_fix_001","dedupe_key":"ui_review:apps/web/src/pages/voucher-request.tsx","title":"UI review fixes available","prompt":"UI review found 2 errors and 1 warning. Run through fixes for tokens, CTA hierarchy, and copy posture.","source":{"phase":"review","report_id":"ui-2026-01-22-002"},"priority":"high","dismissed":false}]}
```

---

## 7. Offer Mapping Rules (Normative)

When creating offers from UI Review:
- `dedupe_key` MUST be stable per target scope:
  - `ui_review:<path>` for file-scoped
  - `ui_review:screen:<screen_id>` for screen-scoped
- `title` MUST be functional (no values language)
- `prompt` MUST be actionable and brief
- Offers MUST never appear mid-command; only via `shyft status` and `shyft review`

---

## 8. Compatibility Notes (BMAD + Shyft)

- This report can be referenced in BMAD artifacts as evidence without embedding full logs.
- If a BMAD workflow-status validator requires UI evidence, it should reference:
  - `report_id`
  - `summary.status`
  - and any `exceptions_requested`

---
