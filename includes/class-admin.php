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
            'monday_label' => sanitize_text_field($_POST['monday_label']),
        ];
        
        if (SVDP_Conference::update($id, $data)) {
            wp_send_json_success('Conference updated successfully');
        } else {
            wp_send_json_error('Failed to update conference');
        }
    }
}