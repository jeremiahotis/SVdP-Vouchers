# Source Tree Analysis

```
SVdP-Vouchers/
├── svdp-vouchers.php            # Plugin bootstrap, hooks, REST routes
├── includes/                    # Domain logic and data access
│   ├── class-database.php        # Schema + migration runner + defaults
│   ├── class-voucher.php         # Voucher lifecycle, duplicate detection
│   ├── class-conference.php      # Organization CRUD + REST list
│   ├── class-settings.php        # Settings storage + access
│   ├── class-admin.php           # Admin AJAX + admin page wiring
│   ├── class-manager.php         # Manager overrides
│   ├── class-override-reason.php # Override reasons CRUD
│   ├── class-catalog.php         # Catalog CRUD + REST helpers
│   └── class-shortcodes.php      # Shortcode handlers
├── admin/                        # wp-admin UI
│   ├── views/                    # Tabbed admin page templates
│   ├── js/                       # Admin JS (AJAX + UI behaviors)
│   └── css/                      # Admin styling
├── public/                       # Front-end templates + assets
│   ├── templates/                # Shortcode templates
│   ├── js/                       # Request + cashier JS
│   └── css/                      # Front-end styling
├── db/                           # Migration stubs + docs
│   └── migrations/               # Versioned migration scripts
├── docs/                         # Generated project documentation
├── README.md                     # Plugin overview + usage
├── DATA_DICTIONARY.md            # Data model plan
├── MIGRATION.md                  # Migration phases
├── POS_CSV_CONTRACT.md           # POS import contract
├── SCOPE.md                      # Scope lock
├── TEST_PLAN.md                  # Manual test checklist
├── UI_STATES.md                  # Required UI behaviors
└── update-redemption-instructions.sql # One-off DB update
```

## Critical Folders Summary
- `includes/`: core business logic and data access (REST + db)
- `admin/`: wp-admin UI, management screens
- `public/`: user-facing request form + cashier station
- `db/migrations/`: planned schema migrations (stubs)
- `docs/`: generated documentation artifacts
