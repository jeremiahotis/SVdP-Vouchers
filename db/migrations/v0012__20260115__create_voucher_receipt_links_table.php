<?php

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

return function () {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    // Create Voucher-Receipt Links Table
    $table_links = $wpdb->prefix . 'svdp_voucher_receipt_links';
    $table_vouchers = $wpdb->prefix . 'svdp_vouchers';

    $sql = "CREATE TABLE $table_links (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        voucher_id bigint(20) unsigned NOT NULL,
        store_id bigint(20) unsigned NOT NULL,
        receipt_id varchar(100) NOT NULL,
        linked_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY store_receipt (store_id, receipt_id),
        UNIQUE KEY voucher_unique (voucher_id),
        CONSTRAINT fk_svdp_link_voucher FOREIGN KEY (voucher_id) REFERENCES $table_vouchers (id) ON DELETE CASCADE
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
};
