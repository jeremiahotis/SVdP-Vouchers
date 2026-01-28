<?php
/**
 * Database setup and schema
 */
class SVDP_Database
{

    /**
     * Create database tables
     */
    public static function create_tables()
    {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // Vouchers table
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $vouchers_sql = "CREATE TABLE $vouchers_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            first_name varchar(100) NOT NULL,
            last_name varchar(100) NOT NULL,
            dob date NOT NULL,
            adults int(11) NOT NULL DEFAULT 0,
            children int(11) NOT NULL DEFAULT 0,
            conference_id bigint(20) NOT NULL,
            store_id bigint(20) DEFAULT NULL,
            vincentian_name varchar(200) DEFAULT NULL,
            vincentian_email varchar(200) DEFAULT NULL,
            created_by varchar(50) NOT NULL,
            voucher_created_date date NOT NULL,
            status varchar(50) NOT NULL DEFAULT 'Active',
            redeemed_date date DEFAULT NULL,
            override_note text DEFAULT NULL,
            voucher_value decimal(10,2) NOT NULL DEFAULT 0,
            voucher_items_count int(11) DEFAULT NULL,
            voucher_type varchar(50) DEFAULT 'regular',
            items_adult_redeemed int(11) DEFAULT 0,
            items_children_redeemed int(11) DEFAULT 0,
            redemption_total_value decimal(10,2) DEFAULT NULL,
            denial_reason text DEFAULT NULL,
            coat_status varchar(50) DEFAULT 'Available',
            coat_issued_date date DEFAULT NULL,
            coat_adults_issued int(11) DEFAULT NULL,
            coat_children_issued int(11) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY first_name (first_name),
            KEY last_name (last_name),
            KEY dob (dob),
            KEY conference_id (conference_id),
            KEY store_id (store_id),
            KEY status (status),
            KEY voucher_created_date (voucher_created_date),
            KEY coat_issued_date (coat_issued_date)
        ) $charset_collate;";

        // Conferences table
        $conferences_table = $wpdb->prefix . 'svdp_conferences';
        $conferences_sql = "CREATE TABLE $conferences_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(200) NOT NULL,
            slug varchar(200) NOT NULL,
            is_emergency tinyint(1) NOT NULL DEFAULT 0,
            organization_type varchar(50) DEFAULT 'conference',
            woodshop_paused tinyint(1) DEFAULT 0,
            enable_printable_voucher tinyint(1) DEFAULT 0,
            eligibility_days int(11) DEFAULT 90,
            emergency_affects_eligibility tinyint(1) DEFAULT 0,
            regular_items_per_person int(11) DEFAULT 7,
            emergency_items_per_person int(11) DEFAULT 3,
            form_enabled tinyint(1) DEFAULT 1,
            active tinyint(1) NOT NULL DEFAULT 1,
            notification_email varchar(200) DEFAULT NULL,
            custom_form_text text DEFAULT NULL,
            custom_rules_text text DEFAULT NULL,
            allowed_voucher_types text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug),
            KEY active (active),
            KEY organization_type (organization_type)
        ) $charset_collate;";

        // Settings table
        $settings_table = $wpdb->prefix . 'svdp_settings';
        $settings_sql = "CREATE TABLE $settings_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            setting_key varchar(100) NOT NULL,
            setting_value text,
            setting_type varchar(50) DEFAULT 'text',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY setting_key (setting_key)
        ) $charset_collate;";

        dbDelta($vouchers_sql);
        dbDelta($conferences_sql);
        dbDelta($settings_sql);

        // Create new tables for manager override system
        self::create_managers_table();
        self::create_override_reasons_table();
        self::add_override_columns();

        // Insert default conferences and settings
        self::insert_default_conferences();
        self::insert_default_settings();
    }

    /**
     * Insert default conferences
     */
    private static function insert_default_conferences()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';
        $settings_table = $wpdb->prefix . 'svdp_settings';

        // Check if conferences already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        $conferences = [
            ['name' => 'Emergency', 'slug' => 'emergency', 'is_emergency' => 1],
            ['name' => 'Cathedral of the Immaculate Conception', 'slug' => 'cathedral-immaculate-conception', 'is_emergency' => 0],
            ['name' => 'Catholic Charities', 'slug' => 'catholic-charities', 'is_emergency' => 0],
            ['name' => 'Our Lady of Good Hope', 'slug' => 'our-lady-good-hope', 'is_emergency' => 0],
            ['name' => 'Queen of Angels', 'slug' => 'queen-of-angels', 'is_emergency' => 0],
            ['name' => 'Sacred Heart – Warsaw', 'slug' => 'sacred-heart-warsaw', 'is_emergency' => 0],
            ['name' => 'St Charles Borromeo', 'slug' => 'st-charles-borromeo', 'is_emergency' => 0],
            ['name' => 'St Elizabeth Ann Seton', 'slug' => 'st-elizabeth-ann-seton', 'is_emergency' => 0],
            ['name' => 'St John the Baptist', 'slug' => 'st-john-baptist', 'is_emergency' => 0],
            ['name' => 'St John – St Patrick', 'slug' => 'st-john-st-patrick', 'is_emergency' => 0],
            ['name' => 'St Joseph', 'slug' => 'st-joseph', 'is_emergency' => 0],
            ['name' => 'St Jude', 'slug' => 'st-jude', 'is_emergency' => 0],
            ['name' => 'St Louis Besancon', 'slug' => 'st-louis-besancon', 'is_emergency' => 0],
            ['name' => 'St Mary – Fort Wayne', 'slug' => 'st-mary-fort-wayne', 'is_emergency' => 0],
            ['name' => 'St Therese', 'slug' => 'st-therese', 'is_emergency' => 0],
            ['name' => 'St Vincent de Paul', 'slug' => 'st-vincent-de-paul', 'is_emergency' => 0],
        ];

        foreach ($conferences as $conference) {
            $wpdb->insert($table, $conference);
        }

        // Ensure a default store exists for cashier context.
        $store_count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE organization_type = 'store'");
        if ($store_count === 0) {
            $wpdb->insert($table, [
                'name' => 'SVdP Thrift Store',
                'slug' => 'svdp-thrift-store',
                'is_emergency' => 0,
                'organization_type' => 'store',
                'woodshop_paused' => 0,
                'eligibility_days' => 90,
                'emergency_affects_eligibility' => 0,
                'regular_items_per_person' => 7,
                'emergency_items_per_person' => 3,
                'form_enabled' => 0,
                'active' => 1,
                'allowed_voucher_types' => json_encode(['clothing']),
            ]);
        }

        // Set default_store_id setting if missing.
        $default_store_id = $wpdb->get_var("SELECT id FROM $table WHERE organization_type = 'store' ORDER BY id ASC LIMIT 1");
        if (!empty($default_store_id)) {
            $exists = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $settings_table WHERE setting_key = %s",
                'default_store_id'
            ));
            if ($exists === 0) {
                $wpdb->insert($settings_table, [
                    'setting_key' => 'default_store_id',
                    'setting_value' => (string) $default_store_id,
                    'setting_type' => 'text',
                ]);
            }
        }
    }

    /**
     * Insert default settings
     */
    private static function insert_default_settings()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_settings';

        // Check if settings already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        $settings = [
            ['setting_key' => 'adult_item_value', 'setting_value' => '5.00', 'setting_type' => 'decimal'],
            ['setting_key' => 'child_item_value', 'setting_value' => '3.00', 'setting_type' => 'decimal'],
            ['setting_key' => 'store_hours', 'setting_value' => 'Monday-Friday 9am-5pm', 'setting_type' => 'text'],
            ['setting_key' => 'redemption_instructions', 'setting_value' => 'Neighbors should visit the store and provide their first name, last name, and date of birth at the counter.', 'setting_type' => 'textarea'],
            ['setting_key' => 'available_voucher_types', 'setting_value' => 'clothing,furniture,household', 'setting_type' => 'text'],
        ];

        foreach ($settings as $setting) {
            $wpdb->insert($table, $setting);
        }
    }

    /**
     * Migrate database to version 2 (add new columns for partner support & item-based model)
     */
    public static function migrate_to_v2()
    {
        global $wpdb;

        // Check if migration is needed
        $conferences_table = $wpdb->prefix . 'svdp_conferences';
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $conferences_table LIKE 'organization_type'");

        if (!empty($column_exists)) {
            return; // Already migrated
        }

        // Run create_tables() which uses dbDelta to add missing columns
        self::create_tables();

        // Set all existing conferences to organization_type='conference'
        $wpdb->query("UPDATE $conferences_table SET organization_type = 'conference' WHERE organization_type IS NULL");

        // Set default values for new columns if they're NULL
        $wpdb->query("UPDATE $conferences_table SET eligibility_days = 90 WHERE eligibility_days IS NULL");
        $wpdb->query("UPDATE $conferences_table SET regular_items_per_person = 7 WHERE regular_items_per_person IS NULL");
        $wpdb->query("UPDATE $conferences_table SET emergency_items_per_person = 3 WHERE emergency_items_per_person IS NULL");
        $wpdb->query("UPDATE $conferences_table SET form_enabled = 1 WHERE form_enabled IS NULL");
        $wpdb->query("UPDATE $conferences_table SET emergency_affects_eligibility = 0 WHERE emergency_affects_eligibility IS NULL");

        // Set default values for vouchers table new columns
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $wpdb->query("UPDATE $vouchers_table SET voucher_type = 'regular' WHERE voucher_type IS NULL");
        $wpdb->query("UPDATE $vouchers_table SET items_adult_redeemed = 0 WHERE items_adult_redeemed IS NULL");
        $wpdb->query("UPDATE $vouchers_table SET items_children_redeemed = 0 WHERE items_children_redeemed IS NULL");

        // Update Emergency conference to 'store' organization type
        $wpdb->query("UPDATE $conferences_table SET organization_type = 'store' WHERE slug = 'emergency' AND organization_type = 'conference'");

        // Set default allowed_voucher_types for existing conferences
        $wpdb->query("UPDATE $conferences_table SET allowed_voucher_types = '[\"clothing\",\"furniture\",\"household\"]' WHERE organization_type = 'conference' AND allowed_voucher_types IS NULL");

        // Set default allowed_voucher_types for store (clothing only)
        $wpdb->query("UPDATE $conferences_table SET allowed_voucher_types = '[\"clothing\"]' WHERE organization_type = 'store' AND allowed_voucher_types IS NULL");

        // Insert default settings if not already present
        self::insert_default_settings();
    }

    /**
     * Create managers table for override system
     */
    public static function create_managers_table()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(200) NOT NULL,
            code_hash varchar(255) NOT NULL,
            active tinyint(1) NOT NULL DEFAULT 1,
            created_date datetime NOT NULL,
            PRIMARY KEY (id),
            KEY active (active)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Create override reasons table
     */
    public static function create_override_reasons_table()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            reason_text varchar(255) NOT NULL,
            display_order int(11) NOT NULL DEFAULT 0,
            active tinyint(1) NOT NULL DEFAULT 1,
            PRIMARY KEY (id),
            KEY active_order (active, display_order)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Insert default reasons
        self::insert_default_reasons();
    }

    /**
     * Insert default override reasons
     */
    private static function insert_default_reasons()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        // Check if reasons already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        $defaults = [
            'Urgent family emergency',
            'Recent disaster or fire',
            'Medical emergency',
            'Housing crisis/eviction',
            'Other special circumstance'
        ];

        foreach ($defaults as $index => $reason) {
            $wpdb->insert($table, [
                'reason_text' => $reason,
                'display_order' => $index,
                'active' => 1
            ]);
        }
    }

    /**
     * Add manager_id and reason_id columns to vouchers table
     */
    public static function add_override_columns()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';

        // Check if columns already exist
        $manager_col = $wpdb->get_results("SHOW COLUMNS FROM $table LIKE 'manager_id'");
        if (empty($manager_col)) {
            $wpdb->query("ALTER TABLE $table
                ADD COLUMN manager_id bigint(20) DEFAULT NULL AFTER override_note,
                ADD COLUMN reason_id bigint(20) DEFAULT NULL AFTER manager_id");

            $wpdb->query("ALTER TABLE $table
                ADD KEY manager_id (manager_id),
                ADD KEY reason_id (reason_id)");
        }
    }


    /**
     * Run DB migrations on admin_init (safe, idempotent).
     *
     * Migrations live in /db/migrations and are executed in numeric order.
     * Each migration file must return a callable (closure) that performs schema changes/backfills.
     */
    public static function maybe_run_migrations()
    {
        // Only run in wp-admin; avoid frontend cost and avoid running for anonymous visitors.
        if (!is_admin()) {
            return;
        }

        // Only users who can manage options should trigger migrations.
        if (!current_user_can('manage_options')) {
            return;
        }

        // Avoid running during AJAX/REST calls unless explicitly desired.
        if (defined('DOING_AJAX') && DOING_AJAX) {
            return;
        }

        self::run_migrations();
    }

    /**
     * Execute pending migrations based on the stored schema version.
     */
    public static function run_migrations()
    {
        global $wpdb;

        $migrations_dir = trailingslashit(SVDP_VOUCHERS_PLUGIN_DIR) . 'db/migrations';
        if (!is_dir($migrations_dir)) {
            return;
        }

        // Existing plugin shipped as "v2" before formal migrations; start at 2 unless explicitly set.
        $current_version = (int) get_option('svdp_schema_version', 2);

        $files = glob($migrations_dir . '/v[0-9][0-9][0-9][0-9]__*.php');
        if (!$files) {
            // Ensure option exists for future.
            if (get_option('svdp_schema_version', null) === null) {
                add_option('svdp_schema_version', $current_version, '', false);
            }
            return;
        }

        // Sort by numeric prefix (v####)
        usort($files, function ($a, $b) {
            $va = (int) preg_replace('/^v(\d{4}).*$/', '$1', basename($a));
            $vb = (int) preg_replace('/^v(\d{4}).*$/', '$1', basename($b));
            return $va <=> $vb;
        });

        foreach ($files as $file) {
            $target_version = (int) preg_replace('/^v(\d{4}).*$/', '$1', basename($file));
            if ($target_version <= $current_version) {
                continue;
            }

            // Load migration callable
            $callable = include $file;

            if (!is_callable($callable)) {
                // Fail closed: do not advance schema version.
                error_log('SVdP Vouchers migration not callable: ' . basename($file));
                return;
            }

            // Best-effort transaction. dbDelta may auto-commit; still useful for backfills.
            $wpdb->query('START TRANSACTION');
            try {
                call_user_func($callable);
                $wpdb->query('COMMIT');
            } catch (Throwable $e) {
                $wpdb->query('ROLLBACK');
                error_log('SVdP Vouchers migration failed (' . basename($file) . '): ' . $e->getMessage());
                return;
            }

            $current_version = $target_version;
            update_option('svdp_schema_version', $current_version, false);
        }
    }

}
