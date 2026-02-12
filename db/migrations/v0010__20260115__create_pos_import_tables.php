<?php

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

return function () {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    // 1. Create Import Runs Table
    $table_runs = $wpdb->prefix . 'svdp_import_runs';
    $sql_runs = "CREATE TABLE $table_runs (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        store_id bigint(20) unsigned NOT NULL,
        started_at datetime DEFAULT CURRENT_TIMESTAMP,
        ended_at datetime DEFAULT NULL,
        status varchar(50) DEFAULT 'running',
        rows_read int(11) DEFAULT 0,
        rows_inserted int(11) DEFAULT 0,
        rows_skipped int(11) DEFAULT 0,
        errors longtext DEFAULT NULL,
        PRIMARY KEY (id),
        KEY store_id (store_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql_runs);

    // 2. Create POS Receipts Table
    $table_receipts = $wpdb->prefix . 'svdp_pos_receipts';
    $sql_receipts = "CREATE TABLE $table_receipts (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        store_id bigint(20) unsigned NOT NULL,
        receipt_id varchar(100) NOT NULL,
        gross_total decimal(10,2) DEFAULT 0.00,
        receipt_datetime datetime DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY store_receipt (store_id, receipt_id),
        KEY receipt_date (receipt_datetime)
    ) $charset_collate;";

    dbDelta($sql_receipts);
};
