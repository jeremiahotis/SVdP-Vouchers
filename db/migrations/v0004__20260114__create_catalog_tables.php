<?php
/**
 * Migration v0004: Create catalog tables and seed categories
 *
 * Idempotent: YES
 * Notes:
 * - Use $wpdb->get_results("SHOW COLUMNS ...") / "SHOW TABLES LIKE ..." checks
 * - Use dbDelta() for CREATE/ALTER where appropriate
 */
return function() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();
    $catalog_table = $wpdb->prefix . 'svdp_catalog_items';

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    $sql = "CREATE TABLE $catalog_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        voucher_type varchar(50) NOT NULL,
        category varchar(100) NOT NULL,
        name varchar(200) NOT NULL,
        min_price decimal(10,2) NOT NULL DEFAULT 0.00,
        max_price decimal(10,2) NOT NULL DEFAULT 0.00,
        is_woodshop tinyint(1) NOT NULL DEFAULT 0,
        availability_status varchar(50) NOT NULL DEFAULT 'available',
        active tinyint(1) NOT NULL DEFAULT 1,
        sort_order int(11) NOT NULL DEFAULT 0,
        synonyms text DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY voucher_type (voucher_type),
        KEY category (category),
        KEY active (active)
    ) $charset_collate;";

    dbDelta($sql);
};
