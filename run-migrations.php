<?php
/**
 * Manual migration runner for debugging
 * Run this via: wp eval-file run-migrations.php
 */

// Load WordPress
require_once('/Users/jeremiahotis/Local Sites/voucher-system/app/public/wp-load.php');

echo "Current schema version: " . get_option('svdp_schema_version', 'NOT SET') . "\n";

// Check if catalog table exists
global $wpdb;
$table_name = $wpdb->prefix . 'svdp_catalog_items';
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");

echo "Catalog table exists: " . ($table_exists ? 'YES' : 'NO') . "\n";

if (!$table_exists) {
    echo "\nRunning migrations...\n";

    // Force run migrations
    require_once(SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-database.php');
    SVDP_Database::run_migrations();

    echo "Migrations complete!\n";
    echo "New schema version: " . get_option('svdp_schema_version') . "\n";

    // Check again
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
    echo "Catalog table now exists: " . ($table_exists ? 'YES' : 'NO') . "\n";
}
