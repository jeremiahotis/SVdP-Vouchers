<?php
/**
 * Migration v0008: Create audit events table
 *
 * Idempotent: YES
 * Notes:
 * - Creates wp_svdp_audit_events table for logging overrides, redemptions, and imports
 * - Uses dbDelta() for idempotent table creation
 */
return function () {
    global $wpdb;

    $table_name = $wpdb->prefix . 'svdp_audit_events';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        event_type varchar(50) NOT NULL,
        voucher_id bigint(20) unsigned DEFAULT NULL,
        manager_id bigint(20) unsigned DEFAULT NULL,
        reason_id bigint(20) unsigned DEFAULT NULL,
        cashier_user_id bigint(20) unsigned DEFAULT NULL,
        override_type varchar(100) DEFAULT NULL,
        receipt_id varchar(100) DEFAULT NULL,
        import_run_id bigint(20) unsigned DEFAULT NULL,
        import_type varchar(50) DEFAULT NULL,
        rows_processed int DEFAULT NULL,
        rows_success int DEFAULT NULL,
        rows_failed int DEFAULT NULL,
        notes text DEFAULT NULL,
        created_at datetime NOT NULL,
        PRIMARY KEY  (id),
        KEY event_type (event_type),
        KEY voucher_id (voucher_id),
        KEY created_at (created_at)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
};
