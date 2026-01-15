<?php
/**
 * Voucher management
 */
class SVDP_Voucher
{

    /**
     * Normalize voucher types from request payload.
     */
    private static function normalize_voucher_types($params)
    {
        $types = [];

        if (isset($params['voucherTypes']) && is_array($params['voucherTypes'])) {
            $types = $params['voucherTypes'];
        } elseif (isset($params['voucherType'])) {
            $types = [$params['voucherType']];
        }

        $normalized = [];
        foreach ($types as $type) {
            $type = sanitize_key($type);
            if (!empty($type)) {
                $normalized[] = $type;
            }
        }

        return array_values(array_unique($normalized));
    }

    /**
     * Reject coat voucher types for request flow.
     */
    private static function validate_no_coat_types($types)
    {
        foreach ($types as $type) {
            if ($type === 'coat' || $type === 'coats') {
                return new WP_Error('invalid_voucher_type', 'Coats can only be issued at the cashier station');
            }
        }

        return true;
    }

    /**
     * Build SQL clause for matching any voucher type in a CSV column.
     */
    private static function build_voucher_type_clause($types, $wpdb)
    {
        $clauses = [];
        foreach ($types as $type) {
            $clauses[] = $wpdb->prepare("FIND_IN_SET(%s, v.voucher_type)", $type);
        }

        return implode(' OR ', $clauses);
    }

    /**
     * Normalize catalog items from request payload.
     */
    private static function normalize_catalog_items($params)
    {
        if (!isset($params['catalogItems']) || !is_array($params['catalogItems'])) {
            return [];
        }

        $items = [];
        foreach ($params['catalogItems'] as $item) {
            if (!is_array($item)) {
                continue;
            }

            $type = isset($item['type']) ? sanitize_key($item['type']) : '';
            $id = isset($item['id']) ? intval($item['id']) : 0;
            $qty = isset($item['quantity']) ? intval($item['quantity']) : 0;

            if ($type && $id > 0 && $qty > 0) {
                $items[] = [
                    'type' => $type,
                    'id' => $id,
                    'quantity' => $qty,
                ];
            }
        }

        return $items;
    }

    /**
     * Validate catalog items for furniture/household vouchers.
     */
    private static function validate_catalog_items($voucher_types, $catalog_items)
    {
        $needs_catalog = array_intersect(['furniture', 'household'], $voucher_types);
        if (empty($needs_catalog)) {
            return true;
        }

        if (empty($catalog_items)) {
            return new WP_Error('missing_catalog_items', 'Select at least one catalog item for furniture or household vouchers');
        }

        $valid_types = ['furniture', 'household'];
        foreach ($catalog_items as $item) {
            if (!in_array($item['type'], $valid_types, true)) {
                return new WP_Error('invalid_catalog_item', 'Catalog item type is invalid');
            }

            $catalog_item = SVDP_Catalog::get_item($item['type'], $item['id']);
            if (!$catalog_item) {
                return new WP_Error('invalid_catalog_item', 'Catalog item not found');
            }
        }

        return true;
    }

    /**
     * Get all vouchers with coat information
     */
    public static function get_vouchers($request)
    {
        global $wpdb;
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';

        $results = $wpdb->get_results("
            SELECT 
                v.*,
                c.name as conference_name
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.status != 'Denied'
            ORDER BY v.voucher_created_date DESC
        ");

        if (!$results) {
            return [];
        }

        $vouchers = [];
        foreach ($results as $voucher) {
            // Calculate expiration (30 days from creation)
            $created = new DateTime($voucher->voucher_created_date);
            $expiration = clone $created;
            $expiration->modify('+30 days');
            $today = new DateTime();

            $is_expired = ($today > $expiration && $voucher->status === 'Active');

            // Calculate coat eligibility (resets August 1st)
            $coat_eligible = true;
            $coat_eligible_after = null;

            if (!empty($voucher->coat_issued_date)) {
                // can_issue_coat returns true if we CAN issue (past Aug 1 reset)
                $coat_eligible = self::can_issue_coat($voucher->coat_issued_date);
                if (!$coat_eligible) {
                    // Calculate next August 1st
                    $next_august = new DateTime();
                    $current_month = (int) $next_august->format('m');

                    // If we're before August, next eligible is this year's Aug 1
                    // If we're in/after August, next eligible is next year's Aug 1
                    if ($current_month >= 8) {
                        $next_august->modify('+1 year');
                    }
                    $next_august->setDate((int) $next_august->format('Y'), 8, 1);
                    $coat_eligible_after = $next_august->format('Y-m-d');
                }
            }

            $vouchers[] = [
                'id' => $voucher->id,
                'first_name' => $voucher->first_name,
                'last_name' => $voucher->last_name,
                'dob' => $voucher->dob,
                'adults' => $voucher->adults,
                'children' => $voucher->children,
                'voucher_value' => $voucher->voucher_value,
                'voucher_type' => $voucher->voucher_type ?? 'clothing',
                'voucher_items_count' => $voucher->voucher_items_count ?? 0,
                'conference_name' => $voucher->conference_name,
                'vincentian_name' => $voucher->vincentian_name,
                'vincentian_email' => $voucher->vincentian_email,
                'created_by' => $voucher->created_by,
                'voucher_created_date' => $voucher->voucher_created_date,
                'status' => $is_expired ? 'Expired' : $voucher->status,
                'redeemed_date' => $voucher->redeemed_date,
                'override_note' => $voucher->override_note,
                'coat_status' => $voucher->coat_status,
                'coat_issued_date' => $voucher->coat_issued_date,
                'coat_adults_issued' => $voucher->coat_adults_issued ?? null,
                'coat_children_issued' => $voucher->coat_children_issued ?? null,
                'coat_eligible' => $coat_eligible,
                'coat_eligible_after' => $coat_eligible_after,
            ];
        }

        return $vouchers;
    }

    /**
     * Check if coat can be issued (resets August 1st)
     */
    private static function can_issue_coat($coat_issued_date)
    {
        if (empty($coat_issued_date)) {
            return true;
        }

        // Get most recent August 1st
        $today = new DateTime();
        $current_year = (int) $today->format('Y');
        $current_month = (int) $today->format('m');

        // If we're before August, use last year's August 1st
        if ($current_month < 8) {
            $reset_date = new DateTime(($current_year - 1) . '-08-01');
        } else {
            $reset_date = new DateTime($current_year . '-08-01');
        }

        $issued_date = new DateTime($coat_issued_date);

        // Can issue if the coat was issued before the most recent August 1st
        return $issued_date < $reset_date;
    }

    /**
     * Check for duplicate or similar voucher
     */
    public static function check_duplicate($request)
    {
        $params = $request->get_json_params();

        $first_name = sanitize_text_field($params['firstName']);
        $last_name = sanitize_text_field($params['lastName']);
        $dob = sanitize_text_field($params['dob']);
        $created_by = sanitize_text_field($params['createdBy']);
        $voucher_types = self::normalize_voucher_types($params);
        $conference_slug = isset($params['conference']) ? sanitize_text_field($params['conference']) : '';

        global $wpdb;
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';

        // Get requesting organization's eligibility window
        $requesting_org = null;
        if (!empty($conference_slug)) {
            $requesting_org = SVDP_Conference::get_by_slug($conference_slug);
        }
        $eligibility_days = ($requesting_org && isset($requesting_org->eligibility_days))
            ? intval($requesting_org->eligibility_days)
            : 90; // Default to 90 days

        // Calculate cutoff date based on organization's eligibility window
        $eligibility_cutoff = date('Y-m-d', strtotime("-{$eligibility_days} days"));

        // Build base query based on created_by
        $conference_filter = ($created_by === 'Cashier') ? '' : 'AND c.is_emergency = 0';

        if (empty($voucher_types)) {
            return new WP_Error('invalid_voucher_types', 'Voucher types are required');
        }

        $coat_check = self::validate_no_coat_types($voucher_types);
        if (is_wp_error($coat_check)) {
            return $coat_check;
        }

        $type_sql = self::build_voucher_type_clause($voucher_types, $wpdb);

        // STEP 1: Check for EXACT match (including voucher_type overlap)
        $exact_query = $wpdb->prepare("
            SELECT v.*, c.name as conference_name
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.first_name = %s
            AND v.last_name = %s
            AND v.dob = %s
            AND ($type_sql)
            AND v.voucher_created_date >= %s
            $conference_filter
            ORDER BY v.voucher_created_date DESC
            LIMIT 1
        ", $first_name, $last_name, $dob, $eligibility_cutoff);

        $exact_match = $wpdb->get_row($exact_query);

        if ($exact_match) {
            // Calculate next eligible date using organization's eligibility window
            $voucher_date = new DateTime($exact_match->voucher_created_date);
            $next_eligible = clone $voucher_date;
            $next_eligible->modify("+{$eligibility_days} days");

            return [
                'matchType' => 'exact',
                'found' => true,
                'firstName' => $exact_match->first_name,
                'lastName' => $exact_match->last_name,
                'dob' => $exact_match->dob,
                'conference' => $exact_match->conference_name,
                'voucherCreatedDate' => $exact_match->voucher_created_date,
                'vincentianName' => $exact_match->vincentian_name,
                'nextEligibleDate' => $next_eligible->format('Y-m-d'),
            ];
        }

        // STEP 2: Check for SIMILAR names (if no exact match, same voucher_type overlap)
        // Using SOUNDEX for phonetic matching and checking same DOB
        $similar_query = $wpdb->prepare(
            "
            SELECT v.*, c.name as conference_name,
                   (SOUNDEX(v.first_name) = SOUNDEX(%s)) as first_soundex_match,
                   (SOUNDEX(v.last_name) = SOUNDEX(%s)) as last_soundex_match
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.dob = %s
            AND ($type_sql)
            AND v.voucher_created_date >= %s
            AND (
                SOUNDEX(v.first_name) = SOUNDEX(%s)
                OR SOUNDEX(v.last_name) = SOUNDEX(%s)
                OR v.first_name LIKE %s
                OR v.last_name LIKE %s
            )
            $conference_filter
            ORDER BY v.voucher_created_date DESC
            LIMIT 5
        ",
            $first_name,
            $last_name,
            $dob,
            $eligibility_cutoff,
            $first_name,
            $last_name,
            '%' . $wpdb->esc_like(substr($first_name, 0, 3)) . '%',
            '%' . $wpdb->esc_like(substr($last_name, 0, 3)) . '%'
        );

        $similar_matches = $wpdb->get_results($similar_query);

        if ($similar_matches && count($similar_matches) > 0) {
            // Format similar matches
            $matches = [];
            foreach ($similar_matches as $match) {
                $voucher_date = new DateTime($match->voucher_created_date);
                $next_eligible = clone $voucher_date;
                $next_eligible->modify("+{$eligibility_days} days");

                $matches[] = [
                    'firstName' => $match->first_name,
                    'lastName' => $match->last_name,
                    'dob' => $match->dob,
                    'conference' => $match->conference_name,
                    'voucherCreatedDate' => $match->voucher_created_date,
                    'vincentianName' => $match->vincentian_name,
                    'nextEligibleDate' => $next_eligible->format('Y-m-d'),
                ];
            }

            return [
                'matchType' => 'similar',
                'found' => true,
                'matches' => $matches,
            ];
        }

        return ['found' => false];
    }

    /**
     * Create voucher
     */
    public static function create_voucher($request)
    {
        $params = $request->get_json_params();

        $first_name = sanitize_text_field($params['firstName']);
        $last_name = sanitize_text_field($params['lastName']);
        $dob = sanitize_text_field($params['dob']);
        $adults = intval($params['adults']);
        $children = intval($params['children']);
        $conference = sanitize_text_field($params['conference']);
        $vincentian_name = isset($params['vincentianName']) ? sanitize_text_field($params['vincentianName']) : null;
        $vincentian_email = isset($params['vincentianEmail']) ? sanitize_email($params['vincentianEmail']) : null;
        $voucher_types = self::normalize_voucher_types($params);
        $catalog_items = self::normalize_catalog_items($params);

        // Extract new override fields
        $manager_id = isset($params['manager_id']) ? intval($params['manager_id']) : null;
        $reason_id = isset($params['reason_id']) ? intval($params['reason_id']) : null;

        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';

        // Build override note if manager override
        $override_note = null;
        if ($manager_id && $reason_id) {
            $manager_table = $wpdb->prefix . 'svdp_managers';
            $reason_table = $wpdb->prefix . 'svdp_override_reasons';

            $manager = $wpdb->get_row($wpdb->prepare(
                "SELECT name FROM $manager_table WHERE id = %d",
                $manager_id
            ));

            $reason = $wpdb->get_row($wpdb->prepare(
                "SELECT reason_text FROM $reason_table WHERE id = %d",
                $reason_id
            ));

            if ($manager && $reason) {
                $override_note = sprintf(
                    'Approved by %s - Reason: %s - %s',
                    $manager->name,
                    $reason->reason_text,
                    current_time('Y-m-d H:i:s')
                );
            }
        }

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

        $store_id = SVDP_Conference::get_default_store_id();
        if (empty($store_id)) {
            return new WP_Error('missing_store', 'Default store is not configured');
        }

        if (empty($voucher_types)) {
            return new WP_Error('invalid_voucher_types', 'Voucher types are required');
        }

        $coat_check = self::validate_no_coat_types($voucher_types);
        if (is_wp_error($coat_check)) {
            return $coat_check;
        }

        $catalog_check = self::validate_catalog_items($voucher_types, $catalog_items);
        if (is_wp_error($catalog_check)) {
            return $catalog_check;
        }

        // Validate voucher types against organization's allowed types
        $allowed_types = !empty($conference_obj->allowed_voucher_types)
            ? json_decode($conference_obj->allowed_voucher_types, true)
            : ['clothing'];

        foreach ($voucher_types as $type) {
            if (!in_array($type, $allowed_types)) {
                return new WP_Error(
                    'invalid_voucher_type',
                    'This organization does not offer ' . ucfirst($type) . ' vouchers. Allowed types: ' . implode(', ', array_map('ucfirst', $allowed_types))
                );
            }
        }

        $voucher_type = implode(',', $voucher_types);

        if (empty($voucher_type)) {
            return new WP_Error(
                'invalid_voucher_type',
                'Voucher types are required'
            );
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

        // Calculate items count based on conference type
        $items_per_person = $conference_obj->is_emergency
            ? ($conference_obj->emergency_items_per_person ?? 3)
            : ($conference_obj->regular_items_per_person ?? 7);
        $voucher_items_count = $household_size * $items_per_person;

        // Insert voucher
        $result = $wpdb->insert($table, [
            'first_name' => $first_name,
            'last_name' => $last_name,
            'dob' => $dob,
            'adults' => $adults,
            'children' => $children,
            'conference_id' => $conference_obj->id,
            'store_id' => $store_id,
            'vincentian_name' => $vincentian_name,
            'vincentian_email' => $vincentian_email,
            'created_by' => $conference_obj->is_emergency ? 'Cashier' : 'Vincentian',
            'voucher_created_date' => current_time('Y-m-d'),
            'voucher_value' => $voucher_value,
            'voucher_type' => $voucher_type,
            'voucher_items_count' => $voucher_items_count,
            'override_note' => $override_note,
            'manager_id' => $manager_id,
            'reason_id' => $reason_id,
        ]);

        if ($result === false) {
            return new WP_Error('database_error', 'Failed to create voucher');
        }

        $voucher_id = $wpdb->insert_id;

        // Log override event if manager approval was used
        if ($manager_id && $reason_id) {
            $cashier_user_id = get_current_user_id();
            SVDP_Audit::log_override(
                $voucher_id,
                $manager_id,
                $reason_id,
                $cashier_user_id,
                'duplicate_voucher',
                $override_note
            );
        }

        // Calculate next eligible date (90 days from today)
        $next_eligible = new DateTime();
        $next_eligible->modify('+90 days');

        // Calculate coat eligibility (next August 1st if after current August 1st)
        $coat_eligible_after = null;
        $today = new DateTime();
        $current_year = (int) $today->format('Y');
        $current_month = (int) $today->format('m');

        if ($current_month >= 8) {
            $next_august = new DateTime(($current_year + 1) . '-08-01');
        } else {
            $next_august = new DateTime($current_year . '-08-01');
        }
        $coat_eligible_after = $next_august->format('F j, Y');

        // Send email notification to conference
        self::send_conference_notification($voucher_id);

        // SNAPSHOT: Insert voucher items with immutable details
        if (!empty($catalog_items)) {
            $items_table = $wpdb->prefix . 'svdp_voucher_items';

            // Get store for woodshop paused state
            $store = SVDP_Conference::get_by_id($store_id);
            $store_paused = ($store && intval($store->woodshop_paused) === 1);

            foreach ($catalog_items as $item) {
                // Look up current catalog details
                $catalog_item = SVDP_Catalog::get_item($item['type'], $item['id']);

                if ($catalog_item) {
                    $is_woodshop = intval($catalog_item->is_woodshop) === 1;

                    // Determine paused state for this specific item at this moment
                    $item_paused = $is_woodshop ? $store_paused : 0;

                    $wpdb->insert($items_table, [
                        'voucher_id' => $voucher_id,
                        'catalog_item_id' => $catalog_item->id,
                        'item_type' => $item['type'],
                        'item_name' => $catalog_item->name,
                        'item_category' => $catalog_item->category,
                        'item_price_min' => $catalog_item->min_price,
                        'item_price_max' => $catalog_item->max_price,
                        'is_woodshop' => $is_woodshop ? 1 : 0,
                        'is_woodshop_paused' => $item_paused ? 1 : 0,
                        'quantity' => $item['quantity'],
                        'created_at' => current_time('mysql'),
                        'items_redeemed' => 0
                    ]);

                    if ($wpdb->last_error) {
                        error_log('SVDP DEBUG: Snapshot Insert Error: ' . $wpdb->last_error);
                    } else {
                        error_log("SVDP DEBUG: Snapshot inserted for Item ID {$catalog_item->id}");
                    }
                }
            }
        }


        return [
            'success' => true,
            'voucher_id' => $voucher_id,
            'nextEligibleDate' => $next_eligible->format('F j, Y'),
            'coatEligibleAfter' => $coat_eligible_after,
        ];
    }

    /**
     * Create a denied voucher record for tracking
     */
    public static function create_denied_voucher($request)
    {
        $params = $request->get_json_params();

        $first_name = sanitize_text_field($params['firstName']);
        $last_name = sanitize_text_field($params['lastName']);
        $dob = sanitize_text_field($params['dob']);
        $adults = intval($params['adults']);
        $children = intval($params['children']);
        $conference = sanitize_text_field($params['conference']);
        $vincentian_name = isset($params['vincentianName']) ? sanitize_text_field($params['vincentianName']) : null;
        $vincentian_email = isset($params['vincentianEmail']) ? sanitize_email($params['vincentianEmail']) : null;
        $denial_reason = sanitize_text_field($params['denialReason']);
        $created_by = isset($params['createdBy']) ? sanitize_text_field($params['createdBy']) : 'Vincentian';

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

        $store_id = SVDP_Conference::get_default_store_id();
        if (empty($store_id)) {
            return new WP_Error('missing_store', 'Default store is not configured');
        }

        // Calculate voucher value based on conference type
        $household_size = $adults + $children;
        if ($conference_obj->is_emergency) {
            $voucher_value = $household_size * 10;
        } else {
            $voucher_value = $household_size * 20;
        }

        // Insert denied voucher
        $result = $wpdb->insert($table, [
            'first_name' => $first_name,
            'last_name' => $last_name,
            'dob' => $dob,
            'adults' => $adults,
            'children' => $children,
            'conference_id' => $conference_obj->id,
            'store_id' => $store_id,
            'vincentian_name' => $vincentian_name,
            'vincentian_email' => $vincentian_email,
            'created_by' => $created_by,
            'voucher_created_date' => current_time('Y-m-d'),
            'voucher_value' => $voucher_value,
            'status' => 'Denied',
            'denial_reason' => $denial_reason,
        ]);

        if ($result === false) {
            return new WP_Error('database_error', 'Failed to create denied voucher record');
        }

        $voucher_id = $wpdb->insert_id;

        return [
            'success' => true,
            'voucher_id' => $voucher_id,
            'message' => 'Denied voucher recorded for tracking',
        ];
    }

    /**
     * Update voucher status
     */
    public static function update_status($request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';

        $id = intval($request['id']);
        $params = $request->get_json_params();
        $status = sanitize_text_field($params['status']);
        $receipt_id = isset($params['receipt_id']) ? sanitize_text_field($params['receipt_id']) : null;
        $gross_total = isset($params['gross_total']) ? floatval($params['gross_total']) : 0.00;

        $update_data = ['status' => $status];

        if ($status === 'Redeemed') {
            $update_data['redeemed_date'] = date('Y-m-d');

            // Get item counts if provided
            $items_adult = isset($params['items_adult']) ? intval($params['items_adult']) : 0;
            $items_children = isset($params['items_children']) ? intval($params['items_children']) : 0;

            // Calculate redemption value
            $item_values = SVDP_Settings::get_item_values();
            $redemption_value = ($items_adult * $item_values['adult']) + ($items_children * $item_values['child']);

            // Store redemption data
            $update_data['items_adult_redeemed'] = $items_adult;
            $update_data['items_children_redeemed'] = $items_children;
            $update_data['redemption_total_value'] = $redemption_value;

            // Store receipt data if provided
            if ($receipt_id) {
                $update_data['receipt_id'] = $receipt_id;
            }
            if ($gross_total > 0) {
                $update_data['gross_total'] = $gross_total;
            }

            // Ensure store_id is set for redeemed vouchers.
            $store_id = SVDP_Conference::get_default_store_id();
            if (!empty($store_id)) {
                $current_store = $wpdb->get_var($wpdb->prepare(
                    "SELECT store_id FROM $table WHERE id = %d",
                    $id
                ));
                if (empty($current_store)) {
                    $update_data['store_id'] = $store_id;
                }
            }
        }

        $result = $wpdb->update($table, $update_data, ['id' => $id]);

        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update status', ['status' => 500]);
        }

        // Trigger Linking if Redeemed
        if ($status === 'Redeemed' && !empty($receipt_id)) {
            // Determine store_id
            $final_store_id = isset($update_data['store_id']) ? $update_data['store_id'] : 0;
            if (!$final_store_id) {
                $final_store_id = $wpdb->get_var($wpdb->prepare("SELECT store_id FROM $table WHERE id = %d", $id));
            }

            if ($final_store_id) {
                SVDP_Reconciliation::link_voucher($id, $final_store_id, $receipt_id);
            }
        }

        return rest_ensure_response([
            'success' => true,
            'redemption_value' => isset($redemption_value) ? number_format($redemption_value, 2) : null
        ]);
    }

    /**
     * Update coat status with household counts
     */
    public static function update_coat_status($request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'svdp_vouchers';

        // ID comes from URL path, adults/children from JSON body
        $id = intval($request['id']);
        $params = $request->get_json_params();
        $adults = intval($params['adults']);
        $children = intval($params['children']);

        // Validate that at least one coat is being issued
        if ($adults < 0 || $children < 0) {
            return new WP_Error('invalid_input', 'Invalid coat counts', ['status' => 400]);
        }

        if ($adults === 0 && $children === 0) {
            return new WP_Error('invalid_input', 'Must issue at least one coat', ['status' => 400]);
        }

        // Check coat eligibility before allowing issuance
        $voucher = $wpdb->get_row($wpdb->prepare(
            "SELECT coat_issued_date FROM $table WHERE id = %d",
            $id
        ));

        if ($voucher && !empty($voucher->coat_issued_date)) {
            // Check if coat can be issued based on August 1st reset
            if (!self::can_issue_coat($voucher->coat_issued_date)) {
                // Calculate next eligible date
                $today = new DateTime();
                $current_month = (int) $today->format('m');
                $next_august = new DateTime();

                if ($current_month >= 8) {
                    $next_august->modify('+1 year');
                }
                $next_august->setDate((int) $next_august->format('Y'), 8, 1);

                return new WP_Error(
                    'coat_not_eligible',
                    'This household already received a coat this season. Next eligible date: ' . $next_august->format('F j, Y'),
                    ['status' => 403]
                );
            }
        }

        $update_data = [
            'coat_status' => 'Issued',
            'coat_issued_date' => current_time('Y-m-d'),
            'coat_issued_at' => current_time('mysql'),
            'coat_issued_by' => get_current_user_id(),
            'coat_adults_issued' => $adults,
            'coat_children_issued' => $children,
        ];

        $result = $wpdb->update($table, $update_data, ['id' => $id]);

        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update coat status', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'adults' => $adults,
            'children' => $children,
            'total' => $adults + $children
        ]);
    }

    /**
     * Send notification email to conference
     */
    private static function send_conference_notification($voucher_id)
    {
        global $wpdb;
        $vouchers_table = $wpdb->prefix . 'svdp_vouchers';
        $conferences_table = $wpdb->prefix . 'svdp_conferences';

        // Get voucher with conference info
        $voucher = $wpdb->get_row($wpdb->prepare("
            SELECT v.*, c.name as conference_name, c.notification_email
            FROM $vouchers_table v
            LEFT JOIN $conferences_table c ON v.conference_id = c.id
            WHERE v.id = %d
        ", $voucher_id));

        if (!$voucher || empty($voucher->notification_email)) {
            return; // No email configured for this conference
        }

        // Skip email for Emergency conference (cashier station)
        if (empty($voucher->vincentian_name) || empty($voucher->vincentian_email)) {
            return;
        }

        // Calculate expiration date (30 days from creation)
        $created = new DateTime($voucher->voucher_created_date);
        $expires = clone $created;
        $expires->modify('+30 days');

        // Build email
        $to = $voucher->notification_email;
        $subject = 'New Voucher Created - ' . $voucher->first_name . ' ' . $voucher->last_name;

        $household_size = intval($voucher->adults) + intval($voucher->children);
        $voucher_amount = floatval($voucher->voucher_value);

        $message = self::get_email_template($voucher, $created, $expires, $household_size, $voucher_amount);

        // Email headers
        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_bloginfo('admin_email') . '>',
        ];

        // Send email
        wp_mail($to, $subject, $message, $headers);
    }

    /**
     * Generate email template
     */
    private static function get_email_template($voucher, $created, $expires, $household_size, $voucher_amount)
    {
        ob_start();
        ?>
        <!DOCTYPE html>
        <html>

        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }

                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .header {
                    background: #006BA8;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }

                .content {
                    background: #f9f9f9;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-top: none;
                }

                .info-box {
                    background: white;
                    padding: 15px;
                    margin: 15px 0;
                    border-left: 4px solid #006BA8;
                }

                .label {
                    font-weight: bold;
                    color: #006BA8;
                }

                .footer {
                    background: #f0f0f0;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-radius: 0 0 5px 5px;
                }

                .highlight {
                    background: #fff3cd;
                    padding: 10px;
                    border-left: 4px solid #ffc107;
                    margin: 15px 0;
                }
            </style>
        </head>

        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">New Voucher Created</h2>
                    <p style="margin: 5px 0 0 0;"><?php echo esc_html($voucher->conference_name); ?></p>
                </div>

                <div class="content">
                    <p>A new virtual clothing voucher has been created for your conference.</p>

                    <div class="info-box">
                        <p><span class="label">Neighbor:</span>
                            <?php echo esc_html($voucher->first_name . ' ' . $voucher->last_name); ?></p>
                        <p><span class="label">Date of Birth:</span> <?php echo esc_html($voucher->dob); ?></p>
                        <p><span class="label">Household Size:</span> <?php echo esc_html($household_size); ?>
                            (<?php echo esc_html($voucher->adults); ?> adults, <?php echo esc_html($voucher->children); ?>
                            children)</p>
                        <p><span class="label">Voucher Amount:</span> $<?php echo esc_html($voucher_amount); ?></p>
                    </div>

                    <div class="info-box">
                        <p><span class="label">Created:</span> <?php echo $created->format('l, F j, Y \a\t g:i A'); ?></p>
                        <p><span class="label">Expires:</span> <?php echo $expires->format('l, F j, Y'); ?></p>
                    </div>

                    <div class="highlight">
                        <p style="margin: 0;"><strong>⏱️ Reminder:</strong> This voucher is valid for 30 days and must be used
                            before the expiration date.</p>
                    </div>

                    <div class="info-box">
                        <p><span class="label">Created By:</span> <?php echo esc_html($voucher->vincentian_name); ?></p>
                        <p><span class="label">Vincentian Email:</span> <a
                                href="mailto:<?php echo esc_attr($voucher->vincentian_email); ?>"><?php echo esc_html($voucher->vincentian_email); ?></a>
                        </p>
                    </div>

                    <p><strong>What the Neighbor needs to know:</strong></p>
                    <ul>
                        <li>Thrift Store hours: 9:30 AM – 4:00 PM</li>
                        <li>Stop by Customer Service before shopping</li>
                        <li>Voucher expires in 30 days</li>
                    </ul>
                </div>

                <div class="footer">
                    <p>This is an automated notification from the SVdP Virtual Voucher System.</p>
                    <p>For questions, please contact the Vincentian listed above.</p>
                </div>
            </div>
        </body>

        </html>
        <?php
        return ob_get_clean();
    }
}
