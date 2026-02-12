<?php

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

return function () {
    global $wpdb;

    $table_name = $wpdb->prefix . 'svdp_vouchers';
    $charset_collate = $wpdb->get_charset_collate();

    // Add new columns if they don't exist
    $sql = "ALTER TABLE $table_name 
            ADD COLUMN coat_issued_at DATETIME DEFAULT NULL,
            ADD COLUMN coat_issued_by BIGINT(20) UNSIGNED DEFAULT NULL;";

    // Execute query using dbDelta is safer, but for ALTER TABLE on specific columns, distinct queries are often clearer with WP migrations
    // Checking if columns exist first to avoid errors
    $col_check_1 = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'coat_issued_at'");
    if (empty($col_check_1)) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN coat_issued_at DATETIME DEFAULT NULL");
    }

    $col_check_2 = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'coat_issued_by'");
    if (empty($col_check_2)) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN coat_issued_by BIGINT(20) UNSIGNED DEFAULT NULL");
    }
};
