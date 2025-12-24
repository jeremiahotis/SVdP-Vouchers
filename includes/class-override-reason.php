<?php
/**
 * Override Reason Class
 *
 * Handles CRUD operations for override reasons dropdown
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class SVDP_Override_Reason {

    /**
     * Create a new override reason
     */
    public static function create($reason_text) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        // Get max display_order
        $max_order = $wpdb->get_var("SELECT MAX(display_order) FROM $table");

        $result = $wpdb->insert($table, [
            'reason_text' => sanitize_text_field($reason_text),
            'display_order' => intval($max_order) + 1,
            'active' => 1
        ]);

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Get all override reasons (active and inactive)
     */
    public static function get_all() {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        return $wpdb->get_results(
            "SELECT * FROM $table ORDER BY display_order ASC"
        );
    }

    /**
     * Get only active override reasons
     */
    public static function get_active() {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        return $wpdb->get_results(
            "SELECT id, reason_text FROM $table
             WHERE active = 1
             ORDER BY display_order ASC"
        );
    }

    /**
     * Update reason text
     */
    public static function update($id, $reason_text) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        return $wpdb->update(
            $table,
            ['reason_text' => sanitize_text_field($reason_text)],
            ['id' => intval($id)]
        );
    }

    /**
     * Toggle active status
     */
    public static function toggle_active($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        $current = $wpdb->get_var($wpdb->prepare(
            "SELECT active FROM $table WHERE id = %d", $id
        ));

        $new_status = $current ? 0 : 1;

        return $wpdb->update(
            $table,
            ['active' => $new_status],
            ['id' => intval($id)]
        );
    }

    /**
     * Delete a reason (hard delete)
     */
    public static function delete($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        return $wpdb->delete($table, ['id' => intval($id)]);
    }

    /**
     * Reorder reasons based on array of IDs
     *
     * @param array $order_array Array of IDs in new order
     */
    public static function reorder($order_array) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_override_reasons';

        foreach ($order_array as $index => $id) {
            $wpdb->update(
                $table,
                ['display_order' => $index],
                ['id' => intval($id)]
            );
        }

        return true;
    }

    /**
     * REST API endpoint wrapper for get_active
     */
    public static function get_active_endpoint() {
        return self::get_active();
    }
}
