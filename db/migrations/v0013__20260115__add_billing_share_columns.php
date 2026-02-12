<?php
/**
 * Migration: Add billing share columns to vouchers table
 * Version: 0013
 * Date: 2026-01-15
 */

return function () {
    global $wpdb;
    $table_name = $wpdb->prefix . 'svdp_vouchers';

    // Add conference_share
    if (!$wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'conference_share'")) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN conference_share DECIMAL(10,2) DEFAULT 0.00 AFTER redemption_total_value");
    }

    // Add store_share
    if (!$wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'store_share'")) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN store_share DECIMAL(10,2) DEFAULT 0.00 AFTER conference_share");
    }
};
