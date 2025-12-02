<?php
/**
 * Admin functionality
 */
class SVDP_Admin {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        
        // AJAX handlers
        add_action('wp_ajax_svdp_add_conference', [$this, 'ajax_add_conference']);
        add_action('wp_ajax_svdp_delete_conference', [$this, 'ajax_delete_conference']);
        add_action('wp_ajax_svdp_update_conference', [$this, 'ajax_update_conference']);
        
        // Export handler
        add_action('admin_post_svdp_export_vouchers', [$this, 'export_vouchers']);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('SVdP Vouchers', 'svdp-vouchers'),
            __('SVdP Vouchers', 'svdp-vouchers'),
            'manage_options',
            'svdp-vouchers',
            [$this, 'render_admin_page'],
            'dashicons-tickets-alt',
            30
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        // Monday.com sync settings
        register_setting('svdp_vouchers_monday', 'svdp_vouchers_monday_sync_enabled');
        register_setting('svdp_vouchers_monday', 'svdp_vouchers_monday_api_key');
        register_setting('svdp_vouchers_monday', 'svdp_vouchers_monday_board_id');
        register_setting('svdp_vouchers_monday', 'svdp_vouchers_monday_column_ids');
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if ($hook !== 'toplevel_page_svdp-vouchers') {
            return;
        }
        
        wp_enqueue_style('svdp-vouchers-admin', SVDP_VOUCHERS_PLUGIN_URL . 'admin/css/admin.css', [], SVDP_VOUCHERS_VERSION);
        wp_enqueue_script('svdp-vouchers-admin', SVDP_VOUCHERS_PLUGIN_URL . 'admin/js/admin.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);
        
        wp_localize_script('svdp-vouchers-admin', 'svdpAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('svdp_admin_nonce'),
        ]);
    }
    
    /**
     * Render admin page
     */
    public function render_admin_page() {
        $active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'conferences';
        include SVDP_VOUCHERS_PLUGIN_DIR . 'admin/views/admin-page.php';
    }
    
    /**
     * AJAX: Add conference
     */
    public function ajax_add_conference() {
        check_ajax_referer('svdp_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }
        
        $name = sanitize_text_field($_POST['name']);
        $slug = sanitize_title($_POST['slug']);
        
        if (empty($name)) {
            wp_send_json_error('Conference name is required');
        }
        
        $id = SVDP_Conference::create($name, $slug);
        
        if ($id) {
            wp_send_json_success([
                'message' => 'Conference added successfully',
                'conference' => SVDP_Conference::get_by_id($id),
            ]);
        } else {
            wp_send_json_error('Failed to add conference');
        }
    }
    
    /**
     * AJAX: Delete conference
     */
    public function ajax_delete_conference() {
        check_ajax_referer('svdp_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }
        
        $id = intval($_POST['id']);
        
        if (SVDP_Conference::delete($id)) {
            wp_send_json_success('Conference deleted successfully');
        } else {
            wp_send_json_error('Failed to delete conference');
        }
    }
    
    /**
     * AJAX: Update conference
     */
    public function ajax_update_conference() {
        check_ajax_referer('svdp_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }
        
        $id = intval($_POST['id']);
        $data = [
            'name' => sanitize_text_field($_POST['name']),
            'slug' => sanitize_title($_POST['slug']),
            'notification_email' => sanitize_email($_POST['notification_email']),
            'monday_label' => sanitize_text_field($_POST['monday_label']),
        ];
        
        if (SVDP_Conference::update($id, $data)) {
            wp_send_json_success('Conference updated successfully');
        } else {
            wp_send_json_error('Failed to update conference');
        }
    }

    /**
     * Export vouchers to CSV
     */
    public function export_vouchers() {
        check_admin_referer('svdp_export', 'svdp_export_nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Permission denied');
        }
        
        global $wpdb;
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';
        
        // Build date filter
        $date_filter = '';
        $date_range = sanitize_text_field($_POST['date_range']);
        
        if ($date_range === 'custom') {
            $start_date = sanitize_text_field($_POST['start_date']);
            $end_date = sanitize_text_field($_POST['end_date']);
            $date_filter = $wpdb->prepare("AND v.voucher_created_date BETWEEN %s AND %s", $start_date, $end_date);
        } elseif ($date_range !== 'all') {
            if ($date_range === 'ytd') {
                $start_date = date('Y-01-01');
            } else {
                $start_date = date('Y-m-d', strtotime('-' . intval($date_range) . ' days'));
            }
            $date_filter = $wpdb->prepare("AND v.voucher_created_date >= %s", $start_date);
        }
        
        // Build status filter
        $status_filter = '';
        if (!isset($_POST['include_denied'])) {
            $status_filter = "AND v.status != 'Denied'";
        }
        
        // Get vouchers
        $vouchers = $wpdb->get_results("
            SELECT 
                v.id,
                v.first_name,
                v.last_name,
                v.dob,
                v.adults,
                v.children,
                (v.adults + v.children) as household_size,
                ((v.adults + v.children) * 20) as voucher_value,
                c.name as conference,
                v.vincentian_name,
                v.vincentian_email,
                v.created_by,
                v.voucher_created_date,
                v.status,
                v.redeemed_date,
                v.coat_status,
                v.coat_issued_date,
                v.override_note,
                v.created_at
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE 1=1 $date_filter $status_filter
            ORDER BY v.voucher_created_date DESC
        ");
        
        // Set headers for CSV download
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=svdp-vouchers-' . date('Y-m-d') . '.csv');
        
        // Create output stream
        $output = fopen('php://output', 'w');
        
        // Add BOM for Excel UTF-8 support
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Add headers
        fputcsv($output, [
            'ID',
            'First Name',
            'Last Name',
            'Date of Birth',
            'Adults',
            'Children',
            'Household Size',
            'Voucher Value',
            'Conference',
            'Vincentian Name',
            'Vincentian Email',
            'Created By',
            'Voucher Date',
            'Status',
            'Redeemed Date',
            'Coat Status',
            'Coat Issued Date',
            'Override Note',
            'Created At'
        ]);
        
        // Add data
        foreach ($vouchers as $voucher) {
            fputcsv($output, [
                $voucher->id,
                $voucher->first_name,
                $voucher->last_name,
                $voucher->dob,
                $voucher->adults,
                $voucher->children,
                $voucher->household_size,
                $voucher->voucher_value,
                $voucher->conference,
                $voucher->vincentian_name,
                $voucher->vincentian_email,
                $voucher->created_by,
                $voucher->voucher_created_date,
                $voucher->status,
                $voucher->redeemed_date,
                $voucher->coat_status,
                $voucher->coat_issued_date,
                $voucher->override_note,
                $voucher->created_at
            ]);
        }
        
        fclose($output);
        exit;
    }
}
