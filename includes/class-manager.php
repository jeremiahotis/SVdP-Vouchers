<?php
/**
 * Manager Class
 *
 * Handles CRUD operations for managers who can approve emergency voucher overrides
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class SVDP_Manager {

    /**
     * Create a new manager with auto-generated code
     */
    public static function create($name) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';

        // Generate 6-digit code
        $code = self::generate_code();
        $code_hash = wp_hash_password($code);

        $result = $wpdb->insert($table, [
            'name' => sanitize_text_field($name),
            'code_hash' => $code_hash,
            'active' => 1,
            'created_date' => current_time('mysql')
        ]);

        if ($result) {
            return [
                'success' => true,
                'id' => $wpdb->insert_id,
                'code' => $code, // Only returned once!
                'name' => $name
            ];
        }

        return ['success' => false];
    }

    /**
     * Generate a random 6-digit PIN
     */
    private static function generate_code() {
        return str_pad(wp_rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Validate a manager code
     *
     * @param string $code The code to validate
     * @return array Result with 'valid', 'id', and 'name' keys
     */
    public static function validate_code($code) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';

        // Get all active managers
        $managers = $wpdb->get_results(
            "SELECT id, name, code_hash FROM $table WHERE active = 1"
        );

        // Check each manager's code hash
        foreach ($managers as $manager) {
            if (wp_check_password($code, $manager->code_hash)) {
                return [
                    'valid' => true,
                    'id' => $manager->id,
                    'name' => $manager->name
                ];
            }
        }

        return ['valid' => false];
    }

    /**
     * Get all managers
     */
    public static function get_all() {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';

        return $wpdb->get_results(
            "SELECT id, name, active, created_date
             FROM $table
             ORDER BY created_date DESC"
        );
    }

    /**
     * Update manager name
     */
    public static function update($id, $name) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';

        return $wpdb->update(
            $table,
            ['name' => sanitize_text_field($name)],
            ['id' => intval($id)]
        );
    }

    /**
     * Deactivate a manager (soft delete)
     */
    public static function deactivate($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';

        return $wpdb->update(
            $table,
            ['active' => 0],
            ['id' => intval($id)]
        );
    }

    /**
     * Reactivate a deactivated manager
     */
    public static function reactivate($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';

        return $wpdb->update(
            $table,
            ['active' => 1],
            ['id' => intval($id)]
        );
    }

    /**
     * Regenerate code for a manager
     *
     * @return array Result with 'success' and 'code' keys
     */
    public static function regenerate_code($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_managers';

        $code = self::generate_code();
        $code_hash = wp_hash_password($code);

        $result = $wpdb->update(
            $table,
            ['code_hash' => $code_hash],
            ['id' => intval($id)]
        );

        if ($result !== false) {
            return ['success' => true, 'code' => $code];
        }

        return ['success' => false];
    }

    /**
     * REST API endpoint wrapper for validate_code
     */
    public static function validate_code_endpoint($request) {
        $code = $request->get_param('code');

        if (empty($code)) {
            return new WP_Error('missing_code', 'Manager code is required', ['status' => 400]);
        }

        return self::validate_code($code);
    }
}
