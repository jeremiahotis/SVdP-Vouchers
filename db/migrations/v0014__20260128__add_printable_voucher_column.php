<?php
/**
 * Migration: Add enable_printable_voucher column to conferences table
 */
return function () {
    // Run create_tables to add the column via dbDelta
    SVDP_Database::create_tables();

    global $wpdb;
    $table = $wpdb->prefix . 'svdp_conferences';

    // Ensure existing records have a default value
    $wpdb->query("UPDATE $table SET enable_printable_voucher = 0 WHERE enable_printable_voucher IS NULL");
};
