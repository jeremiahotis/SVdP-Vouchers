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
            voucher_value decimal(10,2) NOT NULL DEFAULT 0.00,
            status varchar(50) NOT NULL DEFAULT 'Active',
            redeemed_date date DEFAULT NULL,
            override_note text DEFAULT NULL,
            denial_reason text DEFAULT NULL,
            coat_status varchar(50) DEFAULT 'Available',
            coat_issued_date date DEFAULT NULL,
            monday_item_id varchar(50) DEFAULT NULL,
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
        $conferences_sql = "CREATE TABLE IF NOT EXISTS $conferences_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(200) NOT NULL,
            slug varchar(200) NOT NULL,
            is_emergency tinyint(1) NOT NULL DEFAULT 0,
            active tinyint(1) NOT NULL DEFAULT 1,
            monday_label varchar(200) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug),
            KEY active (active)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($vouchers_sql);
        dbDelta($conferences_sql);
        
        // Insert default conferences
        self::insert_default_conferences();
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
}
