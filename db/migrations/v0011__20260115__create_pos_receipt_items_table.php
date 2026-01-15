<?php

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

return function () {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    // Create Receipt Items Table
    $table_items = $wpdb->prefix . 'svdp_pos_receipt_items';

    $sql = "CREATE TABLE $table_items (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        store_id bigint(20) unsigned NOT NULL,
        receipt_id varchar(100) NOT NULL,
        sku varchar(100) DEFAULT NULL,
        description text DEFAULT NULL,
        category varchar(255) DEFAULT NULL,
        quantity int(11) DEFAULT 1,
        unit_price decimal(10,2) DEFAULT 0.00,
        line_total decimal(10,2) DEFAULT 0.00,
        PRIMARY KEY (id),
        KEY store_receipt (store_id, receipt_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
};
