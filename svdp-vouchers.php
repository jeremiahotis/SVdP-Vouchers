<?php
/**
 * Plugin Name: SVdP Vouchers
 * Description: Virtual clothing voucher management system for St. Vincent de Paul
 * Version: 1.0.0
 * Author: Jeremiah Otis
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: svdp-vouchers
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
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
 * Main plugin class
 */
class SVDP_Vouchers_Plugin {
    
    public function __construct() {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        
        // Initialize plugin
        add_action('plugins_loaded', [$this, 'init']);
        
        // Register REST API endpoints
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        
        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        SVDP_Database::create_tables();
        
        // Create cashier role
        $this->create_cashier_role();
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Create cashier role
     */
    private function create_cashier_role() {
        // Add custom role for cashiers
        add_role('svdp_cashier', 'SVdP Cashier', [
            'read' => true,
            'access_cashier_station' => true,
        ]);
    }
    
    /**
     * Initialize plugin components
     */
    public function init() {
        // Initialize shortcodes
        new SVDP_Shortcodes();
        
        // Initialize admin
        if (is_admin()) {
            new SVDP_Admin();
        }
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        // Get all vouchers
        register_rest_route('svdp/v1', '/vouchers', [
            'methods' => 'GET',
            'callback' => ['SVDP_Voucher', 'get_vouchers'],
            'permission_callback' => function() {
                return is_user_logged_in();
            }
        ]);
        
        // Check for duplicate
        register_rest_route('svdp/v1', '/vouchers/check-duplicate', [
            'methods' => 'POST',
            'callback' => ['SVDP_Voucher', 'check_duplicate'],
            'permission_callback' => '__return_true'
        ]);
        
        // Create voucher
        register_rest_route('svdp/v1', '/vouchers/create', [
            'methods' => 'POST',
            'callback' => ['SVDP_Voucher', 'create_voucher'],
            'permission_callback' => '__return_true'
        ]);
        
        // Update voucher status
        register_rest_route('svdp/v1', '/vouchers/(?P<id>\d+)/status', [
            'methods' => 'PATCH',
            'callback' => ['SVDP_Voucher', 'update_status'],
            'permission_callback' => function() {
                return is_user_logged_in();
            }
        ]);
        
        // Update coat status
        register_rest_route('svdp/v1', '/vouchers/(?P<id>\d+)/coat', [
            'methods' => 'PATCH',
            'callback' => ['SVDP_Voucher', 'update_coat_status'],
            'permission_callback' => function() {
                return is_user_logged_in();
            }
        ]);
        
        // Get conferences
        register_rest_route('svdp/v1', '/conferences', [
            'methods' => 'GET',
            'callback' => ['SVDP_Conference', 'get_conferences'],
            'permission_callback' => '__return_true'
        ]);

        // Create denied voucher (for tracking)
        register_rest_route('svdp/v1', '/vouchers/create-denied', [
            'methods' => 'POST',
            'callback' => ['SVDP_Voucher', 'create_denied_voucher'],
            'permission_callback' => '__return_true'
        ]);
    }
    
    /**
     * Enqueue frontend assets
     */
    public function enqueue_frontend_assets() {
        // Only on frontend
        if (is_admin()) {
            return;
        }
        
        // Always enqueue CSS
        wp_enqueue_style('svdp-vouchers-public', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/voucher-forms.css', [], SVDP_VOUCHERS_VERSION);
        
        // DataTables (for cashier station)
        wp_enqueue_style('datatables', 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
        wp_enqueue_script('datatables', 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js', ['jquery'], null, true);
        
        // Enqueue both JS files (they only activate on their respective pages)
        wp_enqueue_script('svdp-vouchers-request', SVDP_VOUCHERS_PLUGIN_URL . 'public/js/voucher-request.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);
        wp_enqueue_script('svdp-vouchers-cashier', SVDP_VOUCHERS_PLUGIN_URL . 'public/js/cashier-station.js', ['jquery', 'datatables'], SVDP_VOUCHERS_VERSION, true);
        
        // Localize scripts
        $script_data = [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url(),
            'nonce' => wp_create_nonce('wp_rest'),
        ];
        
        wp_localize_script('svdp-vouchers-request', 'svdpVouchers', $script_data);
        wp_localize_script('svdp-vouchers-cashier', 'svdpVouchers', $script_data);
    }
}

// Initialize plugin
new SVDP_Vouchers_Plugin();
