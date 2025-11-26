<?php
/**
 * Voucher management
 */
class SVDP_Voucher {
    
    /**
     * Get all vouchers with filters
     */
    public static function get_vouchers($request) {
        global $wpdb;
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';
        
        $today = date('Y-m-d');
        
        // Query with conference join
        $sql = "
            SELECT 
                v.*,
                c.name as conference_name
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.status IN ('Active', 'Redeemed')
            ORDER BY v.voucher_created_date DESC
        ";
        
        $items = $wpdb->get_results($sql);
        
        $vouchers = [];
        foreach ($items as $item) {
            // Calculate expiration
            $isExpired = false;
            if (!empty($item->voucher_created_date)) {
                $expirationDate = date('Y-m-d', strtotime($item->voucher_created_date . ' +30 days'));
                $isExpired = ($today > $expirationDate);
            }
            
            // Override status if expired
            $status = $item->status;
            if ($isExpired && $status === 'Active') {
                $status = 'Expired';
            }
            
            // Calculate coat eligibility
            $canIssueCoat = self::can_issue_coat($item->coat_issued_date);
            
            $vouchers[] = [
                'id' => $item->id,
                'name' => $item->first_name . ' ' . $item->last_name,
                'firstName' => $item->first_name,
                'lastName' => $item->last_name,
                'dob' => $item->dob,
                'adults' => intval($item->adults),
                'children' => intval($item->children),
                'conference' => $item->conference_name,
                'status' => $status,
                'voucherCreatedDate' => $item->voucher_created_date,
                'redeemedDate' => $item->redeemed_date,
                'isExpired' => $isExpired,
                'coatStatus' => $item->coat_status,
                'coatIssuedDate' => $item->coat_issued_date,
                'canIssueCoat' => $canIssueCoat,
            ];
        }
        
        return rest_ensure_response($vouchers);
    }
    
    /**
     * Check if coat can be issued (resets August 1st)
     */
    private static function can_issue_coat($coat_issued_date) {
        if (empty($coat_issued_date)) {
            return true;
        }
        
        // Calculate most recent August 1st
        $currentYear = date('Y');
        $currentMonth = date('n');
        $lastAugust1 = ($currentMonth >= 8) ? "$currentYear-08-01" : ($currentYear - 1) . "-08-01";
        
        // Can issue if coat was issued before last August 1st
        return ($coat_issued_date < $lastAugust1);
    }
    
    /**
     * Check for duplicate voucher
     */
    public static function check_duplicate($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';
        
        $first_name = sanitize_text_field($request['firstName']);
        $last_name = sanitize_text_field($request['lastName']);
        $dob = sanitize_text_field($request['dob']);
        $request_type = sanitize_text_field($request['requestType'] ?? 'Vincentian');
        
        $ninety_days_ago = date('Y-m-d', strtotime('-90 days'));
        
        // Find matching vouchers within 90 days
        $sql = $wpdb->prepare("
            SELECT 
                v.*,
                c.name as conference_name,
                c.is_emergency
            FROM $table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE 
                LOWER(v.first_name) = LOWER(%s)
                AND LOWER(v.last_name) = LOWER(%s)
                AND v.dob = %s
                AND v.voucher_created_date >= %s
            ORDER BY v.voucher_created_date DESC
            LIMIT 1
        ", $first_name, $last_name, $dob, $ninety_days_ago);
        
        $item = $wpdb->get_row($sql);
        
        if (!$item) {
            return rest_ensure_response(['found' => false]);
        }
        
        // Apply eligibility rules
        if ($request_type === 'Cashier') {
            // Cashier: Block if ANY voucher exists
            return rest_ensure_response([
                'found' => true,
                'voucherDate' => date('F j, Y', strtotime($item->voucher_created_date)),
                'eligibleDate' => date('F j, Y', strtotime($item->voucher_created_date . ' +90 days')),
                'conference' => $item->conference_name,
                'vincentianName' => $item->vincentian_name,
            ]);
        } else {
            // Vincentian: Only block if NOT Emergency voucher
            if (!$item->is_emergency) {
                return rest_ensure_response([
                    'found' => true,
                    'voucherDate' => date('F j, Y', strtotime($item->voucher_created_date)),
                    'eligibleDate' => date('F j, Y', strtotime($item->voucher_created_date . ' +90 days')),
                    'conference' => $item->conference_name,
                    'vincentianName' => $item->vincentian_name,
                ]);
            }
        }
        
        return rest_ensure_response(['found' => false]);
    }
    
    /**
     * Create voucher
     */
    public static function create_voucher($request) {
        $params = $request->get_json_params();
        
        $first_name = sanitize_text_field($params['firstName']);
        $last_name = sanitize_text_field($params['lastName']);
        $dob = sanitize_text_field($params['dob']);
        $adults = intval($params['adults']);
        $children = intval($params['children']);
        $conference = sanitize_text_field($params['conference']);
        $vincentian_name = isset($params['vincentianName']) ? sanitize_text_field($params['vincentianName']) : null;
        $vincentian_email = isset($params['vincentianEmail']) ? sanitize_email($params['vincentianEmail']) : null;
        $override_note = isset($params['overrideNote']) ? sanitize_text_field($params['overrideNote']) : null;
        
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';
        
        // Get conference by slug or name
        $conference_obj = SVDP_Conference::get_by_slug($conference);
        if (!$conference_obj) {
            $conference_obj = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}svdp_conferences WHERE name = %s",
                $conference
            ));
        }
        
        if (!$conference_obj) {
            return new WP_Error('invalid_conference', 'Conference not found');
        }
        
        // Calculate voucher value based on conference type
        $household_size = $adults + $children;
        if ($conference_obj->is_emergency) {
            // Emergency vouchers: $10 per person
            $voucher_value = $household_size * 10;
        } else {
            // Conference vouchers: $20 per person
            $voucher_value = $household_size * 20;
        }
        
        // Insert voucher
        $result = $wpdb->insert($table, [
            'first_name' => $first_name,
            'last_name' => $last_name,
            'dob' => $dob,
            'adults' => $adults,
            'children' => $children,
            'conference_id' => $conference_obj->id,
            'vincentian_name' => $vincentian_name,
            'vincentian_email' => $vincentian_email,
            'created_by' => $conference_obj->is_emergency ? 'Cashier' : 'Vincentian',
            'voucher_created_date' => current_time('Y-m-d'),
            'voucher_value' => $voucher_value,
            'override_note' => $override_note,
        ]);
        
        if ($result === false) {
            return new WP_Error('database_error', 'Failed to create voucher');
        }
        
        $voucher_id = $wpdb->insert_id;
        
        // Calculate next eligible date (90 days from today)
        $next_eligible = new DateTime();
        $next_eligible->modify('+90 days');
        
        // Calculate coat eligibility (next August 1st if after current August 1st)
        $coat_eligible_after = null;
        $today = new DateTime();
        $current_year = (int)$today->format('Y');
        $current_month = (int)$today->format('m');
        
        if ($current_month >= 8) {
            $next_august = new DateTime(($current_year + 1) . '-08-01');
        } else {
            $next_august = new DateTime($current_year . '-08-01');
        }
        $coat_eligible_after = $next_august->format('F j, Y');
        
        // Trigger Monday.com sync if enabled
        if (SVDP_Monday_Sync::is_enabled()) {
            SVDP_Monday_Sync::sync_voucher_to_monday($voucher_id);
        }
        
        // Send email notification to conference
        self::send_conference_notification($voucher_id);
        
        return [
            'success' => true,
            'voucher_id' => $voucher_id,
            'nextEligibleDate' => $next_eligible->format('F j, Y'),
            'coatEligibleAfter' => $coat_eligible_after,
        ];
    }
    
    /**
     * Update voucher status
     */
    public static function update_status($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';
        
        $id = intval($request['id']);
        $status = sanitize_text_field($request['status']);
        
        $update_data = ['status' => $status];
        
        if ($status === 'Redeemed') {
            $update_data['redeemed_date'] = date('Y-m-d');
        }
        
        $result = $wpdb->update($table, $update_data, ['id' => $id]);
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update status', ['status' => 500]);
        }
        
        // Sync to Monday.com if enabled
        if (get_option('svdp_vouchers_monday_sync_enabled')) {
            SVDP_Monday_Sync::sync_voucher_to_monday($id);
        }
        
        return rest_ensure_response(['success' => true]);
    }
    
    /**
     * Update coat status
     */
    public static function update_coat_status($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';
        
        $id = intval($request['id']);
        
        $update_data = [
            'coat_status' => 'Issued',
            'coat_issued_date' => date('Y-m-d'),
        ];
        
        $result = $wpdb->update($table, $update_data, ['id' => $id]);
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update coat status', ['status' => 500]);
        }
        
        // Sync to Monday.com if enabled
        if (get_option('svdp_vouchers_monday_sync_enabled')) {
            SVDP_Monday_Sync::sync_voucher_to_monday($id);
        }
        
        return rest_ensure_response(['success' => true]);
    }
}
