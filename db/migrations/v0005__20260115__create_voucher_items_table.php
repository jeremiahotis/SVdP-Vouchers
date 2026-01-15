<?php
return function () {
    global $wpdb;
    $table = $wpdb->prefix . 'svdp_voucher_items';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        voucher_id bigint(20) NOT NULL,
        catalog_item_id bigint(20) DEFAULT NULL,
        item_type varchar(50) NOT NULL,
        item_name varchar(255) NOT NULL,
        item_category varchar(100) NOT NULL,
        item_price_min decimal(10,2) NOT NULL DEFAULT 0.00,
        item_price_max decimal(10,2) NOT NULL DEFAULT 0.00,
        is_woodshop tinyint(1) NOT NULL DEFAULT 0,
        is_woodshop_paused tinyint(1) NOT NULL DEFAULT 0,
        quantity int(11) NOT NULL DEFAULT 1,
        items_redeemed int(11) NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY voucher_id (voucher_id),
        KEY item_type (item_type)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
};
