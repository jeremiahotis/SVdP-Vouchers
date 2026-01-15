<?php
/**
 * Plugin Name: SVdP Vouchers
 * Description: Virtual clothing voucher management system for St. Vincent de Paul
 * Version: 2.0.0
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
define('SVDP_VOUCHERS_VERSION', '2.0.0');
define('SVDP_VOUCHERS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SVDP_VOUCHERS_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-database.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-settings.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-conference.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-voucher.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-catalog.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-shortcodes.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-admin.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-manager.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-override-reason.php';

/**
 * Main plugin class
 */
class SVDP_Vouchers_Plugin
{

    public function __construct()
    {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);

        // Initialize plugin
        add_action('plugins_loaded', [$this, 'init']);

        // Run database migrations in admin context
        add_action('admin_init', [$this, 'maybe_run_migrations']);

        // Register REST API endpoints
        add_action('rest_api_init', [$this, 'register_rest_routes']);

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);

        // WordPress Heartbeat for session keep-alive
        add_filter('heartbeat_settings', [$this, 'configure_heartbeat']);
        add_filter('heartbeat_received', [$this, 'heartbeat_received'], 10, 2);

        // REST API authentication for long-running sessions
        add_filter('rest_authentication_errors', [$this, 'handle_rest_authentication'], 99);
    }

    /**
     * Plugin activation
     */
    public function activate()
    {
        // Create database tables
        SVDP_Database::create_tables();

        // Run migration for existing databases
        SVDP_Database::migrate_to_v2();

        // Create cashier role
        $this->create_cashier_role();

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate()
    {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Create cashier role
     */
    private function create_cashier_role()
    {
        // Add custom role for cashiers
        add_role('svdp_cashier', 'SVdP Cashier', [
            'read' => true,
            'access_cashier_station' => true,
        ]);
    }

    /**
     * Initialize plugin components
     */
    public function init()
    {
        // Initialize shortcodes
        new SVDP_Shortcodes();

        // Initialize admin
        if (is_admin()) {
            new SVDP_Admin();
        }
    }

    /**
     * Run DB migrations (admin only).
     */
    public function maybe_run_migrations()
    {
        SVDP_Database::maybe_run_migrations();
    }


    /**
     * Register REST API routes
     */
    public function register_rest_routes()
    {
        // Get all vouchers
        register_rest_route('svdp/v1', '/vouchers', [
            'methods' => 'GET',
            'callback' => ['SVDP_Voucher', 'get_vouchers'],
            'permission_callback' => [$this, 'user_can_access_cashier']
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
            'permission_callback' => [$this, 'user_can_access_cashier']
        ]);

        // Update coat status
        register_rest_route('svdp/v1', '/vouchers/(?P<id>\d+)/coat', [
            'methods' => 'PATCH',
            'callback' => ['SVDP_Voucher', 'update_coat_status'],
            'permission_callback' => [$this, 'user_can_access_cashier']
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

        // Nonce refresh endpoint (fallback if heartbeat fails)
        register_rest_route('svdp/v1', '/auth/refresh-nonce', [
            'methods' => 'POST',
            'callback' => [$this, 'refresh_nonce'],
            'permission_callback' => function () {
                // Only require logged in - don't check nonce
                return is_user_logged_in();
            }
        ]);

        // Manager validation endpoint
        register_rest_route('svdp/v1', '/managers/validate', [
            'methods' => 'POST',
            'callback' => ['SVDP_Manager', 'validate_code_endpoint'],
            'permission_callback' => '__return_true'
        ]);

        // Get active override reasons
        register_rest_route('svdp/v1', '/override-reasons', [
            'methods' => 'GET',
            'callback' => ['SVDP_Override_Reason', 'get_active_endpoint'],
            'permission_callback' => '__return_true'
        ]);

    }

    /**
     * Configure WordPress Heartbeat for cashier station
     */
    public function configure_heartbeat($settings)
    {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'svdp_cashier_station')) {
            $settings['interval'] = 15; // 15 seconds - faster than auto-refresh to always be fresh
        }
        return $settings;
    }

    /**
     * Handle Heartbeat tick - extend session and refresh nonce
     */
    public function heartbeat_received($response, $data)
    {
        // Check if this is a cashier station heartbeat
        if (isset($data['svdp_cashier_active']) && $data['svdp_cashier_active']) {
            if (is_user_logged_in()) {
                // Extend auth cookie to 14 days
                wp_set_auth_cookie(get_current_user_id(), true, is_ssl());

                // Generate fresh nonce
                $response['svdp_nonce'] = wp_create_nonce('wp_rest');
                $response['svdp_heartbeat_status'] = 'active';
            } else {
                $response['svdp_heartbeat_status'] = 'logged_out';
            }
        }
        return $response;
    }

    /**
     * Custom REST authentication for long-running cashier sessions
     *
     * WordPress REST API behavior:
     * - When X-WP-Nonce is present and INVALID, user is treated as anonymous
     * - This prevents is_user_logged_in() from working even with valid cookie
     *
     * This filter bypasses nonce validation for SVDP routes only,
     * allowing cookie-only authentication for long sessions.
     */
    public function handle_rest_authentication($result)
    {
        // If another plugin has already handled auth, respect that
        if ($result !== null) {
            return $result;
        }

        // Only apply to SVDP REST routes
        $rest_route = $GLOBALS['wp']->query_vars['rest_route'] ?? '';
        if (strpos($rest_route, '/svdp/v1/') !== 0) {
            return $result; // Let WordPress handle other routes normally
        }

        // For SVDP routes, validate the cookie manually
        // This bypasses the nonce check but still requires valid login
        $user_id = wp_validate_auth_cookie('', 'logged_in');

        if ($user_id) {
            // Valid cookie - set the current user
            wp_set_current_user($user_id);
            return true; // Authentication successful
        }

        // No valid cookie - let WordPress continue with normal auth
        // (which will fail, returning 401/403 as expected)
        return $result;
    }

    /**
     * Check if current user has cashier access
     */
    public function user_can_access_cashier()
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('svdp_cashier', $user->roles) ||
            in_array('administrator', $user->roles);
    }

    /**
     * Refresh nonce endpoint (fallback if heartbeat fails)
     */
    public function refresh_nonce($request)
    {
        if (!is_user_logged_in()) {
            return new WP_Error('not_authenticated', 'You must be logged in', ['status' => 401]);
        }

        // Extend auth cookie
        wp_set_auth_cookie(get_current_user_id(), true, is_ssl());

        return [
            'success' => true,
            'nonce' => wp_create_nonce('wp_rest'),
            'timestamp' => current_time('mysql'),
        ];
    }

    /**
     * Enqueue frontend assets
     */
    public function enqueue_frontend_assets()
    {
        // Only on frontend
        if (is_admin()) {
            return;
        }

        // Always enqueue CSS (version bumped to bust cache)
        wp_enqueue_style('svdp-vouchers-public', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/voucher-forms.css', [], SVDP_VOUCHERS_VERSION);

        // Enqueue WordPress Heartbeat API for session management
        wp_enqueue_script('heartbeat');

        // Enqueue both JS files (they only activate on their respective pages)
        wp_enqueue_script('svdp-vouchers-request', SVDP_VOUCHERS_PLUGIN_URL . 'public/js/voucher-request.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);
        wp_enqueue_script('svdp-vouchers-cashier', SVDP_VOUCHERS_PLUGIN_URL . 'public/js/cashier-station.js', ['jquery', 'heartbeat'], '1.1.0', true);

        // Localize scripts
        $item_values = SVDP_Settings::get_item_values();
        $script_data = [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url(),
            'nonce' => wp_create_nonce('wp_rest'),
            'itemValues' => [
                'adult' => floatval($item_values['adult']),
                'child' => floatval($item_values['child'])
            ]
        ];

        wp_localize_script('svdp-vouchers-request', 'svdpVouchers', $script_data);
        wp_localize_script('svdp-vouchers-cashier', 'svdpVouchers', $script_data);
    }
}

// Initialize plugin
new SVDP_Vouchers_Plugin();
