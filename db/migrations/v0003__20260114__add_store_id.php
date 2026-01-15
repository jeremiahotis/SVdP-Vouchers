<?php
/**
 * Migration v0003: Add store_id and store settings
 *
 * Idempotent: YES
 * Notes:
 * - Use $wpdb->get_results("SHOW COLUMNS ...") / "SHOW TABLES LIKE ..." checks
 * - Use dbDelta() for CREATE/ALTER where appropriate
 */
return function() {
    global $wpdb;

    $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
    $conferences_table = $wpdb->prefix . 'svdp_conferences';
    $settings_table = $wpdb->prefix . 'svdp_settings';

    // Add store_id to vouchers if missing.
    $store_id_col = $wpdb->get_results("SHOW COLUMNS FROM $vouchers_table LIKE 'store_id'");
    if (empty($store_id_col)) {
        $wpdb->query("ALTER TABLE $vouchers_table ADD COLUMN store_id bigint(20) DEFAULT NULL AFTER conference_id");
        $wpdb->query("ALTER TABLE $vouchers_table ADD KEY store_id (store_id)");
    }

    // Add woodshop_paused to conferences if missing.
    $woodshop_col = $wpdb->get_results("SHOW COLUMNS FROM $conferences_table LIKE 'woodshop_paused'");
    if (empty($woodshop_col)) {
        $wpdb->query("ALTER TABLE $conferences_table ADD COLUMN woodshop_paused tinyint(1) DEFAULT 0 AFTER organization_type");
    }

    // Ensure a default store exists.
    $store_count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $conferences_table WHERE organization_type = 'store'");
    if ($store_count === 0) {
        $wpdb->insert($conferences_table, [
            'name' => 'SVdP Thrift Store',
            'slug' => 'svdp-thrift-store',
            'is_emergency' => 0,
            'organization_type' => 'store',
            'woodshop_paused' => 0,
            'eligibility_days' => 90,
            'emergency_affects_eligibility' => 0,
            'regular_items_per_person' => 7,
            'emergency_items_per_person' => 3,
            'form_enabled' => 0,
            'active' => 1,
            'allowed_voucher_types' => json_encode(['clothing']),
        ]);
    }

    // Set default_store_id setting if missing.
    $default_store_id = $wpdb->get_var("SELECT id FROM $conferences_table WHERE organization_type = 'store' ORDER BY id ASC LIMIT 1");
    if (!empty($default_store_id)) {
        $exists = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $settings_table WHERE setting_key = %s",
            'default_store_id'
        ));
        if ($exists === 0) {
            $wpdb->insert($settings_table, [
                'setting_key' => 'default_store_id',
                'setting_value' => (string) $default_store_id,
                'setting_type' => 'text',
            ]);
        }
    }

    // Backfill vouchers with default store_id if missing.
    if (!empty($default_store_id)) {
        $wpdb->query($wpdb->prepare(
            "UPDATE $vouchers_table SET store_id = %d WHERE store_id IS NULL",
            $default_store_id
        ));
    }
};
