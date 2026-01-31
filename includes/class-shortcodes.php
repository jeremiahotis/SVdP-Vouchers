<?php
/**
 * Shortcode handlers
 */
class SVDP_Shortcodes {
    
    public function __construct() {
        add_shortcode('svdp_voucher_request', [$this, 'render_voucher_request']);
        add_shortcode('svdp_cashier_station', [$this, 'render_cashier_station']);
    }
    
    /**
     * Render voucher request form
     * Usage: [svdp_voucher_request conference="st-mary-fort-wayne"]
     */
    public function render_voucher_request($atts) {
        $atts = shortcode_atts([
            'conference' => '',
        ], $atts);
        
        // Get conference
        if (!empty($atts['conference'])) {
            $conference = SVDP_Conference::get_by_slug($atts['conference']);
            if (!$conference) {
                return '<p>Error: Conference not found.</p>';
            }
        }
        
        // Get all conferences for dropdown
        $conferences = SVDP_Conference::get_all(true);
        
        ob_start();
        include SVDP_VOUCHERS_PLUGIN_DIR . 'public/templates/voucher-request-form.php';
        return ob_get_clean();
    }
    
    /**
     * Render cashier station
     * Usage: [svdp_cashier_station]
     * Optional: [svdp_cashier_station read_only="1"]
     */
    public function render_cashier_station($atts) {
        $atts = shortcode_atts([
            'read_only' => 0,
        ], $atts);

        // Check if user is logged in and has cashier role
        if (!is_user_logged_in()) {
            return '<p>You must be logged in to access the cashier station.</p>';
        }

        $can_view = current_user_can('manage_options')
            || current_user_can('access_cashier_station')
            || current_user_can('access_cashier_station_view');
        if (!$can_view) {
            return '<p>You do not have permission to access the cashier station.</p>';
        }

        $read_only = filter_var($atts['read_only'], FILTER_VALIDATE_BOOLEAN);
        $can_edit = current_user_can('manage_options') || current_user_can('access_cashier_station');
        if (!$can_edit) {
            $read_only = true;
        }
        
        ob_start();
        include SVDP_VOUCHERS_PLUGIN_DIR . 'public/templates/cashier-station.php';
        return ob_get_clean();
    }
}
