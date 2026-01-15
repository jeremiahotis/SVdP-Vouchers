<?php
/**
 * Reconciliation Handler
 * Handles linking Vouchers to POS Receipts
 */

class SVDP_Reconciliation
{
    /**
     * Try to link a Receipt to an existing Voucher
     * trigger: Import
     */
    public static function link_receipt($store_id, $receipt_id)
    {
        global $wpdb;
        $table_vouchers = $wpdb->prefix . 'svdp_vouchers';

        // Find a voucher that claims this receipt ID and isn't voided
        // Limit to 1 for MVP (first match)
        $voucher_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_vouchers 
             WHERE receipt_id = %s 
             AND status != 'Denied' 
             AND status != 'Void' 
             LIMIT 1",
            $receipt_id
        ));

        if ($voucher_id) {
            return self::create_link($voucher_id, $store_id, $receipt_id);
        }

        return false;
    }

    /**
     * Try to link a Voucher to an existing Receipt
     * trigger: Redemption
     */
    public static function link_voucher($voucher_id, $store_id, $receipt_id)
    {
        global $wpdb;
        $table_receipts = $wpdb->prefix . 'svdp_pos_receipts';

        // Check if receipt exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_receipts WHERE store_id = %d AND receipt_id = %s",
            $store_id,
            $receipt_id
        ));

        if ($exists) {
            return self::create_link($voucher_id, $store_id, $receipt_id);
        }

        return false;
    }

    /**
     * Get list of linked vouchers for reconciliation view
     */
    public static function get_linked_vouchers($limit = 20, $offset = 0)
    {
        global $wpdb;
        $table_links = $wpdb->prefix . 'svdp_voucher_receipt_links';
        $table_vouchers = $wpdb->prefix . 'svdp_vouchers';
        $table_receipts = $wpdb->prefix . 'svdp_pos_receipts';
        $table_conferences = $wpdb->prefix . 'svdp_conferences';

        // Select with joins
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT
                l.id as link_id,
                l.receipt_id as pos_receipt_id,
                v.id as voucher_id,
                v.first_name,
                v.last_name,
                v.voucher_created_date,
                v.redemption_total_value,
                v.receipt_id as cashier_receipt_id,
                r.gross_total as receipt_gross_total,
                r.receipt_datetime,
                c.name as conference_name
             FROM $table_links l
             JOIN $table_vouchers v ON l.voucher_id = v.id
             JOIN $table_receipts r ON (l.store_id = r.store_id AND l.receipt_id = r.receipt_id)
             LEFT JOIN $table_conferences c ON v.conference_id = c.id
             ORDER BY l.linked_at DESC
             LIMIT %d OFFSET %d",
            $limit,
            $offset
        ));

        // Get total count
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_links");

        return [
            'items' => $results,
            'total' => $count
        ];
    }

    /**
     * Get detailed comparison for a voucher
     */
    public static function get_comparison($voucher_id)
    {
        global $wpdb;
        $table_links = $wpdb->prefix . 'svdp_voucher_receipt_links';
        $table_snapshot = $wpdb->prefix . 'svdp_voucher_items'; // Authorized Items
        $table_pos_items = $wpdb->prefix . 'svdp_pos_receipt_items'; // Redeemed Items
        $table_vouchers = $wpdb->prefix . 'svdp_vouchers';
        $table_receipts = $wpdb->prefix . 'svdp_pos_receipts';

        // 1. Get Link Info
        $link = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_links WHERE voucher_id = %d",
            $voucher_id
        ));

        if (!$link) {
            return new WP_Error('not_linked', 'Voucher is not linked to a receipt');
        }

        // 2. Fetch Authorized Items (Snapshot)
        $authorized_items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_snapshot WHERE voucher_id = %d",
            $voucher_id
        ));

        // 3. Fetch Redeemed Items (POS)
        $redeemed_items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_pos_items WHERE store_id = %d AND receipt_id = %s",
            $link->store_id,
            $link->receipt_id
        ));

        // 4. Fetch Totals
        $voucher = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_vouchers WHERE id = %d", $voucher_id));
        $receipt = $wpdb->get_row($wpdb->prepare("SELECT gross_total FROM $table_receipts WHERE store_id = %d AND receipt_id = %s", $link->store_id, $link->receipt_id));

        // 5. Structure Data
        // Map redeemed items by Category or simply list them?
        // Logic: Return flat lists for UI side-by-side.
        // Ideal: Group by category if possible. POS categories might differ from ours.
        // Let's return raw lists for MVP UI rendering.

        return [
            'voucher_id' => $voucher_id,
            'receipt_id' => $link->receipt_id,
            'authorized_items' => $authorized_items,
            'redeemed_items' => $redeemed_items,
            'summary' => [
                'authorized_max_value' => $voucher->voucher_value, // This is total value limit
                'redeemed_gross_total' => $receipt->gross_total
            ]
        ];
    }

    /**
     * Get unmatched receipts
     */
    public static function get_unmatched_receipts($args = [])
    {
        global $wpdb;
        $table_receipts = $wpdb->prefix . 'svdp_pos_receipts';
        $table_links = $wpdb->prefix . 'svdp_voucher_receipt_links';

        $defaults = [
            'limit' => 20,
            'offset' => 0,
            'store_id' => '',
            'date_start' => '',
            'date_end' => '',
            'search' => ''
        ];
        $args = wp_parse_args($args, $defaults);

        $where = ["l.id IS NULL"];
        $params = [];

        if (!empty($args['store_id'])) {
            $where[] = "r.store_id = %d";
            $params[] = $args['store_id'];
        }

        if (!empty($args['date_start'])) {
            $where[] = "r.receipt_datetime >= %s";
            $params[] = $args['date_start'] . ' 00:00:00';
        }

        if (!empty($args['date_end'])) {
            $where[] = "r.receipt_datetime <= %s";
            $params[] = $args['date_end'] . ' 23:59:59';
        }

        if (!empty($args['search'])) {
            $where[] = "r.receipt_id LIKE %s";
            $params[] = '%' . $wpdb->esc_like($args['search']) . '%';
        }

        $where_sql = implode(' AND ', $where);

        // Base Query
        $query = "SELECT r.* 
                  FROM $table_receipts r
                  LEFT JOIN $table_links l ON (r.store_id = l.store_id AND r.receipt_id = l.receipt_id)
                  WHERE $where_sql
                  ORDER BY r.receipt_datetime DESC
                  LIMIT %d OFFSET %d";

        $params[] = $args['limit'];
        $params[] = $args['offset'];

        $results = $wpdb->get_results($wpdb->prepare($query, $params));

        // Count Query
        $count_query = "SELECT COUNT(*) 
                        FROM $table_receipts r
                        LEFT JOIN $table_links l ON (r.store_id = l.store_id AND r.receipt_id = l.receipt_id)
                        WHERE $where_sql";
        // Remove limit/offset params from count logic?
        // Actually, $params has limit/offset at the end. We need to slice them off or rebuild params.
        // Rebuild params for count.
        array_pop($params); // remove offset
        array_pop($params); // remove limit

        if (!empty($params)) {
            $total = $wpdb->get_var($wpdb->prepare($count_query, $params));
        } else {
            $total = $wpdb->get_var($count_query);
        }

        return [
            'items' => $results,
            'total' => $total
        ];
    }

    /**
     * Get Report Data
     * Aggregates metrics by Conference (or Daily if single conference selected)
     */
    public static function get_report_data($args = [])
    {
        global $wpdb;
        $table_vouchers = $wpdb->prefix . 'svdp_vouchers';
        $table_conferences = $wpdb->prefix . 'svdp_conferences';

        $defaults = [
            'date_start' => '',
            'date_end' => '',
            'conference_id' => ''
        ];
        $args = wp_parse_args($args, $defaults);

        $where = ["1=1"];
        $params = [];

        if (!empty($args['date_start'])) {
            $where[] = "v.created_at >= %s";
            $params[] = $args['date_start'] . ' 00:00:00';
        }

        if (!empty($args['date_end'])) {
            $where[] = "v.created_at <= %s";
            $params[] = $args['date_end'] . ' 23:59:59';
        }

        if (!empty($args['conference_id'])) {
            $where[] = "v.conference_id = %d";
            $params[] = $args['conference_id'];
            $group_by = "DATE(v.created_at)";
            $select_key = "DATE(v.created_at) as report_key, 'Daily' as report_label";
        } else {
            $group_by = "v.conference_id";
            $select_key = "c.name as report_key, c.name as report_label";
        }

        $where_sql = implode(' AND ', $where);

        // We need to join conferences for name if grouping by conference
        $join_sql = "LEFT JOIN $table_conferences c ON v.conference_id = c.id";

        $query = "SELECT 
                    $select_key,
                    COUNT(v.id) as total_issued,
                    SUM(CASE WHEN v.status = 'Redeemed' THEN 1 ELSE 0 END) as total_redeemed,
                    SUM(v.voucher_value) as total_authorized_amount,
                    SUM(COALESCE(v.conference_share, 0)) as total_conference_share,
                    SUM(COALESCE(v.store_share, 0)) as total_store_share
                  FROM $table_vouchers v
                  $join_sql
                  WHERE $where_sql
                  GROUP BY $group_by
                  ORDER BY report_key DESC";

        $results = $wpdb->get_results($wpdb->prepare($query, $params));

        // Calculate Totals for KPI cards
        $totals = [
            'issued' => 0,
            'redeemed' => 0,
            'authorized' => 0,
            'conference_liability' => 0,
            'store_liability' => 0
        ];

        foreach ($results as $row) {
            $totals['issued'] += $row->total_issued;
            $totals['redeemed'] += $row->total_redeemed;
            $totals['authorized'] += $row->total_authorized_amount;
            $totals['conference_liability'] += $row->total_conference_share;
            $totals['store_liability'] += $row->total_store_share;
        }

        return [
            'breakdown' => $results,
            'totals' => $totals
        ];
    }

    /**
     * Insert link record
     */
    private static function create_link($voucher_id, $store_id, $receipt_id)
    {
        global $wpdb;
        $table_links = $wpdb->prefix . 'svdp_voucher_receipt_links';

        // Perform insert (IGNORE to respect UNIQUE constraints)
        $result = $wpdb->query($wpdb->prepare(
            "INSERT IGNORE INTO $table_links (voucher_id, store_id, receipt_id) VALUES (%d, %d, %s)",
            $voucher_id,
            $store_id,
            $receipt_id
        ));

        // If linked, trigger billing verification/update (Future Story 5.2 / 7.1)
        if ($result) {
            // Placeholder: self::verify_billing($voucher_id, $store_id, $receipt_id);
            return true;
        }

        return false;
    }
}
