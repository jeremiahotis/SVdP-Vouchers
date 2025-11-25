<?php
/**
 * Monday.com sync functionality
 */
class SVDP_Monday_Sync {
    
    /**
     * Check if Monday sync is enabled
     */
    public static function is_enabled() {
        return get_option('svdp_vouchers_monday_sync_enabled', false);
    }
    
    /**
     * Get Monday.com API configuration
     */
    private static function get_config() {
        return [
            'api_key' => get_option('svdp_vouchers_monday_api_key'),
            'board_id' => get_option('svdp_vouchers_monday_board_id'),
            'api_url' => 'https://api.monday.com/v2',
        ];
    }
    
    /**
     * Call Monday.com API
     */
    private static function call_api($query) {
        $config = self::get_config();
        
        if (empty($config['api_key']) || empty($config['board_id'])) {
            return ['success' => false, 'error' => 'Monday.com not configured'];
        }
        
        $response = wp_remote_post($config['api_url'], [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => $config['api_key'],
            ],
            'body' => json_encode(['query' => $query]),
            'timeout' => 30,
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'error' => $response->get_error_message(),
            ];
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (isset($data['errors'])) {
            return [
                'success' => false,
                'error' => $data['errors'][0]['message'] ?? 'Unknown error',
            ];
        }
        
        return [
            'success' => true,
            'data' => $data,
        ];
    }
    
    /**
     * Sync voucher to Monday.com
     */
    public static function sync_voucher_to_monday($voucher_id) {
        if (!self::is_enabled()) {
            return false;
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';
        
        // Get voucher with conference
        $voucher = $wpdb->get_row($wpdb->prepare("
            SELECT v.*, c.name as conference_name, c.monday_label
            FROM $table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.id = %d
        ", $voucher_id));
        
        if (!$voucher) {
            return false;
        }
        
        // Get column IDs from settings
        $column_ids = json_decode(get_option('svdp_vouchers_monday_column_ids', '{}'), true);
        
        if (empty($column_ids)) {
            return false;
        }
        
        // If voucher already has monday_item_id, update it
        if (!empty($voucher->monday_item_id)) {
            return self::update_monday_item($voucher, $column_ids);
        } else {
            return self::create_monday_item($voucher, $column_ids);
        }
    }
    
    /**
     * Create item in Monday.com
     */
    private static function create_monday_item($voucher, $column_ids) {
        $config = self::get_config();
        
        // Use monday_label if set, otherwise use conference name
        $conference_label = !empty($voucher->monday_label) ? $voucher->monday_label : $voucher->conference_name;
        
        $column_values = [
            $column_ids['firstName'] => $voucher->first_name,
            $column_ids['lastName'] => $voucher->last_name,
            $column_ids['dob'] => ['date' => $voucher->dob],
            $column_ids['adults'] => intval($voucher->adults),
            $column_ids['children'] => intval($voucher->children),
            $column_ids['conference'] => ['label' => $conference_label],
            $column_ids['vincentianName'] => $voucher->vincentian_name ?? '',
            $column_ids['vincentianEmail'] => [
                'email' => $voucher->vincentian_email ?? '',
                'text' => $voucher->vincentian_name ?? ''
            ],
            $column_ids['createdBy'] => ['label' => $voucher->created_by],
            $column_ids['voucherCreatedDate'] => ['date' => $voucher->voucher_created_date],
            $column_ids['status'] => ['label' => $voucher->status],
        ];
        
        if (!empty($voucher->redeemed_date)) {
            $column_values[$column_ids['redeemedDate']] = ['date' => $voucher->redeemed_date];
        }
        
        if (!empty($voucher->override_note)) {
            $column_values[$column_ids['overrideNote']] = $voucher->override_note;
        }
        
        if (!empty($voucher->coat_status)) {
            $column_values[$column_ids['coatStatus']] = ['label' => $voucher->coat_status];
        }
        
        if (!empty($voucher->coat_issued_date)) {
            $column_values[$column_ids['coatIssuedDate']] = ['date' => $voucher->coat_issued_date];
        }
        
        $item_name = $voucher->first_name . ' ' . $voucher->last_name . ' - ' . $conference_label;
        $column_values_json = json_encode($column_values);
        $column_values_escaped = str_replace('"', '\\"', $column_values_json);
        
        $mutation = '
            mutation {
                create_item(
                    board_id: ' . $config['board_id'] . ',
                    item_name: "' . addslashes($item_name) . '",
                    column_values: "' . $column_values_escaped . '"
                ) {
                    id
                }
            }
        ';
        
        $result = self::call_api($mutation);
        
        if ($result['success']) {
            $monday_item_id = $result['data']['data']['create_item']['id'];
            
            // Save Monday item ID to voucher
            global $wpdb;
            $wpdb->update(
                $wpdb->prefix . 'svdp_vouchers',
                ['monday_item_id' => $monday_item_id],
                ['id' => $voucher->id]
            );
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Update item in Monday.com
     */
    private static function update_monday_item($voucher, $column_ids) {
        $config = self::get_config();
        
        $column_values = [
            $column_ids['status'] => ['label' => $voucher->status],
        ];
        
        if (!empty($voucher->redeemed_date)) {
            $column_values[$column_ids['redeemedDate']] = ['date' => $voucher->redeemed_date];
        }
        
        if (!empty($voucher->coat_status)) {
            $column_values[$column_ids['coatStatus']] = ['label' => $voucher->coat_status];
        }
        
        if (!empty($voucher->coat_issued_date)) {
            $column_values[$column_ids['coatIssuedDate']] = ['date' => $voucher->coat_issued_date];
        }
        
        $column_values_json = json_encode($column_values);
        $column_values_escaped = str_replace('"', '\\"', $column_values_json);
        
        $mutation = '
            mutation {
                change_multiple_column_values(
                    item_id: ' . intval($voucher->monday_item_id) . ',
                    board_id: ' . $config['board_id'] . ',
                    column_values: "' . $column_values_escaped . '"
                ) {
                    id
                }
            }
        ';
        
        $result = self::call_api($mutation);
        
        return $result['success'];
    }
    
    /**
     * Import vouchers from Monday.com (one-time sync)
     */
    public static function import_from_monday() {
        if (!self::is_enabled()) {
            return ['success' => false, 'error' => 'Monday sync not enabled'];
        }
        
        // This would implement importing existing vouchers from Monday
        // For now, we'll leave this as a placeholder
        
        return ['success' => true, 'message' => 'Import functionality coming soon'];
    }
}