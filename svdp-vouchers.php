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
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-audit.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-import.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-reconciliation.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-rest-errors.php';
require_once SVDP_VOUCHERS_PLUGIN_DIR . 'includes/class-rate-limits.php';

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

        // CSV Import AJAX
        add_action('wp_ajax_svdp_import_csv', [$this, 'handle_csv_import']);

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
            'permission_callback' => [$this, 'check_cashier_access']
        ]);

        // Check for duplicate
        register_rest_route('svdp/v1', '/vouchers/check-duplicate', [
            'methods' => 'POST',
            'callback' => ['SVDP_Voucher', 'check_duplicate'],
            'permission_callback' => [$this, 'check_public_access'] // Frontend form
        ]);

        // Create voucher
        register_rest_route('svdp/v1', '/vouchers/create', [
            'methods' => 'POST',
            'callback' => ['SVDP_Voucher', 'create_voucher'],
            'permission_callback' => [$this, 'check_public_access'] // Frontend form
        ]);

        // Update voucher status
        register_rest_route('svdp/v1', '/vouchers/(?P<id>\d+)/status', [
            'methods' => 'PATCH',
            'callback' => ['SVDP_Voucher', 'update_status'],
            'permission_callback' => [$this, 'check_cashier_access']
        ]);

        // Update coat status
        register_rest_route('svdp/v1', '/vouchers/(?P<id>\d+)/coat', [
            'methods' => 'PATCH',
            'callback' => ['SVDP_Voucher', 'update_coat_status'],
            'permission_callback' => [$this, 'check_cashier_access']
        ]);

        // Get conferences
        register_rest_route('svdp/v1', '/conferences', [
            'methods' => 'GET',
            'callback' => ['SVDP_Conference', 'get_conferences'],
            'permission_callback' => [$this, 'check_public_access']
        ]);

        // Create denied voucher (for tracking)
        register_rest_route('svdp/v1', '/vouchers/create-denied', [
            'methods' => 'POST',
            'callback' => ['SVDP_Voucher', 'create_denied_voucher'],
            'permission_callback' => [$this, 'check_public_access']
        ]);

        // Nonce refresh endpoint (fallback if heartbeat fails)
        register_rest_route('svdp/v1', '/auth/refresh-nonce', [
            'methods' => 'POST',
            'callback' => [$this, 'refresh_nonce'],
            'permission_callback' => function () {
                // Only require logged in - don't check nonce as checking it is the problem
                return is_user_logged_in();
            }
        ]);

        // Manager validation endpoint
        register_rest_route('svdp/v1', '/managers/validate', [
            'methods' => 'POST',
            'callback' => ['SVDP_Manager', 'validate_code_endpoint'],
            'permission_callback' => [$this, 'check_cashier_access'] // Should be cashier only
        ]);

        // Get active override reasons
        register_rest_route('svdp/v1', '/override-reasons', [
            'methods' => 'GET',
            'callback' => ['SVDP_Override_Reason', 'get_active_endpoint'],
            'permission_callback' => [$this, 'check_cashier_access'] // Cashier interface
        ]);
    }

    /**
     * Verify nonce for REST requests
     */
    public function check_nonce($request)
    {
        $nonce = $request->get_header('X-WP-Nonce');
        if (empty($nonce)) {
            $nonce = $request->get_param('_wpnonce');
        }

        if (empty($nonce)) {
            return SVDP_REST_Errors::forbidden('Missing nonce.');
        }

        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            return SVDP_REST_Errors::forbidden('Invalid nonce.');
        }

        return true;
    }

    /**
     * Check public access (Cookie-based auth for SVDP routes)
     *
     * Note: handle_rest_authentication filter validates the cookie
     * and sets current user. We just need to verify a user is logged in.
     * Nonce validation is skipped for SVDP routes to support long sessions.
     */
    public function check_public_access($request)
    {
        $rate_limit = SVDP_Rate_Limits::check_public_rate_limit();
        if (is_wp_error($rate_limit)) {
            return $rate_limit;
        }

        return true;
    }

    /**
     * Check cashier access (Cookie + Capability)
     *
     * Note: Nonces are NOT required for SVDP routes. The
     * handle_rest_authentication filter validates cookies for long sessions.
     */
    public function check_cashier_access($request)
    {
        if (!$this->user_can_access_cashier()) {
            return SVDP_REST_Errors::forbidden('Cashier access required.');
        }

        return true;
    }

    /**
     * Check admin access (Cookie + manage_options)
     */
    public function check_admin_access($request)
    {
        if (!current_user_can('manage_options')) {
            return SVDP_REST_Errors::forbidden('Admin access required.');
        }

        return true;
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

        if ($this->is_public_rest_route($rest_route) && !is_user_logged_in()) {
            unset($_SERVER['HTTP_X_WP_NONCE']);
            if (isset($_REQUEST['_wpnonce'])) {
                unset($_REQUEST['_wpnonce']);
            }
            return null;
        }

        // Non-public SVDP routes should follow WordPress default auth/nonce flow.
        return $result;
    }

    /**
     * Check if REST route is publicly accessible.
     */
    private function is_public_rest_route($rest_route)
    {
        $public_routes = [
            '/svdp/v1/vouchers/check-duplicate',
            '/svdp/v1/vouchers/create',
            '/svdp/v1/vouchers/create-denied',
            '/svdp/v1/conferences',
        ];

        foreach ($public_routes as $public_route) {
            if (strpos($rest_route, $public_route) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if current user has cashier access
     */
    public function user_can_access_cashier()
    {
        if (!is_user_logged_in()) {
            return false;
        }

        if (current_user_can('manage_options')) {
            return true;
        }

        return current_user_can('access_cashier_station');
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

        // Enqueue Design System Tokens (Global)
        wp_enqueue_style('shyft-variables', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/shyft-variables.css', [], SVDP_VOUCHERS_VERSION);
        wp_enqueue_style('svdp-print-receipt', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/svdp-print-receipt.css', [], SVDP_VOUCHERS_VERSION);
        wp_enqueue_script('svdp-print-receipt', SVDP_VOUCHERS_PLUGIN_URL . 'public/js/svdp-print-receipt.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);

        // Always enqueue CSS (version bumped to bust cache)
        wp_enqueue_style('svdp-vouchers-public', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/voucher-forms.css', ['shyft-variables'], SVDP_VOUCHERS_VERSION);

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
    public function handle_csv_import()
    {
        // Permission check
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized access');
        }

        if (!isset($_FILES['import_file'])) {
            wp_send_json_error('No file uploaded');
        }

        $store_id = isset($_POST['store_id']) ? intval($_POST['store_id']) : 0;

        $result = SVDP_Import::process_upload($_FILES['import_file'], $store_id);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success($result);
        }
    }
}

// Initialize plugin
new SVDP_Vouchers_Plugin();
