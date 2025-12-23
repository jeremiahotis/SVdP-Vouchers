<?php
/**
 * Database setup and schema
 */
class SVDP_Database {
    
    /**
     * Create database tables
     */
    public static function create_tables() {
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

        // Insert default conferences and settings
        self::insert_default_conferences();
        self::insert_default_settings();
    }
    
    /**
     * Insert default conferences
     */
    private static function insert_default_conferences() {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_conferences';
        
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
    }

    /**
     * Insert default settings
     */
    private static function insert_default_settings() {
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
            ['setting_key' => 'redemption_instructions', 'setting_value' => 'Please bring your voucher and ID to the store.', 'setting_type' => 'textarea'],
            ['setting_key' => 'available_voucher_types', 'setting_value' => 'clothing,furniture,household', 'setting_type' => 'text'],
        ];

        foreach ($settings as $setting) {
            $wpdb->insert($table, $setting);
        }
    }

    /**
     * Migrate database to version 2 (add new columns for partner support & item-based model)
     */
    public static function migrate_to_v2() {
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
}
