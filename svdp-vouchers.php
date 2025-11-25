<?php
/**
 * Plugin Name: SVdP Vouchers
 * Plugin URI: https://svdpfortwayne.org
 * Description: Virtual clothing voucher management system for St. Vincent de Paul with optional Monday.com sync
 * Version: 1.0.0
 * Author: St. Vincent de Paul Fort Wayne
 * Author URI: https://svdpfortwayne.org
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: svdp-vouchers
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Plugin constants
define('SVDP_VOUCHERS_VERSION', '1.0.0');
define('SVDP_VOUCHERS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SVDP_VOUCHERS_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-database.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-conference.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-voucher.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-monday-sync.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-shortcodes.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-admin.php';

/**
 * Plugin activation
 */
function svdp_vouchers_activate() {
    // Create database tables
    SVDP_Database::create_tables();
    
    // Create Cashier role
    svdp_vouchers_create_cashier_role();
    
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'svdp_vouchers_activate');

/**
 * Plugin deactivation
 */
function svdp_vouchers_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'svdp_vouchers_deactivate');

/**
 * Create Cashier user role
 */
function svdp_vouchers_create_cashier_role() {
    add_role(
        'svdp_cashier',
        __('SVdP Cashier', 'svdp-vouchers'),
        [
            'read' => true,
            'access_cashier_station' => true,
        ]
    );
}

/**
 * Initialize plugin
 */
function svdp_vouchers_init() {
    // Initialize classes
    new SVDP_Shortcodes();
    new SVDP_Admin();
    
    // Enqueue public styles and scripts
    add_action('wp_enqueue_scripts', 'svdp_vouchers_enqueue_public_assets');
}
add_action('plugins_loaded', 'svdp_vouchers_init');

/**
 * Enqueue public assets
 */
function svdp_vouchers_enqueue_public_assets() {
    // Only enqueue on pages with our shortcodes
    global $post;
    if (is_a($post, 'WP_Post') && (has_shortcode($post->post_content, 'svdp_voucher_request') || has_shortcode($post->post_content, 'svdp_cashier_station'))) {
        
        wp_enqueue_style('svdp-vouchers-public', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/voucher-forms.css', [], SVDP_VOUCHERS_VERSION);
        
        // Enqueue DataTables for cashier station
        if (has_shortcode($post->post_content, 'svdp_cashier_station')) {
            wp_enqueue_style('datatables', 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
            wp_enqueue_script('datatables', 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js', ['jquery'], null, true);
        }
        
        wp_enqueue_script('svdp-vouchers-public', SVDP_VOUCHERS_PLUGIN_URL . 'public/js/voucher-request.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);
        
        // Localize script with API endpoints
        wp_localize_script('svdp-vouchers-public', 'svdpVouchers', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url('svdp/v1/'),
            'nonce' => wp_create_nonce('svdp_vouchers_nonce'),
        ]);
    }
}

/**
 * Register REST API endpoints
 */
add_action('rest_api_init', function() {
    
    // Get all vouchers
    register_rest_route('svdp/v1', '/vouchers', [
        'methods' => 'GET',
        'callback' => [SVDP_Voucher::class, 'get_vouchers'],
        'permission_callback' => '__return_true',
    ]);
    
    // Check for duplicate
    register_rest_route('svdp/v1', '/vouchers/check-duplicate', [
        'methods' => 'POST',
        'callback' => [SVDP_Voucher::class, 'check_duplicate'],
        'permission_callback' => '__return_true',
    ]);
    
    // Create voucher
    register_rest_route('svdp/v1', '/vouchers/create', [
        'methods' => 'POST',
        'callback' => [SVDP_Voucher::class, 'create_voucher'],
        'permission_callback' => '__return_true',
    ]);
    
    // Update voucher status
    register_rest_route('svdp/v1', '/vouchers/(?P<id>\d+)/status', [
        'methods' => 'PATCH',
        'callback' => [SVDP_Voucher::class, 'update_status'],
        'permission_callback' => '__return_true',
    ]);
    
    // Update coat status
    register_rest_route('svdp/v1', '/vouchers/(?P<id>\d+)/coat', [
        'methods' => 'PATCH',
        'callback' => [SVDP_Voucher::class, 'update_coat_status'],
        'permission_callback' => '__return_true',
    ]);
    
    // Get conferences
    register_rest_route('svdp/v1', '/conferences', [
        'methods' => 'GET',
        'callback' => [SVDP_Conference::class, 'get_conferences'],
        'permission_callback' => '__return_true',
    ]);
    
});
