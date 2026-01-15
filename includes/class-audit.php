<?php
/**
 * Audit Class
 *
 * Handles audit event logging for redemptions, overrides, and imports
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class SVDP_Audit
{

    /**
     * Log an override event
     *
     * @param int $voucher_id The voucher ID being overridden
     * @param int $manager_id The manager who approved the override
     * @param int $reason_id The override reason ID
     * @param int $cashier_user_id The cashier requesting the override
     * @param string $override_type Type of override (e.g., 'duplicate_voucher', 'missing_receipt')
     * @param string $notes Optional additional notes
     * @return int|false The audit event ID or false on failure
     */
    public static function log_override($voucher_id, $manager_id, $reason_id, $cashier_user_id, $override_type, $notes = '')
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_audit_events';

        $result = $wpdb->insert($table, [
            'event_type' => 'override',
            'voucher_id' => intval($voucher_id),
            'manager_id' => intval($manager_id),
            'reason_id' => intval($reason_id),
            'cashier_user_id' => intval($cashier_user_id),
            'override_type' => sanitize_text_field($override_type),
            'notes' => sanitize_textarea_field($notes),
            'created_at' => current_time('mysql')
        ]);

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Log a redemption event
     *
     * @param int $voucher_id The voucher ID being redeemed
     * @param int $cashier_user_id The cashier performing redemption
     * @param string $receipt_id The POS receipt ID
     * @return int|false The audit event ID or false on failure
     */
    public static function log_redemption($voucher_id, $cashier_user_id, $receipt_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_audit_events';

        $result = $wpdb->insert($table, [
            'event_type' => 'redemption',
            'voucher_id' => intval($voucher_id),
            'cashier_user_id' => intval($cashier_user_id),
            'receipt_id' => sanitize_text_field($receipt_id),
            'created_at' => current_time('mysql')
        ]);

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Log an import event
     *
     * @param int $import_run_id The import run ID
     * @param string $import_type Type of import (e.g., 'pos_receipts')
     * @param int $rows_processed Number of rows processed
     * @param int $rows_success Number of successful rows
     * @param int $rows_failed Number of failed rows
     * @return int|false The audit event ID or false on failure
     */
    public static function log_import($import_run_id, $import_type, $rows_processed, $rows_success, $rows_failed)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_audit_events';

        $result = $wpdb->insert($table, [
            'event_type' => 'import',
            'import_run_id' => intval($import_run_id),
            'import_type' => sanitize_text_field($import_type),
            'rows_processed' => intval($rows_processed),
            'rows_success' => intval($rows_success),
            'rows_failed' => intval($rows_failed),
            'created_at' => current_time('mysql')
        ]);

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Get audit events for a voucher
     *
     * @param int $voucher_id The voucher ID
     * @return array Array of audit events
     */
    public static function get_voucher_events($voucher_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_audit_events';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table
             WHERE voucher_id = %d
             ORDER BY created_at DESC",
            $voucher_id
        ));
    }

    /**
     * Get all override events with manager and reason details
     *
     * @param int $limit Number of events to return
     * @param int $offset Offset for pagination
     * @return array Array of override events with joined data
     */
    public static function get_override_events($limit = 50, $offset = 0)
    {
        global $wpdb;
        $audit_table = $wpdb->prefix . 'svdp_audit_events';
        $manager_table = $wpdb->prefix . 'svdp_managers';
        $reason_table = $wpdb->prefix . 'svdp_override_reasons';
        $users_table = $wpdb->prefix . 'users';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT 
                a.*,
                m.name as manager_name,
                r.reason_text,
                u.display_name as cashier_name
             FROM $audit_table a
             LEFT JOIN $manager_table m ON a.manager_id = m.id
             LEFT JOIN $reason_table r ON a.reason_id = r.id
             LEFT JOIN $users_table u ON a.cashier_user_id = u.ID
             WHERE a.event_type = 'override'
             ORDER BY a.created_at DESC
             LIMIT %d OFFSET %d",
            $limit,
            $offset
        ));
    }

    /**
     * Get redemption events for a date range
     *
     * @param string $start_date Start date (Y-m-d format)
     * @param string $end_date End date (Y-m-d format)
     * @return array Array of redemption events
     */
    public static function get_redemptions_by_date($start_date, $end_date)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_audit_events';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table
             WHERE event_type = 'redemption'
             AND DATE(created_at) BETWEEN %s AND %s
             ORDER BY created_at DESC",
            $start_date,
            $end_date
        ));
    }
}
