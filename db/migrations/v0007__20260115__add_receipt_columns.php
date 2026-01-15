<?php
return function () {
    global $wpdb;
    $table = $wpdb->prefix . 'svdp_vouchers';

    // Add receipt_id column if it doesn't exist
    if (!$wpdb->get_results("SHOW COLUMNS FROM $table LIKE 'receipt_id'")) {
        $wpdb->query("ALTER TABLE $table ADD COLUMN receipt_id varchar(50) DEFAULT NULL AFTER redemption_total_value");
    }

    // Add gross_total column if it doesn't exist
    if (!$wpdb->get_results("SHOW COLUMNS FROM $table LIKE 'gross_total'")) {
        $wpdb->query("ALTER TABLE $table ADD COLUMN gross_total decimal(10,2) DEFAULT '0.00' AFTER receipt_id");
    }

    // Add index for receipt_id for faster lookups
    // Check if index exists first to avoid errors
    $indices = $wpdb->get_results("SHOW INDEX FROM $table WHERE Key_name = 'receipt_id'");
    if (empty($indices)) {
        $wpdb->query("ALTER TABLE $table ADD INDEX receipt_id (receipt_id)");
    }
};
