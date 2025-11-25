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
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';
        
        $data = [
            'first_name' => sanitize_text_field($request['firstName']),
            'last_name' => sanitize_text_field($request['lastName']),
            'dob' => sanitize_text_field($request['dob']),
            'adults' => intval($request['adults']),
            'children' => intval($request['children']),
            'vincentian_name' => sanitize_text_field($request['vincentianName'] ?? ''),
            'vincentian_email' => sanitize_email($request['vincentianEmail'] ?? ''),
            'created_by' => sanitize_text_field($request['createdBy']),
            'voucher_created_date' => date('Y-m-d'),
            'status' => 'Active',
            'override_note' => sanitize_textarea_field($request['overrideNote'] ?? ''),
        ];
        
        // Get conference ID
        $conference_slug = sanitize_text_field($request['conference']);
        $conference = SVDP_Conference::get_by_slug($conference_slug);
        
        if (!$conference) {
            // Try by name as fallback
            $conferences = SVDP_Conference::get_all(false);
            foreach ($conferences as $conf) {
                if ($conf->name === $conference_slug) {
                    $conference = $conf;
                    break;
                }
            }
        }
        
        if (!$conference) {
            return new WP_Error('invalid_conference', 'Conference not found', ['status' => 400]);
        }
        
        $data['conference_id'] = $conference->id;
        
        // Insert voucher
        $result = $wpdb->insert($table, $data);
        
        if (!$result) {
            return new WP_Error('insert_failed', 'Failed to create voucher', ['status' => 500]);
        }
        
        $voucher_id = $wpdb->insert_id;
        
        // Sync to Monday.com if enabled
        if (get_option('svdp_vouchers_monday_sync_enabled')) {
            SVDP_Monday_Sync::sync_voucher_to_monday($voucher_id);
        }
        
        return rest_ensure_response([
            'success' => true,
            'itemId' => $voucher_id,
            'validUntil' => date('F j, Y', strtotime('+30 days')),
            'eligibleAgain' => date('F j, Y', strtotime('+90 days')),
        ]);
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
