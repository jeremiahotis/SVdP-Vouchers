<?php
/**
 * Admin functionality
 */
class SVDP_Admin
{

    public function __construct()
    {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        // AJAX handlers
        add_action('wp_ajax_svdp_add_conference', [$this, 'ajax_add_conference']);
        add_action('wp_ajax_svdp_delete_conference', [$this, 'ajax_delete_conference']);
        add_action('wp_ajax_svdp_update_conference', [$this, 'ajax_update_conference']);
        add_action('wp_ajax_svdp_save_settings', [$this, 'ajax_save_settings']);
        add_action('wp_ajax_svdp_update_voucher_types', [$this, 'ajax_update_voucher_types']);
        add_action('wp_ajax_svdp_get_custom_text', [$this, 'ajax_get_custom_text']);
        add_action('wp_ajax_svdp_save_custom_text', [$this, 'ajax_save_custom_text']);
        add_action('wp_ajax_svdp_apply_analytics_filters', [$this, 'ajax_apply_analytics_filters']);

        // Manager AJAX
        add_action('wp_ajax_svdp_add_manager', [$this, 'ajax_add_manager']);
        add_action('wp_ajax_svdp_get_managers', [$this, 'ajax_get_managers']);
        add_action('wp_ajax_svdp_deactivate_manager', [$this, 'ajax_deactivate_manager']);
        add_action('wp_ajax_svdp_regenerate_code', [$this, 'ajax_regenerate_code']);

        // Reason AJAX
        add_action('wp_ajax_svdp_add_reason', [$this, 'ajax_add_reason']);
        add_action('wp_ajax_svdp_get_override_reasons', [$this, 'handle_get_override_reasons']);
        add_action('wp_ajax_svdp_save_override_reasons', [$this, 'handle_save_override_reasons']);
        add_action('wp_ajax_svdp_update_reason', [$this, 'ajax_update_reason']);
        add_action('wp_ajax_svdp_delete_reason', [$this, 'ajax_delete_reason']);
        add_action('wp_ajax_svdp_import_csv', 'handle_csv_import'); // Global function in main file
        add_action('wp_ajax_svdp_get_reconciliation_detail', [$this, 'handle_get_reconciliation_detail']);
        add_action('wp_ajax_svdp_get_unmatched_receipts', [$this, 'handle_get_unmatched_receipts']);
        add_action('wp_ajax_svdp_get_report_data', [$this, 'handle_get_report_data']);

        // Export handler
        add_action('admin_post_svdp_export_vouchers', [$this, 'export_vouchers']);
        add_action('admin_post_svdp_export_unmatched', [$this, 'export_unmatched_receipts']);
        add_action('admin_post_svdp_export_report', [$this, 'export_report_csv']);

        // Catalog AJAX
        add_action('wp_ajax_svdp_add_catalog_item', [$this, 'ajax_add_catalog_item']);
        add_action('wp_ajax_svdp_update_catalog_item', [$this, 'ajax_update_catalog_item']);
        add_action('wp_ajax_svdp_delete_catalog_item', [$this, 'ajax_delete_catalog_item']);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu()
    {
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
    public function register_settings()
    {
        // Settings are now managed via SVDP_Settings class and database table
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook)
    {
        if ($hook !== 'toplevel_page_svdp-vouchers') {
            return;
        }

        // Enqueue Design System Tokens (Global)
        wp_enqueue_style('shyft-variables', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/shyft-variables.css', [], SVDP_VOUCHERS_VERSION);

        // Print Receipt Assets
        wp_enqueue_style('svdp-print-receipt', SVDP_VOUCHERS_PLUGIN_URL . 'public/css/svdp-print-receipt.css', [], SVDP_VOUCHERS_VERSION);
        wp_enqueue_script('svdp-print-receipt', SVDP_VOUCHERS_PLUGIN_URL . 'public/js/svdp-print-receipt.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);

        wp_enqueue_style('svdp-vouchers-admin', SVDP_VOUCHERS_PLUGIN_URL . 'admin/css/admin.css', ['shyft-variables'], SVDP_VOUCHERS_VERSION);
        wp_enqueue_script('svdp-vouchers-admin', SVDP_VOUCHERS_PLUGIN_URL . 'admin/js/admin.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);
        wp_enqueue_script('svdp-managers', SVDP_VOUCHERS_PLUGIN_URL . 'admin/js/managers.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);
        wp_enqueue_script('svdp-override-reasons', SVDP_VOUCHERS_PLUGIN_URL . 'admin/js/override-reasons.js', ['jquery', 'jquery-ui-sortable'], SVDP_VOUCHERS_VERSION, true);
        wp_enqueue_script('svdp-imports', SVDP_VOUCHERS_PLUGIN_URL . 'admin/js/imports.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);
        wp_enqueue_script('svdp-reconciliation', SVDP_VOUCHERS_PLUGIN_URL . 'admin/js/reconciliation.js', ['jquery'], SVDP_VOUCHERS_VERSION, true);

        wp_localize_script('svdp-vouchers-admin', 'svdpAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('svdp_admin_nonce'),
        ]);
    }

    /**
     * Render admin page
     */
    public function render_admin_page()
    {
        $active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'conferences';
        include SVDP_VOUCHERS_PLUGIN_DIR . 'admin/views/admin-page.php';
    }

    /**
     * AJAX: Add conference
     */
    public function ajax_add_conference()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $name = sanitize_text_field($_POST['name']);
        $slug = sanitize_title($_POST['slug']);
        $org_type = sanitize_text_field($_POST['organization_type'] ?? 'conference');
        $eligibility_days = intval($_POST['eligibility_days'] ?? 90);
        $regular_items = intval($_POST['regular_items'] ?? 7);
        $woodshop_paused = intval($_POST['woodshop_paused'] ?? 0);
        $enable_printable_voucher = intval($_POST['enable_printable_voucher'] ?? 0);

        if (empty($name)) {
            wp_send_json_error('Organization name is required');
        }

        $id = SVDP_Conference::create($name, $slug, 0, $org_type, $eligibility_days, $regular_items, $woodshop_paused, $enable_printable_voucher);

        if ($id) {
            wp_send_json_success([
                'message' => 'Organization added successfully',
                'conference' => SVDP_Conference::get_by_id($id),
            ]);
        } else {
            wp_send_json_error('Failed to add conference');
        }
    }

    /**
     * AJAX: Delete conference
     */
    public function ajax_delete_conference()
    {
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
    public function ajax_update_conference()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        $data = [
            'name' => sanitize_text_field($_POST['name']),
            'slug' => sanitize_title($_POST['slug']),
            'notification_email' => sanitize_email($_POST['notification_email']),
            'eligibility_days' => intval($_POST['eligibility_days']),
            'items_per_person' => intval($_POST['items_per_person']),
            'active' => isset($_POST['active']) ? intval($_POST['active']) : 1,
            'woodshop_paused' => isset($_POST['woodshop_paused']) ? intval($_POST['woodshop_paused']) : 0,
            'enable_printable_voucher' => isset($_POST['enable_printable_voucher']) ? intval($_POST['enable_printable_voucher']) : 0,
        ];

        $result = SVDP_Conference::update($id, $data);
        if ($result !== false) {
            wp_send_json_success('Conference updated successfully');
        } else {
            wp_send_json_error('Failed to update conference');
        }
    }

    /**
     * Save plugin settings
     */
    public function ajax_save_settings()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        // Sanitize and save each setting
        $settings = [
            'adult_item_value' => ['value' => sanitize_text_field($_POST['adult_item_value']), 'type' => 'decimal'],
            'child_item_value' => ['value' => sanitize_text_field($_POST['child_item_value']), 'type' => 'decimal'],
            'store_hours' => ['value' => sanitize_text_field($_POST['store_hours']), 'type' => 'text'],
            'redemption_instructions' => ['value' => sanitize_textarea_field($_POST['redemption_instructions']), 'type' => 'textarea'],
            'available_voucher_types' => ['value' => sanitize_text_field($_POST['available_voucher_types']), 'type' => 'text'],
        ];

        $success = true;
        foreach ($settings as $key => $setting) {
            if (!SVDP_Settings::update_setting($key, $setting['value'], $setting['type'])) {
                $success = false;
                break;
            }
        }

        if ($success) {
            wp_send_json_success('Settings saved successfully');
        } else {
            wp_send_json_error('Failed to save settings');
        }
    }

    /**
     * AJAX: Update organization voucher types
     */
    public function ajax_update_voucher_types()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        $voucher_types_raw = wp_unslash($_POST['voucher_types'] ?? '[]');
        $decoded = json_decode($voucher_types_raw, true);
        if (!is_array($decoded)) {
            wp_send_json_error('Invalid voucher types payload');
        }

        $sanitized = [];
        foreach ($decoded as $type) {
            $type = sanitize_key($type);
            if (!empty($type)) {
                $sanitized[] = $type;
            }
        }
        $voucher_types = wp_json_encode(array_values($sanitized));

        $result = SVDP_Conference::update($id, ['allowed_voucher_types' => $voucher_types]);
        if ($result !== false) {
            wp_send_json_success('Voucher types updated successfully');
        } else {
            wp_send_json_error('Failed to update voucher types');
        }
    }

    /**
     * AJAX: Get organization custom text
     */
    public function ajax_get_custom_text()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        $conference = SVDP_Conference::get_by_id($id);

        if ($conference) {
            wp_send_json_success([
                'custom_form_text' => $conference->custom_form_text ?? '',
                'custom_rules_text' => $conference->custom_rules_text ?? ''
            ]);
        } else {
            wp_send_json_error('Organization not found');
        }
    }

    /**
     * AJAX: Save organization custom text
     */
    public function ajax_save_custom_text()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        $data = [
            'custom_form_text' => sanitize_textarea_field($_POST['custom_form_text']),
            'custom_rules_text' => sanitize_textarea_field($_POST['custom_rules_text'])
        ];

        if (SVDP_Conference::update($id, $data)) {
            wp_send_json_success('Custom text saved successfully');
        } else {
            wp_send_json_error('Failed to save custom text');
        }
    }

    /**
     * AJAX: Apply analytics filters and return filtered data
     */
    public function ajax_apply_analytics_filters()
    {
        check_ajax_referer('svdp_analytics_filters', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $filters = $_POST['filters'];

        global $wpdb;
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';

        // Build WHERE clauses based on filters
        $where_clauses = ["v.status != 'Denied'"];

        // Date range filter
        if ($filters['date_range'] !== 'all') {
            if ($filters['date_range'] === 'custom') {
                $start_date = sanitize_text_field($filters['start_date']);
                $end_date = sanitize_text_field($filters['end_date']);
                $where_clauses[] = $wpdb->prepare("v.voucher_created_date BETWEEN %s AND %s", $start_date, $end_date);
            } else {
                $days = intval($filters['date_range']);
                if ($filters['date_range'] === 'ytd') {
                    $year_start = date('Y-01-01');
                    $where_clauses[] = $wpdb->prepare("v.voucher_created_date >= %s", $year_start);
                } else {
                    $cutoff_date = date('Y-m-d', strtotime("-{$days} days"));
                    $where_clauses[] = $wpdb->prepare("v.voucher_created_date >= %s", $cutoff_date);
                }
            }
        }

        // Organization type filter
        if ($filters['org_type'] !== 'all') {
            $org_type = sanitize_text_field($filters['org_type']);
            $where_clauses[] = $wpdb->prepare("c.organization_type = %s", $org_type);
        }

        // Specific organization filter
        if ($filters['org_id'] !== 'all') {
            $org_id = intval($filters['org_id']);
            $where_clauses[] = $wpdb->prepare("v.conference_id = %d", $org_id);
        }

        // Voucher type filter
        if ($filters['voucher_type'] !== 'all') {
            $voucher_type = sanitize_text_field($filters['voucher_type']);
            $where_clauses[] = $wpdb->prepare("v.voucher_type = %s", $voucher_type);
        }

        $where_sql = implode(' AND ', $where_clauses);

        // Get filtered stats
        $stats = [
            'total_vouchers' => 0,
            'redeemed_vouchers' => 0,
            'items_redeemed' => 0,
            'redemption_value' => 0,
            'organizations' => []
        ];

        // Overall totals
        $totals = $wpdb->get_row("
            SELECT COUNT(*) as total_vouchers,
                   SUM(CASE WHEN v.status = 'Redeemed' THEN 1 ELSE 0 END) as redeemed_vouchers,
                   SUM(CASE WHEN v.status = 'Redeemed' THEN COALESCE(v.items_adult_redeemed, 0) + COALESCE(v.items_children_redeemed, 0) ELSE 0 END) as items_redeemed,
                   SUM(CASE WHEN v.status = 'Redeemed' THEN COALESCE(v.redemption_total_value, 0) ELSE 0 END) as redemption_value
            FROM {$vouchers_table} v
            LEFT JOIN {$conferences_table} c ON v.conference_id = c.id
            WHERE {$where_sql}
        ");

        $stats['total_vouchers'] = intval($totals->total_vouchers);
        $stats['redeemed_vouchers'] = intval($totals->redeemed_vouchers);
        $stats['items_redeemed'] = intval($totals->items_redeemed);
        $stats['redemption_value'] = floatval($totals->redemption_value);

        // Per-organization stats
        $org_stats = $wpdb->get_results("
            SELECT c.name,
                   c.organization_type,
                   COUNT(v.id) as vouchers_issued,
                   SUM(CASE WHEN v.status = 'Redeemed' THEN 1 ELSE 0 END) as vouchers_redeemed,
                   SUM(CASE WHEN v.status = 'Redeemed' THEN COALESCE(v.items_adult_redeemed, 0) + COALESCE(v.items_children_redeemed, 0) ELSE 0 END) as items_redeemed,
                   SUM(CASE WHEN v.status = 'Redeemed' THEN COALESCE(v.redemption_total_value, 0) ELSE 0 END) as redemption_value
            FROM {$conferences_table} c
            LEFT JOIN {$vouchers_table} v ON c.id = v.conference_id AND {$where_sql}
            WHERE c.active = 1
            GROUP BY c.id, c.name, c.organization_type
            HAVING vouchers_issued > 0
            ORDER BY vouchers_issued DESC
        ");

        $stats['organizations'] = $org_stats;

        wp_send_json_success($stats);
    }

    /**
     * Export vouchers to CSV
     */
    public function export_vouchers()
    {
        check_admin_referer('svdp_export', 'svdp_export_nonce');

        if (!current_user_can('manage_options')) {
            wp_die('Permission denied');
        }

        global $wpdb;
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';

        // Build filters from analytics filters (if set) or legacy date range
        $where_clauses = ['1=1'];

        // Check if analytics filters are set
        $filter_date_range = isset($_POST['filter_date_range']) ? sanitize_text_field($_POST['filter_date_range']) : sanitize_text_field($_POST['date_range']);

        // Date filter
        if ($filter_date_range === 'custom') {
            $start_date = isset($_POST['filter_start_date']) ? sanitize_text_field($_POST['filter_start_date']) : sanitize_text_field($_POST['start_date']);
            $end_date = isset($_POST['filter_end_date']) ? sanitize_text_field($_POST['filter_end_date']) : sanitize_text_field($_POST['end_date']);
            $where_clauses[] = $wpdb->prepare("v.voucher_created_date BETWEEN %s AND %s", $start_date, $end_date);
        } elseif ($filter_date_range !== 'all') {
            if ($filter_date_range === 'ytd') {
                $start_date = date('Y-01-01');
            } else {
                $start_date = date('Y-m-d', strtotime('-' . intval($filter_date_range) . ' days'));
            }
            $where_clauses[] = $wpdb->prepare("v.voucher_created_date >= %s", $start_date);
        }

        // Organization type filter
        if (isset($_POST['filter_org_type']) && $_POST['filter_org_type'] !== 'all') {
            $org_type = sanitize_text_field($_POST['filter_org_type']);
            $where_clauses[] = $wpdb->prepare("c.organization_type = %s", $org_type);
        }

        // Specific organization filter
        if (isset($_POST['filter_org_id']) && $_POST['filter_org_id'] !== 'all') {
            $org_id = intval($_POST['filter_org_id']);
            $where_clauses[] = $wpdb->prepare("v.conference_id = %d", $org_id);
        }

        // Voucher type filter
        if (isset($_POST['filter_voucher_type']) && $_POST['filter_voucher_type'] !== 'all') {
            $voucher_type = sanitize_text_field($_POST['filter_voucher_type']);
            $where_clauses[] = $wpdb->prepare("v.voucher_type = %s", $voucher_type);
        }

        // Status filter (include denied checkbox)
        if (!isset($_POST['include_denied'])) {
            $where_clauses[] = "v.status != 'Denied'";
        }

        $where_sql = implode(' AND ', $where_clauses);

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
                v.voucher_value,
                c.name as conference,
                c.organization_type,
                COALESCE(v.voucher_type, 'clothing') as voucher_type,
                v.vincentian_name,
                v.vincentian_email,
                v.created_by,
                v.voucher_created_date,
                v.status,
                v.redeemed_date,
                COALESCE(v.items_adult_redeemed, 0) as items_adult_redeemed,
                COALESCE(v.items_children_redeemed, 0) as items_children_redeemed,
                (COALESCE(v.items_adult_redeemed, 0) + COALESCE(v.items_children_redeemed, 0)) as total_items_redeemed,
                COALESCE(v.redemption_total_value, 0) as redemption_total_value,
                v.coat_status,
                v.coat_issued_date,
                v.override_note,
                m.name as manager_name,
                r.reason_text as override_reason,
                v.created_at
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            LEFT JOIN {$wpdb->prefix}svdp_managers m ON v.manager_id = m.id
            LEFT JOIN {$wpdb->prefix}svdp_override_reasons r ON v.reason_id = r.id
            WHERE {$where_sql}
            ORDER BY v.voucher_created_date DESC
        ");

        // Set headers for CSV download
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=svdp-vouchers-' . date('Y-m-d') . '.csv');

        // Create output stream
        $output = fopen('php://output', 'w');

        // Add BOM for Excel UTF-8 support
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

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
            'Conference/Partner',
            'Organization Type',
            'Voucher Type',
            'Vincentian Name',
            'Vincentian Email',
            'Created By',
            'Voucher Date',
            'Status',
            'Redeemed Date',
            'Items Adult Redeemed',
            'Items Children Redeemed',
            'Total Items Redeemed',
            'Redemption Value',
            'Coat Status',
            'Coat Issued Date',
            'Override Note',
            'Override Manager',
            'Override Reason',
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
                ucfirst($voucher->organization_type),
                ucfirst($voucher->voucher_type),
                $voucher->vincentian_name,
                $voucher->vincentian_email,
                $voucher->created_by,
                $voucher->voucher_created_date,
                $voucher->status,
                $voucher->redeemed_date,
                $voucher->items_adult_redeemed,
                $voucher->items_children_redeemed,
                $voucher->total_items_redeemed,
                number_format($voucher->redemption_total_value, 2),
                $voucher->coat_status,
                $voucher->coat_issued_date,
                $voucher->override_note,
                $voucher->manager_name,
                $voucher->override_reason,
                $voucher->created_at
            ]);
        }

        fclose($output);
        exit;
    }

    /**
     * AJAX: Add manager
     */
    public function ajax_add_manager()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $name = sanitize_text_field($_POST['name']);

        if (empty($name)) {
            wp_send_json_error('Manager name is required');
        }

        $result = SVDP_Manager::create($name);

        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error('Failed to create manager');
        }
    }

    /**
     * AJAX: Get all managers
     */
    public function ajax_get_managers()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $managers = SVDP_Manager::get_all();
        wp_send_json_success($managers);
    }

    /**
     * AJAX: Deactivate manager
     */
    public function ajax_deactivate_manager()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        $result = SVDP_Manager::deactivate($id);

        if ($result !== false) {
            wp_send_json_success('Manager deactivated');
        } else {
            wp_send_json_error('Failed to deactivate manager');
        }
    }

    /**
     * AJAX: Regenerate manager code
     */
    public function ajax_regenerate_code()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        $result = SVDP_Manager::regenerate_code($id);

        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error('Failed to regenerate code');
        }
    }

    /**
     * AJAX: Add override reason
     */
    public function ajax_add_reason()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $reason_text = sanitize_text_field($_POST['reason_text']);

        if (empty($reason_text)) {
            wp_send_json_error('Reason text is required');
        }

        $id = SVDP_Override_Reason::create($reason_text);

        if ($id) {
            wp_send_json_success('Reason added successfully');
        } else {
            wp_send_json_error('Failed to add reason');
        }
    }

    /**
     * AJAX: Get all override reasons
     */
    public function handle_get_override_reasons()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $reasons = SVDP_Override_Reason::get_all();
        wp_send_json_success($reasons);
    }

    /**
     * AJAX: Save override reasons (including reordering)
     */
    public function handle_save_override_reasons()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $reasons = isset($_POST['reasons']) ? $_POST['reasons'] : [];
        if (!is_array($reasons)) {
            wp_send_json_error(['message' => 'Invalid data format']);
        }

        // Fix: Use reorder method instead of non-existent update_order
        $result = SVDP_Override_Reason::reorder($reasons);

        if (is_wp_error($result)) {
            wp_send_json_error(['message' => $result->get_error_message()]);
        }

        wp_send_json_success(['message' => 'Reasons updated successfully']);
    }

    /**
     * AJAX: Update override reason text
     */
    public function ajax_update_reason()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $text = isset($_POST['reason_text']) ? sanitize_text_field($_POST['reason_text']) : '';

        if (!$id || !$text) {
            wp_send_json_error('Missing required fields');
        }

        $result = SVDP_Override_Reason::update($id, $text);

        if ($result === false) {
            wp_send_json_error('Failed to update reason');
        }

        wp_send_json_success(['message' => 'Reason updated']);
    }

    /**
     * AJAX: Delete override reason
     */
    public function ajax_delete_reason()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;

        if (!$id) {
            wp_send_json_error('Invalid ID');
        }

        $result = SVDP_Override_Reason::delete($id);

        if ($result === false) {
            wp_send_json_error('Failed to delete reason');
        }

        wp_send_json_success(['message' => 'Reason deleted']);
    }

    /**
     * AJAX: Get Reconciliation Detail
     */
    public function handle_get_reconciliation_detail()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        $voucher_id = isset($_POST['voucher_id']) ? intval($_POST['voucher_id']) : 0;
        if (!$voucher_id) {
            wp_send_json_error(['message' => 'Missing Voucher ID']);
        }

        $data = SVDP_Reconciliation::get_comparison($voucher_id);

        if (is_wp_error($data)) {
            wp_send_json_error(['message' => $data->get_error_message()]);
        }

        wp_send_json_success($data);
    }

    /**
     * AJAX: Get Unmatched Receipts
     */
    public function handle_get_unmatched_receipts()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        $args = [
            'store_id' => isset($_POST['store_id']) ? intval($_POST['store_id']) : '',
            'date_start' => isset($_POST['date_start']) ? sanitize_text_field($_POST['date_start']) : '',
            'date_end' => isset($_POST['date_end']) ? sanitize_text_field($_POST['date_end']) : '',
            'search' => isset($_POST['search']) ? sanitize_text_field($_POST['search']) : '',
            'limit' => 50 // Fixed limit for now
        ];

        $data = SVDP_Reconciliation::get_unmatched_receipts($args);

        wp_send_json_success($data); // get_unmatched_receipts returns array, safe for direct pass
    }

    /**
     * AJAX: Get Report Data
     */
    public function handle_get_report_data()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        $args = [
            'conference_id' => isset($_POST['conference_id']) ? intval($_POST['conference_id']) : '',
            'date_start' => isset($_POST['date_start']) ? sanitize_text_field($_POST['date_start']) : '',
            'date_end' => isset($_POST['date_end']) ? sanitize_text_field($_POST['date_end']) : ''
        ];

        $data = SVDP_Reconciliation::get_report_data($args);

        wp_send_json_success($data);
    }

    /**
     * Export Report CSV
     */
    public function export_report_csv()
    {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="svdp-report-' . date('Y-m-d') . '.csv"');

        $output = fopen('php://output', 'w');

        // Fetch Data
        $args = [
            'conference_id' => isset($_POST['conference_id']) ? intval($_POST['conference_id']) : '',
            'date_start' => isset($_POST['date_start']) ? sanitize_text_field($_POST['date_start']) : '',
            'date_end' => isset($_POST['date_end']) ? sanitize_text_field($_POST['date_end']) : ''
        ];

        // Check for args in GET if POST is empty (direct link usually GET, but filtered export might be POST from form?)
        // Standard admin-post usually POST.
        if (empty($args['date_start']) && isset($_GET['date_start'])) {
            $args['date_start'] = sanitize_text_field($_GET['date_start']);
            $args['date_end'] = sanitize_text_field($_GET['date_end']);
            $args['conference_id'] = isset($_GET['conference_id']) ? intval($_GET['conference_id']) : '';
        }

        $data = SVDP_Reconciliation::get_report_data($args);

        // Header
        fputcsv($output, [
            'Report Key',
            'Total Issued',
            'Total Redeemed',
            'Authorized Amount',
            'Conference Share',
            'Store Share'
        ]);

        foreach ($data['breakdown'] as $row) {
            fputcsv($output, [
                $row->report_key,
                $row->total_issued,
                $row->total_redeemed,
                number_format($row->total_authorized_amount, 2),
                number_format($row->total_conference_share, 2),
                number_format($row->total_store_share, 2)
            ]);
        }

        // Summary Row
        fputcsv($output, []);
        fputcsv($output, [
            'TOTALS',
            $data['totals']['issued'],
            $data['totals']['redeemed'],
            number_format($data['totals']['authorized'], 2),
            number_format($data['totals']['conference_liability'], 2),
            number_format($data['totals']['store_liability'], 2)
        ]);

        fclose($output);
        exit;
    }

    /**
     * Export Unmatched Receipts
     */
    public function export_unmatched_receipts()
    {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="svdp-unmatched-receipts-' . date('Y-m-d') . '.csv"');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['Receipt ID', 'Store ID', 'Date', 'Gross Total', 'Line Items Count']);

        // Fetch all unmatched (no limit)
        $args = [
            'limit' => 999999
        ];
        $data = SVDP_Reconciliation::get_unmatched_receipts($args);

        foreach ($data['items'] as $item) {
            fputcsv($output, [
                $item->receipt_id,
                $item->store_id,
                $item->receipt_datetime,
                $item->gross_total,
                '-' // Placeholder for item count if needed
            ]);
        }

        fclose($output);
        exit;
    }

    /**
     * AJAX: Add catalog item
     */
    public function ajax_add_catalog_item()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $voucher_type = sanitize_text_field($_POST['voucher_type']);
        $category = sanitize_text_field($_POST['category']);
        $name = sanitize_text_field($_POST['name']);
        $min_price = floatval($_POST['min_price']);
        $max_price = floatval($_POST['max_price']);
        $is_woodshop = intval($_POST['is_woodshop'] ?? 0);
        $availability = sanitize_key($_POST['availability_status'] ?? 'available');
        $sort_order = intval($_POST['sort_order'] ?? 0);

        if (empty($name) || empty($voucher_type) || empty($category)) {
            wp_send_json_error('Required fields missing');
        }

        global $wpdb;
        $table = $wpdb->prefix . 'svdp_catalog_items';

        $result = $wpdb->insert($table, [
            'voucher_type' => $voucher_type,
            'category' => $category,
            'name' => $name,
            'min_price' => $min_price,
            'max_price' => $max_price,
            'is_woodshop' => $is_woodshop,
            'availability_status' => $availability,
            'sort_order' => $sort_order,
            'active' => 1
        ]);

        if ($result) {
            wp_send_json_success('Item added successfully');
        } else {
            wp_send_json_error('Failed to add item');
        }
    }

    /**
     * AJAX: Update catalog item
     */
    public function ajax_update_catalog_item()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        $data = [
            'name' => sanitize_text_field($_POST['name']),
            'category' => sanitize_text_field($_POST['category']),
            'min_price' => floatval($_POST['min_price']),
            'max_price' => floatval($_POST['max_price']),
            'is_woodshop' => intval($_POST['is_woodshop']),
            'availability_status' => sanitize_key($_POST['availability_status']),
            'sort_order' => intval($_POST['sort_order']),
            'active' => intval($_POST['active'])
        ];

        global $wpdb;
        $table = $wpdb->prefix . 'svdp_catalog_items';

        $result = $wpdb->update($table, $data, ['id' => $id]);

        if ($result !== false) {
            wp_send_json_success('Item updated');
        } else {
            wp_send_json_error('Failed to update item');
        }
    }

    /**
     * AJAX: Delete catalog item
     */
    public function ajax_delete_catalog_item()
    {
        check_ajax_referer('svdp_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $id = intval($_POST['id']);
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_catalog_items';

        $result = $wpdb->delete($table, ['id' => $id]);

        if ($result) {
            wp_send_json_success('Item deleted');
        } else {
            wp_send_json_error('Failed to delete item');
        }
    }
}
